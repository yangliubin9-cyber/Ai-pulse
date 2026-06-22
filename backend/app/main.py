"""FastAPI application entrypoint: lifespan, middleware, routers, probes."""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.healthz import router as healthz_router
from app.api.v1.router import api_router
from app.cache import close_cache, get_cache, init_cache
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.core.observability import RequestIdMiddleware, metrics_response
from app.db import dispose_engine, get_engine, get_sessionmaker, init_engine
from app.models.base import Base
from app.services.database.base import get_database_adapter

# Configure structured logging before anything else uses a logger.
configure_logging(get_settings().LOG_LEVEL)
logger = structlog.get_logger(__name__)

_DB_CONNECT_RETRIES = 10
_DB_CONNECT_BACKOFF = 1.5


async def _wait_for_db(settings) -> None:
    """Retry DB connectivity with backoff; raise after exhausting retries."""
    adapter = get_database_adapter(settings)
    engine = get_engine()
    last_exc: Exception | None = None
    for attempt in range(1, _DB_CONNECT_RETRIES + 1):
        try:
            async with engine.connect() as conn:
                await adapter.startup_check(conn)
            return
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            wait = _DB_CONNECT_BACKOFF * attempt
            logger.warning("db_not_ready", attempt=attempt, error=str(exc), retry_in=wait)
            await asyncio.sleep(wait)
    raise RuntimeError(f"Database unreachable after {_DB_CONNECT_RETRIES} attempts: {last_exc}")


async def _create_tables_if_missing() -> None:
    """Dev convenience: create_all (alembic owns schema in prod)."""
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.warning("schema_create_all_ran", note="dev convenience; use alembic in prod")


async def _ingest_loop(app: FastAPI, interval_minutes: int) -> None:
    """Background loop: ingest once on start, then every interval_minutes."""
    from app.usecases.ingest_usecase import IngestUsecase

    sessionmaker = get_sessionmaker()
    while True:
        try:
            async with sessionmaker() as session:
                result = await IngestUsecase(session).run(trigger="scheduled")
            logger.info("scheduled_ingest_ok", **result)
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001
            logger.error("scheduled_ingest_failed", error=str(exc))
        await asyncio.sleep(interval_minutes * 60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.started = False

    init_engine(settings)
    init_cache(settings)

    await _wait_for_db(settings)
    await _create_tables_if_missing()

    # Seed default admin (single-user private deployment).
    from app.usecases.auth_usecase import AuthUsecase

    sessionmaker = get_sessionmaker()
    async with sessionmaker() as session:
        seeded = await AuthUsecase(session, get_cache()).seed_default_admin()
    if seeded:
        logger.warning(
            "default_admin_seeded",
            note="change the default admin password immediately",
        )

    if settings.INGEST_ON_STARTUP:
        app.state.ingest_task = asyncio.create_task(
            _ingest_loop(app, settings.INGEST_INTERVAL_MINUTES)
        )

    logger.info("effective_config", **settings.masked_dict())
    app.state.started = True

    try:
        yield
    finally:
        task = getattr(app.state, "ingest_task", None)
        if task is not None:
            task.cancel()
            try:
                await task
            except (asyncio.CancelledError, Exception):  # noqa: BLE001
                pass
        await dispose_engine()
        await close_cache()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="ai-pulse API", version="0.1.0", lifespan=lifespan)

    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(healthz_router)
    app.include_router(api_router, prefix="/api/v1")

    @app.get("/metrics", tags=["health"])
    async def metrics():  # no auth
        return metrics_response()

    return app


app = create_app()

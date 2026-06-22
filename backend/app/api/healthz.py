"""Health probes (no auth): /healthz/live, /ready, /startup (铁律五)."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app import cache as cache_module
from app import db as db_module

router = APIRouter(prefix="/healthz", tags=["health"])


@router.get("/live")
async def live() -> dict:
    """Liveness: process is up. Never checks dependencies."""
    return {"status": "alive"}


@router.get("/ready")
async def ready() -> JSONResponse:
    """Readiness: DB + cache reachable."""
    db_ok = False
    cache_ok = False
    try:
        sessionmaker = db_module.get_sessionmaker()
        async with sessionmaker() as session:
            await session.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    try:
        cache_ok = await cache_module.get_cache().health_check()
    except Exception:
        cache_ok = False

    if db_ok and cache_ok:
        return JSONResponse(
            status_code=200,
            content={"status": "ready", "db": "up", "cache": "up"},
        )
    return JSONResponse(
        status_code=503,
        content={
            "status": "not_ready",
            "db": "up" if db_ok else "down",
            "cache": "up" if cache_ok else "down",
        },
    )


@router.get("/startup")
async def startup() -> JSONResponse:
    """Startup: engine + cache initialised."""
    try:
        db_module.get_engine()
        cache_module.get_cache()
    except Exception:
        return JSONResponse(status_code=503, content={"status": "starting"})
    return JSONResponse(status_code=200, content={"status": "started"})

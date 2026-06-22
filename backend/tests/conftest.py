"""Test fixtures: sqlite in-memory DB + FakeCacheAdapter, ASGI client.

We override app.db / app.cache module singletons so the app uses sqlite + the fake
cache without touching real postgres/redis.
"""

from __future__ import annotations

import os

import pytest
import pytest_asyncio

# Ensure required secret settings exist before importing app.core.config.
os.environ.setdefault("DB_PASSWORD", "test-db-pass")
os.environ.setdefault("APP_SECRET_KEY", "test-secret-key")
os.environ.setdefault("CACHE_PASSWORD", "")
os.environ.setdefault("INGEST_ON_STARTUP", "false")

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models import Base


class FakeCacheAdapter:
    """In-memory CacheAdapter replacement (no TTL expiry simulation needed for tests)."""

    def __init__(self) -> None:
        self._store: dict[str, str] = {}

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def set(self, key: str, value: str, ttl: int | None = None) -> None:
        self._store[key] = str(value)

    async def delete(self, key: str) -> None:
        self._store.pop(key, None)

    async def incr(self, key: str, ttl: int | None = None) -> int:
        val = int(self._store.get(key, "0")) + 1
        self._store[key] = str(val)
        return val

    async def health_check(self) -> bool:
        return True


@pytest_asyncio.fixture
async def engine():
    eng = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def sessionmaker_fx(engine):
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def session(sessionmaker_fx):
    async with sessionmaker_fx() as s:
        yield s


@pytest.fixture
def fake_cache():
    return FakeCacheAdapter()


@pytest_asyncio.fixture
async def client(engine, sessionmaker_fx, fake_cache):
    """httpx AsyncClient wired to the FastAPI app with sqlite + fake cache."""
    import app.cache as cache_mod
    import app.db as db_mod
    from app.main import app

    # Wire module singletons used by deps + healthz.
    db_mod._engine = engine
    db_mod._sessionmaker = sessionmaker_fx
    cache_mod._cache = fake_cache

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

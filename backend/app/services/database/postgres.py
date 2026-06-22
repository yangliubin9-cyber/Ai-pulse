"""PostgreSQL adapter (asyncpg for runtime, psycopg2 for sync tooling)."""

from __future__ import annotations

from typing import Any
from urllib.parse import quote_plus

from sqlalchemy import text

from app.services.database.base import DatabaseAdapter


class Adapter(DatabaseAdapter):
    def __init__(self, settings: Any) -> None:
        self._s = settings

    def _credentials(self) -> tuple[str, str]:
        user = quote_plus(self._s.DB_USER)
        password = quote_plus(self._s.DB_PASSWORD.get_secret_value())
        return user, password

    def get_async_url(self) -> str:
        user, password = self._credentials()
        s = self._s
        return f"postgresql+asyncpg://{user}:{password}@{s.DB_HOST}:{s.DB_PORT}/{s.DB_NAME}"

    def get_sync_url(self) -> str:
        user, password = self._credentials()
        s = self._s
        return f"postgresql+psycopg2://{user}:{password}@{s.DB_HOST}:{s.DB_PORT}/{s.DB_NAME}"

    def engine_kwargs(self) -> dict[str, Any]:
        # NOTE: DB_SSL_MODE is intentionally ignored for the async (asyncpg) engine.
        # asyncpg does not accept libpq's "sslmode" connect arg; passing it would
        # break engine creation. SSL for asyncpg, if needed, is configured via a
        # ssl.SSLContext in connect_args — out of scope for the v1 default path.
        return {"pool_size": self._s.DB_POOL_SIZE, "pool_pre_ping": True}

    async def startup_check(self, conn: Any) -> None:
        await conn.execute(text("SELECT 1"))

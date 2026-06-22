"""Database adapter interface + provider factory (铁律二 统一接口层)."""

from __future__ import annotations

import importlib
from abc import ABC, abstractmethod
from typing import Any


class DatabaseAdapter(ABC):
    """Unified database interface. Concrete providers live in sibling modules."""

    @abstractmethod
    def get_async_url(self) -> str:
        """SQLAlchemy async URL (e.g. postgresql+asyncpg://...)."""

    @abstractmethod
    def get_sync_url(self) -> str:
        """SQLAlchemy sync URL (for migrations / tooling)."""

    @abstractmethod
    def engine_kwargs(self) -> dict[str, Any]:
        """Keyword args forwarded to create_async_engine."""

    @abstractmethod
    async def startup_check(self, conn: Any) -> None:
        """Run a lightweight connectivity probe on a live connection."""


def get_database_adapter(settings: Any) -> DatabaseAdapter:
    """Lazily import app.services.database.<DATABASE_PROVIDER> and build its Adapter."""
    provider = settings.DATABASE_PROVIDER
    module = importlib.import_module(f"app.services.database.{provider}")
    adapter_cls = getattr(module, "Adapter")
    return adapter_cls(settings)

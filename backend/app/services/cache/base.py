"""Cache adapter interface + provider factory (铁律二 统一接口层)."""

from __future__ import annotations

import importlib
from abc import ABC, abstractmethod
from typing import Any


class CacheAdapter(ABC):
    """Unified cache interface. Concrete providers live in sibling modules."""

    @abstractmethod
    async def get(self, key: str) -> str | None:
        ...

    @abstractmethod
    async def set(self, key: str, value: str, ttl: int | None = None) -> None:
        ...

    @abstractmethod
    async def delete(self, key: str) -> None:
        ...

    @abstractmethod
    async def incr(self, key: str, ttl: int | None = None) -> int:
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        ...


def get_cache_adapter(settings: Any) -> CacheAdapter:
    """Lazily import app.services.cache.<CACHE_PROVIDER> and build its Adapter."""
    provider = settings.CACHE_PROVIDER
    module = importlib.import_module(f"app.services.cache.{provider}")
    adapter_cls = getattr(module, "Adapter")
    return adapter_cls(settings)

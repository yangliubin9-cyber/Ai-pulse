"""Cache adapter singleton, initialised at startup."""

from __future__ import annotations

from app.core.config import Settings
from app.services.cache.base import CacheAdapter, get_cache_adapter

_cache: CacheAdapter | None = None


def init_cache(settings: Settings) -> None:
    global _cache
    _cache = get_cache_adapter(settings)


def get_cache() -> CacheAdapter:
    if _cache is None:
        raise RuntimeError("Cache not initialised; call init_cache() first")
    return _cache


async def close_cache() -> None:
    global _cache
    if _cache is not None:
        close = getattr(_cache, "close", None)
        if close is not None:
            await close()
    _cache = None

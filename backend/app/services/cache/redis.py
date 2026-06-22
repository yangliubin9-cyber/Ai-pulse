"""Redis cache adapter (redis.asyncio)."""

from __future__ import annotations

from typing import Any

from redis.asyncio import Redis

from app.services.cache.base import CacheAdapter


class Adapter(CacheAdapter):
    def __init__(self, settings: Any) -> None:
        password = settings.CACHE_PASSWORD.get_secret_value()
        self._client: Redis = Redis(
            host=settings.CACHE_HOST,
            port=settings.CACHE_PORT,
            db=settings.CACHE_DB,
            password=password or None,
            decode_responses=True,
        )

    async def get(self, key: str) -> str | None:
        return await self._client.get(key)

    async def set(self, key: str, value: str, ttl: int | None = None) -> None:
        if ttl:
            await self._client.set(key, value, ex=ttl)
        else:
            await self._client.set(key, value)

    async def delete(self, key: str) -> None:
        await self._client.delete(key)

    async def incr(self, key: str, ttl: int | None = None) -> int:
        result = await self._client.incr(key)
        if result == 1 and ttl:
            await self._client.expire(key, ttl)
        return int(result)

    async def health_check(self) -> bool:
        try:
            await self._client.ping()
            return True
        except Exception:
            return False

    async def close(self) -> None:
        aclose = getattr(self._client, "aclose", None)
        if aclose is not None:
            await aclose()
        else:  # pragma: no cover - older redis-py fallback
            await self._client.close()

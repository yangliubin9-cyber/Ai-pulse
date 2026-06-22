"""Local filesystem object storage adapter (default provider for v1)."""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

from app.core.errors import NotFoundError
from app.services.object_storage.base import ObjectInfo, ObjectStorageAdapter


class Adapter(ObjectStorageAdapter):
    def __init__(self, settings: Any) -> None:
        self._base = Path(settings.OBJECT_STORAGE_LOCAL_PATH) / settings.OBJECT_STORAGE_BUCKET

    def _path(self, key: str) -> Path:
        # Normalise the key to a relative path under the bucket base.
        return self._base / key.lstrip("/")

    def _put_sync(self, key: str, data: bytes) -> int:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return len(data)

    async def put_object(
        self, key: str, data: bytes, content_type: str | None = None
    ) -> ObjectInfo:
        size = await asyncio.to_thread(self._put_sync, key, data)
        return ObjectInfo(key=key, size=size, content_type=content_type)

    def _get_sync(self, key: str) -> bytes:
        path = self._path(key)
        if not path.is_file():
            raise NotFoundError(f"对象不存在: {key}")
        return path.read_bytes()

    async def get_object(self, key: str) -> bytes:
        return await asyncio.to_thread(self._get_sync, key)

    def _delete_sync(self, key: str) -> None:
        path = self._path(key)
        if path.is_file():
            path.unlink()

    async def delete_object(self, key: str) -> None:
        await asyncio.to_thread(self._delete_sync, key)

    async def object_exists(self, key: str) -> bool:
        return await asyncio.to_thread(lambda: self._path(key).is_file())

    def _health_sync(self) -> bool:
        try:
            self._base.mkdir(parents=True, exist_ok=True)
            return self._base.is_dir()
        except Exception:
            return False

    async def health_check(self) -> bool:
        return await asyncio.to_thread(self._health_sync)

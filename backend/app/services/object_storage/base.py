"""Object storage adapter interface + provider factory (铁律二 统一接口层)."""

from __future__ import annotations

import importlib
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class ObjectInfo:
    key: str
    size: int
    content_type: str | None = None


class ObjectStorageAdapter(ABC):
    """Unified object storage interface. Concrete providers in sibling modules."""

    @abstractmethod
    async def put_object(
        self, key: str, data: bytes, content_type: str | None = None
    ) -> ObjectInfo:
        ...

    @abstractmethod
    async def get_object(self, key: str) -> bytes:
        ...

    @abstractmethod
    async def delete_object(self, key: str) -> None:
        ...

    @abstractmethod
    async def object_exists(self, key: str) -> bool:
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        ...


def get_object_storage_adapter(settings: Any) -> ObjectStorageAdapter:
    """Lazily import app.services.object_storage.<PROVIDER> and build its Adapter."""
    provider = settings.OBJECT_STORAGE_PROVIDER
    module = importlib.import_module(f"app.services.object_storage.{provider}")
    adapter_cls = getattr(module, "Adapter")
    return adapter_cls(settings)

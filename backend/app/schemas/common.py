"""Shared schema helpers: ORM base model + ISO-Z datetime formatter."""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    """Base for response models read from ORM objects (from_attributes=True)."""

    model_config = ConfigDict(from_attributes=True)


def iso_z(dt: datetime) -> str:
    """Serialize a datetime as UTC ISO8601 ending with 'Z'. Naive => assume UTC."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

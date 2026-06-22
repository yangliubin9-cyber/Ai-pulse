"""FeedItem in/out schemas (pydantic v2)."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_serializer

from app.schemas.common import ORMModel, iso_z


class FeedItemOut(ORMModel):
    id: str
    source_type: str
    source_name: str
    title: str
    url: str
    summary: str
    author: Optional[str] = None
    category: str
    tags: list[str]
    image_url: Optional[str] = None
    score: Optional[int] = None
    published_at: datetime
    fetched_at: datetime

    @field_serializer("published_at", "fetched_at")
    def _serialize_dt(self, value: datetime) -> str:
        return iso_z(value)


class FeedItemListResponse(BaseModel):
    items: list[FeedItemOut]
    total: int
    page: int
    page_size: int


class CategoryCount(BaseModel):
    key: str
    label: str
    count: int


class SourceCount(BaseModel):
    source_type: str
    source_name: str
    count: int


class StatsResponse(BaseModel):
    total_items: int
    sources: int
    last_fetch_at: Optional[str] = None
    window_days: int


class IngestResult(BaseModel):
    fetched: int
    new: int
    by_source: dict[str, int]

"""FeedItem in/out schemas (pydantic v2)."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_serializer

from app.schemas.common import ORMModel, iso_z


class FeedItemOut(ORMModel):
    """List-view item: metadata + short summary (no full body, to save bandwidth)."""

    id: str
    source_type: str
    source_name: str
    title: str
    title_zh: Optional[str] = None
    url: str
    summary: str
    summary_zh: Optional[str] = None
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


class FeedItemDetailOut(FeedItemOut):
    """Detail-view item: everything in FeedItemOut plus the full article body.

    ``content`` is the source-provided full text (HTML-cleaned), ``content_zh`` its
    Chinese translation. Returned only by the single-item detail endpoint; lists
    stay slim with summary / summary_zh only.
    """

    content: Optional[str] = None
    content_zh: Optional[str] = None


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

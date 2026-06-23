"""feed_item model: one aggregated AI news item."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, Text
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, new_uuid, utcnow


class FeedItem(Base):
    __tablename__ = "feed_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    source_type: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    source_name: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    title_zh: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    url_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    summary_zh: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Full article body as published by the source itself (RSS content:encoded /
    # content / summary, arXiv abstract), HTML-cleaned. NULL when the source gives
    # no body (e.g. Hacker News). content_zh is its Chinese translation.
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_zh: Mapped[str | None] = mapped_column(Text, nullable=True)
    author: Mapped[str | None] = mapped_column(String(256), nullable=True)
    category: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )

    __table_args__ = (
        Index("ix_feed_items_category_published", "category", "published_at"),
        Index("ix_feed_items_source_published", "source_type", "published_at"),
    )

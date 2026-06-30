"""Per-user item state: bookmarked (saved) + read/unread.

One row per (user, item) the user has interacted with; the *absence* of a row
means the default "unread, not saved". Drives the 收藏 list and 已读/未读 filtering.
Single-user private deployment today, but modelled per-user for correctness.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, new_uuid, utcnow


class UserItemState(Base):
    __tablename__ = "user_item_states"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    item_id: Mapped[str] = mapped_column(String(36), nullable=False)
    saved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # When the flags were last turned on (used to sort the 收藏 list newest-first).
    saved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )

    __table_args__ = (
        UniqueConstraint("user_id", "item_id", name="uq_user_item_state"),
        Index("ix_user_item_states_user_saved", "user_id", "saved"),
        Index("ix_user_item_states_user_read", "user_id", "read"),
    )

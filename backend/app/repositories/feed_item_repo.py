"""Data access for FeedItem (SQLAlchemy 2 async ORM only)."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feed_item import FeedItem


class FeedItemRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_url_hash(self, url_hash: str) -> FeedItem | None:
        result = await self._session.execute(
            select(FeedItem).where(FeedItem.url_hash == url_hash)
        )
        return result.scalars().first()

    async def create(self, feed_item: FeedItem) -> FeedItem:
        self._session.add(feed_item)
        await self._session.flush()
        return feed_item

    async def list_missing_translations(self, limit: int) -> list[FeedItem]:
        """Rows still needing a zh translation: title_zh / summary_zh / content_zh NULL.

        Used by the idempotent translation backfill. The backfill writes "" (not
        NULL) to fields it has attempted, so already-processed rows stop matching.
        """
        result = await self._session.execute(
            select(FeedItem)
            .where(
                (FeedItem.title_zh.is_(None))
                | (FeedItem.summary_zh.is_(None))
                | (FeedItem.content_zh.is_(None))
            )
            .order_by(FeedItem.published_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_by_ids(self, ids: list[str]) -> list[FeedItem]:
        """Fetch the given rows by id (used by the post-ingest translation task)."""
        if not ids:
            return []
        result = await self._session.execute(
            select(FeedItem).where(FeedItem.id.in_(ids))
        )
        return list(result.scalars().all())

    async def list_link_only_ids_for_enrichment(self, limit: int | None = None) -> list[str]:
        """IDs of link-only items needing an og:description: empty ``summary`` AND
        NULL ``content`` (e.g. Hacker News submissions). Newest first.

        Returns a stable id snapshot so the enrichment backfill can page by id and
        always terminate, even when a fetch yields no metadata and the row stays
        a candidate.
        """
        stmt = (
            select(FeedItem.id)
            .where(FeedItem.summary == "", FeedItem.content.is_(None))
            .order_by(FeedItem.published_at.desc())
        )
        if limit is not None:
            stmt = stmt.limit(limit)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_link_only_by_ids(self, ids: list[str]) -> list[FeedItem]:
        """Among ``ids``, the rows that are still link-only (empty ``summary`` AND
        NULL ``content``). Re-applies the filter so an item another path already
        filled is skipped."""
        if not ids:
            return []
        result = await self._session.execute(
            select(FeedItem).where(
                FeedItem.id.in_(ids),
                FeedItem.summary == "",
                FeedItem.content.is_(None),
            )
        )
        return list(result.scalars().all())

    async def list_all_for_retranslation(self, limit: int, offset: int) -> list[FeedItem]:
        """Page over *all* rows (stable id order) for a forced re-translation.

        Unlike ``list_missing_translations`` this ignores existing zh values; the
        caller (``backfill_translations(force=True)``) overwrites them. Ordering
        by the immutable id guarantees the offset-based paging terminates even as
        rows are updated mid-run.
        """
        result = await self._session.execute(
            select(FeedItem).order_by(FeedItem.id).offset(offset).limit(limit)
        )
        return list(result.scalars().all())

    async def bulk_existing_hashes(self, hashes: list[str]) -> set[str]:
        if not hashes:
            return set()
        result = await self._session.execute(
            select(FeedItem.url_hash).where(FeedItem.url_hash.in_(hashes))
        )
        return set(result.scalars().all())

    async def list_items(
        self,
        category: str | None = None,
        source_type: str | None = None,
        featured: bool = False,
        q: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[FeedItem], int]:
        filters = []
        if category:
            filters.append(FeedItem.category == category)
        if source_type:
            filters.append(FeedItem.source_type == source_type)
        if q and q.strip():
            # Case-insensitive fuzzy match across the English source columns AND
            # their Chinese translations, so a Chinese-UI user searching in
            # Chinese still finds English-source items. Parameterized via
            # SQLAlchemy ilike() (escapes the bound value); LIKE wildcards in the
            # user input are escaped so they are treated as literals.
            term = q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            pattern = f"%{term}%"
            filters.append(
                FeedItem.title.ilike(pattern, escape="\\")
                | FeedItem.title_zh.ilike(pattern, escape="\\")
                | FeedItem.summary.ilike(pattern, escape="\\")
                | FeedItem.summary_zh.ilike(pattern, escape="\\")
            )
        if featured:
            # 精选只放"站内可读全文"的条目：来源自身提供了正文（content 非空）。
            # 像 Hacker News 这类只给标题+外链、没有正文的条目不进精选（仍出现在
            # 全部 AI 动态里），保证用户点开精选里的任何一篇都能在站内读中文正文。
            filters.append(FeedItem.content.isnot(None))
            filters.append(FeedItem.content != "")

        count_stmt = select(func.count()).select_from(FeedItem)
        if filters:
            count_stmt = count_stmt.where(*filters)
        total = (await self._session.execute(count_stmt)).scalar_one()

        stmt = select(FeedItem)
        if filters:
            stmt = stmt.where(*filters)
        if featured:
            stmt = stmt.order_by(
                FeedItem.score.desc().nulls_last(), FeedItem.published_at.desc()
            )
        else:
            stmt = stmt.order_by(FeedItem.published_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        items = list((await self._session.execute(stmt)).scalars().all())
        return items, int(total)

    async def get_by_id(self, id: str) -> FeedItem | None:
        result = await self._session.execute(select(FeedItem).where(FeedItem.id == id))
        return result.scalars().first()

    async def category_counts(self) -> dict[str, int]:
        result = await self._session.execute(
            select(FeedItem.category, func.count()).group_by(FeedItem.category)
        )
        return {row[0]: int(row[1]) for row in result.all()}

    async def source_counts(self) -> list[tuple[str, str, int]]:
        result = await self._session.execute(
            select(FeedItem.source_type, FeedItem.source_name, func.count())
            .group_by(FeedItem.source_type, FeedItem.source_name)
            .order_by(func.count().desc())
        )
        return [(row[0], row[1], int(row[2])) for row in result.all()]

    async def total_count(self) -> int:
        result = await self._session.execute(select(func.count()).select_from(FeedItem))
        return int(result.scalar_one())

    async def last_fetched_at(self) -> datetime | None:
        result = await self._session.execute(select(func.max(FeedItem.fetched_at)))
        return result.scalar_one_or_none()

    async def list_by_day(self, day_date: date) -> list[FeedItem]:
        start = datetime.combine(day_date, time.min, tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        result = await self._session.execute(
            select(FeedItem)
            .where(FeedItem.published_at >= start, FeedItem.published_at < end)
            .order_by(FeedItem.published_at.desc())
            # Cap one day's payload to match the /items page_size upper bound.
            .limit(200)
        )
        return list(result.scalars().all())

    async def latest_published_date(self) -> date | None:
        result = await self._session.execute(select(func.max(FeedItem.published_at)))
        latest = result.scalar_one_or_none()
        return latest.date() if latest is not None else None

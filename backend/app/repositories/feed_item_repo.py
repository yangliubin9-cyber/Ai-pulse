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
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[FeedItem], int]:
        filters = []
        if category:
            filters.append(FeedItem.category == category)
        if source_type:
            filters.append(FeedItem.source_type == source_type)

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
        )
        return list(result.scalars().all())

    async def latest_published_date(self) -> date | None:
        result = await self._session.execute(select(func.max(FeedItem.published_at)))
        latest = result.scalar_one_or_none()
        return latest.date() if latest is not None else None

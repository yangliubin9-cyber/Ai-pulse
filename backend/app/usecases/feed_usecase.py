"""Feed read-side orchestration (lists, detail, categories, sources, stats, daily)."""

from __future__ import annotations

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app import constants
from app.core.config import get_settings
from app.core.errors import NotFoundError
from app.models.feed_item import FeedItem
from app.repositories.feed_item_repo import FeedItemRepository
from app.schemas.common import iso_z


class FeedUsecase:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = FeedItemRepository(session)

    async def list_items(
        self,
        category: str | None = None,
        source_type: str | None = None,
        featured: bool = False,
        q: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[FeedItem], int]:
        return await self._repo.list_items(
            category=category,
            source_type=source_type,
            featured=featured,
            q=q,
            page=page,
            page_size=page_size,
        )

    async def get_item(self, id: str) -> FeedItem:
        item = await self._repo.get_by_id(id)
        if item is None:
            raise NotFoundError("内容不存在")
        return item

    async def categories(self) -> list[dict]:
        counts = await self._repo.category_counts()
        return [
            {"key": key, "label": label, "count": counts.get(key, 0)}
            for key, label in constants.CATEGORIES
        ]

    async def sources(self) -> list[dict]:
        rows = await self._repo.source_counts()
        return [
            {"source_type": st, "source_name": sn, "count": cnt}
            for st, sn, cnt in rows
        ]

    async def stats(self) -> dict:
        total = await self._repo.total_count()
        sources = await self._repo.source_counts()
        distinct_sources = len({sn for _st, sn, _cnt in sources})
        last_fetch = await self._repo.last_fetched_at()
        return {
            "total_items": total,
            "sources": distinct_sources,
            "last_fetch_at": iso_z(last_fetch) if last_fetch is not None else None,
            "window_days": get_settings().INGEST_WINDOW_DAYS,
        }

    async def daily(self, day: date | None) -> tuple[list[FeedItem], date | None]:
        if day is None:
            day = await self._repo.latest_published_date()
        if day is None:
            return [], None
        items = await self._repo.list_by_day(day)
        return items, day

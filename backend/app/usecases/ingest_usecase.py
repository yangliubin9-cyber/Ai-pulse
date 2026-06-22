"""Ingest orchestration: collectors -> filter -> dedupe -> categorize -> persist."""

from __future__ import annotations

from datetime import timedelta

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.collectors.arxiv import collect_arxiv
from app.collectors.base import CollectedItem
from app.collectors.hackernews import collect_hackernews
from app.collectors.rss import collect_rss
from app.core.config import get_settings
from app.core.observability import INGEST_ITEMS, INGEST_RUNS
from app.models.base import utcnow
from app.models.feed_item import FeedItem
from app.repositories.feed_item_repo import FeedItemRepository
from app.usecases import categorize as cat

logger = structlog.get_logger(__name__)


class IngestUsecase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = FeedItemRepository(session)

    async def run(self, trigger: str = "manual", window_days: int | None = None) -> dict:
        if window_days is None:
            window_days = get_settings().INGEST_WINDOW_DAYS

        collected: list[CollectedItem] = []
        for collector in (collect_rss, collect_hackernews, collect_arxiv):
            try:
                collected.extend(await collector(window_days))
            except Exception as exc:  # defence-in-depth; collectors guard internally too
                logger.warning("collector_failed", collector=collector.__name__, error=str(exc))

        cutoff = utcnow() - timedelta(days=window_days)

        # Filter to recent window (drop items with no published_at) + dedupe by hash.
        candidates: dict[str, tuple[str, CollectedItem]] = {}  # hash -> (hash, item)
        for item in collected:
            if item.published_at is None or item.published_at < cutoff:
                continue
            if not item.url:
                continue
            h = cat.url_hash(item.url)
            if h not in candidates:
                candidates[h] = (h, item)

        fetched = len(candidates)

        existing = await self._repo.bulk_existing_hashes([h for h in candidates])
        by_source: dict[str, int] = {}
        new_count = 0

        now = utcnow()
        for h, item in candidates.values():
            if h in existing:
                continue
            category = cat.categorize(item.title, item.summary, item.source_type)
            tags = cat.extract_tags(item.title, item.summary)
            feed_item = FeedItem(
                source_type=item.source_type,
                source_name=item.source_name,
                title=item.title,
                url=cat.normalize_url(item.url),
                url_hash=h,
                summary=item.summary or "",
                author=item.author,
                category=category,
                tags=tags,
                image_url=item.image_url,
                score=item.score,
                published_at=item.published_at,
                fetched_at=now,
            )
            await self._repo.create(feed_item)
            new_count += 1
            by_source[item.source_name] = by_source.get(item.source_name, 0) + 1

        INGEST_RUNS.labels(trigger).inc()
        INGEST_ITEMS.labels("fetched").inc(fetched)
        INGEST_ITEMS.labels("new").inc(new_count)

        await self._session.commit()
        logger.info("ingest_done", trigger=trigger, fetched=fetched, new=new_count)
        return {"fetched": fetched, "new": new_count, "by_source": by_source}

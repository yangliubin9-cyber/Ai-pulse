"""Hacker News collector via the Algolia search-by-date API (failure-isolated)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import httpx
import structlog

from app.collectors.base import HEADERS, TIMEOUT, CollectedItem
from app.constants import (
    HN_HITS_PER_PAGE,
    HN_MIN_POINTS,
    HN_QUERIES,
    HN_SEARCH_URL,
    HN_SOURCE_NAME,
    SOURCE_TYPE_HN,
)

logger = structlog.get_logger(__name__)


async def collect_hackernews(window_days: int) -> list[CollectedItem]:
    items: list[CollectedItem] = []
    cutoff = datetime.now(timezone.utc) - timedelta(days=window_days)
    cutoff_i = int(cutoff.timestamp())
    async with httpx.AsyncClient(
        timeout=TIMEOUT, headers=HEADERS, follow_redirects=True
    ) as client:
        for query in HN_QUERIES:
            try:
                params = {
                    "tags": "story",
                    "query": query,
                    "numericFilters": f"created_at_i>{cutoff_i},points>{HN_MIN_POINTS}",
                    "hitsPerPage": HN_HITS_PER_PAGE,
                }
                resp = await client.get(HN_SEARCH_URL, params=params)
                resp.raise_for_status()
                data = resp.json()
                for hit in data.get("hits", []):
                    title = hit.get("title")
                    if not title:
                        continue
                    object_id = hit.get("objectID")
                    url = hit.get("url") or f"https://news.ycombinator.com/item?id={object_id}"
                    created_i = hit.get("created_at_i")
                    published_at = (
                        datetime.fromtimestamp(created_i, tz=timezone.utc)
                        if created_i is not None
                        else None
                    )
                    items.append(
                        CollectedItem(
                            source_type=SOURCE_TYPE_HN,
                            source_name=HN_SOURCE_NAME,
                            title=title.strip(),
                            url=url,
                            summary="",
                            author=hit.get("author"),
                            published_at=published_at,
                            score=hit.get("points"),
                        )
                    )
            except Exception as exc:
                logger.warning("hn_query_failed", query=query, error=str(exc))
                continue
    return items

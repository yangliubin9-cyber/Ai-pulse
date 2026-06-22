"""RSS collector: aggregate items from configured AI feeds (failure-isolated)."""

from __future__ import annotations

import re

import feedparser
import httpx
import structlog

from app.collectors.base import HEADERS, TIMEOUT, CollectedItem, parse_struct_time
from app.constants import RSS_FEEDS, SOURCE_TYPE_RSS

logger = structlog.get_logger(__name__)

_TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(text: str) -> str:
    return _TAG_RE.sub("", text or "").strip()


def _first_image(entry) -> str | None:
    media = entry.get("media_content") or []
    for m in media:
        url = m.get("url")
        if url:
            return url
    for enc in entry.get("enclosures") or []:
        url = enc.get("href") or enc.get("url")
        if url and str(enc.get("type", "")).startswith("image"):
            return url
        if url:
            return url
    return None


async def collect_rss(window_days: int) -> list[CollectedItem]:
    items: list[CollectedItem] = []
    async with httpx.AsyncClient(timeout=TIMEOUT, headers=HEADERS, follow_redirects=True) as client:
        for feed in RSS_FEEDS:
            name = feed["name"]
            try:
                resp = await client.get(feed["url"])
                resp.raise_for_status()
                parsed = feedparser.parse(resp.content)
                for entry in parsed.entries:
                    link = entry.get("link")
                    if not link:
                        continue
                    items.append(
                        CollectedItem(
                            source_type=SOURCE_TYPE_RSS,
                            source_name=name,
                            title=(entry.get("title") or "").strip(),
                            url=link,
                            summary=_strip_html(entry.get("summary", "")),
                            author=entry.get("author"),
                            image_url=_first_image(entry),
                            published_at=parse_struct_time(entry.get("published_parsed")),
                        )
                    )
            except Exception as exc:  # one bad feed must not break the rest
                logger.warning("rss_feed_failed", feed=name, error=str(exc))
                continue
    return items

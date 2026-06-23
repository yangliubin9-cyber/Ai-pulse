"""RSS collector: aggregate items from configured AI feeds (failure-isolated)."""

from __future__ import annotations

import feedparser
import httpx
import structlog

from app.collectors.base import (
    HEADERS,
    TIMEOUT,
    CollectedItem,
    clean_html_to_text,
    freshness_score,
    parse_struct_time,
)
from app.constants import RSS_FEEDS, SOURCE_TYPE_RSS

logger = structlog.get_logger(__name__)

# Summaries are list-view blurbs, so keep them short. The full body lives in
# ``content`` (capped separately by clean_html_to_text's default).
SUMMARY_MAX_CHARS = 600


def _raw_content(entry) -> str | None:
    """Pick the fullest body the source itself published, raw (not yet cleaned).

    Prefers content:encoded / content (often full-text HTML) over summary. We only
    use what the feed hands us; we never fetch the article page.
    """
    contents = entry.get("content") or []
    for c in contents:
        value = c.get("value")
        if value and value.strip():
            return value
    for key in ("summary", "description"):
        value = entry.get(key)
        if value and value.strip():
            return value
    return None


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
                    published_at = parse_struct_time(entry.get("published_parsed"))
                    items.append(
                        CollectedItem(
                            source_type=SOURCE_TYPE_RSS,
                            source_name=name,
                            title=(entry.get("title") or "").strip(),
                            url=link,
                            summary=clean_html_to_text(
                                entry.get("summary", ""), max_chars=SUMMARY_MAX_CHARS
                            )
                            or "",
                            content=clean_html_to_text(_raw_content(entry)),
                            author=entry.get("author"),
                            image_url=_first_image(entry),
                            published_at=published_at,
                            score=freshness_score(published_at),
                        )
                    )
            except Exception as exc:  # one bad feed must not break the rest
                logger.warning("rss_feed_failed", feed=name, error=str(exc))
                continue
    return items

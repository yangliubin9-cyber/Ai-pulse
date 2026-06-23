"""arXiv collector via the Atom API (failure-isolated)."""

from __future__ import annotations

import re

import feedparser
import httpx
import structlog

from app.collectors.base import (
    HEADERS,
    TIMEOUT,
    CollectedItem,
    freshness_score,
    parse_struct_time,
)
from app.constants import (
    ARXIV_API_URL,
    ARXIV_MAX_RESULTS,
    ARXIV_SEARCH_QUERY,
    ARXIV_SOURCE_NAME,
    SOURCE_TYPE_ARXIV,
)

logger = structlog.get_logger(__name__)

_WS_RE = re.compile(r"\s+")


def _collapse(text: str) -> str:
    return _WS_RE.sub(" ", text or "").strip()


async def collect_arxiv(window_days: int) -> list[CollectedItem]:
    items: list[CollectedItem] = []
    # Build the URL as a raw string so the '+' in the search_query (cat:cs.AI+OR+...)
    # is preserved verbatim and not re-encoded by httpx's param encoder.
    url = (
        f"{ARXIV_API_URL}?search_query={ARXIV_SEARCH_QUERY}"
        f"&sortBy=submittedDate&sortOrder=descending&max_results={ARXIV_MAX_RESULTS}"
    )
    try:
        async with httpx.AsyncClient(
            timeout=TIMEOUT, headers=HEADERS, follow_redirects=True
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            parsed = feedparser.parse(resp.content)
            for entry in parsed.entries:
                link = entry.get("link")
                if not link:
                    continue
                authors = ", ".join(
                    a.get("name", "") for a in entry.get("authors", []) if a.get("name")
                )
                published_at = parse_struct_time(entry.get("published_parsed"))
                abstract = _collapse(entry.get("summary", ""))
                items.append(
                    CollectedItem(
                        source_type=SOURCE_TYPE_ARXIV,
                        source_name=ARXIV_SOURCE_NAME,
                        title=_collapse(entry.get("title", "")),
                        url=link,
                        summary=abstract,
                        # arXiv's "summary" is the full abstract; reuse it as the body.
                        content=abstract or None,
                        author=authors or None,
                        published_at=published_at,
                        score=freshness_score(published_at),
                    )
                )
    except Exception as exc:
        logger.warning("arxiv_collect_failed", error=str(exc))
    return items

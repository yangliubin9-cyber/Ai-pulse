"""Collector primitives: CollectedItem dataclass + shared HTTP config/helpers.

Collectors are pure provider adapters: fetch + normalise to CollectedItem.
NO business logic (categorize/dedupe live in usecases).
"""

from __future__ import annotations

import html as _html
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser

import time

from app.constants import HTTP_TIMEOUT_SECONDS, USER_AGENT

# Shared httpx timeout (seconds) + default request headers.
TIMEOUT = HTTP_TIMEOUT_SECONDS
HEADERS = {"User-Agent": USER_AGENT}

# Upper bound on the stored article body. Sources occasionally publish very long
# full-text content:encoded payloads; we cap them so a single item cannot bloat
# the row / translation cost. Over-cap bodies are truncated with a marker.
CONTENT_MAX_CHARS = 20000
_CONTENT_TRUNCATION_MARKER = "…[内容已截断]"

# Tags whose *text* is not article content and must be dropped wholesale.
_DROP_TAGS = {"script", "style", "head", "title", "noscript", "iframe"}
# Block-level tags after which we insert a paragraph break so the cleaned text
# keeps its structure (paragraphs separated by blank lines).
_BLOCK_TAGS = {
    "p", "br", "div", "li", "ul", "ol", "tr", "table",
    "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "section", "article",
}
_MULTI_BLANK_RE = re.compile(r"\n{3,}")
_TRAILING_WS_RE = re.compile(r"[ \t]+\n")


class _HTMLToText(HTMLParser):
    """Minimal HTML -> plain text using only the stdlib html.parser.

    Strips all tags, drops script/style content, and converts block-level tags to
    newlines so paragraph structure survives. No external dependency added.
    """

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._parts: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag in _DROP_TAGS:
            self._skip_depth += 1
        elif tag in _BLOCK_TAGS:
            self._parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in _DROP_TAGS and self._skip_depth > 0:
            self._skip_depth -= 1
        elif tag in _BLOCK_TAGS:
            self._parts.append("\n")

    def handle_data(self, data: str) -> None:
        if self._skip_depth == 0:
            self._parts.append(data)

    def get_text(self) -> str:
        return "".join(self._parts)


def clean_html_to_text(raw: str | None, max_chars: int = CONTENT_MAX_CHARS) -> str | None:
    """Convert source-provided HTML/text to clean plain text (paragraphs preserved).

    Pure function, no IO. Returns None for empty input. Removes tags / scripts /
    styles, unescapes entities, collapses runs of blank lines, and truncates to
    ``max_chars`` (appending a marker) so extreme full-text payloads stay bounded.
    """
    if not raw or not raw.strip():
        return None
    parser = _HTMLToText()
    try:
        parser.feed(raw)
        parser.close()
        text = parser.get_text()
    except Exception:  # noqa: BLE001 - malformed HTML must never break ingest
        text = re.sub(r"<[^>]+>", "", raw)
    text = _html.unescape(text)
    # Normalise whitespace: trim each line, drop trailing spaces, collapse >2 blanks.
    lines = [ln.strip() for ln in text.split("\n")]
    text = "\n".join(lines)
    text = _TRAILING_WS_RE.sub("\n", text)
    text = _MULTI_BLANK_RE.sub("\n\n", text).strip()
    if not text:
        return None
    if len(text) > max_chars:
        text = text[:max_chars].rstrip() + _CONTENT_TRUNCATION_MARKER
    return text


@dataclass
class CollectedItem:
    source_type: str
    source_name: str
    title: str
    url: str
    summary: str = ""
    content: str | None = None
    author: str | None = None
    image_url: str | None = None
    published_at: datetime | None = None
    score: int | None = None


def parse_struct_time(t: time.struct_time | None) -> datetime | None:
    """Convert feedparser's *_parsed (time.struct_time, UTC) to tz-aware UTC datetime."""
    if not t:
        return None
    try:
        return datetime(*t[:6], tzinfo=timezone.utc)
    except (ValueError, TypeError, OverflowError):
        return None


def freshness_score(published_at: datetime | None, now: datetime | None = None) -> int | None:
    """Heuristic 0-100 'heat' score for sources without an external score (arXiv/RSS).

    Decays linearly with age: 100 for brand-new items, losing ~1 point every 2
    hours, clamped to [0, 100]. Returns None when published_at is unknown so the
    UI simply omits the badge. This is our own heuristic, not a third-party score.
    """
    if published_at is None:
        return None
    if now is None:
        now = datetime.now(timezone.utc)
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    hours_ago = (now - published_at).total_seconds() / 3600.0
    if hours_ago < 0:
        hours_ago = 0.0
    return max(0, min(100, round(100 - hours_ago / 2)))

"""Collector primitives: CollectedItem dataclass + shared HTTP config/helpers.

Collectors are pure provider adapters: fetch + normalise to CollectedItem.
NO business logic (categorize/dedupe live in usecases).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

import time

from app.constants import HTTP_TIMEOUT_SECONDS, USER_AGENT

# Shared httpx timeout (seconds) + default request headers.
TIMEOUT = HTTP_TIMEOUT_SECONDS
HEADERS = {"User-Agent": USER_AGENT}


@dataclass
class CollectedItem:
    source_type: str
    source_name: str
    title: str
    url: str
    summary: str = ""
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

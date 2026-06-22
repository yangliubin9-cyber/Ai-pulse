"""Pure (no-IO) classification + URL normalisation helpers."""

from __future__ import annotations

import hashlib
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from app.constants import (
    CATEGORY_KEYWORDS,
    CATEGORY_OTHER,
    CATEGORY_PAPER,
    SOURCE_TYPE_ARXIV,
)

_DEFAULT_PORTS = {"http": "80", "https": "443"}


def normalize_url(url: str) -> str:
    """Canonicalise a URL: lowercase scheme/host, drop default port, strip tracking
    params (utm_*, fbclid), drop fragment, remove trailing slash."""
    parts = urlsplit(url.strip())
    scheme = parts.scheme.lower()
    hostname = (parts.hostname or "").lower()

    netloc = hostname
    if parts.port is not None and _DEFAULT_PORTS.get(scheme) != str(parts.port):
        netloc = f"{hostname}:{parts.port}"

    query_pairs = [
        (k, v)
        for k, v in parse_qsl(parts.query, keep_blank_values=True)
        if not k.lower().startswith("utm_") and k.lower() != "fbclid"
    ]
    query = urlencode(query_pairs)

    path = parts.path
    if path.endswith("/") and path != "/":
        path = path.rstrip("/")

    return urlunsplit((scheme, netloc, path, query, ""))


def url_hash(url: str) -> str:
    return hashlib.sha256(normalize_url(url).encode("utf-8")).hexdigest()


def categorize(title: str, summary: str, source_type: str) -> str:
    """Map an item to a category. arXiv => paper; otherwise keyword groups in order
    (model > product > industry > technique); fall back to 'other'."""
    if source_type == SOURCE_TYPE_ARXIV:
        return CATEGORY_PAPER
    haystack = f"{title} {summary}".lower()
    for category, keywords in CATEGORY_KEYWORDS:
        if any(kw in haystack for kw in keywords):
            return category
    return CATEGORY_OTHER


def extract_tags(title: str, summary: str, max_tags: int = 6) -> list[str]:
    """Collect matched keywords across all groups (dedup, order-preserving), capped."""
    haystack = f"{title} {summary}".lower()
    tags: list[str] = []
    for _category, keywords in CATEGORY_KEYWORDS:
        for kw in keywords:
            if kw in haystack and kw not in tags:
                tags.append(kw)
                if len(tags) >= max_tags:
                    return tags
    return tags

"""Open Graph / meta-description fetch for link-only items.

Hacker News (and the occasional RSS) item is a bare link: a title + URL with no
summary or body. Left as-is the feed reads as a wall of "原文" links. To give
those items a one-line preview we fetch the linked page's OWN ``<head>`` metadata
— ``og:description`` / ``twitter:description`` / ``meta[name=description]`` for a
summary, and ``og:image`` for a thumbnail.

This reads only the page's self-declared metadata (the same kind of text an RSS
``<description>`` carries), never article body text, and the original link +
source attribution are always preserved — so it stays within "只展示来源提供的
标题/摘要". It is also polite: a declared User-Agent, a short timeout, a capped
read size, and HTML-only (non-HTML responses are ignored).

Pure parsing (``parse_og_meta``) is separated from IO (``fetch_og_meta``) so the
parser can be unit-tested without the network.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from html.parser import HTMLParser

import httpx
import structlog

from app.collectors.base import HEADERS

logger = structlog.get_logger(__name__)

_WS_RE = re.compile(r"\s+")

# Default ceiling on the stored preview length (chars). Keeps a row / its
# translation cost bounded; the caller passes the configured value.
_DEFAULT_MAX_CHARS = 480


@dataclass
class OgMeta:
    """A page's self-declared preview metadata. Both fields may be None."""

    description: str | None = None
    image_url: str | None = None


class _MetaParser(HTMLParser):
    """Collect ``<meta>`` description/image tags from a page ``<head>``.

    Stops collecting once ``<body>`` opens — the metadata we want lives in the
    head, so this keeps work bounded even on a huge page. First value wins for a
    given key (pages occasionally repeat tags).
    """

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.metas: dict[str, str] = {}
        self._in_body = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "body":
            self._in_body = True
            return
        if self._in_body or tag != "meta":
            return
        a = {(k or "").lower(): (v or "") for k, v in attrs}
        key = (a.get("property") or a.get("name") or "").strip().lower()
        content = a.get("content", "").strip()
        if key and content and key not in self.metas:
            self.metas[key] = content


def _clean(text: str | None, max_chars: int) -> str | None:
    """Collapse whitespace, strip, and cap length (with an ellipsis). Returns None
    for empty input."""
    if not text:
        return None
    text = _WS_RE.sub(" ", text).strip()
    if not text:
        return None
    if len(text) > max_chars:
        text = text[:max_chars].rstrip() + "…"
    return text


def parse_og_meta(html: str, *, max_chars: int = _DEFAULT_MAX_CHARS) -> OgMeta:
    """Extract a preview description + image from page HTML. Pure; never raises.

    Description preference: ``og:description`` -> ``twitter:description`` ->
    ``meta[name=description]``. Image: ``og:image`` -> ``twitter:image`` (absolute
    http(s) URLs only; relative / data: images are ignored).
    """
    parser = _MetaParser()
    try:
        parser.feed(html)
        parser.close()
    except Exception:  # noqa: BLE001 - malformed HTML must never break ingest
        pass
    m = parser.metas
    description = _clean(
        m.get("og:description") or m.get("twitter:description") or m.get("description"),
        max_chars,
    )
    image = (m.get("og:image") or m.get("twitter:image") or "").strip() or None
    if image and not image.lower().startswith(("http://", "https://")):
        image = None
    return OgMeta(description=description, image_url=image)


async def fetch_og_meta(
    url: str,
    *,
    client: httpx.AsyncClient,
    max_bytes: int = 1_000_000,
    max_chars: int = _DEFAULT_MAX_CHARS,
) -> OgMeta:
    """Fetch ``url`` and extract its og/meta description + image.

    Returns an empty ``OgMeta`` on any failure (network error, non-200, non-HTML,
    oversize) — callers treat "no metadata" as "leave it a link-only card". Reads
    at most ``max_bytes`` of the body (the ``<head>`` is near the top) and only
    parses ``text/html`` responses. One bad page never raises into the batch.
    """
    try:
        async with client.stream("GET", url) as resp:
            if resp.status_code != 200:
                return OgMeta()
            if "html" not in resp.headers.get("content-type", "").lower():
                return OgMeta()
            chunks: list[bytes] = []
            total = 0
            async for chunk in resp.aiter_bytes():
                chunks.append(chunk)
                total += len(chunk)
                if total >= max_bytes:
                    break
            encoding = resp.encoding or "utf-8"
        html = b"".join(chunks).decode(encoding, errors="replace")
        return parse_og_meta(html, max_chars=max_chars)
    except Exception as exc:  # noqa: BLE001 - one bad page must never break the batch
        logger.info("og_fetch_failed", url=url[:200], error=str(exc))
        return OgMeta()


# Re-exported so callers can build a client with the project's shared UA.
__all__ = ["OgMeta", "fetch_og_meta", "parse_og_meta", "HEADERS"]

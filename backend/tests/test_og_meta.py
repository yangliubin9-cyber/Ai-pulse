"""Tests for og:description enrichment of link-only items.

Three layers:
- ``parse_og_meta`` — pure HTML -> OgMeta parsing (preference order, guards, cap).
- ``fetch_og_meta`` — IO guards (non-HTML, non-200) via httpx.MockTransport (no
  extra test dependency).
- ``IngestUsecase.enrich_link_summaries`` — fills summary + resets summary_zh on
  real (in-memory sqlite) link-only rows, leaving non-candidates untouched.
"""

from __future__ import annotations

import httpx
import pytest

from app.collectors.og_meta import OgMeta, fetch_og_meta, parse_og_meta
from app.models.feed_item import FeedItem
from app.usecases.ingest_usecase import IngestUsecase

# --- parse_og_meta (pure) ---------------------------------------------------


def test_parse_prefers_og_description_and_image() -> None:
    html = """
    <html><head>
      <meta property="og:description" content="An OG summary.">
      <meta name="description" content="A plain meta description.">
      <meta property="og:image" content="https://cdn.example.com/cover.png">
    </head><body>ignored</body></html>
    """
    meta = parse_og_meta(html)
    assert meta.description == "An OG summary."
    assert meta.image_url == "https://cdn.example.com/cover.png"


def test_parse_falls_back_to_twitter_then_meta_description() -> None:
    twitter = parse_og_meta(
        '<head><meta name="twitter:description" content="Tw desc"></head>'
    )
    assert twitter.description == "Tw desc"
    plain = parse_og_meta('<head><meta name="description" content="Plain desc"></head>')
    assert plain.description == "Plain desc"


def test_parse_collapses_whitespace_and_caps_length() -> None:
    long = "word " * 200  # 1000 chars before collapse
    meta = parse_og_meta(
        f'<head><meta property="og:description" content="{long}"></head>',
        max_chars=50,
    )
    assert meta.description is not None
    assert len(meta.description) <= 51  # 50 + ellipsis
    assert meta.description.endswith("…")
    assert "  " not in meta.description  # runs of whitespace collapsed


def test_parse_ignores_relative_image() -> None:
    meta = parse_og_meta(
        '<head><meta property="og:image" content="/static/cover.png"></head>'
    )
    assert meta.image_url is None


def test_parse_ignores_body_metas_and_returns_empty_when_none() -> None:
    # A <meta> after <body> opens must not be picked up.
    meta = parse_og_meta(
        '<head></head><body><meta property="og:description" content="late"></body>'
    )
    assert meta == OgMeta(description=None, image_url=None)


# --- fetch_og_meta (IO guards via MockTransport) ----------------------------


def _client(handler) -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


@pytest.mark.asyncio
async def test_fetch_reads_html_description() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"content-type": "text/html; charset=utf-8"},
            text='<head><meta property="og:description" content="Hello world"></head>',
        )

    async with _client(handler) as client:
        meta = await fetch_og_meta("https://example.com/post", client=client)
    assert meta.description == "Hello world"


@pytest.mark.asyncio
async def test_fetch_skips_non_html_content_type() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, headers={"content-type": "application/pdf"}, content=b"%PDF")

    async with _client(handler) as client:
        meta = await fetch_og_meta("https://example.com/file.pdf", client=client)
    assert meta == OgMeta()


@pytest.mark.asyncio
async def test_fetch_returns_empty_on_non_200() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404, headers={"content-type": "text/html"}, text="nope")

    async with _client(handler) as client:
        meta = await fetch_og_meta("https://example.com/missing", client=client)
    assert meta == OgMeta()


@pytest.mark.asyncio
async def test_fetch_swallows_network_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("boom")

    async with _client(handler) as client:
        meta = await fetch_og_meta("https://example.com/down", client=client)
    assert meta == OgMeta()


# --- enrich_link_summaries (usecase, in-memory DB) --------------------------


def _link_only(**over) -> FeedItem:
    base = dict(
        source_type="hackernews",
        source_name="Hacker News",
        title="A bare link",
        title_zh=None,
        url="https://example.com/article",
        url_hash="h-" + over.get("title", "x"),
        summary="",          # link-only: empty summary ...
        summary_zh="",       # ... and the "" sentinel a prior translation left
        content=None,        # ... and no body
        content_zh="",
        author=None,
        category="other",
        tags=[],
        image_url=None,
        score=10,
    )
    base.update(over)
    from app.models.base import utcnow

    base.setdefault("published_at", utcnow())
    return FeedItem(**base)


@pytest.mark.asyncio
async def test_enrich_fills_summary_and_resets_summary_zh(session, monkeypatch) -> None:
    item = _link_only(url_hash="h1")
    session.add(item)
    await session.commit()

    async def fake_fetch(url, *, client, max_bytes, max_chars):
        return OgMeta(description="Fetched preview.", image_url="https://x/y.png")

    monkeypatch.setattr("app.usecases.ingest_usecase.fetch_og_meta", fake_fetch)

    result = await IngestUsecase(session).enrich_link_summaries(ids=[item.id])
    await session.refresh(item)

    assert result == {"processed": 1, "enriched": 1}
    assert item.summary == "Fetched preview."
    assert item.summary_zh is None  # reset so translation backfill re-picks it
    assert item.image_url == "https://x/y.png"
    assert item.content is None  # never fabricated (精选 stays body-only)


@pytest.mark.asyncio
async def test_enrich_skips_items_that_already_have_summary(session, monkeypatch) -> None:
    item = _link_only(url_hash="h2", summary="Already has one.", summary_zh="已有。")
    session.add(item)
    await session.commit()

    called = False

    async def fake_fetch(url, *, client, max_bytes, max_chars):
        nonlocal called
        called = True
        return OgMeta(description="should not be used")

    monkeypatch.setattr("app.usecases.ingest_usecase.fetch_og_meta", fake_fetch)

    result = await IngestUsecase(session).enrich_link_summaries(ids=[item.id])
    await session.refresh(item)

    assert called is False  # not a link-only candidate -> never fetched
    assert item.summary == "Already has one."
    assert result["enriched"] == 0


@pytest.mark.asyncio
async def test_enrich_leaves_row_untouched_when_no_metadata(session, monkeypatch) -> None:
    item = _link_only(url_hash="h3")
    session.add(item)
    await session.commit()

    async def fake_fetch(url, *, client, max_bytes, max_chars):
        return OgMeta()  # page exposes nothing usable

    monkeypatch.setattr("app.usecases.ingest_usecase.fetch_og_meta", fake_fetch)

    result = await IngestUsecase(session).enrich_link_summaries(ids=[item.id])
    await session.refresh(item)

    assert result == {"processed": 1, "enriched": 0}
    assert item.summary == ""  # still a link-only card

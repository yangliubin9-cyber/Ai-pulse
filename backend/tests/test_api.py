"""API tests: probes, metrics, error structure, login flow + protected access.

Uses sqlite + FakeCacheAdapter via the `client` fixture (see conftest).
"""

from __future__ import annotations

import pytest

from datetime import datetime, timedelta, timezone

from app.constants import DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD
from app.core.security import hash_password
from app.models.feed_item import FeedItem
from app.models.user import User
from app.usecases.categorize import url_hash


async def _seed_admin(sessionmaker_fx):
    pw_hash, salt = hash_password(DEFAULT_ADMIN_PASSWORD)
    async with sessionmaker_fx() as s:
        s.add(User(email=DEFAULT_ADMIN_EMAIL, password_hash=pw_hash, password_salt=salt))
        await s.commit()


def _item(title, *, summary="", score=None, source_type="rss", category="other", hours_ago=1):
    published = datetime.now(timezone.utc) - timedelta(hours=hours_ago)
    url = f"https://example.com/{title.replace(' ', '-')}"
    return FeedItem(
        source_type=source_type,
        source_name="Test",
        title=title,
        url=url,
        url_hash=url_hash(url),
        summary=summary,
        category=category,
        tags=[],
        score=score,
        published_at=published,
    )


async def _seed_items(sessionmaker_fx, items):
    async with sessionmaker_fx() as s:
        for it in items:
            s.add(it)
        await s.commit()


async def _login(client):
    await client.post(
        "/api/v1/auth/login",
        json={"email": DEFAULT_ADMIN_EMAIL, "password": DEFAULT_ADMIN_PASSWORD},
    )


@pytest.mark.asyncio
async def test_liveness(client):
    r = await client.get("/healthz/live")
    assert r.status_code == 200
    assert r.json() == {"status": "alive"}


@pytest.mark.asyncio
async def test_readiness(client):
    r = await client.get("/healthz/ready")
    assert r.status_code == 200
    body = r.json()
    assert body["db"] == "up"
    assert body["cache"] == "up"


@pytest.mark.asyncio
async def test_startup_probe(client):
    r = await client.get("/healthz/startup")
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_metrics(client):
    r = await client.get("/metrics")
    assert r.status_code == 200
    assert "aipulse_http_requests_total" in r.text


@pytest.mark.asyncio
async def test_request_id_echoed(client):
    r = await client.get("/healthz/live", headers={"X-Request-Id": "abc-123"})
    assert r.headers.get("X-Request-Id") == "abc-123"


@pytest.mark.asyncio
async def test_protected_requires_auth_error_structure(client):
    r = await client.get("/api/v1/items")
    assert r.status_code == 401
    body = r.json()
    assert set(body["error"].keys()) == {"code", "message", "request_id", "details"}
    assert body["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client, sessionmaker_fx):
    await _seed_admin(sessionmaker_fx)
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": DEFAULT_ADMIN_EMAIL, "password": "wrong"},
    )
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "AUTH_INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_login_me_and_protected_flow(client, sessionmaker_fx):
    await _seed_admin(sessionmaker_fx)
    # login
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": DEFAULT_ADMIN_EMAIL, "password": DEFAULT_ADMIN_PASSWORD},
    )
    assert r.status_code == 200
    assert r.json()["user"]["email"] == DEFAULT_ADMIN_EMAIL
    assert "session_id" in r.cookies or any(
        c.name == "session_id" for c in client.cookies.jar
    )

    # me (cookie persisted on client)
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == DEFAULT_ADMIN_EMAIL

    # protected items endpoint now reachable
    r = await client.get("/api/v1/items")
    assert r.status_code == 200
    body = r.json()
    assert {"items", "total", "page", "page_size"} <= set(body.keys())

    # categories reachable too
    r = await client.get("/api/v1/categories")
    assert r.status_code == 200
    keys = {c["key"] for c in r.json()}
    assert {"model", "product", "industry", "paper", "technique", "other"} <= keys

    # logout
    r = await client.post("/api/v1/auth/logout")
    assert r.status_code == 204


@pytest.mark.asyncio
async def test_too_many_attempts_locks(client, sessionmaker_fx):
    await _seed_admin(sessionmaker_fx)
    for _ in range(5):
        await client.post(
            "/api/v1/auth/login",
            json={"email": DEFAULT_ADMIN_EMAIL, "password": "bad"},
        )
    # 6th attempt is locked even with correct password
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": DEFAULT_ADMIN_EMAIL, "password": DEFAULT_ADMIN_PASSWORD},
    )
    assert r.status_code == 429
    assert r.json()["error"]["code"] == "AUTH_TOO_MANY_ATTEMPTS"


@pytest.mark.asyncio
async def test_items_search_q_filters_title_and_summary(client, sessionmaker_fx):
    await _seed_admin(sessionmaker_fx)
    await _seed_items(
        sessionmaker_fx,
        [
            _item("New GPT model released", summary="a large language model"),
            _item("Weather forecast today", summary="sunny skies"),
            _item("Tooling update", summary="now supports the model registry"),
        ],
    )
    await _login(client)

    r = await client.get("/api/v1/items", params={"q": "model", "page_size": 50})
    assert r.status_code == 200
    body = r.json()
    # matches title of #1 and summary of #3, not #2
    titles = {i["title"] for i in body["items"]}
    assert "New GPT model released" in titles
    assert "Tooling update" in titles
    assert "Weather forecast today" not in titles
    assert body["total"] == 2

    # case-insensitive
    r2 = await client.get("/api/v1/items", params={"q": "MODEL"})
    assert r2.json()["total"] == 2

    # combines with other filters (no match in 'industry')
    r3 = await client.get("/api/v1/items", params={"q": "model", "category": "industry"})
    assert r3.json()["total"] == 0


@pytest.mark.asyncio
async def test_items_search_q_matches_zh_translation_columns(client, sessionmaker_fx):
    """A Chinese-UI user searching in Chinese finds English-source items via the
    title_zh / summary_zh columns."""
    await _seed_admin(sessionmaker_fx)
    zh_title = _item("OpenAI releases new model")
    zh_title.title_zh = "OpenAI 发布全新模型"
    zh_summary = _item("Funding round closed", summary="raised capital")
    zh_summary.summary_zh = "完成一轮融资"
    unrelated = _item("Weather forecast", summary="sunny")
    await _seed_items(sessionmaker_fx, [zh_title, zh_summary, unrelated])
    await _login(client)

    r = await client.get("/api/v1/items", params={"q": "模型", "page_size": 50})
    assert r.status_code == 200
    titles = {i["title"] for i in r.json()["items"]}
    assert "OpenAI releases new model" in titles
    assert "Weather forecast" not in titles

    r2 = await client.get("/api/v1/items", params={"q": "融资", "page_size": 50})
    titles2 = {i["title"] for i in r2.json()["items"]}
    assert "Funding round closed" in titles2


@pytest.mark.asyncio
async def test_items_featured_ordered_by_score_desc_nulls_last(client, sessionmaker_fx):
    await _seed_admin(sessionmaker_fx)
    await _seed_items(
        sessionmaker_fx,
        [
            _item("low score", score=10, hours_ago=1),
            _item("high score", score=250, hours_ago=5),
            _item("no score", score=None, hours_ago=2),
        ],
    )
    await _login(client)

    r = await client.get("/api/v1/items", params={"featured": "true", "page_size": 3})
    assert r.status_code == 200
    items = r.json()["items"]
    assert items[0]["title"] == "high score"
    assert items[1]["title"] == "low score"
    assert items[2]["title"] == "no score"  # None sorts last
    assert items[0]["score"] == 250

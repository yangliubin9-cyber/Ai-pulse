"""API tests: probes, metrics, error structure, login flow + protected access.

Uses sqlite + FakeCacheAdapter via the `client` fixture (see conftest).
"""

from __future__ import annotations

import pytest

from app.constants import DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD
from app.core.security import hash_password
from app.models.user import User


async def _seed_admin(sessionmaker_fx):
    pw_hash, salt = hash_password(DEFAULT_ADMIN_PASSWORD)
    async with sessionmaker_fx() as s:
        s.add(User(email=DEFAULT_ADMIN_EMAIL, password_hash=pw_hash, password_salt=salt))
        await s.commit()


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

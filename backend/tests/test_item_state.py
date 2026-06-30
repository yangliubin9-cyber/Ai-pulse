"""Per-user item state (saved / read) API tests.

Reuses the seed + login helpers from test_api (sqlite + FakeCache via the
`client` fixture). The new table is created by conftest's create_all.
"""

from __future__ import annotations

import pytest

from tests.test_api import _item, _login, _seed_admin, _seed_items


@pytest.mark.asyncio
async def test_save_toggle_reflects_in_list(client, sessionmaker_fx):
    await _seed_admin(sessionmaker_fx)
    it = _item("Saveable")
    await _seed_items(sessionmaker_fx, [it])
    await _login(client)

    r = await client.get("/api/v1/items")
    found = next(i for i in r.json()["items"] if i["id"] == it.id)
    assert found["saved"] is False
    assert found["read"] is False

    r = await client.post(f"/api/v1/items/{it.id}/save", json={"saved": True})
    assert r.status_code == 200
    assert r.json()["saved"] is True

    r = await client.get("/api/v1/items")
    found = next(i for i in r.json()["items"] if i["id"] == it.id)
    assert found["saved"] is True

    r = await client.post(f"/api/v1/items/{it.id}/save", json={"saved": False})
    assert r.json()["saved"] is False
    r = await client.get("/api/v1/items")
    found = next(i for i in r.json()["items"] if i["id"] == it.id)
    assert found["saved"] is False


@pytest.mark.asyncio
async def test_saved_filter_returns_only_saved(client, sessionmaker_fx):
    await _seed_admin(sessionmaker_fx)
    a, b = _item("A"), _item("B")
    await _seed_items(sessionmaker_fx, [a, b])
    await _login(client)
    await client.post(f"/api/v1/items/{a.id}/save", json={"saved": True})

    r = await client.get("/api/v1/items", params={"saved": "true", "page_size": 50})
    body = r.json()
    assert {i["title"] for i in body["items"]} == {"A"}
    assert body["total"] == 1


@pytest.mark.asyncio
async def test_mark_read_and_unread_filter(client, sessionmaker_fx):
    await _seed_admin(sessionmaker_fx)
    a, b = _item("A"), _item("B")
    await _seed_items(sessionmaker_fx, [a, b])
    await _login(client)

    r = await client.post(f"/api/v1/items/{a.id}/read")
    assert r.status_code == 200
    assert r.json()["read"] is True

    r = await client.get("/api/v1/items")
    by_id = {i["id"]: i for i in r.json()["items"]}
    assert by_id[a.id]["read"] is True
    assert by_id[b.id]["read"] is False

    r = await client.get("/api/v1/items", params={"unread": "true", "page_size": 50})
    assert {i["title"] for i in r.json()["items"]} == {"B"}


@pytest.mark.asyncio
async def test_mark_all_read_clears_unread(client, sessionmaker_fx):
    await _seed_admin(sessionmaker_fx)
    await _seed_items(sessionmaker_fx, [_item("A"), _item("B"), _item("C")])
    await _login(client)

    r = await client.post("/api/v1/items/read-all")
    assert r.status_code == 200
    assert r.json()["marked"] == 3

    r = await client.get("/api/v1/items", params={"unread": "true", "page_size": 50})
    assert r.json()["total"] == 0

    # idempotent — nothing new to mark on a second call.
    r = await client.post("/api/v1/items/read-all")
    assert r.json()["marked"] == 0

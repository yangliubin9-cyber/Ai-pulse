"""LLM content-enhancement layer: enrich JSON parsing, effective-enabled flag,
startup validation, and the ingest LLM path with argostranslate fallback.

No real network is used: the LLM is always a fake ``LLMClient`` whose ``complete``
returns canned JSON, and the offline path uses the same fake translator the
existing translation tests inject via the factory.
"""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from app.services.llm.base import LLMClient, LLMError
from app.usecases.enrich_usecase import EnrichResult, enrich_item, parse_enrich_json


# --- (a) enrich JSON parsing ------------------------------------------------

_GOOD = {
    "title_zh": "通义千问发布新模型",
    "summary_zh": "这是摘要。",
    "content_zh": "这是正文。",
    "reason_zh": "值得**关注**的开源进展。",
}


def _json_text(d: dict) -> str:
    import json

    return json.dumps(d, ensure_ascii=False)


def test_parse_pure_json():
    res = parse_enrich_json(_json_text(_GOOD))
    assert isinstance(res, EnrichResult)
    assert res.title_zh == "通义千问发布新模型"
    assert res.reason_zh == "值得**关注**的开源进展。"


def test_parse_fenced_json_block():
    raw = "```json\n" + _json_text(_GOOD) + "\n```"
    res = parse_enrich_json(raw)
    assert res.summary_zh == "这是摘要。"


def test_parse_json_with_surrounding_prose():
    raw = "当然，这是结果：\n" + _json_text(_GOOD) + "\n希望对你有帮助。"
    res = parse_enrich_json(raw)
    assert res.content_zh == "这是正文。"


def test_parse_empty_content_zh_allowed():
    d = dict(_GOOD)
    d["content_zh"] = ""
    res = parse_enrich_json(_json_text(d))
    assert res.content_zh == ""
    assert res.title_zh  # still present


@pytest.mark.parametrize("bad", ["", "   ", "no json here", "{not valid json", "[]"])
def test_parse_invalid_raises(bad):
    with pytest.raises(LLMError):
        parse_enrich_json(bad)


def test_parse_missing_title_raises():
    d = dict(_GOOD)
    d["title_zh"] = ""
    with pytest.raises(LLMError):
        parse_enrich_json(_json_text(d))


# --- enrich_item uses the injected client -----------------------------------

class _FakeLLM:
    def __init__(self, reply: str) -> None:
        self.reply = reply
        self.calls: list[list[dict[str, str]]] = []

    async def complete(self, messages, *, max_tokens, temperature) -> str:
        self.calls.append(messages)
        return self.reply


@pytest.mark.asyncio
async def test_enrich_item_one_call():
    client = _FakeLLM(_json_text(_GOOD))
    res = await enrich_item(
        client,
        title="Qwen ships a model",
        summary="A summary.",
        content="A body.",
        max_tokens=2048,
        temperature=0.3,
    )
    assert res.title_zh == "通义千问发布新模型"
    assert len(client.calls) == 1
    # system + user messages
    assert client.calls[0][0]["role"] == "system"
    assert client.calls[0][1]["role"] == "user"
    assert isinstance(client, LLMClient)  # satisfies the protocol


# --- (b) llm_effective_enabled ----------------------------------------------

def _settings(**over):
    from app.core.config import Settings

    base = dict(
        DB_PASSWORD="x",
        APP_SECRET_KEY="y",
    )
    base.update(over)
    import os

    for k, v in base.items():
        os.environ[k] = str(v)
    try:
        return Settings(_env_file=None)  # type: ignore[call-arg]
    finally:
        for k in base:
            os.environ.pop(k, None)


def test_llm_effective_enabled_false_by_default():
    s = _settings()
    assert s.LLM_ENABLED is False
    assert s.llm_effective_enabled is False


def test_llm_effective_enabled_true_when_all_set():
    s = _settings(
        LLM_ENABLED="true",
        LLM_BASE_URL="https://api.example.com/v1",
        LLM_API_KEY="sk-test",
        LLM_MODEL="gpt-4o-mini",
    )
    assert s.llm_effective_enabled is True


# --- (e) startup validation fails fast when enabled but incomplete ----------

@pytest.mark.parametrize(
    "missing",
    [
        dict(LLM_BASE_URL="", LLM_API_KEY="sk", LLM_MODEL="m"),
        dict(LLM_BASE_URL="u", LLM_API_KEY="", LLM_MODEL="m"),
        dict(LLM_BASE_URL="u", LLM_API_KEY="sk", LLM_MODEL=""),
    ],
)
def test_llm_enabled_missing_field_crashes(missing):
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        _settings(LLM_ENABLED="true", **missing)


def test_llm_api_key_masked():
    s = _settings(
        LLM_ENABLED="true",
        LLM_BASE_URL="u",
        LLM_API_KEY="sk-super-secret",
        LLM_MODEL="m",
    )
    masked = s.masked_dict()
    assert masked["LLM_API_KEY"] == "***"
    assert s.LLM_API_KEY.get_secret_value() == "sk-super-secret"


# --- (c)/(d) ingest path: LLM when enabled, fallback, argos when disabled ----

class _FakeTranslator:
    async def translate(self, text: str, target: str = "zh") -> str:
        return f"译:{text}"


def _make_item():
    from app.models.feed_item import FeedItem
    from app.usecases.categorize import url_hash

    return FeedItem(
        source_type="rss",
        source_name="Test",
        title="OpenAI releases new model",
        url="https://example.com/llm-a",
        url_hash=url_hash("https://example.com/llm-a"),
        summary="A new reasoning model.",
        content="A new reasoning model body.",
        category="model",
        tags=[],
        published_at=datetime.now(timezone.utc),
    )


@pytest.mark.asyncio
async def test_ingest_uses_llm_when_enabled(sessionmaker_fx, monkeypatch):
    import app.usecases.ingest_usecase as iu
    from app.models.feed_item import FeedItem
    from app.usecases.ingest_usecase import IngestUsecase
    from sqlalchemy import select

    # LLM effective -> build_llm_client returns the fake; translator must NOT be used.
    fake_llm = _FakeLLM(_json_text(_GOOD))
    monkeypatch.setattr(iu, "build_llm_client", lambda settings: fake_llm)

    def _boom(settings):  # guard: argostranslate path must not run on LLM success
        raise AssertionError("argostranslate should not be called when LLM succeeds")

    monkeypatch.setattr(iu, "get_translator", _boom)

    async with sessionmaker_fx() as s:
        s.add(_make_item())
        await s.commit()

    async with sessionmaker_fx() as s:
        await IngestUsecase(s).backfill_translations(batch_size=10)

    async with sessionmaker_fx() as s:
        row = (await s.execute(select(FeedItem))).scalars().one()
        assert row.title_zh == "通义千问发布新模型"
        assert row.content_zh == "这是正文。"
        # reason_zh is written only on the LLM path.
        assert row.reason_zh == "值得**关注**的开源进展。"
    assert len(fake_llm.calls) == 1


@pytest.mark.asyncio
async def test_ingest_falls_back_to_argos_on_llm_failure(sessionmaker_fx, monkeypatch):
    import app.usecases.ingest_usecase as iu
    from app.models.feed_item import FeedItem
    from app.usecases.ingest_usecase import IngestUsecase
    from sqlalchemy import select

    class _FailingLLM:
        async def complete(self, messages, *, max_tokens, temperature) -> str:
            raise LLMError("boom")

    monkeypatch.setattr(iu, "build_llm_client", lambda settings: _FailingLLM())
    monkeypatch.setattr(iu, "get_translator", lambda settings: _FakeTranslator())

    async with sessionmaker_fx() as s:
        s.add(_make_item())
        await s.commit()

    async with sessionmaker_fx() as s:
        await IngestUsecase(s).backfill_translations(batch_size=10)

    async with sessionmaker_fx() as s:
        row = (await s.execute(select(FeedItem))).scalars().one()
        # Fell back to the offline translator for this item.
        assert row.title_zh == "译:OpenAI releases new model"
        # reason_zh stays NULL on the argostranslate fallback path.
        assert row.reason_zh is None


@pytest.mark.asyncio
async def test_ingest_uses_argos_when_llm_disabled(sessionmaker_fx, monkeypatch):
    """LLM not effective (build returns None) -> existing argostranslate behaviour."""
    import app.usecases.ingest_usecase as iu
    from app.models.feed_item import FeedItem
    from app.usecases.ingest_usecase import IngestUsecase
    from sqlalchemy import select

    monkeypatch.setattr(iu, "build_llm_client", lambda settings: None)
    monkeypatch.setattr(iu, "get_translator", lambda settings: _FakeTranslator())

    async with sessionmaker_fx() as s:
        s.add(_make_item())
        await s.commit()

    async with sessionmaker_fx() as s:
        await IngestUsecase(s).backfill_translations(batch_size=10)

    async with sessionmaker_fx() as s:
        row = (await s.execute(select(FeedItem))).scalars().one()
        assert row.title_zh == "译:OpenAI releases new model"
        assert row.summary_zh == "译:A new reasoning model."
        assert row.reason_zh is None  # argostranslate never writes a reason


# --- factory ----------------------------------------------------------------

def test_factory_returns_none_when_disabled():
    from app.services.llm.factory import build_llm_client

    assert build_llm_client(_settings()) is None


def test_factory_builds_client_when_enabled():
    from app.services.llm.factory import build_llm_client

    client = build_llm_client(
        _settings(
            LLM_ENABLED="true",
            LLM_BASE_URL="https://api.example.com/v1",
            LLM_API_KEY="sk-test",
            LLM_MODEL="gpt-4o-mini",
        )
    )
    assert client is not None
    assert isinstance(client, LLMClient)

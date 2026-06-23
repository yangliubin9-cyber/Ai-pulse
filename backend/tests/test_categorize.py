"""Pure categorize / url normalization / tags / freshness scoring."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.collectors.base import freshness_score
from app.usecases.categorize import (
    categorize,
    extract_tags,
    normalize_url,
    url_hash,
)


def test_categorize_arxiv_is_paper():
    assert categorize("Anything", "abstract", "arxiv") == "paper"


def test_categorize_model():
    assert categorize("New GPT model released", "a large language model", "rss") == "model"


def test_categorize_product():
    assert categorize("We launch our new API", "now available", "rss") == "product"


def test_categorize_industry():
    assert categorize("Startup raises funding", "acquisition and market", "hackernews") == "industry"


def test_categorize_technique():
    assert categorize("A tutorial on prompting", "how to build agents", "rss") == "technique"


def test_categorize_other():
    assert categorize("Sky is blue today", "weather report", "rss") == "other"


def test_categorize_new_model_keywords():
    # "open source" is a product keyword; ensure a model word still wins (model group first)
    assert categorize("Claude weights quantization", "moe distillation", "rss") == "model"
    assert categorize("新模型微调与蒸馏", "预训练权重", "rss") == "model"


def test_categorize_new_technique_keywords():
    assert categorize("New RAG benchmark dataset", "agentic reasoning eval", "rss") == "technique"
    assert categorize("智能体推理评测", "数据集基准", "rss") == "technique"


def test_categorize_open_source_is_product():
    assert categorize("Open source release of the tool", "now available", "rss") == "product"
    assert categorize("开源发布", "正式上线", "rss") == "product"


def test_freshness_score_recent_is_high():
    now = datetime(2026, 6, 22, 12, 0, tzinfo=timezone.utc)
    assert freshness_score(now, now=now) == 100
    # 10 hours old -> 100 - 10/2 = 95
    assert freshness_score(now - timedelta(hours=10), now=now) == 95


def test_freshness_score_old_clamps_to_zero_and_none():
    now = datetime(2026, 6, 22, 12, 0, tzinfo=timezone.utc)
    # 1000 hours old -> clamps at 0
    assert freshness_score(now - timedelta(hours=1000), now=now) == 0
    assert freshness_score(None, now=now) is None


def test_normalize_url_strips_tracking_and_trailing_slash():
    a = normalize_url("https://Example.com/Path/?utm_source=x&id=5#frag")
    b = normalize_url("https://example.com/Path?id=5")
    assert a == b


def test_normalize_url_default_port_and_slash():
    a = normalize_url("https://example.com:443/foo/")
    b = normalize_url("https://example.com/foo")
    assert a == b


def test_url_hash_stable_and_dedupes_variants():
    h1 = url_hash("https://example.com/a?utm_campaign=z")
    h2 = url_hash("https://example.com/a")
    assert h1 == h2
    assert len(h1) == 64  # sha256 hex


def test_extract_tags_caps_and_dedupes():
    tags = extract_tags("GPT model launch and tutorial", "model model prompt", max_tags=3)
    assert len(tags) <= 3
    assert len(tags) == len(set(tags))

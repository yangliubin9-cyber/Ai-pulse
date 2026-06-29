"""Translation: is_probably_chinese heuristic, local adapter (mocked argos),
factory, schema fields, and the ingest backfill flow with a fake translator.

The real argostranslate model is NOT downloaded in unit tests; the local adapter
is exercised with argostranslate mocked, and the ingest/backfill paths use a fake
translator injected via the factory cache.
"""

from __future__ import annotations

import sys
import types

import pytest

from app.services.translation.base import (
    Translator,
    get_translator,
    is_probably_chinese,
    reset_translator_cache,
)


# --- is_probably_chinese ----------------------------------------------------

@pytest.mark.parametrize(
    "text,expected",
    [
        ("", False),
        ("   ", False),
        (None, False),
        ("OpenAI releases new model for reasoning", False),
        ("OpenAI 发布新的推理模型", True),          # mixed but CJK-heavy
        ("谷歌发布了全新的人工智能模型", True),       # all Chinese
        ("GPT-4o", False),                          # acronym + digits
        ("1234567890 !!! ???", False),              # no letters at all
        ("AI 资讯", True),                           # short Chinese with ascii token
    ],
)
def test_is_probably_chinese(text, expected):
    assert is_probably_chinese(text) is expected


def test_is_probably_chinese_threshold():
    # Mostly English with a couple of Chinese chars stays below default threshold.
    assert is_probably_chinese("This is an English sentence about 模型") is False


# --- glossary: protect / restore / KEEP / GLOSSARY --------------------------

from app.services.translation.glossary import (  # noqa: E402
    GLOSSARY,
    KEEP_TERMS,
    _PLACEHOLDER_RE,
    protect,
    restore,
)


def test_protect_restore_roundtrip_no_mt():
    """protect -> (identity, no MT) -> restore returns the original text."""
    text = "GLM-5.2 is the new leading open weights model from DeepSeek"
    protected, mapping = protect(text)
    # KEEP + GLOSSARY hits are replaced by placeholders, none left in source form.
    assert "GLM-5.2" not in protected
    assert "open weights" not in protected
    assert mapping  # something was protected
    # All placeholders are MT-safe KT<n>X tokens.
    for ph in mapping:
        assert _PLACEHOLDER_RE.fullmatch(ph)
    # Restoring an *untranslated* protected text reproduces canonical forms.
    restored = restore(protected, mapping)
    assert "GLM-5.2" in restored
    assert "DeepSeek" in restored
    assert "开放权重" in restored  # GLOSSARY: open weights model -> 开放权重模型
    assert "模型" in restored


def test_protect_empty():
    assert protect("") == ("", {})
    assert restore("", {}) == ""


@pytest.mark.parametrize("term", ["AI", "GitHub", "AirPods", "GPT-5.5"])
def test_keep_term_is_protected_and_restored_verbatim(term):
    text = f"A story about {term} today"
    protected, mapping = protect(text)
    assert term not in protected  # replaced by a placeholder
    assert term in mapping.values()  # KEEP keeps original surface form
    # Simulate MT that leaves the placeholder intact but mangles surrounding text.
    fake_mt = protected.replace("A story about", "关于").replace("today", "今天的故事")
    restored = restore(fake_mt, mapping)
    assert term in restored


def test_keep_case_insensitive_match_preserves_original_casing():
    protected, mapping = protect("the github repo and the GitHub org")
    # Both casings matched; each placeholder restores its own original casing.
    assert sorted(v for v in mapping.values() if v.lower() == "github") == [
        "GitHub",
        "github",
    ]


def test_keep_word_boundary_avoids_false_hit():
    # "GPT" must not match inside "GPTQ" (a different token).
    protected, mapping = protect("GPTQ quantization")
    assert "GPTQ" in protected  # untouched
    assert "GPTQ" not in mapping.values()


@pytest.mark.parametrize(
    "english,expected_zh",
    [
        ("repositories", "仓库"),
        ("model", "模型"),
        ("open weights", "开放权重"),
        ("reasoning", "推理"),
        ("benchmark", "基准测试"),
    ],
)
def test_glossary_maps_to_canonical_zh(english, expected_zh):
    protected, mapping = protect(f"about {english} here")
    assert expected_zh in mapping.values()
    # And it survives a MT pass that leaves the placeholder alone.
    assert expected_zh in restore(protected, mapping)


def test_glossary_longest_match_wins():
    # "open weights model" (3 words) beats "open weights" + "model" separately.
    _, mapping = protect("open weights model")
    assert "开放权重模型" in mapping.values()
    assert "开放权重" not in mapping.values()


def test_restore_double_digit_placeholder_no_collision():
    # Force >=12 placeholders so KT1X and KT11X coexist; restore must not confuse.
    text = " ".join(["AI"] * 12)  # 12 KEEP hits -> KT0X..KT11X
    protected, mapping = protect(text)
    assert len(mapping) == 12
    restored = restore(protected, mapping)
    assert restored.count("AI") == 12


def test_keep_terms_and_glossary_are_populated():
    assert len(KEEP_TERMS) >= 60
    assert len(GLOSSARY) >= 30


# --- local adapter with argostranslate mocked -------------------------------

@pytest.fixture
def mock_argos(monkeypatch):
    """Install fake argostranslate.{package,translate} modules in sys.modules."""
    pkg = types.ModuleType("argostranslate.package")
    translate = types.ModuleType("argostranslate.translate")
    root = types.ModuleType("argostranslate")
    root.package = pkg
    root.translate = translate

    class _Lang:
        def __init__(self, code):
            self.code = code

        def get_translation(self, other):
            return object()  # truthy -> path exists

    installed = [_Lang("en"), _Lang("zh")]
    translate.get_installed_languages = lambda: installed

    def _translate(text, from_code, to_code):
        return f"[zh:{text}]"

    translate.translate = _translate
    pkg.update_package_index = lambda: None
    pkg.get_available_packages = lambda: []

    monkeypatch.setitem(sys.modules, "argostranslate", root)
    monkeypatch.setitem(sys.modules, "argostranslate.package", pkg)
    monkeypatch.setitem(sys.modules, "argostranslate.translate", translate)
    return root


@pytest.mark.asyncio
async def test_local_translator_translates(mock_argos):
    from app.services.translation.local import Translator as LocalTranslator

    class _S:
        TRANSLATION_TARGET_LANG = "zh"

    t = LocalTranslator(_S())
    out = await t.translate("hello world", target="zh")
    assert out == "[zh:hello world]"


@pytest.mark.asyncio
async def test_local_translator_empty_returns_empty(mock_argos):
    from app.services.translation.local import Translator as LocalTranslator

    t = LocalTranslator(object())
    assert await t.translate("") == ""
    assert await t.translate("   ") == ""


@pytest.mark.asyncio
async def test_local_translator_segments_long_text(mock_argos):
    from app.services.translation.local import Translator as LocalTranslator

    t = LocalTranslator(object())
    long_text = ("Sentence one. " * 200).strip()  # well over the segment cap
    out = await t.translate(long_text, target="zh")
    assert out  # produced something
    assert "[zh:" in out


# --- factory ----------------------------------------------------------------

def test_get_translator_local_is_translator_subclass(monkeypatch, mock_argos):
    class _S:
        TRANSLATION_PROVIDER = "local"
        TRANSLATION_TARGET_LANG = "zh"

    reset_translator_cache()
    t = get_translator(_S())
    assert isinstance(t, Translator)
    reset_translator_cache()


# --- schema includes zh fields ----------------------------------------------

def test_feed_item_out_schema_has_zh_fields():
    from app.schemas.feed_item import FeedItemOut

    assert "title_zh" in FeedItemOut.model_fields
    assert "summary_zh" in FeedItemOut.model_fields


def test_list_schema_omits_content_detail_schema_has_it():
    from app.schemas.feed_item import FeedItemDetailOut, FeedItemOut

    # List view stays slim: no full body.
    assert "content" not in FeedItemOut.model_fields
    assert "content_zh" not in FeedItemOut.model_fields
    # Detail view carries the full article body + its translation.
    assert "content" in FeedItemDetailOut.model_fields
    assert "content_zh" in FeedItemDetailOut.model_fields
    # Detail inherits the slim fields too.
    assert "summary_zh" in FeedItemDetailOut.model_fields


# --- ingest backfill with a fake translator ---------------------------------

class _FakeTranslator(Translator):
    async def translate(self, text: str, target: str = "zh") -> str:
        return f"译:{text}"


@pytest.fixture
def patch_translator(monkeypatch):
    """Make get_translator() (used inside the usecase) return the fake translator."""
    import app.usecases.ingest_usecase as iu

    monkeypatch.setattr(iu, "get_translator", lambda settings: _FakeTranslator())


@pytest.mark.asyncio
async def test_backfill_translations_fills_zh(sessionmaker_fx, patch_translator):
    from datetime import datetime, timezone

    from app.models.feed_item import FeedItem
    from app.usecases.categorize import url_hash
    from app.usecases.ingest_usecase import IngestUsecase

    async with sessionmaker_fx() as s:
        s.add(
            FeedItem(
                source_type="rss",
                source_name="Test",
                title="OpenAI releases new model",
                url="https://example.com/a",
                url_hash=url_hash("https://example.com/a"),
                summary="A new reasoning model.",
                content="A new reasoning model with a much longer body.",
                category="model",
                tags=[],
                published_at=datetime.now(timezone.utc),
            )
        )
        # Already-Chinese row: should be left as-is by ingest, but backfill marks it.
        s.add(
            FeedItem(
                source_type="rss",
                source_name="Test",
                title="中文标题",
                url="https://example.com/b",
                url_hash=url_hash("https://example.com/b"),
                summary="中文摘要",
                category="model",
                tags=[],
                published_at=datetime.now(timezone.utc),
            )
        )
        await s.commit()

    async with sessionmaker_fx() as s:
        result = await IngestUsecase(s).backfill_translations(batch_size=10)

    assert result["processed"] == 2
    assert result["title_filled"] >= 1

    async with sessionmaker_fx() as s:
        from sqlalchemy import select

        rows = (await s.execute(select(FeedItem).order_by(FeedItem.url))).scalars().all()
        by_url = {r.url: r for r in rows}
        assert by_url["https://example.com/a"].title_zh == "译:OpenAI releases new model"
        assert by_url["https://example.com/a"].summary_zh == "译:A new reasoning model."
        # content body is also translated into content_zh.
        assert (
            by_url["https://example.com/a"].content_zh
            == "译:A new reasoning model with a much longer body."
        )
        # Row b had no content -> content_zh marked "" (attempted) so it stops matching.
        assert by_url["https://example.com/b"].content_zh == ""
        # Chinese row gets stored as-is (is_probably_chinese -> keep original).
        assert by_url["https://example.com/b"].title_zh == "中文标题"

    # Idempotent: a second pass finds nothing to do.
    async with sessionmaker_fx() as s:
        again = await IngestUsecase(s).backfill_translations(batch_size=10)
    assert again["processed"] == 0


# --- tidy_cjk (post-translation typesetting) --------------------------------

from app.services.translation.format import tidy_cjk  # noqa: E402


@pytest.mark.parametrize(
    "raw,expected",
    [
        # CJK<->Latin: insert exactly one space, never double an existing one.
        ("GLM-5.2是", "GLM-5.2 是"),
        ("使用 PyTorch 训练", "使用 PyTorch 训练"),
        # Spurious space between two Chinese runs is removed.
        ("领先 开放权重模型", "领先开放权重模型"),
        # ASCII quotes hug the surrounding Chinese.
        ('说 "AI" 是', '说"AI"是'),
        # Space before CJK punctuation dropped.
        ("转折 。", "转折。"),
        # Runs of spaces collapsed.
        ("合并  连续    空格", "合并连续空格"),
        # Blank-line runs capped at one.
        ("段落一\n\n\n\n段落二", "段落一\n\n段落二"),
        # Pure English is left intact (no CJK boundaries to touch).
        ("Just English text here.", "Just English text here."),
        # Edges trimmed.
        ("  中文  ", "中文"),
    ],
)
def test_tidy_cjk(raw, expected):
    assert tidy_cjk(raw) == expected


def test_tidy_cjk_example_from_spec():
    # The exact example given in the optimization brief.
    raw = "GLM-5.2是人工分析方面新的领先 开放权重模型"
    assert tidy_cjk(raw) == "GLM-5.2 是人工分析方面新的领先开放权重模型"


def test_tidy_cjk_is_idempotent():
    raw = "GLM-5.2是新的 open weights model 评测 。"
    once = tidy_cjk(raw)
    assert tidy_cjk(once) == once


@pytest.mark.parametrize("falsy", [None, ""])
def test_tidy_cjk_passthrough_falsy(falsy):
    assert tidy_cjk(falsy) == falsy


def test_tidy_cjk_only_changes_whitespace():
    # Same characters (minus whitespace) before and after -> no char substitution.
    raw = "模型GPT-4o发布 。"
    out = tidy_cjk(raw)
    assert out.replace(" ", "") == raw.replace(" ", "")


# --- normalize_cjk_punct (half-width -> full-width in Chinese context) -------

from app.services.translation.format import normalize_cjk_punct  # noqa: E402


@pytest.mark.parametrize(
    "raw,expected",
    [
        # Sentence-final period adjacent to Chinese -> full-width.
        ("物理结果.", "物理结果。"),
        # Comma between Chinese clauses -> full-width.
        ("获得,但", "获得，但"),
        # Colon introducing the next clause -> full-width.
        ("很难获得:远程", "很难获得：远程"),
        # Mark whose only Chinese neighbour is the *following* char still converts.
        ("AutoDex,我们", "AutoDex，我们"),
        # Other marks: semicolon / bang / question.
        ("第一;第二", "第一；第二"),
        ("太强了!", "太强了！"),
        ("是吗?好的", "是吗？好的"),
    ],
)
def test_normalize_punct_converts_in_chinese_context(raw, expected):
    assert normalize_cjk_punct(raw) == expected


@pytest.mark.parametrize(
    "raw",
    [
        "3,593",      # thousands separator
        "10.3",       # decimal
        "v1.0",       # version with embedded decimal
        "12:00",      # time
        "3:1",        # ratio
    ],
)
def test_normalize_punct_digit_guard_keeps_halfwidth(raw):
    # Pure numeric tokens (no Chinese neighbour anyway) are untouched...
    assert normalize_cjk_punct(raw) == raw
    # ...and even when wrapped in Chinese, the digit-flanked mark stays half-width.
    wrapped = f"约{raw}个"
    assert raw in normalize_cjk_punct(wrapped)


def test_normalize_punct_digit_guard_inside_chinese_sentence():
    raw = "训练用了3,593张图,精度10.3%。"
    out = normalize_cjk_punct(raw)
    assert "3,593" in out          # thousands separator preserved
    assert "10.3" in out           # decimal preserved
    assert "张图，精度" in out      # the inter-clause comma went full-width


def test_normalize_punct_url_guard_keeps_url_intact():
    raw = "见 https://arxiv.org/abs/2606.23689v1 获取详情。"
    out = normalize_cjk_punct(raw)
    assert "https://arxiv.org/abs/2606.23689v1" in out  # . : / untouched


def test_normalize_punct_email_guard():
    raw = "联系 author@example.com 获取数据。"
    out = normalize_cjk_punct(raw)
    assert "author@example.com" in out


def test_normalize_punct_brackets_adjacent_to_chinese():
    assert normalize_cjk_punct("(感知,执行,和重置)") == "（感知，执行，和重置）"


def test_normalize_punct_pure_english_unchanged():
    raw = "We propose AutoDex, a system."
    assert normalize_cjk_punct(raw) == raw


def test_normalize_punct_idempotent_on_fullwidth():
    text = "很难获得：远程操作产生有效的物理结果，但仍需改进。"
    assert normalize_cjk_punct(text) == text


@pytest.mark.parametrize("falsy", [None, ""])
def test_normalize_punct_passthrough_falsy(falsy):
    assert normalize_cjk_punct(falsy) == falsy


def test_normalize_punct_does_not_touch_hyphen_or_slash():
    # Hyphen / slash inside Chinese context are deliberately left alone.
    raw = "端到端-训练 与 输入/输出"
    out = normalize_cjk_punct(raw)
    assert "-" in out and "/" in out


def test_normalize_then_tidy_chained_no_space_around_fullwidth():
    # The production pipeline order: normalize first, then tidy whitespace.
    raw = "远程操作产生有效的物理结果, 但很难获得 : 远程"
    out = tidy_cjk(normalize_cjk_punct(raw))
    assert out == "远程操作产生有效的物理结果，但很难获得：远程"


@pytest.mark.parametrize(
    "raw",
    [
        # Runs where a mark's neighbour only becomes CJK after an earlier mark
        # converts -- exercises the fixed-point loop (must fully converge in one
        # call so a re-run changes nothing).
        "（中文（简体）). 内容",       # ) then . then 内容
        "互动。..。。机器人",            # mixed full/half stops collapsing rightward
        "解码框架，即加速。.. 内容",      # 。 then .. before Chinese
        "expr!() 宏",                   # ! then () adjacent to 宏
    ],
)
def test_normalize_punct_converges_and_is_idempotent(raw):
    once = normalize_cjk_punct(raw)
    assert normalize_cjk_punct(once) == once  # fixed point reached in one call
    # No half-width period/comma/colon left wedged against CJK or full-width punct.
    assert ".)" not in once and "). " not in once


# --- backfill translation cache (same text translated once) -----------------

class _CountingTranslator(Translator):
    def __init__(self) -> None:
        self.calls: list[str] = []

    async def translate(self, text: str, target: str = "zh") -> str:
        self.calls.append(text)
        return f"译:{text}"


@pytest.mark.asyncio
async def test_backfill_dedupes_identical_source_text(sessionmaker_fx, monkeypatch):
    """arXiv summary == content must be translated only once (cache hit)."""
    from datetime import datetime, timezone

    import app.usecases.ingest_usecase as iu
    from app.models.feed_item import FeedItem
    from app.usecases.categorize import url_hash
    from app.usecases.ingest_usecase import IngestUsecase

    counter = _CountingTranslator()
    monkeypatch.setattr(iu, "get_translator", lambda settings: counter)

    same = "An identical abstract reused as both summary and body."
    async with sessionmaker_fx() as s:
        s.add(
            FeedItem(
                source_type="arxiv",
                source_name="arXiv",
                title="A distinct title",
                url="https://example.com/x",
                url_hash=url_hash("https://example.com/x"),
                summary=same,
                content=same,  # identical to summary, as arXiv produces
                category="paper",
                tags=[],
                published_at=datetime.now(timezone.utc),
            )
        )
        await s.commit()

    async with sessionmaker_fx() as s:
        await IngestUsecase(s).backfill_translations(batch_size=10)

    # title + (summary OR content) = 2 unique texts; the duplicate is cached.
    assert counter.calls.count(same) == 1
    assert "A distinct title" in counter.calls
    assert len(counter.calls) == 2


# --- field-table helper (_translate_into) -----------------------------------

@pytest.mark.asyncio
async def test_translate_into_sentinel_and_skip(sessionmaker_fx, patch_translator):
    from datetime import datetime, timezone

    from app.models.feed_item import FeedItem
    from app.usecases.categorize import url_hash
    from app.usecases.ingest_usecase import IngestUsecase

    async with sessionmaker_fx() as s:
        item = FeedItem(
            source_type="rss",
            source_name="T",
            title="English title",
            title_zh="既有译文",       # already has zh -> skipped unless force
            url="https://example.com/h",
            url_hash=url_hash("https://example.com/h"),
            summary="",                # empty source -> "" sentinel
            content="中文正文",         # already Chinese -> stored verbatim
            category="model",
            tags=[],
            published_at=datetime.now(timezone.utc),
        )
        uc = IngestUsecase(s)
        cache: dict[str, str] = {}
        # title: has zh, not force -> no fill
        assert await uc._translate_into(item, "title", "title_zh", False, cache) is False
        assert item.title_zh == "既有译文"
        # summary: empty source -> sentinel "", no fill
        assert await uc._translate_into(item, "summary", "summary_zh", False, cache) is False
        assert item.summary_zh == ""
        # content: already Chinese -> stored as-is, not counted as a fill
        assert await uc._translate_into(item, "content", "content_zh", False, cache) is False
        assert item.content_zh == "中文正文"
        # title under force -> retranslated
        assert await uc._translate_into(item, "title", "title_zh", True, cache) is True
        assert item.title_zh == "译:English title"


@pytest.mark.asyncio
async def test_backfill_force_retranslates_existing(sessionmaker_fx, patch_translator):
    from datetime import datetime, timezone

    from sqlalchemy import select

    from app.models.feed_item import FeedItem
    from app.usecases.categorize import url_hash
    from app.usecases.ingest_usecase import IngestUsecase

    # Row already has a (stale) zh value that normal backfill would skip.
    async with sessionmaker_fx() as s:
        s.add(
            FeedItem(
                source_type="rss",
                source_name="Test",
                title="OpenAI ships a model",
                title_zh="旧译文",
                url="https://example.com/f",
                url_hash=url_hash("https://example.com/f"),
                summary="Old summary.",
                summary_zh="旧摘要",
                category="model",
                tags=[],
                published_at=datetime.now(timezone.utc),
            )
        )
        await s.commit()

    # Without force: title/summary are filled but content_zh is still NULL, so the
    # row is processed once to mark content_zh="" (no body to translate). A second
    # non-force pass then finds nothing.
    async with sessionmaker_fx() as s:
        res = await IngestUsecase(s).backfill_translations(batch_size=10)
    assert res["processed"] == 1
    assert res["content_filled"] == 0  # no content body -> nothing translated
    async with sessionmaker_fx() as s:
        res_again = await IngestUsecase(s).backfill_translations(batch_size=10)
    assert res_again["processed"] == 0

    # With force: the existing zh values are overwritten.
    async with sessionmaker_fx() as s:
        res = await IngestUsecase(s).backfill_translations(batch_size=10, force=True)
    assert res["processed"] == 1
    assert res["title_filled"] == 1

    async with sessionmaker_fx() as s:
        row = (await s.execute(select(FeedItem))).scalars().one()
        assert row.title_zh == "译:OpenAI ships a model"
        assert row.summary_zh == "译:Old summary."

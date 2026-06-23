"""Translation adapter interface + provider factory + language detection helper.

This is a *business* module (offline en->zh machine translation for ingested news),
not one of the five Service categories. It is still kept pluggable so the local
argostranslate backend can later be swapped for an LLM-based translator without
touching ingest/usecase code.
"""

from __future__ import annotations

import importlib
from abc import ABC, abstractmethod
from typing import Any

# CJK Unicode ranges used to decide whether text is already (mostly) Chinese.
# We only need a coarse "is this already Chinese?" signal, so the common
# CJK Unified Ideographs block is sufficient.
_CJK_RANGES = (
    (0x4E00, 0x9FFF),    # CJK Unified Ideographs
    (0x3400, 0x4DBF),    # CJK Extension A
    (0xF900, 0xFAFF),    # CJK Compatibility Ideographs
    (0x3000, 0x303F),    # CJK symbols and punctuation
    (0xFF00, 0xFFEF),    # Fullwidth forms
)

# If the share of CJK characters among all "letter-like" characters exceeds this
# threshold, we treat the text as already Chinese and skip translation.
_CHINESE_THRESHOLD = 0.30


def _is_cjk(ch: str) -> bool:
    cp = ord(ch)
    return any(lo <= cp <= hi for lo, hi in _CJK_RANGES)


def is_probably_chinese(text: str | None, threshold: float = _CHINESE_THRESHOLD) -> bool:
    """Heuristic: True if a meaningful share of the text is CJK.

    Pure function, no IO. Whitespace / digits / ASCII punctuation are ignored in
    the denominator so that a short Chinese phrase with surrounding punctuation
    still counts as Chinese. Empty / whitespace-only input returns False.
    """
    if not text:
        return False
    cjk = 0
    considered = 0
    for ch in text:
        if ch.isspace() or ch.isdigit():
            continue
        if _is_cjk(ch):
            cjk += 1
            considered += 1
        elif ch.isalpha():
            considered += 1
        # other punctuation/symbols are ignored entirely
    if considered == 0:
        return False
    return (cjk / considered) >= threshold


class Translator(ABC):
    """Unified translator interface. Concrete providers live in sibling modules."""

    @abstractmethod
    async def translate(self, text: str, target: str = "zh") -> str:
        """Translate ``text`` into ``target`` language. Empty input returns empty."""
        ...


# Process-wide cache keyed by provider name. The (potentially heavy) provider +
# language model is initialised once and reused. pydantic Settings is unhashable,
# so we key by the provider string rather than the settings object.
_TRANSLATOR_CACHE: dict[str, "Translator"] = {}


def get_translator(settings: Any) -> Translator:
    """Lazily import app.services.translation.<TRANSLATION_PROVIDER> and build it."""
    provider = settings.TRANSLATION_PROVIDER
    cached = _TRANSLATOR_CACHE.get(provider)
    if cached is not None:
        return cached
    module = importlib.import_module(f"app.services.translation.{provider}")
    translator_cls = getattr(module, "Translator")
    translator = translator_cls(settings)
    _TRANSLATOR_CACHE[provider] = translator
    return translator


def reset_translator_cache() -> None:
    """Clear the translator cache (used in tests)."""
    _TRANSLATOR_CACHE.clear()

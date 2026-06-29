"""Local offline en->zh translator backed by argostranslate (CTranslate2).

No external API / key required. The en->zh language package is downloaded and
installed lazily on first use (idempotent). If the package cannot be installed
(e.g. no network on first run in an offline environment), a clear error is raised
rather than silently returning the source text.

For private / air-gapped delivery the package can be pre-installed into the image
so no download happens at runtime (see backend README "离线交付" notes).
"""

from __future__ import annotations

import asyncio
import re
import threading
from typing import Any

import structlog

from app.services.translation.base import Translator as TranslatorBase
from app.services.translation.format import normalize_cjk_punct, tidy_cjk
from app.services.translation.glossary import protect, restore

logger = structlog.get_logger(__name__)

# Cap per-segment length so very long abstracts are translated in chunks and we
# don't blow past the model's context. Sentences are recombined after.
_MAX_SEGMENT_CHARS = 800

# Split on sentence-ending punctuation (ASCII + CJK) while keeping the delimiter.
_SENTENCE_SPLIT = re.compile(r"(?<=[.!?。！？\n])\s+")


class Translator(TranslatorBase):
    """argostranslate-based en->zh translator. Sync library is called in a thread."""

    def __init__(self, settings: Any) -> None:
        self._settings = settings
        self._init_lock = threading.Lock()
        self._installed: dict[tuple[str, str], bool] = {}

    # --- lazy package install (sync, runs inside to_thread) -------------------

    def _ensure_package(self, from_code: str, to_code: str) -> None:
        """Ensure the from_code->to_code argos package is installed (idempotent).

        Raises a clear RuntimeError if installation fails. Thread-safe.
        """
        key = (from_code, to_code)
        if self._installed.get(key):
            return
        with self._init_lock:
            if self._installed.get(key):
                return
            try:
                import argostranslate.package
                import argostranslate.translate
            except ImportError as exc:  # dependency missing
                raise RuntimeError(
                    "argostranslate is not installed; add it to dependencies "
                    "and reinstall (pip install argostranslate)."
                ) from exc

            # Already installed? (e.g. baked into the image for offline delivery)
            installed = argostranslate.translate.get_installed_languages()
            if self._has_path(installed, from_code, to_code):
                self._installed[key] = True
                return

            try:
                argostranslate.package.update_package_index()
                available = argostranslate.package.get_available_packages()
                pkg = next(
                    (
                        p
                        for p in available
                        if p.from_code == from_code and p.to_code == to_code
                    ),
                    None,
                )
                if pkg is None:
                    raise RuntimeError(
                        f"No argostranslate package available for "
                        f"{from_code}->{to_code}."
                    )
                download_path = pkg.download()
                argostranslate.package.install_from_path(download_path)
            except Exception as exc:  # noqa: BLE001 - surface a clear, non-silent error
                raise RuntimeError(
                    f"Failed to install argostranslate {from_code}->{to_code} "
                    f"language package: {exc}"
                ) from exc

            installed = argostranslate.translate.get_installed_languages()
            if not self._has_path(installed, from_code, to_code):
                raise RuntimeError(
                    f"argostranslate {from_code}->{to_code} package installed but "
                    f"no translation path is available."
                )
            self._installed[key] = True
            logger.info("argos_package_ready", from_code=from_code, to_code=to_code)

    @staticmethod
    def _has_path(installed_languages: list, from_code: str, to_code: str) -> bool:
        from_lang = next((l for l in installed_languages if l.code == from_code), None)
        to_lang = next((l for l in installed_languages if l.code == to_code), None)
        if from_lang is None or to_lang is None:
            return False
        try:
            return from_lang.get_translation(to_lang) is not None
        except Exception:  # noqa: BLE001
            return False

    # --- sync translation (runs inside to_thread) ----------------------------

    def _translate_sync(self, text: str, to_code: str, from_code: str = "en") -> str:
        self._ensure_package(from_code, to_code)
        import argostranslate.translate

        segments = self._segment(text)
        out_parts: list[str] = []
        for seg in segments:
            if not seg.strip():
                out_parts.append(seg)
                continue
            # Protect proper nouns / glossary terms, translate, then restore so
            # the offline MT engine never mangles brand / model / acronym names.
            protected, mapping = protect(seg)
            translated = argostranslate.translate.translate(protected, from_code, to_code)
            out_parts.append(restore(translated, mapping))
        joined = " ".join(p.strip() for p in out_parts if p.strip())
        # Typeset the MT output: first convert ASCII punctuation that sits in
        # Chinese context to its full-width form (digits / URLs guarded), then
        # tidy whitespace around CJK / Latin / punctuation so the stored
        # translation reads cleanly. Order matters: normalize_cjk_punct may emit
        # new full-width marks, and tidy_cjk then strips any space hugging them.
        return tidy_cjk(normalize_cjk_punct(joined)) or ""

    @staticmethod
    def _segment(text: str) -> list[str]:
        """Split long text into sentence-ish chunks under _MAX_SEGMENT_CHARS."""
        text = text.strip()
        if len(text) <= _MAX_SEGMENT_CHARS:
            return [text]
        sentences = _SENTENCE_SPLIT.split(text)
        chunks: list[str] = []
        buf = ""
        for sent in sentences:
            if not buf:
                buf = sent
            elif len(buf) + 1 + len(sent) <= _MAX_SEGMENT_CHARS:
                buf = f"{buf} {sent}"
            else:
                chunks.append(buf)
                buf = sent
        if buf:
            chunks.append(buf)
        return chunks

    # --- public async API ----------------------------------------------------

    async def translate(self, text: str, target: str = "zh") -> str:
        if not text or not text.strip():
            return ""
        # argostranslate uses "zh" as the Chinese code.
        to_code = "zh" if target.startswith("zh") else target
        return await asyncio.to_thread(self._translate_sync, text, to_code)

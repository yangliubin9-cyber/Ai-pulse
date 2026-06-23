"""Terminology protection + glossary for offline en->zh machine translation.

Offline argostranslate has no notion of proper nouns, so it happily "translates"
brand / model / acronym names into nonsense (observed: ``AI`` -> 大赦国际,
``GitHub repositories`` -> GitHub 寄存器, ``AirPods`` -> 空投效应,
``Linear A`` -> A 线). This module adds a thin protect/restore layer around the
MT call so those terms survive untouched and a curated set of AI terms gets a
canonical Chinese rendering.

Design (all pure functions, fully unit-testable, no IO):

* ``KEEP_TERMS`` — proper nouns kept verbatim (case-insensitive match, original
  casing preserved on restore).
* ``GLOSSARY`` — en->zh canonical translations for common AI vocabulary.
* ``protect(text) -> (protected_text, mapping)`` replaces every hit with a
  MT-safe placeholder of the form ``KT<n>X`` (e.g. ``KT0X``). This form was
  verified empirically against argostranslate en->zh: it is passed through
  unchanged (unlike ``__KT0__`` whose underscores get stripped to ``KT0``).
* ``restore(translated, mapping)`` swaps each placeholder back — KEEP hits to the
  original surface form, GLOSSARY hits to the canonical Chinese translation.

Both KEEP and GLOSSARY go through the *same* placeholder path so the MT engine
never sees (and so never mangles) either the proper noun or an already-correct
term; this avoids fragile post-translation string surgery.
"""

from __future__ import annotations

import re

# ---------------------------------------------------------------------------
# KEEP_TERMS: rendered verbatim (not translated). Case-insensitive match,
# original casing preserved. Includes models with digits / dots / hyphens
# (e.g. GPT-5.5) which need whole-token protection.
# ---------------------------------------------------------------------------
KEEP_TERMS: tuple[str, ...] = (
    # --- acronyms / concepts kept as-is ---
    "AGI", "ASI", "LLMs", "LLM", "ML", "RAG", "APIs", "API", "SDK",
    "GPU", "CPU", "TPU", "iOS", "OS", "UI", "UX", "MoE", "RLHF", "RL",
    "SOTA", "OCR", "TTS", "ASR", "NLP", "CV", "IDE", "CLI", "SaaS", "OSS",
    "AI",
    # --- companies / orgs ---
    "OpenAI", "Anthropic", "Google DeepMind", "DeepMind", "Google",
    "Meta", "Microsoft", "Apple", "NVIDIA", "Nvidia", "AMD", "Intel",
    "Hugging Face", "HuggingFace", "Mistral AI", "xAI", "Stability AI",
    "Cohere", "Alibaba", "Tencent", "ByteDance", "DeepSeek", "Moonshot",
    "Zhipu", "MiniMax", "Qwen Team",
    # --- model / product names (longer / hyphenated first) ---
    "GPT-5.5", "GPT-5", "GPT-4o", "GPT-4", "GPT-3.5", "GPT",
    "ChatGPT", "Claude", "Opus", "Sonnet", "Haiku", "Gemini",
    "Llama", "Qwen", "GLM", "Mixtral", "Mistral", "Phi", "Grok",
    "DALL-E", "Midjourney", "Stable Diffusion", "Sora", "Whisper",
    "CLIP", "BERT", "Kimi", "Copilot", "Cursor", "AirPods", "Ryzen",
    "GitHub", "GitLab", "Linux", "Windows", "macOS", "Android",
    "Docker", "Kubernetes", "PyTorch", "TensorFlow", "CUDA",
    "Transformers", "Transformer",
)

# ---------------------------------------------------------------------------
# GLOSSARY: canonical en->zh renderings. Keys are matched case-insensitively;
# longer keys (multi-word) take precedence over shorter ones. Plurals are
# listed explicitly so "models" maps the same as "model".
# ---------------------------------------------------------------------------
GLOSSARY: dict[str, str] = {
    "open weights model": "开放权重模型",
    "open weights": "开放权重",
    "open-source": "开源",
    "open source": "开源",
    "context window": "上下文窗口",
    "vector database": "向量数据库",
    "fine-tuning": "微调",
    "fine tuning": "微调",
    "fine-tune": "微调",
    "pre-training": "预训练",
    "pretraining": "预训练",
    "benchmarks": "基准测试",
    "benchmark": "基准测试",
    "datasets": "数据集",
    "dataset": "数据集",
    "repositories": "仓库",
    "repository": "仓库",
    "prompts": "提示词",
    "prompt": "提示词",
    "agents": "智能体",
    "agent": "智能体",
    "embeddings": "嵌入",
    "embedding": "嵌入",
    "tokens": "token",
    "token": "token",
    "multimodal": "多模态",
    "hallucination": "幻觉",
    "alignment": "对齐",
    "quantization": "量化",
    "distillation": "蒸馏",
    "retrieval": "检索",
    "reasoning": "推理",
    "inference": "推理",
    "weights": "权重",
    "models": "模型",
    "model": "模型",
}

# Placeholder format. ``KT<n>X`` is MT-safe for argostranslate en->zh (verified):
# the engine leaves it untouched, while ``__KT0__`` loses its underscores.
_PLACEHOLDER_FMT = "KT{}X"
_PLACEHOLDER_RE = re.compile(r"KT\d+X")


def _placeholder(index: int) -> str:
    return _PLACEHOLDER_FMT.format(index)


def _build_keep_pattern() -> re.Pattern[str]:
    """Match any KEEP term on word-ish boundaries (case-insensitive).

    Terms are sorted longest-first so e.g. ``GPT-5.5`` wins over ``GPT``. We use
    lookaround instead of ``\\b`` because terms contain ``.``/``-`` for which
    ``\\b`` behaves unintuitively; here a term must not be flanked by an ASCII
    letter or digit (so ``GPT`` inside ``GPTQ`` is not matched).
    """
    ordered = sorted(KEEP_TERMS, key=len, reverse=True)
    alt = "|".join(re.escape(t) for t in ordered)
    return re.compile(rf"(?<![A-Za-z0-9])(?:{alt})(?![A-Za-z0-9])", re.IGNORECASE)


def _build_glossary_pattern() -> re.Pattern[str]:
    """Match any GLOSSARY key on word boundaries (case-insensitive, longest-first)."""
    ordered = sorted(GLOSSARY, key=len, reverse=True)
    alt = "|".join(re.escape(t) for t in ordered)
    return re.compile(rf"(?<![A-Za-z0-9])(?:{alt})(?![A-Za-z0-9])", re.IGNORECASE)


_KEEP_RE = _build_keep_pattern()
_GLOSSARY_RE = _build_glossary_pattern()


def protect(text: str) -> tuple[str, dict[str, str]]:
    """Replace KEEP / GLOSSARY hits with MT-safe placeholders.

    Returns ``(protected_text, mapping)`` where ``mapping`` is
    ``{placeholder: replacement}`` and ``replacement`` is the original surface
    form for KEEP hits or the canonical Chinese for GLOSSARY hits. KEEP is
    applied first so a proper noun is never re-matched by the glossary.
    """
    if not text:
        return text, {}

    mapping: dict[str, str] = {}
    counter = 0

    def _keep_sub(m: re.Match[str]) -> str:
        nonlocal counter
        ph = _placeholder(counter)
        counter += 1
        mapping[ph] = m.group(0)  # preserve original casing
        return ph

    protected = _KEEP_RE.sub(_keep_sub, text)

    def _gloss_sub(m: re.Match[str]) -> str:
        nonlocal counter
        ph = _placeholder(counter)
        counter += 1
        mapping[ph] = GLOSSARY[m.group(0).lower()]
        return ph

    protected = _GLOSSARY_RE.sub(_gloss_sub, protected)
    return protected, mapping


def restore(translated: str, mapping: dict[str, str]) -> str:
    """Swap placeholders back to their replacements.

    Restore is order-independent because placeholders are unique, but we replace
    longest-index-first (``KT11X`` before ``KT1X``) so a shorter placeholder can
    never match inside a longer one.
    """
    if not mapping or not translated:
        return translated
    for ph in sorted(mapping, key=len, reverse=True):
        translated = translated.replace(ph, mapping[ph])
    return translated

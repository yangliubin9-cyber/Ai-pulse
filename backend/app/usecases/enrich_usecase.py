"""LLM content enhancement: translate an item to fluent zh + write a reason blurb.

One chat call per item produces a strict-JSON object with four fields:
``title_zh`` / ``summary_zh`` / ``content_zh`` (fluent Chinese translations) and
``reason_zh`` (a one-line AIHOT-style "why this matters" blurb). The caller
(ingest) persists those on success and falls back to the offline argostranslate
path for any item whose enrichment fails.

No network here: this module only builds the prompt, calls the injected
``LLMClient.complete`` and parses the result, so it is fully unit-testable with a
fake client.
"""

from __future__ import annotations

import json
from dataclasses import dataclass

from app.services.llm.base import LLMClient, LLMError

# Cap the body we send so a very long article does not blow past the model's input
# budget. The translation of the leading section is more than enough for the list /
# detail views; the full English body is still stored verbatim in ``content``.
_MAX_CONTENT_CHARS = 6000

_SYSTEM_PROMPT = (
    "你是一名专业的中文 AI 资讯编辑。你的工作是把英文 AI 新闻翻译成通顺、准确、"
    "地道的简体中文，并为读者写一句推荐理由。要求：\n"
    "1. 译文必须通顺自然，符合中文表达习惯，不要逐字硬译；\n"
    "2. 专有名词（如 GPT、GitHub、OpenAI、模型名、公司名、产品名）保留英文原文，不要乱译；\n"
    "3. 推荐理由用 AIHOT 风格：一句话说清楚“为什么值得看 + 适合谁看”，原创、客观、不吹捧，"
    "可包含一处 **markdown 粗体** 强调关键点；\n"
    "4. 只输出一个 JSON 对象，不要输出任何额外说明文字或代码块标记。"
)


@dataclass(frozen=True)
class EnrichResult:
    """Parsed LLM output. ``content_zh`` is "" when the source had no body."""

    title_zh: str
    summary_zh: str
    content_zh: str
    reason_zh: str


def _build_user_prompt(title: str, summary: str, content: str) -> str:
    """Build the user message with the source fields and the required output shape."""
    body = (content or "")[:_MAX_CONTENT_CHARS]
    return (
        "请把下面这条英文 AI 资讯翻译成通顺中文，并写一句推荐理由。\n"
        "严格返回如下 JSON（content 原文为空则 content_zh 返回空字符串）：\n"
        '{"title_zh":"...","summary_zh":"...","content_zh":"...","reason_zh":"..."}\n\n'
        f"title: {title or ''}\n"
        f"summary: {summary or ''}\n"
        f"content: {body}\n"
    )


def parse_enrich_json(raw: str) -> EnrichResult:
    """Parse the model's reply into an :class:`EnrichResult`.

    Tolerant of common LLM output noise: ```json fenced blocks and leading/trailing
    prose around the object. Extracts the first balanced ``{...}`` span and JSON-
    decodes it. Raises :class:`LLMError` when no valid object with the required
    string fields can be recovered (the caller then falls back to argostranslate).
    """
    if not raw or not raw.strip():
        raise LLMError("LLM returned empty content")

    obj_text = _extract_json_object(raw)
    try:
        data = json.loads(obj_text)
    except json.JSONDecodeError as exc:
        raise LLMError(f"LLM output was not valid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise LLMError("LLM output JSON was not an object")

    def _field(name: str) -> str:
        value = data.get(name, "")
        if value is None:
            return ""
        if not isinstance(value, str):
            raise LLMError(f"LLM field {name!r} was not a string")
        return value.strip()

    title_zh = _field("title_zh")
    summary_zh = _field("summary_zh")
    content_zh = _field("content_zh")
    reason_zh = _field("reason_zh")
    # A usable result must at least carry a translated title; otherwise treat the
    # whole enrichment as failed so the item falls back to offline translation.
    if not title_zh:
        raise LLMError("LLM output missing a non-empty title_zh")
    return EnrichResult(
        title_zh=title_zh,
        summary_zh=summary_zh,
        content_zh=content_zh,
        reason_zh=reason_zh,
    )


def _extract_json_object(raw: str) -> str:
    """Return the first balanced ``{...}`` substring (brace-counting, string-aware)."""
    start = raw.find("{")
    if start == -1:
        raise LLMError("LLM output contained no JSON object")
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(raw)):
        ch = raw[i]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return raw[start : i + 1]
    raise LLMError("LLM output had an unterminated JSON object")


async def enrich_item(
    client: LLMClient,
    *,
    title: str,
    summary: str,
    content: str | None,
    max_tokens: int,
    temperature: float,
) -> EnrichResult:
    """Enrich one item via a single chat call. Raises :class:`LLMError` on failure."""
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": _build_user_prompt(title, summary, content or "")},
    ]
    raw = await client.complete(messages, max_tokens=max_tokens, temperature=temperature)
    return parse_enrich_json(raw)

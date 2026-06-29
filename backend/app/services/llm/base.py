"""LLM client interface + shared error type.

This is a *business* module (optional content enhancement for ingested news), not
one of the five Service categories. Business code depends only on the ``LLMClient``
protocol below; the concrete httpx-backed implementation lives in
``openai_compatible.py`` and is constructed via ``factory.build_llm_client``.
"""

from __future__ import annotations

from typing import Protocol, runtime_checkable


class LLMError(RuntimeError):
    """Raised when an LLM completion fails (timeout, HTTP error, bad response).

    Carries a clear message but never the API key. Callers (e.g. ingest) catch this
    and fall back to the offline argostranslate path for the affected item.
    """


@runtime_checkable
class LLMClient(Protocol):
    """Minimal chat-completion interface the enrichment usecase depends on.

    ``messages`` is the OpenAI-style list of ``{"role": ..., "content": ...}``
    dicts. Implementations must return the assistant message content as a string
    and raise :class:`LLMError` on any failure.
    """

    async def complete(
        self,
        messages: list[dict[str, str]],
        *,
        max_tokens: int,
        temperature: float,
    ) -> str: ...

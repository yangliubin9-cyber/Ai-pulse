"""Factory: build the configured LLM client, or None when LLM is not effective.

Business code calls ``build_llm_client(settings)`` and branches on the result:
``None`` means "no usable LLM" and the caller should run the offline argostranslate
path. A non-None result is an ``LLMClient`` ready to ``complete``.
"""

from __future__ import annotations

from typing import Any

from app.services.llm.base import LLMClient
from app.services.llm.openai_compatible import OpenAICompatibleClient


def build_llm_client(settings: Any) -> LLMClient | None:
    """Return an ``LLMClient`` when LLM is effectively enabled, else ``None``.

    ``llm_effective_enabled`` already requires LLM_ENABLED plus non-empty base_url /
    api_key / model, so by the time we get here those are all set. Only the
    ``openai-compatible`` provider is implemented (the single value LLM_PROVIDER
    accepts); an unknown provider is treated as a clear misconfiguration.
    """
    if not settings.llm_effective_enabled:
        return None
    provider = settings.LLM_PROVIDER
    if provider != "openai-compatible":
        raise ValueError(
            f"Unsupported LLM_PROVIDER {provider!r}; only 'openai-compatible' is implemented."
        )
    return OpenAICompatibleClient(
        base_url=settings.LLM_BASE_URL,
        api_key=settings.LLM_API_KEY.get_secret_value(),
        model=settings.LLM_MODEL,
        timeout_seconds=settings.LLM_TIMEOUT_SECONDS,
    )

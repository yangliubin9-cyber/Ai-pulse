"""OpenAI-compatible chat-completions client built on httpx (no openai SDK).

Talks to any endpoint that implements the standard ``POST {base_url}/chat/completions``
contract (OpenAI, DeepSeek, Zhipu GLM, vLLM, Ollama's OpenAI shim, ...). The model
name, base URL, key and limits all come from Settings; nothing is hardcoded.

The API key is sent only in the ``Authorization`` header and is never logged or
included in raised error messages.
"""

from __future__ import annotations

from typing import Any

import httpx
import structlog

from app.services.llm.base import LLMError

logger = structlog.get_logger(__name__)


class OpenAICompatibleClient:
    """httpx-backed implementation of the ``LLMClient`` protocol."""

    def __init__(
        self,
        *,
        base_url: str,
        api_key: str,
        model: str,
        timeout_seconds: int,
    ) -> None:
        # Normalise so callers may pass the base with or without a trailing slash.
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._model = model
        self._timeout = timeout_seconds

    async def complete(
        self,
        messages: list[dict[str, str]],
        *,
        max_tokens: int,
        temperature: float,
    ) -> str:
        url = f"{self._base_url}/chat/completions"
        payload: dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.post(url, json=payload, headers=headers)
        except httpx.TimeoutException as exc:
            raise LLMError(f"LLM request timed out after {self._timeout}s") from exc
        except httpx.HTTPError as exc:
            # Stringifying httpx errors does not leak the Authorization header.
            raise LLMError(f"LLM request failed: {exc}") from exc

        if resp.status_code >= 400:
            # Body may carry a provider error message (rate limit, bad model, ...);
            # truncate so a huge HTML error page does not flood the logs.
            raise LLMError(
                f"LLM endpoint returned HTTP {resp.status_code}: {resp.text[:300]}"
            )

        try:
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise LLMError(f"LLM response had an unexpected shape: {exc}") from exc

        if not isinstance(content, str) or not content.strip():
            raise LLMError("LLM response message content was empty")
        return content

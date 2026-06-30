"""Single pydantic-settings Settings, loaded from .env (铁律七).

Startup validation is fail-fast (pydantic raises on missing required fields).
Use settings.masked_dict() to print the effective config with secrets redacted.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_REDACTED = "***"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- runtime ---
    ENV: str = "dev"
    LOG_LEVEL: str = "INFO"
    TZ: str = "UTC"
    BACKEND_PORT: int = 17011

    # --- database ---
    DATABASE_PROVIDER: str = "postgres"
    DB_HOST: str = "localhost"
    DB_PORT: int = 17012
    DB_USER: str = "ai-pulse"
    DB_PASSWORD: SecretStr
    DB_NAME: str = "ai-pulse"
    DB_POOL_SIZE: int = 10
    DB_SSL_MODE: str = "prefer"

    # --- cache ---
    CACHE_PROVIDER: str = "redis"
    CACHE_HOST: str = "localhost"
    CACHE_PORT: int = 17013
    CACHE_PASSWORD: SecretStr = SecretStr("")
    CACHE_DB: int = 0

    # --- object storage ---
    OBJECT_STORAGE_PROVIDER: str = "local"
    OBJECT_STORAGE_LOCAL_MODE: str = "filesystem"
    OBJECT_STORAGE_LOCAL_PATH: str = "./data/storage"
    OBJECT_STORAGE_BUCKET: str = "ai-pulse-media"
    OBJECT_STORAGE_ENDPOINT: str = ""
    OBJECT_STORAGE_ACCESS_KEY: SecretStr = SecretStr("")
    OBJECT_STORAGE_SECRET_KEY: SecretStr = SecretStr("")
    OBJECT_STORAGE_REGION: str = ""

    # --- app / security ---
    APP_SECRET_KEY: SecretStr
    SESSION_COOKIE_SECURE: bool = False
    CORS_ORIGINS: str = ""
    # Open self-service registration. True = anyone can create an account; set
    # False to lock the instance to existing accounts only (single-user mode).
    REGISTRATION_ENABLED: bool = True

    # --- ingest ---
    INGEST_WINDOW_DAYS: int = 7
    INGEST_INTERVAL_MINUTES: int = 60
    INGEST_ON_STARTUP: bool = True

    # --- translation (offline en->zh machine translation at ingest time) ---
    TRANSLATION_ENABLED: bool = True
    TRANSLATION_PROVIDER: str = "local"
    TRANSLATION_TARGET_LANG: str = "zh"

    # --- link enrichment (og:description for link-only items) ---
    # Hacker News / bare-link items carry no summary. When enabled, ingest fetches
    # the linked page's OWN <head> metadata (og:description / og:image) to give the
    # item a one-line preview, so the feed reads as content instead of a wall of
    # "原文" links. Reads only the page's self-declared meta, never body text;
    # polite (declared UA, short timeout, capped read size, HTML-only).
    ENRICH_OG_ENABLED: bool = True
    ENRICH_OG_TIMEOUT_SECONDS: float = 10.0
    ENRICH_OG_MAX_BYTES: int = 1_000_000
    ENRICH_OG_MAX_SUMMARY_CHARS: int = 480
    ENRICH_OG_CONCURRENCY: int = 4

    # --- LLM content enhancement (optional; off by default) ---
    # When effectively enabled (see ``llm_effective_enabled``) ingest enriches
    # each item via an OpenAI-compatible chat endpoint: fluent zh title/summary/
    # content + an AIHOT-style ``reason_zh``. When not enabled, ingest falls back
    # entirely to the offline argostranslate path (behaviour unchanged).
    LLM_ENABLED: bool = False
    LLM_PROVIDER: str = "openai-compatible"
    LLM_BASE_URL: str = ""
    LLM_API_KEY: SecretStr = SecretStr("")  # SECRET
    LLM_MODEL: str = ""
    LLM_TIMEOUT_SECONDS: int = 60
    LLM_MAX_TOKENS: int = 2048
    LLM_TEMPERATURE: float = 0.3
    LLM_CONCURRENCY: int = 2

    # --- observability / otel ---
    OTEL_TRACES_ENABLED: bool = False
    OTEL_EXPORTER_OTLP_METRICS_ENABLED: bool = False
    OTEL_TRACES_SAMPLER_ARG: float = 0.1

    @field_validator("LOG_LEVEL")
    @classmethod
    def _upper_log_level(cls, v: str) -> str:
        return v.upper()

    @model_validator(mode="after")
    def _validate_llm(self) -> "Settings":
        """Fail fast (铁律七) when LLM is switched on but mis-configured.

        Only enforced when ``LLM_ENABLED`` is True: in that case base_url / api_key
        / model must all be non-empty, otherwise startup crashes with a clear list
        of the missing fields. When ``LLM_ENABLED`` is False the LLM fields are
        ignored entirely (the offline argostranslate path is used).
        """
        if not self.LLM_ENABLED:
            return self
        missing: list[str] = []
        if not self.LLM_BASE_URL.strip():
            missing.append("LLM_BASE_URL")
        if not self.LLM_API_KEY.get_secret_value().strip():
            missing.append("LLM_API_KEY")
        if not self.LLM_MODEL.strip():
            missing.append("LLM_MODEL")
        if missing:
            raise ValueError(
                "LLM_ENABLED=True but required LLM settings are empty: "
                f"{', '.join(missing)}. Fill them in .env or set LLM_ENABLED=False."
            )
        return self

    @property
    def llm_effective_enabled(self) -> bool:
        """True only when LLM is on AND base_url / api_key / model are all set.

        This is the single switch business code checks: when False, ingest runs the
        offline argostranslate path exactly as before. With the startup validator
        above this is equivalent to ``LLM_ENABLED`` once the app has booted, but it
        is also safe to call in tests that build Settings directly.
        """
        return bool(
            self.LLM_ENABLED
            and self.LLM_BASE_URL.strip()
            and self.LLM_API_KEY.get_secret_value().strip()
            and self.LLM_MODEL.strip()
        )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    def masked_dict(self) -> dict[str, object]:
        """Effective config with all SecretStr fields redacted (for startup log)."""
        out: dict[str, object] = {}
        for name, value in self.model_dump().items():
            field = type(self).model_fields.get(name)
            anno = getattr(field, "annotation", None)
            if anno is SecretStr or isinstance(getattr(self, name), SecretStr):
                out[name] = _REDACTED
            else:
                out[name] = value
        # model_dump already converts SecretStr to "**********"; normalise to _REDACTED
        for name in ("DB_PASSWORD", "CACHE_PASSWORD", "APP_SECRET_KEY",
                     "OBJECT_STORAGE_ACCESS_KEY", "OBJECT_STORAGE_SECRET_KEY",
                     "LLM_API_KEY"):
            out[name] = _REDACTED
        return out


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]

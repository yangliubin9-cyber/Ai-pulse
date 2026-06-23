"""Single pydantic-settings Settings, loaded from .env (铁律七).

Startup validation is fail-fast (pydantic raises on missing required fields).
Use settings.masked_dict() to print the effective config with secrets redacted.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field, SecretStr, field_validator
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

    # --- ingest ---
    INGEST_WINDOW_DAYS: int = 7
    INGEST_INTERVAL_MINUTES: int = 60
    INGEST_ON_STARTUP: bool = True

    # --- translation (offline en->zh machine translation at ingest time) ---
    TRANSLATION_ENABLED: bool = True
    TRANSLATION_PROVIDER: str = "local"
    TRANSLATION_TARGET_LANG: str = "zh"

    # --- observability / otel ---
    OTEL_TRACES_ENABLED: bool = False
    OTEL_EXPORTER_OTLP_METRICS_ENABLED: bool = False
    OTEL_TRACES_SAMPLER_ARG: float = 0.1

    @field_validator("LOG_LEVEL")
    @classmethod
    def _upper_log_level(cls, v: str) -> str:
        return v.upper()

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
                     "OBJECT_STORAGE_ACCESS_KEY", "OBJECT_STORAGE_SECRET_KEY"):
            out[name] = _REDACTED
        return out


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]

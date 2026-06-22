"""Settings validation + masking."""

from __future__ import annotations

import os

import pytest
from pydantic import ValidationError


def test_settings_loads_and_masks(monkeypatch):
    from app.core.config import Settings

    monkeypatch.setenv("DB_PASSWORD", "supersecret")
    monkeypatch.setenv("APP_SECRET_KEY", "topsecretkey")
    s = Settings(_env_file=None)  # type: ignore[call-arg]
    masked = s.masked_dict()
    assert masked["DB_PASSWORD"] == "***"
    assert masked["APP_SECRET_KEY"] == "***"
    # Non-secret stays visible.
    assert masked["DB_NAME"] == s.DB_NAME
    # Secret value still retrievable via get_secret_value.
    assert s.DB_PASSWORD.get_secret_value() == "supersecret"


def test_settings_fail_fast_on_missing_required(monkeypatch):
    from app.core.config import Settings

    monkeypatch.delenv("DB_PASSWORD", raising=False)
    monkeypatch.delenv("APP_SECRET_KEY", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)  # type: ignore[call-arg]


def test_cors_origins_list(monkeypatch):
    from app.core.config import Settings

    monkeypatch.setenv("DB_PASSWORD", "x")
    monkeypatch.setenv("APP_SECRET_KEY", "y")
    monkeypatch.setenv("CORS_ORIGINS", "http://a.com, http://b.com ,")
    s = Settings(_env_file=None)  # type: ignore[call-arg]
    assert s.cors_origins_list == ["http://a.com", "http://b.com"]

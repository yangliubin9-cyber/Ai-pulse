"""scrypt password hashing."""

from __future__ import annotations

from app.core.security import (
    generate_session_token,
    hash_password,
    verify_password,
)


def test_hash_and_verify_roundtrip():
    pw_hash, salt = hash_password("correct horse battery staple")
    assert pw_hash != "correct horse battery staple"
    assert len(salt) == 32  # 16 bytes hex
    assert verify_password("correct horse battery staple", pw_hash, salt) is True
    assert verify_password("wrong", pw_hash, salt) is False


def test_same_password_different_salt_differs():
    h1, s1 = hash_password("pw")
    h2, s2 = hash_password("pw")
    assert s1 != s2
    assert h1 != h2


def test_provided_salt_is_deterministic():
    h1, s1 = hash_password("pw", salt="00" * 16)
    h2, s2 = hash_password("pw", salt="00" * 16)
    assert h1 == h2
    assert s1 == s2 == "00" * 16


def test_session_token_unique():
    assert generate_session_token() != generate_session_token()

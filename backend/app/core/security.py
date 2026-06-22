"""Password hashing (stdlib scrypt) + session token helpers.

scrypt params: n=2^14, r=8, p=1, dklen=64; 16-byte random salt; hmac.compare_digest.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets

_SCRYPT_N = 2 ** 14
_SCRYPT_R = 8
_SCRYPT_P = 1
_DKLEN = 64
_SALT_BYTES = 16


def generate_salt() -> str:
    return secrets.token_hex(_SALT_BYTES)


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    """Return (password_hash_hex, salt_hex). Generates a salt if none given."""
    if salt is None:
        salt = generate_salt()
    derived = hashlib.scrypt(
        password.encode("utf-8"),
        salt=bytes.fromhex(salt),
        n=_SCRYPT_N,
        r=_SCRYPT_R,
        p=_SCRYPT_P,
        dklen=_DKLEN,
        maxmem=0,
    )
    return derived.hex(), salt


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    candidate, _ = hash_password(password, salt)
    return hmac.compare_digest(candidate, password_hash)


def generate_session_token() -> str:
    return secrets.token_urlsafe(32)

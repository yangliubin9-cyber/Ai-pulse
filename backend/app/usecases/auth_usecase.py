"""Auth orchestration: login lockout, sessions, password change, admin seeding."""

from __future__ import annotations

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import (
    DEFAULT_ADMIN_EMAIL,
    DEFAULT_ADMIN_PASSWORD,
    LOGIN_FAIL_KEY_PREFIX,
    LOGIN_FAIL_LIMIT,
    LOGIN_LOCK_SECONDS,
    SESSION_KEY_PREFIX,
    SESSION_TTL_SECONDS,
)
from app.core.errors import (
    InvalidCredentialsError,
    OldPasswordWrongError,
    TooManyAttemptsError,
)
from app.core.security import (
    generate_session_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.services.cache.base import CacheAdapter

logger = structlog.get_logger(__name__)


class AuthUsecase:
    def __init__(self, session: AsyncSession, cache: CacheAdapter) -> None:
        self._session = session
        self._cache = cache
        self._repo = UserRepository(session)

    @staticmethod
    def _fail_key(email: str) -> str:
        return f"{LOGIN_FAIL_KEY_PREFIX}:{email}"

    @staticmethod
    def _session_key(token: str) -> str:
        return f"{SESSION_KEY_PREFIX}:{token}"

    async def login(self, email: str, password: str) -> User:
        fail_key = self._fail_key(email)
        count = await self._cache.get(fail_key)
        if int(count or 0) >= LOGIN_FAIL_LIMIT:
            raise TooManyAttemptsError()

        user = await self._repo.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash, user.password_salt):
            await self._cache.incr(fail_key, ttl=LOGIN_LOCK_SECONDS)
            raise InvalidCredentialsError()

        await self._cache.delete(fail_key)
        return user

    async def create_session(self, user_id: str) -> str:
        token = generate_session_token()
        await self._cache.set(self._session_key(token), user_id, ttl=SESSION_TTL_SECONDS)
        return token

    async def get_user_id_by_token(self, token: str) -> str | None:
        return await self._cache.get(self._session_key(token))

    async def logout(self, token: str) -> None:
        await self._cache.delete(self._session_key(token))

    async def get_user(self, user_id: str) -> User | None:
        return await self._repo.get_by_id(user_id)

    async def change_password(self, user_id: str, old: str, new: str) -> None:
        user = await self._repo.get_by_id(user_id)
        if user is None or not verify_password(old, user.password_hash, user.password_salt):
            raise OldPasswordWrongError()
        new_hash, new_salt = hash_password(new)
        user.password_hash = new_hash
        user.password_salt = new_salt
        await self._repo.update(user)
        await self._session.commit()

    async def seed_default_admin(self) -> bool:
        if await self._repo.count() > 0:
            return False
        password_hash, salt = hash_password(DEFAULT_ADMIN_PASSWORD)
        user = User(
            email=DEFAULT_ADMIN_EMAIL,
            password_hash=password_hash,
            password_salt=salt,
        )
        await self._repo.create(user)
        await self._session.commit()
        return True

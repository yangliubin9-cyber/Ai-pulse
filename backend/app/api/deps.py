"""FastAPI dependencies: DB session, cache, current user resolution."""

from __future__ import annotations

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache import get_cache
from app.constants import SESSION_COOKIE_NAME, SESSION_KEY_PREFIX
from app.core.errors import UnauthorizedError
from app.db import get_session
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.services.cache.base import CacheAdapter

# Re-export the underlying providers as the dependency callables.
get_db = get_session
get_cache_dep = get_cache


async def get_current_user_id(
    request: Request,
    cache: CacheAdapter = Depends(get_cache_dep),
) -> str:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise UnauthorizedError()
    user_id = await cache.get(f"{SESSION_KEY_PREFIX}:{token}")
    if user_id is None:
        raise UnauthorizedError()
    return user_id


async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db),
) -> User:
    user = await UserRepository(session).get_by_id(user_id)
    if user is None:
        raise UnauthorizedError()
    return user

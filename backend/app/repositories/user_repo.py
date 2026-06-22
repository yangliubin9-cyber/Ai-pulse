"""Data access for User (SQLAlchemy 2 async ORM only)."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_email(self, email: str) -> User | None:
        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def get_by_id(self, id: str) -> User | None:
        result = await self._session.execute(select(User).where(User.id == id))
        return result.scalars().first()

    async def create(self, user: User) -> User:
        self._session.add(user)
        await self._session.flush()
        return user

    async def count(self) -> int:
        result = await self._session.execute(select(func.count()).select_from(User))
        return int(result.scalar_one())

    async def update(self, user: User) -> User:
        self._session.add(user)
        await self._session.flush()
        return user

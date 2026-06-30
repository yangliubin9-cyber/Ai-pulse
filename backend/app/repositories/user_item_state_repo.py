"""Data access for UserItemState — per-user saved/read flags."""

from __future__ import annotations

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import utcnow
from app.models.feed_item import FeedItem
from app.models.user_item_state import UserItemState


class UserItemStateRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, user_id: str, item_id: str) -> UserItemState | None:
        result = await self._session.execute(
            select(UserItemState).where(
                UserItemState.user_id == user_id, UserItemState.item_id == item_id
            )
        )
        return result.scalars().first()

    async def states_for(self, user_id: str, item_ids: list[str]) -> dict[str, UserItemState]:
        """Bulk-load this user's state rows for the given items (item_id -> state)."""
        if not item_ids:
            return {}
        result = await self._session.execute(
            select(UserItemState).where(
                UserItemState.user_id == user_id, UserItemState.item_id.in_(item_ids)
            )
        )
        return {s.item_id: s for s in result.scalars().all()}

    async def _get_or_create(self, user_id: str, item_id: str) -> UserItemState:
        state = await self.get(user_id, item_id)
        if state is None:
            state = UserItemState(user_id=user_id, item_id=item_id, saved=False, read=False)
            self._session.add(state)
            await self._session.flush()
        return state

    async def set_saved(self, user_id: str, item_id: str, saved: bool) -> UserItemState:
        state = await self._get_or_create(user_id, item_id)
        state.saved = saved
        state.saved_at = utcnow() if saved else None
        await self._session.flush()
        return state

    async def set_read(self, user_id: str, item_id: str, read: bool = True) -> UserItemState:
        state = await self._get_or_create(user_id, item_id)
        state.read = read
        state.read_at = utcnow() if read else None
        await self._session.flush()
        return state

    async def mark_all_read(self, user_id: str) -> int:
        """Mark every item read for this user. Returns the number newly marked.

        Flips existing unread rows to read, then inserts read rows for items the
        user has no state row for yet. Idempotent (a second call marks 0).
        """
        total = (await self._session.execute(select(func.count()).select_from(FeedItem))).scalar_one()
        already_read = (
            await self._session.execute(
                select(func.count())
                .select_from(UserItemState)
                .where(UserItemState.user_id == user_id, UserItemState.read.is_(True))
            )
        ).scalar_one()
        newly = int(total) - int(already_read)

        now = utcnow()
        await self._session.execute(
            update(UserItemState)
            .where(UserItemState.user_id == user_id, UserItemState.read.is_(False))
            .values(read=True, read_at=now)
        )
        existing = await self._session.execute(
            select(UserItemState.item_id).where(UserItemState.user_id == user_id)
        )
        existing_ids = set(existing.scalars().all())
        all_ids = (await self._session.execute(select(FeedItem.id))).scalars().all()
        for item_id in all_ids:
            if item_id not in existing_ids:
                self._session.add(
                    UserItemState(
                        user_id=user_id, item_id=item_id, saved=False, read=True, read_at=now
                    )
                )
        await self._session.flush()
        return max(0, newly)

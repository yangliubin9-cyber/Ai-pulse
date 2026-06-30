"""Per-user item state orchestration: saved (bookmark) + read/unread.

Thin usecase over ``UserItemStateRepository`` so the API layer stays free of data
access, mirroring ``FeedUsecase``. The caller (endpoint) owns the commit.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_item_state import UserItemState
from app.repositories.user_item_state_repo import UserItemStateRepository


class ItemStateUsecase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = UserItemStateRepository(session)

    async def set_saved(self, user_id: str, item_id: str, saved: bool) -> bool:
        state = await self._repo.set_saved(user_id, item_id, saved)
        return state.saved

    async def mark_read(self, user_id: str, item_id: str) -> None:
        await self._repo.set_read(user_id, item_id, True)

    async def mark_all_read(self, user_id: str) -> int:
        return await self._repo.mark_all_read(user_id)

    async def states_for(
        self, user_id: str, item_ids: list[str]
    ) -> dict[str, UserItemState]:
        return await self._repo.states_for(user_id, item_ids)

    async def state_for(self, user_id: str, item_id: str) -> UserItemState | None:
        return await self._repo.get(user_id, item_id)

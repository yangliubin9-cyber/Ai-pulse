"""Feed item endpoints (auth required)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db
from app.schemas.feed_item import (
    FeedItemDetailOut,
    FeedItemListResponse,
    FeedItemOut,
)
from app.usecases.feed_usecase import FeedUsecase
from app.usecases.item_state_usecase import ItemStateUsecase

router = APIRouter(tags=["items"])


class SaveIn(BaseModel):
    saved: bool


@router.get("/items", response_model=FeedItemListResponse)
async def list_items(
    category: str | None = Query(default=None),
    source_type: str | None = Query(default=None),
    featured: bool = Query(default=False),
    q: str | None = Query(default=None, description="Fuzzy match on title/summary (ILIKE)"),
    saved: bool | None = Query(default=None, description="Only items the current user saved"),
    unread: bool | None = Query(default=None, description="Only items the user hasn't read"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db),
) -> FeedItemListResponse:
    items, total = await FeedUsecase(session).list_items(
        category=category,
        source_type=source_type,
        featured=featured,
        q=q,
        page=page,
        page_size=page_size,
        user_id=user_id,
        saved=saved,
        unread=unread,
    )
    # Annotate each item with this user's saved/read flags (default False).
    states = await ItemStateUsecase(session).states_for(user_id, [i.id for i in items])
    out: list[FeedItemOut] = []
    for i in items:
        o = FeedItemOut.model_validate(i)
        st = states.get(i.id)
        if st is not None:
            o.saved = st.saved
            o.read = st.read
        out.append(o)
    return FeedItemListResponse(items=out, total=total, page=page, page_size=page_size)


@router.post("/items/read-all")
async def mark_all_read(
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db),
) -> dict:
    """Mark every item read for the current user. Returns how many were newly marked."""
    marked = await ItemStateUsecase(session).mark_all_read(user_id)
    await session.commit()
    return {"marked": marked}


@router.get("/items/{item_id}", response_model=FeedItemDetailOut)
async def get_item(
    item_id: str,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db),
) -> FeedItemDetailOut:
    # Detail view carries the full article body (content / content_zh); lists do not.
    item = await FeedUsecase(session).get_item(item_id)
    out = FeedItemDetailOut.model_validate(item)
    st = await ItemStateUsecase(session).state_for(user_id, item.id)
    if st is not None:
        out.saved = st.saved
        out.read = st.read
    return out


@router.post("/items/{item_id}/save")
async def save_item(
    item_id: str,
    body: SaveIn,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db),
) -> dict:
    """Toggle the saved (bookmark) flag for an item."""
    saved = await ItemStateUsecase(session).set_saved(user_id, item_id, body.saved)
    await session.commit()
    return {"saved": saved}


@router.post("/items/{item_id}/read")
async def mark_read(
    item_id: str,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db),
) -> dict:
    """Mark a single item read (called when the detail page opens)."""
    await ItemStateUsecase(session).mark_read(user_id, item_id)
    await session.commit()
    return {"read": True}

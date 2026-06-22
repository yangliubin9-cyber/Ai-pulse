"""Feed item endpoints (auth required)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db
from app.schemas.feed_item import FeedItemListResponse, FeedItemOut
from app.usecases.feed_usecase import FeedUsecase

router = APIRouter(tags=["items"])


@router.get("/items", response_model=FeedItemListResponse)
async def list_items(
    category: str | None = Query(default=None),
    source_type: str | None = Query(default=None),
    featured: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db),
) -> FeedItemListResponse:
    items, total = await FeedUsecase(session).list_items(
        category=category,
        source_type=source_type,
        featured=featured,
        page=page,
        page_size=page_size,
    )
    return FeedItemListResponse(
        items=[FeedItemOut.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/items/{item_id}", response_model=FeedItemOut)
async def get_item(
    item_id: str,
    _user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db),
) -> FeedItemOut:
    item = await FeedUsecase(session).get_item(item_id)
    return FeedItemOut.model_validate(item)

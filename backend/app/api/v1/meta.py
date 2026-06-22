"""Meta endpoints: categories, sources, stats, daily digest (auth required)."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db
from app.core.errors import AppError
from app.schemas.feed_item import (
    CategoryCount,
    FeedItemOut,
    SourceCount,
    StatsResponse,
)
from app.usecases.feed_usecase import FeedUsecase

router = APIRouter(tags=["meta"])


@router.get("/categories", response_model=list[CategoryCount])
async def categories(
    _user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db),
) -> list[CategoryCount]:
    rows = await FeedUsecase(session).categories()
    return [CategoryCount(**row) for row in rows]


@router.get("/sources", response_model=list[SourceCount])
async def sources(
    _user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db),
) -> list[SourceCount]:
    rows = await FeedUsecase(session).sources()
    return [SourceCount(**row) for row in rows]


@router.get("/stats", response_model=StatsResponse)
async def stats(
    _user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db),
) -> StatsResponse:
    return StatsResponse(**await FeedUsecase(session).stats())


@router.get("/daily")
async def daily(
    date: str | None = Query(default=None),
    _user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db),
) -> dict:
    day: date | None = None
    if date:
        try:
            from datetime import date as _date

            day = _date.fromisoformat(date)
        except ValueError as exc:
            raise AppError(
                "VALIDATION_ERROR", "date 格式应为 YYYY-MM-DD", 400
            ) from exc
    items, used_date = await FeedUsecase(session).daily(day)
    return {
        "date": used_date.isoformat() if used_date is not None else None,
        "items": [FeedItemOut.model_validate(i).model_dump() for i in items],
        "total": len(items),
    }

"""Ingest trigger endpoint (auth required)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db
from app.schemas.feed_item import IngestResult
from app.usecases.ingest_usecase import IngestUsecase

router = APIRouter(tags=["ingest"])


@router.post("/ingest/run", response_model=IngestResult)
async def run_ingest(
    _user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_db),
) -> IngestResult:
    result = await IngestUsecase(session).run(trigger="manual")
    return IngestResult(**result)

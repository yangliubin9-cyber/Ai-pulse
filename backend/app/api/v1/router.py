"""v1 API router: combines auth, items, meta, ingest sub-routers.

Final mount prefix (/api/v1) is applied in app.main.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import auth, ingest, items, meta

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(items.router)
api_router.include_router(meta.router)
api_router.include_router(ingest.router)

"""Auth endpoints: login, logout, me, change-password."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_cache_dep, get_current_user, get_db
from app.constants import SESSION_COOKIE_NAME, SESSION_TTL_SECONDS
from app.core.config import get_settings
from app.core.errors import RegistrationDisabledError
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    UserOut,
)
from app.services.cache.base import CacheAdapter
from app.usecases.auth_usecase import AuthUsecase

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(
    body: LoginRequest,
    response: Response,
    session: AsyncSession = Depends(get_db),
    cache: CacheAdapter = Depends(get_cache_dep),
) -> LoginResponse:
    usecase = AuthUsecase(session, cache)
    user = await usecase.login(body.email, body.password)
    token = await usecase.create_session(user.id)
    settings = get_settings()
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=SESSION_TTL_SECONDS,
        httponly=True,
        samesite="lax",
        secure=settings.SESSION_COOKIE_SECURE,
        path="/",
    )
    return LoginResponse(user=UserOut(id=user.id, email=user.email))


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    response: Response,
    session: AsyncSession = Depends(get_db),
    cache: CacheAdapter = Depends(get_cache_dep),
) -> LoginResponse:
    settings = get_settings()
    if not settings.REGISTRATION_ENABLED:
        raise RegistrationDisabledError()
    usecase = AuthUsecase(session, cache)
    user = await usecase.register(body.email, body.password)
    # Registration logs the new user straight in (same session cookie as login).
    token = await usecase.create_session(user.id)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=SESSION_TTL_SECONDS,
        httponly=True,
        samesite="lax",
        secure=settings.SESSION_COOKIE_SECURE,
        path="/",
    )
    return LoginResponse(user=UserOut(id=user.id, email=user.email))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_db),
    cache: CacheAdapter = Depends(get_cache_dep),
) -> Response:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token:
        await AuthUsecase(session, cache).logout(token)
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", status_code=status.HTTP_200_OK)
async def me(user: User = Depends(get_current_user)) -> dict:
    return {"id": user.id, "email": user.email}


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    cache: CacheAdapter = Depends(get_cache_dep),
) -> Response:
    await AuthUsecase(session, cache).change_password(
        user.id, body.old_password, body.new_password
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)

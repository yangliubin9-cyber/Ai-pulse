"""Unified error structure + global exception handlers.

Response shape: {"error": {"code", "message", "request_id", "details": {}}}
Error codes are UPPER_SNAKE_CASE.
"""

from __future__ import annotations

from typing import Any

import structlog
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = structlog.get_logger(__name__)


class AppError(Exception):
    """Base application error carrying a stable code + HTTP status."""

    def __init__(
        self,
        code: str,
        message: str,
        http_status: int = status.HTTP_400_BAD_REQUEST,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.http_status = http_status
        self.details = details or {}


# --- common concrete errors ---
class UnauthorizedError(AppError):
    def __init__(self, message: str = "未登录或会话已过期") -> None:
        super().__init__("UNAUTHORIZED", message, status.HTTP_401_UNAUTHORIZED)


class InvalidCredentialsError(AppError):
    def __init__(self, message: str = "邮箱或密码不正确") -> None:
        super().__init__("AUTH_INVALID_CREDENTIALS", message, status.HTTP_401_UNAUTHORIZED)


class TooManyAttemptsError(AppError):
    def __init__(self, message: str = "登录失败次数过多，请稍后再试") -> None:
        super().__init__("AUTH_TOO_MANY_ATTEMPTS", message, status.HTTP_429_TOO_MANY_REQUESTS)


class OldPasswordWrongError(AppError):
    def __init__(self, message: str = "旧密码不正确") -> None:
        super().__init__("AUTH_OLD_PASSWORD_WRONG", message, status.HTTP_400_BAD_REQUEST)


class NotFoundError(AppError):
    def __init__(self, message: str = "资源不存在") -> None:
        super().__init__("NOT_FOUND", message, status.HTTP_404_NOT_FOUND)


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "") or request.headers.get("X-Request-Id", "")


def _payload(code: str, message: str, request_id: str, details: dict[str, Any]) -> dict[str, Any]:
    return {"error": {"code": code, "message": message, "request_id": request_id, "details": details}}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        rid = _request_id(request)
        logger.warning("app_error", code=exc.code, message=exc.message, request_id=rid)
        return JSONResponse(
            status_code=exc.http_status,
            content=_payload(exc.code, exc.message, rid, exc.details),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http_exc_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        rid = _request_id(request)
        code = "NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR"
        message = exc.detail if isinstance(exc.detail, str) else "请求出错"
        return JSONResponse(
            status_code=exc.status_code,
            content=_payload(code, message, rid, {}),
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        rid = _request_id(request)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_payload("VALIDATION_ERROR", "请求参数校验失败", rid, {"errors": exc.errors()}),
        )

    @app.exception_handler(Exception)
    async def _unhandled_handler(request: Request, exc: Exception) -> JSONResponse:
        rid = _request_id(request)
        logger.error("unhandled_error", error=str(exc), request_id=rid, exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_payload("INTERNAL_ERROR", "服务器内部错误", rid, {}),
        )

"""Auth in/out schemas (pydantic v2).

email is a plain str (not EmailStr) to avoid the email-validator dependency.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    email: str


class LoginResponse(BaseModel):
    user: UserOut


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8)

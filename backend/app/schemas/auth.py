"""Auth in/out schemas (pydantic v2).

email is a plain str (not EmailStr) to avoid the email-validator dependency; it
is normalised to lowercase + trimmed so login / register stay case-insensitive
and a single account can't be duplicated by case.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def _norm_email(cls, v: str) -> str:
        return v.strip().lower()


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def _norm_email(cls, v: str) -> str:
        v = v.strip().lower()
        # Cheap shape check (no email-validator dep): require a@b.c-ish form.
        if "@" not in v or "." not in v.rsplit("@", 1)[-1]:
            raise ValueError("邮箱格式不正确")
        return v


class UserOut(BaseModel):
    id: str
    email: str


class LoginResponse(BaseModel):
    user: UserOut


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8)

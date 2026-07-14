"""Pydantic schemas for customer PWA authentication and profile."""

import uuid
from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.base import CamelModel


class NotificationSettings(CamelModel):
    order_updates: bool = True
    promotions: bool = True
    prescription_updates: bool = True
    support_updates: bool = True


class CustomerProfileResponse(CamelModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr | None
    phone_number: str
    preferred_language: str
    created_at: datetime
    avatar_url: str | None = None
    default_address_id: uuid.UUID | None = None
    notification_settings: NotificationSettings
    theme: str


class RegisterRequest(CamelModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone_number: str = Field(..., min_length=7, max_length=32)
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(CamelModel):
    identifier: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class ForgotPasswordRequest(CamelModel):
    email: EmailStr


class AuthResponse(CamelModel):
    user: CustomerProfileResponse
    token: str


class ProfileUpdateRequest(CamelModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone_number: str | None = None
    preferred_language: str | None = None
    theme: str | None = None
    default_address_id: uuid.UUID | None = None
    notification_settings: NotificationSettings | None = None

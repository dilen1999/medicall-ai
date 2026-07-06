"""Pydantic schemas for the Customer resource."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    phone_number: str = Field(..., min_length=5, max_length=32)
    email: EmailStr | None = None
    language: str = Field(default="English", max_length=64)
    country: str | None = Field(default=None, max_length=128)


class CustomerResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    phone_number: str
    email: str | None
    language: str
    country: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

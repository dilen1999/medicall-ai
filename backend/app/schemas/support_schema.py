"""Pydantic schemas for customer support cases and the AI chat panel."""

import uuid
from datetime import datetime

from pydantic import Field

from app.schemas.base import CamelModel


class SupportMessageResponse(CamelModel):
    id: uuid.UUID
    case_id: uuid.UUID
    sender: str
    message: str
    created_at: datetime


class SupportCaseCreate(CamelModel):
    related_order_id: uuid.UUID | None = None
    category: str
    description: str = Field(..., min_length=10)
    preferred_contact_method: str
    preferred_callback_time: str | None = None


class SupportCaseResponse(CamelModel):
    id: uuid.UUID
    reference: str
    related_order_id: uuid.UUID | None
    category: str
    description: str
    status: str
    preferred_contact_method: str
    preferred_callback_time: str | None
    created_at: datetime
    updated_at: datetime
    messages: list[SupportMessageResponse]


class PostMessageRequest(CamelModel):
    message: str = Field(..., min_length=1)


class PharmacistCallbackRequest(CamelModel):
    related_order_id: uuid.UUID | None = None
    preferred_callback_time: str | None = None
    description: str = Field(..., min_length=1)


class ChatMessageRequest(CamelModel):
    message: str = Field(..., min_length=1)


class ChatMessageResponse(CamelModel):
    id: str
    sender: str
    message: str
    created_at: datetime
    is_escalation: bool = False

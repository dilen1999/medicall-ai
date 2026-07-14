"""Pydantic schemas for the customer-facing in-app notification feed."""

import uuid
from datetime import datetime

from app.schemas.base import CamelModel


class CustomerNotificationResponse(CamelModel):
    id: uuid.UUID
    type: str
    title: str
    message: str
    created_at: datetime
    read: bool
    link_to: str | None

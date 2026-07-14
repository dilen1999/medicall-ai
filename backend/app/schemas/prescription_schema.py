"""Pydantic schemas for customer prescription uploads."""

import uuid
from datetime import datetime

from app.schemas.base import CamelModel


class PrescriptionResponse(CamelModel):
    id: uuid.UUID
    file_name: str
    file_type: str
    note: str | None
    status: str
    submitted_at: datetime
    reviewed_at: datetime | None
    pharmacist_note: str | None
    linked_order_id: uuid.UUID | None

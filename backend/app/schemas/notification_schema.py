"""Pydantic schemas for the human/pharmacist handoff notification endpoint."""

from pydantic import BaseModel, Field


class HandoffNotificationRequest(BaseModel):
    """
    Body for POST /notifications/handoff. Mirrors the shape of a single
    HandoffCaseResponse so n8n can forward a handoff-cases row straight
    through without reshaping it.
    """

    order_reference: str = Field(..., min_length=1, max_length=64)
    customer_name: str = Field(..., min_length=1, max_length=255)
    phone_number: str = Field(..., min_length=1, max_length=32)
    issue_type: str
    priority: str
    pharmacist_required: bool = False
    summary: str


class HandoffNotificationResponse(BaseModel):
    sent: bool
    detail: str

"""Pydantic schemas for MedicineOrder and OrderItem resources."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.medicine_order import DeliveryStatus


class OrderItemCreate(BaseModel):
    medicine_name: str = Field(..., min_length=1, max_length=255)
    quantity: int = Field(..., gt=0)
    dosage_label: str | None = Field(default=None, max_length=255)
    prescription_item: bool = False


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    medicine_name: str
    quantity: int
    dosage_label: str | None
    prescription_item: bool

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    order_reference: str = Field(..., min_length=1, max_length=64)
    customer_id: uuid.UUID
    delivery_status: DeliveryStatus = DeliveryStatus.PENDING
    total_amount: float = Field(..., ge=0)
    prescription_required: bool = False
    items: list[OrderItemCreate] = Field(default_factory=list)


class OrderStatusUpdate(BaseModel):
    delivery_status: DeliveryStatus


class OrderResponse(BaseModel):
    id: uuid.UUID
    order_reference: str
    customer_id: uuid.UUID
    delivery_status: str
    delivery_date: datetime | None
    total_amount: float
    prescription_required: bool
    call_status: str
    twilio_call_sid: str | None
    created_at: datetime
    items: list[OrderItemResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# --- n8n integration schemas ---


class PendingCallCustomer(BaseModel):
    """Nested customer shape returned to n8n by GET /orders/pending-calls."""

    id: uuid.UUID
    full_name: str
    phone_number: str
    email: str | None

    model_config = ConfigDict(from_attributes=True)


class PendingCallItem(BaseModel):
    medicine_name: str
    quantity: int

    model_config = ConfigDict(from_attributes=True)


class PendingCallOrderResponse(BaseModel):
    """
    Shape n8n's 'Get Pending Delivered Orders' HTTP node consumes: enough to
    place the Twilio call (customer.phone_number) and build the greeting
    (items) without a second round-trip to FastAPI.
    """

    id: uuid.UUID
    order_reference: str
    delivery_status: str
    call_status: str
    customer: PendingCallCustomer
    items: list[PendingCallItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class MarkCallTriggeredRequest(BaseModel):
    """Body for POST /orders/{order_id}/mark-call-triggered."""

    twilio_call_sid: str | None = Field(default=None, max_length=64)


class MarkCallFailedRequest(BaseModel):
    """Body for POST /orders/{order_id}/mark-call-failed."""

    reason: str | None = Field(default=None, max_length=512)

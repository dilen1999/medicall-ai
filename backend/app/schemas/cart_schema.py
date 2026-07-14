"""Pydantic schemas for cart validation and checkout price preview.

Only `product_id`, `quantity` and (optionally) `prescription_id` are trusted
from the client - price, stock and prescription approval are always
re-derived server-side from the database, never taken from the request
body, so a tampered client payload cannot under-charge an order or bypass
prescription checks.
"""

import uuid

from pydantic import Field

from app.schemas.base import CamelModel


class CartItemInput(CamelModel):
    product_id: uuid.UUID
    quantity: int = Field(..., ge=1)
    prescription_id: uuid.UUID | None = None


class CartValidateRequest(CamelModel):
    items: list[CartItemInput]


class CartValidateResponse(CamelModel):
    valid: bool
    errors: list[str]


class CheckoutPreviewRequest(CamelModel):
    items: list[CartItemInput]
    delivery_method: str
    promotion_code: str | None = None


class CheckoutPreviewResponse(CamelModel):
    subtotal: float
    delivery_fee: float
    service_fee: float
    discount: float
    tax: float
    total: float
    promotion_applied: str | None = None
    promotion_error: str | None = None
    estimated_delivery_window: str | None = None

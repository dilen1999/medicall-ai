"""Pydantic schemas for the customer address book."""

import uuid

from pydantic import Field

from app.schemas.base import CamelModel


class AddressInput(CamelModel):
    label: str = Field(..., min_length=1, max_length=64)
    recipient_name: str = Field(..., min_length=1, max_length=255)
    phone_number: str = Field(..., min_length=5, max_length=32)
    address_line1: str = Field(..., min_length=1, max_length=255)
    address_line2: str | None = Field(default=None, max_length=255)
    city: str = Field(..., min_length=1, max_length=128)
    postal_code: str = Field(..., min_length=1, max_length=32)
    latitude: float | None = None
    longitude: float | None = None
    delivery_instructions: str | None = None
    is_default: bool = False


class AddressUpdate(CamelModel):
    label: str | None = None
    recipient_name: str | None = None
    phone_number: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    postal_code: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    delivery_instructions: str | None = None
    is_default: bool | None = None


class AddressResponse(CamelModel):
    id: uuid.UUID
    label: str
    recipient_name: str
    phone_number: str
    address_line1: str
    address_line2: str | None
    city: str
    postal_code: str
    latitude: float | None
    longitude: float | None
    delivery_instructions: str | None
    is_default: bool

"""Pydantic schemas for storefront (customer PWA) cart checkout and orders."""

import uuid
from datetime import datetime

from app.schemas.address_schema import AddressResponse
from app.schemas.base import CamelModel
from app.schemas.cart_schema import CartItemInput


class CreateOrderRequest(CamelModel):
    items: list[CartItemInput]
    address_id: uuid.UUID
    delivery_method: str
    delivery_time_slot: str
    payment_method: str
    promotion_code: str | None = None


class OrderItemResponse(CamelModel):
    id: uuid.UUID
    product_id: uuid.UUID | None
    name: str
    image: str | None
    price: float
    quantity: int
    prescription_required: bool


class OrderTimelineEntryResponse(CamelModel):
    status: str
    label: str
    timestamp: datetime | None
    completed: bool


class OrderResponse(CamelModel):
    id: uuid.UUID
    reference: str
    created_at: datetime
    status: str
    items: list[OrderItemResponse]
    pharmacy_id: str | None
    pharmacy_name: str | None
    delivery_address: AddressResponse | None
    delivery_method: str | None
    delivery_time_slot: str | None
    payment_method: str | None
    payment_status: str | None
    subtotal: float = 0
    delivery_fee: float = 0
    service_fee: float = 0
    discount: float = 0
    tax: float = 0
    total: float = 0
    estimated_delivery: datetime | None
    promotion_code: str | None
    cancellable: bool
    timeline: list[OrderTimelineEntryResponse]


class DriverResponse(CamelModel):
    id: str
    name: str
    vehicle_number: str
    phone_number: str
    rating: float


class DriverLocationResponse(CamelModel):
    latitude: float
    longitude: float
    updated_at: datetime


class DeliveryTrackingResponse(CamelModel):
    order_id: uuid.UUID
    status: str
    estimated_arrival: datetime | None
    driver: DriverResponse | None
    driver_location: DriverLocationResponse | None
    last_updated: datetime
    delivery_instructions: str | None = None


class ReorderItemResponse(CamelModel):
    product_id: uuid.UUID
    name: str
    image: str
    price: float
    quantity: int
    pack_size: str
    stock_quantity: int
    prescription_required: bool
    pharmacy_id: str
    pharmacy_name: str

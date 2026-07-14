"""Pydantic schemas for the storefront product catalogue."""

import uuid

from app.schemas.base import CamelModel


class CategoryResponse(CamelModel):
    id: uuid.UUID
    name: str
    icon: str
    product_count: int


class ProductResponse(CamelModel):
    id: uuid.UUID
    name: str
    brand: str
    generic_name: str | None = None
    manufacturer: str
    category: str
    description: str
    storage_information: str
    image: str
    price: float
    pack_size: str
    stock_quantity: int
    prescription_required: bool
    pharmacy_id: str
    pharmacy_name: str
    rating: float
    availability: str
    related_product_ids: list[str]


class PaginatedProductResponse(CamelModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    has_more: bool

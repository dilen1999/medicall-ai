"""Storefront product catalogue routes (public - no auth required to browse)."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.product_schema import CategoryResponse, PaginatedProductResponse, ProductResponse
from app.services import product_service

router = APIRouter(tags=["Products"])


@router.get("/products", response_model=PaginatedProductResponse)
def list_products(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    brand: str | None = Query(default=None),
    prescriptionRequired: bool | None = Query(default=None),
    availability: str | None = Query(default=None),
    minPrice: float | None = Query(default=None),
    maxPrice: float | None = Query(default=None),
    sortBy: str | None = Query(default=None),
    sortDirection: str = Query(default="asc"),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return product_service.list_products(
        db,
        search=search,
        category=category,
        brand=brand,
        prescription_required=prescriptionRequired,
        availability=availability,
        min_price=minPrice,
        max_price=maxPrice,
        sort_by=sortBy,
        sort_direction=sortDirection,
        page=page,
        page_size=pageSize,
    )


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: uuid.UUID, db: Session = Depends(get_db)):
    return product_service.get_product(db, product_id)


@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return product_service.list_categories(db)

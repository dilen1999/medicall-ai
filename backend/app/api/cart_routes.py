"""Cart validation and checkout price preview routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_customer, get_db
from app.models.customer import Customer
from app.schemas.cart_schema import (
    CartValidateRequest,
    CartValidateResponse,
    CheckoutPreviewRequest,
    CheckoutPreviewResponse,
)
from app.services import cart_service

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.post("/validate", response_model=CartValidateResponse)
def validate_cart(
    payload: CartValidateRequest,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    return cart_service.validate_cart(db, customer, payload.items)


@router.post("/apply-promotion", response_model=CheckoutPreviewResponse)
def checkout_preview(
    payload: CheckoutPreviewRequest,
    _customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    return cart_service.compute_preview(db, payload.items, payload.delivery_method, payload.promotion_code)

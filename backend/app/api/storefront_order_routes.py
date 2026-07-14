"""Customer PWA cart-checkout, order history and delivery-tracking routes.

Deliberately mounted under /storefront/orders rather than /orders: the
existing /orders router (app/api/order_routes.py) is the unauthenticated
n8n/Twilio voice-call-confirmation surface (POST /orders takes a raw
customer_id + medicine items, no login). Reusing that path for the
customer-authenticated cart/checkout flow would collide route-for-route
with it and require changing behaviour that pipeline depends on, so the
storefront gets its own prefix instead - both ultimately read/write the same
`medicine_orders` table (see storefront_order_service.py).
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_customer, get_db
from app.models.customer import Customer
from app.schemas.storefront_order_schema import CreateOrderRequest, DeliveryTrackingResponse, OrderResponse, ReorderItemResponse
from app.services import storefront_order_service

router = APIRouter(prefix="/storefront/orders", tags=["Storefront Orders"])


@router.get("", response_model=list[OrderResponse])
def list_orders(customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    return storefront_order_service.list_orders(db, customer)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: uuid.UUID, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    return storefront_order_service.get_order(db, customer, order_id)


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(
    payload: CreateOrderRequest,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    return storefront_order_service.create_order(
        db,
        customer,
        items=payload.items,
        address_id=payload.address_id,
        delivery_method=payload.delivery_method,
        delivery_time_slot=payload.delivery_time_slot,
        payment_method=payload.payment_method,
        promotion_code=payload.promotion_code,
    )


@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(order_id: uuid.UUID, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    return storefront_order_service.cancel_order(db, customer, order_id)


@router.post("/{order_id}/reorder", response_model=list[ReorderItemResponse])
def reorder(order_id: uuid.UUID, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    return storefront_order_service.reorder(db, customer, order_id)


@router.get("/{order_id}/tracking", response_model=DeliveryTrackingResponse)
def get_tracking(order_id: uuid.UUID, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    return storefront_order_service.get_tracking(db, customer, order_id)

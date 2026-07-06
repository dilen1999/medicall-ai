"""Order API routes."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.order_schema import (
    MarkCallFailedRequest,
    MarkCallTriggeredRequest,
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
    PendingCallOrderResponse,
)
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    """Create a medicine order (with line items) for an existing customer."""
    return order_service.create_order(db, payload)


@router.get("", response_model=list[OrderResponse])
def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List orders, most recently created first."""
    return order_service.list_orders(db, skip=skip, limit=limit)


# NOTE: registered before /{order_id} so "pending-calls" is never parsed as a
# UUID path parameter.
@router.get("/pending-calls", response_model=list[PendingCallOrderResponse], tags=["n8n"])
def get_pending_calls(db: Session = Depends(get_db)):
    """
    n8n endpoint: orders that are DELIVERED and have not yet had a
    confirmation call triggered (call_status PENDING). Polled by the
    "MediCall AI - Trigger Medicine Delivery Calls" workflow's schedule
    trigger every 5 minutes.
    """
    return order_service.list_pending_calls(db)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: uuid.UUID, db: Session = Depends(get_db)):
    """Fetch a single order (with its items) by id."""
    return order_service.get_order(db, order_id)


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: uuid.UUID, payload: OrderStatusUpdate, db: Session = Depends(get_db)):
    """
    Update an order's delivery status. Marking an order DELIVERED is the
    trigger point for starting an AI voice confirmation call (see
    POST /api/calls/start/{order_id}, or the n8n-driven flow via
    GET /api/orders/pending-calls).
    """
    return order_service.update_order_status(db, order_id, payload)


@router.post("/{order_id}/mark-call-triggered", response_model=OrderResponse, tags=["n8n"])
def mark_call_triggered(order_id: uuid.UUID, payload: MarkCallTriggeredRequest, db: Session = Depends(get_db)):
    """n8n calls this immediately after Twilio accepts the outbound call request."""
    return order_service.mark_call_triggered(db, order_id, payload.twilio_call_sid)


@router.post("/{order_id}/mark-call-failed", response_model=OrderResponse, tags=["n8n"])
def mark_call_failed(order_id: uuid.UUID, payload: MarkCallFailedRequest, db: Session = Depends(get_db)):
    """n8n calls this if the Twilio API call itself failed (e.g. busy/rejected)."""
    return order_service.mark_call_failed(db, order_id, payload.reason)


@router.post("/{order_id}/mark-call-completed", response_model=OrderResponse, tags=["n8n"])
def mark_call_completed(order_id: uuid.UUID, db: Session = Depends(get_db)):
    """Marks the post-delivery confirmation call complete with no handoff needed."""
    return order_service.mark_call_completed(db, order_id)

"""Business logic for medicine orders and their line items."""

import logging
import uuid

from sqlalchemy.orm import Session, joinedload

from app.models.customer import Customer
from app.models.medicine_order import DeliveryStatus, MedicineOrder, OrderCallStatus
from app.models.order_item import OrderItem
from app.schemas.order_schema import OrderCreate, OrderStatusUpdate
from app.utils.response import bad_request, conflict, not_found
from app.utils.timezone import now_sl

logger = logging.getLogger("medicall.order_service")


def create_order(db: Session, payload: OrderCreate) -> MedicineOrder:
    # Validate the customer exists before creating the order.
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise not_found("Customer", payload.customer_id)

    existing = db.query(MedicineOrder).filter(MedicineOrder.order_reference == payload.order_reference).first()
    if existing:
        raise conflict(f"An order with reference '{payload.order_reference}' already exists.")

    order = MedicineOrder(
        order_reference=payload.order_reference,
        customer_id=payload.customer_id,
        delivery_status=payload.delivery_status.value,
        total_amount=payload.total_amount,
        prescription_required=payload.prescription_required,
    )
    db.add(order)
    db.flush()  # populate order.id before creating child items

    for item in payload.items:
        db.add(
            OrderItem(
                order_id=order.id,
                medicine_name=item.medicine_name,
                quantity=item.quantity,
                dosage_label=item.dosage_label,
                prescription_item=item.prescription_item,
            )
        )

    db.commit()
    db.refresh(order)
    return order


def list_orders(db: Session, skip: int = 0, limit: int = 100) -> list[MedicineOrder]:
    return (
        db.query(MedicineOrder)
        .options(joinedload(MedicineOrder.items))
        .order_by(MedicineOrder.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_order(db: Session, order_id: uuid.UUID) -> MedicineOrder:
    order = (
        db.query(MedicineOrder)
        .options(joinedload(MedicineOrder.items))
        .filter(MedicineOrder.id == order_id)
        .first()
    )
    if not order:
        raise not_found("Order", order_id)
    return order


def update_order_status(db: Session, order_id: uuid.UUID, payload: OrderStatusUpdate) -> MedicineOrder:
    order = get_order(db, order_id)

    new_status = payload.delivery_status
    if new_status == DeliveryStatus.DELIVERED and order.delivery_status == DeliveryStatus.DELIVERED.value:
        raise bad_request("Order is already marked as DELIVERED.")

    order.delivery_status = new_status.value
    if new_status == DeliveryStatus.DELIVERED:
        order.delivery_date = now_sl()

    db.commit()
    db.refresh(order)
    return order


# --- n8n / Twilio call orchestration -----------------------------------


def list_pending_calls(db: Session) -> list[MedicineOrder]:
    """
    Orders n8n's schedule trigger should call: delivered, and not yet
    triggered/handled by a previous run. Excludes orders already TRIGGERED,
    FAILED, COMPLETED, or HANDOFF_REQUIRED so the same order is never dialed
    twice by the 5-minute polling loop.
    """
    return (
        db.query(MedicineOrder)
        .options(joinedload(MedicineOrder.customer), joinedload(MedicineOrder.items))
        .filter(
            MedicineOrder.delivery_status == DeliveryStatus.DELIVERED.value,
            MedicineOrder.call_status == OrderCallStatus.PENDING.value,
        )
        .order_by(MedicineOrder.delivery_date.asc())
        .all()
    )


def mark_call_triggered(db: Session, order_id: uuid.UUID, twilio_call_sid: str | None) -> MedicineOrder:
    """Called by n8n right after Twilio accepts the outbound call request."""
    order = get_order(db, order_id)
    order.call_status = OrderCallStatus.TRIGGERED.value
    if twilio_call_sid:
        order.twilio_call_sid = twilio_call_sid
    db.commit()
    db.refresh(order)
    return order


def mark_call_failed(db: Session, order_id: uuid.UUID, reason: str | None) -> MedicineOrder:
    """Called by n8n (or the webhook) when Twilio could not complete the call."""
    order = get_order(db, order_id)
    order.call_status = OrderCallStatus.FAILED.value
    logger.warning("Call marked FAILED for order_id=%s reason=%s", order_id, reason or "not provided")
    db.commit()
    db.refresh(order)
    return order


def mark_call_completed(db: Session, order_id: uuid.UUID) -> MedicineOrder:
    """Called once AI analysis has finished and no handoff is required."""
    order = get_order(db, order_id)
    order.call_status = OrderCallStatus.COMPLETED.value
    db.commit()
    db.refresh(order)
    return order


def mark_call_handoff_required(db: Session, order_id: uuid.UUID) -> MedicineOrder:
    """Called from the gather-result webhook when AI analysis flags handoff_required."""
    order = get_order(db, order_id)
    order.call_status = OrderCallStatus.HANDOFF_REQUIRED.value
    db.commit()
    db.refresh(order)
    return order

"""Business logic for storefront (customer PWA) cart checkout, order history,
cancellation, reorder and simulated delivery tracking.

Deliberately separate from `order_service.py`, which is the original
voice-call-confirmation domain (n8n/Twilio orchestration) - a storefront
order is still a `MedicineOrder` row under the hood (see
app/models/medicine_order.py), so once one reaches `delivered` it flows
into that existing pipeline unmodified.
"""

import random
import uuid
from datetime import timedelta

from sqlalchemy.orm import Session, joinedload

from app.models.address import Address
from app.models.customer import Customer
from app.models.medicine_order import MedicineOrder
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.cart_schema import CartItemInput
from app.services import cart_service
from app.services.customer_notification_service import create_notification
from app.utils.order_timeline import (
    ACTIVE_ORDER_STATUSES,
    ORDER_STATUS_SEQUENCE,
    build_timeline,
    delivery_status_for,
)
from app.utils.response import bad_request, not_found
from app.utils.timezone import now_sl

_DRIVER_POOL = [
    {"name": "Kasun Silva", "vehicle_number": "WP CAB-4521", "phone_number": "+94770001122", "rating": 4.9},
    {"name": "Nadeesha Perera", "vehicle_number": "WP CAB-7788", "phone_number": "+94770003344", "rating": 4.8},
]


def _order_query(db: Session):
    return db.query(MedicineOrder).options(
        joinedload(MedicineOrder.items), joinedload(MedicineOrder.delivery_address), joinedload(MedicineOrder.pharmacy)
    )


def _to_order_dict(order: MedicineOrder) -> dict:
    return {
        "id": order.id,
        "reference": order.order_reference,
        "created_at": order.created_at,
        "status": order.storefront_status,
        "items": order.items,
        "pharmacy_id": str(order.pharmacy_id) if order.pharmacy_id else None,
        "pharmacy_name": order.pharmacy.name if order.pharmacy else None,
        "delivery_address": order.delivery_address,
        "delivery_method": order.delivery_method,
        "delivery_time_slot": order.delivery_time_slot,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "subtotal": float(order.subtotal or 0),
        "delivery_fee": float(order.delivery_fee or 0),
        "service_fee": float(order.service_fee or 0),
        "discount": float(order.discount or 0),
        "tax": float(order.tax or 0),
        "total": float(order.total_amount or 0),
        "estimated_delivery": order.estimated_delivery,
        "promotion_code": order.promotion_code,
        "cancellable": order.cancellable,
        "timeline": order.status_timeline or [],
    }


def _get_owned_order(db: Session, customer: Customer, order_id: uuid.UUID) -> MedicineOrder:
    order = _order_query(db).filter(MedicineOrder.id == order_id, MedicineOrder.customer_id == customer.id).first()
    if not order or order.storefront_status is None:
        raise not_found("Order", order_id)
    return order


def list_orders(db: Session, customer: Customer) -> list[dict]:
    orders = (
        _order_query(db)
        .filter(MedicineOrder.customer_id == customer.id, MedicineOrder.storefront_status.isnot(None))
        .order_by(MedicineOrder.created_at.desc())
        .all()
    )
    return [_to_order_dict(o) for o in orders]


def get_order(db: Session, customer: Customer, order_id: uuid.UUID) -> dict:
    return _to_order_dict(_get_owned_order(db, customer, order_id))


def create_order(
    db: Session,
    customer: Customer,
    *,
    items: list[CartItemInput],
    address_id: uuid.UUID,
    delivery_method: str,
    delivery_time_slot: str,
    payment_method: str,
    promotion_code: str | None,
) -> dict:
    if not items:
        raise bad_request("Cannot place an order with an empty cart.")

    validation = cart_service.validate_cart(db, customer, items)
    if not validation["valid"]:
        raise bad_request(" ".join(validation["errors"]))

    address = db.query(Address).filter(Address.id == address_id, Address.customer_id == customer.id).first()
    if not address:
        raise not_found("Address", address_id)

    products = {p.id: p for p in db.query(Product).filter(Product.id.in_([i.product_id for i in items])).all()}
    preview = cart_service.compute_preview(db, items, delivery_method, promotion_code)

    requires_prescription_review = any(products[i.product_id].prescription_required for i in items if i.product_id in products)
    first_product = products[items[0].product_id]
    now = now_sl()
    estimated_minutes = 60 if delivery_method == "express" else 180
    estimated_delivery = now + timedelta(minutes=estimated_minutes)
    status = "order_received"

    order = MedicineOrder(
        order_reference=f"MC-{random.randint(100000, 999999)}",
        customer_id=customer.id,
        delivery_status=delivery_status_for(status),
        total_amount=preview["total"],
        prescription_required=requires_prescription_review,
        storefront_status=status,
        pharmacy_id=first_product.pharmacy_id,
        delivery_address_id=address.id,
        delivery_method=delivery_method,
        delivery_time_slot=delivery_time_slot,
        payment_method=payment_method,
        payment_status="pending" if payment_method == "cash_on_delivery" else "paid",
        subtotal=preview["subtotal"],
        delivery_fee=preview["delivery_fee"],
        service_fee=preview["service_fee"],
        discount=preview["discount"],
        tax=preview["tax"],
        promotion_code=preview["promotion_applied"],
        estimated_delivery=estimated_delivery,
        cancellable=True,
        created_at=now,
        status_timeline=build_timeline(status, now, requires_prescription_review),
    )
    db.add(order)
    db.flush()

    for item in items:
        product = products[item.product_id]
        db.add(
            OrderItem(
                order_id=order.id,
                medicine_name=product.name,
                quantity=item.quantity,
                prescription_item=product.prescription_required,
                product_id=product.id,
                price=product.price,
                image=product.image,
            )
        )

    create_notification(
        db,
        customer.id,
        type="order_confirmed",
        title="Order confirmed",
        message=f"Your order {order.order_reference} has been received.",
        link_to=f"/orders/{order.id}",
    )

    db.commit()
    db.refresh(order)
    return _to_order_dict(order)


def cancel_order(db: Session, customer: Customer, order_id: uuid.UUID) -> dict:
    order = _get_owned_order(db, customer, order_id)
    if not order.cancellable:
        raise bad_request("This order can no longer be cancelled.")

    order.storefront_status = "cancelled"
    order.delivery_status = delivery_status_for("cancelled")
    order.cancellable = False
    order.status_timeline = build_timeline("cancelled", order.created_at, False)
    db.commit()
    db.refresh(order)
    return _to_order_dict(order)


def reorder(db: Session, customer: Customer, order_id: uuid.UUID) -> list[dict]:
    order = _get_owned_order(db, customer, order_id)
    results = []
    for item in order.items:
        if not item.product_id:
            continue
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            continue
        results.append(
            {
                "product_id": product.id,
                "name": product.name,
                "image": product.image,
                "price": float(product.price),
                "quantity": item.quantity,
                "pack_size": product.pack_size,
                "stock_quantity": product.stock_quantity,
                "prescription_required": product.prescription_required,
                "pharmacy_id": str(product.pharmacy_id),
                "pharmacy_name": product.pharmacy.name if product.pharmacy else "",
            }
        )
    return results


def get_tracking(db: Session, customer: Customer, order_id: uuid.UUID) -> dict:
    order = _get_owned_order(db, customer, order_id)
    now = now_sl()

    if order.storefront_status in ACTIVE_ORDER_STATUSES and random.random() > 0.5:
        current_index = ORDER_STATUS_SEQUENCE.index(order.storefront_status) if order.storefront_status in ORDER_STATUS_SEQUENCE else -1
        next_index = current_index + 1
        if next_index < len(ORDER_STATUS_SEQUENCE):
            next_status = ORDER_STATUS_SEQUENCE[next_index]
            order.storefront_status = next_status
            order.delivery_status = delivery_status_for(next_status)
            order.status_timeline = build_timeline(next_status, order.created_at, False)

            if next_status in ("driver_assigned", "out_for_delivery", "nearby") and not order.driver_name:
                driver = random.choice(_DRIVER_POOL)
                order.driver_name = driver["name"]
                order.driver_vehicle_number = driver["vehicle_number"]
                order.driver_phone_number = driver["phone_number"]
                order.driver_rating = driver["rating"]
                if order.delivery_address and order.delivery_address.latitude and order.delivery_address.longitude:
                    order.driver_latitude = order.delivery_address.latitude + 0.01
                    order.driver_longitude = order.delivery_address.longitude + 0.01

            if next_status == "delivered":
                order.cancellable = False
                create_notification(
                    db,
                    customer.id,
                    type="order_delivered",
                    title="Order delivered",
                    message=f"Your order {order.order_reference} has been delivered.",
                    link_to=f"/orders/{order.id}",
                )

    if order.driver_latitude is not None and order.driver_longitude is not None:
        order.driver_latitude += (random.random() - 0.5) * 0.002
        order.driver_longitude += (random.random() - 0.5) * 0.002

    order.tracking_last_updated = now
    db.commit()
    db.refresh(order)

    driver = None
    if order.driver_name:
        driver = {
            "id": order.driver_phone_number or "driver",
            "name": order.driver_name,
            "vehicle_number": order.driver_vehicle_number,
            "phone_number": order.driver_phone_number,
            "rating": order.driver_rating or 4.5,
        }

    driver_location = None
    if order.driver_latitude is not None and order.driver_longitude is not None:
        driver_location = {
            "latitude": order.driver_latitude,
            "longitude": order.driver_longitude,
            "updated_at": order.tracking_last_updated,
        }

    return {
        "order_id": order.id,
        "status": order.storefront_status,
        "estimated_arrival": order.estimated_delivery,
        "driver": driver,
        "driver_location": driver_location,
        "last_updated": order.tracking_last_updated,
        "delivery_instructions": order.delivery_address.delivery_instructions if order.delivery_address else None,
    }

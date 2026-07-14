"""Storefront order status timeline helpers - the Python mirror of
customer-pwa's src/utils/orderStatus.ts, so the backend can build/advance
the same timeline the frontend renders."""

from datetime import datetime, timedelta

from app.models.medicine_order import DeliveryStatus, StorefrontStatus

ORDER_STATUS_SEQUENCE = [
    StorefrontStatus.ORDER_RECEIVED.value,
    StorefrontStatus.PRESCRIPTION_REVIEWING.value,
    StorefrontStatus.PRESCRIPTION_APPROVED.value,
    StorefrontStatus.PAYMENT_CONFIRMED.value,
    StorefrontStatus.PREPARING_ORDER.value,
    StorefrontStatus.READY_FOR_COLLECTION.value,
    StorefrontStatus.DRIVER_ASSIGNED.value,
    StorefrontStatus.OUT_FOR_DELIVERY.value,
    StorefrontStatus.NEARBY.value,
    StorefrontStatus.DELIVERED.value,
]

ORDER_STATUS_LABELS = {
    "order_received": "Order Received",
    "prescription_reviewing": "Prescription Reviewing",
    "prescription_approved": "Prescription Approved",
    "payment_confirmed": "Payment Confirmed",
    "preparing_order": "Preparing Order",
    "ready_for_collection": "Ready for Collection",
    "driver_assigned": "Driver Assigned",
    "out_for_delivery": "Out for Delivery",
    "nearby": "Nearby",
    "delivered": "Delivered",
    "cancelled": "Cancelled",
    "delivery_failed": "Delivery Failed",
}

ACTIVE_ORDER_STATUSES = [
    "order_received", "prescription_reviewing", "prescription_approved", "payment_confirmed",
    "preparing_order", "ready_for_collection", "driver_assigned", "out_for_delivery", "nearby",
]

# Keeps the legacy n8n/Twilio confirmation-call pipeline (which only knows
# about DeliveryStatus) working unmodified as storefront_status advances.
_STATUS_TO_DELIVERY_STATUS = {
    "out_for_delivery": DeliveryStatus.OUT_FOR_DELIVERY.value,
    "nearby": DeliveryStatus.OUT_FOR_DELIVERY.value,
    "delivered": DeliveryStatus.DELIVERED.value,
    "cancelled": DeliveryStatus.CANCELLED.value,
    "delivery_failed": DeliveryStatus.CANCELLED.value,
}


def delivery_status_for(storefront_status: str) -> str:
    return _STATUS_TO_DELIVERY_STATUS.get(storefront_status, DeliveryStatus.PENDING.value)


def build_timeline(current_status: str, reference_timestamp: datetime, requires_prescription_review: bool) -> list[dict]:
    steps = (
        ORDER_STATUS_SEQUENCE
        if requires_prescription_review
        else [s for s in ORDER_STATUS_SEQUENCE if s not in ("prescription_reviewing", "prescription_approved")]
    )

    if current_status in ("cancelled", "delivery_failed"):
        return [
            {
                "status": "order_received",
                "label": ORDER_STATUS_LABELS["order_received"],
                "timestamp": reference_timestamp.isoformat(),
                "completed": True,
            },
            {
                "status": current_status,
                "label": ORDER_STATUS_LABELS[current_status],
                "timestamp": reference_timestamp.isoformat(),
                "completed": True,
            },
        ]

    current_index = steps.index(current_status) if current_status in steps else 0
    timeline = []
    for index, step in enumerate(steps):
        completed = index <= current_index
        timestamp = (reference_timestamp + timedelta(minutes=20 * index)) if completed else None
        timeline.append(
            {
                "status": step,
                "label": ORDER_STATUS_LABELS[step],
                "timestamp": timestamp.isoformat() if timestamp else None,
                "completed": completed,
            }
        )
    return timeline

"""Medicine order ORM model."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.timezone import now_sl


class DeliveryStatus(str, enum.Enum):
    PENDING = "PENDING"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class OrderCallStatus(str, enum.Enum):
    """
    Tracks the n8n/Twilio post-delivery confirmation call at the order level
    (distinct from CallLog.call_status, which tracks one specific call
    attempt). This is what n8n polls (PENDING) and updates (TRIGGERED/
    FAILED/COMPLETED/HANDOFF_REQUIRED) so a delivered order is never called
    twice by the 5-minute schedule trigger.
    """

    PENDING = "PENDING"
    TRIGGERED = "TRIGGERED"
    FAILED = "FAILED"
    COMPLETED = "COMPLETED"
    HANDOFF_REQUIRED = "HANDOFF_REQUIRED"


class StorefrontStatus(str, enum.Enum):
    """
    Fine-grained lifecycle used by the customer PWA (order history, tracking,
    timeline). Kept separate from `delivery_status` above, which stays the
    source of truth for the existing n8n/Twilio confirmation-call pipeline -
    `order_service` keeps the two in sync on every transition (see
    STOREFRONT_TO_DELIVERY_STATUS) so that pipeline needs zero changes.
    """

    ORDER_RECEIVED = "order_received"
    PRESCRIPTION_REVIEWING = "prescription_reviewing"
    PRESCRIPTION_APPROVED = "prescription_approved"
    PAYMENT_CONFIRMED = "payment_confirmed"
    PREPARING_ORDER = "preparing_order"
    READY_FOR_COLLECTION = "ready_for_collection"
    DRIVER_ASSIGNED = "driver_assigned"
    OUT_FOR_DELIVERY = "out_for_delivery"
    NEARBY = "nearby"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    DELIVERY_FAILED = "delivery_failed"


class MedicineOrder(Base):
    __tablename__ = "medicine_orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_reference: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False
    )

    # Stored as plain string (not a DB-level enum) so new statuses can be
    # added without an Alembic migration; validated at the Pydantic layer.
    delivery_status: Mapped[str] = mapped_column(String(32), default=DeliveryStatus.PENDING.value, nullable=False)
    delivery_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    prescription_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # --- n8n / Twilio post-delivery call orchestration ---
    call_status: Mapped[str] = mapped_column(String(32), default=OrderCallStatus.PENDING.value, nullable=False)
    twilio_call_sid: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_sl, nullable=False)

    # --- Customer PWA (storefront cart/checkout) fields ---
    # All nullable so existing voice-call-flow orders (created without a
    # cart/checkout at all) remain valid rows.
    storefront_status: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    pharmacy_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("pharmacies.id"), nullable=True)
    delivery_address_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("addresses.id"), nullable=True
    )
    delivery_method: Mapped[str | None] = mapped_column(String(32), nullable=True)
    delivery_time_slot: Mapped[str | None] = mapped_column(String(128), nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(32), nullable=True)
    payment_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    subtotal: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    delivery_fee: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    service_fee: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    discount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    tax: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    promotion_code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    estimated_delivery: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    cancellable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # --- Simulated delivery tracking (driver + live location) ---
    driver_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    driver_vehicle_number: Mapped[str | None] = mapped_column(String(32), nullable=True)
    driver_phone_number: Mapped[str | None] = mapped_column(String(32), nullable=True)
    driver_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    driver_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    driver_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    tracking_last_updated: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status_timeline: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )
    call_logs: Mapped[list["CallLog"]] = relationship(
        "CallLog", back_populates="order", cascade="all, delete-orphan"
    )
    delivery_address: Mapped["Address | None"] = relationship("Address")
    pharmacy: Mapped["Pharmacy | None"] = relationship("Pharmacy")

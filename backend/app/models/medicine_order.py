"""Medicine order ORM model."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
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

    customer: Mapped["Customer"] = relationship("Customer", back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )
    call_logs: Mapped[list["CallLog"]] = relationship(
        "CallLog", back_populates="order", cascade="all, delete-orphan"
    )

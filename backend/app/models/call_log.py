"""Call log ORM model — one row per customer support call (real or simulated)."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.timezone import now_sl


class CallStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SIMULATED = "SIMULATED"


class CallLog(Base):
    __tablename__ = "call_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medicine_orders.id", ondelete="CASCADE"), nullable=False
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False
    )
    call_status: Mapped[str] = mapped_column(String(32), default=CallStatus.QUEUED.value, nullable=False)
    call_started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    call_ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    recording_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Twilio CallSid for this specific call attempt - lets the status webhook
    # (/api/calls/webhook) correlate back to this row without an order_id in
    # its path, since Twilio's StatusCallback only carries CallSid/CallStatus.
    twilio_call_sid: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_sl, nullable=False)

    order: Mapped["MedicineOrder"] = relationship("MedicineOrder", back_populates="call_logs")
    customer: Mapped["Customer"] = relationship("Customer", back_populates="call_logs")
    analysis: Mapped["AICallAnalysis | None"] = relationship(
        "AICallAnalysis", back_populates="call_log", uselist=False, cascade="all, delete-orphan"
    )

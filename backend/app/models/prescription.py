"""Customer prescription upload ORM model."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.timezone import now_sl


class PrescriptionStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    REQUIRES_CLEARER_IMAGE = "requires_clearer_image"
    UNDER_PHARMACIST_REVIEW = "under_pharmacist_review"
    APPROVED = "approved"
    PARTIALLY_APPROVED = "partially_approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_type: Mapped[str] = mapped_column(String(64), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default=PrescriptionStatus.UNDER_PHARMACIST_REVIEW.value, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=now_sl, nullable=False)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    pharmacist_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    linked_order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medicine_orders.id", ondelete="SET NULL"), nullable=True
    )

    customer: Mapped["Customer"] = relationship("Customer", back_populates="prescriptions")

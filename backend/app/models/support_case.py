"""Customer support case + message ORM models."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.timezone import now_sl


class SupportCase(Base):
    __tablename__ = "support_cases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    related_order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medicine_orders.id", ondelete="SET NULL"), nullable=True
    )
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="open", nullable=False)
    preferred_contact_method: Mapped[str] = mapped_column(String(32), default="app_notification", nullable=False)
    preferred_callback_time: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_sl, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now_sl, onupdate=now_sl, nullable=False)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="support_cases")
    messages: Mapped[list["SupportMessage"]] = relationship(
        "SupportMessage", back_populates="case", cascade="all, delete-orphan", order_by="SupportMessage.created_at"
    )


class SupportMessage(Base):
    __tablename__ = "support_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("support_cases.id", ondelete="CASCADE"), nullable=False
    )
    sender: Mapped[str] = mapped_column(String(16), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_sl, nullable=False)

    case: Mapped["SupportCase"] = relationship("SupportCase", back_populates="messages")

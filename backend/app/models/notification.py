"""Customer-facing notification feed ORM model.

Distinct from `app.services.notification_service` (which emails the owner a
pharmacist-handoff alert) - this is the in-app notification feed a customer
sees in the PWA (order/prescription/support/promo updates).
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.timezone import now_sl


class CustomerNotification(Base):
    __tablename__ = "customer_notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_sl, nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    link_to: Mapped[str | None] = mapped_column(String(255), nullable=True)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="notifications")

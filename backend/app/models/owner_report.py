"""Daily owner summary report model."""

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class OwnerReport(Base):
    __tablename__ = "owner_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    total_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    successful_deliveries: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    missing_item_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    wrong_medicine_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    damaged_package_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    pharmacist_handoff_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # String, not FK — email delivery status is informational metadata only.
    sent_status: Mapped[str] = mapped_column(String(32), default="NOT_SENT", nullable=False)

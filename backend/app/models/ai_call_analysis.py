"""AI-generated analysis of a call transcript."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.timezone import now_sl


class AICallAnalysis(Base):
    __tablename__ = "ai_call_analysis"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    call_log_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("call_logs.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    delivery_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    issue_type: Mapped[str] = mapped_column(String(64), nullable=False)
    sentiment: Mapped[str] = mapped_column(String(32), nullable=False)
    priority: Mapped[str] = mapped_column(String(16), nullable=False)
    handoff_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    pharmacist_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    ai_summary: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_sl, nullable=False)

    call_log: Mapped["CallLog"] = relationship("CallLog", back_populates="analysis")

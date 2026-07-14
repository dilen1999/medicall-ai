"""Customer ORM model."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.timezone import now_sl

DEFAULT_NOTIFICATION_SETTINGS = {
    "orderUpdates": True,
    "promotions": True,
    "prescriptionUpdates": True,
    "supportUpdates": True,
}


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    language: Mapped[str] = mapped_column(String(64), default="English", nullable=False)
    country: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_sl, nullable=False)

    # --- Customer PWA (storefront) account fields ---
    # Nullable: rows created via the voice-call flow (POST /customers, no
    # password) never log into the storefront, so this stays NULL for them.
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(8), default="en", nullable=False)
    theme: Mapped[str] = mapped_column(String(16), default="system", nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    default_address_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    notification_settings: Mapped[dict] = mapped_column(JSONB, default=lambda: dict(DEFAULT_NOTIFICATION_SETTINGS))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    orders: Mapped[list["MedicineOrder"]] = relationship(
        "MedicineOrder", back_populates="customer", cascade="all, delete-orphan"
    )
    call_logs: Mapped[list["CallLog"]] = relationship(
        "CallLog", back_populates="customer", cascade="all, delete-orphan"
    )
    addresses: Mapped[list["Address"]] = relationship(
        "Address", back_populates="customer", cascade="all, delete-orphan"
    )
    prescriptions: Mapped[list["Prescription"]] = relationship(
        "Prescription", back_populates="customer", cascade="all, delete-orphan"
    )
    support_cases: Mapped[list["SupportCase"]] = relationship(
        "SupportCase", back_populates="customer", cascade="all, delete-orphan"
    )
    notifications: Mapped[list["CustomerNotification"]] = relationship(
        "CustomerNotification", back_populates="customer", cascade="all, delete-orphan"
    )

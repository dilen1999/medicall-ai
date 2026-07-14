"""Order line item ORM model."""

import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medicine_orders.id", ondelete="CASCADE"), nullable=False
    )
    medicine_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    dosage_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    prescription_item: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # --- Customer PWA (storefront cart/checkout) fields ---
    product_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    image: Mapped[str | None] = mapped_column(String(64), nullable=True)

    order: Mapped["MedicineOrder"] = relationship("MedicineOrder", back_populates="items")

    @property
    def name(self) -> str:
        """Storefront-facing display name - the item was always `medicine_name`
        under the hood, whether it came from a voice-call order or the PWA."""
        return self.medicine_name

    @property
    def prescription_required(self) -> bool:
        return self.prescription_item

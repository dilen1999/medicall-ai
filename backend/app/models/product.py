"""Storefront product ORM model."""

import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    brand: Mapped[str] = mapped_column(String(128), nullable=False)
    generic_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    manufacturer: Mapped[str] = mapped_column(String(255), nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    storage_information: Mapped[str] = mapped_column(Text, nullable=False)
    image: Mapped[str] = mapped_column(String(64), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    pack_size: Mapped[str] = mapped_column(String(64), nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    prescription_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    pharmacy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pharmacies.id", ondelete="RESTRICT"), nullable=False
    )
    rating: Mapped[float] = mapped_column(Float, default=4.5, nullable=False)
    related_product_ids: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), default=list, nullable=False
    )

    category: Mapped["Category"] = relationship("Category", back_populates="products")
    pharmacy: Mapped["Pharmacy"] = relationship("Pharmacy", back_populates="products")

    @property
    def availability(self) -> str:
        if self.stock_quantity <= 0:
            return "out_of_stock"
        if self.stock_quantity <= 30:
            return "low_stock"
        return "in_stock"

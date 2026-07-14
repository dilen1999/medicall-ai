"""Cart validation and checkout price preview.

Always re-derives price and stock from the `products` table and prescription
approval from the `prescriptions` table - the client-supplied price/name on
a cart item (kept client-side in the PWA's Zustand store) is never trusted
for money or eligibility decisions.
"""

import uuid

from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.prescription import Prescription
from app.models.product import Product
from app.schemas.cart_schema import CartItemInput

DELIVERY_FEES = {
    "standard": 350,
    "express": 550,
    "scheduled": 300,
    "pharmacy_collection": 0,
}

PROMO_CODES = {
    "WELL10": 0.10,
    "SAVE100": 100,
}


def _load_products(db: Session, items: list[CartItemInput]) -> dict[uuid.UUID, Product]:
    ids = [item.product_id for item in items]
    products = db.query(Product).filter(Product.id.in_(ids)).all()
    return {p.id: p for p in products}


def validate_cart(db: Session, customer: Customer, items: list[CartItemInput]) -> dict:
    errors: list[str] = []
    if not items:
        return {"valid": False, "errors": ["Your cart is empty."]}

    products = _load_products(db, items)

    for item in items:
        product = products.get(item.product_id)
        if not product:
            errors.append("One of the items in your cart is no longer available.")
            continue
        if product.stock_quantity < item.quantity:
            errors.append(f"Only {product.stock_quantity} units of {product.name} are in stock.")
        if product.prescription_required:
            prescription = (
                db.query(Prescription)
                .filter(
                    Prescription.id == item.prescription_id,
                    Prescription.customer_id == customer.id,
                    Prescription.status.in_(["approved", "partially_approved"]),
                )
                .first()
                if item.prescription_id
                else None
            )
            if not prescription:
                errors.append(f"{product.name} needs an approved prescription before checkout.")

    return {"valid": len(errors) == 0, "errors": errors}


def compute_preview(db: Session, items: list[CartItemInput], delivery_method: str, promotion_code: str | None) -> dict:
    products = _load_products(db, items)
    subtotal = sum(float(products[item.product_id].price) * item.quantity for item in items if item.product_id in products)
    delivery_fee = DELIVERY_FEES.get(delivery_method, DELIVERY_FEES["standard"])
    service_fee = round(subtotal * 0.02)
    tax = round(subtotal * 0.05)

    discount = 0.0
    promotion_applied = None
    promotion_error = None
    if promotion_code:
        rule = PROMO_CODES.get(promotion_code.upper())
        if rule is None:
            promotion_error = "This promotion code is not valid."
        else:
            discount = round(subtotal * rule) if rule < 1 else rule
            promotion_applied = promotion_code.upper()

    total = max(0.0, subtotal + delivery_fee + service_fee + tax - discount)

    return {
        "subtotal": subtotal,
        "delivery_fee": delivery_fee,
        "service_fee": service_fee,
        "discount": discount,
        "tax": tax,
        "total": total,
        "promotion_applied": promotion_applied,
        "promotion_error": promotion_error,
        "estimated_delivery_window": "Within 90 minutes" if delivery_method == "express" else "Within 3-5 hours",
    }

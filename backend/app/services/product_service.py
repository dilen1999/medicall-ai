"""Business logic for the storefront product catalogue."""

import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.category import Category
from app.models.product import Product
from app.utils.response import not_found


def _to_product_dict(product: Product) -> dict:
    return {
        "id": product.id,
        "name": product.name,
        "brand": product.brand,
        "generic_name": product.generic_name,
        "manufacturer": product.manufacturer,
        "category": str(product.category_id),
        "description": product.description,
        "storage_information": product.storage_information,
        "image": product.image,
        "price": float(product.price),
        "pack_size": product.pack_size,
        "stock_quantity": product.stock_quantity,
        "prescription_required": product.prescription_required,
        "pharmacy_id": str(product.pharmacy_id),
        "pharmacy_name": product.pharmacy.name if product.pharmacy else "",
        "rating": product.rating,
        "availability": product.availability,
        "related_product_ids": [str(pid) for pid in (product.related_product_ids or [])],
    }


def list_products(
    db: Session,
    *,
    search: str | None = None,
    category: str | None = None,
    brand: str | None = None,
    prescription_required: bool | None = None,
    availability: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    sort_by: str | None = None,
    sort_direction: str = "asc",
    page: int = 1,
    page_size: int = 12,
) -> dict:
    query = db.query(Product).options(joinedload(Product.pharmacy), joinedload(Product.category))

    if search:
        like = f"%{search.lower()}%"
        query = query.filter(
            func.lower(Product.name).like(like)
            | func.lower(Product.brand).like(like)
            | func.lower(func.coalesce(Product.generic_name, "")).like(like)
        )
    if category:
        try:
            query = query.filter(Product.category_id == uuid.UUID(category))
        except ValueError:
            query = query.filter(False)
    if brand:
        query = query.filter(Product.brand == brand)
    if prescription_required is not None:
        query = query.filter(Product.prescription_required == prescription_required)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    products = query.all()

    if availability:
        products = [p for p in products if p.availability == availability]

    if sort_by == "price":
        products.sort(key=lambda p: float(p.price), reverse=sort_direction == "desc")
    elif sort_by == "rating":
        products.sort(key=lambda p: p.rating, reverse=sort_direction == "desc")
    else:
        products.sort(key=lambda p: p.name, reverse=sort_direction == "desc")

    total = len(products)
    start = (page - 1) * page_size
    page_items = products[start : start + page_size]

    return {
        "items": [_to_product_dict(p) for p in page_items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": start + len(page_items) < total,
    }


def get_product(db: Session, product_id: uuid.UUID) -> dict:
    product = (
        db.query(Product)
        .options(joinedload(Product.pharmacy), joinedload(Product.category))
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise not_found("Product", product_id)
    return _to_product_dict(product)


def list_categories(db: Session) -> list[dict]:
    categories = db.query(Category).order_by(Category.name).all()
    counts = dict(db.query(Product.category_id, func.count(Product.id)).group_by(Product.category_id).all())
    return [
        {
            "id": category.id,
            "name": category.name,
            "icon": category.icon,
            "product_count": counts.get(category.id, 0),
        }
        for category in categories
    ]

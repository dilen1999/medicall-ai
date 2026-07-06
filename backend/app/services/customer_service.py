"""Business logic for customer management."""

import uuid

from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer_schema import CustomerCreate
from app.utils.response import not_found


def create_customer(db: Session, payload: CustomerCreate) -> Customer:
    customer = Customer(
        full_name=payload.full_name,
        phone_number=payload.phone_number,
        email=payload.email,
        language=payload.language,
        country=payload.country,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def list_customers(db: Session, skip: int = 0, limit: int = 100) -> list[Customer]:
    return (
        db.query(Customer)
        .order_by(Customer.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_customer(db: Session, customer_id: uuid.UUID) -> Customer:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise not_found("Customer", customer_id)
    return customer

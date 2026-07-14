"""Business logic for the customer-facing in-app notification feed."""

import uuid

from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.notification import CustomerNotification


def create_notification(
    db: Session,
    customer_id: uuid.UUID,
    *,
    type: str,
    title: str,
    message: str,
    link_to: str | None = None,
) -> CustomerNotification:
    """Helper used by other services (orders, prescriptions, support) to push
    a notification. Does not commit - caller's transaction commits it."""
    notification = CustomerNotification(
        customer_id=customer_id, type=type, title=title, message=message, link_to=link_to
    )
    db.add(notification)
    db.flush()
    return notification


def list_notifications(db: Session, customer: Customer) -> list[CustomerNotification]:
    return (
        db.query(CustomerNotification)
        .filter(CustomerNotification.customer_id == customer.id)
        .order_by(CustomerNotification.created_at.desc())
        .all()
    )


def mark_read(db: Session, customer: Customer, notification_id: uuid.UUID) -> None:
    db.query(CustomerNotification).filter(
        CustomerNotification.id == notification_id, CustomerNotification.customer_id == customer.id
    ).update({"read": True})
    db.commit()


def mark_all_read(db: Session, customer: Customer) -> None:
    db.query(CustomerNotification).filter(CustomerNotification.customer_id == customer.id).update({"read": True})
    db.commit()


def delete_notification(db: Session, customer: Customer, notification_id: uuid.UUID) -> None:
    db.query(CustomerNotification).filter(
        CustomerNotification.id == notification_id, CustomerNotification.customer_id == customer.id
    ).delete()
    db.commit()

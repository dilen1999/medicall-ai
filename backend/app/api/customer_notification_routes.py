"""Customer-facing in-app notification feed routes."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_customer, get_db
from app.models.customer import Customer
from app.schemas.customer_notification_schema import CustomerNotificationResponse
from app.services import customer_notification_service

router = APIRouter(prefix="/notifications", tags=["Customer Notifications"])


@router.get("", response_model=list[CustomerNotificationResponse])
def list_notifications(customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    return customer_notification_service.list_notifications(db, customer)


@router.patch("/{notification_id}/read", status_code=204)
def mark_read(
    notification_id: uuid.UUID,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    customer_notification_service.mark_read(db, customer, notification_id)


@router.post("/read-all", status_code=204)
def mark_all_read(customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    customer_notification_service.mark_all_read(db, customer)


@router.delete("/{notification_id}", status_code=204)
def delete_notification(
    notification_id: uuid.UUID,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    customer_notification_service.delete_notification(db, customer, notification_id)

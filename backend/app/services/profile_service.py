"""Business logic for the logged-in customer's own profile."""

from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.auth_schema import ProfileUpdateRequest


def update_profile(db: Session, customer: Customer, payload: ProfileUpdateRequest) -> Customer:
    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "notification_settings" in updates:
        updates["notification_settings"] = payload.notification_settings.model_dump()

    for field, value in updates.items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)
    return customer

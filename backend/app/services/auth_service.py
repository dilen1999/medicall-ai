"""Business logic for customer PWA authentication."""

from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.auth_schema import LoginRequest, RegisterRequest
from app.utils.response import bad_request, conflict, unauthorized
from app.utils.security import create_access_token, hash_password, verify_password


def register(db: Session, payload: RegisterRequest) -> tuple[Customer, str]:
    existing = db.query(Customer).filter(Customer.email == payload.email).first()
    if existing is not None:
        raise conflict("An account with this email already exists.")

    customer = Customer(
        full_name=payload.full_name,
        email=payload.email,
        phone_number=payload.phone_number,
        password_hash=hash_password(payload.password),
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    token = create_access_token(customer.id)
    return customer, token


def login(db: Session, payload: LoginRequest) -> tuple[Customer, str]:
    identifier = payload.identifier.strip().lower()
    customer = (
        db.query(Customer)
        .filter((Customer.email == identifier) | (Customer.phone_number == payload.identifier.strip()))
        .first()
    )

    if customer is None or not customer.password_hash or not verify_password(payload.password, customer.password_hash):
        raise unauthorized("Invalid email/phone number or password.")

    if not customer.is_active:
        raise bad_request("This account has been deactivated.")

    token = create_access_token(customer.id)
    return customer, token

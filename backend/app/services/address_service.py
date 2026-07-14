"""Business logic for the customer address book."""

import uuid

from sqlalchemy.orm import Session

from app.models.address import Address
from app.models.customer import Customer
from app.schemas.address_schema import AddressInput, AddressUpdate
from app.utils.response import not_found


def list_addresses(db: Session, customer: Customer) -> list[Address]:
    return db.query(Address).filter(Address.customer_id == customer.id).order_by(Address.label).all()


def _clear_other_defaults(db: Session, customer: Customer, keep_id: uuid.UUID | None = None) -> None:
    query = db.query(Address).filter(Address.customer_id == customer.id)
    if keep_id is not None:
        query = query.filter(Address.id != keep_id)
    query.update({"is_default": False})


def create_address(db: Session, customer: Customer, payload: AddressInput) -> Address:
    address = Address(customer_id=customer.id, **payload.model_dump())
    db.add(address)
    db.flush()

    if address.is_default:
        _clear_other_defaults(db, customer, keep_id=address.id)
        customer.default_address_id = address.id

    db.commit()
    db.refresh(address)
    return address


def _get_owned_address(db: Session, customer: Customer, address_id: uuid.UUID) -> Address:
    address = db.query(Address).filter(Address.id == address_id, Address.customer_id == customer.id).first()
    if not address:
        raise not_found("Address", address_id)
    return address


def update_address(db: Session, customer: Customer, address_id: uuid.UUID, payload: AddressUpdate) -> Address:
    address = _get_owned_address(db, customer, address_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(address, field, value)

    if payload.is_default:
        _clear_other_defaults(db, customer, keep_id=address.id)
        customer.default_address_id = address.id

    db.commit()
    db.refresh(address)
    return address


def delete_address(db: Session, customer: Customer, address_id: uuid.UUID) -> None:
    address = _get_owned_address(db, customer, address_id)
    db.delete(address)
    if customer.default_address_id == address.id:
        customer.default_address_id = None
    db.commit()

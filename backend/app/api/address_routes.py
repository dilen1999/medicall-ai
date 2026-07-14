"""Customer address book routes."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_customer, get_db
from app.models.customer import Customer
from app.schemas.address_schema import AddressInput, AddressResponse, AddressUpdate
from app.services import address_service

router = APIRouter(prefix="/addresses", tags=["Addresses"])


@router.get("", response_model=list[AddressResponse])
def list_addresses(customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    return address_service.list_addresses(db, customer)


@router.post("", response_model=AddressResponse, status_code=201)
def create_address(
    payload: AddressInput,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    return address_service.create_address(db, customer, payload)


@router.patch("/{address_id}", response_model=AddressResponse)
def update_address(
    address_id: uuid.UUID,
    payload: AddressUpdate,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    return address_service.update_address(db, customer, address_id, payload)


@router.delete("/{address_id}", status_code=204)
def delete_address(
    address_id: uuid.UUID,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    address_service.delete_address(db, customer, address_id)

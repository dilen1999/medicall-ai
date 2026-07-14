"""Customer prescription upload routes."""

import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.dependencies import get_current_customer, get_db
from app.models.customer import Customer
from app.schemas.prescription_schema import PrescriptionResponse
from app.services import prescription_service

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


@router.get("", response_model=list[PrescriptionResponse])
def list_prescriptions(customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    return prescription_service.list_prescriptions(db, customer)


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
def get_prescription(
    prescription_id: uuid.UUID,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    return prescription_service.get_prescription(db, customer, prescription_id)


@router.post("", response_model=PrescriptionResponse, status_code=201)
async def submit_prescription(
    file: UploadFile = File(...),
    note: str | None = Form(default=None),
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    return await prescription_service.submit_prescription(db, customer, file, note)

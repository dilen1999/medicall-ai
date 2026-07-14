"""Business logic for customer prescription uploads.

Files are saved to disk under settings.uploads_dir/prescriptions/<customer_id>/
- never inlined into the database or exposed in API responses - only
filename/type/note/status are ever returned to the client.
"""

import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.customer import Customer
from app.models.prescription import Prescription, PrescriptionStatus
from app.services.customer_notification_service import create_notification
from app.utils.response import bad_request, not_found

settings = get_settings()

_ALLOWED_TYPES = {"image/jpeg", "image/png", "application/pdf"}
_MAX_FILE_SIZE = 5 * 1024 * 1024


def list_prescriptions(db: Session, customer: Customer) -> list[Prescription]:
    return (
        db.query(Prescription)
        .filter(Prescription.customer_id == customer.id)
        .order_by(Prescription.submitted_at.desc())
        .all()
    )


def get_prescription(db: Session, customer: Customer, prescription_id: uuid.UUID) -> Prescription:
    prescription = (
        db.query(Prescription)
        .filter(Prescription.id == prescription_id, Prescription.customer_id == customer.id)
        .first()
    )
    if not prescription:
        raise not_found("Prescription", prescription_id)
    return prescription


async def submit_prescription(
    db: Session, customer: Customer, file: UploadFile, note: str | None
) -> Prescription:
    if file.content_type not in _ALLOWED_TYPES:
        raise bad_request("Only JPEG, PNG or PDF files are accepted.")

    contents = await file.read()
    if len(contents) > _MAX_FILE_SIZE:
        raise bad_request("File size must be under 5 MB.")

    upload_dir = Path(settings.uploads_dir) / "prescriptions" / str(customer.id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = upload_dir / stored_name
    file_path.write_bytes(contents)

    prescription = Prescription(
        customer_id=customer.id,
        file_name=file.filename or stored_name,
        file_path=str(file_path),
        file_type=file.content_type,
        note=note,
        status=PrescriptionStatus.UNDER_PHARMACIST_REVIEW.value,
    )
    db.add(prescription)
    db.flush()

    create_notification(
        db,
        customer.id,
        type="prescription_submitted",
        title="Prescription received",
        message="Your prescription has been submitted for pharmacist review.",
    )

    db.commit()
    db.refresh(prescription)
    return prescription

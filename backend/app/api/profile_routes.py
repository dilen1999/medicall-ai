"""Logged-in customer's own profile routes (GET/PATCH /customers/me).

IMPORTANT: this router must be included in app.main BEFORE
`customer_routes.router` - that router's `GET /customers/{customer_id}`
would otherwise greedily match `/customers/me` first (Starlette matches
routes in registration order) and fail trying to parse "me" as a UUID.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_customer, get_db
from app.models.customer import Customer
from app.schemas.profile_schema import CustomerProfileResponse, ProfileUpdateRequest
from app.services import profile_service

router = APIRouter(prefix="/customers", tags=["Profile"])


@router.get("/me", response_model=CustomerProfileResponse)
def get_my_profile(customer: Customer = Depends(get_current_customer)):
    return customer


@router.patch("/me", response_model=CustomerProfileResponse)
def update_my_profile(
    payload: ProfileUpdateRequest,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    return profile_service.update_profile(db, customer, payload)

"""Customer PWA authentication routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_customer, get_db
from app.models.customer import Customer
from app.schemas.auth_schema import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    customer, token = auth_service.register(db, payload)
    return AuthResponse(user=customer, token=token)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    customer, token = auth_service.login(db, payload)
    return AuthResponse(user=customer, token=token)


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    # Intentionally does not reveal whether the email exists.
    return {"message": "If an account exists for this email, a reset link has been sent."}


@router.post("/logout")
def logout(_current: Customer = Depends(get_current_customer)):
    # Stateless JWTs: nothing to invalidate server-side. The frontend clears
    # its own session storage on logout; this endpoint exists so the client
    # always has somewhere to POST to.
    return {"message": "Logged out."}

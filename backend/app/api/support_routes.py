"""Customer support case and AI-chat routes."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_customer, get_db
from app.models.customer import Customer
from app.schemas.support_schema import (
    ChatMessageRequest,
    ChatMessageResponse,
    PharmacistCallbackRequest,
    PostMessageRequest,
    SupportCaseCreate,
    SupportCaseResponse,
    SupportMessageResponse,
)
from app.services import support_service

router = APIRouter(prefix="/support", tags=["Support"])


@router.get("/cases", response_model=list[SupportCaseResponse])
def list_cases(customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    return support_service.list_cases(db, customer)


@router.get("/cases/{case_id}", response_model=SupportCaseResponse)
def get_case(case_id: uuid.UUID, customer: Customer = Depends(get_current_customer), db: Session = Depends(get_db)):
    return support_service.get_case(db, customer, case_id)


@router.post("/cases", response_model=SupportCaseResponse, status_code=201)
def create_case(
    payload: SupportCaseCreate,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    return support_service.create_case(db, customer, payload)


@router.post("/cases/{case_id}/messages", response_model=SupportMessageResponse)
def post_message(
    case_id: uuid.UUID,
    payload: PostMessageRequest,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    return support_service.post_message(db, customer, case_id, payload.message)


@router.post("/pharmacist-callback", response_model=SupportCaseResponse)
def request_pharmacist_callback(
    payload: PharmacistCallbackRequest,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    return support_service.request_pharmacist_callback(db, customer, payload)


@router.post("/ai-chat", response_model=ChatMessageResponse)
def send_chat_message(payload: ChatMessageRequest, _customer: Customer = Depends(get_current_customer)):
    return support_service.send_chat_message(payload.message)

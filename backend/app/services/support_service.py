"""Business logic for customer support cases and the AI chat panel.

The AI chat here is intentionally a simple keyword-based rule engine, not an
LLM call: it must never diagnose, recommend treatment, or discuss dosage,
and a deterministic rule set is the most reliable way to guarantee that
safety boundary for a support assistant. Any medical-sounding question is
escalated to a pharmacist instead of being answered.
"""

import random
import string
import uuid
from datetime import datetime

from sqlalchemy.orm import Session, joinedload

from app.models.customer import Customer
from app.models.support_case import SupportCase, SupportMessage
from app.schemas.support_schema import PharmacistCallbackRequest, SupportCaseCreate
from app.services.customer_notification_service import create_notification
from app.utils.response import not_found
from app.utils.timezone import now_sl

_MEDICAL_KEYWORDS = [
    "dose", "dosage", "diagnos", "symptom", "treatment", "medicine for", "prescri",
    "should i take", "side effect", "pain", "fever", "allerg", "pregnan",
]

_ESCALATION_REPLY = "I'm not able to provide medical advice. I can help arrange support from a qualified pharmacist."


def _generate_reference() -> str:
    return "SC-" + "".join(random.choices(string.digits, k=4))


def list_cases(db: Session, customer: Customer) -> list[SupportCase]:
    return (
        db.query(SupportCase)
        .options(joinedload(SupportCase.messages))
        .filter(SupportCase.customer_id == customer.id)
        .order_by(SupportCase.updated_at.desc())
        .all()
    )


def get_case(db: Session, customer: Customer, case_id: uuid.UUID) -> SupportCase:
    case = (
        db.query(SupportCase)
        .options(joinedload(SupportCase.messages))
        .filter(SupportCase.id == case_id, SupportCase.customer_id == customer.id)
        .first()
    )
    if not case:
        raise not_found("Support case", case_id)
    return case


def create_case(db: Session, customer: Customer, payload: SupportCaseCreate) -> SupportCase:
    is_medical = payload.category == "medical_question"
    now = now_sl()

    case = SupportCase(
        reference=_generate_reference(),
        customer_id=customer.id,
        related_order_id=payload.related_order_id,
        category=payload.category,
        description=payload.description,
        status="open",
        preferred_contact_method=payload.preferred_contact_method,
        preferred_callback_time=payload.preferred_callback_time,
        created_at=now,
        updated_at=now,
    )
    db.add(case)
    db.flush()

    if is_medical:
        db.add(
            SupportMessage(
                case_id=case.id,
                sender="system",
                message=(
                    "This is a medical question. A pharmacist callback has been scheduled - our AI assistant "
                    "cannot provide medical advice."
                ),
                created_at=now,
            )
        )
    else:
        db.add(SupportMessage(case_id=case.id, sender="customer", message=payload.description, created_at=now))

    create_notification(
        db,
        customer.id,
        type="pharmacist_callback_scheduled" if is_medical else "support_case_updated",
        title="Pharmacist callback scheduled" if is_medical else "Support case created",
        message=(
            "A pharmacist will call you back regarding your medical question."
            if is_medical
            else f"We've received your support case {case.reference}."
        ),
        link_to=f"/support/cases/{case.id}",
    )

    db.commit()
    db.refresh(case)
    return case


def request_pharmacist_callback(db: Session, customer: Customer, payload: PharmacistCallbackRequest) -> SupportCase:
    return create_case(
        db,
        customer,
        SupportCaseCreate(
            related_order_id=payload.related_order_id,
            category="medical_question",
            description=payload.description,
            preferred_contact_method="phone",
            preferred_callback_time=payload.preferred_callback_time,
        ),
    )


def post_message(db: Session, customer: Customer, case_id: uuid.UUID, message: str) -> SupportMessage:
    case = get_case(db, customer, case_id)
    entry = SupportMessage(case_id=case.id, sender="customer", message=message, created_at=now_sl())
    db.add(entry)
    case.updated_at = entry.created_at
    db.commit()
    db.refresh(entry)
    return entry


def send_chat_message(message: str) -> dict:
    lower = message.lower()
    is_medical = any(keyword in lower for keyword in _MEDICAL_KEYWORDS)

    if is_medical:
        return {
            "id": f"chat-{uuid.uuid4().hex[:10]}",
            "sender": "assistant",
            "message": _ESCALATION_REPLY,
            "created_at": datetime.now(),
            "is_escalation": True,
        }

    reply = (
        "I can help with order status, delivery issues, missing or damaged items, refunds, replacements, or "
        "pharmacy hours. Could you tell me a bit more?"
    )
    if "order" in lower or "track" in lower:
        reply = (
            "You can check your live order status any time from the Orders tab, or tap Track Order on an active "
            "order for real-time delivery updates."
        )
    elif "refund" in lower:
        reply = (
            "Refunds are usually processed to your original payment method within 3-5 business days once "
            "approved. Would you like me to raise a refund request for a specific order?"
        )
    elif "replace" in lower:
        reply = "For a replacement, please open a support case with the affected order and we'll arrange a free replacement delivery."
    elif "hour" in lower or "open" in lower:
        reply = "Most MediCall pharmacies are open 7:00 AM - 10:00 PM daily, with some 24-hour branches."
    elif "missing" in lower or "damage" in lower:
        reply = "Sorry to hear that. Please open a support case with the related order so our team can arrange a resolution."

    return {
        "id": f"chat-{uuid.uuid4().hex[:10]}",
        "sender": "assistant",
        "message": reply,
        "created_at": datetime.now(),
        "is_escalation": False,
    }

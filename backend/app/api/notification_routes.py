"""Human/pharmacist handoff notification API routes (used by n8n)."""

from fastapi import APIRouter

from app.schemas.notification_schema import HandoffNotificationRequest, HandoffNotificationResponse
from app.services.notification_service import send_handoff_alert_email

router = APIRouter(prefix="/notifications", tags=["n8n"])


@router.post("/handoff", response_model=HandoffNotificationResponse)
def send_handoff_notification(payload: HandoffNotificationRequest):
    """
    Send a human/pharmacist handoff alert to the owner. Called by n8n after
    GET /analysis/handoff-cases returns cases, or by any other internal
    caller. If SMTP is not configured, the alert is logged instead of
    failing - a handoff notification must never error out silently.
    """
    was_sent = send_handoff_alert_email(
        order_reference=payload.order_reference,
        customer_name=payload.customer_name,
        phone_number=payload.phone_number,
        issue_type=payload.issue_type,
        priority=payload.priority,
        pharmacist_required=payload.pharmacist_required,
        summary=payload.summary,
    )
    detail = (
        "Handoff alert emailed to owner."
        if was_sent
        else "SMTP not configured or delivery failed - alert was logged instead."
    )
    return HandoffNotificationResponse(sent=was_sent, detail=detail)

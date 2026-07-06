"""
Voice call service.

Provides the outbound-call and webhook-handling structure for real Twilio
integration, plus a simulation path that requires no Twilio credentials at
all. Routes call into this module; this module decides whether to place a
real call or just log what it *would* have done.

Two things can initiate a real Twilio call:
1. FastAPI itself, via POST /api/calls/start/{order_id} (_place_real_twilio_call
   below).
2. n8n, via its schedule trigger calling the Twilio REST API directly and
   then POST /api/orders/{order_id}/mark-call-triggered.

Both converge on the same order_id-keyed TwiML/gather flow
(/api/calls/twiml/{order_id}, /api/calls/gather-result/{order_id}) so Twilio
doesn't need to know which system dialed the call.
"""

import logging

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.call_log import CallStatus, CallLog
from app.models.medicine_order import MedicineOrder, OrderCallStatus
from app.utils.timezone import now_sl

logger = logging.getLogger("medicall.voice_service")

settings = get_settings()


def start_outbound_call(db: Session, order: MedicineOrder) -> CallLog:
    """
    Kick off an outbound confirmation call for a delivered order.

    Places a real Twilio call if credentials are configured, otherwise logs
    a simulated call intent and creates a QUEUED call log. Use the
    /simulate endpoint to actually feed in a transcript and run analysis.
    """
    call_log = CallLog(
        order_id=order.id,
        customer_id=order.customer_id,
        call_status=CallStatus.QUEUED.value,
        call_started_at=now_sl(),
    )
    db.add(call_log)
    db.commit()
    db.refresh(call_log)

    if settings.twilio_enabled:
        _place_real_twilio_call(db, order, call_log)
    else:
        logger.info(
            "[SIMULATED VOICE CALL] Twilio not configured. Would call customer_id=%s "
            "for order_id=%s from %s. Call log %s created in QUEUED state.",
            order.customer_id,
            order.id,
            settings.twilio_phone_number or "<no number configured>",
            call_log.id,
        )

    return call_log


def _place_real_twilio_call(db: Session, order: MedicineOrder, call_log: CallLog) -> None:
    """
    Real Twilio outbound call structure. Requires twilio_account_sid,
    twilio_auth_token, twilio_phone_number, and a public_base_url that
    Twilio can reach for the TwiML webhook.

    `url` points at the greeting endpoint (played when the customer answers),
    keyed by order_id (not call_log_id) so the same endpoint works whether
    FastAPI or n8n placed the call. `status_callback` points at the
    separate status-only webhook so call lifecycle events don't get mixed
    up with the conversation flow.
    """
    try:
        from twilio.rest import Client

        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        greeting_url = f"{settings.public_base_url}/api/calls/twiml/{order.id}"
        status_url = f"{settings.public_base_url}/api/calls/webhook"

        created_call = client.calls.create(
            to=str(order.customer.phone_number) if order.customer else "",
            from_=settings.twilio_phone_number,
            url=greeting_url,
            status_callback=status_url,
            status_callback_event=["initiated", "ringing", "answered", "completed"],
        )

        call_log.twilio_call_sid = created_call.sid
        order.twilio_call_sid = created_call.sid
        order.call_status = OrderCallStatus.TRIGGERED.value
        db.commit()
        logger.info("Twilio outbound call initiated for order_id=%s call_sid=%s", order.id, created_call.sid)
    except Exception:  # noqa: BLE001 - a failed real call must not crash the request
        logger.exception("Failed to place real Twilio call for order_id=%s", order.id)
        order.call_status = OrderCallStatus.FAILED.value
        call_log.call_status = CallStatus.FAILED.value
        db.commit()


def build_greeting_text(order: MedicineOrder) -> str:
    """Build the opening line asking the customer about their delivered order."""
    medicine_names = ", ".join(item.medicine_name for item in order.items) or "your recent order"
    return (
        f"Hello, this is MediCall AI calling from your online pharmacy regarding your "
        f"delivery of {medicine_names}. Please tell us whether you received your order "
        f"and whether there are any issues such as missing items, wrong medicine, "
        f"damaged package, refund request, or pharmacist support request."
    )


def generate_twiml_response(prompt_text: str, gather_action: str = "/api/calls/webhook") -> str:
    """
    Build the TwiML that Twilio should play/gather during the call.

    Uses <Gather input="speech"> so Twilio transcribes the customer's speech
    and posts it back to `gather_action` as SpeechResult. Twilio calls the
    action URL even on a timeout with no speech, so the trailing <Say> is
    just a last-resort fallback if that request itself fails.
    """
    escaped_prompt = prompt_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="{gather_action}" method="POST" timeout="5" speechTimeout="auto">
        <Say voice="alice">{escaped_prompt}</Say>
    </Gather>
    <Say voice="alice">We did not receive your response. The pharmacy support team may contact you later. Thank you.</Say>
</Response>"""


def websocket_base_url(public_base_url: str) -> str:
    """Convert the public https tunnel URL into the wss:// form Twilio's ConversationRelay requires."""
    if public_base_url.startswith("https://"):
        return "wss://" + public_base_url[len("https://") :]
    if public_base_url.startswith("http://"):
        return "ws://" + public_base_url[len("http://") :]
    return public_base_url


def generate_conversation_relay_twiml(order: MedicineOrder, relay_url: str) -> str:
    """
    Build TwiML that connects the call to a live, multi-turn AI conversation
    via Twilio ConversationRelay, instead of a single-question <Gather>.

    Twilio handles speech-to-text and text-to-speech; relay_url points at
    our WebSocket endpoint (/api/calls/relay/{order_id}) which generates
    each reply via conversation_service.py. Requires GEMINI_API_KEY - see
    Settings.conversational_ai_enabled, which gates whether this function
    is used at all.
    """
    greeting = build_greeting_text(order)
    escaped_greeting = (
        greeting.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
    )
    hints = "missing item, wrong medicine, damaged package, refund, replacement, pharmacist, no issues, everything is fine"
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <ConversationRelay url="{relay_url}" welcomeGreeting="{escaped_greeting}" language="en-US" interruptible="any" hints="{hints}" />
    </Connect>
</Response>"""


def handle_twilio_webhook(db: Session, call_sid: str, call_status: str) -> None:
    """
    Update a call log and order based on a Twilio call-status callback
    (POST /api/calls/webhook). Correlates purely by CallSid, since Twilio's
    StatusCallback carries no order_id/call_log_id in its path.

    A missing match (e.g. the call was placed outside this system) is not an
    error - the webhook always returns 200 either way.
    """
    logger.info("Twilio status webhook: call_sid=%s status=%s", call_sid, call_status)

    failed_statuses = {"failed", "busy", "no-answer", "canceled"}

    call_log = db.query(CallLog).filter(CallLog.twilio_call_sid == call_sid).first()
    if call_log:
        if call_status in failed_statuses:
            call_log.call_status = CallStatus.FAILED.value
        elif call_status == "in-progress":
            call_log.call_status = CallStatus.IN_PROGRESS.value
        # "completed" is left alone here - /gather-result already sets the
        # final COMPLETED/FAILED status based on whether a transcript came in.
        db.commit()

    if call_status in failed_statuses:
        order = db.query(MedicineOrder).filter(MedicineOrder.twilio_call_sid == call_sid).first()
        if order:
            order.call_status = OrderCallStatus.FAILED.value
            db.commit()

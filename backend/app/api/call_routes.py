"""Call API routes: starting calls, simulating calls, and the Twilio webhooks."""

import logging
import uuid

from fastapi import APIRouter, Depends, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload

from app.config import get_settings
from app.dependencies import get_db
from app.models.ai_call_analysis import AICallAnalysis
from app.models.call_log import CallLog, CallStatus
from app.models.medicine_order import MedicineOrder
from app.schemas.analysis_schema import AIAnalysisResult
from app.schemas.call_schema import CallLogResponse, CallWithAnalysisResponse, SimulateCallRequest
from app.services import conversation_service, order_service, voice_service
from app.services.ai_analysis_service import analyze_transcript
from app.utils.response import not_found
from app.utils.timezone import now_sl

logger = logging.getLogger("medicall.call_routes")
settings = get_settings()

router = APIRouter(prefix="/calls", tags=["Calls"])


@router.post("/start/{order_id}", response_model=CallLogResponse, status_code=201)
def start_call(order_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Trigger an outbound AI voice call for a delivered order directly from
    FastAPI (rather than via the n8n schedule trigger).

    Places a real Twilio call if credentials are configured, otherwise logs
    a simulated call intent and creates a QUEUED call log. Use the
    /simulate endpoint to actually feed in a transcript and run analysis.
    """
    order = order_service.get_order(db, order_id)
    call_log = voice_service.start_outbound_call(db, order)
    return call_log


@router.post("/simulate/{order_id}", response_model=CallWithAnalysisResponse, status_code=201)
def simulate_call(order_id: uuid.UUID, payload: SimulateCallRequest, db: Session = Depends(get_db)):
    """
    Simulation-mode endpoint: accepts a text transcript in place of a real
    voice call, runs it through AI analysis (RAG + LLM or rule-based
    fallback), and persists both the call log and the analysis.

    This is the primary way to demo MediCall AI without any Twilio, n8n, or
    OpenAI credentials configured.
    """
    order = order_service.get_order(db, order_id)

    now = now_sl()
    call_log = CallLog(
        order_id=order.id,
        customer_id=order.customer_id,
        call_status=CallStatus.SIMULATED.value,
        call_started_at=now,
        call_ended_at=now,
        transcript=payload.transcript,
    )
    db.add(call_log)
    db.commit()
    db.refresh(call_log)

    analysis_result = analyze_transcript(payload.transcript)

    analysis_row = AICallAnalysis(
        call_log_id=call_log.id,
        delivery_confirmed=analysis_result.delivery_confirmed,
        issue_type=analysis_result.issue_type,
        sentiment=analysis_result.sentiment,
        priority=analysis_result.priority,
        handoff_required=analysis_result.handoff_required,
        pharmacist_required=analysis_result.pharmacist_required,
        confidence_score=analysis_result.confidence_score,
        ai_summary=analysis_result.summary,
    )
    db.add(analysis_row)
    db.commit()
    db.refresh(analysis_row)

    return CallWithAnalysisResponse(call=call_log, analysis=analysis_row)


@router.get("", response_model=list[CallLogResponse])
def list_calls(db: Session = Depends(get_db)):
    """List all call logs, most recent first."""
    return db.query(CallLog).order_by(CallLog.created_at.desc()).all()


@router.get("/{call_id}", response_model=CallLogResponse)
def get_call(call_id: uuid.UUID, db: Session = Depends(get_db)):
    """Fetch a single call log by id."""
    call_log = db.query(CallLog).filter(CallLog.id == call_id).first()
    if not call_log:
        raise not_found("Call log", call_id)
    return call_log


def _find_or_create_call_log(db: Session, order: MedicineOrder) -> CallLog:
    """
    Find the in-flight call log for this order (created either by
    /calls/start, or by a previous hit of this same endpoint), or create one.

    Needed because n8n places the Twilio call directly against the Twilio
    REST API - no CallLog exists yet when Twilio first requests this TwiML.
    """
    call_log = (
        db.query(CallLog)
        .filter(
            CallLog.order_id == order.id,
            CallLog.call_status.in_([CallStatus.QUEUED.value, CallStatus.IN_PROGRESS.value]),
        )
        .order_by(CallLog.created_at.desc())
        .first()
    )
    if call_log is None:
        call_log = CallLog(
            order_id=order.id,
            customer_id=order.customer_id,
            call_status=CallStatus.IN_PROGRESS.value,
            call_started_at=now_sl(),
            twilio_call_sid=order.twilio_call_sid,
        )
        db.add(call_log)
    else:
        call_log.call_status = CallStatus.IN_PROGRESS.value
        if not call_log.twilio_call_sid and order.twilio_call_sid:
            call_log.twilio_call_sid = order.twilio_call_sid
    db.commit()
    db.refresh(call_log)
    return call_log


@router.post("/twiml/{order_id}")
async def call_greeting(order_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Twilio requests this when the customer answers (whether the call was
    placed by FastAPI's /calls/start or directly by n8n against the Twilio
    REST API). Returns the opening greeting naming the delivered items and
    gathers the customer's spoken reply, posting it to
    /calls/gather-result/{order_id} for AI analysis.
    """
    order = (
        db.query(MedicineOrder)
        .options(joinedload(MedicineOrder.items), joinedload(MedicineOrder.customer))
        .filter(MedicineOrder.id == order_id)
        .first()
    )
    if not order:
        twiml = voice_service.generate_twiml_response("We could not find your order details. Goodbye.")
        return Response(content=twiml, media_type="application/xml")

    _find_or_create_call_log(db, order)

    if settings.conversational_ai_enabled:
        relay_ws_url = f"{voice_service.websocket_base_url(settings.public_base_url)}/api/calls/relay/{order.id}"
        twiml = voice_service.generate_conversation_relay_twiml(order, relay_ws_url)
        return Response(content=twiml, media_type="application/xml")

    greeting = voice_service.build_greeting_text(order)
    twiml = voice_service.generate_twiml_response(greeting, gather_action=f"/api/calls/gather-result/{order.id}")
    return Response(content=twiml, media_type="application/xml")


@router.post("/gather-result/{order_id}")
async def call_gather_result(order_id: uuid.UUID, request: Request, db: Session = Depends(get_db)):
    """
    Twilio posts the customer's transcribed speech here (or an empty result
    on timeout). Expected form fields: CallSid, SpeechResult, Confidence,
    From, To, CallStatus.

    Runs the transcript through AI analysis (RAG + LLM or rule-based
    fallback with a hard-coded medical-safety override) and updates the
    order's call_status accordingly, so n8n's next poll of
    GET /analysis/handoff-cases picks up anything needing a human/pharmacist.
    """
    form = await request.form()
    transcript = form.get("SpeechResult")
    call_sid = form.get("CallSid")
    logger.info("Gather result for order_id=%s call_sid=%s transcript=%r", order_id, call_sid, transcript)

    order = db.query(MedicineOrder).filter(MedicineOrder.id == order_id).first()
    if not order:
        twiml = voice_service.generate_twiml_response("We could not find your order record. Goodbye.")
        return Response(content=twiml, media_type="application/xml")

    call_log = (
        db.query(CallLog)
        .filter(CallLog.order_id == order.id)
        .order_by(CallLog.created_at.desc())
        .first()
    )
    if call_log is None:
        call_log = CallLog(
            order_id=order.id,
            customer_id=order.customer_id,
            call_status=CallStatus.IN_PROGRESS.value,
            call_started_at=now_sl(),
        )
        db.add(call_log)
        db.flush()

    call_log.call_ended_at = now_sl()
    if call_sid and not call_log.twilio_call_sid:
        call_log.twilio_call_sid = call_sid

    if transcript:
        call_log.transcript = transcript
        call_log.call_status = CallStatus.COMPLETED.value
        db.commit()

        analysis_result = analyze_transcript(transcript)
        logger.info(
            "Analysis for order_id=%s: issue=%s sentiment=%s priority=%s handoff=%s pharmacist=%s",
            order_id,
            analysis_result.issue_type,
            analysis_result.sentiment,
            analysis_result.priority,
            analysis_result.handoff_required,
            analysis_result.pharmacist_required,
        )
        db.add(
            AICallAnalysis(
                call_log_id=call_log.id,
                delivery_confirmed=analysis_result.delivery_confirmed,
                issue_type=analysis_result.issue_type,
                sentiment=analysis_result.sentiment,
                priority=analysis_result.priority,
                handoff_required=analysis_result.handoff_required,
                pharmacist_required=analysis_result.pharmacist_required,
                confidence_score=analysis_result.confidence_score,
                ai_summary=analysis_result.summary,
            )
        )
        db.commit()

        if analysis_result.handoff_required:
            order_service.mark_call_handoff_required(db, order.id)
        else:
            order_service.mark_call_completed(db, order.id)
    else:
        call_log.call_status = CallStatus.FAILED.value
        db.commit()
        order_service.mark_call_failed(db, order.id, reason="No speech result received (timeout).")

    twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you. We have recorded your response. If support is required, the pharmacy team will contact you soon.</Say>
</Response>"""
    return Response(content=twiml, media_type="application/xml")


@router.websocket("/relay/{order_id}")
async def call_relay(websocket: WebSocket, order_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Twilio ConversationRelay WebSocket endpoint - the live, multi-turn
    counterpart to /twiml + /gather-result. Only reached when
    Settings.conversational_ai_enabled is true (GEMINI_API_KEY configured).

    Twilio sends one JSON message per event ("setup", "prompt", "interrupt",
    "dtmf", "error"); we reply with {"type": "text", ...} for each customer
    utterance via conversation_service, and {"type": "end", ...} to hang up.
    On disconnect (either side), the full conversation is analyzed and
    persisted exactly like the single-question /gather-result flow.
    """
    await websocket.accept()

    order = (
        db.query(MedicineOrder)
        .options(joinedload(MedicineOrder.items), joinedload(MedicineOrder.customer))
        .filter(MedicineOrder.id == order_id)
        .first()
    )
    if not order:
        await websocket.close(code=1008)
        return

    session = conversation_service.start_session(order)

    try:
        while True:
            raw = await websocket.receive_json()
            msg_type = raw.get("type")

            if msg_type == "setup":
                logger.info("ConversationRelay setup for order_id=%s call_sid=%s", order_id, raw.get("callSid"))
            elif msg_type == "prompt":
                if not raw.get("last", True):
                    continue  # wait for the final chunk of this utterance
                customer_text = raw.get("voicePrompt", "")
                reply_text, should_end = conversation_service.handle_customer_turn(session, customer_text)
                await websocket.send_json({"type": "text", "token": reply_text, "last": True})
                if should_end:
                    await websocket.send_json({"type": "end", "handoffData": '{"reasonCode":"completed"}'})
                    break
            elif msg_type == "interrupt":
                logger.info(
                    "ConversationRelay interrupt for order_id=%s: %r", order_id, raw.get("utteranceUntilInterrupt")
                )
            elif msg_type == "error":
                logger.error("ConversationRelay error for order_id=%s: %s", order_id, raw.get("description"))
            # "dtmf" and any unrecognized types are ignored - this flow is speech-only.
    except WebSocketDisconnect:
        logger.info("ConversationRelay websocket disconnected for order_id=%s", order_id)
    except Exception:  # noqa: BLE001 - a live-call bug must still finalize/save what we have
        logger.exception("ConversationRelay loop failed for order_id=%s", order_id)
    finally:
        _finalize_conversation(db, order, session)


def _finalize_conversation(db: Session, order: MedicineOrder, session: conversation_service.ConversationSession) -> None:
    """Persist the full live conversation exactly like /gather-result does for a single answer."""
    transcript = conversation_service.full_transcript(session)

    call_log = (
        db.query(CallLog)
        .filter(CallLog.order_id == order.id)
        .order_by(CallLog.created_at.desc())
        .first()
    )
    if call_log is None:
        call_log = CallLog(
            order_id=order.id,
            customer_id=order.customer_id,
            call_status=CallStatus.IN_PROGRESS.value,
            call_started_at=now_sl(),
        )
        db.add(call_log)
        db.flush()

    call_log.transcript = transcript
    call_log.call_ended_at = now_sl()
    call_log.call_status = CallStatus.COMPLETED.value
    db.commit()

    analysis_result = analyze_transcript(transcript)

    if session.escalated:
        # Defense in depth: a medical question was gated live during the
        # call, so force the same outcome here regardless of what the
        # post-call classifier concluded from the full text.
        data = analysis_result.model_dump()
        data["pharmacist_required"] = True
        data["handoff_required"] = True
        data["priority"] = "critical"
        if data["issue_type"] != "wrong_medicine":
            data["issue_type"] = "pharmacist_support"
        analysis_result = AIAnalysisResult(**data)

    db.add(
        AICallAnalysis(
            call_log_id=call_log.id,
            delivery_confirmed=analysis_result.delivery_confirmed,
            issue_type=analysis_result.issue_type,
            sentiment=analysis_result.sentiment,
            priority=analysis_result.priority,
            handoff_required=analysis_result.handoff_required,
            pharmacist_required=analysis_result.pharmacist_required,
            confidence_score=analysis_result.confidence_score,
            ai_summary=analysis_result.summary,
        )
    )
    db.commit()

    if analysis_result.handoff_required:
        order_service.mark_call_handoff_required(db, order.id)
    else:
        order_service.mark_call_completed(db, order.id)

    logger.info(
        "Live conversation finalized for order_id=%s: issue=%s priority=%s handoff=%s escalated_live=%s",
        order.id,
        analysis_result.issue_type,
        analysis_result.priority,
        analysis_result.handoff_required,
        session.escalated,
    )


@router.post("/webhook")
async def twilio_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Twilio posts call lifecycle status events here (initiated, ringing,
    answered/in-progress, completed, busy, failed, no-answer) as
    application/x-www-form-urlencoded data. Expected fields: CallSid,
    CallStatus, From, To, Direction. This is status-only; the conversation
    flow lives in /twiml and /gather-result above.
    """
    form = await request.form()
    call_sid = form.get("CallSid", "unknown")
    call_status = form.get("CallStatus", "unknown")
    logger.info(
        "Twilio webhook payload: call_sid=%s status=%s from=%s to=%s direction=%s",
        call_sid,
        call_status,
        form.get("From"),
        form.get("To"),
        form.get("Direction"),
    )

    voice_service.handle_twilio_webhook(db=db, call_sid=call_sid, call_status=call_status)

    return Response(status_code=200)

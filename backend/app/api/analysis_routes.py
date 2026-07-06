"""AI analysis API routes."""

import uuid
from datetime import datetime, time, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.dependencies import get_db
from app.models.ai_call_analysis import AICallAnalysis
from app.models.call_log import CallLog
from app.schemas.analysis_schema import AnalysisResponse, HandoffCaseResponse
from app.services.ai_analysis_service import analyze_transcript
from app.utils.response import bad_request, conflict, not_found
from app.utils.timezone import today_sl

router = APIRouter(prefix="/analyze-call", tags=["Analysis"])

# A second router for read-only /api/analysis endpoints, mounted separately in main.py
analysis_read_router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.post("/{call_log_id}", response_model=AnalysisResponse, status_code=201)
def analyze_call(call_log_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Run (or re-run) AI analysis on an existing call log's transcript.

    Useful when a call was created via /calls/start (real Twilio flow) and
    the transcript was attached afterwards via the webhook, or when you want
    to re-analyze a call after updating the knowledge base.
    """
    call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
    if not call_log:
        raise not_found("Call log", call_log_id)
    if not call_log.transcript:
        raise bad_request("This call log has no transcript to analyze yet.")

    existing = db.query(AICallAnalysis).filter(AICallAnalysis.call_log_id == call_log_id).first()
    if existing:
        raise conflict("This call has already been analyzed. Delete the existing analysis to re-run it.")

    result = analyze_transcript(call_log.transcript)

    analysis_row = AICallAnalysis(
        call_log_id=call_log.id,
        delivery_confirmed=result.delivery_confirmed,
        issue_type=result.issue_type,
        sentiment=result.sentiment,
        priority=result.priority,
        handoff_required=result.handoff_required,
        pharmacist_required=result.pharmacist_required,
        confidence_score=result.confidence_score,
        ai_summary=result.summary,
    )
    db.add(analysis_row)
    db.commit()
    db.refresh(analysis_row)
    return analysis_row


@analysis_read_router.get("", response_model=list[AnalysisResponse])
def list_analyses(db: Session = Depends(get_db)):
    """List all call analyses, most recent first."""
    return db.query(AICallAnalysis).order_by(AICallAnalysis.created_at.desc()).all()


@analysis_read_router.get("/handoff-cases", response_model=list[HandoffCaseResponse], tags=["n8n"])
def list_handoff_cases(
    today_only: bool = Query(False, description="Only return cases created today."),
    db: Session = Depends(get_db),
):
    """
    n8n endpoint: the owner/pharmacist actionable queue - every analysis
    flagged for human handoff or pharmacist review, joined with order and
    customer details so an alert email can be sent without extra lookups.
    """
    query = (
        db.query(AICallAnalysis)
        .options(
            joinedload(AICallAnalysis.call_log).joinedload(CallLog.order),
            joinedload(AICallAnalysis.call_log).joinedload(CallLog.customer),
        )
        .filter((AICallAnalysis.handoff_required == True) | (AICallAnalysis.pharmacist_required == True))  # noqa: E712
    )

    if today_only:
        start = datetime.combine(today_sl(), time.min)
        end = start + timedelta(days=1)
        query = query.filter(AICallAnalysis.created_at >= start, AICallAnalysis.created_at < end)

    rows = query.order_by(AICallAnalysis.created_at.desc()).all()

    return [
        HandoffCaseResponse(
            id=row.id,
            call_log_id=row.call_log_id,
            order_reference=row.call_log.order.order_reference,
            customer_name=row.call_log.customer.full_name,
            phone_number=row.call_log.customer.phone_number,
            delivery_confirmed=row.delivery_confirmed,
            issue_type=row.issue_type,
            sentiment=row.sentiment,
            priority=row.priority,
            handoff_required=row.handoff_required,
            pharmacist_required=row.pharmacist_required,
            confidence_score=row.confidence_score,
            ai_summary=row.ai_summary,
            created_at=row.created_at,
        )
        for row in rows
    ]


@analysis_read_router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(analysis_id: uuid.UUID, db: Session = Depends(get_db)):
    """Fetch a single analysis by id."""
    analysis = db.query(AICallAnalysis).filter(AICallAnalysis.id == analysis_id).first()
    if not analysis:
        raise not_found("Analysis", analysis_id)
    return analysis

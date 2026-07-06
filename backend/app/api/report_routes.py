"""Daily owner report API routes."""

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.report_schema import DailySummaryResponse, SendSummaryResponse
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/daily-summary", response_model=DailySummaryResponse)
def get_daily_summary(
    report_date: date | None = Query(default=None, description="Defaults to today if omitted."),
    db: Session = Depends(get_db),
):
    """Compute (without persisting or emailing) the daily summary for a given date."""
    return report_service.build_daily_summary(db, report_date)


@router.post("/send-daily-summary", response_model=SendSummaryResponse)
def send_daily_summary(
    report_date: date | None = Query(default=None, description="Defaults to today if omitted."),
    db: Session = Depends(get_db),
):
    """
    Compute the daily summary, persist it, and email it to the owner
    (or log it if SMTP is not configured).
    """
    report_row = report_service.send_daily_summary(db, report_date)
    detail = (
        "Summary emailed to owner."
        if report_row.sent_status == "SENT"
        else "SMTP not configured or delivery failed - summary was logged and saved instead."
    )
    return SendSummaryResponse(
        report_date=report_row.report_date,
        sent_status=report_row.sent_status,
        sent_at=report_row.sent_at,
        detail=detail,
    )

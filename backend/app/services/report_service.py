"""Daily owner summary report generation."""

from datetime import date, datetime, time, timedelta

from sqlalchemy.orm import Session

from app.models.ai_call_analysis import AICallAnalysis
from app.models.call_log import CallLog
from app.models.owner_report import OwnerReport
from app.schemas.report_schema import DailySummaryResponse
from app.services.notification_service import send_owner_summary_email
from app.utils.timezone import now_sl, today_sl


def _day_bounds(report_date: date) -> tuple[datetime, datetime]:
    start = datetime.combine(report_date, time.min)
    end = start + timedelta(days=1)
    return start, end


def build_daily_summary(db: Session, report_date: date | None = None) -> DailySummaryResponse:
    """
    Aggregate call + analysis data for a given day (defaults to today) into
    the owner-facing daily summary shape.
    """
    target_date = report_date or today_sl()
    start, end = _day_bounds(target_date)

    analyses = (
        db.query(AICallAnalysis)
        .join(CallLog, AICallAnalysis.call_log_id == CallLog.id)
        .filter(CallLog.created_at >= start, CallLog.created_at < end)
        .all()
    )

    total_calls = len(analyses)
    successful_deliveries = sum(1 for a in analyses if a.delivery_confirmed and a.issue_type == "no_issue")
    missing_item_count = sum(1 for a in analyses if a.issue_type == "missing_item")
    wrong_medicine_count = sum(1 for a in analyses if a.issue_type == "wrong_medicine")
    damaged_package_count = sum(1 for a in analyses if a.issue_type == "damaged_package")
    pharmacist_handoff_count = sum(1 for a in analyses if a.pharmacist_required)
    handoff_required_count = sum(1 for a in analyses if a.handoff_required)
    high_priority_count = sum(1 for a in analyses if a.priority in ("high", "critical"))

    urgent_cases = [a for a in analyses if a.priority == "critical" or a.pharmacist_required]
    if urgent_cases:
        urgent_summary = (
            f"{len(urgent_cases)} urgent case(s) require immediate human/pharmacist review: "
            + "; ".join(a.ai_summary for a in urgent_cases[:5])
        )
    else:
        urgent_summary = "No urgent or pharmacist-escalation cases were recorded."

    if total_calls == 0:
        summary = f"No calls were logged on {target_date.isoformat()}."
    else:
        summary = (
            f"Handled {total_calls} call(s) on {target_date.isoformat()}. "
            f"{successful_deliveries} confirmed clean delivery, {high_priority_count} were high/critical "
            f"priority, and {pharmacist_handoff_count} required pharmacist involvement."
        )

    return DailySummaryResponse(
        report_date=target_date,
        total_calls=total_calls,
        successful_deliveries=successful_deliveries,
        missing_item_count=missing_item_count,
        wrong_medicine_count=wrong_medicine_count,
        damaged_package_count=damaged_package_count,
        pharmacist_handoff_count=pharmacist_handoff_count,
        handoff_required_count=handoff_required_count,
        high_priority_count=high_priority_count,
        urgent_cases_summary=urgent_summary,
        summary=summary,
    )


def send_daily_summary(db: Session, report_date: date | None = None) -> OwnerReport:
    """
    Build the daily summary, persist it as an OwnerReport row, and attempt to
    email it to the owner. Always persists the report row, even if email
    delivery fails or is unconfigured (sent_status reflects the outcome).
    """
    target_date = report_date or today_sl()
    daily = build_daily_summary(db, target_date)

    email_body = (
        f"MediCall AI - Daily Summary for {daily.report_date.isoformat()}\n\n"
        f"{daily.summary}\n\n"
        f"Total calls: {daily.total_calls}\n"
        f"Successful deliveries: {daily.successful_deliveries}\n"
        f"Missing item reports: {daily.missing_item_count}\n"
        f"Wrong medicine reports: {daily.wrong_medicine_count}\n"
        f"Damaged package reports: {daily.damaged_package_count}\n"
        f"Pharmacist handoffs: {daily.pharmacist_handoff_count}\n\n"
        f"{daily.urgent_cases_summary}\n"
    )

    was_sent = send_owner_summary_email(email_body)

    report_row = OwnerReport(
        report_date=daily.report_date,
        total_calls=daily.total_calls,
        successful_deliveries=daily.successful_deliveries,
        missing_item_count=daily.missing_item_count,
        wrong_medicine_count=daily.wrong_medicine_count,
        damaged_package_count=daily.damaged_package_count,
        pharmacist_handoff_count=daily.pharmacist_handoff_count,
        summary=daily.summary,
        sent_at=now_sl() if was_sent else None,
        sent_status="SENT" if was_sent else "LOGGED_ONLY",
    )
    db.add(report_row)
    db.commit()
    db.refresh(report_row)
    return report_row

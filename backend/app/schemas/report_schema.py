"""Pydantic schemas for the daily owner report."""

from datetime import date, datetime

from pydantic import BaseModel


class DailySummaryResponse(BaseModel):
    report_date: date
    total_calls: int
    successful_deliveries: int
    missing_item_count: int
    wrong_medicine_count: int
    damaged_package_count: int
    pharmacist_handoff_count: int
    handoff_required_count: int
    high_priority_count: int
    urgent_cases_summary: str
    summary: str


class SendSummaryResponse(BaseModel):
    report_date: date
    sent_status: str
    sent_at: datetime | None
    detail: str

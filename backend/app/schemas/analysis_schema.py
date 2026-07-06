"""Pydantic schemas for the AI call analysis resource."""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

IssueType = Literal[
    "no_issue",
    "missing_item",
    "wrong_medicine",
    "damaged_package",
    "pharmacist_support",
    "refund_or_replacement",
    "delivery_delay_feedback",
    "other",
]

Sentiment = Literal["positive", "neutral", "concerned", "angry"]
Priority = Literal["low", "medium", "high", "critical"]


class AIAnalysisResult(BaseModel):
    """
    The structured object produced by the AI analysis service, regardless of
    whether it came from the LLM or the rule-based fallback classifier. This
    is intentionally the same shape as AICallAnalysis so it can be persisted
    directly.
    """

    delivery_confirmed: bool
    issue_type: IssueType
    sentiment: Sentiment
    priority: Priority
    handoff_required: bool
    pharmacist_required: bool
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    summary: str


class AnalysisResponse(BaseModel):
    id: uuid.UUID
    call_log_id: uuid.UUID
    delivery_confirmed: bool
    issue_type: str
    sentiment: str
    priority: str
    handoff_required: bool
    pharmacist_required: bool
    confidence_score: float
    ai_summary: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HandoffCaseResponse(BaseModel):
    """
    Owner/pharmacist actionable queue shape returned by
    GET /analysis/handoff-cases. A superset of AnalysisResponse (so the
    existing React dashboard's HandoffQueue page keeps working unchanged)
    plus order_reference/customer_name/phone_number joined in, so n8n can
    send a complete alert email without extra lookups.
    """

    id: uuid.UUID
    call_log_id: uuid.UUID
    order_reference: str
    customer_name: str
    phone_number: str
    delivery_confirmed: bool
    issue_type: str
    sentiment: str
    priority: str
    handoff_required: bool
    pharmacist_required: bool
    confidence_score: float
    ai_summary: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

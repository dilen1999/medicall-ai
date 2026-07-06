"""Pydantic schemas for the CallLog resource and simulation endpoint."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.analysis_schema import AnalysisResponse


class SimulateCallRequest(BaseModel):
    """Body for POST /api/calls/simulate/{order_id} — text stands in for a real call."""

    transcript: str = Field(..., min_length=1, description="Customer's spoken response, as text.")


class CallLogResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    customer_id: uuid.UUID
    call_status: str
    call_started_at: datetime | None
    call_ended_at: datetime | None
    recording_url: str | None
    transcript: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CallWithAnalysisResponse(BaseModel):
    """Returned by the simulation endpoint: call + its analysis together."""

    call: CallLogResponse
    analysis: AnalysisResponse

    model_config = ConfigDict(from_attributes=True)


class TwilioWebhookPayload(BaseModel):
    """
    Minimal shape of the fields MediCall AI reads from a Twilio callback.
    Twilio actually posts application/x-www-form-urlencoded data; the route
    parses that form data into this shape rather than expecting raw JSON.
    """

    CallSid: str
    CallStatus: str
    RecordingUrl: str | None = None
    TranscriptionText: str | None = None

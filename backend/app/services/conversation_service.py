"""
Real-time conversational AI service for Twilio ConversationRelay.

Unlike ai_analysis_service.py (which classifies a finished transcript AFTER
a call ends), this module generates the AI's spoken replies DURING a live
call, turn by turn, using Gemini.

CRITICAL SAFETY DESIGN: every customer utterance is checked against
MEDICAL_ESCALATION_KEYWORDS *before* Gemini is ever invoked for that turn.
If matched, Gemini is skipped entirely and a fixed, hardcoded pharmacist-
escalation line is spoken instead. This means the live model is
structurally prevented from answering a medical question, not merely
instructed not to - the same safety-net philosophy as
ai_analysis_service._apply_safety_overrides, but applied before a word is
spoken instead of only after the call ends.
"""

import logging
from dataclasses import dataclass, field

from app.config import get_settings
from app.models.medicine_order import MedicineOrder
from app.prompts.voice_agent_prompt import LIVE_CONVERSATION_SYSTEM_PROMPT
from app.utils.constants import MEDICAL_ESCALATION_KEYWORDS

logger = logging.getLogger("medicall.conversation_service")
settings = get_settings()

# Hard cap on customer turns so a stuck/looping conversation can't run away
# on cost or hold the line open indefinitely.
MAX_TURNS = 6

PHARMACIST_ESCALATION_REPLY = (
    "I understand your concern, but I'm not able to answer medical questions like that. "
    "I'm arranging for a licensed pharmacist to call you back shortly to discuss it directly. "
    "Is there anything else about your delivery I can help confirm?"
)

WRAP_UP_REPLY = (
    "Thank you for your time today. We've recorded everything you've told us, and our "
    "support team will follow up if needed. Have a great day, goodbye."
)


@dataclass
class ConversationSession:
    """Per-call in-memory state. Lives only as long as the WebSocket connection."""

    order: MedicineOrder
    chat: object  # google.genai chat session
    turns: list[str] = field(default_factory=list)
    escalated: bool = False
    turn_count: int = 0


def start_session(order: MedicineOrder) -> ConversationSession:
    """Open a new Gemini chat session for this call and record the opening greeting."""
    from google import genai

    from app.services.voice_service import build_greeting_text

    client = genai.Client(api_key=settings.gemini_api_key)
    chat = client.chats.create(
        model=settings.gemini_model,
        config={"system_instruction": LIVE_CONVERSATION_SYSTEM_PROMPT},
    )
    session = ConversationSession(order=order, chat=chat)
    session.turns.append(f"AI: {build_greeting_text(order)}")
    return session


def handle_customer_turn(session: ConversationSession, customer_text: str) -> tuple[str, bool]:
    """
    Process one customer utterance and return (reply_text, should_end_call).

    Order of checks matters: the medical-safety keyword gate runs before
    Gemini is invoked at all, so a medical question never reaches the model.
    """
    session.turns.append(f"Customer: {customer_text}")
    session.turn_count += 1

    text_lower = customer_text.lower()
    if any(keyword in text_lower for keyword in MEDICAL_ESCALATION_KEYWORDS):
        session.escalated = True
        reply = PHARMACIST_ESCALATION_REPLY
        session.turns.append(f"AI: {reply}")
        logger.info("Live conversation: medical keyword gate triggered - Gemini not invoked for this turn.")
        return reply, False

    if session.turn_count >= MAX_TURNS:
        reply = WRAP_UP_REPLY
        session.turns.append(f"AI: {reply}")
        return reply, True

    try:
        response = session.chat.send_message(customer_text)
        reply = (getattr(response, "text", None) or "").strip() or "Sorry, could you say that again, please?"
    except Exception:  # noqa: BLE001 - a failed live turn must not crash the call
        logger.exception("Gemini turn generation failed - wrapping up the call gracefully.")
        reply = WRAP_UP_REPLY
        session.turns.append(f"AI: {reply}")
        return reply, True

    session.turns.append(f"AI: {reply}")
    return reply, False


def full_transcript(session: ConversationSession) -> str:
    """Join every turn into one transcript string for post-call analysis."""
    return "\n".join(session.turns)

"""
AI call analysis service.

This is the heart of MediCall AI: it takes a customer transcript, optionally
grounds it in retrieved pharmacy policy context (RAG), and produces a
structured AIAnalysisResult.

Two execution paths:
1. LLM path (OPENAI_API_KEY configured): sends the transcript + policy
   context to the chat model using the strict system prompt in
   voice_agent_prompt.py, parses the JSON response.
2. Rule-based fallback path (no API key): a deterministic keyword classifier
   that implements the exact same business rules, so the whole project is
   runnable and demoable with zero external credentials.

Regardless of which path produced the result, a safety-net validation pass
(`_apply_safety_overrides`) re-checks the transcript for medical-escalation
keywords and low-confidence scores, and forces handoff/pharmacist flags on
if needed. This means medical safety never depends solely on the LLM
correctly following instructions.
"""

import json
import logging

from app.config import get_settings
from app.prompts.voice_agent_prompt import VOICE_AGENT_SYSTEM_PROMPT, build_user_prompt
from app.schemas.analysis_schema import AIAnalysisResult
from app.services.rag_service import get_policy_context_text
from app.utils.constants import (
    ANGRY_KEYWORDS,
    CONFIDENCE_HANDOFF_THRESHOLD,
    DAMAGED_KEYWORDS,
    MEDICAL_ESCALATION_KEYWORDS,
    MISSING_ITEM_KEYWORDS,
    NO_ISSUE_KEYWORDS,
    REFUND_KEYWORDS,
    WRONG_MEDICINE_KEYWORDS,
)

logger = logging.getLogger("medicall.ai_analysis_service")

settings = get_settings()


def _customer_only_text(transcript: str) -> str:
    """
    Strip a live ConversationRelay transcript (interleaved "AI: ..." /
    "Customer: ..." lines, see conversation_service.full_transcript) down to
    just what the customer said.

    Needed because the AI's own scripted greeting names every possible issue
    type verbatim ("...missing items, wrong medicine, damaged package, refund
    request..."), which would otherwise trip every keyword below on every
    single call regardless of what the customer actually said. Single-
    utterance transcripts (from /gather-result or /simulate) don't use this
    "Customer:" prefix format at all, so they pass through unchanged.
    """
    customer_lines = [
        line.split(":", 1)[1].strip()
        for line in transcript.splitlines()
        if line.strip().lower().startswith("customer:")
    ]
    return "\n".join(customer_lines) if customer_lines else transcript


def analyze_transcript(transcript: str) -> AIAnalysisResult:
    """
    Main entry point used by the call/analysis routes.

    Retrieves policy context via RAG, then dispatches to the LLM or the
    rule-based fallback, then applies safety overrides before returning.
    """
    policy_context = get_policy_context_text(transcript, top_k=3)

    if settings.llm_enabled:
        result = _analyze_with_llm(transcript, policy_context)
    else:
        logger.info("OPENAI_API_KEY not set - using rule-based fallback classifier.")
        result = _analyze_with_rules(_customer_only_text(transcript))

    return _apply_safety_overrides(_customer_only_text(transcript), result)


def _analyze_with_llm(transcript: str, policy_context: str) -> AIAnalysisResult:
    from openai import OpenAI

    client = OpenAI(api_key=settings.openai_api_key)
    user_prompt = build_user_prompt(transcript, policy_context)

    try:
        response = client.chat.completions.create(
            model=settings.openai_chat_model,
            messages=[
                {"role": "system", "content": VOICE_AGENT_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        raw_content = response.choices[0].message.content
        data = json.loads(raw_content)
        return AIAnalysisResult(**data)
    except Exception:  # noqa: BLE001
        logger.exception("LLM analysis failed - falling back to rule-based classifier.")
        return _analyze_with_rules(_customer_only_text(transcript))


def _analyze_with_rules(transcript: str) -> AIAnalysisResult:
    """
    Deterministic keyword-based classifier implementing the same business
    rules described in the prompt. Used whenever no OpenAI key is present,
    or as a safety-net fallback if the LLM call fails.
    """
    text = transcript.lower()

    has_medical_question = any(keyword in text for keyword in MEDICAL_ESCALATION_KEYWORDS)
    has_wrong_medicine = any(keyword in text for keyword in WRONG_MEDICINE_KEYWORDS)
    has_missing_item = any(keyword in text for keyword in MISSING_ITEM_KEYWORDS)
    has_damaged_package = any(keyword in text for keyword in DAMAGED_KEYWORDS)
    has_refund_request = any(keyword in text for keyword in REFUND_KEYWORDS)
    has_no_issue_signal = any(keyword in text for keyword in NO_ISSUE_KEYWORDS)
    is_angry = any(keyword in text for keyword in ANGRY_KEYWORDS)

    delivery_confirmed = "did not receive" not in text and "never arrived" not in text

    # Priority order matches the medical-safety-first rule in the prompt:
    # a medical question always wins, regardless of other signals.
    if has_medical_question:
        issue_type = "pharmacist_support"
        priority = "critical"
        handoff_required = True
        pharmacist_required = True
        confidence = 0.8
        summary = (
            "Customer asked a medical-related question (dosage, side effects, symptoms, "
            "or similar). Escalated directly to a pharmacist without providing medical advice."
        )
    elif has_wrong_medicine:
        issue_type = "wrong_medicine"
        priority = "critical"
        handoff_required = True
        pharmacist_required = True
        confidence = 0.82
        summary = "Customer reports receiving the wrong medicine. Escalated as a critical patient-safety issue."
    elif has_damaged_package:
        issue_type = "damaged_package"
        priority = "high"
        handoff_required = True
        pharmacist_required = False
        confidence = 0.8
        summary = "Customer reports the package or medicine strip was damaged, opened, or tampered with."
    elif has_missing_item:
        issue_type = "missing_item"
        priority = "high"
        handoff_required = True
        pharmacist_required = False
        confidence = 0.85
        summary = "Customer reports one or more items were missing from the delivered order."
    elif has_refund_request:
        issue_type = "refund_or_replacement"
        priority = "medium"
        handoff_required = True
        pharmacist_required = False
        confidence = 0.75
        summary = "Customer requested a refund or replacement for their order."
    elif has_no_issue_signal:
        issue_type = "no_issue"
        priority = "low"
        handoff_required = False
        pharmacist_required = False
        confidence = 0.9
        summary = "Customer confirmed successful delivery with no reported issues."
    else:
        issue_type = "other"
        priority = "medium"
        handoff_required = True
        pharmacist_required = False
        confidence = 0.5
        summary = "Customer response did not clearly match a known category; flagged for human review."

    if is_angry:
        priority = "critical" if priority == "critical" else "high"
        handoff_required = True
        sentiment = "angry"
    elif issue_type == "no_issue":
        sentiment = "positive"
    elif has_medical_question or has_wrong_medicine:
        sentiment = "concerned"
    elif issue_type == "other":
        sentiment = "neutral"
    else:
        sentiment = "concerned"

    return AIAnalysisResult(
        delivery_confirmed=delivery_confirmed,
        issue_type=issue_type,
        sentiment=sentiment,
        priority=priority,
        handoff_required=handoff_required,
        pharmacist_required=pharmacist_required,
        confidence_score=confidence,
        summary=summary,
    )


def _apply_safety_overrides(transcript: str, result: AIAnalysisResult) -> AIAnalysisResult:
    """
    Safety net applied AFTER classification, regardless of source (LLM or
    rules). This guarantees medical escalation and low-confidence handoff
    happen even if the LLM ignored an instruction.
    """
    text = transcript.lower()
    data = result.model_dump()

    if any(keyword in text for keyword in MEDICAL_ESCALATION_KEYWORDS):
        data["pharmacist_required"] = True
        data["handoff_required"] = True
        data["priority"] = "critical"
        if data["issue_type"] not in ("wrong_medicine",):
            data["issue_type"] = "pharmacist_support"

    if data["confidence_score"] < CONFIDENCE_HANDOFF_THRESHOLD:
        data["handoff_required"] = True

    return AIAnalysisResult(**data)

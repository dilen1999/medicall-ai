"""Shared constants used across services and routes."""

# Issue types the AI analysis service is allowed to output.
ISSUE_TYPES = (
    "no_issue",
    "missing_item",
    "wrong_medicine",
    "damaged_package",
    "pharmacist_support",
    "refund_or_replacement",
    "delivery_delay_feedback",
    "other",
)

PRIORITIES = ("low", "medium", "high", "critical")
SENTIMENTS = ("positive", "neutral", "concerned", "angry")

# Confidence below this threshold always forces human handoff,
# regardless of what issue_type was detected.
CONFIDENCE_HANDOFF_THRESHOLD = 0.7

# Keywords that must always trigger pharmacist escalation. This list backs
# both the rule-based fallback classifier and a safety-net check applied on
# top of any LLM output, since medical safety must never depend solely on
# the LLM correctly following instructions.
MEDICAL_ESCALATION_KEYWORDS = (
    "dosage",
    "dose",
    "side effect",
    "side-effect",
    "overdose",
    "allerg",
    "interact",
    "symptom",
    "should i take",
    "should i stop",
    "is it safe to",
    "can i mix",
    "reaction",
)

ANGRY_KEYWORDS = (
    "furious",
    "angry",
    "unacceptable",
    "terrible service",
    "worst",
    "disgusted",
    "sue you",
    "suing",
    "lawyer",
    "never buying",
    "scam",
)

MISSING_ITEM_KEYWORDS = ("missing", "not in the package", "short", "one strip missing", "didn't receive all")
WRONG_MEDICINE_KEYWORDS = ("wrong medicine", "wrong tablet", "different medicine", "not what i ordered", "incorrect medicine")
DAMAGED_KEYWORDS = ("damaged", "broken", "opened", "seal broken", "tampered", "leaking", "crushed")
REFUND_KEYWORDS = ("refund", "replacement", "replace it", "money back", "return it")
NO_ISSUE_KEYWORDS = ("all good", "everything is fine", "received everything", "no issues", "no problem", "confirmed")

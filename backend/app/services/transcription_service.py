"""
Audio transcription service.

Simulation mode never calls this — the simulate endpoint accepts a transcript
directly as text. This module exists for the real-call pipeline, where audio
recorded by Twilio needs to be converted to text before AI analysis.
"""

import logging

from app.config import get_settings

logger = logging.getLogger("medicall.transcription_service")

settings = get_settings()


def transcribe_audio(audio_file_path: str) -> str:
    """
    Transcribe an audio file to text.

    Uses OpenAI's audio transcription API (Whisper-compatible) when an API
    key is configured. Falls back to a clearly-labeled placeholder so the
    pipeline can still be exercised end-to-end without any credentials.
    """
    if not settings.llm_enabled:
        logger.warning(
            "OPENAI_API_KEY not set - returning placeholder transcript for %s. "
            "Use the /api/calls/simulate endpoint for a real end-to-end demo.",
            audio_file_path,
        )
        return "[PLACEHOLDER TRANSCRIPT - configure OPENAI_API_KEY to enable real transcription]"

    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        with open(audio_file_path, "rb") as audio_file:
            result = client.audio.transcriptions.create(model="whisper-1", file=audio_file)
        return result.text
    except Exception:  # noqa: BLE001
        logger.exception("Audio transcription failed for %s", audio_file_path)
        return "[TRANSCRIPTION FAILED - see server logs]"

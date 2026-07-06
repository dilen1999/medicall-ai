"""
Application configuration.

All runtime configuration is centralized here and loaded from environment
variables (see .env.example). Keeping a single Settings object means every
service imports configuration the same way and nothing reads os.environ
directly outside of this module.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App ---
    app_name: str = "MediCall AI"
    app_env: str = "development"
    api_v1_prefix: str = "/api"

    # --- Database ---
    database_url: str = "postgresql://postgres:postgres@localhost:5432/medicall_ai"

    # --- OpenAI ---
    openai_api_key: str | None = None
    openai_chat_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    # --- Twilio ---
    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_phone_number: str | None = None
    public_base_url: str | None = None

    # --- Email / notifications ---
    owner_email: str | None = None
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None

    # --- RAG / vector store ---
    chroma_persist_dir: str = "./chroma_store"
    chroma_collection_name: str = "pharmacy_policies"

    # --- Gemini (live conversational AI over Twilio ConversationRelay) ---
    # Separate from the OpenAI settings above: OpenAI/rule-based only ever
    # classifies a transcript AFTER a call ends. Gemini is the only provider
    # currently wired up to generate spoken replies DURING a live call.
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"

    # --- Manual kill-switches (n8n / ops) ---
    # Default True so existing .env files without these keys keep behaving
    # exactly as before; set to false to force simulation/rule-based mode
    # even when real credentials are present.
    twilio_enabled_flag: bool = Field(default=True, validation_alias="TWILIO_ENABLED")
    ai_enabled_flag: bool = Field(default=True, validation_alias="AI_ENABLED")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def llm_enabled(self) -> bool:
        """Whether a real OpenAI-backed LLM/embeddings can be used."""
        return self.ai_enabled_flag and bool(self.openai_api_key)

    @property
    def twilio_enabled(self) -> bool:
        """Whether real outbound Twilio calls can be placed."""
        return self.twilio_enabled_flag and bool(
            self.twilio_account_sid and self.twilio_auth_token and self.twilio_phone_number
        )

    @property
    def smtp_enabled(self) -> bool:
        """Whether real SMTP email delivery is configured."""
        return bool(self.smtp_host and self.smtp_user and self.smtp_password)

    @property
    def gemini_enabled(self) -> bool:
        """Whether a Gemini API key is configured for live conversational AI."""
        return bool(self.gemini_api_key)

    @property
    def conversational_ai_enabled(self) -> bool:
        """
        Whether /calls/twiml should use a live, multi-turn ConversationRelay
        conversation instead of the single-question <Gather> flow. Falls
        back to <Gather> automatically when no Gemini key is configured, so
        the app keeps working with zero external credentials.
        """
        return self.ai_enabled_flag and self.gemini_enabled


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance so .env is only parsed once per process."""
    return Settings()

"""
MediCall AI - FastAPI application entrypoint.

Wires together the database, all API routers, and startup behavior. Run
locally with:

    uvicorn app.main:app --reload

Then visit http://localhost:8000/docs for interactive Swagger UI.
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    analysis_routes,
    call_routes,
    customer_routes,
    notification_routes,
    order_routes,
    rag_routes,
    report_routes,
)
from app.config import get_settings
from app.database import init_db
from app.services.rag_service import index_knowledge_base, is_index_empty

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("medicall.main")

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description=(
        "AI voice support automation for online pharmacy / medicine delivery. "
        "Handles post-delivery confirmation calls, issue classification, and "
        "pharmacist/human handoff — without ever giving medical advice."
    ),
    version="1.0.0",
)

# Permissive CORS for local development / a future React dashboard.
# Tighten allow_origins before deploying to production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
api_prefix = settings.api_v1_prefix
app.include_router(customer_routes.router, prefix=api_prefix)
app.include_router(order_routes.router, prefix=api_prefix)
app.include_router(call_routes.router, prefix=api_prefix)
app.include_router(analysis_routes.router, prefix=api_prefix)
app.include_router(analysis_routes.analysis_read_router, prefix=api_prefix)
app.include_router(rag_routes.router, prefix=api_prefix)
app.include_router(report_routes.router, prefix=api_prefix)
app.include_router(notification_routes.router, prefix=api_prefix)


@app.on_event("startup")
def on_startup() -> None:
    """Create DB tables if they don't exist yet (MVP-friendly, no Alembic required)."""
    logger.info("Starting %s (env=%s)", settings.app_name, settings.app_env)
    init_db()
    if is_index_empty():
        logger.info("RAG collection is empty - auto-indexing knowledge_base (handles ephemeral disks).")
        index_knowledge_base()
    logger.info("LLM enabled: %s | Twilio enabled: %s | SMTP enabled: %s",
                settings.llm_enabled, settings.twilio_enabled, settings.smtp_enabled)
    if not settings.llm_enabled:
        logger.warning(
            "OPENAI_API_KEY not set. Running with the rule-based fallback classifier "
            "and local (no-key) RAG embeddings. This is fully functional for demos."
        )


@app.get("/", tags=["Health"])
def root():
    """Basic health check / landing route."""
    return {
        "service": settings.app_name,
        "status": "ok",
        "docs": "/docs",
        "llm_enabled": settings.llm_enabled,
        "twilio_enabled": settings.twilio_enabled,
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}

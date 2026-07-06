"""
Database engine and session management.

Uses SQLAlchemy 2.0 style declarative base. `get_db` is a FastAPI dependency
that yields a scoped session per-request and guarantees it is closed
afterwards, even if the request raises.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings

settings = get_settings()

# pool_pre_ping avoids "server closed the connection unexpectedly" errors
# after long idle periods, which is common with hosted Postgres (Supabase).
engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""

    pass


def get_db() -> Generator:
    """FastAPI dependency that provides a request-scoped DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Create all tables if they do not exist yet.

    For a real production deployment you would use Alembic migrations
    instead of create_all(), but this keeps the MVP runnable with zero
    extra setup steps.
    """
    # Import models so they are registered on Base.metadata before create_all.
    from app.models import (  # noqa: F401
        ai_call_analysis,
        call_log,
        customer,
        medicine_order,
        order_item,
        owner_report,
    )

    Base.metadata.create_all(bind=engine)

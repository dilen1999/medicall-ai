"""
Database engine and session management.

Uses SQLAlchemy 2.0 style declarative base. `get_db` is a FastAPI dependency
that yields a scoped session per-request and guarantees it is closed
afterwards, even if the request raises.
"""

import logging
from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings

logger = logging.getLogger("medicall.database")

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


# Additive, idempotent column additions for tables that predate the
# customer-PWA storefront feature set (customers, medicine_orders,
# order_items already existed for the voice-call-confirmation flow).
# `Base.metadata.create_all()` only creates missing *tables*, never adds
# columns to ones that already exist, so this covers the gap without
# requiring a full Alembic migration setup for what is still an MVP.
_LIGHTWEIGHT_MIGRATIONS = [
    "ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)",
    "ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(8) NOT NULL DEFAULT 'en'",
    "ALTER TABLE customers ADD COLUMN IF NOT EXISTS theme VARCHAR(16) NOT NULL DEFAULT 'system'",
    "ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512)",
    "ALTER TABLE customers ADD COLUMN IF NOT EXISTS default_address_id UUID",
    "ALTER TABLE customers ADD COLUMN IF NOT EXISTS notification_settings JSONB NOT NULL "
    "DEFAULT '{\"orderUpdates\": true, \"promotions\": true, \"prescriptionUpdates\": true, \"supportUpdates\": true}'",
    "ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS storefront_status VARCHAR(32)",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS pharmacy_id UUID",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS delivery_address_id UUID",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(32)",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS delivery_time_slot VARCHAR(128)",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32)",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32)",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2)",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2)",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS service_fee NUMERIC(10, 2)",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS discount NUMERIC(10, 2)",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS tax NUMERIC(10, 2)",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS promotion_code VARCHAR(32)",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS cancellable BOOLEAN NOT NULL DEFAULT true",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255)",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS driver_vehicle_number VARCHAR(32)",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS driver_phone_number VARCHAR(32)",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS driver_rating DOUBLE PRECISION",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS driver_latitude DOUBLE PRECISION",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS driver_longitude DOUBLE PRECISION",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS tracking_last_updated TIMESTAMP",
    "ALTER TABLE medicine_orders ADD COLUMN IF NOT EXISTS status_timeline JSONB",
    "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_id UUID",
    "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2)",
    "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image VARCHAR(64)",
]


def _run_lightweight_migrations() -> None:
    with engine.begin() as connection:
        for statement in _LIGHTWEIGHT_MIGRATIONS:
            connection.execute(text(statement))
    logger.info("Lightweight column migrations applied (%d statements).", len(_LIGHTWEIGHT_MIGRATIONS))


def init_db() -> None:
    """
    Create all tables if they do not exist yet, then apply additive column
    migrations for tables that predate the customer-PWA storefront feature
    set. For a real production deployment you would use Alembic migrations
    instead, but this keeps the MVP runnable with zero extra setup steps.
    """
    # Import models so they are registered on Base.metadata before create_all.
    from app.models import (  # noqa: F401
        address,
        ai_call_analysis,
        call_log,
        category,
        customer,
        medicine_order,
        notification,
        order_item,
        owner_report,
        pharmacy,
        prescription,
        product,
        support_case,
    )

    Base.metadata.create_all(bind=engine)
    _run_lightweight_migrations()

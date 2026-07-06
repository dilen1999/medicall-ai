"""
Shared FastAPI dependencies.

Currently this re-exports get_db for convenience and provides small helper
dependencies that routes can depend on. Keeping this separate from
database.py leaves room to add auth/dependency logic later (e.g. an
owner/admin auth check) without touching the database module.
"""

from app.config import Settings, get_settings
from app.database import get_db

__all__ = ["get_db", "get_settings", "Settings"]

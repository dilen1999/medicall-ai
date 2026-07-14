"""
Shared FastAPI dependencies.

Currently this re-exports get_db for convenience and provides small helper
dependencies that routes can depend on. Keeping this separate from
database.py leaves room to add auth/dependency logic later (e.g. an
owner/admin auth check) without touching the database module.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.models.customer import Customer
from app.utils.security import decode_access_token

_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_customer(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> Customer:
    """Resolves the bearer token from Authorization header to a Customer row.

    Used by every customer-PWA route that requires the caller to be logged
    in (cart checkout, prescriptions, addresses, support cases, profile,
    notifications). Voice-call-flow routes (customers, orders n8n endpoints,
    reports, rag) are unaffected and stay unauthenticated.
    """
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")

    customer_id = decode_access_token(credentials.credentials)
    if customer_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session.")

    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.is_active.is_(True)).first()
    if customer is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session.")

    return customer


__all__ = ["get_db", "get_settings", "Settings", "get_current_customer"]

"""Re-exports so profile routes don't need to import auth_schema directly."""

from app.schemas.auth_schema import CustomerProfileResponse, ProfileUpdateRequest

__all__ = ["CustomerProfileResponse", "ProfileUpdateRequest"]

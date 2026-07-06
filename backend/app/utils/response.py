"""Small helpers for consistent API responses and error handling."""

from typing import Any

from fastapi import HTTPException, status


def not_found(entity: str, entity_id: Any) -> HTTPException:
    """Standard 404 for 'X with id Y not found' cases."""
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{entity} with id '{entity_id}' was not found.",
    )


def bad_request(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)


def conflict(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=message)

"""
Sri Lanka time helpers.

Sri Lanka Standard Time is a fixed UTC+05:30 offset with no daylight-saving
transitions, so a plain `timezone` offset is used instead of zoneinfo -
this keeps the app free of the `tzdata` dependency (not installed by default
on Windows or slim Docker images) while still being correct.

All timestamps the app writes (call logs, orders, reports, ...) should go
through `now_sl()` / `today_sl()` instead of `datetime.utcnow()` / `date.today()`
so every stored and displayed time is Sri Lankan local time.
"""

from datetime import date, datetime, timedelta, timezone

SRI_LANKA_TZ = timezone(timedelta(hours=5, minutes=30), name="Asia/Colombo")


def now_sl() -> datetime:
    """Current Sri Lanka time, as a naive datetime (for naive DateTime columns)."""
    return datetime.now(SRI_LANKA_TZ).replace(tzinfo=None)


def today_sl() -> date:
    """Current date in Sri Lanka time."""
    return now_sl().date()

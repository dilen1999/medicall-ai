"""
Owner notification service.

Sends the daily summary to the pharmacy owner by email via SMTP. If SMTP is
not configured, the summary is logged instead of raising an error, so report
generation always succeeds even in a bare-bones local setup.
"""

import logging
import smtplib
from email.mime.text import MIMEText

from app.config import get_settings

logger = logging.getLogger("medicall.notification_service")

settings = get_settings()


def send_owner_summary_email(summary: str, subject: str = "MediCall AI - Daily Summary") -> bool:
    """
    Send the daily summary to OWNER_EMAIL via SMTP.

    Returns True if an email was actually sent, False if it was only logged
    (because SMTP is not configured) or if sending failed.
    """
    if not settings.smtp_enabled or not settings.owner_email:
        logger.info(
            "SMTP not configured - logging daily summary instead of emailing.\nSubject: %s\n%s",
            subject,
            summary,
        )
        return False

    message = MIMEText(summary)
    message["Subject"] = subject
    message["From"] = settings.smtp_user
    message["To"] = settings.owner_email

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_user, [settings.owner_email], message.as_string())
        logger.info("Daily summary emailed to %s", settings.owner_email)
        return True
    except Exception:  # noqa: BLE001 - notification failures must not break reporting
        logger.exception("Failed to send owner summary email; logging instead.\n%s", summary)
        return False


def send_handoff_alert_email(
    order_reference: str,
    customer_name: str,
    phone_number: str,
    issue_type: str,
    priority: str,
    pharmacist_required: bool,
    summary: str,
) -> bool:
    """
    Send a "human handoff required" alert to the owner/pharmacist support
    team, called either by the /gather-result webhook path or by n8n via
    POST /notifications/handoff. If SMTP is not configured, the alert is
    logged instead of failing - a handoff must never be silently dropped.
    """
    subject = "MediCall AI Alert - Human Handoff Required"
    body = (
        f"Order reference: {order_reference}\n"
        f"Customer: {customer_name}\n"
        f"Phone: {phone_number}\n"
        f"Issue type: {issue_type}\n"
        f"Priority: {priority}\n"
        f"Pharmacist required: {pharmacist_required}\n\n"
        f"AI summary:\n{summary}\n"
    )

    if not settings.smtp_enabled or not settings.owner_email:
        logger.info("SMTP not configured - logging handoff alert instead of emailing.\n%s\n%s", subject, body)
        return False

    message = MIMEText(body)
    message["Subject"] = subject
    message["From"] = settings.smtp_user
    message["To"] = settings.owner_email

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_user, [settings.owner_email], message.as_string())
        logger.info("Handoff alert emailed to %s for order %s", settings.owner_email, order_reference)
        return True
    except Exception:  # noqa: BLE001 - a failed alert email must not crash the request
        logger.exception("Failed to send handoff alert email; logged instead.\n%s", body)
        return False

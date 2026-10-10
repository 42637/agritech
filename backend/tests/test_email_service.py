import asyncio
from email.message import EmailMessage

from app.config import settings
from app.services import email_service


def test_climate_alert_uses_configured_recipients_and_reports_delivery(monkeypatch):
    sent = {}

    async def inline_to_thread(function, *args, **kwargs):
        return function(*args, **kwargs)

    class FakeSMTP:
        def __init__(self, host, port, timeout):
            sent["connection"] = (host, port, timeout)

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def ehlo(self):
            pass

        def starttls(self):
            pass

        def login(self, username, password):
            sent["login"] = (username, password)

        def send_message(self, message, to_addrs):
            sent["message"] = message
            sent["recipients"] = to_addrs
            return {}

    monkeypatch.setattr(email_service.smtplib, "SMTP", FakeSMTP)
    monkeypatch.setattr(email_service.asyncio, "to_thread", inline_to_thread)
    monkeypatch.setattr(settings, "ALERT_SYSTEM_ENABLED", True)
    monkeypatch.setattr(settings, "ALERT_EMAIL", "farmer@example.com; family@example.com")
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.example.com")
    monkeypatch.setattr(settings, "SMTP_PORT", 587)
    monkeypatch.setattr(settings, "SMTP_USER", "sender@example.com")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "test-password")

    result = asyncio.run(email_service.send_high_risk_climate_alert_email(
        farm_info={"farm_name": "Test Farm", "village": "Bhimavaram", "current_crops": "Paddy"},
        featured_risk={"title": "Heavy rain", "severity": "high", "impact_summary": "<unsafe>"},
    ))
    assert result is True
    assert sent["recipients"] == ["farmer@example.com", "family@example.com"]
    assert sent["login"] == ("sender@example.com", "test-password")
    assert isinstance(sent["message"], EmailMessage)
    assert "&lt;unsafe&gt;" in sent["message"].get_body(preferencelist=('html',)).get_content()


def test_climate_alert_fails_when_smtp_credentials_are_missing(monkeypatch):
    monkeypatch.setattr(settings, "ALERT_SYSTEM_ENABLED", True)
    monkeypatch.setattr(settings, "ALERT_EMAIL", "farmer@example.com")
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.example.com")
    monkeypatch.setattr(settings, "SMTP_USER", "")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "")

    result = asyncio.run(email_service.send_high_risk_climate_alert_email(
        featured_risk={"title": "Heavy rain"},
    ))

    assert result is False

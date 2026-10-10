import asyncio
import html
import logging
import smtplib
from email.message import EmailMessage
from email.utils import formataddr
from typing import Any, Dict, Iterable, Optional

from ..config import settings

logger = logging.getLogger("email_service")

_LABELS = {
    "en": {
        "alert": "Weather alert",
        "risk": "Risk level",
        "farm": "Farm",
        "crop": "Crop",
        "when": "When to expect it",
        "impact": "What may happen",
        "action": "What to do now",
        "estimate": "Forecast value",
        "other": "Other upcoming risks",
        "footer": "Forecasts can change. Check your field and follow local weather updates.",
        "high": "HIGH — Act soon",
        "medium": "CAUTION — Prepare",
        "low": "LOW — Keep watch",
    },
    "hi": {
        "alert": "मौसम की चेतावनी",
        "risk": "जोखिम का स्तर",
        "farm": "खेत",
        "crop": "फसल",
        "when": "कब होने की संभावना है",
        "impact": "क्या हो सकता है",
        "action": "अभी क्या करें",
        "estimate": "मौसम का अनुमान",
        "other": "आने वाले अन्य जोखिम",
        "footer": "मौसम का अनुमान बदल सकता है। अपने खेत की स्थिति देखें और स्थानीय मौसम की जानकारी लेते रहें।",
        "high": "ज़्यादा जोखिम — जल्दी कदम उठाएँ",
        "medium": "सावधानी — तैयारी रखें",
        "low": "कम जोखिम — ध्यान रखें",
    },
    "te": {
        "alert": "వాతావరణ హెచ్చరిక",
        "risk": "ప్రమాద స్థాయి",
        "farm": "పొలం",
        "crop": "పంట",
        "when": "ఎప్పుడు వచ్చే అవకాశం ఉంది",
        "impact": "ఏమి జరగవచ్చు",
        "action": "ఇప్పుడు ఏమి చేయాలి",
        "estimate": "వాతావరణ అంచనా",
        "other": "రాబోయే ఇతర ప్రమాదాలు",
        "footer": "వాతావరణ అంచనా మారవచ్చు. పొలం పరిస్థితిని చూడండి; స్థానిక వాతావరణ సమాచారాన్ని గమనించండి.",
        "high": "ఎక్కువ ప్రమాదం — త్వరగా చర్య తీసుకోండి",
        "medium": "జాగ్రత్త — సిద్ధంగా ఉండండి",
        "low": "తక్కువ ప్రమాదం — గమనించండి",
    },
}


def _recipients(value: Optional[str]) -> list[str]:
    """Read one or more comma/semicolon-separated alert recipients."""
    configured = value or settings.ALERT_EMAIL or ""
    return list(dict.fromkeys(
        address.strip() for address in configured.replace(";", ",").split(",")
        if address.strip()
    ))


def _send_message(message: EmailMessage, recipients: Iterable[str]) -> bool:
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.error("Climate alert email is not configured: SMTP host, username, and password are required")
        return False

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            refused = server.send_message(message, to_addrs=list(recipients))
            if refused:
                logger.error("SMTP refused climate alert recipient(s): %s", ", ".join(refused))
                return False
        return True
    except (OSError, smtplib.SMTPException) as exc:
        logger.exception("Climate alert email delivery failed: %s", exc)
        return False


async def send_high_risk_climate_alert_email(
    target_email: Optional[str] = None,
    farm_info: Optional[Dict[str, Any]] = None,
    featured_risk: Optional[Dict[str, Any]] = None,
    additional_risks: Optional[list[Dict[str, Any]]] = None,
) -> bool:
    """Send an alert digest using the configured SMTP account and recipients."""
    if not settings.ALERT_SYSTEM_ENABLED:
        logger.info("Climate alert email skipped because the alert system is disabled")
        return False

    recipients = _recipients(target_email)
    if not recipients:
        logger.error("Climate alert email is not configured: ALERT_EMAIL is empty")
        return False
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.error("Climate alert email is not configured: SMTP host, username, and password are required")
        return False

    farm = farm_info or {}
    risk = featured_risk or {}
    village = str(farm.get("village") or "your area")
    farm_name = str(farm.get("farm_name") or "Farm")
    crop = str(farm.get("current_crops") or "your crop")
    title = str(risk.get("title") or "Climate risk alert")
    language = str(farm.get("preferred_language") or "en").lower()
    labels = _LABELS.get(language, _LABELS["en"])
    severity = str(risk.get("severity") or "").lower()
    severity_label = labels.get(severity, severity.upper() or "NOT SPECIFIED")
    timeframe = str(risk.get("timeframe") or "Check the latest forecast")
    impact = str(risk.get("impact_summary") or "The forecast shows a possible weather risk for your crop.")
    recommendation = str(risk.get("recommendation") or "Check your field and the latest local forecast before taking action.")
    expected_value = str(risk.get("expected_value") or "")

    lines = [
        f"{labels['alert']} — {village}",
        "",
        f"{labels['risk']}: {severity_label}",
        f"{labels['farm']}: {farm_name}",
        f"{labels['crop']}: {crop}",
        f"{labels['when']}: {timeframe}",
        "",
        labels["impact"],
        impact,
    ]
    if expected_value:
        lines.extend(["", f"{labels['estimate']}: {expected_value}"])
    lines.extend(["", labels["action"], recommendation])

    risks = additional_risks or []
    if risks:
        lines.extend(["", labels["other"] + ":"])
        for item in risks:
            item_severity = str(item.get("severity") or "").lower()
            item_level = labels.get(item_severity, item_severity.upper() or "NOT SPECIFIED")
            lines.extend([
                f"• {item.get('title') or labels['alert']} — {item_level}",
                f"  {labels['when']}: {item.get('timeframe') or 'See forecast'}",
            ])
            if item.get("impact_summary"):
                lines.append(f"  {item['impact_summary']}")
            if item.get("expected_value"):
                lines.append(f"  {labels['estimate']}: {item['expected_value']}")
            if item.get("recommendation"):
                lines.append(f"  {labels['action']}: {item['recommendation']}")

    lines.extend(["", labels["footer"]])

    plain_text = "\n".join(lines)
    escape = lambda value: html.escape(str(value), quote=True)
    other_risks_html = "".join(
        "<li><strong>" + escape(item.get("title") or labels["alert"]) + "</strong> — "
        + escape(labels.get(str(item.get("severity") or "").lower(), str(item.get("severity") or "").upper()))
        + "<br>" + escape(item.get("timeframe") or "See forecast")
        + ("<br>" + escape(item["impact_summary"]) if item.get("impact_summary") else "")
        + ("<br><strong>" + escape(labels["action"]) + ":</strong> " + escape(item["recommendation"]) if item.get("recommendation") else "")
        + "</li>"
        for item in risks
    )
    other_risks_section = (
        f"<h2>{escape(labels['other'])}</h2><ul>{other_risks_html}</ul>" if risks else ""
    )
    estimate_html = (
        f"<p><strong>{escape(labels['estimate'])}:</strong> {escape(expected_value)}</p>"
        if expected_value else ""
    )
    html_content = f"""<html><body style="margin:0;background:#f4f7f4;font-family:Arial,sans-serif;color:#183526">
      <div style="max-width:600px;margin:24px auto;padding:24px;background:#fff;border-radius:14px">
        <p style="margin:0 0 8px;color:#54715f;font-size:13px">AgriSmart · {escape(village)}</p>
        <h1 style="margin:0 0 16px;font-size:24px">{escape(labels['alert'])}</h1>
        <div style="padding:14px;background:#fff5e8;border-left:5px solid #e69b24;border-radius:8px">
          <strong>{escape(labels['risk'])}: {escape(severity_label)}</strong><br>
          {escape(labels['when'])}: {escape(timeframe)}
        </div>
        <p><strong>{escape(labels['farm'])}:</strong> {escape(farm_name)}<br>
           <strong>{escape(labels['crop'])}:</strong> {escape(crop)}</p>
        <h2 style="font-size:17px">{escape(labels['impact'])}</h2>
        <p>{escape(impact)}</p>
        {estimate_html}
        <div style="padding:14px;background:#edf8ef;border-radius:8px">
          <strong>{escape(labels['action'])}</strong><br>{escape(recommendation)}
        </div>
        {other_risks_section}
        <p style="margin-top:22px;color:#617267;font-size:12px">{escape(labels['footer'])}</p>
      </div>
    </body></html>"""

    message = EmailMessage()
    message["Subject"] = f"{severity_label}: {title[:80]} ({village[:40]})"
    message["From"] = formataddr(("AgriSmart AI Alerts", settings.SMTP_FROM or settings.SMTP_USER))
    message["To"] = ", ".join(recipients)
    message.set_content(plain_text)
    message.add_alternative(html_content, subtype="html")

    sent = await asyncio.to_thread(_send_message, message, recipients)
    if sent:
        logger.info("Climate alert email sent successfully to %d recipient(s)", len(recipients))
    return sent

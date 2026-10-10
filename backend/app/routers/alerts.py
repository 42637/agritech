from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import datetime
import time
from ..database import get_db
from ..config import settings
from ..models import WeatherAlert, Farm
from ..schemas import WeatherAlertResponse
from ..services.weather_service import weather_service
from ..services.gemini_ai import gemini_ai_service
from ..services.email_service import send_high_risk_climate_alert_email
from ..services.supabase_sync import supabase_sync

router = APIRouter(prefix="/api/alerts", tags=["Climate Alerts"])
_recently_emailed_alerts: dict[str, float] = {}

@router.get("/farm/{farm_id}")
async def get_dynamic_farm_alerts(
    farm_id: int,
    period: str = Query("today", description="Forecast period: today, 7days, or 30days"),
    language: str | None = Query(None, description="Selected app language: en, te, or hi"),
    db: Session = Depends(get_db)
):
    """Fetches real-time Open-Meteo climate data and queries Gemini AI for dynamic climate risk analysis."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        farm_context = {
            "id": farm_id,
            "farm_name": "My Farm",
            "village": "Bhimavaram",
            "district": "West Godavari",
            "state": "Andhra Pradesh",
            "acreage": 2.5,
            "current_crops": "Paddy",
            "preferred_language": "en",
        }
    else:
        farm_context = {
            "id": farm.id,
            "farm_name": farm.farm_name or f"{farm.village} Farm",
            "village": farm.village or "Bhimavaram",
            "district": farm.district or "West Godavari",
            "state": farm.state or "Andhra Pradesh",
            "acreage": farm.acreage or 2.5,
            "current_crops": farm.current_crops or "Paddy",
            "preferred_language": (farm.owner.preferred_language if farm.owner else "en") or "en",
        }

    lat = farm.latitude if (farm and hasattr(farm, 'latitude') and farm.latitude) else 16.5449
    lon = farm.longitude if (farm and hasattr(farm, 'longitude') and farm.longitude) else 81.5212

    selected_language = (language or farm_context["preferred_language"] or "en").lower()
    if selected_language not in {"en", "te", "hi"}:
        selected_language = "en"
    farm_context["preferred_language"] = selected_language

    # Fetch live Open-Meteo weather
    weather_data = await weather_service.get_farm_weather(
        lat=lat,
        lon=lon,
        village=farm_context["village"],
        district=farm_context["district"],
        state=farm_context["state"]
    )

    # Call Gemini AI service
    risk_analysis = await gemini_ai_service.generate_climate_risk_analysis(
        farm_context=farm_context,
        weather_data=weather_data,
        period=period,
        language=selected_language,
    )

    featured_risk = risk_analysis.get("featured_risk", {})
    severity = (featured_risk.get("severity") or "medium").lower()

    active_severities = {"high", "medium", "heavy", "critical", "moderate"}
    upcoming_risks = risk_analysis.get("upcoming_risks", [])
    actionable_upcoming = [
        {
            "severity": (item.get("severity") or "").lower(),
            "title": item.get("title", "Climate Risk Warning"),
            "timeframe": item.get("timeframe", period),
            "expected_value": item.get("detail", ""),
            "impact_summary": item.get("description", ""),
            "recommendation": f"Monitor {farm_context['current_crops']} in {farm_context['village']} for {item.get('title', 'this risk')}.",
        }
        for item in upcoming_risks
        if (item.get("severity") or "").lower() in active_severities
    ]

    # A repeated screen load should not save and email the same forecast every time.
    duplicate_cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
    title = featured_risk.get("title", "Climate Risk Warning")
    risk_type = featured_risk.get("risk_type", "temperature")
    duplicate_alert = db.query(WeatherAlert).filter(
        WeatherAlert.farm_id == farm_context["id"],
        WeatherAlert.risk_type == risk_type,
        WeatherAlert.title == title,
        WeatherAlert.severity == severity,
        WeatherAlert.created_at >= duplicate_cutoff,
    ).first()
    is_new_alert = duplicate_alert is None

    # 1. Save alert in local Database & Supabase.
    try:
        if is_new_alert:
            alert_data = {
                "farm_id": farm_context["id"],
                "risk_type": risk_type,
                "severity": severity,
                "title": title,
                "message": featured_risk.get("impact_summary", "Extreme weather impact detected."),
                "recommendation": featured_risk.get("recommendation", "Irrigate field early morning."),
                "metric": featured_risk.get("expected_value", ""),
                "forecast_window": featured_risk.get("timeframe", period),
                "is_read": False,
            }
            db.add(WeatherAlert(**alert_data))
            db.commit()
            await supabase_sync.sync_weather_alert(alert_data)
    except Exception:
        import logging
        logging.getLogger(__name__).exception("Unable to save climate alert")
        db.rollback()

    # 2. Send one digest to the configured address(es), and report the real outcome.
    email_triggered = severity in active_severities or bool(actionable_upcoming)
    email_sent = False
    email_key = f"{settings.ALERT_EMAIL}:{farm_context['id']}:{risk_type}:{title}:{severity}"
    emailed_at = _recently_emailed_alerts.get(email_key)
    already_emailed = emailed_at is not None and time.monotonic() - emailed_at < 86400
    if email_triggered and settings.ALERT_SYSTEM_ENABLED and not already_emailed:
        email_sent = await send_high_risk_climate_alert_email(
            target_email=settings.ALERT_EMAIL,
            farm_info=farm_context,
            featured_risk=featured_risk,
            additional_risks=actionable_upcoming,
        )
        if email_sent:
            _recently_emailed_alerts[email_key] = time.monotonic()

    if email_sent:
        email_status = "sent"
    elif not email_triggered:
        email_status = "no_actionable_risk"
    elif already_emailed:
        email_status = "duplicate_suppressed"
    elif not settings.ALERT_SYSTEM_ENABLED:
        email_status = "disabled"
    elif not settings.ALERT_EMAIL or not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        email_status = "not_configured"
    else:
        email_status = "failed"

    return {
        "farm": farm_context,
        "weather": weather_data,
        "period": period,
        "analysis": risk_analysis,
        "email_alert": {
            "target": settings.ALERT_EMAIL,
            "triggered": email_triggered,
            "status": email_status,
        }
    }


@router.get("", response_model=List[WeatherAlertResponse])
def get_all_alerts(db: Session = Depends(get_db)):
    alerts = db.query(WeatherAlert).order_by(WeatherAlert.created_at.desc()).all()
    if not alerts:
        # Seed default alerts if empty
        farms = db.query(Farm).all()
        farm_id = farms[0].id if farms else 1
        a1 = WeatherAlert(
            farm_id=farm_id,
            risk_type="Heavy Rainfall",
            severity="high",
            title="Heavy Rainfall Warning (13 Aug)",
            message="Forecast predicts 45mm rainfall in West Godavari district over the next 24 hours.",
            recommendation="Clear field drainage channels and postpone fertilizer application.",
            metric="45 mm rain",
            forecast_window="24 hours",
            is_read=False
        )
        a2 = WeatherAlert(
            farm_id=farm_id,
            risk_type="Heat Stress",
            severity="medium",
            title="High Evaporative Demand Alert",
            message="Temperatures reaching 34°C with dry winds expected.",
            recommendation="Provide light irrigation during early morning or evening hours.",
            metric="34°C Max Temp",
            forecast_window="48 hours",
            is_read=True
        )
        db.add_all([a1, a2])
        db.commit()
        alerts = [a1, a2]

    return alerts

@router.patch("/{alert_id}/read")
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(WeatherAlert).filter(WeatherAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"message": "Alert marked as read", "id": alert_id}

@router.patch("/read-all")
def mark_all_read(db: Session = Depends(get_db)):
    db.query(WeatherAlert).update({WeatherAlert.is_read: True})
    db.commit()
    return {"message": "All alerts marked as read"}

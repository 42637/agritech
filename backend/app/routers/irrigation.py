from typing import Literal, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Farm
from ..services.gemini_ai import gemini_ai_service
from ..services.irrigation_service import irrigation_service
from ..services.supabase_sync import supabase_sync
from ..services.weather_service import weather_service

router = APIRouter(prefix="/api/irrigation", tags=["Smart Irrigation"])


class FarmerFieldUpdate(BaseModel):
    soil_moisture: Literal["dry", "normal", "wet", "unknown"] = "unknown"
    pest_observed: bool = False
    pest_description: Optional[str] = Field(default=None, max_length=300)
    pesticide_status: Literal["not_used", "used", "not_sure"] = "not_used"
    pesticide_name: Optional[str] = Field(default=None, max_length=120)
    last_application_date: Optional[str] = Field(default=None, max_length=30)
    notes: str = Field(default="", max_length=600)


class IrrigationPlanRequest(BaseModel):
    farm_id: int
    crop: str = Field(default="Paddy", min_length=2, max_length=40)
    water_source: str = Field(default="Canal", min_length=2, max_length=40)
    growth_stage: str = Field(default="Vegetative Stage", min_length=2, max_length=60)
    crop_duration_days: Optional[int] = Field(default=None, ge=30, le=800)
    language: Literal["en", "te", "hi"] = "en"
    field_update: Optional[FarmerFieldUpdate] = None


@router.post("/plan")
async def get_irrigation_plan(req: IrrigationPlanRequest, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == req.farm_id).first()
    acreage = float(farm.acreage) if farm else 2.5
    village = farm.village if farm else "Bhimavaram"
    district = farm.district if farm else "West Godavari"
    state = farm.state if farm else "Andhra Pradesh"

    weather = await weather_service.get_farm_weather(
        lat=farm.latitude if farm else 16.5449,
        lon=farm.longitude if farm else 81.5212,
        village=village,
        district=district,
        state=state,
    )
    field_update = req.field_update.model_dump(exclude_none=True) if req.field_update else None
    water_source = "Drip System" if req.water_source == "Drip" else req.water_source
    plan = irrigation_service.calculate_plan(
        crop=req.crop,
        acreage=acreage,
        water_source=water_source,
        stage=req.growth_stage,
        weather=weather,
        field_update=field_update,
        crop_duration_days=req.crop_duration_days,
    )

    farm_context = {
        "farm_name": farm.farm_name if farm else "Bhimavaram Farm",
        "village": village,
        "district": district,
        "state": state,
        "acreage": acreage,
        "soil_ph": farm.soil_ph if farm else None,
        "soil_type": farm.soil_type if farm else None,
    }
    weather_context = {
        "source": weather.get("source", "unavailable"),
        "updated_at": weather.get("updated_at"),
        "current": {
            "temperature": weather.get("current_temp"),
            "humidity": weather.get("humidity"),
            "condition": weather.get("condition"),
            "rain_chance": weather.get("rain_chance"),
        } if weather.get("source") == "forecast" else "Live weather forecast unavailable; do not infer weather.",
        "forecast": weather.get("forecast", []) if weather.get("source") == "forecast" else [],
        "rainfall_7d_mm": weather.get("rainfall_7d_mm"),
    }
    action_plan = irrigation_service.default_action_plan(
        crop=req.crop,
        stage=req.growth_stage,
        water_source=water_source,
        plan=plan,
        field_update=field_update,
        weather=weather_context,
        language=req.language,
    )
    generated, ai_status = await gemini_ai_service.generate_irrigation_actions(
        farm=farm_context,
        crop=req.crop,
        stage=req.growth_stage,
        water_source=water_source,
        weather=weather_context,
        baseline={
            "depth_min_mm": plan["depth_min"],
            "depth_max_mm": plan["depth_max"],
            "frequency_days": plan["frequency_days"],
            "water_amount": plan["volume_label"],
            "soil_moisture_note": plan["why_recommendation"],
            "crop_duration_days": plan["crop_duration_days"],
            "duration_range_days": plan["duration_range_days"],
            "current_stage_day": plan["current_stage_day"],
            "days_remaining": plan["days_remaining"],
            "harvest_estimate_date": plan["harvest_estimate_date"],
            "cultivation_plan": action_plan["cultivation_plan"],
        },
        field_update=field_update,
        language=req.language,
    )
    if generated:
        # Weekly guidance remains available to API clients, but is locally computed;
        # the Gemini response is focused on the full-cycle, pest, and fertilizer data.
        generated["schedule"] = action_plan.get("schedule", [])
        action_plan = generated
        plan["ai_generated"] = True
    plan["ai_status"] = ai_status

    plan.update(action_plan)
    plan["cultivation_plan_source"] = "gemini" if generated else "agronomic_estimate"
    plan["pest_plan"]["chemical_guidance"] = {
        "en": "No pesticide is scheduled. Identify the pest first; use only a product whose current Indian label names this crop and pest, following the label and local KVK guidance.",
        "te": "పురుగుమందు షెడ్యూల్ చేయలేదు. ముందుగా పురుగును గుర్తించండి; ఈ పంట, పురుగుకు ప్రస్తుత భారతీయ లేబుల్‌లో అనుమతించిన ఉత్పత్తినే లేబుల్ మరియు స్థానిక KVK సూచనల ప్రకారం వాడండి.",
        "hi": "किसी कीटनाशक का समय तय नहीं किया गया है। पहले कीट की पहचान करें; केवल वही उत्पाद लें जिसके मौजूदा भारतीय लेबल पर यह फसल और कीट दर्ज हों, और लेबल व स्थानीय KVK सलाह मानें।",
    }[req.language]
    fallback_fertilizers = [
        {
            "name": item["name"],
            "timing": f"At the next suitable {req.growth_stage.lower()} nutrient window; confirm timing with a soil test or local KVK advice.",
            "purpose": item["reason"],
            "nutrient_profile": "Typical nutrient content varies by source and product; check the package analysis.",
        }
        for item in irrigation_service.organic_inputs(req.crop)
    ]
    plan["organic_fertilizers"] = (generated or {}).get("organic_fertilizers") or fallback_fertilizers
    plan["fertilizer_plan_source"] = "gemini" if generated and generated.get("organic_fertilizers") else "agronomic_estimate"
    plan["field_update"] = field_update
    plan["farm_name"] = farm.farm_name if farm else "Bhimavaram Farm"
    plan["village"] = village
    plan["district"] = district
    plan["weather_source"] = weather_context["source"]
    plan["supabase_saved"] = await supabase_sync.sync_irrigation_plan(
        farm_id=req.farm_id,
        crop=req.crop,
        water_source=water_source,
        growth_stage=req.growth_stage,
        crop_duration_days=plan.get("crop_duration_days"),
        language=req.language,
        field_update=field_update,
        ai_status=ai_status,
        plan=plan,
    )
    plan["supabase_status"] = (
        "saved" if plan["supabase_saved"] else
        "not_configured" if not supabase_sync.is_configured() else
        "sync_failed"
    )
    return plan

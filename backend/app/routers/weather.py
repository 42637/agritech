from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Farm
from ..services.weather_service import weather_service

router = APIRouter(prefix="/api/farms", tags=["Weather"])

@router.get("/{farm_id}/weather")
async def get_farm_weather(farm_id: int, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        lat, lon = 16.5449, 81.5212
        village, district, state = "Bhimavaram", "West Godavari", "Andhra Pradesh"
        farm_name = "Bhimavaram Farm"
    else:
        lat = farm.latitude if (hasattr(farm, 'latitude') and farm.latitude) else 16.5449
        lon = farm.longitude if (hasattr(farm, 'longitude') and farm.longitude) else 81.5212
        village = farm.village or "Bhimavaram"
        district = farm.district or "West Godavari"
        state = farm.state or "Andhra Pradesh"
        farm_name = farm.farm_name or f"{village} Farm"

    data = await weather_service.get_farm_weather(
        lat=lat,
        lon=lon,
        village=village,
        district=district,
        state=state
    )
    data["farm_id"] = farm_id
    data["farm_name"] = farm_name
    return data

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
        raise HTTPException(status_code=404, detail="Farm not found")

    data = await weather_service.get_farm_weather(
        lat=farm.latitude,
        lon=farm.longitude,
        village=farm.village,
        district=farm.district,
        state=farm.state
    )
    data["farm_id"] = farm.id
    data["farm_name"] = farm.farm_name
    return data

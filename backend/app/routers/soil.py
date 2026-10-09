from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import datetime
from ..database import get_db
from ..models import Farm, SoilRecord
from ..schemas import SoilPHUpdate
from ..services.soil_service import soil_service

router = APIRouter(prefix="/api/farms", tags=["Soil"])

@router.get("/{farm_id}/soil")
def get_farm_soil(farm_id: int, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    if farm.soil_ph is None:
        return {
            "farm_id": farm.id,
            "farm_name": farm.farm_name,
            "village": farm.village,
            "district": farm.district,
            "soil_ph": None,
            "has_ph": False,
            "message": "Enter a soil pH value from a recent soil test to unlock soil insights."
        }

    analysis = soil_service.analyze_soil(
        ph=farm.soil_ph,
        soil_type=farm.soil_type or "Loamy",
        water_availability=farm.water_availability or "Moderate",
        district=farm.district
    )
    analysis["farm_id"] = farm.id
    analysis["farm_name"] = farm.farm_name
    analysis["village"] = farm.village
    analysis["district"] = farm.district
    analysis["has_ph"] = True
    return analysis

@router.put("/{farm_id}/soil")
def update_farm_soil_ph(farm_id: int, payload: SoilPHUpdate, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    if payload.soil_ph < 0.0 or payload.soil_ph > 14.0:
        raise HTTPException(status_code=400, detail="Soil pH must be between 0.0 and 14.0")

    farm.soil_ph = payload.soil_ph
    farm.soil_ph_updated_at = datetime.datetime.utcnow()

    # Create historical soil record
    soil_rec = SoilRecord(
        farm_id=farm.id,
        ph=payload.soil_ph,
        measurement_source=payload.measurement_source or "Soil Testing Lab"
    )
    db.add(soil_rec)
    db.commit()
    db.refresh(farm)

    analysis = soil_service.analyze_soil(
        ph=farm.soil_ph,
        soil_type=farm.soil_type or "Loamy",
        water_availability=farm.water_availability or "Moderate",
        district=farm.district
    )
    analysis["farm_id"] = farm.id
    analysis["farm_name"] = farm.farm_name
    analysis["village"] = farm.village
    analysis["district"] = farm.district
    analysis["has_ph"] = True
    return analysis

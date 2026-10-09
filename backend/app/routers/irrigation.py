from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Farm
from ..services.irrigation_service import irrigation_service

router = APIRouter(prefix="/api/irrigation", tags=["Smart Irrigation"])

class IrrigationPlanRequest(BaseModel):
    farm_id: int
    crop: str = "Paddy"
    water_source: str = "Canal"
    growth_stage: str = "Vegetative Stage"

@router.post("/plan")
def get_irrigation_plan(req: IrrigationPlanRequest, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == req.farm_id).first()
    acreage = farm.acreage if farm else 2.5
    
    plan = irrigation_service.calculate_plan(
        crop=req.crop,
        acreage=acreage,
        water_source=req.water_source,
        stage=req.growth_stage
    )
    plan["farm_name"] = farm.farm_name if farm else "Bhimavaram Farm"
    plan["village"] = farm.village if farm else "Bhimavaram"
    return plan

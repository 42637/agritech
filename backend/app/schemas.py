from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

# Auth Schemas
class OTPRequest(BaseModel):
    phone: str
    name: Optional[str] = "Farmer"

class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str = "123456"
    name: Optional[str] = "Farmer"
    preferred_language: Optional[str] = "en"

class UserResponse(BaseModel):
    id: int
    name: str
    phone: str
    preferred_language: str
    created_at: datetime
    class Config:
        from_attributes = True

# Farm Schemas
class FarmCreate(BaseModel):
    farm_name: str
    acreage: float = Field(gt=0, description="Acreage must be greater than 0")
    latitude: float
    longitude: float
    pincode: str
    village: str
    mandal: Optional[str] = ""
    district: str
    state: str = "Andhra Pradesh"
    survey_number: Optional[str] = None
    soil_ph: Optional[float] = None
    soil_type: Optional[str] = "Loamy"
    water_availability: Optional[str] = "Moderate"
    current_crops: Optional[str] = "Paddy"

class FarmUpdate(BaseModel):
    farm_name: Optional[str] = None
    acreage: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    pincode: Optional[str] = None
    village: Optional[str] = None
    mandal: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    survey_number: Optional[str] = None
    soil_ph: Optional[float] = None
    soil_type: Optional[str] = None
    water_availability: Optional[str] = None
    recent_rainfall: Optional[str] = None
    current_season: Optional[str] = None
    previous_crops: Optional[str] = None
    recent_fertilizers: Optional[str] = None
    irrigation_method: Optional[str] = None
    current_crops: Optional[str] = None

class FarmResponse(BaseModel):
    id: int
    user_id: int
    farm_name: str
    acreage: float
    latitude: float
    longitude: float
    pincode: str
    village: str
    mandal: Optional[str]
    district: str
    state: str
    survey_number: Optional[str]
    soil_ph: Optional[float]
    soil_ph_updated_at: Optional[datetime]
    soil_type: str
    water_availability: str
    recent_rainfall: str
    current_season: str
    previous_crops: str
    recent_fertilizers: str
    irrigation_method: str
    current_crops: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# Location Schemas
class PincodeResponse(BaseModel):
    pincode: str
    post_office: str
    village: str
    mandal: str
    district: str
    state: str
    latitude: float
    longitude: float

class ReverseGeocodeResponse(BaseModel):
    latitude: float
    longitude: float
    village: str
    mandal: str
    district: str
    state: str
    pincode: str

# Soil Schemas
class SoilPHUpdate(BaseModel):
    soil_ph: float = Field(ge=0.0, le=14.0, description="pH value between 0 and 14")
    measurement_source: Optional[str] = "Soil Testing Lab"

# AI Schemas
class AIAskRequest(BaseModel):
    question: str
    farm_id: Optional[int] = None
    language: Optional[str] = "en"

class AIAskResponse(BaseModel):
    question: str
    answer: str
    language: str
    recommendations: List[str] = []
    evidence: Optional[str] = None

# Weather Alerts & Saved Items
class WeatherAlertResponse(BaseModel):
    id: int
    farm_id: int
    risk_type: str
    severity: str
    title: str
    message: str
    recommendation: str
    metric: Optional[str]
    forecast_window: Optional[str]
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

class SavedItemCreate(BaseModel):
    farm_id: Optional[int] = None
    item_type: str
    title: str
    content: str
    metadata_json: Optional[Any] = None

class SavedItemResponse(BaseModel):
    id: int
    user_id: int
    farm_id: Optional[int]
    item_type: str
    title: str
    content: str
    metadata_json: Optional[Any]
    created_at: datetime
    class Config:
        from_attributes = True

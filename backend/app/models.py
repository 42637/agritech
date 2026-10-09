import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    verified = Column(Boolean, default=True)
    preferred_language = Column(String, default="en")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farms = relationship("Farm", back_populates="owner", cascade="all, delete-orphan")
    saved_items = relationship("SavedItem", back_populates="owner", cascade="all, delete-orphan")
    conversations = relationship("AIConversation", back_populates="owner", cascade="all, delete-orphan")


class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farm_name = Column(String, nullable=False)
    acreage = Column(Float, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    pincode = Column(String, nullable=False)
    village = Column(String, nullable=False)
    mandal = Column(String, nullable=True)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False, default="Andhra Pradesh")
    survey_number = Column(String, nullable=True)
    
    # Soil & Farming details
    soil_ph = Column(Float, nullable=True)
    soil_ph_updated_at = Column(DateTime, nullable=True)
    soil_type = Column(String, default="Loamy")
    water_availability = Column(String, default="Moderate")
    recent_rainfall = Column(String, default="42 mm (last 30 days)")
    current_season = Column(String, default="Kharif (Jun - Sep)")
    previous_crops = Column(String, default="Paddy, Maize")
    recent_fertilizers = Column(String, default="Urea, DAP")
    irrigation_method = Column(String, default="Drip / Canal")
    current_crops = Column(String, default="Paddy")

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="farms")
    soil_records = relationship("SoilRecord", back_populates="farm", cascade="all, delete-orphan")
    alerts = relationship("WeatherAlert", back_populates="farm", cascade="all, delete-orphan")


class SoilRecord(Base):
    __tablename__ = "farm_soil_records"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    ph = Column(Float, nullable=False)
    measurement_date = Column(DateTime, default=datetime.datetime.utcnow)
    measurement_source = Column(String, default="Soil Testing Lab")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farm = relationship("Farm", back_populates="soil_records")


class WeatherAlert(Base):
    __tablename__ = "weather_alerts"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    risk_type = Column(String, nullable=False)  # Heavy Rain, Heat Stress, High Wind, etc.
    severity = Column(String, nullable=False)   # high, medium, low
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    metric = Column(String, nullable=True)
    forecast_window = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farm = relationship("Farm", back_populates="alerts")


class SavedItem(Base):
    __tablename__ = "saved_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True)
    item_type = Column(String, nullable=False)  # ai_answer, soil_guidance, crop_recommendation, weather_report
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="saved_items")


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    language = Column(String, default="en")
    audio_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="conversations")

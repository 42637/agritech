import sys
import os

# Add root directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models import User, Farm, SoilRecord, WeatherAlert, SavedItem

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if user already exists
    existing_user = db.query(User).filter(User.phone == "+919876543210").first()
    if existing_user:
        print("Database already seeded!")
        db.close()
        return

    print("Seeding AgriSmart AI database...")
    farmer = User(
        name="Ramesh Kumar",
        phone="+919876543210",
        verified=True,
        preferred_language="en"
    )
    db.add(farmer)
    db.commit()
    db.refresh(farmer)

    # 3 Farm Parcels matching prompt specs (Bhimavaram, Tanuku, Narsapuram)
    f1 = Farm(
        user_id=farmer.id,
        farm_name="Bhimavaram Farm",
        acreage=2.5,
        latitude=16.5449,
        longitude=81.5212,
        pincode="534201",
        village="Bhimavaram",
        mandal="Bhimavaram",
        district="West Godavari",
        state="Andhra Pradesh",
        soil_ph=6.5,
        soil_type="Loamy",
        water_availability="Moderate",
        recent_rainfall="42 mm (last 30 days)",
        current_season="Kharif (Jun - Sep)",
        previous_crops="Paddy, Maize",
        recent_fertilizers="Urea, DAP",
        irrigation_method="Canal / Drip",
        current_crops="Paddy"
    )

    f2 = Farm(
        user_id=farmer.id,
        farm_name="Tanuku Farm",
        acreage=1.75,
        latitude=16.7588,
        longitude=81.6961,
        pincode="534211",
        village="Tanuku",
        mandal="Tanuku",
        district="West Godavari",
        state="Andhra Pradesh",
        soil_ph=None,  # State A (before pH saved)
        soil_type="Sandy Loam",
        water_availability="High",
        current_crops="Maize"
    )

    f3 = Farm(
        user_id=farmer.id,
        farm_name="Narsapuram Farm",
        acreage=3.0,
        latitude=16.4389,
        longitude=81.6883,
        pincode="534275",
        village="Narsapuram",
        mandal="Narsapuram",
        district="West Godavari",
        state="Andhra Pradesh",
        soil_ph=7.1,
        soil_type="Clay Loam",
        water_availability="Moderate",
        current_crops="Groundnut"
    )

    db.add_all([f1, f2, f3])
    db.commit()

    # Seed initial alerts
    a1 = WeatherAlert(
        farm_id=f1.id,
        risk_type="Heavy Rainfall",
        severity="high",
        title="Rain possible tomorrow",
        message="There is a high chance of rain on Tuesday (13 Aug). Plan your farming activities.",
        recommendation="Clear field drainage channels and delay foliar spraying.",
        metric="70% Rain Chance",
        forecast_window="Tomorrow",
        is_read=False
    )
    db.add(a1)
    db.commit()

    print("Seed complete! Created 1 farmer, 3 parcels, and weather alerts.")
    db.close()

if __name__ == "__main__":
    seed_database()

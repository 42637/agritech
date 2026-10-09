from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Farm
from ..schemas import OTPRequest, OTPVerifyRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/send-otp")
def send_otp(request: OTPRequest, db: Session = Depends(get_db)):
    """Simulates sending an OTP to the farmer's mobile number."""
    return {"message": f"OTP sent to {request.phone}. Use 123456 in dev mode.", "status": "success"}

@router.post("/verify", response_model=UserResponse)
def verify_otp(request: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Verifies OTP and logs in / registers the user."""
    # Check if user exists
    user = db.query(User).filter(User.phone == request.phone).first()
    if not user:
        user = User(
            name=request.name or "Farmer",
            phone=request.phone,
            verified=True,
            preferred_language=request.preferred_language or "en"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Seed default initial farm parcel for Bhimavaram if no farms exist
        default_farm = Farm(
            user_id=user.id,
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
            current_crops="Paddy"
        )
        db.add(default_farm)
        db.commit()

    return user

@router.get("/me", response_model=UserResponse)
def get_current_user(phone: str = "+919876543210", db: Session = Depends(get_db)):
    """Fetches or creates current authenticated user."""
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        user = User(name="Farmer", phone=phone, verified=True, preferred_language="en")
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Add sample farms for Bhimavaram, Tanuku, Narsapuram
        f1 = Farm(user_id=user.id, farm_name="Bhimavaram Farm", acreage=2.5, latitude=16.5449, longitude=81.5212, pincode="534201", village="Bhimavaram", mandal="Bhimavaram", district="West Godavari", state="Andhra Pradesh", soil_ph=6.5)
        f2 = Farm(user_id=user.id, farm_name="Tanuku Farm", acreage=1.75, latitude=16.7588, longitude=81.6961, pincode="534211", village="Tanuku", mandal="Tanuku", district="West Godavari", state="Andhra Pradesh", soil_ph=None)
        f3 = Farm(user_id=user.id, farm_name="Narsapuram Farm", acreage=3.0, latitude=16.4389, longitude=81.6883, pincode="534275", village="Narsapuram", mandal="Narsapuram", district="West Godavari", state="Andhra Pradesh", soil_ph=7.1)
        db.add_all([f1, f2, f3])
        db.commit()

    return user

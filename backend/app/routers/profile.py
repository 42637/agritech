from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models import User
from ..schemas import UserResponse

router = APIRouter(prefix="/api/profile", tags=["Profile"])

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    preferred_language: Optional[str] = None

@router.get("", response_model=UserResponse)
def get_profile(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        user = User(name="Farmer", phone="+919876543210", verified=True, preferred_language="en")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@router.patch("", response_model=UserResponse)
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.name:
        user.name = data.name
    if data.preferred_language:
        if data.preferred_language not in {"en", "te", "hi"}:
            raise HTTPException(status_code=422, detail="Unsupported language")
        user.preferred_language = data.preferred_language
    db.commit()
    db.refresh(user)
    return user

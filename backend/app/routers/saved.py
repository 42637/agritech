from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import SavedItem, User
from ..schemas import SavedItemCreate, SavedItemResponse

router = APIRouter(prefix="/api/saved", tags=["Saved Items"])

def get_demo_user(db: Session):
    user = db.query(User).first()
    if not user:
        user = User(name="Farmer", phone="+919876543210", verified=True)
        db.add(user)
        db.commit()
    return user

@router.get("", response_model=List[SavedItemResponse])
def get_saved_items(db: Session = Depends(get_db)):
    user = get_demo_user(db)
    items = db.query(SavedItem).filter(SavedItem.user_id == user.id).order_by(SavedItem.created_at.desc()).all()
    if not items:
        # Seed initial saved item for demo
        item = SavedItem(
            user_id=user.id,
            item_type="soil_guidance",
            title="Paddy Soil pH Guidance",
            content="Maintain soil pH between 6.0 and 6.5 for optimal paddy root growth and phosphorus uptake.",
            metadata_json={"ph": 6.5, "crop": "Paddy"}
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        items = [item]
    return items

@router.post("", response_model=SavedItemResponse)
def save_item(item_in: SavedItemCreate, db: Session = Depends(get_db)):
    user = get_demo_user(db)
    item = SavedItem(
        user_id=user.id,
        farm_id=item_in.farm_id,
        item_type=item_in.item_type,
        title=item_in.title,
        content=item_in.content,
        metadata_json=item_in.metadata_json
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_saved_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(SavedItem).filter(SavedItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Saved item not found")
    db.delete(item)
    db.commit()
    return {"message": "Saved item deleted", "id": item_id}

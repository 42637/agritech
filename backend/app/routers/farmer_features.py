import logging
from datetime import date
from typing import Literal, Optional
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field, StringConstraints
from typing_extensions import Annotated

from ..services.disease_ai import crop_disease_ai
from ..services.supabase_features import supabase_features

router = APIRouter(prefix="/api/farmer-tools", tags=["Farmer Tools"])
logger = logging.getLogger("farmer_features")

IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


@router.post("/disease-assessment")
async def assess_crop_disease(
    image: UploadFile = File(...),
    crop: str = Form(...),
    symptoms: str = Form(""),
    language: Literal["en", "te", "hi"] = Form("en"),
    farm_id: Optional[int] = Form(None),
):
    mime_type = (image.content_type or "").lower()
    if mime_type not in IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, or WebP crop photo.")
    crop = crop.strip()
    symptoms = symptoms.strip()
    if not crop or len(crop) > 80:
        raise HTTPException(status_code=422, detail="Enter a crop name up to 80 characters.")
    if len(symptoms) > 1200:
        raise HTTPException(status_code=422, detail="Keep crop observations under 1,200 characters.")
    content = await image.read(6 * 1024 * 1024 + 1)
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded crop image is empty.")
    if len(content) > 6 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Crop images must be 6 MB or smaller.")
    try:
        logger.info("Crop disease image received: mime=%s bytes=%d crop=%s", mime_type, len(content), crop)
        assessment = await crop_disease_ai.assess(content, mime_type, crop, symptoms, language)
        object_path = f"{farm_id or 'unlinked'}/{uuid4()}.{IMAGE_TYPES[mime_type]}"
        try:
            await supabase_features.upload_disease_image(object_path, content, mime_type)
            report = await supabase_features.save_disease_report({
                "farm_id": farm_id,
                "crop_name": crop,
                "symptoms": symptoms,
                "language": language,
                "image_path": object_path,
                "assessment_json": assessment,
                "ai_model": "Gemini Vision",
            })
            return {"id": report.get("id"), "crop": crop, "image_path": object_path, "assessment": assessment, "created_at": report.get("created_at"), "saved": True}
        except RuntimeError as error:
            # Show the successful diagnosis even if database setup is pending.
            # Never claim that the record was persisted when Supabase failed.
            logger.warning("Gemini assessment succeeded but Supabase persistence failed: %s", type(error).__name__)
            return {"crop": crop, "image_path": None, "assessment": assessment, "saved": False}
    except RuntimeError as error:
        message = str(error)
        status_code = 503 if any(marker in message.lower() for marker in ("supabase", "not configured", "quota")) else 502
        raise HTTPException(status_code=status_code, detail=message) from error
    except Exception as error:
        logger.warning("Crop assessment could not be saved: %s", type(error).__name__)
        raise HTTPException(status_code=503, detail="The assessment could not be saved. Confirm the Supabase feature migration is installed and try again.") from error


class ProduceListingInput(BaseModel):
    seller_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]
    seller_phone: Annotated[str, StringConstraints(strip_whitespace=True, min_length=7, max_length=20, pattern=r"^[+0-9() -]+$")]
    crop_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]
    quantity_kg: float = Field(gt=0, le=10_000_000)
    price_per_kg: float = Field(gt=0, le=10_000_000)
    location: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=180)]
    harvest_date: Optional[date] = None
    quality_grade: Annotated[str, StringConstraints(strip_whitespace=True, max_length=80)] = "Not graded"
    details: Annotated[str, StringConstraints(strip_whitespace=True, max_length=1200)] = ""
    farm_id: Optional[int] = Field(default=None, gt=0)


class PurchaseRequestInput(BaseModel):
    buyer_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]
    buyer_phone: Annotated[str, StringConstraints(strip_whitespace=True, min_length=7, max_length=20, pattern=r"^[+0-9() -]+$")]
    quantity_kg: float = Field(gt=0, le=10_000_000)


@router.get("/marketplace/listings")
async def list_produce(crop: Optional[str] = None):
    try:
        return await supabase_features.get_produce_listings(crop)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail="Marketplace storage is unavailable. Apply the Supabase farmer-tools migration first.") from error


@router.post("/marketplace/listings")
async def create_produce_listing(payload: ProduceListingInput):
    listing = payload.model_dump(mode="json")
    try:
        return await supabase_features.create_produce_listing(listing)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail="Could not publish the listing. Confirm the Supabase farmer-tools migration is installed.") from error


@router.post("/marketplace/listings/{listing_id}/purchase")
async def request_produce_purchase(listing_id: str, payload: PurchaseRequestInput):
    try:
        return await supabase_features.request_purchase({
            "p_listing_id": listing_id,
            "p_buyer_name": payload.buyer_name,
            "p_buyer_phone": payload.buyer_phone,
            "p_quantity_kg": payload.quantity_kg,
        })
    except RuntimeError as error:
        message = str(error)
        if "HTTP 400" in message or "HTTP 404" in message:
            raise HTTPException(status_code=409, detail="This crop listing is no longer available for that quantity.") from error
        raise HTTPException(status_code=503, detail="Could not submit the direct purchase request. Confirm the Supabase farmer-tools migration is installed.") from error

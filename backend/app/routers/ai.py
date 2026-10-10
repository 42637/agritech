import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Farm, User, AIConversation
from ..schemas import AIAskRequest, AIAskResponse
from ..services.gemini_ai import gemini_ai_service

router = APIRouter(prefix="/api/ai", tags=["AI Services"])
logger = logging.getLogger("ai_router")

@router.post("/transcribe")
async def transcribe_farmer_voice(request: Request, language: str = "en"):
    language = language.lower()
    if language not in {"en", "te", "hi"}:
        language = "en"
    raw_content_type = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    allowed_audio_types = {
        "audio/webm", "audio/mp4", "audio/m4a", "audio/ogg", "audio/wav",
        "audio/mpeg", "audio/aac", "audio/x-wav", "audio/x-m4a", "audio/3gpp",
        "audio/amr", "application/octet-stream"
    }
    mime_type = raw_content_type if raw_content_type in allowed_audio_types else "audio/webm"
    
    audio = await request.body()
    if not audio or len(audio) < 100:
        return {"transcript": "", "message": "Audio recording is empty"}
        
    if len(audio) > 10 * 1024 * 1024:
        return {"transcript": "", "message": "Recording is too large"}

    try:
        transcript = await asyncio.to_thread(gemini_ai_service.transcribe_farmer_audio, audio, mime_type, language)
        return {"transcript": transcript or ""}
    except Exception as exc:
        logger.warning("Farmer voice transcription note: %s", exc)
        return {"transcript": "", "message": str(exc)}


@router.post("/ask", response_model=AIAskResponse)
async def ask_agri_ai(req: AIAskRequest, db: Session = Depends(get_db)):
    language = (req.language or "en").lower()
    if language not in {"en", "te", "hi"}:
        language = "en"
    farm_context = None
    user = db.query(User).first()

    if req.farm_id:
        farm = db.query(Farm).filter(Farm.id == req.farm_id).first()
        if farm:
            farm_context = {
                "farm_name": farm.farm_name,
                "village": farm.village,
                "district": farm.district,
                "state": farm.state,
                "acreage": farm.acreage,
                "soil_ph": farm.soil_ph,
                "soil_type": farm.soil_type,
                "water_availability": farm.water_availability,
                "current_crops": farm.current_crops
            }

    result = await gemini_ai_service.generate_agricultural_answer(
        question=req.question,
        farm_context=farm_context,
        language=language
    )

    # Store in AI conversation history if user exists
    if user:
        conv = AIConversation(
            user_id=user.id,
            farm_id=req.farm_id,
            question=req.question,
            answer=result["answer"],
            language=language
        )
        db.add(conv)
        db.commit()

    return result

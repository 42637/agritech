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
    mime_type = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    allowed_audio_types = {"audio/webm", "audio/mp4", "audio/m4a", "audio/ogg", "audio/wav", "audio/mpeg", "audio/aac"}
    if mime_type not in allowed_audio_types:
        raise HTTPException(status_code=415, detail="Unsupported audio format")
    audio = await request.body()
    if not audio:
        raise HTTPException(status_code=400, detail="Audio recording is empty")
    if len(audio) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Recording is too large; keep it under 30 seconds")
    try:
        transcript = await asyncio.to_thread(gemini_ai_service.transcribe_farmer_audio, audio, mime_type, language)
        return {"transcript": transcript}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.warning("Farmer voice transcription failed: %s", exc)
        raise HTTPException(status_code=502, detail="Speech recognition service could not process the recording") from exc

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

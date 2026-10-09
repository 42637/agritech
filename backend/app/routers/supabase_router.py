from fastapi import APIRouter
from ..services.supabase_service import supabase_service

router = APIRouter(prefix="/api/supabase", tags=["Supabase"])

@router.get("/status")
async def get_supabase_status():
    """Returns Supabase connection health status."""
    return await supabase_service.get_status()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .routers import auth, farms, location, weather, soil, ai, alerts, saved, profile, irrigation, supabase_router, farmer_features
from .services.supabase_service import supabase_service

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AgriSmart AI Backend API",
    description="World-Class Smart Farming Platform for Indian Farmers with Google Gemini AI, Open-Meteo Weather Intelligence, and Supabase Integration",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(farms.router)
app.include_router(location.router)
app.include_router(weather.router)
app.include_router(soil.router)
app.include_router(ai.router)
app.include_router(alerts.router)
app.include_router(saved.router)
app.include_router(profile.router)
app.include_router(irrigation.router)
app.include_router(supabase_router.router)
app.include_router(farmer_features.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "AgriSmart AI API Server",
        "version": "1.0.0",
        "supabase_status_url": "/api/supabase/status",
        "weather_api": "Open-Meteo",
        "ai_engine": "Google Gemini 2.5 Flash AI",
        "docs_url": "/docs"
    }

@app.get("/api/health")
async def health_check():
    supabase_status = await supabase_service.get_status()
    return {
        "status": "healthy",
        "service": "agrismart-backend",
        "supabase": supabase_status["status"],
        "supabase_connected": supabase_status["connected"],
        "weather": "Open-Meteo API Active"
    }

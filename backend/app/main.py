from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .routers import auth, farms, location, weather, soil, ai, alerts, saved, profile, irrigation

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AgriSmart AI Backend API",
    description="World-Class Smart Farming Platform for Indian Farmers with NVIDIA AI, Weather Intelligence, and Soil Insights",
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

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "AgriSmart AI API Server",
        "version": "1.0.0",
        "nvidia_model": settings.NVIDIA_MODEL,
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "agrismart-backend"}

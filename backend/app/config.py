import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://your-supabase-project.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    OPEN_METEO_API_KEY: str = os.getenv("OPEN_METEO_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./agrismart.db")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    AUTH_PROVIDER: str = os.getenv("AUTH_PROVIDER", "dev_direct")

    # Climate Risk Alert & Notification Configuration
    ALERT_SYSTEM_ENABLED: bool = os.getenv("ALERT_SYSTEM_ENABLED", "true").lower() == "true"
    SMS_ALERT_ENABLED: bool = os.getenv("SMS_ALERT_ENABLED", "true").lower() == "true"
    ALERT_EMAIL: str = os.getenv("ALERT_EMAIL", "")
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD") or os.getenv("SMTP_PASS", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM") or os.getenv("SMTP_USER", "")
    SMS_PROVIDER_API_KEY: str = os.getenv("SMS_PROVIDER_API_KEY", "")
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY") or os.getenv("STT_PROVIDER_API_KEY", "")


settings = Settings()

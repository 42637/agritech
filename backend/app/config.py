import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY", "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")
    NVIDIA_BASE_URL: str = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
    NVIDIA_MODEL: str = os.getenv("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./agrismart.db")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    AUTH_PROVIDER: str = os.getenv("AUTH_PROVIDER", "dev_otp")

settings = Settings()

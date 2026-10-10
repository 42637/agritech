import logging
import httpx
from typing import Dict, Any
from ..config import settings

logger = logging.getLogger("supabase_service")

class SupabaseService:
    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
        self._client = None
        self._init_client()

    def is_configured(self) -> bool:
        key = self.key.lower() if self.key else ""
        return bool(
            self.url
            and self.key
            and "your-supabase-project" not in self.url.lower()
            and not any(marker in key for marker in ("dummy_", "your_", "placeholder"))
        )

    def _init_client(self):
        if self.is_configured():
            try:
                from supabase import create_client
                self._client = create_client(self.url, self.key)
                logger.info("Supabase client successfully initialized.")
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase client: {e}")

    def _api_key_headers(self) -> Dict[str, str]:
        # Current sb_publishable_* and sb_secret_* keys are API keys, not JWTs.
        # Send them only via `apikey`; legacy anon/service-role JWTs also use
        # the Authorization bearer header.
        headers = {"apikey": self.key}
        if not self.key.startswith("sb_"):
            headers["Authorization"] = f"Bearer {self.key}"
        return headers

    async def get_status(self) -> Dict[str, Any]:
        """Checks connection status with Supabase backend."""
        if not self.is_configured():
            return {
                "status": "not_configured",
                "connected": False,
                "provider": "Supabase Cloud DB",
                "message": "Set the real Supabase project URL and API key in the backend environment."
            }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(
                    f"{self.url.rstrip('/')}/rest/v1/",
                    headers=self._api_key_headers(),
                )
                if res.status_code == 200:
                    return {
                        "status": "connected",
                        "connected": True,
                        "provider": "Supabase Cloud DB & Auth",
                        "url": self.url,
                        "http_status": res.status_code,
                        "message": "Supabase connection verified."
                    }
                logger.warning("Supabase status request returned HTTP %s", res.status_code)
                return {
                    "status": "authentication_failed" if res.status_code in (401, 403) else "unreachable",
                    "connected": False,
                    "provider": "Supabase Cloud DB",
                    "url": self.url,
                    "http_status": res.status_code,
                    "message": "Supabase rejected the configured key or the REST endpoint is unavailable."
                }
        except Exception as e:
            logger.error("Supabase connection test failed: %s", type(e).__name__)

        return {
            "status": "unreachable",
            "connected": False,
            "provider": "Supabase DB Connector",
            "url": self.url,
            "message": "Could not reach the Supabase REST endpoint."
        }

    def get_client(self):
        return self._client

supabase_service = SupabaseService()

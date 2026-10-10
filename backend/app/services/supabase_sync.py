import logging
import httpx
from typing import Dict, Any, Optional
from ..config import settings

logger = logging.getLogger("supabase_sync")

class SupabaseSyncService:
    def __init__(self):
        self.url = settings.SUPABASE_URL.rstrip('/') if settings.SUPABASE_URL else ""
        # Use the server-only service role for backend writes so table RLS can
        # remain closed to public clients. Keep anon-key support for existing syncs.
        self.key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY

    def is_configured(self) -> bool:
        key = self.key.lower() if self.key else ""
        return bool(
            self.url
            and self.key
            and "your-supabase-project" not in self.url.lower()
            and not any(marker in key for marker in ("dummy_", "your_", "placeholder"))
        )

    def _api_key_headers(self) -> Dict[str, str]:
        # New Supabase keys are API keys, not JWTs; only send them as apikey.
        headers = {"apikey": self.key}
        if not self.key.startswith("sb_"):
            headers["Authorization"] = f"Bearer {self.key}"
        return headers

    async def sync_irrigation_plan(
        self,
        farm_id: int,
        crop: str,
        water_source: str,
        growth_stage: str,
        crop_duration_days: Optional[int],
        language: str,
        field_update: Optional[Dict[str, Any]],
        ai_status: str,
        plan: Dict[str, Any],
    ) -> bool:
        """Persist each generated irrigation and crop advisory plan in Supabase."""
        if not self.is_configured():
            logger.warning("Supabase irrigation-plan sync skipped: credentials are not configured")
            return False

        headers = {
            **self._api_key_headers(),
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }
        payload = {
            "local_farm_id": farm_id,
            "crop": crop,
            "water_source": water_source,
            "growth_stage": growth_stage,
            "crop_duration_days": crop_duration_days,
            "language": language,
            "field_update_json": field_update or {},
            "ai_status": ai_status,
            "plan_json": plan,
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(
                    f"{self.url}/rest/v1/irrigation_plans",
                    headers=headers,
                    json=payload,
                )
            if response.status_code not in (200, 201, 204):
                logger.warning(
                    "Supabase irrigation-plan sync failed with HTTP %s: %s",
                    response.status_code,
                    response.text[:500],
                )
                return False
            return True
        except Exception as error:
            logger.warning("Supabase irrigation-plan sync error: %s", type(error).__name__)
            return False

    async def sync_farm(self, farm_data: Dict[str, Any]) -> bool:
        """Syncs created/updated farm parcel to Supabase PostgreSQL table."""
        if not self.is_configured():
            return False

        headers = {
            **self._api_key_headers(),
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(f"{self.url}/rest/v1/farms", headers=headers, json=farm_data)
                return res.status_code in (200, 201)
        except Exception as e:
            logger.warning(f"Supabase farm sync error: {e}")
            return False

    async def sync_weather_cache(self, weather_data: Dict[str, Any]) -> bool:
        """Stores live Open-Meteo weather report into Supabase weather_cache table."""
        if not self.is_configured():
            return False

        payload = {
            "village": weather_data.get("village"),
            "district": weather_data.get("district"),
            "state": weather_data.get("state"),
            "latitude": weather_data.get("lat"),
            "longitude": weather_data.get("lon"),
            "current_temp": weather_data.get("current_temp"),
            "feels_like": weather_data.get("feels_like"),
            "condition": weather_data.get("condition"),
            "rain_chance": weather_data.get("rain_chance"),
            "max_temp": weather_data.get("max_temp"),
            "min_temp": weather_data.get("min_temp"),
            "wind_speed": weather_data.get("wind_speed"),
            "humidity": weather_data.get("humidity"),
            "forecast_json": weather_data.get("forecast", []),
            "insights_json": weather_data.get("insights", [])
        }

        headers = {
            **self._api_key_headers(),
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(f"{self.url}/rest/v1/weather_cache", headers=headers, json=payload)
                return res.status_code in (200, 201)
        except Exception as e:
            logger.warning(f"Supabase weather cache sync error: {e}")
            return False

    async def sync_weather_alert(self, alert_data: Dict[str, Any]) -> bool:
        """Stores dynamic AI weather alert into Supabase weather_alerts table."""
        if not self.is_configured():
            return False

        headers = {
            **self._api_key_headers(),
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(f"{self.url}/rest/v1/weather_alerts", headers=headers, json=alert_data)
                return res.status_code in (200, 201)
        except Exception as e:
            logger.warning(f"Supabase weather alert sync error: {e}")
            return False

supabase_sync = SupabaseSyncService()

"""Server-side persistence for image diagnoses and direct produce sales."""
import logging
from typing import Any, Dict, List, Optional

import httpx

from ..config import settings

logger = logging.getLogger("supabase_features")


class SupabaseFeatureStore:
    def __init__(self) -> None:
        self.url = settings.SUPABASE_URL.rstrip("/") if settings.SUPABASE_URL else ""
        self.key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY

    def is_configured(self) -> bool:
        lowered = self.key.lower()
        return bool(
            self.url and self.key
            and "your-supabase-project" not in self.url.lower()
            and not any(marker in lowered for marker in ("dummy_", "your_", "placeholder"))
        )

    def _headers(self, **extra: str) -> Dict[str, str]:
        headers = {"apikey": self.key, **extra}
        # sb_* keys are API keys rather than JWTs; legacy keys require Bearer too.
        if not self.key.startswith("sb_"):
            headers["Authorization"] = f"Bearer {self.key}"
        return headers

    async def _request(self, method: str, path: str, **kwargs: Any) -> httpx.Response:
        if not self.is_configured():
            raise RuntimeError("Supabase server credentials are not configured")
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.request(
                method, f"{self.url}/{path.lstrip('/')}",
                headers=self._headers(**kwargs.pop("headers", {})), **kwargs,
            )
        if response.is_error:
            logger.warning("Supabase feature request failed: %s %s HTTP %s", method, path.split("?")[0], response.status_code)
            raise RuntimeError(f"Supabase feature storage returned HTTP {response.status_code}")
        return response

    async def upload_disease_image(self, object_path: str, content: bytes, mime_type: str) -> str:
        await self._request(
            "POST", f"storage/v1/object/crop-disease-images/{object_path}",
            content=content,
            headers={"Content-Type": mime_type, "x-upsert": "false"},
        )
        return object_path

    async def save_disease_report(self, report: Dict[str, Any]) -> Dict[str, Any]:
        response = await self._request(
            "POST", "rest/v1/crop_disease_reports",
            json=report,
            headers={"Content-Type": "application/json", "Prefer": "return=representation"},
        )
        rows = response.json()
        return rows[0] if rows else report

    async def get_produce_listings(self, crop: Optional[str] = None) -> List[Dict[str, Any]]:
        params: Dict[str, str] = {
            "select": "id,seller_name,seller_phone,crop_name,quantity_kg,price_per_kg,location,harvest_date,quality_grade,details,status,created_at",
            "status": "eq.available",
            "order": "created_at.desc",
        }
        if crop:
            params["crop_name"] = f"ilike.*{crop.strip()}*"
        response = await self._request("GET", "rest/v1/produce_listings", params=params)
        return response.json()

    async def create_produce_listing(self, listing: Dict[str, Any]) -> Dict[str, Any]:
        response = await self._request(
            "POST", "rest/v1/produce_listings", json=listing,
            headers={"Content-Type": "application/json", "Prefer": "return=representation"},
        )
        rows = response.json()
        return rows[0] if rows else {}

    async def request_purchase(self, purchase: Dict[str, Any]) -> Dict[str, Any]:
        response = await self._request(
            "POST", "rest/v1/rpc/request_produce_purchase", json=purchase,
            headers={"Content-Type": "application/json"},
        )
        data = response.json()
        if isinstance(data, list):
            return data[0] if data else {}
        return data


supabase_features = SupabaseFeatureStore()

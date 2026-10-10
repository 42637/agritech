import asyncio
import httpx
import logging
import math
import random
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from ..config import settings

logger = logging.getLogger("weather_service")

# WMO Weather interpretation codes (for Open-Meteo fallback)
WMO_CODES = {
    0: ("Clear Sky", "sun"),
    1: ("Mainly Clear", "sun"),
    2: ("Partly Cloudy", "cloud"),
    3: ("Overcast", "cloud"),
    45: ("Foggy", "cloud"),
    48: ("Depositing Rime Fog", "cloud"),
    51: ("Light Drizzle", "rain"),
    53: ("Moderate Drizzle", "rain"),
    55: ("Dense Drizzle", "rain"),
    61: ("Slight Rain", "rain"),
    63: ("Moderate Rain", "rain"),
    65: ("Heavy Rain", "rain"),
    80: ("Slight Rain Showers", "rain"),
    81: ("Moderate Rain Showers", "rain"),
    82: ("Violent Rain Showers", "rain"),
    95: ("Thunderstorm", "rain"),
}

_CACHE_TTL = 900            # 15 minutes for fresh data
_COOLDOWN_TTL = 120         # 2-minute cooldown window after a 429
_REQUEST_TIMEOUT = 10.0     # seconds for HTTP requests


class WeatherService:
    def __init__(self):
        # Main data cache: cache_key -> {timestamp, data}
        self._cache: Dict[str, Dict[str, Any]] = {}
        # 429 cooldown registry: cache_key -> timestamp_cooldown_until
        self._cooldown: Dict[str, float] = {}
        # Per-key in-flight deduplication locks
        self._locks: Dict[str, asyncio.Lock] = {}

    def _get_lock(self, key: str) -> asyncio.Lock:
        if key not in self._locks:
            self._locks[key] = asyncio.Lock()
        return self._locks[key]

    def _cache_key(self, lat: float, lon: float) -> str:
        """Normalise to ~1 km grid to collapse nearby requests."""
        return f"{round(lat, 2)}_{round(lon, 2)}"

    def _get_cached(self, key: str) -> Optional[Dict[str, Any]]:
        entry = self._cache.get(key)
        if entry and time.monotonic() - entry["timestamp"] < _CACHE_TTL:
            return entry["data"]
        return None

    def _get_stale(self, key: str) -> Optional[Dict[str, Any]]:
        """Return the most recent successful data even if it has expired."""
        entry = self._cache.get(key)
        if entry and entry["data"].get("source") in {"weatherapi", "forecast", "stale_forecast"}:
            return entry["data"]
        return None

    def _set_cache(self, key: str, data: Dict[str, Any]) -> None:
        self._cache[key] = {"timestamp": time.monotonic(), "data": data}

    def _in_cooldown(self, key: str) -> bool:
        until = self._cooldown.get(key, 0)
        return time.monotonic() < until

    def _set_cooldown(self, key: str, seconds: float) -> None:
        # Add jitter (±20%) to spread retries when multiple workers restart
        jitter = seconds * 0.2 * (random.random() * 2 - 1)
        self._cooldown[key] = time.monotonic() + seconds + jitter

    async def get_farm_weather(
        self,
        lat: Any = 16.5449,
        lon: Any = 81.5212,
        village: str = "Bhimavaram",
        district: str = "West Godavari",
        state: str = "Andhra Pradesh",
    ) -> Dict[str, Any]:
        """
        Fetch live weather from WeatherAPI.com (or Open-Meteo fallback) with:
          - In-memory cache (15 min TTL)
          - In-flight deduplication (asyncio.Lock per location)
          - Stale-cache fallback on 429 / error
          - Bounded 429 cooldown (2 min + jitter)
          - Full observability logging
        """
        try:
            lat_val = float(lat) if lat is not None else 16.5449
            lon_val = float(lon) if lon is not None else 81.5212
        except (ValueError, TypeError):
            lat_val, lon_val = 16.5449, 81.5212

        key = self._cache_key(lat_val, lon_val)

        # 1. Fast path – serve fresh cached data
        cached = self._get_cached(key)
        if cached is not None:
            logger.debug("weather cache HIT for %s", key)
            return cached

        # 2. Acquire per-location lock to deduplicate concurrent requests
        async with self._get_lock(key):
            cached = self._get_cached(key)
            if cached is not None:
                logger.debug("weather cache HIT (post-lock) for %s", key)
                return cached

            # 3. Check if in cooldown
            if self._in_cooldown(key):
                stale = self._get_stale(key)
                if stale:
                    logger.info("Rate-limit cooldown active for %s — serving stale forecast", key)
                    stale_copy = dict(stale)
                    stale_copy["source"] = "stale_forecast"
                    stale_copy["updated_at"] = f"Cached forecast — {stale.get('updated_at', 'unknown')}"
                    return stale_copy
                return self._fallback_weather(lat_val, lon_val, village, district, state)

            # 4. Try WeatherAPI.com if key is present
            weatherapi_key = (settings.WEATHERAPI_KEY or "").strip()
            if weatherapi_key:
                logger.info("weather cache MISS for %s — fetching WeatherAPI.com", key)
                try:
                    w_data = await self._fetch_weatherapi(weatherapi_key, lat_val, lon_val, village, district, state)
                    if w_data:
                        self._set_cache(key, w_data)
                        return w_data
                except Exception as exc:
                    logger.warning("WeatherAPI.com request failed for %s: %s", key, exc)

            # 5. Fallback to Open-Meteo
            logger.info("Fetching Open-Meteo for %s", key)
            try:
                om_data = await self._fetch_open_meteo(lat_val, lon_val, village, district, state)
                if om_data:
                    self._set_cache(key, om_data)
                    return om_data
            except Exception as exc:
                logger.warning("Open-Meteo request failed for %s: %s", key, exc)

        # 6. Final fallback — serve stale or explicit unavailable
        stale = self._get_stale(key)
        if stale:
            stale_copy = dict(stale)
            stale_copy["source"] = "stale_forecast"
            stale_copy["updated_at"] = f"Last live update: {stale.get('updated_at', 'unknown')}"
            logger.info("Serving stale forecast for %s after error", key)
            return stale_copy

        logger.warning("All weather sources failed for %s — returning unavailable state", key)
        return self._fallback_weather(lat_val, lon_val, village, district, state)

    async def _fetch_weatherapi(
        self, api_key: str, lat: float, lon: float, village: str, district: str, state: str
    ) -> Optional[Dict[str, Any]]:
        url = f"https://api.weatherapi.com/v1/forecast.json?key={api_key}&q={lat},{lon}&days=7&aqi=no&alerts=no"
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                raw = res.json()
                return self._format_weatherapi_response(raw, lat, lon, village, district, state)
            elif res.status_code == 429:
                self._set_cooldown(self._cache_key(lat, lon), _COOLDOWN_TTL)
                logger.warning("WeatherAPI.com 429 rate limit hit for (%s, %s)", lat, lon)
            else:
                logger.warning("WeatherAPI.com HTTP %s for (%s, %s)", res.status_code, lat, lon)
        return None

    async def _fetch_open_meteo(
        self, lat: float, lon: float, village: str, district: str, state: str
    ) -> Optional[Dict[str, Any]]:
        base_domain = "customer-api.open-meteo.com" if settings.OPEN_METEO_API_KEY else "api.open-meteo.com"
        api_key_param = f"&apikey={settings.OPEN_METEO_API_KEY}" if settings.OPEN_METEO_API_KEY else ""
        url = (
            f"https://{base_domain}/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"current=temperature_2m,relative_humidity_2m,apparent_temperature,"
            f"precipitation,weather_code,wind_speed_10m&"
            f"daily=weather_code,temperature_2m_max,temperature_2m_min,"
            f"precipitation_probability_max,precipitation_sum,wind_speed_10m_max&"
            f"timezone=auto{api_key_param}"
        )
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                raw = res.json()
                return self._format_open_meteo_response(raw, lat, lon, village, district, state)
            elif res.status_code == 429:
                self._set_cooldown(self._cache_key(lat, lon), _COOLDOWN_TTL)
                logger.warning("Open-Meteo 429 rate limit hit for (%s, %s)", lat, lon)
            else:
                logger.warning("Open-Meteo HTTP %s for (%s, %s)", res.status_code, lat, lon)
        return None

    def _format_weatherapi_response(
        self, data: Dict[str, Any], lat: float, lon: float, village: str, district: str, state: str
    ) -> Dict[str, Any]:
        current = data.get("current", {})
        forecast_days = data.get("forecast", {}).get("forecastday", [])

        def safe_round(val, ndigits=0):
            if isinstance(val, (int, float)) and not math.isnan(val):
                return round(val, ndigits) if ndigits else round(val)
            return None

        temp_curr = safe_round(current.get("temp_c"))
        feels_like = safe_round(current.get("feelslike_c"))
        humidity = safe_round(current.get("humidity"))
        wind_speed = safe_round(current.get("wind_kph"))
        condition_text = current.get("condition", {}).get("text", "Partly Cloudy")

        forecast: List[Dict[str, Any]] = []
        for fday in forecast_days[:7]:
            date_str = fday.get("date", "")
            try:
                dt = datetime.strptime(date_str, "%Y-%m-%d")
            except Exception:
                dt = datetime.now()
            day_data = fday.get("day", {})
            forecast.append({
                "day": dt.strftime("%a"),
                "date": dt.strftime("%d %b"),
                "max_temp": safe_round(day_data.get("maxtemp_c")),
                "min_temp": safe_round(day_data.get("mintemp_c")),
                "rain_chance": safe_round(day_data.get("daily_chance_of_rain")),
                "precipitation_mm": safe_round(day_data.get("totalprecip_mm"), 1),
                "condition": day_data.get("condition", {}).get("text", "Partly Cloudy"),
                "icon": "rain" if (day_data.get("daily_chance_of_rain") or 0) >= 30 else "sun",
            })

        rain_today = forecast[0]["rain_chance"] if forecast else None
        max_today = forecast[0]["max_temp"] if forecast else None
        min_today = forecast[0]["min_temp"] if forecast else None
        rainfall_7d = round(sum(f["precipitation_mm"] for f in forecast if f["precipitation_mm"] is not None), 1) if forecast else None

        now_time = datetime.now().strftime("%I:%M %p")
        audio_summary = (
            f"Live WeatherAPI report for {village}, {district}. "
            f"Current temperature is {temp_curr}°C and {condition_text}. Humidity is {humidity}%."
        )

        return {
            "village": village,
            "district": district,
            "state": state,
            "lat": round(lat, 2),
            "lon": round(lon, 2),
            "updated_at": f"Live WeatherAPI {now_time}",
            "source": "weatherapi",
            "rainfall_7d_mm": rainfall_7d,
            "current_temp": temp_curr,
            "feels_like": feels_like,
            "condition": condition_text,
            "rain_chance": rain_today,
            "max_temp": max_today,
            "min_temp": min_today,
            "wind_speed": wind_speed,
            "humidity": humidity,
            "forecast": forecast,
            "insights": self._generate_weather_insights(forecast, True),
            "audio_summary": audio_summary,
        }

    def _format_open_meteo_response(
        self, data: Dict[str, Any], lat: float, lon: float, village: str, district: str, state: str
    ) -> Dict[str, Any]:
        current = data.get("current", {})
        daily = data.get("daily", {})

        wmo_code = current.get("weather_code")
        condition_text, icon_type = WMO_CODES.get(wmo_code, ("Unavailable", "sun"))

        def safe_round(val, ndigits=0):
            if isinstance(val, (int, float)) and not math.isnan(val):
                return round(val, ndigits) if ndigits else round(val)
            return None

        temp_curr = safe_round(current.get("temperature_2m"))
        feels_like = safe_round(current.get("apparent_temperature"))
        humidity = safe_round(current.get("relative_humidity_2m"))
        wind_speed = safe_round(current.get("wind_speed_10m"))

        daily_time = daily.get("time", [])
        max_temps = daily.get("temperature_2m_max", [])
        min_temps = daily.get("temperature_2m_min", [])
        rain_chances = daily.get("precipitation_probability_max", [])
        rainfall_amounts = daily.get("precipitation_sum", [])
        daily_codes = daily.get("weather_code", [])

        forecast: List[Dict[str, Any]] = []
        for i in range(min(7, len(daily_time))):
            date_str = daily_time[i]
            try:
                dt = datetime.strptime(date_str, "%Y-%m-%d")
            except Exception:
                dt = datetime.now() + timedelta(days=i)
            d_code = daily_codes[i] if i < len(daily_codes) else None
            cond, icon = WMO_CODES.get(d_code, ("Unavailable", "sun"))
            forecast.append({
                "day": dt.strftime("%a"),
                "date": dt.strftime("%d %b"),
                "max_temp": safe_round(max_temps[i]) if i < len(max_temps) else None,
                "min_temp": safe_round(min_temps[i]) if i < len(min_temps) else None,
                "rain_chance": safe_round(rain_chances[i]) if i < len(rain_chances) else None,
                "precipitation_mm": safe_round(rainfall_amounts[i], 1) if i < len(rainfall_amounts) else None,
                "condition": cond,
                "icon": icon,
            })

        rain_today = rain_chances[0] if rain_chances else None
        max_today = safe_round(max_temps[0]) if max_temps else None
        min_today = safe_round(min_temps[0]) if min_temps else None
        rainfall_7d = round(sum(v for v in rainfall_amounts[:7] if isinstance(v, (int, float))), 1) if rainfall_amounts else None

        weather_available = temp_curr is not None or max_today is not None
        source = "forecast" if weather_available else "unavailable"
        now_time = datetime.now().strftime("%I:%M %p")

        audio_summary = (
            f"Live Open-Meteo weather report for {village}, {district}. "
            f"Current temperature is {temp_curr}°C and {condition_text}. Humidity is {humidity}%."
            if weather_available and temp_curr is not None
            else f"Live weather values are unavailable for {village}, {district}."
        )

        return {
            "village": village,
            "district": district,
            "state": state,
            "lat": round(lat, 2),
            "lon": round(lon, 2),
            "updated_at": f"Live Open-Meteo {now_time}" if weather_available else "Live forecast unavailable",
            "source": source,
            "rainfall_7d_mm": rainfall_7d,
            "current_temp": temp_curr,
            "feels_like": feels_like,
            "condition": condition_text if weather_available else None,
            "rain_chance": rain_today,
            "max_temp": max_today,
            "min_temp": min_today,
            "wind_speed": wind_speed,
            "humidity": humidity,
            "forecast": forecast,
            "insights": self._generate_weather_insights(forecast, weather_available),
            "audio_summary": audio_summary,
        }

    def _generate_weather_insights(
        self, forecast: List[Dict[str, Any]], weather_available: bool
    ) -> List[Dict[str, Any]]:
        if not forecast or not weather_available:
            return [{
                "title": "Weather forecast unavailable",
                "message": "No live forecast was received. Check again later before planning irrigation.",
                "type": "info",
                "icon": "rain",
            }]
        insights = []
        high_rain_day = next((f for f in forecast[:3] if (f.get("rain_chance") or 0) >= 40), None)
        if high_rain_day:
            insights.append({
                "title": f"Rain expected on {high_rain_day['day']}",
                "message": f"Forecast shows a {high_rain_day['rain_chance']}% chance of rain on {high_rain_day['day']} ({high_rain_day['date']}). Adjust irrigation accordingly.",
                "type": "warning",
                "icon": "rain",
            })
        else:
            insights.append({
                "title": "Clear Weather Window",
                "message": "No high-rain day in the 3-day forecast. Check field conditions before scheduling field work.",
                "type": "info",
                "icon": "rain",
            })
        max_t = forecast[0].get("max_temp") if forecast else None
        if max_t is not None and max_t >= 35:
            insights.append({
                "title": "High Temperature Warning",
                "message": f"Max temperature of {max_t}°C forecast today. Irrigate early morning or evening to reduce heat stress.",
                "type": "warning",
                "icon": "sun",
            })
        else:
            insights.append({
                "title": "Optimal Growth Conditions",
                "message": "Temperature levels indicate good conditions for crop growth today.",
                "type": "success",
                "icon": "sprout",
            })
        return insights

    def _fallback_weather(
        self, lat: float, lon: float, village: str, district: str, state: str
    ) -> Dict[str, Any]:
        return {
            "village": village,
            "district": district,
            "state": state,
            "lat": round(lat, 2),
            "lon": round(lon, 2),
            "updated_at": "Live forecast unavailable",
            "source": "unavailable",
            "rainfall_7d_mm": None,
            "current_temp": None,
            "feels_like": None,
            "condition": None,
            "rain_chance": None,
            "max_temp": None,
            "min_temp": None,
            "wind_speed": None,
            "humidity": None,
            "forecast": [],
            "insights": [{
                "title": "Weather forecast unavailable",
                "message": "Weather provider could not be reached. Check your connection and try again.",
                "type": "info",
                "icon": "rain",
            }],
            "audio_summary": f"Live weather values are unavailable for {village}, {district}. Check again later.",
        }


weather_service = WeatherService()

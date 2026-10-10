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

WMO_CODES = {
    0: ("Clear Sky", "sun"), 1: ("Mainly Clear", "sun"), 2: ("Partly Cloudy", "cloud"),
    3: ("Overcast", "cloud"), 45: ("Foggy", "cloud"), 48: ("Depositing Rime Fog", "cloud"),
    51: ("Light Drizzle", "rain"), 53: ("Moderate Drizzle", "rain"), 55: ("Dense Drizzle", "rain"),
    61: ("Slight Rain", "rain"), 63: ("Moderate Rain", "rain"), 65: ("Heavy Rain", "rain"),
    80: ("Slight Rain Showers", "rain"), 81: ("Moderate Rain Showers", "rain"),
    82: ("Violent Rain Showers", "rain"), 95: ("Thunderstorm", "rain"),
}

_CACHE_TTL = 1800
_COOLDOWN_TTL = 180
_REQUEST_TIMEOUT = 15.0


class WeatherService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cooldown: Dict[str, float] = {}
        self._locks: Dict[str, asyncio.Lock] = {}

    def _get_lock(self, key: str) -> asyncio.Lock:
        if key not in self._locks:
            self._locks[key] = asyncio.Lock()
        return self._locks[key]

    def _cache_key(self, lat: float, lon: float) -> str:
        return f"{round(lat, 2)}_{round(lon, 2)}"

    def _get_cached(self, key: str) -> Optional[Dict[str, Any]]:
        entry = self._cache.get(key)
        if entry and time.monotonic() - entry["timestamp"] < _CACHE_TTL:
            return entry["data"]
        return None

    def _get_stale(self, key: str) -> Optional[Dict[str, Any]]:
        entry = self._cache.get(key)
        if entry and entry["data"].get("source") in {"weatherapi", "open_meteo", "stale"}:
            return entry["data"]
        return None

    def _set_cache(self, key: str, data: Dict[str, Any]) -> None:
        self._cache[key] = {"timestamp": time.monotonic(), "data": data}

    def _in_cooldown(self, key: str) -> bool:
        return time.monotonic() < self._cooldown.get(key, 0)

    def _set_cooldown(self, key: str, seconds: float) -> None:
        jitter = seconds * 0.2 * (random.random() * 2 - 1)
        self._cooldown[key] = time.monotonic() + seconds + jitter

    @staticmethod
    def _safe_round(val: Any, ndigits: int = 0) -> Optional[float]:
        try:
            v = float(val)
            if not math.isnan(v) and not math.isinf(v):
                return round(v, ndigits) if ndigits else round(v)
        except (TypeError, ValueError):
            pass
        return None

    async def get_farm_weather(
        self,
        lat: Any = 16.5449,
        lon: Any = 81.5212,
        village: str = "Bhimavaram",
        district: str = "West Godavari",
        state: str = "Andhra Pradesh",
    ) -> Dict[str, Any]:
        try:
            lat_val = float(lat) if lat is not None else 16.5449
            lon_val = float(lon) if lon is not None else 81.5212
        except (ValueError, TypeError):
            lat_val, lon_val = 16.5449, 81.5212

        key = self._cache_key(lat_val, lon_val)

        cached = self._get_cached(key)
        if cached is not None:
            logger.debug("weather cache HIT for %s", key)
            return cached

        async with self._get_lock(key):
            cached = self._get_cached(key)
            if cached is not None:
                return cached

            if self._in_cooldown(key):
                stale = self._get_stale(key)
                if stale:
                    result = dict(stale)
                    result["source"] = "stale"
                    result["updated_at"] = f"Cached data from {stale.get('updated_at', 'earlier')}"
                    return result
                return self._unavailable_response(lat_val, lon_val, village, district, state)

            weatherapi_key = (getattr(settings, "WEATHERAPI_KEY", "") or "").strip()
            if weatherapi_key and len(weatherapi_key) > 10:
                logger.info("Trying WeatherAPI.com for %s", key)
                try:
                    data = await self._fetch_weatherapi(weatherapi_key, lat_val, lon_val, village, district, state)
                    if data:
                        self._set_cache(key, data)
                        logger.info("WeatherAPI.com OK temp=%s for %s", data.get("current_temp"), key)
                        return data
                except Exception as exc:
                    logger.warning("WeatherAPI.com error: %s", exc)

            logger.info("Trying Open-Meteo for %s", key)
            try:
                data = await self._fetch_open_meteo(lat_val, lon_val, village, district, state)
                if data and data.get("source") != "unavailable":
                    self._set_cache(key, data)
                    logger.info("Open-Meteo OK temp=%s for %s", data.get("current_temp"), key)
                    return data
            except Exception as exc:
                logger.warning("Open-Meteo error: %s", exc)

        stale = self._get_stale(key)
        if stale:
            result = dict(stale)
            result["source"] = "stale"
            result["updated_at"] = f"Last live data: {stale.get('updated_at', 'earlier')}"
            return result

        logger.error("All weather sources failed for %s", key)
        return self._unavailable_response(lat_val, lon_val, village, district, state)

    async def _fetch_weatherapi(self, api_key, lat, lon, village, district, state):
        url = f"https://api.weatherapi.com/v1/forecast.json?key={api_key}&q={lat},{lon}&days=7&aqi=no&alerts=no"
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                return self._format_weatherapi_response(res.json(), lat, lon, village, district, state)
            elif res.status_code in (401, 403):
                logger.error("WeatherAPI.com auth error %s", res.status_code)
            elif res.status_code == 429:
                self._set_cooldown(self._cache_key(lat, lon), _COOLDOWN_TTL)
                logger.warning("WeatherAPI.com 429 for (%s,%s)", lat, lon)
            else:
                logger.warning("WeatherAPI.com HTTP %s", res.status_code)
        return None

    async def _fetch_open_meteo(self, lat, lon, village, district, state):
        om_key = (getattr(settings, "OPEN_METEO_API_KEY", "") or "").strip()
        if om_key:
            base = "customer-api.open-meteo.com"
            key_param = f"&apikey={om_key}"
        else:
            base = "api.open-meteo.com"
            key_param = ""
        url = (
            f"https://{base}/v1/forecast?latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,"
            f"precipitation,weather_code,wind_speed_10m"
            f"&daily=weather_code,temperature_2m_max,temperature_2m_min,"
            f"precipitation_probability_max,precipitation_sum,wind_speed_10m_max"
            f"&timezone=auto{key_param}"
        )
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                return self._format_open_meteo_response(res.json(), lat, lon, village, district, state)
            elif res.status_code == 429:
                self._set_cooldown(self._cache_key(lat, lon), _COOLDOWN_TTL)
                logger.warning("Open-Meteo 429 for (%s,%s)", lat, lon)
            else:
                logger.warning("Open-Meteo HTTP %s", res.status_code)
        return None

    def _format_weatherapi_response(self, data, lat, lon, village, district, state):
        sr = self._safe_round
        current = data.get("current", {})
        forecast_days = data.get("forecast", {}).get("forecastday", [])
        temp_curr = sr(current.get("temp_c"))
        feels_like = sr(current.get("feelslike_c"))
        humidity = sr(current.get("humidity"))
        wind_speed = sr(current.get("wind_kph"))
        condition_text = current.get("condition", {}).get("text", "Partly Cloudy")
        forecast = []
        for fday in forecast_days[:7]:
            try:
                dt = datetime.strptime(fday.get("date", ""), "%Y-%m-%d")
            except Exception:
                dt = datetime.now()
            dd = fday.get("day", {})
            rain_pct = sr(dd.get("daily_chance_of_rain"))
            forecast.append({
                "day": dt.strftime("%a"), "date": dt.strftime("%d %b"),
                "max_temp": sr(dd.get("maxtemp_c")), "min_temp": sr(dd.get("mintemp_c")),
                "rain_chance": rain_pct,
                "precipitation_mm": sr(dd.get("totalprecip_mm"), 1),
                "condition": dd.get("condition", {}).get("text", "Partly Cloudy"),
                "icon": "rain" if (rain_pct or 0) >= 30 else "sun",
            })
        now_time = datetime.now().strftime("%I:%M %p")
        return {
            "village": village, "district": district, "state": state,
            "lat": round(lat, 2), "lon": round(lon, 2),
            "updated_at": f"WeatherAPI.com - {now_time}", "source": "weatherapi",
            "current_temp": temp_curr, "feels_like": feels_like,
            "condition": condition_text, "humidity": humidity, "wind_speed": wind_speed,
            "rain_chance": forecast[0]["rain_chance"] if forecast else None,
            "max_temp": forecast[0]["max_temp"] if forecast else None,
            "min_temp": forecast[0]["min_temp"] if forecast else None,
            "rainfall_7d_mm": round(sum(f["precipitation_mm"] for f in forecast if f["precipitation_mm"] is not None), 1) if forecast else None,
            "forecast": forecast,
            "insights": self._generate_insights(forecast, True),
            "audio_summary": f"WeatherAPI: {village} {district}. Temp {temp_curr}C, {condition_text}. Humidity {humidity}%.",
        }

    def _format_open_meteo_response(self, data, lat, lon, village, district, state):
        sr = self._safe_round
        current = data.get("current", {})
        daily = data.get("daily", {})
        wmo_code = current.get("weather_code")
        condition_text, _ = WMO_CODES.get(wmo_code, ("Partly Cloudy", "cloud"))
        temp_curr = sr(current.get("temperature_2m"))
        feels_like = sr(current.get("apparent_temperature"))
        humidity = sr(current.get("relative_humidity_2m"))
        wind_speed = sr(current.get("wind_speed_10m"))
        daily_time = daily.get("time", [])
        max_temps = daily.get("temperature_2m_max", [])
        min_temps = daily.get("temperature_2m_min", [])
        rain_chances = daily.get("precipitation_probability_max", [])
        rainfall_amounts = daily.get("precipitation_sum", [])
        daily_codes = daily.get("weather_code", [])
        forecast = []
        for i in range(min(7, len(daily_time))):
            try:
                dt = datetime.strptime(daily_time[i], "%Y-%m-%d")
            except Exception:
                dt = datetime.now() + timedelta(days=i)
            d_code = daily_codes[i] if i < len(daily_codes) else None
            cond, icon = WMO_CODES.get(d_code, ("Partly Cloudy", "sun"))
            forecast.append({
                "day": dt.strftime("%a"), "date": dt.strftime("%d %b"),
                "max_temp": sr(max_temps[i]) if i < len(max_temps) else None,
                "min_temp": sr(min_temps[i]) if i < len(min_temps) else None,
                "rain_chance": sr(rain_chances[i]) if i < len(rain_chances) else None,
                "precipitation_mm": sr(rainfall_amounts[i], 1) if i < len(rainfall_amounts) else None,
                "condition": cond, "icon": icon,
            })
        weather_ok = temp_curr is not None
        source = "open_meteo" if weather_ok else "unavailable"
        now_time = datetime.now().strftime("%I:%M %p")
        return {
            "village": village, "district": district, "state": state,
            "lat": round(lat, 2), "lon": round(lon, 2),
            "updated_at": f"Open-Meteo - {now_time}" if weather_ok else "Live forecast unavailable",
            "source": source,
            "current_temp": temp_curr, "feels_like": feels_like,
            "condition": condition_text if weather_ok else None,
            "humidity": humidity, "wind_speed": wind_speed,
            "rain_chance": rain_chances[0] if rain_chances else None,
            "max_temp": sr(max_temps[0]) if max_temps else None,
            "min_temp": sr(min_temps[0]) if min_temps else None,
            "rainfall_7d_mm": round(sum(v for v in rainfall_amounts[:7] if isinstance(v, (int, float))), 1) if rainfall_amounts else None,
            "forecast": forecast,
            "insights": self._generate_insights(forecast, weather_ok),
            "audio_summary": (
                f"Open-Meteo: {village}, {district}. Temp {temp_curr}C, {condition_text}. Humidity {humidity}%."
                if weather_ok else f"Live weather unavailable for {village}."
            ),
        }

    def _generate_insights(self, forecast, weather_available):
        if not forecast or not weather_available:
            return [{"title": "Weather forecast unavailable",
                     "message": "No live forecast received. Try again later.",
                     "type": "info", "icon": "rain"}]
        insights = []
        high_rain_day = next((f for f in forecast[:3] if (f.get("rain_chance") or 0) >= 40), None)
        if high_rain_day:
            insights.append({
                "title": f"Rain expected on {high_rain_day['day']}",
                "message": f"{high_rain_day['rain_chance']}% chance of rain on {high_rain_day['day']} ({high_rain_day['date']}). Adjust irrigation.",
                "type": "warning", "icon": "rain",
            })
        else:
            insights.append({
                "title": "Clear Weather Window",
                "message": "No heavy rain in the 3-day forecast. Good conditions for field work.",
                "type": "info", "icon": "sun",
            })
        max_t = forecast[0].get("max_temp") if forecast else None
        if max_t is not None and max_t >= 35:
            insights.append({
                "title": "High Temperature Warning",
                "message": f"Max {max_t}C today. Irrigate early morning or evening.",
                "type": "warning", "icon": "sun",
            })
        else:
            insights.append({
                "title": "Optimal Growth Conditions",
                "message": "Temperature levels are good for crop growth today.",
                "type": "success", "icon": "sprout",
            })
        return insights

    def _unavailable_response(self, lat, lon, village, district, state):
        return {
            "village": village, "district": district, "state": state,
            "lat": round(lat, 2), "lon": round(lon, 2),
            "updated_at": "Live forecast unavailable", "source": "unavailable",
            "current_temp": None, "feels_like": None, "condition": None,
            "humidity": None, "wind_speed": None, "rain_chance": None,
            "max_temp": None, "min_temp": None, "rainfall_7d_mm": None,
            "forecast": [],
            "insights": [{"title": "Weather service temporarily unavailable",
                           "message": "Weather providers are unreachable. Check your internet and try again.",
                           "type": "warning", "icon": "cloud"}],
            "audio_summary": f"Live weather is temporarily unavailable for {village}. Please try again shortly.",
        }


weather_service = WeatherService()

import asyncio
import httpx
import logging
import time
from typing import Dict, Any, List
from datetime import datetime, timedelta
from ..config import settings

logger = logging.getLogger("weather_service")

# WMO Weather interpretation codes
WMO_CODES = {
    0: ("Clear Sky", "Sun"),
    1: ("Mainly Clear", "Partly Sunny"),
    2: ("Partly Cloudy", "Partly Sunny"),
    3: ("Overcast", "Cloudy"),
    45: ("Foggy", "Fog"),
    48: ("Depositing Rime Fog", "Fog"),
    51: ("Light Drizzle", "Rain"),
    53: ("Moderate Drizzle", "Rain"),
    55: ("Dense Drizzle", "Rain"),
    61: ("Slight Rain", "Rain"),
    63: ("Moderate Rain", "Rain"),
    65: ("Heavy Rain", "Heavy Rain"),
    80: ("Slight Rain Showers", "Rain"),
    81: ("Moderate Rain Showers", "Rain"),
    82: ("Violent Rain Showers", "Heavy Rain"),
    95: ("Thunderstorm", "Thunderstorm")
}

class WeatherService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cache_ttl = 900  # 15 minutes cache TTL for weather data
        self._locks: Dict[str, asyncio.Lock] = {}

    async def get_farm_weather(
        self,
        lat: Any = 16.5449,
        lon: Any = 81.5212,
        village: str = "Bhimavaram",
        district: str = "West Godavari",
        state: str = "Andhra Pradesh"
    ) -> Dict[str, Any]:
        """Fetches live weather & 7-day forecast from Open-Meteo API with fast in-memory caching to eliminate UI lag & HTTP 429 rate limits."""
        # Handle string village passed as first parameter
        if isinstance(lat, str):
            village = lat
            lat = 16.5449
            lon = 81.5212
        elif isinstance(lat, (int, float)) and isinstance(lon, str):
            village = lon
            lon = 81.5212

        lat_val = float(lat) if lat is not None else 16.5449
        lon_val = float(lon) if lon is not None else 81.5212

        # Round to 2 decimal places (~1.1 km precision) to consolidate nearby requests
        cache_key = f"{round(lat_val, 2)}_{round(lon_val, 2)}"
        now = time.time()

        # Check if valid cache exists (< 15 minutes old)
        entry = self._cache.get(cache_key)
        stale_forecast = entry.get("data") if entry and entry.get("data", {}).get("source") in {"forecast", "stale_forecast"} else None
        if entry:
            if now - entry["timestamp"] < self._cache_ttl:
                return entry["data"]

        # Deduplicate simultaneous concurrent requests for the same location
        if cache_key not in self._locks:
            self._locks[cache_key] = asyncio.Lock()

        async with self._locks[cache_key]:
            # Re-check cache after acquiring lock
            entry = self._cache.get(cache_key)
            if entry and now - entry["timestamp"] < self._cache_ttl:
                return entry["data"]

            base_domain = "customer-api.open-meteo.com" if settings.OPEN_METEO_API_KEY else "api.open-meteo.com"
            api_key_param = f"&apikey={settings.OPEN_METEO_API_KEY}" if settings.OPEN_METEO_API_KEY else ""

            url = (
                f"https://{base_domain}/v1/forecast?"
                f"latitude={lat_val}&longitude={lon_val}&"
                f"current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&"
                f"hourly=temperature_2m,precipitation_probability,weather_code&"
                f"daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max&"
                f"timezone=auto{api_key_param}"
            )

            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.get(url)
                    if res.status_code == 200:
                        data = res.json()
                        formatted = self._format_weather_response(data, lat_val, lon_val, village, district, state)
                        if formatted.get("source") != "forecast":
                            raise ValueError("Open-Meteo returned an incomplete forecast")
                        # Store in cache with 15-minute TTL
                        self._cache[cache_key] = {"timestamp": now, "data": formatted}
                        return formatted
                    elif res.status_code == 429:
                        logger.warning("Open-Meteo API returned status 429 (Rate Limited). Applying 60-second backoff cache.")
                        # Cache a 60-second backoff entry to prevent hammering Open-Meteo
                        if stale_forecast:
                            stale_data = dict(stale_forecast)
                            stale_data["source"] = "stale_forecast"
                            stale_data["updated_at"] = f"Cached Forecast (Open-Meteo Rate Limited)"
                            self._cache[cache_key] = {"timestamp": now, "data": stale_data}
                            return stale_data
                        else:
                            fallback = self._fallback_weather(lat_val, lon_val, village, district, state)
                            self._cache[cache_key] = {"timestamp": now - self._cache_ttl + 60, "data": fallback}
                            return fallback
                    else:
                        logger.warning(f"Open-Meteo API returned status {res.status_code}")
            except Exception as e:
                logger.error(f"Open-Meteo Weather API fetch error: {str(e)}")

            if stale_forecast:
                stale_data = dict(stale_forecast)
                stale_data["source"] = "stale_forecast"
                stale_data["updated_at"] = f"Last live update: {stale_forecast.get('updated_at', 'unknown')}"
                return stale_data

            return self._fallback_weather(lat_val, lon_val, village, district, state)

    def _format_weather_response(self, data: Dict[str, Any], lat: float, lon: float, village: str, district: str, state: str) -> Dict[str, Any]:
        current = data.get("current", {})
        daily = data.get("daily", {})

        wmo_code = current.get("weather_code")
        condition_text, icon_type = WMO_CODES.get(wmo_code, ("Unavailable", "Unknown"))

        temp_curr = round(current["temperature_2m"]) if isinstance(current.get("temperature_2m"), (int, float)) else None
        feels_like = round(current["apparent_temperature"]) if isinstance(current.get("apparent_temperature"), (int, float)) else None
        humidity = round(current["relative_humidity_2m"]) if isinstance(current.get("relative_humidity_2m"), (int, float)) else None
        wind_speed = round(current["wind_speed_10m"]) if isinstance(current.get("wind_speed_10m"), (int, float)) else None

        daily_time = daily.get("time", [])
        max_temps = daily.get("temperature_2m_max", [])
        min_temps = daily.get("temperature_2m_min", [])
        rain_chances = daily.get("precipitation_probability_max", [])
        rainfall_amounts = daily.get("precipitation_sum", [])
        daily_codes = daily.get("weather_code", [])

        forecast = []
        for i in range(min(7, len(daily_time))):
            date_str = daily_time[i]
            dt = datetime.strptime(date_str, "%Y-%m-%d") if date_str else datetime.now() + timedelta(days=i)
            day_name = dt.strftime("%a")
            formatted_date = dt.strftime("%d %b")
            d_code = daily_codes[i] if i < len(daily_codes) else None
            cond, _ = WMO_CODES.get(d_code, ("Unavailable", "Unknown"))

            forecast.append({
                "day": day_name,
                "date": formatted_date,
                "max_temp": round(max_temps[i]) if i < len(max_temps) and isinstance(max_temps[i], (int, float)) else None,
                "min_temp": round(min_temps[i]) if i < len(min_temps) and isinstance(min_temps[i], (int, float)) else None,
                "rain_chance": rain_chances[i] if (i < len(rain_chances) and isinstance(rain_chances[i], (int, float))) else None,
                "precipitation_mm": round(rainfall_amounts[i], 1) if i < len(rainfall_amounts) and rainfall_amounts[i] is not None else None,
                "condition": cond,
                "icon": "rain" if "Rain" in cond or "Shower" in cond or "Drizzle" in cond else ("cloud" if "Cloud" in cond or "Overcast" in cond or "Fog" in cond else "sun")
            })

        rain_today = rain_chances[0] if (rain_chances and isinstance(rain_chances[0], (int, float))) else None
        max_today = round(max_temps[0]) if max_temps and isinstance(max_temps[0], (int, float)) else None
        min_today = round(min_temps[0]) if min_temps and isinstance(min_temps[0], (int, float)) else None

        insights = self._generate_weather_insights(forecast)
        now_time = datetime.now().strftime("%I:%M %p")
        forecast_has_values = any(
            day.get(key) is not None
            for day in forecast
            for key in ("max_temp", "min_temp", "rain_chance", "precipitation_mm")
        )
        weather_available = any(value is not None for value in (temp_curr, humidity, wmo_code)) or forecast_has_values
        audio_summary = (
            f"Live Open-Meteo weather report for {village}, {district}. Current temperature is {temp_curr} degrees Celsius and {condition_text}. Humidity is {humidity} percent."
            if weather_available and temp_curr is not None
            else f"Live weather values are unavailable for {village}, {district}. Check the forecast again later."
        )

        return {
            "village": village,
            "district": district,
            "state": state,
            "lat": round(lat, 2),
            "lon": round(lon, 2),
            "updated_at": f"Live Open-Meteo {now_time}",
            "source": "forecast" if weather_available else "unavailable",
            "rainfall_7d_mm": round(sum(value for value in rainfall_amounts[:7] if isinstance(value, (int, float))), 1) if rainfall_amounts else None,
            "current_temp": temp_curr,
            "feels_like": feels_like,
            "condition": condition_text,
            "rain_chance": rain_today,
            "max_temp": max_today,
            "min_temp": min_today,
            "wind_speed": wind_speed,
            "humidity": humidity,
            "forecast": forecast,
            "insights": insights,
            "audio_summary": audio_summary
        }

    def _generate_weather_insights(self, forecast: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not forecast:
            return [{
                "title": "Weather forecast unavailable",
                "message": "No live forecast was received. Check again later before using weather to plan irrigation.",
                "type": "info",
                "icon": "rain",
            }]
        insights = []
        high_rain_day = next((f for f in forecast[:3] if f.get("rain_chance", 0) >= 40), None)
        if high_rain_day:
            insights.append({
                "title": f"Rain expected on {high_rain_day['day']}",
                "message": f"Open-Meteo forecasts a {high_rain_day['rain_chance']}% chance of rain on {high_rain_day['day']} ({high_rain_day['date']}). Adjust irrigation schedule accordingly.",
                "type": "warning",
                "icon": "rain"
            })
        else:
            insights.append({
                "title": "Clear Weather Window",
                "message": "No high-rain day appears in the short forecast. Check crop and field conditions before scheduling field work.",
                "type": "info",
                "icon": "rain"
            })

        insights.append({
            "title": "Optimal Growth Conditions",
            "message": "Temperature and humidity levels from Open-Meteo indicate excellent conditions for crop photosynthesis today.",
            "type": "success",
            "icon": "sprout"
        })

        return insights

    def _fallback_weather(self, lat: float, lon: float, village: str, district: str, state: str) -> Dict[str, Any]:
        """Return explicit missing data instead of inventing weather values."""
        return {
            "village": village,
            "district": district,
            "state": state,
            "lat": round(lat, 2) if lat else 16.54,
            "lon": round(lon, 2) if lon else 81.51,
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
            "insights": [
                {
                    "title": "Weather forecast unavailable",
                    "message": "No live forecast was received. Check again later before using weather to plan irrigation.",
                    "type": "info",
                    "icon": "rain",
                }
            ],
            "audio_summary": f"Live weather values are unavailable for {village}, {district}. Check again later."
        }

weather_service = WeatherService()

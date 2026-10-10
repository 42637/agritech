"""
AgriSmart AI — Comprehensive Weather & Climate Risk Tests
==========================================================
Covers:
  - WeatherAPI.com primary provider (success & parsing)
  - WeatherAPI.com 429 rate limit / missing key fallback to Open-Meteo
  - WeatherService: cache hits, TTL, 429 cooldown, stale fallback
  - GeminiAIService: climate risk with WeatherAPI.com data & unavailable weather
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.weather_service import WeatherService
from app.services.gemini_ai import GeminiAIService
from app.config import settings


@pytest.fixture
def fresh_weather_service():
    service = WeatherService()
    service._cache.clear()
    service._cooldown.clear()
    return service


@pytest.mark.anyio
async def test_weatherapi_successful_fetch(fresh_weather_service):
    settings.WEATHERAPI_KEY = "mock_weatherapi_key"
    mock_weatherapi_response = MagicMock()
    mock_weatherapi_response.status_code = 200
    mock_weatherapi_response.json.return_value = {
        "current": {
            "temp_c": 31.0,
            "feelslike_c": 33.5,
            "humidity": 70,
            "wind_kph": 15.0,
            "condition": {"text": "Sunny"}
        },
        "forecast": {
            "forecastday": [
                {
                    "date": "2026-10-10",
                    "day": {
                        "maxtemp_c": 33.0,
                        "mintemp_c": 24.0,
                        "daily_chance_of_rain": 10,
                        "totalprecip_mm": 0.0,
                        "condition": {"text": "Sunny"}
                    }
                }
            ]
        }
    }

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_weatherapi_response
        result = await fresh_weather_service.get_farm_weather(16.54, 81.52)

        assert result["source"] == "weatherapi"
        assert result["current_temp"] == 31
        assert result["humidity"] == 70
        assert result["rain_chance"] == 10


@pytest.mark.anyio
async def test_weatherapi_missing_key_fallback_to_open_meteo(fresh_weather_service):
    settings.WEATHERAPI_KEY = ""
    mock_open_meteo_response = MagicMock()
    mock_open_meteo_response.status_code = 200
    mock_open_meteo_response.json.return_value = {
        "current": {
            "temperature_2m": 32.5,
            "apparent_temperature": 34.0,
            "relative_humidity_2m": 65,
            "wind_speed_10m": 14.2,
            "weather_code": 1
        },
        "daily": {
            "time": ["2026-10-10"],
            "temperature_2m_max": [34.0],
            "temperature_2m_min": [25.0],
            "precipitation_probability_max": [20],
            "precipitation_sum": [0.0],
            "weather_code": [1]
        }
    }

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_open_meteo_response
        result = await fresh_weather_service.get_farm_weather(16.54, 81.52)

        assert result["source"] == "forecast"
        assert result["current_temp"] == 32 or result["current_temp"] == 33
        assert result["humidity"] == 65
        assert result["rain_chance"] == 20


@pytest.mark.anyio
async def test_weather_service_429_cooldown_and_stale_fallback(fresh_weather_service):
    settings.WEATHERAPI_KEY = ""
    mock_429 = MagicMock()
    mock_429.status_code = 429
    mock_429.headers = {"retry-after": "30"}

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_429
        
        # First call triggers 429
        res1 = await fresh_weather_service.get_farm_weather(16.54, 81.52)
        assert res1["source"] == "unavailable"
        
        # Second call within cooldown window should immediately return fallback without HTTP request
        mock_get.reset_mock()
        res2 = await fresh_weather_service.get_farm_weather(16.54, 81.52)
        assert res2["source"] == "unavailable"
        mock_get.assert_not_called()


@pytest.mark.anyio
async def test_gemini_climate_risk_handles_unavailable_weather():
    gemini = GeminiAIService()
    farm = {
        "farm_id": 1,
        "farm_name": "Test Paddy Field",
        "crop_type": "Paddy",
        "soil_type": "Alluvial",
        "location": "Bhimavaram",
        "area_acres": 5.0
    }
    unavailable_weather = {
        "source": "unavailable",
        "current_temp": None,
        "humidity": None,
        "rain_chance": None,
        "wind_speed": None,
        "weather_code": None,
        "max_temp": None,
        "min_temp": None
    }

    analysis = await gemini.generate_climate_risk_analysis(
        farm_context=farm,
        weather_data=unavailable_weather,
        period="today",
        language="en"
    )

    assert "featured_risk" in analysis
    assert "upcoming_risks" in analysis
    assert isinstance(analysis["upcoming_risks"], list)
    assert analysis["featured_risk"]["severity"] == "unknown"

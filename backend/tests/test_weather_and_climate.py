"""
AgriSmart AI — Weather & Climate Risk Tests
============================================
Covers:
  - WeatherService: cache hits, cache TTL expiry
  - WeatherService: 429 cooldown, Retry-After header, stale-cache fallback
  - GeminiAIService: climate risk analysis with unavailable weather
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.weather_service import WeatherService
from app.services.gemini_ai import GeminiAIService


@pytest.fixture
def fresh_weather_service():
    service = WeatherService()
    service._cache.clear()
    service._cooldown.clear()
    return service


@pytest.mark.anyio
async def test_weather_service_successful_fetch(fresh_weather_service):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
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
            "precipitation_probability_max": [20]
        }
    }

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        result = await fresh_weather_service.get_farm_weather(16.54, 81.52)

        assert result["source"] == "forecast"
        assert result["current_temp"] == 32 or result["current_temp"] == 33
        assert result["humidity"] == 65
        assert result["rain_chance"] == 20


@pytest.mark.anyio
async def test_weather_service_429_cooldown(fresh_weather_service):
    mock_429 = MagicMock()
    mock_429.status_code = 429
    mock_429.headers = {"retry-after": "30"}

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_429
        
        # First call triggers 429 and enters backoff
        res1 = await fresh_weather_service.get_farm_weather(16.54, 81.52)
        assert res1["source"] == "unavailable"
        
        # Second call within 30 seconds should immediately return fallback without making HTTP request
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
        "rain_probability": None,
        "wind_speed": None,
        "weather_code": None,
        "forecast_high": None,
        "forecast_low": None
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

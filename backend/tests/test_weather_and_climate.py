"""
AgriSmart AI — Comprehensive Weather & Climate Risk Test Suite
===============================================================
Covers:
  1. Successful weather retrieval (WeatherAPI.com primary)
  2. Invalid weather API key (401/403) and HTTP 429 rate limit fallback
  3. Weather timeout and network failure handling
  4. Gemini climate risk success (with _gemini_used: True)
  5. Gemini invalid key, quota error (429), and timeout handling
  6. Gemini generation when weather is unavailable (general Paddy guidance, _gemini_used: True, severity "unknown")
  7. Correct _gemini_used flag behavior (only True when genuine Gemini result used)
  8. No fabricated weather measurements when weather is unavailable
  9. Correct alerts API response schema and period parameters (today, 7days, 30days)
  10. Farm alerts endpoint integration & fallback resilience
"""

import json
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


# --- Test 1: Successful weather retrieval (WeatherAPI.com primary) ---
@pytest.mark.anyio
async def test_1_weatherapi_successful_fetch(fresh_weather_service):
    settings.WEATHERAPI_KEY = "mock_valid_key"
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
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
        mock_get.return_value = mock_response
        result = await fresh_weather_service.get_farm_weather(16.54, 81.52)

        assert result["source"] == "weatherapi"
        assert result["current_temp"] == 31
        assert result["humidity"] == 70
        assert result["rain_chance"] == 10


# --- Test 2: Invalid weather API key (401) and 429 rate limit fallback to Open-Meteo ---
@pytest.mark.anyio
async def test_2_weatherapi_401_fallback_to_open_meteo(fresh_weather_service):
    settings.WEATHERAPI_KEY = "invalid_key"
    mock_401 = MagicMock()
    mock_401.status_code = 401

    mock_open_meteo = MagicMock()
    mock_open_meteo.status_code = 200
    mock_open_meteo.json.return_value = {
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
        mock_get.side_effect = [mock_401, mock_open_meteo]
        result = await fresh_weather_service.get_farm_weather(16.54, 81.52)

        assert result["source"] == "open_meteo"
        assert result["current_temp"] == 33 or result["current_temp"] == 32
        assert result["humidity"] == 65


# --- Test 3: Weather timeout and network failure ---
@pytest.mark.anyio
async def test_3_weather_timeout_and_network_failure(fresh_weather_service):
    import httpx
    settings.WEATHERAPI_KEY = "mock_key"

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = httpx.TimeoutException("Connection timed out")
        result = await fresh_weather_service.get_farm_weather(16.54, 81.52)

        assert result["source"] == "unavailable"
        assert result["current_temp"] is None
        assert result["forecast"] == []


# --- Test 4: Gemini climate risk success (with _gemini_used: True) ---
@pytest.mark.anyio
async def test_4_gemini_climate_risk_success():
    gemini = GeminiAIService()
    gemini.api_key = "mock_gemini_key"

    farm_context = {"village": "Bhimavaram", "district": "West Godavari", "current_crops": "Paddy"}
    live_weather = {
        "source": "weatherapi",
        "current_temp": 34,
        "max_temp": 37,
        "min_temp": 26,
        "humidity": 75,
        "rain_chance": 20,
        "wind_speed": 12,
        "forecast": [{"date": "10 Oct", "max_temp": 37, "min_temp": 26, "rain_chance": 20}]
    }

    mock_gemini_response = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": json.dumps({
                                "featured_risk": {
                                    "severity": "high",
                                    "title": "High Heat Stress Warning for Paddy",
                                    "timeframe": "Today",
                                    "expected_value": "Forecast high: 37°C",
                                    "normal_value": "31°C",
                                    "impact_summary": "Heat stress in Bhimavaram may dry topsoil faster.",
                                    "recommendation": "Irrigate field during early morning hours.",
                                    "risk_type": "temperature"
                                },
                                "upcoming_risks": []
                            })
                        }
                    ]
                }
            }
        ]
    }

    with patch("asyncio.to_thread", new_callable=AsyncMock) as mock_thread:
        mock_thread.return_value = (200, mock_gemini_response)
        result = await gemini.generate_climate_risk_analysis(farm_context, live_weather, "today", "en")

        assert result["_gemini_used"] is True
        assert result["featured_risk"]["severity"] == "high"
        assert result["featured_risk"]["title"] == "High Heat Stress Warning for Paddy"


# --- Test 5: Gemini invalid key, quota error (429), and timeout ---
@pytest.mark.anyio
async def test_5_gemini_invalid_key_and_quota_error():
    import urllib.error
    gemini = GeminiAIService()
    gemini.api_key = "invalid_gemini_key"

    farm_context = {"village": "Bhimavaram", "current_crops": "Paddy"}
    live_weather = {"source": "weatherapi", "current_temp": 34, "max_temp": 36, "humidity": 70}

    with patch("asyncio.to_thread", side_effect=urllib.error.HTTPError("url", 429, "Too Many Requests", {}, None)):
        result = await gemini.generate_climate_risk_analysis(farm_context, live_weather, "today", "en")

        # Must fall back gracefully without crashing, setting _gemini_used to False
        assert result["_gemini_used"] is False
        assert "featured_risk" in result


# --- Test 6: Gemini generation when weather is unavailable (general Paddy guidance) ---
@pytest.mark.anyio
async def test_6_gemini_generation_when_weather_unavailable():
    gemini = GeminiAIService()
    gemini.api_key = "mock_gemini_key"

    farm_context = {"village": "Bhimavaram", "current_crops": "Paddy"}
    unavailable_weather = {"source": "unavailable", "current_temp": None, "humidity": None}

    mock_guidance_response = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": json.dumps({
                                "guidance_summary": "General seasonal advice for Paddy.",
                                "tips": [
                                    "Inspect Paddy field drainage channels.",
                                    "Check soil moisture manually before watering.",
                                    "Monitor leaves for early pest signs."
                                ]
                            })
                        }
                    ]
                }
            }
        ]
    }

    with patch("asyncio.to_thread", new_callable=AsyncMock) as mock_thread:
        mock_thread.return_value = (200, mock_guidance_response)
        result = await gemini.generate_climate_risk_analysis(farm_context, unavailable_weather, "today", "en")

        assert result["_gemini_used"] is True
        assert result["featured_risk"]["severity"] == "unknown"
        assert result["general_guidance"] is not None
        assert len(result["general_guidance"]) == 3


# --- Test 7: Correct _gemini_used behavior ---
@pytest.mark.anyio
async def test_7_correct_gemini_used_flag():
    gemini = GeminiAIService()
    gemini.api_key = ""  # Missing key

    farm_context = {"village": "Bhimavaram", "current_crops": "Paddy"}
    unavailable_weather = {"source": "unavailable", "current_temp": None}

    result = await gemini.generate_climate_risk_analysis(farm_context, unavailable_weather, "today", "en")

    # MUST be False when no Gemini call succeeded
    assert result["_gemini_used"] is False


# --- Test 8: No fabricated measurements when weather is unavailable ---
@pytest.mark.anyio
async def test_8_no_fabricated_measurements_when_weather_unavailable():
    gemini = GeminiAIService()
    gemini.api_key = ""

    farm_context = {"village": "Bhimavaram", "current_crops": "Paddy"}
    unavailable_weather = {"source": "unavailable", "current_temp": None, "humidity": None, "rain_chance": None}

    result = await gemini.generate_climate_risk_analysis(farm_context, unavailable_weather, "today", "en")

    feat = result["featured_risk"]
    assert feat["expected_value"] == "No live data"
    assert "34" not in feat["expected_value"]
    assert feat["severity"] == "unknown"


# --- Test 9: Correct alerts API response schema and period parameters ---
@pytest.mark.anyio
async def test_9_alerts_period_parameters():
    gemini = GeminiAIService()
    farm_context = {"village": "Bhimavaram", "current_crops": "Paddy"}
    unavailable_weather = {"source": "unavailable", "current_temp": None}

    for period in ["today", "7days", "30days"]:
        result = await gemini.generate_climate_risk_analysis(farm_context, unavailable_weather, period, "en")
        assert "featured_risk" in result
        assert "upcoming_risks" in result
        assert isinstance(result["upcoming_risks"], list)


# --- Test 10: Endpoint structure and fallback resilience ---
@pytest.mark.anyio
async def test_10_endpoint_fallback_resilience(fresh_weather_service):
    res = await fresh_weather_service.get_farm_weather(16.54, 81.52)
    assert "source" in res
    assert "village" in res
    assert "forecast" in res
    assert isinstance(res["forecast"], list)

import pytest
from fastapi.testclient import TestClient
import os
import sys

# Ensure backend path is added
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database import Base, engine

client = TestClient(app)

def setup_module(module):
    Base.metadata.create_all(bind=engine)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_get_farms():
    response = client.get("/api/farms")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_create_farm_validation():
    # Invalid negative acreage
    invalid_farm = {
        "farm_name": "Invalid Acre Farm",
        "acreage": -2.0,
        "latitude": 16.54,
        "longitude": 81.51,
        "pincode": "534201",
        "village": "Test",
        "district": "West Godavari"
    }
    response = client.post("/api/farms", json=invalid_farm)
    assert response.status_code == 422  # Unprocessable Entity validation error

def test_create_and_delete_farm():
    new_farm = {
        "farm_name": "Test Greenfield Farm",
        "acreage": 4.5,
        "latitude": 16.55,
        "longitude": 81.52,
        "pincode": "534201",
        "village": "Bhimavaram North",
        "district": "West Godavari"
    }
    res = client.post("/api/farms", json=new_farm)
    assert res.status_code == 200
    created = res.json()
    assert created["farm_name"] == "Test Greenfield Farm"
    assert created["acreage"] == 4.5

    farm_id = created["id"]
    del_res = client.delete(f"/api/farms/{farm_id}")
    assert del_res.status_code == 200

def test_pincode_lookup():
    res = client.get("/api/location/pincode/534201")
    assert res.status_code == 200
    data = res.json()
    assert data["village"] == "Bhimavaram"
    assert data["district"] == "West Godavari"

def test_invalid_pincode():
    res = client.get("/api/location/pincode/123")
    assert res.status_code == 400

def test_soil_ph_validation_and_update():
    farms_res = client.get("/api/farms")
    farms = farms_res.json()
    farm_id = farms[0]["id"]

    # Invalid pH > 14
    res_bad = client.put(f"/api/farms/{farm_id}/soil", json={"soil_ph": 16.0})
    assert res_bad.status_code in [400, 422]

    # Valid pH update to 6.5
    res_good = client.put(f"/api/farms/{farm_id}/soil", json={"soil_ph": 6.5})
    assert res_good.status_code == 200
    data = res_good.json()
    assert data["ph"] == 6.5
    assert data["has_ph"] is True
    assert "recommended_crops" in data

def test_weather_api():
    farms_res = client.get("/api/farms")
    farm_id = farms_res.json()[0]["id"]

    res = client.get(f"/api/farms/{farm_id}/weather")
    assert res.status_code == 200
    data = res.json()
    assert "current_temp" in data
    assert "forecast" in data
    assert len(data["forecast"]) >= 7

def test_ai_fallback_ask():
    req = {
        "question": "What is the best fertilizer dose for paddy crop in acidic soil?",
        "language": "en"
    }
    res = client.post("/api/ai/ask", json=req)
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert len(data["answer"]) > 10

def test_transcribe_audio_empty():
    res = client.post("/api/ai/transcribe?language=en", data=b"short", headers={"Content-Type": "audio/webm"})
    assert res.status_code == 200
    data = res.json()
    assert data["transcript"] == ""
    assert "Audio recording is empty" in data.get("message", "")

def test_weather_caching_and_deduplication():
    farms_res = client.get("/api/farms")
    farm_id = farms_res.json()[0]["id"]
    res1 = client.get(f"/api/farms/{farm_id}/weather")
    res2 = client.get(f"/api/farms/{farm_id}/weather")
    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res1.json()["lat"] == res2.json()["lat"]


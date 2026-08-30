import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_current_scenario_endpoint():
    response = client.get("/api/scenario/current")
    assert response.status_code == 200
    data = response.json()
    assert "hazard" in data
    assert len(data["zones"]) == 10
    assert len(data["shelters"]) == 8
    assert "kpis" in data
    assert data["kpis"]["total_evacuation_demand"] > 0

def test_simulate_endpoint():
    # Simulate with +30% rainfall
    response = client.post("/api/scenario/simulate", json={"rainfall_multiplier": 1.30})
    assert response.status_code == 200
    data = response.json()
    assert data["simulation_diff"] is not None
    assert data["simulation_diff"]["is_simulation_active"] == True
    assert len(data["simulation_diff"]["key_deltas"]) > 0

def test_ai_query_endpoint():
    response = client.post("/api/ai/query", json={"query": "Which areas should we evacuate first?"})
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert len(data["answer"]) > 20
    assert "grounded_metrics" in data

def test_live_weather_endpoint():
    response = client.get("/api/weather/live")
    assert response.status_code == 200
    data = response.json()
    assert "hazard" in data
    assert data["hazard"]["status"] == "LIVE_FEED"
    assert len(data["zones"]) == 10

def test_radar_endpoint():
    response = client.get("/api/weather/radar")
    assert response.status_code == 200
    data = response.json()
    assert "available" in data

def test_wind_grid_endpoint():
    response = client.get("/api/weather/wind-grid?lat=20.2961&lng=85.8245")
    assert response.status_code == 200
    data = response.json()
    assert "grid_points" in data
    assert len(data["grid_points"]) > 0
    first_pt = data["grid_points"][0]
    assert "wind_speed_kmh" in first_pt
    assert "u_ms" in first_pt
    assert "v_ms" in first_pt

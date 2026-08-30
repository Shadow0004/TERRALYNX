"""
FastAPI REST API Endpoints Router for TerraLynx.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from backend.app.models.scenario import (
    DistrictState,
    SimulationOverrides,
    AIQueryRequest,
    AIQueryResponse
)
from backend.app.models.geography import Zone
from backend.app.models.infrastructure import Shelter, RoadSegment
from backend.app.models.response import (
    EvacuationRoute,
    ResourceDeploymentItem,
    EmergencyAlert
)
from backend.app.services.scenario_service import ScenarioService
from backend.app.services.ai_assistant import DecisionAIAssistant
from backend.app.services.weather_service import OpenMeteoService

router = APIRouter(prefix="/api")
scenario_service = ScenarioService()
ai_assistant = DecisionAIAssistant()
weather_service = OpenMeteoService()

# In-memory session state for active simulation
_current_state: DistrictState = scenario_service.run_pipeline()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TerraLynx Decision Intelligence API",
        "version": "1.0.0"
    }

@router.get("/scenario/current", response_model=DistrictState)
def get_current_scenario():
    """Returns the current operational district state."""
    global _current_state
    return _current_state

@router.post("/scenario/simulate", response_model=DistrictState)
def simulate_scenario(overrides: SimulationOverrides):
    """
    Executes a What-If simulation with specified parameter overrides
    and returns the recalculation with a differential impact comparison.
    """
    global _current_state
    _current_state = scenario_service.simulate_with_comparison(overrides)
    return _current_state

@router.post("/scenario/reset", response_model=DistrictState)
def reset_scenario():
    """Resets simulation to baseline state."""
    global _current_state
    _current_state = scenario_service.run_pipeline(SimulationOverrides())
    return _current_state

@router.get("/zones", response_model=List[Zone])
def list_zones():
    """Returns all 10 district zones with computed risk and exposure metrics."""
    global _current_state
    return _current_state.zones

@router.get("/zones/{zone_id}", response_model=Zone)
def get_zone(zone_id: str):
    """Returns detailed metrics and rationale for a specific zone."""
    global _current_state
    for z in _current_state.zones:
        if z.id == zone_id or z.code == zone_id:
            return z
    raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found.")

@router.get("/shelters", response_model=List[Shelter])
def list_shelters():
    """Returns all designated shelters with current occupancy and incoming allocation."""
    global _current_state
    return _current_state.shelters

@router.get("/routes", response_model=List[EvacuationRoute])
def list_routes():
    """Returns active and alternative evacuation routes."""
    global _current_state
    return _current_state.routes

@router.get("/resources", response_model=List[ResourceDeploymentItem])
def list_resources():
    """Returns required vs available resources and identified deficits."""
    global _current_state
    return _current_state.resources

@router.get("/alerts", response_model=List[EmergencyAlert])
def list_alerts():
    """Returns prioritized 4-tier emergency alerts."""
    global _current_state
    return _current_state.alerts

@router.post("/ai/query", response_model=AIQueryResponse)
def query_ai_assistant(request: AIQueryRequest):
    """
    Queries the grounded Operational AI Assistant (powered by Google Gemini) for decision intelligence and explanations.
    """
    global _current_state
    return ai_assistant.answer_query(
        query=request.query,
        state=_current_state,
        api_key=request.api_key,
        model_name=request.model_name
    )

@router.get("/weather/live", response_model=DistrictState)
async def get_live_weather_scenario(
    lat: float = 19.8135,
    lng: float = 85.8312,
    location: str = "Purva Coastal District (Puri Coast)"
):
    """
    Fetches real-time weather and dynamically generates administrative zones,
    shelters, road networks, and evacuation routes anywhere on Earth.
    """
    global _current_state
    telemetry_data = await weather_service.fetch_live_telemetry(lat=lat, lng=lng, location_name=location)
    live_hazard = telemetry_data["hazard_telemetry"]
    district_title = telemetry_data.get("location_name") or location

    # Generate dynamic district zones, roads, shelters, and routing for this coordinate
    await scenario_service.set_dynamic_district(
        lat=lat,
        lng=lng,
        district_name=district_title,
        hazard=live_hazard
    )
    _current_state = scenario_service.run_pipeline(SimulationOverrides())
    return _current_state

from pydantic import BaseModel

class RadarLayerResponse(BaseModel):
    available: bool
    timestamp: Optional[int] = None
    tile_url: Optional[str] = None
    attribution: str = ""

class PointTelemetryResponse(BaseModel):
    latitude: float
    longitude: float
    location_name: Optional[str] = "Coastal Sector"
    temperature_c: float
    humidity_percent: float
    rainfall_rate_mm_hr: float
    rain_24h_sum_mm: float
    wind_speed_kmh: float
    wind_gusts_kmh: float
    wind_direction_deg: float
    wind_direction_cardinal: str
    surface_pressure_hpa: float
    elevation_meters: float
    weather_description: str
    soil_saturation_percent: float
    point_risk_score: float
    risk_tier: str
    updated_at: str

@router.get("/weather/radar", response_model=RadarLayerResponse)
async def get_live_radar_tiles():
    """
    Fetches live RainViewer Doppler radar timestamp and tile template.
    """
    return await weather_service.fetch_radar_layer_info()

@router.get("/weather/point", response_model=PointTelemetryResponse)
async def inspect_live_point(
    lat: float = Query(..., description="Latitude of pinpoint"),
    lng: float = Query(..., description="Longitude of pinpoint")
):
    """
    Fetches localized real-time weather and computed flood risk for any clicked GPS coordinate on the map.
    """
    return await weather_service.fetch_point_telemetry(lat=lat, lng=lng)

@router.get("/weather/wind-grid")
async def get_regional_wind_grid(
    lat: float = Query(..., description="Latitude of center"),
    lng: float = Query(..., description="Longitude of center"),
    radius_deg: float = Query(0.30, description="Spatial radius in degrees")
):
    """
    Fetches real-time spatial atmospheric wind vector grid from Open-Meteo across the region.
    """
    return await weather_service.fetch_regional_wind_grid(center_lat=lat, center_lng=lng, radius_deg=radius_deg)


@router.get("/demographics/official")
async def get_official_demographics_endpoint(
    district: str = Query(..., description="District, city or area name"),
    lat: Optional[float] = Query(None, description="Optional center latitude"),
    lng: Optional[float] = Query(None, description="Optional center longitude")
):
    """
    Returns authentic government census, demographic vulnerability, housing vulnerability,
    and administrative breakdown metrics for the requested district or city.
    """
    from backend.app.services.census_service import get_official_census_data
    return get_official_census_data(district_query=district, lat=lat, lng=lng)



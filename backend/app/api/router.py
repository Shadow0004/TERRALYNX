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

router = APIRouter(prefix="/api")
scenario_service = ScenarioService()
ai_assistant = DecisionAIAssistant()

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
    Queries the grounded Operational AI Assistant for decision intelligence and explanations.
    """
    global _current_state
    return ai_assistant.answer_query(query=request.query, state=_current_state)

"""
Scenario Simulation and State Models.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from backend.app.models.hazard import HazardTelemetry
from backend.app.models.geography import Zone
from backend.app.models.infrastructure import Shelter, Hospital, RoadSegment, TemporaryShelterCandidate
from backend.app.models.response import (
    ShelterAllocationItem,
    EvacuationRoute,
    ResourceDeploymentItem,
    EmergencyAlert,
    OperationalKPIs
)

class SimulationOverrides(BaseModel):
    rainfall_multiplier: float = Field(default=1.0, ge=0.2, le=3.0, description="Multiplier on precipitation (e.g. 1.30 for +30%)")
    cyclone_wind_multiplier: float = Field(default=1.0, ge=0.5, le=2.0, description="Multiplier on sustained winds")
    storm_surge_multiplier: float = Field(default=1.0, ge=0.5, le=2.5, description="Multiplier on coastal surge height")
    landfall_eta_hours: Optional[float] = Field(default=None, ge=0.5, le=24.0, description="Override storm ETA")
    disabled_shelter_ids: List[str] = Field(default_factory=list, description="IDs of shelters taken offline")
    closed_road_ids: List[str] = Field(default_factory=list, description="IDs of roads manually marked blocked")
    available_buses_override: Optional[int] = Field(default=None, ge=0, le=200)
    available_boats_override: Optional[int] = Field(default=None, ge=0, le=100)
    available_teams_override: Optional[int] = Field(default=None, ge=0, le=100)
    available_rations_override: Optional[int] = Field(default=None, ge=0, le=200000)
    available_med_kits_override: Optional[int] = Field(default=None, ge=0, le=1000)
    available_generators_override: Optional[int] = Field(default=None, ge=0, le=100)
    activate_temp_shelters: bool = Field(default=False, description="Whether to automatically activate temporary emergency shelters")


class MetricDelta(BaseModel):
    metric_name: str
    baseline_value: float
    simulated_value: float
    delta_absolute: float
    delta_percentage: float
    trend: str # INCREASED, DECREASED, UNCHANGED
    severity_impact: str # NEGATIVE, POSITIVE, NEUTRAL

class SimulationComparisonDiff(BaseModel):
    is_simulation_active: bool
    summary: str
    key_deltas: List[MetricDelta]
    new_critical_zones: List[str]
    new_closed_roads: List[str]
    evacuees_reallocated_count: int
    temporary_shelters_needed: bool

class PriorityActionItem(BaseModel):
    id: str
    priority_rank: int
    category: str # EVACUATION, SHELTER, ROUTING, LOGISTICS, INFRASTRUCTURE
    title: str
    zone_id: Optional[str] = None
    target_name: str
    urgency: str # IMMEDIATE, HIGH, MEDIUM
    timeframe_mins: int
    rationale: str
    status: str = "PENDING" # PENDING, IN_PROGRESS, COMPLETED

class DistrictState(BaseModel):
    hazard: HazardTelemetry
    zones: List[Zone]
    shelters: List[Shelter]
    hospitals: List[Hospital]
    roads: List[RoadSegment]
    allocations: List[ShelterAllocationItem]
    routes: List[EvacuationRoute]
    resources: List[ResourceDeploymentItem]
    alerts: List[EmergencyAlert]
    priority_actions: List[PriorityActionItem]
    temporary_shelter_candidates: List[TemporaryShelterCandidate]
    kpis: OperationalKPIs
    official_census: Optional[Dict[str, Any]] = None
    simulation_diff: Optional[SimulationComparisonDiff] = None
    overrides_applied: SimulationOverrides = Field(default_factory=SimulationOverrides)

class AIQueryRequest(BaseModel):
    query: str
    include_context: bool = True
    api_key: Optional[str] = None
    model_name: Optional[str] = "gemini-2.5-flash"

class AIQueryResponse(BaseModel):
    query: str
    answer: str
    grounded_metrics: Dict[str, Any]
    relevant_zones: List[str]
    relevant_shelters: List[str]
    model_used: str = "Deterministic Engine"
    confidence_score: float = 0.98

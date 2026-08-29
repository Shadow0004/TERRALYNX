"""
Response Plans: Shelter Allocation, Evacuation Routes, Resources and Alerts.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from backend.app.models.hazard import Coordinates

class ShelterAllocationItem(BaseModel):
    zone_id: str
    zone_name: str
    shelter_id: str
    shelter_name: str
    allocated_count: int
    estimated_transit_time_mins: float
    recommended_route_id: str
    route_status: str

class EvacuationRoute(BaseModel):
    id: str
    from_zone_id: str
    from_zone_name: str
    to_shelter_id: str
    to_shelter_name: str
    path_coordinates: List[List[float]] # GeoJSON LineString
    total_distance_km: float
    estimated_travel_time_mins: float
    route_risk_level: str # LOW_RISK, MEDIUM_RISK, HIGH_RISK, UNUSABLE
    used_road_ids: List[str]
    unsafe_road_warnings: List[str] = []
    shortest_distance_km: Optional[float] = None
    route_selection_rationale: Optional[str] = None
    is_primary: bool = True
    alternative_to_route_id: Optional[str] = None

class ResourceDeploymentItem(BaseModel):
    resource_type: str # e.g. "Evacuation Buses (40 pax)", "Rescue Boats", "Ambulances"
    unit: str # "Vehicles", "Boats", "Teams", "Packs"
    required_count: int
    available_count: int
    shortfall_count: int
    is_critical_shortage: bool
    priority_deployment_zones: List[str]
    notes: str

class EmergencyAlert(BaseModel):
    id: str
    timestamp: str
    tier: str # CRITICAL, WARNING, WATCH, INFO
    title: str
    message: str
    target_zone_ids: List[str]
    action_required: str
    trigger_metric: str

class OperationalKPIs(BaseModel):
    active_threat_level: str # CATEGORY 3 CYCLONE
    overall_district_risk_score: float
    total_population_exposed: int
    total_evacuation_demand: int
    total_shelter_capacity: int
    total_current_occupancy: int
    total_incoming_allocated: int
    shelter_utilization_pct: float
    unsafe_roads_count: int
    total_roads_count: int
    critical_resource_shortfalls_count: int
    priority_actions_count: int

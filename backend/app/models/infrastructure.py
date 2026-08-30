"""
Infrastructure Models: Shelters, Hospitals, Roads, and Critical Facilities.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from backend.app.models.hazard import Coordinates

class Shelter(BaseModel):
    id: str # e.g. "SHELTER-01"
    name: str # e.g. "Govt Multipurpose Cyclone Shelter"
    type: str = "PRIMARY" # PRIMARY, SECONDARY, TEMPORARY_CANDIDATE
    zone_id: str
    location: Coordinates
    elevation_meters: float
    total_capacity: int
    current_occupancy: int = 0
    safety_score: float = Field(default=96.0, ge=0.0, le=100.0, description="Structural resilience rating")
    is_active: bool = True
    
    # Official Government Certification
    is_govt_verified: bool = True
    verification_agency: str = "OSDMA / NDMA Govt. Certified"
    facility_code: str = "OD-MCS-2024"
    structural_certification: str = "IS:875 Cat-5 Wind & Flood Reinforced Refuge"
    nodal_officer: str = "District Emergency Officer"
    
    has_backup_power: bool = True
    has_medical_station: bool = True
    water_capacity_liters: int = 40000
    food_supply_days: int = 7
    
    # Dynamic computed fields
    incoming_allocated_evacuees: int = 0
    projected_total_occupancy: int = 0
    remaining_capacity: int = 0
    utilization_percentage: float = 0.0
    is_overloaded: bool = False
    assigned_zone_ids: List[str] = []

class TemporaryShelterCandidate(BaseModel):
    id: str
    name: str
    address: str
    location: Coordinates
    elevation_meters: float
    potential_capacity: int
    suitability_score: float
    activation_readiness_hours: float
    distance_to_overflow_zones_km: float
    rationale: str
    is_govt_verified: bool = True
    verification_agency: str = "SDMA Standby Reserve"

class Hospital(BaseModel):
    id: str
    name: str
    zone_id: str
    location: Coordinates
    total_beds: int
    icu_beds: int
    available_beds: int
    elevation_meters: float
    has_backup_power: bool
    is_flood_threatened: bool = False
    ambulance_count: int = 4

class RoadSegment(BaseModel):
    id: str # e.g. "ROAD-14"
    name: str # e.g. "Coastal Highway Corridor North"
    from_zone_id: str
    to_zone_id: str
    distance_km: float
    typical_travel_time_mins: float
    elevation_min_meters: float
    drainage_quality: float = 5.0
    lanes: int = 2
    coordinates: List[List[float]] # [[lng, lat], ...] line string
    
    # Dynamic computed state
    is_closed_manual: bool = False
    is_flooded: bool = False
    flood_risk_score: float = 0.0
    estimated_time_to_impassable_mins: Optional[float] = None
    recommended_for_evacuation: bool = True
    status: str = "OPEN" # OPEN, CAUTION, FLOODED_CLOSED, MANUAL_CLOSED

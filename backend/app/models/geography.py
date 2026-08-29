"""
Administrative Geography and Zone Models.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from backend.app.models.hazard import Coordinates

class DemographicVulnerability(BaseModel):
    elderly_percent: float = Field(default=14.0, description="% of population aged > 60")
    children_percent: float = Field(default=18.0, description="% of population aged < 10")
    non_engineered_housing_percent: float = Field(default=35.0, description="% of kutcha / tin-roof / vulnerable structures")
    medical_dependency_count: int = Field(default=120, description="Residents requiring continuous medical/oxygen care")

class Topography(BaseModel):
    elevation_meters: float = Field(description="Average ground elevation above mean sea level")
    slope_degrees: float = Field(default=1.2, description="Topographic slope")
    soil_saturation_percent: float = Field(default=65.0, description="Antecedent soil moisture percentage")
    drainage_capacity_score: float = Field(default=4.0, ge=1.0, le=10.0, description="1 (poor urban choke) to 10 (excellent natural drainage)")
    distance_to_coastline_km: float = Field(description="Distance from shoreline in kilometers")
    distance_to_river_km: float = Field(default=2.5, description="Distance from major river channel in km")

class ZoneRiskBreakdown(BaseModel):
    rainfall_component: float
    surge_component: float
    elevation_component: float
    wind_component: float
    drainage_deficit_component: float
    total_score: float
    risk_level: str # SAFE, WATCH, HIGH, CRITICAL
    why_explanation: str # Transparent explanation of why this zone scored this level

class Zone(BaseModel):
    id: str # e.g. "ZONE-01"
    name: str # e.g. "Estuary Delta Zone"
    code: str
    population: int
    area_sq_km: float
    center: Coordinates
    polygon_coordinates: List[List[float]] # GeoJSON format [[lng, lat], ...]
    topography: Topography
    demographics: DemographicVulnerability
    
    # Computed Dynamic Fields
    risk_score: float = 0.0
    risk_level: str = "SAFE" # SAFE, WATCH, HIGH, CRITICAL
    exposed_population: int = 0
    evacuation_requirement: int = 0
    risk_breakdown: Optional[ZoneRiskBreakdown] = None
    nearby_infrastructure_ids: List[str] = []
    recommended_action: str = "Monitor advisory channels."

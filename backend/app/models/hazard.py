"""
Hazard and Cyclone Parameter Models.
"""
from pydantic import BaseModel, Field
from typing import List, Optional

class Coordinates(BaseModel):
    lat: float
    lng: float

class HazardTelemetry(BaseModel):
    id: str = "CYC-VARUNA-2026"
    name: str = "Cyclone Varuna"
    category: int = Field(default=3, ge=1, le=5, description="Saffir-Simpson or IMD Cyclone Category")
    hazard_type: str = "Tropical Cyclone & Extreme Precipitation"
    center_coordinates: Coordinates = Coordinates(lat=19.45, lng=86.20)
    landfall_eta_hours: float = Field(default=4.5, description="Estimated hours to coastal landfall")
    wind_speed_kmh: float = Field(default=145.0, description="Sustained wind speed in km/h")
    wind_gusts_kmh: float = Field(default=170.0, description="Peak wind gusts in km/h")
    rainfall_rate_mm_hr: float = Field(default=42.0, description="Peak precipitation rate mm/hr")
    total_24h_rainfall_mm: float = Field(default=280.0, description="Expected 24-hour total rainfall mm")
    storm_surge_meters: float = Field(default=1.8, description="Peak coastal storm surge height in meters")
    movement_speed_kmh: float = Field(default=18.0, description="Storm translation speed in km/h")
    movement_direction: str = "NW"
    wind_direction_deg: float = Field(default=135.0, description="Meteorological wind direction in degrees (0-360)")
    pressure_hpa: float = 964.0
    status: str = "APPROACHING" # APPROACHING, LANDFALL_ACTIVE, RECDEDING, LIVE_FEED

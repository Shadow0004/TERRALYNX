"""
TerraLynx System Configuration and Constants.
"""
from typing import Dict

# District Profile Metadata
DISTRICT_NAME = "Purva Coastal District"
DISTRICT_STATE = "Odisha"
DISTRICT_COORDINATES = {"lat": 19.8135, "lng": 85.8312} # Bay of Bengal coastal sector
DISTRICT_POPULATION = 184500
TOTAL_ZONES_COUNT = 10

# Risk Thresholds (0 - 100 scale)
RISK_THRESHOLDS = {
    "CRITICAL": 75.0,
    "HIGH": 50.0,
    "WATCH": 25.0,
    "SAFE": 0.0
}

# Vulnerability & Hazard Weightings for Impact Engine
RISK_WEIGHTS = {
    "rainfall": 0.30,        # Precip intensity weight
    "surge": 0.25,           # Coastal storm surge height
    "elevation": 0.20,       # Inverted elevation factor (lower = higher danger)
    "wind": 0.15,            # Cyclone wind force factor
    "drainage_deficit": 0.10 # Urban / soil drainage deficit
}

# Resource Requirement Factors per 1,000 Evacuees
RESOURCE_DEMAND_RATES = {
    "bus_capacity": 40,           # 40 people per standard evacuation bus
    "ambulance_per_evacuees": 1500, # 1 ambulance per 1,500 evacuees
    "rescue_team_per_evacuees": 800, # 1 NDRF/SDRF team per 800 critical evacuees
    "boat_per_waterlogged_zone": 4, # 4 inflatable rescue boats per critical flood zone
    "food_water_packs_per_person_per_day": 3,
    "medical_kits_per_shelter": 15
}

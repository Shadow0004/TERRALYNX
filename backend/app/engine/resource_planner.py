"""
Resource Planning and Shortfall Calculation Engine.
Calculates required emergency fleets, search & rescue teams, life-support supplies,
and evaluates logistical deficits against available inventory.
"""
import math
from typing import List, Dict, Optional
from backend.app.models.geography import Zone
from backend.app.models.infrastructure import Shelter, Hospital
from backend.app.models.response import ResourceDeploymentItem
from backend.app.models.scenario import SimulationOverrides

# Baseline district inventory
DEFAULT_AVAILABLE_INVENTORY = {
    "buses": 36,
    "boats": 14,
    "ambulances": 18,
    "rescue_teams": 12,
    "food_water_packs": 45000,
    "medical_kits": 120,
    "mobile_generators": 16
}

def calculate_resource_plan(
    zones: List[Zone],
    shelters: List[Shelter],
    hospitals: List[Hospital],
    total_evacuation_demand: int,
    overrides: Optional[SimulationOverrides] = None
) -> List[ResourceDeploymentItem]:
    """
    Computes required emergency resources vs available inventory,
    determining shortfall deficits and prioritized deployment sectors.
    """
    overrides = overrides or SimulationOverrides()
    
    # Identify high priority sectors
    critical_zone_ids = [z.id for z in zones if z.risk_level == "CRITICAL"]
    high_zone_ids = [z.id for z in zones if z.risk_level == "HIGH"]
    priority_zones = critical_zone_ids + high_zone_ids

    # 1. Evacuation Buses (40 pax capacity, multi-trip factor 1.25)
    # Estimated 80% need public bus transport
    public_transit_demand = int(round(total_evacuation_demand * 0.80))
    required_buses = max(1, math.ceil(public_transit_demand / (40 * 1.5)))
    avail_buses = overrides.available_buses_override if overrides.available_buses_override is not None else DEFAULT_AVAILABLE_INVENTORY["buses"]
    bus_shortfall = max(0, required_buses - avail_buses)

    # 2. Inflatable Rescue Boats
    # Required in low-lying coastal and delta flood zones
    waterlogged_zones = [z for z in zones if z.risk_level in ["CRITICAL", "HIGH"] and z.topography.elevation_meters <= 3.5]
    required_boats = max(4, len(waterlogged_zones) * 4 + len(critical_zone_ids) * 2)
    avail_boats = overrides.available_boats_override if overrides.available_boats_override is not None else DEFAULT_AVAILABLE_INVENTORY["boats"]
    boat_shortfall = max(0, required_boats - avail_boats)

    # 3. Emergency Ambulances
    total_medical_deps = sum(z.demographics.medical_dependency_count for z in zones if z.risk_level in ["CRITICAL", "HIGH"])
    required_ambulances = max(6, math.ceil(total_medical_deps / 18.0) + len(hospitals))
    avail_ambulances = DEFAULT_AVAILABLE_INVENTORY["ambulances"]
    ambulance_shortfall = max(0, required_ambulances - avail_ambulances)

    # 4. NDRF / SDRF Search & Rescue Teams (10-person tactical units)
    critical_evac_pop = sum(z.evacuation_requirement for z in zones if z.risk_level == "CRITICAL")
    required_teams = max(4, math.ceil(critical_evac_pop / 650.0) + len(critical_zone_ids))
    avail_teams = overrides.available_teams_override if overrides.available_teams_override is not None else DEFAULT_AVAILABLE_INVENTORY["rescue_teams"]
    teams_shortfall = max(0, required_teams - avail_teams)

    # 5. Emergency Food & Water Ration Units (3-day sustenance)
    required_rations = max(5000, total_evacuation_demand * 3)
    avail_rations = DEFAULT_AVAILABLE_INVENTORY["food_water_packs"]
    rations_shortfall = max(0, required_rations - avail_rations)

    # 6. Medical Trauma & First Aid Kits
    active_shelters_count = len([s for s in shelters if s.is_active])
    required_med_kits = active_shelters_count * 12 + len(priority_zones) * 5
    avail_med_kits = DEFAULT_AVAILABLE_INVENTORY["medical_kits"]
    med_kits_shortfall = max(0, required_med_kits - avail_med_kits)

    # 7. Mobile Emergency Generators
    required_generators = active_shelters_count * 2
    avail_generators = DEFAULT_AVAILABLE_INVENTORY["mobile_generators"]
    gen_shortfall = max(0, required_generators - avail_generators)

    plan = [
        ResourceDeploymentItem(
            resource_type="Evacuation Buses (40-pax capacity)",
            unit="Vehicles",
            required_count=required_buses,
            available_count=avail_buses,
            shortfall_count=bus_shortfall,
            is_critical_shortage=bus_shortfall > 0,
            priority_deployment_zones=priority_zones[:3],
            notes=f"Fleet dispatch required for {public_transit_demand:,} transit-dependent residents."
        ),
        ResourceDeploymentItem(
            resource_type="Inflatable Rescue Boats & OBMs",
            unit="Boats",
            required_count=required_boats,
            available_count=avail_boats,
            shortfall_count=boat_shortfall,
            is_critical_shortage=boat_shortfall > 0,
            priority_deployment_zones=[z.id for z in waterlogged_zones],
            notes="Deploy to Estuary Delta & Lowland sectors with water depth > 0.6m."
        ),
        ResourceDeploymentItem(
            resource_type="Advance Life Support Ambulances",
            unit="Vehicles",
            required_count=required_ambulances,
            available_count=avail_ambulances,
            shortfall_count=ambulance_shortfall,
            is_critical_shortage=ambulance_shortfall > 0,
            priority_deployment_zones=priority_zones[:2],
            notes=f"Dedicated to {total_medical_deps} identified medical dependencies and ICU hospital transfers."
        ),
        ResourceDeploymentItem(
            resource_type="NDRF / SDRF Search & Rescue Teams",
            unit="Teams (10-person)",
            required_count=required_teams,
            available_count=avail_teams,
            shortfall_count=teams_shortfall,
            is_critical_shortage=teams_shortfall > 0,
            priority_deployment_zones=critical_zone_ids,
            notes="Forward tactical deployment for structural breach and swift-water rescue."
        ),
        ResourceDeploymentItem(
            resource_type="Emergency Food & Drinking Water Rations",
            unit="3-Day Packs",
            required_count=required_rations,
            available_count=avail_rations,
            shortfall_count=rations_shortfall,
            is_critical_shortage=rations_shortfall > 0,
            priority_deployment_zones=priority_zones,
            notes="Stocking primary designated shelters with 72-hour survival rations."
        ),
        ResourceDeploymentItem(
            resource_type="Emergency Trauma & First-Aid Medical Kits",
            unit="Kits",
            required_count=required_med_kits,
            available_count=avail_med_kits,
            shortfall_count=med_kits_shortfall,
            is_critical_shortage=med_kits_shortfall > 0,
            priority_deployment_zones=priority_zones,
            notes="Equip all active shelters and forward medical staging triage posts."
        ),
        ResourceDeploymentItem(
            resource_type="Heavy Mobile Diesel Generators (25kVA)",
            unit="Units",
            required_count=required_generators,
            available_count=avail_generators,
            shortfall_count=gen_shortfall,
            is_critical_shortage=gen_shortfall > 0,
            priority_deployment_zones=[s.zone_id for s in shelters if s.is_active][:4],
            notes="Ensure continuous power for water pumps and emergency shelter lighting."
        )
    ]

    return plan

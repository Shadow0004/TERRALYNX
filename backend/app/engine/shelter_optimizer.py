"""
Shelter Optimization Engine.
Solves capacity-constrained multi-factor allocation of evacuees to shelters,
optimizing for minimum transit distance, maximum shelter safety, and minimum overload.
"""
import math
from typing import List, Dict, Tuple
from backend.app.models.geography import Zone
from backend.app.models.infrastructure import Shelter, TemporaryShelterCandidate
from backend.app.models.response import ShelterAllocationItem

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points on Earth in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

def optimize_shelter_allocation(
    zones: List[Zone],
    shelters: List[Shelter],
    candidate_temporary_shelters: List[TemporaryShelterCandidate],
    disabled_shelter_ids: List[str] = None,
    activate_temp_shelters: bool = False
) -> Tuple[List[ShelterAllocationItem], List[Shelter], List[TemporaryShelterCandidate], int]:
    """
    Allocates evacuation demand from danger zones to safe, active shelters.
    Returns:
    - allocations list
    - updated shelters list with occupancy and utilization
    - recommended temporary shelters if overflow occurs
    - total unallocated evacuees count (if any)
    """
    disabled_set = set(disabled_shelter_ids or [])
    
    # 1. Initialize shelter mutable state
    shelter_map: Dict[str, Shelter] = {}
    remaining_caps: Dict[str, int] = {}
    
    for s in shelters:
        # Clone shelter for state update
        updated_s = s.model_copy(deep=True)
        if s.id in disabled_set:
            updated_s.is_active = False
            updated_s.remaining_capacity = 0
            updated_s.incoming_allocated_evacuees = 0
            updated_s.projected_total_occupancy = s.current_occupancy
            updated_s.utilization_percentage = 100.0 if s.total_capacity > 0 else 0.0
            updated_s.assigned_zone_ids = []
            remaining_caps[s.id] = 0
        else:
            avail = max(0, s.total_capacity - s.current_occupancy)
            updated_s.remaining_capacity = avail
            updated_s.incoming_allocated_evacuees = 0
            updated_s.projected_total_occupancy = s.current_occupancy
            updated_s.assigned_zone_ids = []
            remaining_caps[s.id] = avail
        shelter_map[s.id] = updated_s

    # If temporary emergency shelters activated via override, add them into active pool
    if activate_temp_shelters and candidate_temporary_shelters:
        for idx, temp in enumerate(candidate_temporary_shelters):
            t_id = f"TEMP-SHELTER-{idx+1}"
            if t_id not in disabled_set:
                t_shelter = Shelter(
                    id=t_id,
                    name=f"🏛️ [TEMP ACTIVATED] {temp.name}",
                    type="Temporary Emergency Complex",
                    zone_id="ZONE-01",
                    location=temp.location,
                    elevation_meters=temp.elevation_meters,
                    total_capacity=temp.potential_capacity,
                    current_occupancy=0,
                    safety_score=temp.suitability_score,
                    is_active=True,
                    is_govt_verified=True,
                    verification_agency="OSDMA / District Magistrate",
                    facility_code=f"TEMP-{temp.id}",
                    structural_certification="Rapid Activation Cleared",
                    has_backup_power=True,
                    has_medical_station=True,
                    water_capacity_liters=25000,
                    food_supply_days=5,
                    incoming_allocated_evacuees=0,
                    projected_total_occupancy=0,
                    remaining_capacity=temp.potential_capacity,
                    utilization_percentage=0.0,
                    is_overloaded=False,
                    assigned_zone_ids=[]
                )
                shelter_map[t_id] = t_shelter
                remaining_caps[t_id] = temp.potential_capacity

    # 2. Sort zones by urgency: CRITICAL first (highest risk score), then HIGH, etc.
    sorted_zones = sorted(
        [z for z in zones if z.evacuation_requirement > 0],
        key=lambda z: (0 if z.risk_level == "CRITICAL" else 1 if z.risk_level == "HIGH" else 2, -z.risk_score)
    )

    allocations: List[ShelterAllocationItem] = []
    total_unallocated = 0

    # 3. For each zone, match with the best available shelter based on distance and safety
    for zone in sorted_zones:
        demand_left = zone.evacuation_requirement
        
        # Rank active shelters for this zone
        candidate_shelters = []
        for s_id, s in shelter_map.items():
            if not s.is_active:
                continue
            dist = haversine_distance_km(zone.center.lat, zone.center.lng, s.location.lat, s.location.lng)
            
            # Distance penalty + safety penalty + elevation bonus
            safety_penalty = (100.0 - s.safety_score) * 0.1
            elev_bonus = max(0.0, s.elevation_meters - 5.0) * 0.2
            cost = dist + safety_penalty - elev_bonus
            candidate_shelters.append((cost, dist, s_id))
            
        candidate_shelters.sort(key=lambda x: x[0])

        for cost, dist, s_id in candidate_shelters:
            if demand_left <= 0:
                break
            cap_left = remaining_caps[s_id]
            if cap_left <= 0:
                continue

            allocate_count = min(demand_left, cap_left)
            demand_left -= allocate_count
            remaining_caps[s_id] -= allocate_count
            
            s = shelter_map[s_id]
            s.incoming_allocated_evacuees += allocate_count
            s.projected_total_occupancy += allocate_count
            s.remaining_capacity = remaining_caps[s_id]
            if zone.id not in s.assigned_zone_ids:
                s.assigned_zone_ids.append(zone.id)

            transit_time = round((dist / 30.0) * 60.0 + 8.0, 1) # Assumes 30 km/h average convoy speed + loading time

            allocations.append(ShelterAllocationItem(
                zone_id=zone.id,
                zone_name=zone.name,
                shelter_id=s.id,
                shelter_name=s.name,
                allocated_count=allocate_count,
                estimated_transit_time_mins=transit_time,
                recommended_route_id=f"ROUTE-{zone.id}-TO-{s.id}",
                route_status="ACTIVE_SAFE"
            ))

        if demand_left > 0:
            total_unallocated += demand_left

    # 4. Finalize shelter utilization percentages
    final_shelters_list: List[Shelter] = []
    for s_id, s in shelter_map.items():
        if s.total_capacity > 0:
            s.utilization_percentage = round((s.projected_total_occupancy / s.total_capacity) * 100.0, 1)
        else:
            s.utilization_percentage = 0.0
        s.is_overloaded = s.projected_total_occupancy > s.total_capacity
        final_shelters_list.append(s)

    # 5. Evaluate Candidate Temporary Shelters if shortfall or heavy utilization (>85%)
    total_capacity_active = sum(s.total_capacity for s in final_shelters_list if s.is_active)
    total_projected = sum(s.projected_total_occupancy for s in final_shelters_list if s.is_active)
    overall_utilization = (total_projected / total_capacity_active * 100.0) if total_capacity_active > 0 else 100.0

    recommended_temps: List[TemporaryShelterCandidate] = []
    for temp in candidate_temporary_shelters:
        temp_copy = temp.model_copy()
        if total_unallocated > 0 or overall_utilization > 80.0:
            temp_copy.rationale = (
                f"Recommended for urgent activation due to {total_unallocated} unallocated evacuees "
                f"and district shelter utilization reaching {overall_utilization:.1f}%."
            )
        else:
            temp_copy.rationale = "Standby reserve capacity. Activation ready within 2 hours if storm intensifies."
        recommended_temps.append(temp_copy)

    return allocations, final_shelters_list, recommended_temps, total_unallocated

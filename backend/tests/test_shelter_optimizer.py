import pytest
from backend.app.services.data_loader import get_seed_zones, get_seed_shelters, get_seed_temporary_shelter_candidates
from backend.app.engine.shelter_optimizer import optimize_shelter_allocation

def test_shelter_optimization_capacity_limits():
    zones = get_seed_zones()
    shelters = get_seed_shelters()
    temp_shelters = get_seed_temporary_shelter_candidates()

    # Artificially set evacuation demands
    zones[0].evacuation_requirement = 1500
    zones[1].evacuation_requirement = 800
    zones[2].evacuation_requirement = 1200

    allocations, updated_shelters, temps, unallocated = optimize_shelter_allocation(
        zones=zones,
        shelters=shelters,
        candidate_temporary_shelters=temp_shelters
    )

    # Check total allocated matches demand
    total_demand = sum(z.evacuation_requirement for z in zones)
    total_allocated = sum(a.allocated_count for a in allocations)
    assert total_allocated + unallocated == total_demand

    # Check shelter capacities never exceeded
    for s in updated_shelters:
        if s.is_active:
            assert s.projected_total_occupancy <= s.total_capacity + 1
            assert s.remaining_capacity >= 0

def test_shelter_disabling_redistribution():
    zones = get_seed_zones()
    shelters = get_seed_shelters()
    temp_shelters = get_seed_temporary_shelter_candidates()

    zones[0].evacuation_requirement = 2000

    # Test with Shelter 1 disabled
    disabled_id = "SHELTER-01"
    allocations, updated_shelters, temps, unallocated = optimize_shelter_allocation(
        zones=zones,
        shelters=shelters,
        candidate_temporary_shelters=temp_shelters,
        disabled_shelter_ids=[disabled_id]
    )

    disabled_s = next(s for s in updated_shelters if s.id == disabled_id)
    assert disabled_s.is_active == False
    assert disabled_s.incoming_allocated_evacuees == 0
    # No allocations should go to disabled shelter
    assert not any(a.shelter_id == disabled_id for a in allocations)

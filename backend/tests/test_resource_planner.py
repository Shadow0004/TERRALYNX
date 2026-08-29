import pytest
from backend.app.services.data_loader import get_seed_zones, get_seed_shelters, get_seed_hospitals
from backend.app.engine.resource_planner import calculate_resource_plan
from backend.app.models.scenario import SimulationOverrides

def test_resource_planner_shortfall():
    zones = get_seed_zones()
    shelters = get_seed_shelters()
    hospitals = get_seed_hospitals()
    total_evac = 15000

    plan = calculate_resource_plan(zones, shelters, hospitals, total_evac)
    assert len(plan) >= 5

    bus_item = next(item for item in plan if "Buses" in item.resource_type)
    assert bus_item.required_count > 0
    assert bus_item.shortfall_count == max(0, bus_item.required_count - bus_item.available_count)

def test_resource_planner_override():
    zones = get_seed_zones()
    shelters = get_seed_shelters()
    hospitals = get_seed_hospitals()
    total_evac = 15000

    # Override buses to 10
    overrides = SimulationOverrides(available_buses_override=10)
    plan = calculate_resource_plan(zones, shelters, hospitals, total_evac, overrides=overrides)
    bus_item = next(item for item in plan if "Buses" in item.resource_type)
    assert bus_item.available_count == 10
    assert bus_item.shortfall_count == max(0, bus_item.required_count - 10)

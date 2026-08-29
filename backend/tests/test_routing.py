import pytest
from backend.app.services.data_loader import (
    get_initial_hazard_telemetry,
    get_seed_zones,
    get_seed_shelters,
    get_seed_roads,
    get_seed_temporary_shelter_candidates
)
from backend.app.engine.routing import assess_road_flood_risks, generate_evacuation_routes
from backend.app.engine.shelter_optimizer import optimize_shelter_allocation

def test_road_flood_assessment():
    hazard = get_initial_hazard_telemetry()
    roads = get_seed_roads()

    assessed = assess_road_flood_risks(roads, hazard)
    assert len(assessed) == len(roads)
    for r in assessed:
        assert 0.0 <= r.flood_risk_score <= 100.0
        assert r.status in ["OPEN", "CAUTION", "FLOODED_CLOSED", "MANUAL_CLOSED"]

def test_evacuation_routes_generation():
    hazard = get_initial_hazard_telemetry()
    zones = get_seed_zones()
    shelters = get_seed_shelters()
    roads = get_seed_roads()
    temps = get_seed_temporary_shelter_candidates()

    zones[0].evacuation_requirement = 1200
    allocations, updated_shelters, _, _ = optimize_shelter_allocation(zones, shelters, temps)
    assessed_roads = assess_road_flood_risks(roads, hazard)

    routes = generate_evacuation_routes(allocations, zones, updated_shelters, assessed_roads)
    assert len(routes) > 0
    for r in routes:
        assert r.total_distance_km > 0.0
        assert r.estimated_travel_time_mins > 0.0
        assert len(r.path_coordinates) >= 2

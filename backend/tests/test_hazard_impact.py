import pytest
from backend.app.models.geography import Zone, Topography, DemographicVulnerability
from backend.app.models.hazard import Coordinates, HazardTelemetry
from backend.app.engine.hazard_impact import calculate_zone_hazard_impact

@pytest.fixture
def sample_zone():
    return Zone(
        id="TEST-ZONE",
        name="Test Coastal Zone",
        code="TCZ-01",
        population=10000,
        area_sq_km=25.0,
        center=Coordinates(lat=19.75, lng=85.85),
        polygon_coordinates=[[85.80, 19.70], [85.90, 19.70], [85.90, 19.80], [85.80, 19.80]],
        topography=Topography(
            elevation_meters=1.5,
            slope_degrees=0.5,
            soil_saturation_percent=85.0,
            drainage_capacity_score=2.0,
            distance_to_coastline_km=0.5,
            distance_to_river_km=1.0
        ),
        demographics=DemographicVulnerability(
            elderly_percent=15.0,
            children_percent=18.0,
            non_engineered_housing_percent=45.0,
            medical_dependency_count=50
        )
    )

@pytest.fixture
def sample_hazard():
    return HazardTelemetry(
        id="TEST-HAZARD",
        name="Test Cyclone",
        category=3,
        total_24h_rainfall_mm=260.0,
        storm_surge_meters=1.8,
        wind_gusts_kmh=165.0
    )

def test_hazard_impact_bounds(sample_zone, sample_hazard):
    score, risk_level, breakdown = calculate_zone_hazard_impact(sample_zone, sample_hazard)
    assert 0.0 <= score <= 100.0
    assert risk_level in ["CRITICAL", "HIGH", "WATCH", "SAFE"]
    assert breakdown.total_score == score
    assert len(breakdown.why_explanation) > 10

def test_hazard_impact_monotonic_increase(sample_zone, sample_hazard):
    # Low rain
    sample_hazard.total_24h_rainfall_mm = 50.0
    sample_hazard.storm_surge_meters = 0.5
    score_low, _, _ = calculate_zone_hazard_impact(sample_zone, sample_hazard)

    # High rain & surge
    sample_hazard.total_24h_rainfall_mm = 320.0
    sample_hazard.storm_surge_meters = 2.5
    score_high, _, _ = calculate_zone_hazard_impact(sample_zone, sample_hazard)

    assert score_high > score_low

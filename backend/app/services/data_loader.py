"""
District Data Loader and Seed Generator for 'Purva Coastal District'.
Generates realistic, coherent geospatial and infrastructural datasets.
"""
from typing import List, Dict
from backend.app.models.hazard import Coordinates, HazardTelemetry
from backend.app.models.geography import Zone, Topography, DemographicVulnerability
from backend.app.models.infrastructure import Shelter, Hospital, RoadSegment, TemporaryShelterCandidate

def get_initial_hazard_telemetry() -> HazardTelemetry:
    """Returns baseline approaching Category 3 Cyclone Varuna telemetry."""
    return HazardTelemetry(
        id="CYC-VARUNA-2026",
        name="Cyclone Varuna",
        category=3,
        hazard_type="Tropical Cyclone & Extreme Precipitation",
        center_coordinates=Coordinates(lat=19.45, lng=86.20),
        landfall_eta_hours=4.5,
        wind_speed_kmh=145.0,
        wind_gusts_kmh=170.0,
        rainfall_rate_mm_hr=38.0,
        total_24h_rainfall_mm=260.0,
        storm_surge_meters=1.8,
        movement_speed_kmh=18.0,
        movement_direction="NW",
        pressure_hpa=964.0,
        status="APPROACHING"
    )

def get_seed_zones() -> List[Zone]:
    """Generates 10 coherent, geographically realistic administrative zones for Purva Coastal District."""
    return [
        Zone(
            id="ZONE-01",
            name="Estuary Delta Lowlands",
            code="EDL-01",
            population=22400,
            area_sq_km=34.5,
            center=Coordinates(lat=19.782, lng=85.875),
            polygon_coordinates=[
                [85.842, 19.760], [85.878, 19.752], [85.905, 19.768],
                [85.918, 19.795], [85.895, 19.815], [85.860, 19.810],
                [85.845, 19.785], [85.842, 19.760]
            ],
            topography=Topography(
                elevation_meters=1.2,
                slope_degrees=0.4,
                soil_saturation_percent=88.0,
                drainage_capacity_score=2.2,
                distance_to_coastline_km=0.8,
                distance_to_river_km=0.3
            ),
            demographics=DemographicVulnerability(
                elderly_percent=15.5,
                children_percent=19.0,
                non_engineered_housing_percent=48.0,
                medical_dependency_count=165
            ),
            nearby_infrastructure_ids=["SHELTER-08", "HOSP-05", "ROAD-01", "ROAD-02"]
        ),
        Zone(
            id="ZONE-02",
            name="Port & Harbour Sector",
            code="PHS-02",
            population=16800,
            area_sq_km=22.0,
            center=Coordinates(lat=19.755, lng=85.845),
            polygon_coordinates=[
                [85.815, 19.735], [85.852, 19.728], [85.878, 19.752],
                [85.865, 19.780], [85.830, 19.782], [85.815, 19.758],
                [85.815, 19.735]
            ],
            topography=Topography(
                elevation_meters=1.8,
                slope_degrees=0.8,
                soil_saturation_percent=82.0,
                drainage_capacity_score=3.0,
                distance_to_coastline_km=0.4,
                distance_to_river_km=2.8
            ),
            demographics=DemographicVulnerability(
                elderly_percent=12.0,
                children_percent=16.5,
                non_engineered_housing_percent=34.0,
                medical_dependency_count=95
            ),
            nearby_infrastructure_ids=["SHELTER-07", "HOSP-02", "ROAD-01", "ROAD-04"]
        ),
        Zone(
            id="ZONE-03",
            name="Coastal Barrier Beach",
            code="CBB-03",
            population=11200,
            area_sq_km=18.5,
            center=Coordinates(lat=19.730, lng=85.890),
            polygon_coordinates=[
                [85.855, 19.708], [85.895, 19.702], [85.928, 19.725],
                [85.922, 19.755], [85.882, 19.752], [85.855, 19.732],
                [85.855, 19.708]
            ],
            topography=Topography(
                elevation_meters=0.9,
                slope_degrees=0.3,
                soil_saturation_percent=92.0,
                drainage_capacity_score=1.8,
                distance_to_coastline_km=0.2,
                distance_to_river_km=1.5
            ),
            demographics=DemographicVulnerability(
                elderly_percent=14.0,
                children_percent=21.0,
                non_engineered_housing_percent=55.0,
                medical_dependency_count=80
            ),
            nearby_infrastructure_ids=["ROAD-03", "ROAD-14"]
        ),
        Zone(
            id="ZONE-04",
            name="Riverside Floodplain",
            code="RFP-04",
            population=26500,
            area_sq_km=42.0,
            center=Coordinates(lat=19.815, lng=85.895),
            polygon_coordinates=[
                [85.860, 19.790], [85.898, 19.788], [85.935, 19.805],
                [85.938, 19.845], [85.890, 19.848], [85.862, 19.822],
                [85.860, 19.790]
            ],
            topography=Topography(
                elevation_meters=2.3,
                slope_degrees=0.6,
                soil_saturation_percent=85.0,
                drainage_capacity_score=2.8,
                distance_to_coastline_km=3.2,
                distance_to_river_km=0.2
            ),
            demographics=DemographicVulnerability(
                elderly_percent=13.5,
                children_percent=18.5,
                non_engineered_housing_percent=38.0,
                medical_dependency_count=180
            ),
            nearby_infrastructure_ids=["SHELTER-08", "HOSP-05", "ROAD-02", "ROAD-06"]
        ),
        Zone(
            id="ZONE-05",
            name="Urban Central Commercial",
            code="UCC-05",
            population=34200,
            area_sq_km=28.0,
            center=Coordinates(lat=19.810, lng=85.825),
            polygon_coordinates=[
                [85.790, 19.782], [85.842, 19.782], [85.862, 19.812],
                [85.850, 19.840], [85.805, 19.842], [85.788, 19.815],
                [85.790, 19.782]
            ],
            topography=Topography(
                elevation_meters=5.6,
                slope_degrees=1.2,
                soil_saturation_percent=68.0,
                drainage_capacity_score=4.8,
                distance_to_coastline_km=5.5,
                distance_to_river_km=2.2
            ),
            demographics=DemographicVulnerability(
                elderly_percent=12.5,
                children_percent=15.0,
                non_engineered_housing_percent=18.0,
                medical_dependency_count=210
            ),
            nearby_infrastructure_ids=["SHELTER-04", "HOSP-01", "ROAD-04", "ROAD-05", "ROAD-08"]
        ),
        Zone(
            id="ZONE-06",
            name="North Agricultural Valley",
            code="NAV-06",
            population=18900,
            area_sq_km=48.0,
            center=Coordinates(lat=19.870, lng=85.880),
            polygon_coordinates=[
                [85.835, 19.840], [85.895, 19.838], [85.928, 19.860],
                [85.925, 19.905], [85.865, 19.908], [85.832, 19.875],
                [85.835, 19.840]
            ],
            topography=Topography(
                elevation_meters=7.8,
                slope_degrees=2.0,
                soil_saturation_percent=60.0,
                drainage_capacity_score=6.2,
                distance_to_coastline_km=9.2,
                distance_to_river_km=3.5
            ),
            demographics=DemographicVulnerability(
                elderly_percent=16.0,
                children_percent=17.0,
                non_engineered_housing_percent=26.0,
                medical_dependency_count=110
            ),
            nearby_infrastructure_ids=["SHELTER-02", "ROAD-07", "ROAD-09"]
        ),
        Zone(
            id="ZONE-07",
            name="Industrial Sector West",
            code="ISW-07",
            population=14300,
            area_sq_km=36.0,
            center=Coordinates(lat=19.780, lng=85.760),
            polygon_coordinates=[
                [85.725, 19.748], [85.778, 19.745], [85.795, 19.780],
                [85.788, 19.815], [85.742, 19.818], [85.720, 19.785],
                [85.725, 19.748]
            ],
            topography=Topography(
                elevation_meters=9.5,
                slope_degrees=2.5,
                soil_saturation_percent=52.0,
                drainage_capacity_score=6.8,
                distance_to_coastline_km=11.0,
                distance_to_river_km=5.0
            ),
            demographics=DemographicVulnerability(
                elderly_percent=10.0,
                children_percent=14.0,
                non_engineered_housing_percent=15.0,
                medical_dependency_count=75
            ),
            nearby_infrastructure_ids=["SHELTER-05", "ROAD-05", "ROAD-10"]
        ),
        Zone(
            id="ZONE-08",
            name="Highground Ridge Sector",
            code="HRS-08",
            population=15400,
            area_sq_km=31.0,
            center=Coordinates(lat=19.855, lng=85.805),
            polygon_coordinates=[
                [85.768, 19.825], [85.828, 19.822], [85.845, 19.855],
                [85.840, 19.890], [85.788, 19.892], [85.765, 19.860],
                [85.768, 19.825]
            ],
            topography=Topography(
                elevation_meters=16.8,
                slope_degrees=4.5,
                soil_saturation_percent=45.0,
                drainage_capacity_score=8.5,
                distance_to_coastline_km=12.5,
                distance_to_river_km=4.8
            ),
            demographics=DemographicVulnerability(
                elderly_percent=13.0,
                children_percent=15.5,
                non_engineered_housing_percent=12.0,
                medical_dependency_count=85
            ),
            nearby_infrastructure_ids=["SHELTER-01", "SHELTER-06", "HOSP-04", "ROAD-08", "ROAD-11"]
        ),
        Zone(
            id="ZONE-09",
            name="Western Highland Cantonment",
            code="WHC-09",
            population=11800,
            area_sq_km=45.0,
            center=Coordinates(lat=19.860, lng=85.730),
            polygon_coordinates=[
                [85.685, 19.818], [85.758, 19.815], [85.775, 19.858],
                [85.768, 19.905], [85.710, 19.908], [85.680, 19.865],
                [85.685, 19.818]
            ],
            topography=Topography(
                elevation_meters=24.5,
                slope_degrees=6.0,
                soil_saturation_percent=38.0,
                drainage_capacity_score=9.2,
                distance_to_coastline_km=17.0,
                distance_to_river_km=8.0
            ),
            demographics=DemographicVulnerability(
                elderly_percent=11.5,
                children_percent=13.5,
                non_engineered_housing_percent=8.0,
                medical_dependency_count=50
            ),
            nearby_infrastructure_ids=["SHELTER-03", "HOSP-03", "ROAD-11", "ROAD-12"]
        ),
        Zone(
            id="ZONE-10",
            name="South Estuary Mangrove Belt",
            code="SMB-10",
            population=13000,
            area_sq_km=30.0,
            center=Coordinates(lat=19.715, lng=85.810),
            polygon_coordinates=[
                [85.775, 19.675], [85.828, 19.670], [85.852, 19.708],
                [85.845, 19.742], [85.798, 19.745], [85.772, 19.715],
                [85.775, 19.675]
            ],
            topography=Topography(
                elevation_meters=1.3,
                slope_degrees=0.5,
                soil_saturation_percent=90.0,
                drainage_capacity_score=2.5,
                distance_to_coastline_km=0.6,
                distance_to_river_km=0.8
            ),
            demographics=DemographicVulnerability(
                elderly_percent=14.5,
                children_percent=20.0,
                non_engineered_housing_percent=52.0,
                medical_dependency_count=105
            ),
            nearby_infrastructure_ids=["ROAD-13", "ROAD-04"]
        ),
    ]

def get_seed_shelters() -> List[Shelter]:
    """Generates 8 primary designated shelters across Purva District."""
    return [
        Shelter(
            id="SHELTER-01",
            name="Purva Central Multi-Purpose Cyclone Shelter",
            type="PRIMARY",
            zone_id="ZONE-08",
            location=Coordinates(lat=19.852, lng=85.808),
            elevation_meters=16.5,
            total_capacity=3400,
            current_occupancy=420,
            safety_score=98.0,
            is_active=True,
            has_backup_power=True,
            has_medical_station=True,
            water_capacity_liters=25000,
            food_supply_days=7
        ),
        Shelter(
            id="SHELTER-02",
            name="North Ridge Govt Higher Secondary School",
            type="PRIMARY",
            zone_id="ZONE-06",
            location=Coordinates(lat=19.868, lng=85.875),
            elevation_meters=8.5,
            total_capacity=2600,
            current_occupancy=280,
            safety_score=91.0,
            is_active=True,
            has_backup_power=True,
            has_medical_station=True,
            water_capacity_liters=18000,
            food_supply_days=5
        ),
        Shelter(
            id="SHELTER-03",
            name="Western Polytechnic Institute Relief Complex",
            type="PRIMARY",
            zone_id="ZONE-09",
            location=Coordinates(lat=19.865, lng=85.735),
            elevation_meters=24.0,
            total_capacity=4200,
            current_occupancy=350,
            safety_score=97.0,
            is_active=True,
            has_backup_power=True,
            has_medical_station=True,
            water_capacity_liters=30000,
            food_supply_days=7
        ),
        Shelter(
            id="SHELTER-04",
            name="Urban Civic Community Center",
            type="PRIMARY",
            zone_id="ZONE-05",
            location=Coordinates(lat=19.812, lng=85.820),
            elevation_meters=6.2,
            total_capacity=2000,
            current_occupancy=650,
            safety_score=87.0,
            is_active=True,
            has_backup_power=True,
            has_medical_station=True,
            water_capacity_liters=15000,
            food_supply_days=4
        ),
        Shelter(
            id="SHELTER-05",
            name="Industrial Safety Training Complex",
            type="PRIMARY",
            zone_id="ZONE-07",
            location=Coordinates(lat=19.785, lng=85.765),
            elevation_meters=10.2,
            total_capacity=2200,
            current_occupancy=180,
            safety_score=93.0,
            is_active=True,
            has_backup_power=True,
            has_medical_station=True,
            water_capacity_liters=16000,
            food_supply_days=5
        ),
        Shelter(
            id="SHELTER-06",
            name="District Sports Indoor Arena",
            type="PRIMARY",
            zone_id="ZONE-08",
            location=Coordinates(lat=19.860, lng=85.812),
            elevation_meters=17.5,
            total_capacity=4500,
            current_occupancy=550,
            safety_score=96.0,
            is_active=True,
            has_backup_power=True,
            has_medical_station=True,
            water_capacity_liters=35000,
            food_supply_days=7
        ),
        Shelter(
            id="SHELTER-07",
            name="Port Town St. Xavier Relief Center",
            type="PRIMARY",
            zone_id="ZONE-02",
            location=Coordinates(lat=19.760, lng=85.840),
            elevation_meters=3.2,
            total_capacity=1400,
            current_occupancy=480,
            safety_score=80.0,
            is_active=True,
            has_backup_power=True,
            has_medical_station=False,
            water_capacity_liters=10000,
            food_supply_days=3
        ),
        Shelter(
            id="SHELTER-08",
            name="Riverside Model Higher Primary School",
            type="PRIMARY",
            zone_id="ZONE-04",
            location=Coordinates(lat=19.820, lng=85.885),
            elevation_meters=3.8,
            total_capacity=1600,
            current_occupancy=520,
            safety_score=82.0,
            is_active=True,
            has_backup_power=False,
            has_medical_station=False,
            water_capacity_liters=12000,
            food_supply_days=3
        )
    ]

def get_seed_temporary_shelter_candidates() -> List[TemporaryShelterCandidate]:
    """Generates high-suitability reserve temporary shelter candidate locations."""
    return [
        TemporaryShelterCandidate(
            id="TEMP-01",
            name="Western Hills University Convention Center",
            address="National Highway 16 Bypass, Zone 9 Cantonment",
            location=Coordinates(lat=19.868, lng=85.725),
            elevation_meters=26.0,
            potential_capacity=3600,
            suitability_score=98.0,
            activation_readiness_hours=1.5,
            distance_to_overflow_zones_km=8.5,
            rationale="Exceptional high-elevation site with commercial kitchens, backup generator grid, and dual arterial highway access."
        ),
        TemporaryShelterCandidate(
            id="TEMP-02",
            name="West District Agri Logistics Mega Terminal",
            address="Industrial Corridor North, Zone 7",
            location=Coordinates(lat=19.790, lng=85.750),
            elevation_meters=11.5,
            potential_capacity=2500,
            suitability_score=89.0,
            activation_readiness_hours=2.0,
            distance_to_overflow_zones_km=6.0,
            rationale="Covered warehouse storage with heavy vehicle parking bays; outside active flood inundation contours."
        ),
        TemporaryShelterCandidate(
            id="TEMP-03",
            name="North Hills Community Sports Complex",
            address="Valley Ring Road, Zone 6",
            location=Coordinates(lat=19.880, lng=85.865),
            elevation_meters=9.5,
            potential_capacity=1500,
            suitability_score=91.0,
            activation_readiness_hours=1.0,
            distance_to_overflow_zones_km=7.2,
            rationale="Well-equipped municipal recreation center with functioning sanitation and clean borehole water supply."
        )
    ]

def get_seed_hospitals() -> List[Hospital]:
    """Generates 5 major hospital facilities."""
    return [
        Hospital(
            id="HOSP-01",
            name="Purva District Civil Hospital",
            zone_id="ZONE-05",
            location=Coordinates(lat=19.815, lng=85.828),
            total_beds=450,
            icu_beds=36,
            available_beds=85,
            elevation_meters=5.8,
            has_backup_power=True,
            is_flood_threatened=False,
            ambulance_count=8
        ),
        Hospital(
            id="HOSP-02",
            name="Port Maritime Emergency Hospital",
            zone_id="ZONE-02",
            location=Coordinates(lat=19.758, lng=85.842),
            total_beds=140,
            icu_beds=12,
            available_beds=22,
            elevation_meters=2.2,
            has_backup_power=True,
            is_flood_threatened=True,
            ambulance_count=3
        ),
        Hospital(
            id="HOSP-03",
            name="Western Medical College Hospital",
            zone_id="ZONE-09",
            location=Coordinates(lat=19.862, lng=85.732),
            total_beds=650,
            icu_beds=55,
            available_beds=140,
            elevation_meters=24.2,
            has_backup_power=True,
            is_flood_threatened=False,
            ambulance_count=10
        ),
        Hospital(
            id="HOSP-04",
            name="Highground Ridge Trauma Center",
            zone_id="ZONE-08",
            location=Coordinates(lat=19.855, lng=85.802),
            total_beds=180,
            icu_beds=18,
            available_beds=45,
            elevation_meters=16.8,
            has_backup_power=True,
            is_flood_threatened=False,
            ambulance_count=4
        ),
        Hospital(
            id="HOSP-05",
            name="Riverside Sub-Divisional Hospital",
            zone_id="ZONE-04",
            location=Coordinates(lat=19.818, lng=85.890),
            total_beds=120,
            icu_beds=8,
            available_beds=15,
            elevation_meters=2.6,
            has_backup_power=False,
            is_flood_threatened=True,
            ambulance_count=2
        )
    ]

def get_seed_roads() -> List[RoadSegment]:
    """Generates 14 key arterial and coastal road segments connecting zones."""
    return [
        RoadSegment(
            id="ROAD-01",
            name="Port-Delta Coastal Link Road",
            from_zone_id="ZONE-02",
            to_zone_id="ZONE-01",
            distance_km=4.8,
            typical_travel_time_mins=10.0,
            elevation_min_meters=1.1,
            drainage_quality=2.5,
            lanes=2,
            coordinates=[[85.845, 19.755], [85.860, 19.765], [85.875, 19.782]]
        ),
        RoadSegment(
            id="ROAD-02",
            name="Estuary Delta to Riverside Arterial",
            from_zone_id="ZONE-01",
            to_zone_id="ZONE-04",
            distance_km=4.2,
            typical_travel_time_mins=8.5,
            elevation_min_meters=1.4,
            drainage_quality=3.0,
            lanes=2,
            coordinates=[[85.875, 19.782], [85.885, 19.800], [85.895, 19.815]]
        ),
        RoadSegment(
            id="ROAD-03",
            name="Barrier Beach Access Causeway",
            from_zone_id="ZONE-03",
            to_zone_id="ZONE-01",
            distance_km=6.5,
            typical_travel_time_mins=14.0,
            elevation_min_meters=0.8,
            drainage_quality=1.5,
            lanes=2,
            coordinates=[[85.890, 19.730], [85.880, 19.755], [85.875, 19.782]]
        ),
        RoadSegment(
            id="ROAD-04",
            name="South Port-Urban Connector",
            from_zone_id="ZONE-02",
            to_zone_id="ZONE-05",
            distance_km=7.5,
            typical_travel_time_mins=15.0,
            elevation_min_meters=2.8,
            drainage_quality=4.2,
            lanes=4,
            coordinates=[[85.845, 19.755], [85.835, 19.780], [85.825, 19.810]]
        ),
        RoadSegment(
            id="ROAD-05",
            name="Urban Central to Industrial Expressway",
            from_zone_id="ZONE-05",
            to_zone_id="ZONE-07",
            distance_km=8.2,
            typical_travel_time_mins=12.0,
            elevation_min_meters=6.0,
            drainage_quality=5.5,
            lanes=4,
            coordinates=[[85.825, 19.810], [85.790, 19.795], [85.760, 19.780]]
        ),
        RoadSegment(
            id="ROAD-06",
            name="Riverside to Urban Central Ring Road",
            from_zone_id="ZONE-04",
            to_zone_id="ZONE-05",
            distance_km=7.8,
            typical_travel_time_mins=14.0,
            elevation_min_meters=3.5,
            drainage_quality=4.0,
            lanes=2,
            coordinates=[[85.895, 19.815], [85.860, 19.812], [85.825, 19.810]]
        ),
        RoadSegment(
            id="ROAD-07",
            name="Riverside to North Agri Valley Link",
            from_zone_id="ZONE-04",
            to_zone_id="ZONE-06",
            distance_km=6.8,
            typical_travel_time_mins=12.0,
            elevation_min_meters=4.2,
            drainage_quality=5.0,
            lanes=2,
            coordinates=[[85.895, 19.815], [85.888, 19.845], [85.880, 19.870]]
        ),
        RoadSegment(
            id="ROAD-08",
            name="Urban Central to Highground Ridge Trunk Road",
            from_zone_id="ZONE-05",
            to_zone_id="ZONE-08",
            distance_km=5.6,
            typical_travel_time_mins=9.0,
            elevation_min_meters=7.2,
            drainage_quality=7.0,
            lanes=4,
            coordinates=[[85.825, 19.810], [85.815, 19.835], [85.805, 19.855]]
        ),
        RoadSegment(
            id="ROAD-09",
            name="North Agri to Highground Arterial",
            from_zone_id="ZONE-06",
            to_zone_id="ZONE-08",
            distance_km=8.5,
            typical_travel_time_mins=14.0,
            elevation_min_meters=8.0,
            drainage_quality=7.2,
            lanes=2,
            coordinates=[[85.880, 19.870], [85.840, 19.862], [85.805, 19.855]]
        ),
        RoadSegment(
            id="ROAD-10",
            name="Industrial Sector to Highground Bypass",
            from_zone_id="ZONE-07",
            to_zone_id="ZONE-08",
            distance_km=9.8,
            typical_travel_time_mins=15.0,
            elevation_min_meters=10.0,
            drainage_quality=7.8,
            lanes=2,
            coordinates=[[85.760, 19.780], [85.780, 19.820], [85.805, 19.855]]
        ),
        RoadSegment(
            id="ROAD-11",
            name="Highground Ridge to Western Highland Highway",
            from_zone_id="ZONE-08",
            to_zone_id="ZONE-09",
            distance_km=8.4,
            typical_travel_time_mins=11.0,
            elevation_min_meters=17.0,
            drainage_quality=9.0,
            lanes=4,
            coordinates=[[85.805, 19.855], [85.770, 19.858], [85.730, 19.860]]
        ),
        RoadSegment(
            id="ROAD-12",
            name="Industrial Sector to Western Highland Spur",
            from_zone_id="ZONE-07",
            to_zone_id="ZONE-09",
            distance_km=11.2,
            typical_travel_time_mins=16.0,
            elevation_min_meters=11.5,
            drainage_quality=8.2,
            lanes=2,
            coordinates=[[85.760, 19.780], [85.745, 19.815], [85.730, 19.860]]
        ),
        RoadSegment(
            id="ROAD-13",
            name="South Mangrove Belt to Port Road",
            from_zone_id="ZONE-10",
            to_zone_id="ZONE-02",
            distance_km=5.8,
            typical_travel_time_mins=12.0,
            elevation_min_meters=1.2,
            drainage_quality=2.0,
            lanes=2,
            coordinates=[[85.810, 19.715], [85.825, 19.735], [85.845, 19.755]]
        ),
        RoadSegment(
            id="ROAD-14",
            name="Coastal Highway Corridior 14",
            from_zone_id="ZONE-03",
            to_zone_id="ZONE-02",
            distance_km=6.2,
            typical_travel_time_mins=11.0,
            elevation_min_meters=1.0,
            drainage_quality=1.8,
            lanes=2,
            coordinates=[[85.890, 19.730], [85.865, 19.742], [85.845, 19.755]]
        )
    ]

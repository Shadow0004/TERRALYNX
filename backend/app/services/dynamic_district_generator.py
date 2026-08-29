"""
Dynamic Geospatial District Generator for TerraLynx.
Dynamically generates coherent administrative zones, shelters, hospitals, road networks,
and evacuation corridors for ANY coordinate on Earth.
"""
import math
import random
from typing import List, Dict, Tuple
import httpx

from backend.app.models.hazard import Coordinates, HazardTelemetry
from backend.app.models.geography import Zone, Topography, DemographicVulnerability
from backend.app.models.infrastructure import Shelter, Hospital, RoadSegment, TemporaryShelterCandidate

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
BIGDATACLOUD_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client"

async def fetch_district_name(lat: float, lng: float, client: httpx.AsyncClient) -> Tuple[str, str]:
    """
    Reverse-geocodes exact District and State name for any GPS coordinate.
    Returns (district_title, location_subtitle).
    """
    headers = {"User-Agent": "TerraLynx-DisasterOps/2.0 (admin@terralynx.gov)"}
    
    # 1. Try Nominatim for high-precision district administrative boundaries
    try:
        res = await client.get(
            NOMINATIM_URL,
            params={"lat": lat, "lon": lng, "format": "json", "addressdetails": 1},
            headers=headers,
            timeout=4.0
        )
        if res.status_code == 200:
            addr = res.json().get("address", {})
            district = addr.get("state_district") or addr.get("district") or addr.get("county") or addr.get("city") or addr.get("town")
            state = addr.get("state") or addr.get("region") or addr.get("country") or ""
            suburb = addr.get("suburb") or addr.get("village") or addr.get("locality") or district
            
            if district and state:
                d_name = district if "District" in district else f"{district} District"
                return d_name, f"{suburb}, {state}" if suburb and suburb != district else f"{district}, {state}"
    except Exception:
        pass

    # 2. Fallback to BigDataCloud
    try:
        res = await client.get(
            BIGDATACLOUD_URL,
            params={"latitude": lat, "longitude": lng, "localityLanguage": "en"},
            timeout=4.0
        )
        if res.status_code == 200:
            data = res.json()
            locality = data.get("locality") or data.get("city") or ""
            subdivision = data.get("principalSubdivision") or ""
            country = data.get("countryName") or ""
            
            if locality and subdivision:
                return f"{locality} District", f"{locality}, {subdivision}"
            elif subdivision:
                return f"{subdivision} Operational Sector", f"{subdivision}, {country}"
    except Exception:
        pass

    return f"Sector ({round(lat, 2)}°N, {round(lng, 2)}°E)", f"Lat: {round(lat, 3)}, Lng: {round(lng, 3)}"


def create_curved_polygon(center_lng: float, center_lat: float, radius_km: float = 2.5, num_vertices: int = 7, seed: int = 42) -> List[List[float]]:
    """
    Generates a natural organic polygon contour around a center coordinate.
    """
    rng = random.Random(seed)
    coords = []
    # 1 deg lat ≈ 111 km, 1 deg lng ≈ 111 * cos(lat) km
    lat_scale = radius_km / 111.0
    lng_scale = radius_km / (111.0 * max(0.2, math.cos(math.radians(center_lat))))

    for i in range(num_vertices):
        angle = (2 * math.pi * i) / num_vertices
        # Apply organic jitter to avoid unnatural geometric regularity
        jitter = 0.82 + rng.random() * 0.36
        v_lng = center_lng + math.cos(angle) * lng_scale * jitter
        v_lat = center_lat + math.sin(angle) * lat_scale * jitter
        coords.append([round(v_lng, 5), round(v_lat, 5)])

    # Close polygon loop
    coords.append(coords[0])
    return coords


def generate_dynamic_district_data(
    center_lat: float,
    center_lng: float,
    district_name: str,
    hazard: HazardTelemetry
) -> Tuple[List[Zone], List[Shelter], List[TemporaryShelterCandidate], List[Hospital], List[RoadSegment]]:
    """
    Generates an interconnected, terrain-aware 10-zone district with shelters, hospitals,
    and road networks anchored to ANY given GPS coordinate.
    """
    # Offset vectors for 10 administrative zones (arranged logically across an ~25km district diameter)
    # Directional layout: Center, North, East, South, West, NE, NW, SE, SW, Far Inland
    zone_offsets = [
        {"id": "01", "name": f"{district_name} Central Urban Core", "code": "CUC-01", "dlat": 0.000, "dlng": 0.000, "elev": 6.5, "pop": 34500, "drain": 4.5, "coast_km": 4.0},
        {"id": "02", "name": f"{district_name} South Estuary & Port", "code": "SEP-02", "dlat": -0.045, "dlng": 0.015, "elev": 1.5, "pop": 21800, "drain": 2.2, "coast_km": 0.5},
        {"id": "03", "name": f"{district_name} Coastal Lowlands & Beach", "code": "CLB-03", "dlat": -0.035, "dlng": 0.055, "elev": 1.1, "pop": 14200, "drain": 1.8, "coast_km": 0.2},
        {"id": "04", "name": f"{district_name} East Riverside Floodplain", "code": "ERF-04", "dlat": 0.020, "dlng": 0.065, "elev": 2.8, "pop": 27400, "drain": 2.9, "coast_km": 2.5},
        {"id": "05", "name": f"{district_name} North Agricultural Valley", "code": "NAV-05", "dlat": 0.060, "dlng": 0.035, "elev": 7.5, "pop": 19500, "drain": 6.0, "coast_km": 8.0},
        {"id": "06", "name": f"{district_name} North-West Ridge Highlands", "code": "NRH-06", "dlat": 0.055, "dlng": -0.040, "elev": 18.2, "pop": 15800, "drain": 8.8, "coast_km": 12.0},
        {"id": "07", "name": f"{district_name} West Industrial Corridor", "code": "WIC-07", "dlat": -0.015, "dlng": -0.065, "elev": 9.4, "pop": 16200, "drain": 6.5, "coast_km": 10.0},
        {"id": "08", "name": f"{district_name} Highland Relief Cantonment", "code": "HRC-08", "dlat": 0.035, "dlng": -0.090, "elev": 25.5, "pop": 12400, "drain": 9.4, "coast_km": 16.0},
        {"id": "09", "name": f"{district_name} South-West Mangrove Buffer", "code": "SMB-09", "dlat": -0.065, "dlng": -0.030, "elev": 1.8, "pop": 13600, "drain": 2.5, "coast_km": 0.8},
        {"id": "10", "name": f"{district_name} North-East Delta Sector", "code": "NED-10", "dlat": 0.045, "dlng": 0.085, "elev": 3.2, "pop": 18900, "drain": 3.4, "coast_km": 3.2},
    ]

    zones: List[Zone] = []
    zone_centers: Dict[str, Coordinates] = {}

    for idx, z_meta in enumerate(zone_offsets):
        z_id = f"ZONE-{z_meta['id']}"
        z_lat = round(center_lat + z_meta["dlat"], 5)
        z_lng = round(center_lng + z_meta["dlng"], 5)
        z_center = Coordinates(lat=z_lat, lng=z_lng)
        zone_centers[z_id] = z_center

        poly = create_curved_polygon(
            center_lng=z_lng,
            center_lat=z_lat,
            radius_km=3.2,
            num_vertices=7,
            seed=idx + int(center_lat * 100)
        )

        zone = Zone(
            id=z_id,
            name=z_meta["name"],
            code=z_meta["code"],
            population=z_meta["pop"],
            area_sq_km=round(24.0 + (idx * 2.5), 1),
            center=z_center,
            polygon_coordinates=poly,
            topography=Topography(
                elevation_meters=z_meta["elev"],
                slope_degrees=round(0.4 + (z_meta["elev"] * 0.25), 1),
                soil_saturation_percent=round(max(30.0, 92.0 - z_meta["elev"] * 2.5), 1),
                drainage_capacity_score=z_meta["drain"],
                distance_to_coastline_km=z_meta["coast_km"],
                distance_to_river_km=round(max(0.3, z_meta["coast_km"] * 0.4), 1)
            ),
            demographics=DemographicVulnerability(
                elderly_percent=round(11.0 + (idx % 4) * 1.5, 1),
                children_percent=round(15.0 + (idx % 3) * 2.0, 1),
                non_engineered_housing_percent=round(max(10.0, 55.0 - z_meta["elev"] * 2.0), 1),
                medical_dependency_count=int(z_meta["pop"] * 0.007)
            ),
            nearby_infrastructure_ids=[]
        )
        zones.append(zone)

    # 2. Shelters (Distributed safely towards highlands)
    shelters: List[Shelter] = [
        Shelter(
            id="SHELTER-01",
            name=f"{district_name} Central High-Ground Cyclone Refuge",
            type="PRIMARY",
            zone_id="ZONE-06",
            location=Coordinates(lat=round(center_lat + 0.052, 5), lng=round(center_lng - 0.038, 5)),
            elevation_meters=18.5,
            total_capacity=4500,
            current_occupancy=450,
            safety_score=98.0,
            is_active=True,
            has_backup_power=True,
            has_medical_station=True,
            water_capacity_liters=35000,
            food_supply_days=7
        ),
        Shelter(
            id="SHELTER-02",
            name=f"{district_name} North Valley Govt Complex",
            type="PRIMARY",
            zone_id="ZONE-05",
            location=Coordinates(lat=round(center_lat + 0.058, 5), lng=round(center_lng + 0.032, 5)),
            elevation_meters=8.2,
            total_capacity=2800,
            current_occupancy=320,
            safety_score=91.0,
            is_active=True,
            has_backup_power=True,
            has_medical_station=True,
            water_capacity_liters=20000,
            food_supply_days=5
        ),
        Shelter(
            id="SHELTER-03",
            name=f"{district_name} Western Polytechnic Relief Facility",
            type="PRIMARY",
            zone_id="ZONE-08",
            location=Coordinates(lat=round(center_lat + 0.038, 5), lng=round(center_lng - 0.088, 5)),
            elevation_meters=25.0,
            total_capacity=5200,
            current_occupancy=410,
            safety_score=99.0,
            is_active=True,
            has_backup_power=True,
            has_medical_station=True,
            water_capacity_liters=45000,
            food_supply_days=8
        ),
        Shelter(
            id="SHELTER-04",
            name=f"{district_name} Civic Community Stadium",
            type="PRIMARY",
            zone_id="ZONE-01",
            location=Coordinates(lat=round(center_lat + 0.005, 5), lng=round(center_lng - 0.005, 5)),
            elevation_meters=6.8,
            total_capacity=2400,
            current_occupancy=680,
            safety_score=88.0,
            is_active=True,
            has_backup_power=True,
            has_medical_station=True,
            water_capacity_liters=18000,
            food_supply_days=4
        ),
        Shelter(
            id="SHELTER-05",
            name=f"{district_name} Industrial Training Facility",
            type="PRIMARY",
            zone_id="ZONE-07",
            location=Coordinates(lat=round(center_lat - 0.012, 5), lng=round(center_lng - 0.062, 5)),
            elevation_meters=10.0,
            total_capacity=2600,
            current_occupancy=250,
            safety_score=93.0,
            is_active=True,
            has_backup_power=True,
            has_medical_station=True,
            water_capacity_liters=19000,
            food_supply_days=5
        ),
        Shelter(
            id="SHELTER-06",
            name=f"{district_name} Port Maritime Relief Center",
            type="PRIMARY",
            zone_id="ZONE-02",
            location=Coordinates(lat=round(center_lat - 0.040, 5), lng=round(center_lng + 0.012, 5)),
            elevation_meters=2.8,
            total_capacity=1500,
            current_occupancy=490,
            safety_score=78.0,
            is_active=True,
            has_backup_power=True,
            has_medical_station=False,
            water_capacity_liters=11000,
            food_supply_days=3
        ),
    ]

    # 3. Temporary Shelter Candidates
    candidates: List[TemporaryShelterCandidate] = [
        TemporaryShelterCandidate(
            id="TEMP-01",
            name=f"{district_name} University Convention Pavilion",
            address=f"West Arterial Highway, Zone 8",
            location=Coordinates(lat=round(center_lat + 0.042, 5), lng=round(center_lng - 0.092, 5)),
            elevation_meters=27.0,
            potential_capacity=4200,
            suitability_score=98.0,
            activation_readiness_hours=1.5,
            distance_to_overflow_zones_km=7.5,
            rationale="Exceptional highland elevation site with dual generator backup and heavy vehicle transit access."
        ),
        TemporaryShelterCandidate(
            id="TEMP-02",
            name=f"{district_name} Agri Logistics Cargo Terminal",
            address=f"Industrial Bypass, Zone 7",
            location=Coordinates(lat=round(center_lat - 0.010, 5), lng=round(center_lng - 0.070, 5)),
            elevation_meters=11.2,
            potential_capacity=2800,
            suitability_score=89.0,
            activation_readiness_hours=2.0,
            distance_to_overflow_zones_km=6.0,
            rationale="Large covered warehouse capacity with paved staging ground outside flood inundation lines."
        )
    ]

    # 4. Hospitals
    hospitals: List[Hospital] = [
        Hospital(
            id="HOSP-01",
            name=f"{district_name} Civil District Hospital",
            zone_id="ZONE-01",
            location=Coordinates(lat=round(center_lat + 0.008, 5), lng=round(center_lng + 0.005, 5)),
            total_beds=480,
            icu_beds=42,
            available_beds=95,
            elevation_meters=6.8,
            has_backup_power=True,
            is_flood_threatened=False,
            ambulance_count=9
        ),
        Hospital(
            id="HOSP-02",
            name=f"{district_name} Western Medical College & Trauma Center",
            zone_id="ZONE-08",
            location=Coordinates(lat=round(center_lat + 0.036, 5), lng=round(center_lng - 0.086, 5)),
            total_beds=680,
            icu_beds=60,
            available_beds=160,
            elevation_meters=26.0,
            has_backup_power=True,
            is_flood_threatened=False,
            ambulance_count=12
        ),
        Hospital(
            id="HOSP-03",
            name=f"{district_name} Coastal Emergency Maritime Clinic",
            zone_id="ZONE-02",
            location=Coordinates(lat=round(center_lat - 0.042, 5), lng=round(center_lng + 0.018, 5)),
            total_beds=150,
            icu_beds=14,
            available_beds=24,
            elevation_meters=2.2,
            has_backup_power=True,
            is_flood_threatened=True,
            ambulance_count=4
        )
    ]

    # 5. Connected Road Segments
    road_links = [
        ("02", "01", "Port-Central Coastal Corridor", 5.2, 1.4, 2),
        ("03", "02", "Barrier Beach Highway", 4.8, 1.0, 2),
        ("04", "01", "Riverside-Urban Trunk Link", 6.1, 2.5, 4),
        ("01", "05", "North Agri Arterial Highway", 7.4, 6.5, 4),
        ("01", "07", "Central to Industrial Expressway", 8.2, 6.8, 4),
        ("05", "06", "North Agri to Ridge Connector", 7.8, 8.0, 2),
        ("07", "06", "Industrial to Ridge Bypass", 9.1, 9.5, 2),
        ("06", "08", "Highland Refuge Evacuation Highway", 8.6, 18.0, 4),
        ("07", "08", "West Industrial to Highland Link", 9.8, 10.5, 2),
        ("09", "02", "South Mangrove to Port Road", 5.5, 1.2, 2),
        ("10", "04", "East Delta Relief Spur", 4.9, 2.8, 2),
        ("03", "04", "Coastal Barrier to Delta Bypass", 5.8, 1.2, 2),
    ]

    roads: List[RoadSegment] = []
    for idx, (from_num, to_num, r_name, dist, r_elev, lanes) in enumerate(road_links):
        from_id = f"ZONE-{from_num}"
        to_id = f"ZONE-{to_num}"
        c_from = zone_centers[from_id]
        c_to = zone_centers[to_id]

        # Midpoint curve
        mid_lng = (c_from.lng + c_to.lng) / 2.0 + (0.005 if idx % 2 == 0 else -0.005)
        mid_lat = (c_from.lat + c_to.lat) / 2.0 + (0.004 if idx % 2 == 0 else -0.004)

        road = RoadSegment(
            id=f"ROAD-{idx+1:02d}",
            name=f"{district_name} {r_name}",
            from_zone_id=from_id,
            to_zone_id=to_id,
            distance_km=dist,
            typical_travel_time_mins=round(dist * 1.8, 1),
            elevation_min_meters=r_elev,
            drainage_quality=round(min(9.0, 2.0 + r_elev * 0.4), 1),
            lanes=lanes,
            coordinates=[
                [c_from.lng, c_from.lat],
                [round(mid_lng, 5), round(mid_lat, 5)],
                [c_to.lng, c_to.lat]
            ]
        )
        roads.append(road)

    return zones, shelters, candidates, hospitals, roads

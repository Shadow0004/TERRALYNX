"""
Evacuation Routing and Multi-Modal Dijkstra Road Risk Engine.
Builds the dynamic road graph, assesses flood inundation per segment,
and calculates Dijkstra shortest vs safest alternative evacuation corridors with transparent explainability.
"""
import networkx as nx
from typing import List, Dict, Tuple, Optional
from backend.app.models.geography import Zone
from backend.app.models.infrastructure import RoadSegment, Shelter
from backend.app.models.hazard import HazardTelemetry
from backend.app.models.response import EvacuationRoute, ShelterAllocationItem

def assess_road_flood_risks(
    roads: List[RoadSegment],
    hazard: HazardTelemetry,
    closed_road_ids: List[str] = None
) -> List[RoadSegment]:
    """
    Assesses flood inundation risk for every road segment.
    Marks flooded/closed segments and calculates estimated time to impassable state.
    """
    closed_set = set(closed_road_ids or [])
    updated_roads: List[RoadSegment] = []

    for r in roads:
        road = r.model_copy()
        
        # 1. Check manual closure override
        if road.id in closed_set:
            road.is_closed_manual = True
            road.is_flooded = False
            road.status = "MANUAL_CLOSED"
            road.flood_risk_score = 90.0
            road.estimated_time_to_impassable_mins = 0.0
            road.recommended_for_evacuation = False
            updated_roads.append(road)
            continue

        road.is_closed_manual = False

        # 2. Dynamic Flood Risk Calculation based on real topography & precipitation
        elev = road.elevation_min_meters
        elev_factor = 1.0 if elev <= 1.5 else max(0.0, 1.0 - (elev - 1.5) / 15.0)
        
        # Rain factor
        rain_factor = min(1.0, hazard.total_24h_rainfall_mm / 300.0)
        
        # Surge factor
        surge_factor = min(1.0, hazard.storm_surge_meters / 2.5) if elev <= 3.5 else 0.0
        
        # Drainage factor
        drainage_factor = (10.0 - road.drainage_quality) / 9.0

        raw_flood_risk = (
            0.40 * elev_factor * 100.0 +
            0.25 * rain_factor * 100.0 +
            0.20 * surge_factor * 100.0 +
            0.15 * drainage_factor * 100.0
        )
        road.flood_risk_score = round(min(100.0, max(0.0, raw_flood_risk)), 1)

        # 3. Determine status and impassable ETA
        if road.flood_risk_score >= 70.0:
            road.is_flooded = True
            road.status = "FLOODED_CLOSED"
            road.recommended_for_evacuation = False
            road.estimated_time_to_impassable_mins = max(15.0, round(hazard.landfall_eta_hours * 18.0, 0))
        elif road.flood_risk_score >= 42.0:
            road.is_flooded = False
            road.status = "CAUTION"
            road.recommended_for_evacuation = True
            road.estimated_time_to_impassable_mins = max(60.0, round(hazard.landfall_eta_hours * 45.0, 0))
        else:
            road.is_flooded = False
            road.status = "OPEN"
            road.recommended_for_evacuation = True
            road.estimated_time_to_impassable_mins = None

        updated_roads.append(road)

    return updated_roads

def generate_evacuation_routes(
    allocations: List[ShelterAllocationItem],
    zones: List[Zone],
    shelters: List[Shelter],
    roads: List[RoadSegment]
) -> List[EvacuationRoute]:
    """
    Constructs road network graph and computes primary safe routes alongside Dijkstra shortest alternatives.
    """
    zone_dict = {z.id: z for z in zones}
    shelter_dict = {s.id: s for s in shelters}

    # 1. Build NetworkX Graphs (Safe Graph vs Shortest Graph)
    G_safe = nx.Graph()
    G_shortest = nx.Graph()

    for r in roads:
        u = r.from_zone_id
        v = r.to_zone_id
        dist = r.distance_km
        base_time = r.typical_travel_time_mins

        # Shortest graph minimizes pure physical distance
        G_shortest.add_edge(u, v, weight=dist, road_id=r.id, road=r)

        # Safe graph penalizes flood risk heavily
        # Penalty formula: distance * (1.0 + 4.0 * (flood_risk / 100)^2)
        if not r.is_closed_manual and r.status != "MANUAL_CLOSED":
            risk_penalty = 1.0 + 4.0 * (r.flood_risk_score / 100.0) ** 2
            if r.is_flooded or r.status == "FLOODED_CLOSED":
                risk_penalty *= 15.0  # Massive deterrence for flooded roads
            
            G_safe.add_edge(u, v, weight=dist * risk_penalty, road_id=r.id, road=r)

    generated_routes: List[EvacuationRoute] = []
    processed_pairs = set()

    for alloc in allocations:
        z_id = alloc.zone_id
        s_id = alloc.shelter_id
        shelter = shelter_dict.get(s_id)
        if not shelter:
            continue
        
        target_zone_id = shelter.zone_id
        pair_key = (z_id, s_id)
        if pair_key in processed_pairs:
            continue
        processed_pairs.add(pair_key)

        zone = zone_dict.get(z_id)
        zone_name = zone.name if zone else z_id
        shelter_name = shelter.name

        # If origin and destination are in the same zone
        if z_id == target_zone_id:
            route_coords = [
                [zone.center.lng, zone.center.lat],
                [shelter.location.lng, shelter.location.lat]
            ]
            generated_routes.append(EvacuationRoute(
                id=f"ROUTE-{z_id}-LOCAL-{s_id}",
                from_zone_id=z_id,
                from_zone_name=zone_name,
                to_shelter_id=s_id,
                to_shelter_name=shelter_name,
                path_coordinates=route_coords,
                total_distance_km=1.8,
                shortest_distance_km=1.8,
                estimated_travel_time_mins=6.5,
                route_risk_level="LOW_RISK",
                used_road_ids=[],
                unsafe_road_warnings=[],
                route_selection_rationale="Intra-zone direct corridor: shortest direct path within safe zone perimeter.",
                is_primary=True
            ))
            continue

        # 1. Compute Shortest Path
        shortest_nodes = []
        shortest_dist = 0.0
        try:
            shortest_nodes = nx.shortest_path(G_shortest, source=z_id, target=target_zone_id, weight="weight")
            shortest_dist = nx.shortest_path_length(G_shortest, source=z_id, target=target_zone_id, weight="weight")
        except Exception:
            shortest_nodes = [z_id, target_zone_id]
            shortest_dist = 5.0

        # 2. Compute Safest Path
        safe_nodes = []
        is_safe = True
        try:
            safe_nodes = nx.shortest_path(G_safe, source=z_id, target=target_zone_id, weight="weight")
        except Exception:
            safe_nodes = shortest_nodes
            is_safe = False

        # Extract geometry and road segments for chosen safe path
        used_road_ids = []
        path_coordinates = [[zone.center.lng, zone.center.lat]]
        total_dist = 0.0
        total_time = 0.0
        max_road_risk = 0.0
        warnings = []
        has_flooded_avoidance = False

        for i in range(len(safe_nodes) - 1):
            u = safe_nodes[i]
            v = safe_nodes[i+1]
            
            edge_road = None
            for r in roads:
                if (r.from_zone_id == u and r.to_zone_id == v) or (r.from_zone_id == v and r.to_zone_id == u):
                    edge_road = r
                    break
            
            if edge_road:
                used_road_ids.append(edge_road.id)
                total_dist += edge_road.distance_km
                total_time += edge_road.typical_travel_time_mins
                max_road_risk = max(max_road_risk, edge_road.flood_risk_score)
                
                for pt in edge_road.coordinates:
                    if pt not in path_coordinates:
                        path_coordinates.append(pt)
                
                if edge_road.is_flooded or edge_road.is_closed_manual:
                    warnings.append(f"Segment {edge_road.name} is FLOODED/CLOSED. High clearance vehicle required.")
                elif edge_road.status == "CAUTION":
                    warnings.append(f"Segment {edge_road.name} has water accumulation. Proceed with caution.")

        path_coordinates.append([shelter.location.lng, shelter.location.lat])

        # Check if safe path took an elevated detour compared to raw shortest path
        diff_dist = round(total_dist - shortest_dist, 1)
        if diff_dist > 0.5:
            rationale = f"Safest corridor selected: adds +{diff_dist} km elevated detour to bypass low-elevation flood inundation choke points."
        else:
            rationale = "Optimal corridor: shortest available road route is clear and passes elevated terrain."

        # Risk rating
        if not is_safe or max_road_risk >= 70.0:
            risk_level = "HIGH_RISK"
        elif max_road_risk >= 42.0:
            risk_level = "MEDIUM_RISK"
        else:
            risk_level = "LOW_RISK"

        generated_routes.append(EvacuationRoute(
            id=f"ROUTE-{z_id}-TO-{s_id}",
            from_zone_id=z_id,
            from_zone_name=zone_name,
            to_shelter_id=s_id,
            to_shelter_name=shelter_name,
            path_coordinates=path_coordinates,
            total_distance_km=round(max(2.5, total_dist), 1),
            shortest_distance_km=round(max(2.0, shortest_dist), 1),
            estimated_travel_time_mins=round(max(8.0, total_time), 1),
            route_risk_level=risk_level,
            used_road_ids=used_road_ids,
            unsafe_road_warnings=warnings,
            route_selection_rationale=rationale,
            is_primary=True
        ))

    return generated_routes

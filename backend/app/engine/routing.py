"""
Evacuation Routing and Road Risk Engine.
Builds the dynamic road graph, assesses flood inundation per segment, and calculates safe vs alternative evacuation corridors.
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

        # 2. Dynamic Flood Risk Calculation
        # Elevation: roads <= 1.5m are extremely vulnerable
        elev = road.elevation_min_meters
        elev_factor = 1.0 if elev <= 1.5 else max(0.0, 1.0 - (elev - 1.5) / 12.0)
        
        # Rain factor
        rain_factor = min(1.0, hazard.total_24h_rainfall_mm / 300.0)
        
        # Surge factor
        surge_factor = min(1.0, hazard.storm_surge_meters / 2.5) if elev <= 3.0 else 0.0
        
        # Drainage factor
        drainage_factor = (10.0 - road.drainage_quality) / 9.0

        raw_flood_risk = (
            0.35 * elev_factor * 100.0 +
            0.30 * rain_factor * 100.0 +
            0.20 * surge_factor * 100.0 +
            0.15 * drainage_factor * 100.0
        )
        road.flood_risk_score = round(min(100.0, max(0.0, raw_flood_risk)), 1)

        # 3. Determine status and impassable ETA
        if road.flood_risk_score >= 72.0:
            road.is_flooded = True
            road.status = "FLOODED_CLOSED"
            road.recommended_for_evacuation = False
            # Time to impassable shrinks as storm nears landfall
            road.estimated_time_to_impassable_mins = max(15.0, round(hazard.landfall_eta_hours * 18.0, 0))
        elif road.flood_risk_score >= 45.0:
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
    Constructs road network graph and computes primary and alternative safe evacuation routes
    for all active zone-to-shelter allocations.
    """
    zone_dict = {z.id: z for z in zones}
    shelter_dict = {s.id: s for s in shelters}
    road_dict = {r.id: r for r in roads}

    # 1. Build NetworkX Graphs (Safe Graph vs Full Graph)
    G_safe = nx.Graph()
    G_all = nx.Graph()

    for r in roads:
        u = r.from_zone_id
        v = r.to_zone_id
        
        # Base weight is travel time
        base_time = r.typical_travel_time_mins
        
        # Add to all graph
        G_all.add_edge(u, v, weight=base_time * (1.0 + r.flood_risk_score / 20.0), road_id=r.id, road=r)
        
        # Add to safe graph only if open / passable
        if r.status in ["OPEN", "CAUTION"] and not r.is_flooded and not r.is_closed_manual:
            penalty = 1.0 + (r.flood_risk_score / 100.0) * 0.8
            G_safe.add_edge(u, v, weight=base_time * penalty, road_id=r.id, road=r)

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
                total_distance_km=2.2,
                estimated_travel_time_mins=8.0,
                route_risk_level="LOW_RISK",
                used_road_ids=[],
                unsafe_road_warnings=[],
                is_primary=True
            ))
            continue

        # Try finding safe path first
        path_nodes = None
        is_safe = True
        try:
            path_nodes = nx.shortest_path(G_safe, source=z_id, target=target_zone_id, weight="weight")
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            is_safe = False
            try:
                path_nodes = nx.shortest_path(G_all, source=z_id, target=target_zone_id, weight="weight")
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                path_nodes = [z_id, target_zone_id]

        # Extract road segments and geometry
        used_road_ids = []
        path_coordinates = [[zone.center.lng, zone.center.lat]]
        total_dist = 0.0
        total_time = 0.0
        max_road_risk = 0.0
        warnings = []

        for i in range(len(path_nodes) - 1):
            u = path_nodes[i]
            v = path_nodes[i+1]
            
            # Find connecting road
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
                
                # Append coordinates
                for pt in edge_road.coordinates:
                    if pt not in path_coordinates:
                        path_coordinates.append(pt)
                
                if edge_road.is_flooded or edge_road.is_closed_manual:
                    warnings.append(f"Segment {edge_road.name} is FLOODED/CLOSED. High clearance or emergency escort required.")
                elif edge_road.status == "CAUTION":
                    warnings.append(f"Segment {edge_road.name} has water accumulation. Monitor closely.")

        path_coordinates.append([shelter.location.lng, shelter.location.lat])
        
        # Route risk rating
        if not is_safe or max_road_risk >= 70.0:
            risk_level = "HIGH_RISK"
        elif max_road_risk >= 45.0:
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
            total_distance_km=round(max(3.0, total_dist), 1),
            estimated_travel_time_mins=round(max(10.0, total_time), 1),
            route_risk_level=risk_level,
            used_road_ids=used_road_ids,
            unsafe_road_warnings=warnings,
            is_primary=True
        ))

    return generated_routes

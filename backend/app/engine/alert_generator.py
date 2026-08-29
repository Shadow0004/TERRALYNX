"""
Operational Alert Generator Engine.
Evaluates simulation conditions against thresholds to produce prioritized operational alerts.
"""
from typing import List
from datetime import datetime, timezone
from backend.app.models.geography import Zone
from backend.app.models.infrastructure import Shelter, RoadSegment, TemporaryShelterCandidate
from backend.app.models.hazard import HazardTelemetry
from backend.app.models.response import EmergencyAlert, ResourceDeploymentItem

def generate_operational_alerts(
    hazard: HazardTelemetry,
    zones: List[Zone],
    shelters: List[Shelter],
    roads: List[RoadSegment],
    resources: List[ResourceDeploymentItem],
    unallocated_evacuees: int
) -> List[EmergencyAlert]:
    """
    Generates structured, actionable emergency alerts categorized by tier:
    CRITICAL, WARNING, WATCH, INFO.
    """
    alerts: List[EmergencyAlert] = []
    now_str = datetime.now(timezone.utc).strftime("%H:%M UTC")

    # 1. Critical Zone Evacuation Alerts
    critical_zones = [z for z in zones if z.risk_level == "CRITICAL"]
    if critical_zones:
        zone_names = ", ".join(z.name for z in critical_zones)
        alerts.append(EmergencyAlert(
            id=f"ALT-CRIT-EVAC-{len(alerts)+1}",
            timestamp=now_str,
            tier="CRITICAL",
            title=f"MANDATORY EVACUATION: {len(critical_zones)} Lowland Zones",
            message=f"Catastrophic flood and storm surge risk in {zone_names}. Directing {sum(z.evacuation_requirement for z in critical_zones):,} residents to designated inland shelters immediately.",
            target_zone_ids=[z.id for z in critical_zones],
            action_required="Deploy high-clearance transit buses and mobilize tactical NDRF boat teams immediately.",
            trigger_metric=f"Risk score >= 75.0 (Peak: {max(z.risk_score for z in critical_zones):.1f})"
        ))

    # 2. Road Inundation / Closure Alerts
    flooded_roads = [r for r in roads if r.is_flooded or r.status == "FLOODED_CLOSED"]
    if flooded_roads:
        road_names = ", ".join(r.name for r in flooded_roads[:3])
        alerts.append(EmergencyAlert(
            id=f"ALT-CRIT-ROAD-{len(alerts)+1}",
            timestamp=now_str,
            tier="CRITICAL",
            title=f"ROAD CLOSURES: {len(flooded_roads)} Corridors Impassable",
            message=f"Critical flood depth exceeded on {road_names}. Evacuation convoys must divert to secondary inland bypasses.",
            target_zone_ids=list(set([r.from_zone_id for r in flooded_roads] + [r.to_zone_id for r in flooded_roads])),
            action_required="Erect physical barricades, deploy traffic police, and enforce designated bypass routes.",
            trigger_metric="Flood risk score >= 72.0 / Elevation <= 1.5m"
        ))

    # 3. Resource Deficit Alerts
    critical_shortfalls = [res for res in resources if res.is_critical_shortage]
    for res in critical_shortfalls:
        tier = "CRITICAL" if "Buses" in res.resource_type or "Boats" in res.resource_type else "WARNING"
        alerts.append(EmergencyAlert(
            id=f"ALT-RES-{len(alerts)+1}",
            timestamp=now_str,
            tier=tier,
            title=f"RESOURCE DEFICIT: {res.resource_type}",
            message=f"Required: {res.required_count} {res.unit} | Available: {res.available_count} | Shortfall: {res.shortfall_count} {res.unit}.",
            target_zone_ids=res.priority_deployment_zones,
            action_required=f"Request mutual-aid requisition from state emergency operations center for {res.shortfall_count} {res.unit}.",
            trigger_metric=f"Shortfall count = {res.shortfall_count}"
        ))

    # 4. Shelter Capacity Alerts
    overloaded_shelters = [s for s in shelters if s.is_overloaded]
    near_full_shelters = [s for s in shelters if not s.is_overloaded and s.utilization_percentage >= 85.0]
    
    if overloaded_shelters or unallocated_evacuees > 0:
        s_names = ", ".join(s.name for s in overloaded_shelters)
        alerts.append(EmergencyAlert(
            id=f"ALT-SHELTER-OVERFLOW-{len(alerts)+1}",
            timestamp=now_str,
            tier="CRITICAL",
            title="SHELTER CAPACITY EXCEEDED: Overflow Activation Required",
            message=f"Shelter capacity exceeded in {s_names or 'district capacity'}. {unallocated_evacuees} evacuees require immediate temporary shelter activation.",
            target_zone_ids=[s.zone_id for s in overloaded_shelters],
            action_required="Activate Tier-2 candidate temporary shelters (Sports Complex / University Campus).",
            trigger_metric=f"Unallocated evacuees = {unallocated_evacuees}"
        ))
    elif near_full_shelters:
        s_names = ", ".join(s.name for s in near_full_shelters[:2])
        alerts.append(EmergencyAlert(
            id=f"ALT-SHELTER-WARN-{len(alerts)+1}",
            timestamp=now_str,
            tier="WARNING",
            title=f"SHELTER AT HIGH CAPACITY: {s_names}",
            message=f"{len(near_full_shelters)} primary shelters have reached >85% capacity. Secondary intake channels prepared.",
            target_zone_ids=[s.zone_id for s in near_full_shelters],
            action_required="Begin staging intake redirect to secondary inland relief centers.",
            trigger_metric="Utilization percentage >= 85.0%"
        ))

    # 5. Cyclone / Meteorological Watch Alert
    eta_text = f"Coastal landfall estimated in {hazard.landfall_eta_hours:.1f} hours." if hazard.landfall_eta_hours is not None else "Active precipitation and localized inundation watch."
    metric_text = f"Landfall ETA = {hazard.landfall_eta_hours:.1f}h" if hazard.landfall_eta_hours is not None else "Real-Time Telemetry Feed"
    
    cat_text = f"(Category {hazard.category})" if hazard.category >= 1 else f"({hazard.threat_level_label or 'LIVE METEO'})"
    alerts.append(EmergencyAlert(
        id=f"ALT-HAZ-WATCH-{len(alerts)+1}",
        timestamp=now_str,
        tier="WATCH",
        title=f"HAZARD TRACK: {hazard.name} {cat_text}",
        message=f"Sustained winds of {hazard.wind_speed_kmh:.0f} km/h with gusts to {hazard.wind_gusts_kmh:.0f} km/h. {eta_text}",
        target_zone_ids=[z.id for z in zones],
        action_required="Ensure emergency generator fuel supplies and communication links active.",
        trigger_metric=metric_text
    ))

    # Sort alerts by severity tier
    tier_order = {"CRITICAL": 0, "WARNING": 1, "WATCH": 2, "INFO": 3}
    alerts.sort(key=lambda a: tier_order.get(a.tier, 4))

    return alerts

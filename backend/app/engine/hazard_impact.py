"""
Hazard and Impact Calculation Engine.
Calculates deterministic, transparent multi-factor risk scores and flood inundation potential for each zone.
"""
import math
from typing import Dict, Tuple
from backend.app.config import RISK_WEIGHTS, RISK_THRESHOLDS
from backend.app.models.geography import Zone, ZoneRiskBreakdown
from backend.app.models.hazard import HazardTelemetry

def calculate_zone_hazard_impact(
    zone: Zone,
    hazard: HazardTelemetry
) -> Tuple[float, str, ZoneRiskBreakdown]:
    """
    Computes deterministic risk score (0-100), risk tier, and component breakdown for a zone.
    
    Formula components (all normalized 0.0 to 1.0):
    1. Rainfall Index: Normalized 24h precipitation vs 350mm benchmark
    2. Coastal Surge Index: Surge height attenuated exponentially by distance from coast
    3. Elevation Vulnerability: Low-lying ground receives high risk (<=1.5m -> 1.0; >=20m -> 0.05)
    4. Wind Hazard Index: Sustained wind vs 180 km/h benchmark, attenuated inland
    5. Drainage Deficit Index: Low drainage capacity combined with saturated ground
    """
    # 1. Rainfall component
    rain_norm = min(1.0, max(0.0, hazard.total_24h_rainfall_mm / 350.0))
    rain_comp = rain_norm * RISK_WEIGHTS["rainfall"] * 100.0

    # 2. Storm Surge component (attenuated by distance from coast)
    # Inland zones (> 15km) experience zero direct coastal surge
    dist_coast = max(0.0, zone.topography.distance_to_coastline_km)
    surge_attenuation = math.exp(-0.25 * dist_coast)
    surge_norm = min(1.0, max(0.0, (hazard.storm_surge_meters / 3.0) * surge_attenuation))
    surge_comp = surge_norm * RISK_WEIGHTS["surge"] * 100.0

    # 3. Elevation Vulnerability (inverted: low elevation = high flood risk)
    # Ground <= 1.5m is critical (1.0), ground >= 20m is very safe (0.05)
    elev = zone.topography.elevation_meters
    if elev <= 1.5:
        elev_norm = 1.0
    elif elev >= 20.0:
        elev_norm = 0.05
    else:
        elev_norm = 1.0 - ((elev - 1.5) / 18.5) * 0.95
    elev_comp = elev_norm * RISK_WEIGHTS["elevation"] * 100.0

    # 4. Wind Hazard component
    # Attenuated slightly by distance from coast
    wind_attenuation = max(0.65, 1.0 - (dist_coast * 0.015))
    wind_norm = min(1.0, max(0.0, (hazard.wind_gusts_kmh / 180.0) * wind_attenuation))
    wind_comp = wind_norm * RISK_WEIGHTS["wind"] * 100.0

    # 5. Drainage Deficit component
    # 1 = severe urban choke, 10 = excellent drainage
    drainage_deficit = (10.0 - zone.topography.drainage_capacity_score) / 9.0
    saturation = zone.topography.soil_saturation_percent / 100.0
    drain_norm = min(1.0, max(0.0, drainage_deficit * 0.6 + saturation * 0.4))
    drain_comp = drain_norm * RISK_WEIGHTS["drainage_deficit"] * 100.0

    # Aggregate Score
    raw_total = rain_comp + surge_comp + elev_comp + wind_comp + drain_comp
    total_score = round(min(100.0, max(0.0, raw_total)), 1)

    # Determine Risk Category
    if total_score >= RISK_THRESHOLDS["CRITICAL"]:
        risk_level = "CRITICAL"
    elif total_score >= RISK_THRESHOLDS["HIGH"]:
        risk_level = "HIGH"
    elif total_score >= RISK_THRESHOLDS["WATCH"]:
        risk_level = "WATCH"
    else:
        risk_level = "SAFE"

    # Generate transparent explainability rationale
    key_drivers = []
    if surge_norm > 0.4:
        key_drivers.append(f"coastal surge vulnerability ({hazard.storm_surge_meters:.1f}m surge at {dist_coast:.1f}km from shore)")
    if elev_norm > 0.6:
        key_drivers.append(f"low ground elevation ({elev:.1f}m above sea level)")
    if rain_norm > 0.6:
        key_drivers.append(f"heavy expected rainfall ({hazard.total_24h_rainfall_mm:.0f}mm/24h)")
    if drain_norm > 0.6:
        key_drivers.append(f"restricted drainage capacity with {zone.topography.soil_saturation_percent:.0f}% soil saturation")
    if wind_norm > 0.7:
        key_drivers.append(f"severe wind gusts ({hazard.wind_gusts_kmh:.0f} km/h)")

    if key_drivers:
        why_str = f"Risk driven by {', '.join(key_drivers)}."
    else:
        why_str = "Moderate hazard exposure within manageable drainage and elevation margins."

    breakdown = ZoneRiskBreakdown(
        rainfall_component=round(rain_comp, 1),
        surge_component=round(surge_comp, 1),
        elevation_component=round(elev_comp, 1),
        wind_component=round(wind_comp, 1),
        drainage_deficit_component=round(drain_comp, 1),
        total_score=total_score,
        risk_level=risk_level,
        why_explanation=why_str
    )

    return total_score, risk_level, breakdown

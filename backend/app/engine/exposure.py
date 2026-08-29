"""
Population Exposure and Evacuation Demand Calculation Engine.
Calculates exposed demographics, evacuation quotas, and action recommendations.
"""
from typing import Tuple
from backend.app.models.geography import Zone
from backend.app.models.hazard import HazardTelemetry

def calculate_zone_exposure(
    zone: Zone,
    risk_score: float,
    risk_level: str
) -> Tuple[int, int, str]:
    """
    Calculates exposed population count, mandatory evacuation demand count,
    and tailored operational recommendation string.
    """
    pop = zone.population
    score_frac = min(1.0, max(0.0, risk_score / 100.0))
    kutcha_frac = zone.demographics.non_engineered_housing_percent / 100.0
    vulnerable_demo_frac = (zone.demographics.elderly_percent + zone.demographics.children_percent) / 100.0

    # 1. Exposed Population Calculation
    if risk_level == "CRITICAL":
        exposed_fraction = 0.95
    elif risk_level == "HIGH":
        exposed_fraction = 0.70 + (score_frac - 0.50) * 0.50
    elif risk_level == "WATCH":
        exposed_fraction = 0.30 + (score_frac - 0.25) * 0.80
    else:
        exposed_fraction = 0.08

    exposed_pop = int(round(pop * min(1.0, exposed_fraction)))

    # 2. Evacuation Requirement Calculation
    # Combines hazard intensity with structural vulnerability and demographic fragility
    evac_rate = (
        0.45 * score_frac +
        0.35 * kutcha_frac +
        0.20 * vulnerable_demo_frac
    )
    
    # Floor and ceiling factors based on risk category
    if risk_level == "CRITICAL":
        evac_rate = max(0.55, min(0.95, evac_rate * 1.25))
    elif risk_level == "HIGH":
        evac_rate = max(0.30, min(0.65, evac_rate * 1.0))
    elif risk_level == "WATCH":
        evac_rate = max(0.10, min(0.35, evac_rate * 0.65))
    else:
        evac_rate = max(0.02, min(0.10, evac_rate * 0.20))

    evacuation_requirement = int(round(exposed_pop * evac_rate))
    # Ensure evacuation requirement doesn't exceed total population
    evacuation_requirement = min(pop, evacuation_requirement)

    # 3. Action Recommendation
    if risk_level == "CRITICAL":
        action = (
            f"Mandatory evacuation ordered for all low-lying sectors and non-engineered housing. "
            f"Mobilize high-capacity bus fleet immediately before access roads flood."
        )
    elif risk_level == "HIGH":
        action = (
            f"Priority evacuation for vulnerable residents ({zone.demographics.medical_dependency_count} medical dependencies, "
            f"elderly, children). Prepare secondary shelter activations."
        )
    elif risk_level == "WATCH":
        action = (
            f"Issue storm surge & waterlogging advisories. Pre-position rescue units at forward staging points. "
            f"Voluntary relocation advised for tin-roof structures."
        )
    else:
        action = "Standard alert posture. Keep drainage sluice gates cleared and emergency channels open."

    return exposed_pop, evacuation_requirement, action

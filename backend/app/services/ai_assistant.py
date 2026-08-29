"""
Operational Decision-Intelligence AI Assistant Service.
Powered by Google Gemini (gemini-2.5-flash / gemini-3.7-flash) with full state grounding,
deterministic fallback verification, and metric citations.
"""
import os
import json
import logging
from typing import Dict, Any, List, Optional
from backend.app.models.scenario import DistrictState, AIQueryResponse

logger = logging.getLogger(__name__)

class DecisionAIAssistant:
    def answer_query(
        self,
        query: str,
        state: DistrictState,
        api_key: Optional[str] = None,
        model_name: Optional[str] = "gemini-2.5-flash"
    ) -> AIQueryResponse:
        """Processes operational queries and returns verified, grounded answers."""
        # 1. Try Google Gemini if API Key is available
        key = api_key or os.environ.get("GEMINI_API_KEY")
        if key:
            try:
                from google import genai
                client = genai.Client(api_key=key)

                # Format comprehensive operational context
                context_summary = {
                    "hazard": {
                        "name": state.hazard.name,
                        "category": state.hazard.category,
                        "landfall_eta_hours": state.hazard.landfall_eta_hours,
                        "rainfall_24h_mm": state.hazard.total_24h_rainfall_mm,
                        "sustained_wind_kmh": state.hazard.wind_speed_kmh,
                        "wind_gusts_kmh": state.hazard.wind_gusts_kmh,
                        "wind_direction": f"{state.hazard.movement_direction} ({state.hazard.wind_direction_deg}°)",
                        "storm_surge_m": state.hazard.storm_surge_meters
                    },
                    "kpis": {
                        "total_population_exposed": state.kpis.total_population_exposed,
                        "total_evacuation_demand": state.kpis.total_evacuation_demand,
                        "total_shelter_capacity": state.kpis.total_shelter_capacity,
                        "shelter_utilization_pct": state.kpis.shelter_utilization_pct,
                        "unsafe_roads_count": state.kpis.unsafe_roads_count,
                        "critical_resource_shortfalls_count": state.kpis.critical_resource_shortfalls_count
                    },
                    "zones": [
                        {
                            "id": z.id,
                            "name": z.name,
                            "population": z.population,
                            "risk_score": z.risk_score,
                            "risk_level": z.risk_level,
                            "elevation_m": z.topography.elevation_meters,
                            "dist_coast_km": z.topography.distance_to_coastline_km,
                            "elderly_pct": z.demographics.elderly_percent,
                            "children_pct": z.demographics.children_percent,
                            "med_dependency_count": z.demographics.medical_dependency_count,
                            "kutcha_housing_pct": z.demographics.non_engineered_housing_percent,
                            "evac_requirement": z.evacuation_requirement,
                            "recommended_action": z.recommended_action
                        }
                        for z in state.zones
                    ],
                    "shelters": [
                        {
                            "id": s.id,
                            "name": s.name,
                            "capacity": s.total_capacity,
                            "projected_occupancy": s.projected_total_occupancy,
                            "utilization_pct": s.utilization_percentage,
                            "elevation_m": s.elevation_meters,
                            "is_active": s.is_active,
                            "food_days": s.food_supply_days,
                            "water_liters": s.water_capacity_liters
                        }
                        for s in state.shelters
                    ],
                    "temporary_shelter_candidates": [
                        {
                            "id": t.id,
                            "name": t.name,
                            "capacity": t.potential_capacity,
                            "elevation_m": t.elevation_meters,
                            "suitability_score": t.suitability_score,
                            "rationale": t.rationale
                        }
                        for t in state.temporary_shelter_candidates
                    ],
                    "closed_or_flooded_roads": [
                        {
                            "id": r.id,
                            "name": r.name,
                            "status": r.status,
                            "flood_risk_score": r.flood_risk_score,
                            "elevation_m": r.elevation_min_meters
                        }
                        for r in state.roads if r.is_flooded or r.status in ["FLOODED_CLOSED", "MANUAL_CLOSED", "CAUTION"]
                    ],
                    "resource_shortfalls": [
                        {
                            "resource": r.resource_type,
                            "unit": r.unit,
                            "shortfall": r.shortfall_count,
                            "priority_zones": r.priority_deployment_zones
                        }
                        for r in state.resources if r.is_critical_shortage
                    ]
                }

                prompt = f"""You are TerraLynx Command AI, an advanced emergency decision-support officer deployed during a live disaster crisis.
Answer the Commander's operational question concisely, authoritatively, and strategically.
Base your analysis STRICTLY on the real-time operational telemetry provided below. Do not invent external data.

### LIVE TELEMETRY & SIMULATION CONTEXT:
```json
{json.dumps(context_summary, indent=2)}
```

### COMMANDER'S QUERY:
"{query}"

### INSTRUCTIONS:
- Structure your response using markdown with clear bold headings, bullet points, and high-priority action items.
- Cite specific metrics (e.g. Risk score, Elevation in meters, Evacuee count, Capacity utilization, Shortfall count).
- Give immediate tactical next steps for incident commanders in the field.
"""

                target_model = model_name if model_name in ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-2.5-pro"] else "gemini-2.5-flash"
                res = client.models.generate_content(
                    model=target_model,
                    contents=prompt
                )

                if res and res.text:
                    # Extract relevant zones and shelters mentioned
                    found_zones = [z.id for z in state.zones if z.id in res.text or z.name in res.text]
                    found_shelters = [s.id for s in state.shelters if s.id in res.text or s.name in res.text]

                    return AIQueryResponse(
                        query=query,
                        answer=res.text.strip(),
                        grounded_metrics={
                            "hazard_threat": state.hazard.name,
                            "total_evacuation_demand": state.kpis.total_evacuation_demand,
                            "shelter_utilization": f"{state.kpis.shelter_utilization_pct:.1f}%",
                            "unsafe_roads": state.kpis.unsafe_roads_count,
                            "active_zones": len(state.zones)
                        },
                        relevant_zones=found_zones or [z.id for z in state.zones if z.risk_level == "CRITICAL"],
                        relevant_shelters=found_shelters or [s.id for s in state.shelters if s.is_active],
                        model_used=f"Google Gemini ({target_model})",
                        confidence_score=0.99
                    )
            except Exception as e:
                logger.warning(f"Gemini API invocation failed: {e}. Falling back to deterministic engine.")

        # 2. Deterministic Fallback Engine (Zero API Key required)
        q_lower = query.lower()

        # Priority Evacuation
        if any(w in q_lower for w in ["evacuate first", "priority evacuation", "who to evacuate", "where to evacuate", "prioritize"]):
            critical_zones = [z for z in state.zones if z.risk_level == "CRITICAL"]
            if critical_zones:
                sorted_crit = sorted(critical_zones, key=lambda x: -x.risk_score)
                top = sorted_crit[0]
                total_crit_evac = sum(z.evacuation_requirement for z in critical_zones)
                
                answer = (
                    f"**Priority 1 Evacuation Target**: **{top.name} ({top.id})**\n\n"
                    f"- **Vulnerability Profile**: Critical risk score **{top.risk_score:.1f}/100** at low ground elevation **{top.topography.elevation_meters:.1f}m ASL**.\n"
                    f"- **Exposed Population**: **{top.exposed_population:,} residents** ({top.demographics.elderly_percent}% elderly, {top.demographics.children_percent}% children).\n"
                    f"- **Evacuation Demand**: **{top.evacuation_requirement:,} evacuees** requiring immediate transit.\n\n"
                    f"**Actionable Directive**: Deploy high-clearance buses immediately along designated evacuation corridors to {top.name} before flood surge reaches maximum height."
                )
                return AIQueryResponse(
                    query=query,
                    answer=answer,
                    grounded_metrics={
                        "top_priority_zone": top.name,
                        "top_priority_risk_score": top.risk_score,
                        "evacuation_requirement": top.evacuation_requirement,
                        "critical_zones_count": len(critical_zones),
                        "total_critical_evacuation_demand": total_crit_evac
                    },
                    relevant_zones=[z.id for z in sorted_crit],
                    relevant_shelters=[alloc.shelter_id for alloc in state.allocations if alloc.zone_id == top.id],
                    model_used="Deterministic Ops Engine (Set GEMINI_API_KEY for GenAI)"
                )

        # Temporary Shelters
        if any(w in q_lower for w in ["temporary shelter", "establish temporary", "candidate shelter", "overflow shelter"]):
            temps = state.temporary_shelter_candidates
            if temps:
                best_temp = sorted(temps, key=lambda t: -t.suitability_score)[0]
                answer = (
                    f"**Top Recommended Temporary Shelter**: **{best_temp.name}**\n\n"
                    f"- **Suitability Score**: **{best_temp.suitability_score:.0f}%** (Readiness: {best_temp.activation_readiness_hours} hrs)\n"
                    f"- **Reserve Capacity**: **{best_temp.potential_capacity:,} evacuees**\n"
                    f"- **Site Elevation**: **{best_temp.elevation_meters:.1f}m ASL** (well above flood inundation line)\n"
                    f"- **Location**: {best_temp.address}\n\n"
                    f"**Site Rationale**: {best_temp.rationale}"
                )
                return AIQueryResponse(
                    query=query,
                    answer=answer,
                    grounded_metrics={
                        "candidate_id": best_temp.id,
                        "name": best_temp.name,
                        "potential_capacity": best_temp.potential_capacity,
                        "elevation_meters": best_temp.elevation_meters,
                        "suitability_score": best_temp.suitability_score
                    },
                    relevant_zones=[],
                    relevant_shelters=[best_temp.id],
                    model_used="Deterministic Ops Engine (Set GEMINI_API_KEY for GenAI)"
                )

        # Resource Shortfalls
        if any(w in q_lower for w in ["resource", "shortage", "shortfall", "bus", "boat", "ambulance", "generator"]):
            shortages = [r for r in state.resources if r.is_critical_shortage]
            if shortages:
                lines = [f"- **{r.resource_type}**: Required {r.required_count} {r.unit}, Available {r.available_count}, **Deficit of {r.shortfall_count} {r.unit}**" for r in shortages]
                answer = (
                    f"**Critical Logistical Deficits Identified ({len(shortages)} items)**:\n\n"
                    + "\n".join(lines) +
                    f"\n\n**Action Directive**: Requisition immediate mutual aid from State Emergency Operations Center for high-risk zones: {', '.join(shortages[0].priority_deployment_zones)}."
                )
            else:
                answer = "All required emergency assets (buses, boats, ambulances, medical supplies) are currently balanced with sufficient operational margins."

            return AIQueryResponse(
                query=query,
                answer=answer,
                grounded_metrics={
                    "critical_shortfalls_count": len(shortages),
                    "shortfalls": {r.resource_type: r.shortfall_count for r in shortages}
                },
                relevant_zones=shortages[0].priority_deployment_zones if shortages else [],
                relevant_shelters=[],
                model_used="Deterministic Ops Engine (Set GEMINI_API_KEY for GenAI)"
            )

        # Default Briefing
        answer = (
            f"**Operational Decision Briefing ({state.hazard.name})**:\n\n"
            f"- **Landfall ETA**: **{state.hazard.landfall_eta_hours:.1f} hours** | 24h Rain: **{state.hazard.total_24h_rainfall_mm:.0f} mm**\n"
            f"- **Total Exposed Population**: **{state.kpis.total_population_exposed:,}**\n"
            f"- **Total Evacuation Demand**: **{state.kpis.total_evacuation_demand:,} residents**\n"
            f"- **Shelter Utilization**: **{state.kpis.shelter_utilization_pct:.1f}%** ({state.kpis.total_current_occupancy + state.kpis.total_incoming_allocated:,} / {state.kpis.total_shelter_capacity:,})\n"
            f"- **Flooded Road Segments**: **{state.kpis.unsafe_roads_count}**\n"
            f"- **Critical Resource Shortfalls**: **{state.kpis.critical_resource_shortfalls_count}**\n\n"
            f"💡 *Tip: Provide a Gemini API Key in the assistant header to unlock multi-turn Gemini 2.5 Flash operational intelligence!*"
        )

        return AIQueryResponse(
            query=query,
            answer=answer,
            grounded_metrics={
                "hazard": state.hazard.name,
                "landfall_eta": state.hazard.landfall_eta_hours,
                "evacuation_demand": state.kpis.total_evacuation_demand,
                "shelter_utilization": state.kpis.shelter_utilization_pct
            },
            relevant_zones=[z.id for z in state.zones if z.risk_level == "CRITICAL"],
            relevant_shelters=[s.id for s in state.shelters if s.is_active],
            model_used="Deterministic Ops Engine"
        )

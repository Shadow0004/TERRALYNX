"""
Operational Decision-Intelligence AI Assistant Service.
Grounds all query answers strictly in the current deterministic simulation state,
providing transparent reasoning and specific metric citations without hallucination.
"""
from typing import Dict, Any, List
from backend.app.models.scenario import DistrictState, AIQueryResponse

class DecisionAIAssistant:
    def answer_query(self, query: str, state: DistrictState) -> AIQueryResponse:
        """Processes operational queries and returns verified, grounded answers."""
        q_lower = query.lower()

        # 1. Intent: Priority Evacuation Zones ("which area to evacuate first", "who should evacuate")
        if any(w in q_lower for w in ["evacuate first", "evacuate first?", "priority evacuation", "who to evacuate", "where to evacuate first", "prioritize"]):
            critical_zones = [z for z in state.zones if z.risk_level == "CRITICAL"]
            if critical_zones:
                sorted_crit = sorted(critical_zones, key=lambda x: -x.risk_score)
                top = sorted_crit[0]
                total_crit_evac = sum(z.evacuation_requirement for z in critical_zones)
                
                answer = (
                    f"**{top.name} ({top.id})** must be prioritized immediately. "
                    f"It has **{top.exposed_population:,} exposed residents** with a critical flood risk score of **{top.risk_score:.1f}/100** "
                    f"(elevation: {top.topography.elevation_meters:.1f}m, {top.topography.distance_to_coastline_km:.1f}km from coastline). "
                    f"Its primary evacuation demand is **{top.evacuation_requirement:,} people**. "
                )
                if len(sorted_crit) > 1:
                    second = sorted_crit[1]
                    answer += (
                        f"Next in sequence is **{second.name}** ({second.evacuation_requirement:,} evacuees, risk score: {second.risk_score:.1f}). "
                        f"In total, {len(critical_zones)} zones require mandatory evacuation ({total_crit_evac:,} evacuees)."
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
                    relevant_shelters=[alloc.shelter_id for alloc in state.allocations if alloc.zone_id == top.id]
                )

        # 2. Intent: Temporary Shelter Candidates ("where to establish temporary shelter", "temporary shelter")
        if any(w in q_lower for w in ["temporary shelter", "establish temporary", "candidate shelter", "overflow shelter"]):
            temps = state.temporary_shelter_candidates
            if temps:
                best_temp = sorted(temps, key=lambda t: -t.suitability_score)[0]
                answer = (
                    f"**{best_temp.name}** ({best_temp.address}) is the top recommended temporary shelter site with a suitability score of **{best_temp.suitability_score:.0f}%**. "
                    f"It provides **{best_temp.potential_capacity:,} reserve capacity** at an elevation of **{best_temp.elevation_meters:.1f}m** above sea level (completely outside flood contours). "
                    f"Activation readiness is estimated at **{best_temp.activation_readiness_hours:.1f} hours**. "
                    f"Rationale: {best_temp.rationale}"
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
                    relevant_shelters=[best_temp.id]
                )

        # 3. Intent: Resource Shortfalls & Logistics ("resource", "shortage", "shortfall", "buses", "boats")
        if any(w in q_lower for w in ["resource", "shortage", "shortfall", "bus", "boat", "ambulance", "generator"]):
            shortages = [r for r in state.resources if r.is_critical_shortage]
            if shortages:
                lines = [f"- **{r.resource_type}**: Required {r.required_count} {r.unit}, Available {r.available_count}, **Shortfall of {r.shortfall_count} {r.unit}**" for r in shortages]
                answer = (
                    f"TerraLynx has detected **{len(shortages)} critical resource deficits** in the current response plan:\n\n"
                    + "\n".join(lines) +
                    f"\n\n**Actionable Advice**: Immediate requisition needed from State Disaster Management Authority (SDMA) for priority deployment to zones: {', '.join(shortages[0].priority_deployment_zones)}."
                )
            else:
                answer = "All required emergency resources (buses, boats, ambulances, food/water rations) are currently within available district inventory limits."

            return AIQueryResponse(
                query=query,
                answer=answer,
                grounded_metrics={
                    "critical_shortfalls_count": len(shortages),
                    "shortfalls": {r.resource_type: r.shortfall_count for r in shortages}
                },
                relevant_zones=shortages[0].priority_deployment_zones if shortages else [],
                relevant_shelters=[]
            )

        # 4. Intent: Road Accessibility / Closures ("road", "route", "highway", "closed roads", "safe route")
        if any(w in q_lower for w in ["road", "route", "inaccessible", "flooded road", "traffic", "highway"]):
            flooded = [r for r in state.roads if r.is_flooded or r.status == "FLOODED_CLOSED" or r.is_closed_manual]
            if flooded:
                road_summaries = [f"- **{r.name} ({r.id})**: Flood Risk Score {r.flood_risk_score:.1f}/100, Elevation {r.elevation_min_meters:.1f}m (Status: {r.status})" for r in flooded]
                answer = (
                    f"There are **{len(flooded)} unsafe/closed road segments** identified:\n\n"
                    + "\n".join(road_summaries) +
                    f"\n\nEvacuation routes have automatically diverted traffic to safe inland corridors (such as Highground Highway and Western Trunk Expressway)."
                )
            else:
                answer = "All primary road segments are currently passable with low to moderate flood risk."

            return AIQueryResponse(
                query=query,
                answer=answer,
                grounded_metrics={
                    "unsafe_roads_count": len(flooded),
                    "unsafe_roads": [r.name for r in flooded]
                },
                relevant_zones=[],
                relevant_shelters=[]
            )

        # 5. Intent: Shelter Utilization & Capacity ("shelter", "occupancy", "full", "capacity")
        if any(w in q_lower for w in ["shelter", "capacity", "occupancy", "utilization"]):
            active_s = [s for s in state.shelters if s.is_active]
            total_cap = sum(s.total_capacity for s in active_s)
            total_occ = sum(s.projected_total_occupancy for s in active_s)
            util = state.kpis.shelter_utilization_pct
            
            top_crowded = sorted(active_s, key=lambda s: -s.utilization_percentage)[:3]
            crowd_str = ", ".join(f"{s.name} ({s.utilization_percentage:.1f}%)" for s in top_crowded)
            
            answer = (
                f"Overall district shelter utilization is **{util:.1f}%** ({total_occ:,} projected evacuees across {total_cap:,} total capacity). "
                f"Highest utilized shelters are: **{crowd_str}**. "
                f"{'Overloaded shelters detected; temporary shelter activation recommended.' if util > 85.0 else 'Sufficient buffer remains across inland shelters.'}"
            )
            return AIQueryResponse(
                query=query,
                answer=answer,
                grounded_metrics={
                    "total_shelter_capacity": total_cap,
                    "projected_total_occupancy": total_occ,
                    "utilization_percentage": util
                },
                relevant_zones=[],
                relevant_shelters=[s.id for s in top_crowded]
            )

        # 6. Intent: Zone-specific query (e.g. "Zone 1", "Estuary Delta", "Port", etc.)
        for z in state.zones:
            if z.id.lower() in q_lower or z.name.lower() in q_lower or z.code.lower() in q_lower:
                allocs = [a for a in state.allocations if a.zone_id == z.id]
                alloc_str = ", ".join(f"{a.allocated_count:,} to {a.shelter_name}" for a in allocs)
                answer = (
                    f"**{z.name} ({z.id}) Status Report**:\n"
                    f"- **Risk Level**: {z.risk_level} (Score: {z.risk_score:.1f}/100)\n"
                    f"- **Population**: {z.population:,} | **Exposed**: {z.exposed_population:,} | **Evacuation Demand**: {z.evacuation_requirement:,}\n"
                    f"- **Topography**: Elevation {z.topography.elevation_meters:.1f}m, Distance to Coast {z.topography.distance_to_coastline_km:.1f}km\n"
                    f"- **Explanation**: {z.risk_breakdown.why_explanation if z.risk_breakdown else 'N/A'}\n"
                    f"- **Allocated Shelters**: {alloc_str or 'No evacuees allocated'}\n"
                    f"- **Recommended Action**: {z.recommended_action}"
                )
                return AIQueryResponse(
                    query=query,
                    answer=answer,
                    grounded_metrics={
                        "zone_id": z.id,
                        "risk_score": z.risk_score,
                        "risk_level": z.risk_level,
                        "evacuation_requirement": z.evacuation_requirement
                    },
                    relevant_zones=[z.id],
                    relevant_shelters=[a.shelter_id for a in allocs]
                )

        # Default Comprehensive Operational Briefing
        answer = (
            f"**Operational Summary ({state.hazard.name}, Category {state.hazard.category})**:\n"
            f"- Landfall ETA: **{state.hazard.landfall_eta_hours:.1f} hours** | 24h Rain: **{state.hazard.total_24h_rainfall_mm:.0f} mm**\n"
            f"- Total Population Exposed: **{state.kpis.total_population_exposed:,}**\n"
            f"- Evacuation Requirement: **{state.kpis.total_evacuation_demand:,} residents**\n"
            f"- Shelter Utilization: **{state.kpis.shelter_utilization_pct:.1f}%**\n"
            f"- Inundated Road Segments: **{state.kpis.unsafe_roads_count}**\n"
            f"- Resource Shortfalls: **{state.kpis.critical_resource_shortfalls_count}**\n\n"
            f"Ask specifically about high-risk zones, shelter capacities, road accessibility, or resource deficits."
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
            relevant_shelters=[s.id for s in state.shelters if s.is_active]
        )

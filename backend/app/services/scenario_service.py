"""
Scenario Orchestration Service.
Coordinates the end-to-end execution of all deterministic decision engines
and computes differential impact analysis for What-If simulation experiments.
"""
from typing import Optional, List, Dict, Any
from backend.app.models.geography import Zone
from backend.app.models.infrastructure import Shelter, Hospital, RoadSegment, TemporaryShelterCandidate
from backend.app.models.hazard import HazardTelemetry
from backend.app.models.response import (
    ShelterAllocationItem,
    EvacuationRoute,
    ResourceDeploymentItem,
    EmergencyAlert,
    OperationalKPIs
)
from backend.app.models.scenario import (
    SimulationOverrides,
    SimulationComparisonDiff,
    MetricDelta,
    PriorityActionItem,
    DistrictState
)
from backend.app.services.data_loader import (
    get_initial_hazard_telemetry,
    get_seed_zones,
    get_seed_shelters,
    get_seed_temporary_shelter_candidates,
    get_seed_hospitals,
    get_seed_roads
)
from backend.app.services.census_service import get_official_census_data
from backend.app.engine.hazard_impact import calculate_zone_hazard_impact
from backend.app.engine.exposure import calculate_zone_exposure
from backend.app.engine.shelter_optimizer import optimize_shelter_allocation
from backend.app.engine.routing import assess_road_flood_risks, generate_evacuation_routes
from backend.app.engine.resource_planner import calculate_resource_plan
from backend.app.engine.alert_generator import generate_operational_alerts

class ScenarioService:
    def __init__(self):
        # Baseline cached data
        self.raw_hazard = get_initial_hazard_telemetry()
        self.raw_zones = get_seed_zones()
        self.raw_shelters = get_seed_shelters()
        self.raw_temp_shelters = get_seed_temporary_shelter_candidates()
        self.raw_hospitals = get_seed_hospitals()
        self.raw_roads = get_seed_roads()
        self.official_census = get_official_census_data("Cuttack", 20.48, 85.83)

    async def set_dynamic_district(
        self,
        lat: float,
        lng: float,
        district_name: str,
        hazard: HazardTelemetry
    ):
        """Sets active district geographic elements dynamically for any point on Earth."""
        from backend.app.services.dynamic_district_generator import generate_dynamic_district_data_async
        zones, shelters, temp_shelters, hospitals, roads = await generate_dynamic_district_data_async(
            center_lat=lat,
            center_lng=lng,
            district_name=district_name,
            hazard=hazard
        )
        self.raw_hazard = hazard
        self.raw_zones = zones
        self.raw_shelters = shelters
        self.raw_temp_shelters = temp_shelters
        self.raw_hospitals = hospitals
        self.raw_roads = roads
        self.official_census = get_official_census_data(district_name, lat, lng)

    def run_pipeline(self, overrides: Optional[SimulationOverrides] = None) -> DistrictState:
        """Executes the full deterministic calculation pipeline."""
        overrides = overrides or SimulationOverrides()

        # 1. Apply overrides to hazard telemetry
        hazard = self.raw_hazard.model_copy()
        hazard.total_24h_rainfall_mm = round(self.raw_hazard.total_24h_rainfall_mm * overrides.rainfall_multiplier, 1)
        hazard.rainfall_rate_mm_hr = round(self.raw_hazard.rainfall_rate_mm_hr * overrides.rainfall_multiplier, 1)
        hazard.wind_speed_kmh = round(self.raw_hazard.wind_speed_kmh * overrides.cyclone_wind_multiplier, 1)
        hazard.wind_gusts_kmh = round(self.raw_hazard.wind_gusts_kmh * overrides.cyclone_wind_multiplier, 1)
        hazard.storm_surge_meters = round(self.raw_hazard.storm_surge_meters * overrides.storm_surge_multiplier, 2)
        if overrides.landfall_eta_hours is not None:
            hazard.landfall_eta_hours = overrides.landfall_eta_hours

        # 2. Hazard & Impact Calculation on Zones
        processed_zones: List[Zone] = []
        for raw_z in self.raw_zones:
            z = raw_z.model_copy()
            score, risk_level, breakdown = calculate_zone_hazard_impact(z, hazard)
            z.risk_score = score
            z.risk_level = risk_level
            z.risk_breakdown = breakdown
            
            # Exposure calculation
            exp_pop, evac_req, action = calculate_zone_exposure(z, score, risk_level)
            z.exposed_population = exp_pop
            z.evacuation_requirement = evac_req
            z.recommended_action = action
            processed_zones.append(z)

        # 3. Road Network Inundation & Accessibility Evaluation
        assessed_roads = assess_road_flood_risks(
            roads=self.raw_roads,
            hazard=hazard,
            closed_road_ids=overrides.closed_road_ids
        )

        # 4. Shelter Optimization & Capacity Allocation
        allocations, updated_shelters, temp_shelters, unallocated_count = optimize_shelter_allocation(
            zones=processed_zones,
            shelters=self.raw_shelters,
            candidate_temporary_shelters=self.raw_temp_shelters,
            disabled_shelter_ids=overrides.disabled_shelter_ids,
            activate_temp_shelters=overrides.activate_temp_shelters
        )

        # 5. Evacuation Routing Paths
        routes = generate_evacuation_routes(
            allocations=allocations,
            zones=processed_zones,
            shelters=updated_shelters,
            roads=assessed_roads
        )

        # 6. Resource Requirements & Deficit Planning
        total_evac_demand = sum(z.evacuation_requirement for z in processed_zones)
        resources = calculate_resource_plan(
            zones=processed_zones,
            shelters=updated_shelters,
            hospitals=self.raw_hospitals,
            total_evacuation_demand=total_evac_demand,
            overrides=overrides
        )

        # 7. Dynamic Alert Generation
        alerts = generate_operational_alerts(
            hazard=hazard,
            zones=processed_zones,
            shelters=updated_shelters,
            roads=assessed_roads,
            resources=resources,
            unallocated_evacuees=unallocated_count
        )

        # 8. Operational Priority Actions
        priority_actions = self._generate_priority_actions(
            zones=processed_zones,
            roads=assessed_roads,
            resources=resources,
            unallocated_count=unallocated_count,
            hazard=hazard
        )

        # 9. Aggregate KPIs
        active_shelters = [s for s in updated_shelters if s.is_active]
        total_shelter_cap = sum(s.total_capacity for s in active_shelters)
        total_proj_occ = sum(s.projected_total_occupancy for s in active_shelters)
        utilization_pct = round((total_proj_occ / total_shelter_cap * 100.0), 1) if total_shelter_cap > 0 else 100.0

        unsafe_roads_count = len([r for r in assessed_roads if r.is_flooded or r.is_closed_manual or r.status == "FLOODED_CLOSED"])
        critical_shortfalls_count = len([res for res in resources if res.is_critical_shortage])
        avg_risk = round(sum(z.risk_score for z in processed_zones) / len(processed_zones), 1)

        kpis = OperationalKPIs(
            active_threat_level=f"CATEGORY {hazard.category} CYCLONE ({hazard.name.upper()})",
            overall_district_risk_score=avg_risk,
            total_population_exposed=sum(z.exposed_population for z in processed_zones),
            total_evacuation_demand=total_evac_demand,
            total_shelter_capacity=total_shelter_cap,
            total_current_occupancy=sum(s.current_occupancy for s in active_shelters),
            total_incoming_allocated=sum(s.incoming_allocated_evacuees for s in active_shelters),
            shelter_utilization_pct=utilization_pct,
            unsafe_roads_count=unsafe_roads_count,
            total_roads_count=len(assessed_roads),
            critical_resource_shortfalls_count=critical_shortfalls_count,
            priority_actions_count=len([p for p in priority_actions if p.status == "PENDING"])
        )

        return DistrictState(
            hazard=hazard,
            zones=processed_zones,
            shelters=updated_shelters,
            hospitals=self.raw_hospitals,
            roads=assessed_roads,
            allocations=allocations,
            routes=routes,
            resources=resources,
            alerts=alerts,
            priority_actions=priority_actions,
            temporary_shelter_candidates=temp_shelters,
            kpis=kpis,
            official_census=self.official_census,
            overrides_applied=overrides
        )

    def simulate_with_comparison(self, overrides: SimulationOverrides) -> DistrictState:
        """Runs simulation with overrides and calculates before/after differential analysis."""
        baseline_state = self.run_pipeline(SimulationOverrides()) # clean baseline
        simulated_state = self.run_pipeline(overrides)

        # Compute Deltas
        deltas: List[MetricDelta] = []
        
        # 1. Evacuation Demand
        base_evac = baseline_state.kpis.total_evacuation_demand
        sim_evac = simulated_state.kpis.total_evacuation_demand
        diff_evac = sim_evac - base_evac
        pct_evac = round((diff_evac / base_evac * 100.0), 1) if base_evac > 0 else 0.0
        deltas.append(MetricDelta(
            metric_name="Evacuation Demand",
            baseline_value=float(base_evac),
            simulated_value=float(sim_evac),
            delta_absolute=float(diff_evac),
            delta_percentage=pct_evac,
            trend="INCREASED" if diff_evac > 0 else "DECREASED" if diff_evac < 0 else "UNCHANGED",
            severity_impact="NEGATIVE" if diff_evac > 0 else "POSITIVE" if diff_evac < 0 else "NEUTRAL"
        ))

        # 2. Exposed Population
        base_exp = baseline_state.kpis.total_population_exposed
        sim_exp = simulated_state.kpis.total_population_exposed
        diff_exp = sim_exp - base_exp
        pct_exp = round((diff_exp / base_exp * 100.0), 1) if base_exp > 0 else 0.0
        deltas.append(MetricDelta(
            metric_name="Exposed Population",
            baseline_value=float(base_exp),
            simulated_value=float(sim_exp),
            delta_absolute=float(diff_exp),
            delta_percentage=pct_exp,
            trend="INCREASED" if diff_exp > 0 else "DECREASED" if diff_exp < 0 else "UNCHANGED",
            severity_impact="NEGATIVE" if diff_exp > 0 else "POSITIVE" if diff_exp < 0 else "NEUTRAL"
        ))

        # 3. Shelter Utilization %
        base_util = baseline_state.kpis.shelter_utilization_pct
        sim_util = simulated_state.kpis.shelter_utilization_pct
        diff_util = round(sim_util - base_util, 1)
        deltas.append(MetricDelta(
            metric_name="Shelter Utilization Rate",
            baseline_value=base_util,
            simulated_value=sim_util,
            delta_absolute=diff_util,
            delta_percentage=round((diff_util / base_util * 100.0), 1) if base_util > 0 else 0.0,
            trend="INCREASED" if diff_util > 0 else "DECREASED" if diff_util < 0 else "UNCHANGED",
            severity_impact="NEGATIVE" if diff_util > 0 else "POSITIVE" if diff_util < 0 else "NEUTRAL"
        ))

        # 4. Unsafe Roads Count
        base_roads = baseline_state.kpis.unsafe_roads_count
        sim_roads = simulated_state.kpis.unsafe_roads_count
        diff_roads = sim_roads - base_roads
        deltas.append(MetricDelta(
            metric_name="Inundated / Closed Roads",
            baseline_value=float(base_roads),
            simulated_value=float(sim_roads),
            delta_absolute=float(diff_roads),
            delta_percentage=round((diff_roads / base_roads * 100.0), 1) if base_roads > 0 else 0.0,
            trend="INCREASED" if diff_roads > 0 else "DECREASED" if diff_roads < 0 else "UNCHANGED",
            severity_impact="NEGATIVE" if diff_roads > 0 else "POSITIVE" if diff_roads < 0 else "NEUTRAL"
        ))

        # Identify newly critical zones and newly closed roads
        base_crit_zones = set(z.id for z in baseline_state.zones if z.risk_level == "CRITICAL")
        sim_crit_zones = set(z.id for z in simulated_state.zones if z.risk_level == "CRITICAL")
        new_crit_zones = list(sim_crit_zones - base_crit_zones)

        base_unsafe_roads = set(r.id for r in baseline_state.roads if r.is_flooded or r.status == "FLOODED_CLOSED")
        sim_unsafe_roads = set(r.id for r in simulated_state.roads if r.is_flooded or r.status == "FLOODED_CLOSED")
        new_closed_roads = list(sim_unsafe_roads - base_unsafe_roads)

        # Build human-readable operational diff summary
        summary_points = []
        if overrides.rainfall_multiplier != 1.0:
            pct = int((overrides.rainfall_multiplier - 1.0) * 100)
            summary_points.append(f"Rainfall adjusted by {pct:+d}% ({simulated_state.hazard.total_24h_rainfall_mm:.0f}mm/24h)")
        if overrides.disabled_shelter_ids:
            summary_points.append(f"{len(overrides.disabled_shelter_ids)} shelter(s) disabled")
        if overrides.closed_road_ids:
            summary_points.append(f"{len(overrides.closed_road_ids)} road(s) manually closed")
        
        diff_summary = f"What-If Simulation Active: {', '.join(summary_points) if summary_points else 'Custom parameters applied'}. "
        if diff_evac > 0:
            diff_summary += f"Evacuation demand increased by {diff_evac:+,d} people (+{pct_evac:.1f}%). "
        if new_crit_zones:
            diff_summary += f"Zones escalated to CRITICAL: {', '.join(new_crit_zones)}. "
        if new_closed_roads:
            diff_summary += f"Additional flooded road segments: {', '.join(new_closed_roads)}. "

        comparison_diff = SimulationComparisonDiff(
            is_simulation_active=True,
            summary=diff_summary,
            key_deltas=deltas,
            new_critical_zones=new_crit_zones,
            new_closed_roads=new_closed_roads,
            evacuees_reallocated_count=abs(diff_evac),
            temporary_shelters_needed=simulated_state.kpis.shelter_utilization_pct > 85.0
        )

        simulated_state.simulation_diff = comparison_diff
        return simulated_state

    def _generate_priority_actions(
        self,
        zones: List[Zone],
        roads: List[RoadSegment],
        resources: List[ResourceDeploymentItem],
        unallocated_count: int,
        hazard: HazardTelemetry
    ) -> List[PriorityActionItem]:
        """Generates ranked operational action items for the command center."""
        actions: List[PriorityActionItem] = []
        rank = 1

        # 1. Critical zone mandatory evacuations
        critical_zones = [z for z in zones if z.risk_level == "CRITICAL"]
        for z in sorted(critical_zones, key=lambda x: -x.risk_score):
            actions.append(PriorityActionItem(
                id=f"ACT-0{rank}",
                priority_rank=rank,
                category="EVACUATION",
                title=f"Execute Mandatory Evacuation: {z.name}",
                zone_id=z.id,
                target_name=z.name,
                urgency="IMMEDIATE",
                timeframe_mins=int(hazard.landfall_eta_hours * 30),
                rationale=f"{z.evacuation_requirement:,} residents exposed to critical flood risk (Risk Score: {z.risk_score:.1f})."
            ))
            rank += 1

        # 2. Road closures and bypass enforcement
        flooded_roads = [r for r in roads if r.is_flooded or r.status == "FLOODED_CLOSED"]
        for r in flooded_roads[:2]:
            actions.append(PriorityActionItem(
                id=f"ACT-0{rank}",
                priority_rank=rank,
                category="ROUTING",
                title=f"Enforce Closure on {r.name}",
                target_name=r.name,
                urgency="IMMEDIATE",
                timeframe_mins=45,
                rationale="Road segment predicted impassable due to coastal storm surge & heavy runoff."
            ))
            rank += 1

        # 3. Resource requisitions
        bus_res = next((res for res in resources if "Buses" in res.resource_type and res.is_critical_shortage), None)
        if bus_res:
            actions.append(PriorityActionItem(
                id=f"ACT-0{rank}",
                priority_rank=rank,
                category="LOGISTICS",
                title=f"Requisition {bus_res.shortfall_count} Mutual-Aid Evacuation Buses",
                target_name="State Transit Fleet Reserve",
                urgency="HIGH",
                timeframe_mins=60,
                rationale=f"District bus fleet deficit ({bus_res.shortfall_count} vehicles short) to fulfill mandatory evacuation."
            ))
            rank += 1

        # 4. Temporary Shelter Activation if needed
        if unallocated_count > 0:
            actions.append(PriorityActionItem(
                id=f"ACT-0{rank}",
                priority_rank=rank,
                category="SHELTER",
                title="Activate Western Hills University Temporary Shelter Complex",
                target_name="Western Hills University Convention Center",
                urgency="IMMEDIATE",
                timeframe_mins=90,
                rationale=f"Primary shelter capacity exhausted with {unallocated_count} unallocated evacuees."
            ))
            rank += 1

        return actions

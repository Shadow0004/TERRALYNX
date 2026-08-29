export interface Coordinates {
  lat: number;
  lng: number;
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'WATCH' | 'SAFE';
export type AlertTier = 'CRITICAL' | 'WARNING' | 'WATCH' | 'INFO';
export type RoadStatus = 'OPEN' | 'CAUTION' | 'FLOODED_CLOSED' | 'MANUAL_CLOSED';

export interface HazardTelemetry {
  id: string;
  name: string;
  category: number;
  hazard_type: string;
  center_coordinates: Coordinates;
  landfall_eta_hours: number;
  wind_speed_kmh: number;
  wind_gusts_kmh: number;
  rainfall_rate_mm_hr: number;
  total_24h_rainfall_mm: number;
  storm_surge_meters: number;
  movement_speed_kmh: number;
  movement_direction: string;
  wind_direction_deg?: number;
  pressure_hpa: number;
  status: string;
}

export interface DemographicVulnerability {
  elderly_percent: number;
  children_percent: number;
  non_engineered_housing_percent: number;
  medical_dependency_count: number;
}

export interface Topography {
  elevation_meters: number;
  slope_degrees: number;
  soil_saturation_percent: number;
  drainage_capacity_score: number;
  distance_to_coastline_km: number;
  distance_to_river_km: number;
}

export interface ZoneRiskBreakdown {
  rainfall_component: number;
  surge_component: number;
  elevation_component: number;
  wind_component: number;
  drainage_deficit_component: number;
  total_score: number;
  risk_level: RiskLevel;
  why_explanation: string;
}

export interface Zone {
  id: string;
  name: string;
  code: string;
  population: number;
  area_sq_km: number;
  center: Coordinates;
  polygon_coordinates: [number, number][];
  topography: Topography;
  demographics: DemographicVulnerability;
  risk_score: number;
  risk_level: RiskLevel;
  exposed_population: number;
  evacuation_requirement: number;
  risk_breakdown?: ZoneRiskBreakdown;
  nearby_infrastructure_ids: string[];
  recommended_action: string;
}

export interface Shelter {
  id: string;
  name: string;
  type: string;
  zone_id: string;
  location: Coordinates;
  elevation_meters: number;
  total_capacity: number;
  current_occupancy: number;
  safety_score: number;
  is_active: boolean;
  has_backup_power: boolean;
  has_medical_station: boolean;
  water_capacity_liters: number;
  food_supply_days: number;
  incoming_allocated_evacuees: number;
  projected_total_occupancy: number;
  remaining_capacity: number;
  utilization_percentage: number;
  is_overloaded: boolean;
  assigned_zone_ids: string[];
}

export interface TemporaryShelterCandidate {
  id: string;
  name: string;
  address: string;
  location: Coordinates;
  elevation_meters: number;
  potential_capacity: number;
  suitability_score: number;
  activation_readiness_hours: number;
  distance_to_overflow_zones_km: number;
  rationale: string;
}

export interface Hospital {
  id: string;
  name: string;
  zone_id: string;
  location: Coordinates;
  total_beds: number;
  icu_beds: number;
  available_beds: number;
  elevation_meters: number;
  has_backup_power: boolean;
  is_flood_threatened: boolean;
  ambulance_count: number;
}

export interface RoadSegment {
  id: string;
  name: string;
  from_zone_id: string;
  to_zone_id: string;
  distance_km: number;
  typical_travel_time_mins: number;
  elevation_min_meters: number;
  drainage_quality: number;
  lanes: number;
  coordinates: [number, number][];
  is_closed_manual: boolean;
  is_flooded: boolean;
  flood_risk_score: number;
  estimated_time_to_impassable_mins?: number;
  recommended_for_evacuation: boolean;
  status: RoadStatus;
}

export interface ShelterAllocationItem {
  zone_id: string;
  zone_name: string;
  shelter_id: string;
  shelter_name: string;
  allocated_count: number;
  estimated_transit_time_mins: number;
  recommended_route_id: string;
  route_status: string;
}

export interface EvacuationRoute {
  id: string;
  from_zone_id: string;
  from_zone_name: string;
  to_shelter_id: string;
  to_shelter_name: string;
  path_coordinates: [number, number][];
  total_distance_km: number;
  estimated_travel_time_mins: number;
  route_risk_level: string;
  used_road_ids: string[];
  unsafe_road_warnings: string[];
  is_primary: boolean;
}

export interface ResourceDeploymentItem {
  resource_type: string;
  unit: string;
  required_count: number;
  available_count: number;
  shortfall_count: number;
  is_critical_shortage: boolean;
  priority_deployment_zones: string[];
  notes: string;
}

export interface EmergencyAlert {
  id: string;
  timestamp: string;
  tier: AlertTier;
  title: string;
  message: string;
  target_zone_ids: string[];
  action_required: string;
  trigger_metric: string;
}

export interface PriorityActionItem {
  id: string;
  priority_rank: number;
  category: string;
  title: string;
  zone_id?: string;
  target_name: string;
  urgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM';
  timeframe_mins: number;
  rationale: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface OperationalKPIs {
  active_threat_level: string;
  overall_district_risk_score: number;
  total_population_exposed: number;
  total_evacuation_demand: number;
  total_shelter_capacity: number;
  total_current_occupancy: number;
  total_incoming_allocated: number;
  shelter_utilization_pct: number;
  unsafe_roads_count: number;
  total_roads_count: number;
  critical_resource_shortfalls_count: number;
  priority_actions_count: number;
}

export interface MetricDelta {
  metric_name: string;
  baseline_value: number;
  simulated_value: number;
  delta_absolute: number;
  delta_percentage: number;
  trend: 'INCREASED' | 'DECREASED' | 'UNCHANGED';
  severity_impact: 'NEGATIVE' | 'POSITIVE' | 'NEUTRAL';
}

export interface SimulationComparisonDiff {
  is_simulation_active: boolean;
  summary: string;
  key_deltas: MetricDelta[];
  new_critical_zones: string[];
  new_closed_roads: string[];
  evacuees_reallocated_count: number;
  temporary_shelters_needed: boolean;
}

export interface SimulationOverrides {
  rainfall_multiplier: number;
  cyclone_wind_multiplier: number;
  storm_surge_multiplier: number;
  landfall_eta_hours?: number;
  disabled_shelter_ids: string[];
  closed_road_ids: string[];
  available_buses_override?: number;
  available_boats_override?: number;
  available_teams_override?: number;
}

export interface DistrictState {
  hazard: HazardTelemetry;
  zones: Zone[];
  shelters: Shelter[];
  hospitals: Hospital[];
  roads: RoadSegment[];
  allocations: ShelterAllocationItem[];
  routes: EvacuationRoute[];
  resources: ResourceDeploymentItem[];
  alerts: EmergencyAlert[];
  priority_actions: PriorityActionItem[];
  temporary_shelter_candidates: TemporaryShelterCandidate[];
  kpis: OperationalKPIs;
  simulation_diff?: SimulationComparisonDiff;
  overrides_applied: SimulationOverrides;
}

export interface AIQueryResponse {
  query: string;
  answer: string;
  grounded_metrics: Record<string, any>;
  relevant_zones: string[];
  relevant_shelters: string[];
  confidence_score: number;
}

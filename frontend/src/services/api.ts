import { DistrictState, SimulationOverrides, AIQueryResponse, Zone } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

export const apiService = {
  async fetchCurrentScenario(): Promise<DistrictState> {
    const res = await fetch(`${API_BASE_URL}/scenario/current`);
    if (!res.ok) {
      throw new Error(`Failed to fetch current scenario: ${res.statusText}`);
    }
    return res.json();
  },

  async runSimulation(overrides: SimulationOverrides): Promise<DistrictState> {
    const res = await fetch(`${API_BASE_URL}/scenario/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(overrides),
    });
    if (!res.ok) {
      throw new Error(`Simulation failed: ${res.statusText}`);
    }
    return res.json();
  },

  async resetScenario(): Promise<DistrictState> {
    const res = await fetch(`${API_BASE_URL}/scenario/reset`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`Failed to reset scenario: ${res.statusText}`);
    }
    return res.json();
  },

  async fetchZone(zoneId: string): Promise<Zone> {
    const res = await fetch(`${API_BASE_URL}/zones/${zoneId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch zone ${zoneId}: ${res.statusText}`);
    }
    return res.json();
  },

  async queryAI(query: string, apiKey?: string, modelName?: string): Promise<AIQueryResponse> {
    const res = await fetch(`${API_BASE_URL}/ai/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        api_key: apiKey || undefined,
        model_name: modelName || 'gemini-2.5-flash',
      }),
    });
    if (!res.ok) {
      throw new Error(`AI query failed: ${res.statusText}`);
    }
    return res.json();
  },

  async fetchLiveWeather(lat: number = 19.8135, lng: number = 85.8312, location: string = 'Purva Coastal District'): Promise<DistrictState> {
    const res = await fetch(`${API_BASE_URL}/weather/live?lat=${lat}&lng=${lng}&location=${encodeURIComponent(location)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch live weather telemetry: ${res.statusText}`);
    }
    return res.json();
  },

  async fetchRadarInfo(): Promise<{ available: boolean; tile_url: string | null; attribution: string }> {
    const res = await fetch(`${API_BASE_URL}/weather/radar`);
    if (!res.ok) {
      return { available: false, tile_url: null, attribution: '' };
    }
    return res.json();
  },

  async fetchPointTelemetry(lat: number, lng: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/weather/point?lat=${lat}&lng=${lng}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch point telemetry: ${res.statusText}`);
    }
    return res.json();
  },

  async fetchRegionalWindGrid(lat: number, lng: number, radiusDeg: number = 0.35): Promise<{
    center: { lat: number; lng: number };
    radius_deg: number;
    grid_points: Array<{
      lat: number;
      lng: number;
      wind_speed_kmh: number;
      wind_direction_deg: number;
      wind_gusts_kmh: number;
      cardinal: string;
      u_ms: number;
      v_ms: number;
      surface_pressure_hpa: number;
    }>;
    total_stations: number;
    updated_at: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/weather/wind-grid?lat=${lat}&lng=${lng}&radius_deg=${radiusDeg}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch wind grid: ${res.statusText}`);
    }
    return res.json();
  },
};

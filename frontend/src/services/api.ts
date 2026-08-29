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

  async queryAI(query: string): Promise<AIQueryResponse> {
    const res = await fetch(`${API_BASE_URL}/ai/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
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
};

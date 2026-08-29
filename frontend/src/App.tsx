import React, { useState, useEffect } from 'react';
import { DistrictState, SimulationOverrides } from './types';
import { apiService } from './services/api';
import { Header } from './components/layout/Header';
import { Navigation, NavTab } from './components/layout/Navigation';
import { CommandCenterView } from './components/command_center/CommandCenterView';
import { RiskMap } from './components/map/RiskMap';
import { SheltersView } from './components/shelter/SheltersView';
import { EvacuationRouteViewer } from './components/routing/EvacuationRouteViewer';
import { ResourcePlannerTable } from './components/resources/ResourcePlannerTable';
import { WhatIfSimulator } from './components/simulator/WhatIfSimulator';
import { DecisionAssistant } from './components/ai_assistant/DecisionAssistant';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [state, setState] = useState<DistrictState | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('command_center');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isLiveFeed, setIsLiveFeed] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadScenario = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.fetchCurrentScenario();
      setState(data);
      setIsLiveFeed(data.hazard.status === 'LIVE_FEED');
    } catch (err: any) {
      setError(err.message || 'Failed to connect to TerraLynx Decision API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScenario();
  }, []);

  const handleFetchLiveWeather = async (
    lat: number = 19.8135,
    lng: number = 85.8312,
    location: string = 'Purva Coastal District (Puri Coast)'
  ) => {
    try {
      setIsSimulating(true);
      const liveData = await apiService.fetchLiveWeather(lat, lng, location);
      setState(liveData);
      setIsLiveFeed(true);
    } catch (err: any) {
      alert(`Live weather fetch failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRunSimulation = async (overrides: SimulationOverrides) => {
    try {
      setIsSimulating(true);
      const updated = await apiService.runSimulation(overrides);
      setState(updated);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetSimulation = async () => {
    try {
      setIsSimulating(true);
      const reset = await apiService.resetScenario();
      setState(reset);
      setIsLiveFeed(false);
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExecuteAction = (actionId: string) => {
    if (!state) return;
    const updatedActions = state.priority_actions.map((act) =>
      act.id === actionId ? { ...act, status: 'COMPLETED' as const } : act
    );
    setState({
      ...state,
      priority_actions: updatedActions,
      kpis: {
        ...state.kpis,
        priority_actions_count: updatedActions.filter((a) => a.status === 'PENDING').length,
      },
    });
  };

  const handleToggleShelter = async (shelterId: string) => {
    if (!state) return;
    const currentDisabled = state.overrides_applied.disabled_shelter_ids || [];
    const newDisabled = currentDisabled.includes(shelterId)
      ? currentDisabled.filter((id) => id !== shelterId)
      : [...currentDisabled, shelterId];

    await handleRunSimulation({
      ...state.overrides_applied,
      disabled_shelter_ids: newDisabled,
    });
  };

  if (isLoading && !state) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center text-slate-300">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 mb-4 shadow-2xl">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-base font-bold font-mono tracking-wider text-white">
          INITIALIZING TERRALYNX COMMAND SYSTEM...
        </h2>
        <p className="text-xs text-slate-500 font-mono mt-1">
          Loading Purva Coastal District GIS telemetry & response graphs
        </p>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center p-4">
        <div className="bg-[#141b2a] border border-red-900/60 rounded-xl p-6 max-w-md w-full text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-sm font-bold text-white font-mono">CONNECTION TO BACKEND FAILED</h2>
          <p className="text-xs text-slate-400">{error}</p>
          <button
            onClick={loadScenario}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs rounded-lg transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const criticalAlertsCount = state?.alerts.filter((a) => a.tier === 'CRITICAL').length || 0;
  const resourceShortfallsCount = state?.resources.filter((r) => r.is_critical_shortage).length || 0;

  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col font-sans">
      {/* 1. Master Header */}
      <Header
        state={state}
        onResetSimulation={handleResetSimulation}
        onFetchLiveWeather={handleFetchLiveWeather}
        isSimulating={isSimulating}
        isLiveFeed={isLiveFeed}
      />

      {/* 2. Navigation Module Tabs */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        criticalAlertsCount={criticalAlertsCount}
        resourceShortfallsCount={resourceShortfallsCount}
      />

      {/* Live Open-Meteo Telemetry Status Banner */}
      {isLiveFeed && state && (
        <div className="bg-emerald-950/70 border-b border-emerald-500/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-mono font-bold text-emerald-300">
              OPEN-METEO LIVE TELEMETRY ACTIVE:
            </span>
            <span className="text-emerald-100 font-semibold">
              {state.hazard.name}
            </span>
            <span className="text-emerald-400 font-mono">
              (Rain 24h: {state.hazard.total_24h_rainfall_mm}mm • Wind Gusts: {state.hazard.wind_gusts_kmh}km/h • Pressure: {state.hazard.pressure_hpa}hPa)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-emerald-400 font-mono">Switch Sector:</span>
            <button
              onClick={() => handleFetchLiveWeather(19.8135, 85.8312, 'Purva Coast (Puri)')}
              className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 font-mono text-[11px] transition-colors"
            >
              Puri Coast
            </button>
            <button
              onClick={() => handleFetchLiveWeather(13.0827, 80.2707, 'Chennai Coastal Sector')}
              className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 font-mono text-[11px] transition-colors"
            >
              Chennai
            </button>
            <button
              onClick={() => handleFetchLiveWeather(18.9220, 72.8347, 'Mumbai Coastal Sector')}
              className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 font-mono text-[11px] transition-colors"
            >
              Mumbai
            </button>
            <button
              onClick={() => handleFetchLiveWeather(17.6868, 83.2185, 'Visakhapatnam Harbor')}
              className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 font-mono text-[11px] transition-colors"
            >
              Vizag
            </button>
            <button
              onClick={() => handleFetchLiveWeather(22.5726, 88.3639, 'Sundarbans Delta (Kolkata)')}
              className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 font-mono text-[11px] transition-colors"
            >
              Kolkata
            </button>
            <button
              onClick={handleResetSimulation}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 font-mono text-[11px] transition-colors"
              title="Return to baseline simulated Cyclone Varuna"
            >
              ✕ Return to Demo
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Operational Content Body */}
      <main className="flex-1 p-4 max-w-[1600px] w-full mx-auto">
        {state && (
          <>
            {activeTab === 'command_center' && (
              <CommandCenterView
                state={state}
                onExecuteAction={handleExecuteAction}
                onNavigateToMap={() => setActiveTab('risk_map')}
                onNavigateToSimulator={() => setActiveTab('simulator')}
              />
            )}

            {activeTab === 'risk_map' && (
              <RiskMap
                zones={state.zones}
                shelters={state.shelters}
                hospitals={state.hospitals}
                roads={state.roads}
                routes={state.routes}
                allocations={state.allocations}
                hazard={state.hazard}
                onSetSimulationFocus={(lat, lng) =>
                  handleFetchLiveWeather(lat, lng, `Pinpoint Sector (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`)
                }
              />
            )}

            {activeTab === 'shelters_evac' && (
              <SheltersView
                shelters={state.shelters}
                allocations={state.allocations}
                candidates={state.temporary_shelter_candidates}
                onToggleShelter={handleToggleShelter}
              />
            )}

            {activeTab === 'routing' && (
              <EvacuationRouteViewer
                routes={state.routes}
                roads={state.roads}
              />
            )}

            {activeTab === 'resources' && (
              <ResourcePlannerTable
                resources={state.resources}
              />
            )}

            {activeTab === 'simulator' && (
              <WhatIfSimulator
                state={state}
                onRunSimulation={handleRunSimulation}
                onReset={handleResetSimulation}
                isSimulating={isSimulating}
              />
            )}

            {activeTab === 'ai_assistant' && (
              <DecisionAssistant state={state} />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;

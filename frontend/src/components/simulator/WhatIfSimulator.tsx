import React, { useState } from 'react';
import { Sliders, Play, RotateCcw, AlertTriangle, ArrowRight, TrendingUp, TrendingDown, Home, ShieldAlert, Truck, Droplets, Wind, Waves, CheckCircle } from 'lucide-react';
import { DistrictState, SimulationOverrides, SimulationComparisonDiff } from '../../types';

interface WhatIfSimulatorProps {
  state: DistrictState;
  onRunSimulation: (overrides: SimulationOverrides) => void;
  onReset: () => void;
  isSimulating: boolean;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  state,
  onRunSimulation,
  onReset,
  isSimulating,
}) => {
  // Local state for interactive controls initialized with active overrides
  const [rainMultiplier, setRainMultiplier] = useState<number>(state.overrides_applied.rainfall_multiplier || 1.0);
  const [windMultiplier, setWindMultiplier] = useState<number>(state.overrides_applied.cyclone_wind_multiplier || 1.0);
  const [surgeMultiplier, setSurgeMultiplier] = useState<number>(state.overrides_applied.storm_surge_multiplier || 1.0);
  const [landfallEta, setLandfallEta] = useState<number>(state.hazard.landfall_eta_hours || 4.5);
  const [disabledShelters, setDisabledShelters] = useState<string[]>(state.overrides_applied.disabled_shelter_ids || []);
  const [closedRoads, setClosedRoads] = useState<string[]>(state.overrides_applied.closed_road_ids || []);
  const [availableBuses, setAvailableBuses] = useState<number>(state.overrides_applied.available_buses_override ?? 36);

  const toggleShelter = (id: string) => {
    setDisabledShelters((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleRoad = (id: string) => {
    setClosedRoads((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleApplyPreset = (preset: {
    rain: number;
    wind: number;
    surge: number;
    disabledS?: string[];
    closedR?: string[];
    buses?: number;
  }) => {
    setRainMultiplier(preset.rain);
    setWindMultiplier(preset.wind);
    setSurgeMultiplier(preset.surge);
    if (preset.disabledS !== undefined) setDisabledShelters(preset.disabledS);
    if (preset.closedR !== undefined) setClosedRoads(preset.closedR);
    if (preset.buses !== undefined) setAvailableBuses(preset.buses);
  };

  const handleSimulate = () => {
    const overrides: SimulationOverrides = {
      rainfall_multiplier: rainMultiplier,
      cyclone_wind_multiplier: windMultiplier,
      storm_surge_multiplier: surgeMultiplier,
      landfall_eta_hours: landfallEta,
      disabled_shelter_ids: disabledShelters,
      closed_road_ids: closedRoads,
      available_buses_override: availableBuses,
    };
    onRunSimulation(overrides);
  };

  const diff: SimulationComparisonDiff | undefined = state.simulation_diff;

  return (
    <div className="space-y-4">
      {/* Simulator Hero & Preset Bar */}
      <div className="bg-[#111622] border border-[#212b40] rounded-xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#1b2334]">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide font-mono uppercase flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <span>What-If Operational Scenario Simulator</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Alter hazard parameters, facility outages, and road washouts to instantly recalculate the entire response plan
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleApplyPreset({ rain: 1.30, wind: 1.0, surge: 1.0 })}
              className="px-2.5 py-1 text-xs font-mono rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-700/60 transition-colors"
            >
              +30% Rainfall
            </button>
            <button
              onClick={() => handleApplyPreset({ rain: 1.0, wind: 1.0, surge: 1.0, closedR: ['ROAD-14'] })}
              className="px-2.5 py-1 text-xs font-mono rounded bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-700/60 transition-colors"
            >
              Road 14 Washout
            </button>
            <button
              onClick={() => handleApplyPreset({ rain: 1.0, wind: 1.0, surge: 1.0, disabledS: ['SHELTER-02'] })}
              className="px-2.5 py-1 text-xs font-mono rounded bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 transition-colors"
            >
              Shelter #2 Outage
            </button>
            <button
              onClick={() => handleApplyPreset({ rain: 1.45, wind: 1.30, surge: 1.50, buses: 20 })}
              className="px-2.5 py-1 text-xs font-mono rounded bg-red-950 hover:bg-red-900 text-red-200 border border-red-700 transition-colors"
            >
              Cat-4 Escalation
            </button>
          </div>
        </div>

        {/* Live Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 text-xs">
          {/* 1. Rainfall Multiplier Slider */}
          <div className="bg-[#141b2a] border border-[#222e44] p-3 rounded-lg">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center space-x-1.5 font-semibold">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <span>Precipitation Multiplier</span>
              </span>
              <span className="font-mono font-bold text-cyan-300">
                {((rainMultiplier - 1.0) * 100).toFixed(0)}% ({(260 * rainMultiplier).toFixed(0)}mm)
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={rainMultiplier}
              onChange={(e) => setRainMultiplier(parseFloat(e.target.value))}
              className="w-full mt-2 accent-cyan-400 bg-[#1e293b] rounded h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>-50%</span>
              <span>Baseline (1.0x)</span>
              <span>+100%</span>
            </div>
          </div>

          {/* 2. Sustained Wind Multiplier */}
          <div className="bg-[#141b2a] border border-[#222e44] p-3 rounded-lg">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center space-x-1.5 font-semibold">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cyclone Wind Force</span>
              </span>
              <span className="font-mono font-bold text-amber-300">
                {(145 * windMultiplier).toFixed(0)} km/h
              </span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.6"
              step="0.05"
              value={windMultiplier}
              onChange={(e) => setWindMultiplier(parseFloat(e.target.value))}
              className="w-full mt-2 accent-amber-400 bg-[#1e293b] rounded h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>Cat 2 (100km/h)</span>
              <span>Cat 3</span>
              <span>Cat 5 (230km/h)</span>
            </div>
          </div>

          {/* 3. Storm Surge Height */}
          <div className="bg-[#141b2a] border border-[#222e44] p-3 rounded-lg">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center space-x-1.5 font-semibold">
                <Waves className="w-3.5 h-3.5 text-indigo-400" />
                <span>Coastal Surge Height</span>
              </span>
              <span className="font-mono font-bold text-indigo-300">
                {(1.8 * surgeMultiplier).toFixed(1)} meters
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={surgeMultiplier}
              onChange={(e) => setSurgeMultiplier(parseFloat(e.target.value))}
              className="w-full mt-2 accent-indigo-400 bg-[#1e293b] rounded h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0.9m (Low)</span>
              <span>1.8m (Nominal)</span>
              <span>4.5m (Extreme)</span>
            </div>
          </div>

          {/* 4. Available Bus Fleet */}
          <div className="bg-[#141b2a] border border-[#222e44] p-3 rounded-lg">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center space-x-1.5 font-semibold">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Available Bus Fleet</span>
              </span>
              <span className="font-mono font-bold text-emerald-300">{availableBuses} buses</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="1"
              value={availableBuses}
              onChange={(e) => setAvailableBuses(parseInt(e.target.value))}
              className="w-full mt-2 accent-emerald-400 bg-[#1e293b] rounded h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>10 (Depleted)</span>
              <span>36 (Baseline)</span>
              <span>60 (Reinforced)</span>
            </div>
          </div>
        </div>

        {/* Facility Outages & Road Blockages Toggles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Shelter Availability Toggles */}
          <div className="bg-[#141b2a] border border-[#222e44] p-3 rounded-lg">
            <span className="font-mono font-bold text-slate-300 text-[11px] uppercase block mb-2">
              Toggle Facility Outages (Simulate Shelter Flooding / Structural Compromise)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {state.shelters.map((s) => {
                const isDisabled = disabledShelters.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleShelter(s.id)}
                    className={`p-2 rounded border text-left flex items-center justify-between text-xs transition-colors ${
                      isDisabled
                        ? 'bg-red-950/80 border-red-700 text-red-200'
                        : 'bg-[#0e1320] border-[#222e44] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span className="truncate pr-1">{s.name}</span>
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${isDisabled ? 'bg-red-900 text-white' : 'bg-[#1b2436] text-emerald-400'}`}>
                      {isDisabled ? 'OFFLINE' : 'ONLINE'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Road Blockage Toggles */}
          <div className="bg-[#141b2a] border border-[#222e44] p-3 rounded-lg">
            <span className="font-mono font-bold text-slate-300 text-[11px] uppercase block mb-2">
              Toggle Road Segment Closures (Simulate Bridge Washout / Tree Blockage)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {state.roads.slice(0, 6).map((r) => {
                const isClosed = closedRoads.includes(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => toggleRoad(r.id)}
                    className={`p-2 rounded border text-left flex items-center justify-between text-xs transition-colors ${
                      isClosed
                        ? 'bg-amber-950/80 border-amber-700 text-amber-200'
                        : 'bg-[#0e1320] border-[#222e44] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span className="truncate pr-1">{r.name}</span>
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${isClosed ? 'bg-amber-900 text-white' : 'bg-[#1b2436] text-slate-400'}`}>
                      {isClosed ? 'BLOCKED' : 'OPEN'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1b2334]">
          <button
            onClick={onReset}
            disabled={isSimulating}
            className="px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-[#141b2a] hover:bg-[#1a2438] text-slate-300 border border-[#232f48] flex items-center space-x-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Parameters to Baseline</span>
          </button>

          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="px-6 py-2.5 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg flex items-center space-x-2 transition-all transform active:scale-95"
          >
            {isSimulating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Recalculating Decision Graph...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>SIMULATE & RECALCULATE RESPONSE PLAN</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Differential Impact Comparison HUD (Appears when simulation active) */}
      {diff && diff.is_simulation_active && (
        <div className="bg-gradient-to-br from-[#171322] to-[#121828] border border-amber-500/50 rounded-xl p-5 shadow-2xl space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-amber-900/40">
            <div>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-950 text-amber-300 border border-amber-600 flex items-center space-x-1.5 w-max">
                <AlertTriangle className="w-3 h-3" />
                <span>WHAT-IF DIFFERENTIAL ANALYSIS</span>
              </span>
              <h3 className="text-base font-bold text-white mt-1.5">{diff.summary}</h3>
            </div>
          </div>

          {/* Delta Metric Comparison Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {diff.key_deltas.map((d) => (
              <div key={d.metric_name} className="bg-[#101420] border border-[#202c42] p-3 rounded-lg">
                <span className="text-slate-400 text-[11px] block truncate">{d.metric_name}</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-base font-bold font-mono text-white">
                    {d.simulated_value.toLocaleString()}
                  </span>
                  <span className={`text-xs font-mono font-bold flex items-center ${d.delta_absolute > 0 ? 'text-red-400' : d.delta_absolute < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {d.delta_absolute > 0 ? '+' : ''}{d.delta_absolute.toLocaleString()} ({d.delta_percentage > 0 ? '+' : ''}{d.delta_percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  Baseline: {d.baseline_value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Specific Recalculated Shifts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {diff.new_critical_zones.length > 0 && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200">
                <span className="font-bold font-mono text-red-400 block mb-1">
                  🔴 Newly Escalated Critical Zones:
                </span>
                {diff.new_critical_zones.join(', ')} require mandatory immediate evacuation orders.
              </div>
            )}

            {diff.new_closed_roads.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-200">
                <span className="font-bold font-mono text-amber-400 block mb-1">
                  ⚠️ Newly Impassable Corridors:
                </span>
                {diff.new_closed_roads.join(', ')} — Convoys diverted to high-elevation arterial roads.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

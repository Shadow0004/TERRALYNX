import React from 'react';
import { Wind, CloudRain, Waves, Clock, Compass, Activity, Zap } from 'lucide-react';
import { HazardTelemetry } from '../../types';

interface ThreatBannerProps {
  hazard: HazardTelemetry;
}

export const ThreatBanner: React.FC<ThreatBannerProps> = ({ hazard }) => {
  return (
    <div className="bg-gradient-to-r from-[#18111e] via-[#141b2c] to-[#0f172a] border border-red-950/60 rounded-xl p-4 shadow-lg mb-4 relative overflow-hidden">
      {/* Background hazard radar effect */}
      <div className="absolute right-0 top-0 bottom-0 w-80 opacity-5 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-red-500 rounded-full animate-ping"></div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        {/* Left: Cyclone Header */}
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 rounded-xl bg-red-950/70 border border-red-500/40 flex flex-col items-center justify-center text-red-400 shrink-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-300">CAT</span>
            <span className="text-xl font-bold font-mono text-red-500 leading-none">{hazard.category}</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-red-900/60 text-red-300 border border-red-700/50">
                ACTIVE THREAT
              </span>
              <h2 className="text-xl font-bold font-mono text-white tracking-wide">
                {hazard.name.toUpperCase()}
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {hazard.hazard_type} • Heading <span className="font-mono font-semibold text-amber-300">{hazard.movement_direction}</span> at <span className="font-mono text-amber-300">{hazard.movement_speed_kmh} km/h</span>
            </p>
          </div>
        </div>

        {/* Right: Key Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Sustained Winds & Gusts */}
          <div className="bg-[#0f1422]/80 border border-[#212b40] rounded-lg px-3 py-2">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>Max Wind / Gusts</span>
            </div>
            <div className="mt-1 font-mono">
              <span className="text-base font-bold text-white">{hazard.wind_speed_kmh.toFixed(0)}</span>
              <span className="text-xs text-slate-400"> / </span>
              <span className="text-sm font-semibold text-amber-400">{hazard.wind_gusts_kmh.toFixed(0)} km/h</span>
            </div>
          </div>

          {/* 24h Rain Total */}
          <div className="bg-[#0f1422]/80 border border-[#212b40] rounded-lg px-3 py-2">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              <span>Expected Rain (24h)</span>
            </div>
            <div className="mt-1 font-mono">
              <span className="text-base font-bold text-cyan-300">{hazard.total_24h_rainfall_mm.toFixed(0)}</span>
              <span className="text-xs text-slate-400"> mm ({hazard.rainfall_rate_mm_hr.toFixed(0)} mm/h)</span>
            </div>
          </div>

          {/* Storm Surge Height */}
          <div className="bg-[#0f1422]/80 border border-[#212b40] rounded-lg px-3 py-2">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
              <Waves className="w-3.5 h-3.5 text-indigo-400" />
              <span>Peak Coastal Surge</span>
            </div>
            <div className="mt-1 font-mono">
              <span className="text-base font-bold text-indigo-300">{hazard.storm_surge_meters.toFixed(1)}</span>
              <span className="text-xs text-slate-400"> meters</span>
            </div>
          </div>

          {/* Landfall ETA */}
          <div className="bg-[#0f1422]/80 border border-amber-900/40 rounded-lg px-3 py-2">
            <div className="flex items-center space-x-1.5 text-amber-400 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Est. Coastal Landfall</span>
            </div>
            <div className="mt-1 font-mono">
              <span className="text-base font-bold text-amber-300">{hazard.landfall_eta_hours.toFixed(1)}</span>
              <span className="text-xs text-amber-400/80"> hours ETA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

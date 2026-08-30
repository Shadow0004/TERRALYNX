import React, { useState } from 'react';
import {
  Wind,
  CloudRain,
  Waves,
  Clock,
  Compass,
  Activity,
  Zap,
  Radio,
  Send,
  AlertTriangle,
  CheckCircle2,
  BellRing
} from 'lucide-react';
import { HazardTelemetry } from '../../types';

interface ThreatBannerProps {
  hazard: HazardTelemetry;
}

export const ThreatBanner: React.FC<ThreatBannerProps> = ({ hazard }) => {
  const isCyclone = hazard.category >= 1;
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);
  const [broadcastSent, setBroadcastSent] = useState<boolean>(false);
  const [targetAudience, setTargetAudience] = useState<string>('All Coastal & Lowland Sectors');

  const handleSendBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => {
      setShowAlertModal(false);
      setBroadcastSent(false);
    }, 2000);
  };

  return (
    <div className="bg-gradient-to-r from-[#18111e] via-[#141b2c] to-[#0f172a] border border-[#263553] rounded-xl p-4 shadow-lg mb-4 relative overflow-hidden font-sans">
      {/* Background hazard radar effect */}
      <div className="absolute right-0 top-0 bottom-0 w-80 opacity-5 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-red-500 rounded-full animate-ping"></div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        {/* Left: Threat Header & Status */}
        <div className="flex items-start space-x-3">
          <div
            className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center shrink-0 ${
              isCyclone
                ? 'bg-red-950/80 border-red-500/50 text-red-400 shadow-red-950/50 shadow-lg'
                : 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300'
            }`}
          >
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
              {isCyclone ? 'CAT' : 'LVL'}
            </span>
            <span
              className={`text-xl font-extrabold font-mono leading-none ${
                isCyclone ? 'text-red-500 animate-pulse' : 'text-cyan-400'
              }`}
            >
              {isCyclone ? hazard.category : 'LIVE'}
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span
                className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                  isCyclone
                    ? 'bg-red-900/70 text-red-200 border-red-600'
                    : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                }`}
              >
                {isCyclone
                  ? `SEVERE CYCLONE (CAT-${hazard.category})`
                  : hazard.threat_level_label || 'LIVE TELEMETRY'}
              </span>
              <h2 className="text-xl font-extrabold font-mono text-white tracking-wide">
                {hazard.name.toUpperCase()}
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {hazard.hazard_type} • Wind Vector{' '}
              <span className="font-mono font-semibold text-amber-300">
                {hazard.movement_direction}
              </span>{' '}
              ({hazard.wind_direction_deg || 135}°) at{' '}
              <span className="font-mono text-amber-300">{hazard.wind_speed_kmh} km/h</span>
            </p>
          </div>
        </div>

        {/* Center-Right: Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Sustained Winds & Gusts */}
          <div className="bg-[#0f1422]/90 border border-[#212b40] rounded-xl px-3 py-2">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-mono">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>Wind / Gusts</span>
            </div>
            <div className="mt-1 font-mono">
              <span className="text-base font-bold text-white">
                {hazard.wind_speed_kmh.toFixed(0)}
              </span>
              <span className="text-xs text-slate-400"> / </span>
              <span className="text-sm font-semibold text-amber-400">
                {hazard.wind_gusts_kmh.toFixed(0)} km/h
              </span>
            </div>
          </div>

          {/* 24h Rain Total */}
          <div className="bg-[#0f1422]/90 border border-[#212b40] rounded-xl px-3 py-2">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-mono">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              <span>24h Rainfall</span>
            </div>
            <div className="mt-1 font-mono">
              <span className="text-base font-bold text-cyan-300">
                {hazard.total_24h_rainfall_mm.toFixed(0)}
              </span>
              <span className="text-xs text-slate-400">
                {' '}
                mm ({hazard.rainfall_rate_mm_hr.toFixed(0)} mm/h)
              </span>
            </div>
          </div>

          {/* Storm Surge Height */}
          <div className="bg-[#0f1422]/90 border border-[#212b40] rounded-xl px-3 py-2">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-mono">
              <Waves className="w-3.5 h-3.5 text-indigo-400" />
              <span>Peak Surge</span>
            </div>
            <div className="mt-1 font-mono">
              <span className="text-base font-bold text-indigo-300">
                {hazard.storm_surge_meters.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400"> meters</span>
            </div>
          </div>

          {/* Landfall ETA */}
          <div className="bg-[#0f1422]/90 border border-[#212b40] rounded-xl px-3 py-2">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>{isCyclone ? 'Est. Landfall' : 'Watch Status'}</span>
            </div>
            <div className="mt-1 font-mono">
              {isCyclone && hazard.landfall_eta_hours ? (
                <>
                  <span className="text-base font-bold text-amber-300">
                    {hazard.landfall_eta_hours.toFixed(1)}
                  </span>
                  <span className="text-xs text-amber-400/80"> hrs ETA</span>
                </>
              ) : (
                <>
                  <span className="text-base font-bold text-emerald-300">
                    {hazard.rainfall_rate_mm_hr > 5 ? 'Heavy Rain' : 'Active'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Far Right: Emergency Cell Broadcast Trigger */}
        <div className="shrink-0">
          <button
            onClick={() => setShowAlertModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-mono font-bold text-xs shadow-lg flex items-center space-x-2 transition-all transform active:scale-95 border border-red-400/30"
          >
            <BellRing className="w-4 h-4 animate-bounce" />
            <span>Broadcast Cell Alert</span>
          </button>
        </div>
      </div>

      {/* Emergency Cell Broadcast Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#121826] border border-red-500/60 rounded-2xl p-6 shadow-2xl max-w-lg w-full text-slate-200">
            <div className="flex items-start justify-between border-b border-[#202c42] pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-red-950 border border-red-600 text-red-400">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-mono">CAP Emergency Cell Broadcast</h3>
                  <p className="text-xs text-slate-400">Public Warning System • Immediate Multi-Channel Dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setShowAlertModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {broadcastSent ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-emerald-300 font-bold text-base">EMERGENCY ALERT TRANSMITTED</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Common Alerting Protocol (CAP) message dispatched to cellular towers and siren systems across {targetAudience}.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Geofence Area:</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-[#0a0e17] border border-[#263553] text-white font-mono text-xs focus:outline-none"
                  >
                    <option value="All Coastal & Lowland Sectors">All Coastal & Lowland Sectors (Red Alert)</option>
                    <option value="CDA Sector 9 & Mahanadi Basin">CDA Sector 9 & Mahanadi Basin</option>
                    <option value="Bhubaneswar Municipal Area">Bhubaneswar Municipal Area</option>
                    <option value="Cuttack Millennium City Wards">Cuttack Millennium City Wards</option>
                  </select>
                </div>

                <div className="bg-[#0b101a] p-3 rounded-xl border border-red-900/60 space-y-2">
                  <div className="flex items-center space-x-1.5 text-red-400 font-bold font-mono text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>SYNTHESIZED EMERGENCY DISPATCH TEXT:</span>
                  </div>
                  <p className="text-xs text-slate-200 font-mono leading-relaxed bg-[#101726] p-2.5 rounded-lg border border-[#1b253b]">
                    "URGENT DISASTER WARNING from District Magistrate: Severe {hazard.name.toUpperCase()} (Cat-{hazard.category}) approaching with {hazard.wind_speed_kmh} km/h winds and {hazard.total_24h_rainfall_mm.toFixed(0)}mm rainfall. Mandatory evacuation orders in effect for low-lying zones. Move to designated Cyclone Shelters immediately."
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => setShowAlertModal(false)}
                    className="w-1/2 py-2.5 rounded-xl bg-[#151c2a] hover:bg-[#1e283c] text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendBroadcast}
                    className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold font-mono shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Transmit Broadcast</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

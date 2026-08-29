import React, { useEffect, useState } from 'react';
import {
  Compass,
  Wind,
  CloudRain,
  Activity,
  Waves,
  RefreshCw,
  X,
  Target,
  ArrowUp,
  Radio,
  MapPin,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { apiService } from '../../services/api';

export interface PointData {
  latitude: number;
  longitude: number;
  location_name?: string;
  temperature_c: number;
  humidity_percent: number;
  rainfall_rate_mm_hr: number;
  rain_24h_sum_mm: number;
  wind_speed_kmh: number;
  wind_gusts_kmh: number;
  wind_direction_deg: number;
  wind_direction_cardinal: string;
  surface_pressure_hpa: number;
  elevation_meters: number;
  weather_description: string;
  soil_saturation_percent: number;
  point_risk_score: number;
  risk_tier: 'CRITICAL' | 'HIGH' | 'WATCH' | 'SAFE' | string;
  updated_at: string;
}

interface PointInspectorPopupProps {
  coordinates: [number, number]; // [lng, lat]
  onClose: () => void;
  onSetSimulationFocus?: (lat: number, lng: number) => void;
}

export const PointInspectorPopup: React.FC<PointInspectorPopupProps> = ({
  coordinates,
  onClose,
  onSetSimulationFocus,
}) => {
  const [lng, lat] = coordinates;
  const [data, setData] = useState<PointData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [autoPoll, setAutoPoll] = useState<boolean>(true);
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  const fetchPoint = async () => {
    try {
      setLoading(true);
      const res = await apiService.fetchPointTelemetry(lat, lng);
      setData(res);
      setSecondsAgo(0);
    } catch (e) {
      console.error('Failed to fetch point telemetry', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoint();
  }, [lat, lng]);

  // Auto-polling interval (15s)
  useEffect(() => {
    if (!autoPoll) return;
    const interval = setInterval(() => {
      fetchPoint();
    }, 15000);
    return () => clearInterval(interval);
  }, [lat, lng, autoPoll]);

  // Elapsed seconds timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const tierColors: Record<string, { bg: string; text: string; border: string }> = {
    CRITICAL: { bg: 'bg-red-950/80', text: 'text-red-300', border: 'border-red-600' },
    HIGH: { bg: 'bg-orange-950/80', text: 'text-orange-300', border: 'border-orange-600' },
    WATCH: { bg: 'bg-yellow-950/80', text: 'text-yellow-300', border: 'border-yellow-600' },
    SAFE: { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-600' },
  };

  const currentTier = data ? tierColors[data.risk_tier] || tierColors.WATCH : tierColors.WATCH;

  return (
    <div className="bg-[#0e1322]/95 border border-[#23304d] rounded-xl p-4 shadow-2xl backdrop-blur-md text-xs w-84 text-slate-200 select-none relative animate-in fade-in zoom-in-95 duration-150">
      {/* Header with Location Name */}
      <div className="flex items-start justify-between border-b border-[#1b253b] pb-2.5 mb-3">
        <div className="flex items-start space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 mt-0.5">
            <MapPin className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-white font-mono text-[14px] leading-tight">
                {data?.location_name || `Lat: ${lat.toFixed(3)}°, Lng: ${lng.toFixed(3)}°`}
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
              GPS: {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {loading && !data ? (
        <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-[11px] font-mono">Sampling Open-Meteo live feed...</span>
        </div>
      ) : data ? (
        <div className="space-y-3">
          {/* Risk Level Callout */}
          <div className={`flex items-center justify-between p-2.5 rounded-lg border ${currentTier.bg} ${currentTier.border}`}>
            <div>
              <div className="text-[9px] uppercase tracking-wider font-mono text-slate-300">Point Flood Threat</div>
              <div className={`font-mono font-bold text-base ${currentTier.text}`}>
                {data.risk_tier} RISK ({data.point_risk_score}/100)
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-300">{data.weather_description}</div>
              <div className="text-[9px] text-slate-400 font-mono">Elevation: {data.elevation_meters}m</div>
            </div>
          </div>

          {/* Real-Time Meteorological Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Live Wind with Rotating Compass Needle */}
            <div className="bg-[#131b2e]/90 border border-[#1f2c48] rounded-lg p-2 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <Wind className="w-3 h-3 text-cyan-400" />
                  <span>Live Wind</span>
                </div>
                <div className="font-mono font-bold text-white text-xs mt-0.5">
                  {data.wind_speed_kmh} <span className="text-[10px] text-slate-400 font-normal">km/h</span>
                </div>
                <div className="text-[9px] text-amber-300 font-mono">
                  {data.wind_direction_cardinal} ({data.wind_direction_deg}°)
                </div>
              </div>
              <div
                className="w-7 h-7 rounded-full bg-[#0a0f1d] border border-cyan-500/40 flex items-center justify-center text-cyan-400"
                style={{ transform: `rotate(${data.wind_direction_deg}deg)` }}
                title={`Wind direction: ${data.wind_direction_deg}° from North`}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Live Rainfall & 24h Sum */}
            <div className="bg-[#131b2e]/90 border border-[#1f2c48] rounded-lg p-2">
              <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                <CloudRain className="w-3 h-3 text-blue-400" />
                <span>Precipitation</span>
              </div>
              <div className="font-mono font-bold text-cyan-300 text-xs mt-0.5">
                {data.rainfall_rate_mm_hr} <span className="text-[10px] text-slate-400 font-normal">mm/h</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                24h Total: {data.rain_24h_sum_mm}mm
              </div>
            </div>

            {/* Temperature & Humidity */}
            <div className="bg-[#131b2e]/90 border border-[#1f2c48] rounded-lg p-2">
              <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                <Activity className="w-3 h-3 text-emerald-400" />
                <span>Atmospheric</span>
              </div>
              <div className="font-mono font-bold text-white text-xs mt-0.5">
                {data.temperature_c}°C <span className="text-[10px] text-slate-400 font-normal">({data.humidity_percent}%)</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                {data.surface_pressure_hpa} hPa
              </div>
            </div>

            {/* Soil Moisture Saturation */}
            <div className="bg-[#131b2e]/90 border border-[#1f2c48] rounded-lg p-2">
              <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                <Waves className="w-3 h-3 text-indigo-400" />
                <span>Soil Saturation</span>
              </div>
              <div className="font-mono font-bold text-indigo-300 text-xs mt-0.5">
                {data.soil_saturation_percent}%
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                Flash flood risk
              </div>
            </div>
          </div>

          {/* Action Footer */}
          {onSetSimulationFocus && (
            <button
              onClick={() => onSetSimulationFocus(lat, lng)}
              className="w-full py-1.5 px-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-[11px] transition-colors flex items-center justify-center space-x-1.5 shadow-lg"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Center District Evacuation Here</span>
            </button>
          )}

          {/* Ticker and Auto-Polling Controls */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-[#1b253b] pt-2 font-mono">
            <div className="flex items-center space-x-1">
              <RefreshCw className={`w-2.5 h-2.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Updated {secondsAgo}s ago</span>
            </div>
            <button
              onClick={() => setAutoPoll(!autoPoll)}
              className={`hover:text-white transition-colors ${autoPoll ? 'text-emerald-400' : 'text-slate-500'}`}
            >
              {autoPoll ? '● Auto-Polling (15s)' : '○ Auto-Poll Paused'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-slate-400 text-xs">
          Unable to sample live telemetry for this location.
        </div>
      )}
    </div>
  );
};

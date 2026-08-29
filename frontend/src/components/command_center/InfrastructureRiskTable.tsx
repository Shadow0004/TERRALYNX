import React from 'react';
import { Building2, AlertTriangle, CheckCircle, Flame, Activity } from 'lucide-react';
import { Hospital, RoadSegment } from '../../types';

interface InfrastructureRiskTableProps {
  hospitals: Hospital[];
  roads: RoadSegment[];
}

export const InfrastructureRiskTable: React.FC<InfrastructureRiskTableProps> = ({
  hospitals,
  roads,
}) => {
  const unsafeRoads = roads.filter((r) => r.is_flooded || r.status === 'FLOODED_CLOSED' || r.is_closed_manual);
  const cautionRoads = roads.filter((r) => r.status === 'CAUTION');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Hospitals & Medical Facilities Status */}
      <div className="bg-[#111622] border border-[#212b40] rounded-xl p-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1b2334]">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
              Medical Infrastructure Readiness
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{hospitals.length} Hospitals</span>
        </div>

        <div className="space-y-2 mt-3 overflow-y-auto max-h-[220px] pr-1">
          {hospitals.map((h) => (
            <div
              key={h.id}
              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                h.is_flood_threatened
                  ? 'bg-amber-950/40 border-amber-800/50 text-amber-200'
                  : 'bg-[#141b2a] border-[#222e44] text-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{h.name}</span>
                  {h.is_flood_threatened && (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-amber-900 text-amber-300 border border-amber-700">
                      FLOOD RISK
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Zone: {h.zone_id} • Elevation: {h.elevation_meters.toFixed(1)}m • {h.available_beds} of {h.total_beds} beds free ({h.icu_beds} ICU)
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono font-semibold text-emerald-400">
                  {h.ambulance_count} Ambulances
                </span>
                <div className="text-[10px] text-slate-400">
                  {h.has_backup_power ? '⚡ Backup Gen Ready' : '⚠️ No Gen'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Critical Road Access Corridors */}
      <div className="bg-[#111622] border border-[#212b40] rounded-xl p-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1b2334]">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
              Road Access & Corridor Status
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {unsafeRoads.length} Closed • {cautionRoads.length} Caution
          </span>
        </div>

        <div className="space-y-2 mt-3 overflow-y-auto max-h-[220px] pr-1">
          {roads.map((r) => {
            const isUnsafe = r.is_flooded || r.status === 'FLOODED_CLOSED' || r.is_closed_manual;
            return (
              <div
                key={r.id}
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                  isUnsafe
                    ? 'bg-red-950/40 border-red-800/50 text-red-200'
                    : r.status === 'CAUTION'
                    ? 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                    : 'bg-[#141b2a] border-[#222e44] text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-400">{r.id}:</span>
                    <span className="font-semibold">{r.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {r.from_zone_id} ➔ {r.to_zone_id} ({r.distance_km} km) • Min Elev: {r.elevation_min_meters}m
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-mono font-semibold px-2 py-0.5 rounded text-[10px] uppercase ${
                      isUnsafe
                        ? 'bg-red-900/80 text-red-200 border border-red-700'
                        : r.status === 'CAUTION'
                        ? 'bg-amber-900/80 text-amber-200 border border-amber-700'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {r.status.replace('_', ' ')}
                  </span>
                  {r.estimated_time_to_impassable_mins && (
                    <div className="text-[10px] text-amber-400 mt-0.5 font-mono">
                      Cutoff in ~{r.estimated_time_to_impassable_mins.toFixed(0)}m
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

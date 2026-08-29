import React from 'react';
import { X, ShieldAlert, Users, Home, Info, ArrowUpRight, Droplets, Wind, Mountain } from 'lucide-react';
import { Zone, Shelter, ShelterAllocationItem } from '../../types';

interface ZonePopupProps {
  zone: Zone;
  shelters: Shelter[];
  allocations: ShelterAllocationItem[];
  onClose: () => void;
  onNavigateToShelters?: () => void;
}

export const ZonePopup: React.FC<ZonePopupProps> = ({
  zone,
  shelters,
  allocations,
  onClose,
  onNavigateToShelters,
}) => {
  const zoneAllocations = allocations.filter((a) => a.zone_id === zone.id);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-950 text-red-300 border-red-700/80';
      case 'HIGH':
        return 'bg-orange-950 text-orange-300 border-orange-700/80';
      case 'WATCH':
        return 'bg-yellow-950 text-yellow-300 border-yellow-700/80';
      default:
        return 'bg-emerald-950 text-emerald-300 border-emerald-700/80';
    }
  };

  return (
    <div className="bg-[#111622]/95 border border-[#232f48] rounded-xl p-4 text-xs shadow-2xl backdrop-blur-md max-w-sm w-full text-slate-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-2.5 border-b border-[#1f2a3e]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[10px] text-slate-400 font-bold px-1.5 py-0.5 rounded bg-[#0b0e17] border border-[#1f2a3e]">
              {zone.code}
            </span>
            <h3 className="font-bold text-sm text-white font-mono">{zone.name}</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Pop: <span className="text-white font-semibold">{zone.population.toLocaleString()}</span> • Area: {zone.area_sq_km} km²
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-[#1c2436] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Risk Score & Rationale */}
      <div className="mt-3 bg-[#151c2c] border border-[#243149] rounded-lg p-2.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Impact Risk Score:</span>
          <div className="flex items-center space-x-2">
            <span className="text-base font-bold font-mono text-white">{zone.risk_score.toFixed(1)} / 100</span>
            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${getRiskBadge(zone.risk_level)}`}>
              {zone.risk_level}
            </span>
          </div>
        </div>

        {/* Explainability Text */}
        {zone.risk_breakdown && (
          <div className="mt-2 text-[11px] text-slate-300 bg-[#0c101a] p-2 rounded border border-[#1c273c] leading-relaxed">
            <span className="font-semibold text-cyan-400 font-mono text-[10px] uppercase block mb-0.5">
              Why this score?
            </span>
            {zone.risk_breakdown.why_explanation}
          </div>
        )}
      </div>

      {/* Demographics & Topography Breakdown */}
      <div className="grid grid-cols-2 gap-2 mt-2.5 text-[11px]">
        <div className="bg-[#141b2a] border border-[#212c42] p-2 rounded-lg">
          <div className="text-slate-400 flex items-center space-x-1">
            <Users className="w-3 h-3 text-cyan-400" />
            <span>Exposed / Evac Demand</span>
          </div>
          <div className="mt-1 font-mono font-bold text-slate-100">
            {zone.exposed_population.toLocaleString()} <span className="text-red-400">/ {zone.evacuation_requirement.toLocaleString()}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {zone.demographics.non_engineered_housing_percent}% vulnerable structures
          </div>
        </div>

        <div className="bg-[#141b2a] border border-[#212c42] p-2 rounded-lg">
          <div className="text-slate-400 flex items-center space-x-1">
            <Mountain className="w-3 h-3 text-amber-400" />
            <span>Topography Profile</span>
          </div>
          <div className="mt-1 font-mono font-bold text-slate-100">
            {zone.topography.elevation_meters.toFixed(1)}m <span className="text-slate-400 text-[10px]">elev.</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {zone.topography.distance_to_coastline_km}km from coastline
          </div>
        </div>
      </div>

      {/* Allocated Shelters */}
      <div className="mt-2.5 bg-[#141b2a] border border-[#212c42] p-2.5 rounded-lg">
        <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1.5">
          <span className="flex items-center space-x-1">
            <Home className="w-3 h-3 text-indigo-400" />
            <span>Designated Intake Shelters:</span>
          </span>
          <span className="font-mono text-cyan-400 font-semibold">{zoneAllocations.length} Assigned</span>
        </div>

        {zoneAllocations.length === 0 ? (
          <div className="text-slate-500 text-[10px] italic">No active evacuations allocated.</div>
        ) : (
          <div className="space-y-1">
            {zoneAllocations.map((alloc) => (
              <div
                key={alloc.shelter_id}
                className="flex items-center justify-between bg-[#0e1320] px-2 py-1 rounded text-[11px]"
              >
                <span className="truncate pr-2">{alloc.shelter_name}</span>
                <span className="font-mono font-semibold text-emerald-400 shrink-0">
                  {alloc.allocated_count.toLocaleString()} pax (~{alloc.estimated_transit_time_mins.toFixed(0)}m)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Recommendation */}
      <div className="mt-2.5 p-2 rounded-lg bg-red-950/40 border border-red-900/60 text-[11px] text-red-200 leading-relaxed">
        <span className="font-bold font-mono text-[10px] text-red-400 uppercase block mb-0.5">
          Recommended Action Directive:
        </span>
        {zone.recommended_action}
      </div>
    </div>
  );
};

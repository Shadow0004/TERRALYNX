import React, { useState } from 'react';
import {
  Users,
  ShieldAlert,
  Home,
  Activity,
  Waves,
  Mountain,
  ChevronRight,
  X,
  AlertTriangle,
  HeartPulse,
  Baby
} from 'lucide-react';
import { DistrictState, Zone } from '../../types';

interface DemographicsCardProps {
  state: DistrictState;
  onClose: () => void;
  onSelectZone?: (zone: Zone) => void;
}

export const DemographicsCard: React.FC<DemographicsCardProps> = ({
  state,
  onClose,
  onSelectZone,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'zones'>('overview');
  const { zones, kpis, hazard } = state;

  const totalPop = zones.reduce((acc, z) => acc + z.population, 0);
  const totalElderly = zones.reduce(
    (acc, z) => acc + Math.round((z.population * z.demographics.elderly_percent) / 100),
    0
  );
  const totalChildren = zones.reduce(
    (acc, z) => acc + Math.round((z.population * z.demographics.children_percent) / 100),
    0
  );
  const totalMedicallyDependent = zones.reduce(
    (acc, z) => acc + z.demographics.medical_dependency_count,
    0
  );
  const avgNonEngineeredHousing = Math.round(
    zones.reduce((acc, z) => acc + z.demographics.non_engineered_housing_percent, 0) / zones.length
  );
  const avgElevation = (
    zones.reduce((acc, z) => acc + z.topography.elevation_meters, 0) / zones.length
  ).toFixed(1);

  return (
    <div className="bg-[#0e1424]/95 border border-[#233150] rounded-xl p-4 shadow-2xl backdrop-blur-md text-xs w-96 text-slate-200 select-none relative animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#1b253b] pb-2.5 mb-3">
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-white font-mono text-[14px]">
              DEMOGRAPHIC VULNERABILITY
            </span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono">
              {zones.length} Zones
            </span>
          </div>
          <div className="text-[11px] text-cyan-400 font-mono mt-0.5 font-semibold">
            {hazard.name.replace('Live Weather (', '').replace(')', '')}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-3 border-b border-[#1b253b] pb-1.5">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-1 text-xs font-mono font-bold transition-colors ${
            activeTab === 'overview'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📊 District Aggregate
        </button>
        <button
          onClick={() => setActiveTab('zones')}
          className={`pb-1 text-xs font-mono font-bold transition-colors ${
            activeTab === 'zones'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🏙️ Zone Breakdown
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-3">
          {/* Key Population Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#131b2e]/90 border border-[#1f2c48] rounded-lg p-2.5">
              <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Total Population</span>
              </div>
              <div className="font-mono font-bold text-white text-base mt-0.5">
                {totalPop.toLocaleString()}
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                Exposed: <span className="text-amber-300 font-semibold">{kpis.total_population_exposed.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-[#131b2e]/90 border border-[#1f2c48] rounded-lg p-2.5">
              <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Evacuation Demand</span>
              </div>
              <div className="font-mono font-bold text-red-400 text-base mt-0.5">
                {kpis.total_evacuation_demand.toLocaleString()}
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                Cap: <span className="text-emerald-300">{kpis.total_shelter_capacity.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* High-Risk Demographics Breakdown */}
          <div className="bg-[#131b2e]/90 border border-[#1f2c48] rounded-lg p-2.5 space-y-2">
            <div className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">
              Vulnerable Demographics
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-[#0b101c] p-1.5 rounded border border-[#1c2840]">
                <div className="flex items-center justify-center space-x-1 text-[9px] text-amber-300">
                  <Users className="w-2.5 h-2.5" />
                  <span>Elderly (&gt;60y)</span>
                </div>
                <div className="font-mono font-bold text-white text-xs mt-0.5">
                  {totalElderly.toLocaleString()}
                </div>
                <div className="text-[8px] text-slate-400">
                  {((totalElderly / totalPop) * 100).toFixed(1)}% of pop
                </div>
              </div>

              <div className="bg-[#0b101c] p-1.5 rounded border border-[#1c2840]">
                <div className="flex items-center justify-center space-x-1 text-[9px] text-cyan-300">
                  <Baby className="w-2.5 h-2.5" />
                  <span>Children (&lt;10y)</span>
                </div>
                <div className="font-mono font-bold text-white text-xs mt-0.5">
                  {totalChildren.toLocaleString()}
                </div>
                <div className="text-[8px] text-slate-400">
                  {((totalChildren / totalPop) * 100).toFixed(1)}% of pop
                </div>
              </div>

              <div className="bg-[#0b101c] p-1.5 rounded border border-[#1c2840]">
                <div className="flex items-center justify-center space-x-1 text-[9px] text-red-300">
                  <HeartPulse className="w-2.5 h-2.5" />
                  <span>Med. Dependent</span>
                </div>
                <div className="font-mono font-bold text-white text-xs mt-0.5">
                  {totalMedicallyDependent.toLocaleString()}
                </div>
                <div className="text-[8px] text-slate-400">Ambulance priority</div>
              </div>
            </div>

            {/* Housing & Topography Stats */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1a2438]">
              <div className="flex items-center space-x-1.5 text-[11px]">
                <Home className="w-3 h-3 text-orange-400 shrink-0" />
                <div>
                  <div className="text-[9px] text-slate-400">Kutcha / Non-Engineered</div>
                  <div className="font-mono font-bold text-orange-300">{avgNonEngineeredHousing}% of homes</div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 text-[11px]">
                <Mountain className="w-3 h-3 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[9px] text-slate-400">Mean Elevation</div>
                  <div className="font-mono font-bold text-emerald-300">{avgElevation} meters ASL</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
          {zones.map((z) => {
            const tierColor =
              z.risk_level === 'CRITICAL'
                ? 'text-red-400 border-red-900/60 bg-red-950/20'
                : z.risk_level === 'HIGH'
                ? 'text-orange-400 border-orange-900/60 bg-orange-950/20'
                : z.risk_level === 'WATCH'
                ? 'text-yellow-400 border-yellow-900/60 bg-yellow-950/20'
                : 'text-emerald-400 border-emerald-900/60 bg-emerald-950/20';

            return (
              <div
                key={z.id}
                onClick={() => onSelectZone && onSelectZone(z)}
                className={`p-2 rounded-lg border ${tierColor} cursor-pointer hover:brightness-125 transition-all flex items-center justify-between`}
              >
                <div>
                  <div className="font-bold text-white font-mono text-[11px] truncate max-w-[200px]">
                    {z.name}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    Pop: {z.population.toLocaleString()} • Elev: {z.topography.elevation_meters}m
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[10px] font-bold">{z.risk_level}</div>
                  <div className="text-[9px] text-slate-400">{z.risk_score}/100</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

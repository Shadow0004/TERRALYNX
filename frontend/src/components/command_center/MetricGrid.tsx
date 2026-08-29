import React from 'react';
import { Users, AlertOctagon, Home, ShieldAlert, Truck, AlertTriangle } from 'lucide-react';
import { OperationalKPIs, SimulationComparisonDiff } from '../../types';

interface MetricGridProps {
  kpis: OperationalKPIs;
  diff?: SimulationComparisonDiff;
}

export const MetricGrid: React.FC<MetricGridProps> = ({ kpis, diff }) => {
  const getDeltaFor = (name: string) => {
    return diff?.key_deltas.find((d) => d.metric_name.toLowerCase().includes(name.toLowerCase()));
  };

  const evacDelta = getDeltaFor('Evacuation Demand');
  const exposedDelta = getDeltaFor('Exposed Population');
  const utilDelta = getDeltaFor('Shelter Utilization');
  const roadsDelta = getDeltaFor('Roads');

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {/* 1. Overall District Risk */}
      <div className="bg-[#111622] border border-[#212b40] rounded-xl p-3.5 flex flex-col justify-between hover:border-cyan-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-medium tracking-wider uppercase">District Risk Index</span>
          <ShieldAlert className="w-4 h-4 text-red-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold font-mono text-white">{kpis.overall_district_risk_score.toFixed(1)}</span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <div className="mt-1 flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[11px] font-semibold text-red-400">ELEVATED THREAT</span>
          </div>
        </div>
      </div>

      {/* 2. Total Exposed Population */}
      <div className="bg-[#111622] border border-[#212b40] rounded-xl p-3.5 flex flex-col justify-between hover:border-cyan-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-medium tracking-wider uppercase">Pop. Exposed</span>
          <Users className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold font-mono text-cyan-300">
              {kpis.total_population_exposed.toLocaleString()}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>In hazard zone</span>
            {exposedDelta && exposedDelta.delta_absolute !== 0 && (
              <span className={`font-mono text-[10px] font-semibold ${exposedDelta.delta_absolute > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {exposedDelta.delta_absolute > 0 ? '+' : ''}{exposedDelta.delta_absolute.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Evacuation Demand */}
      <div className="bg-[#111622] border border-red-950/70 rounded-xl p-3.5 flex flex-col justify-between hover:border-red-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-medium tracking-wider uppercase text-red-300">Evacuation Demand</span>
          <AlertOctagon className="w-4 h-4 text-red-500 animate-bounce" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold font-mono text-red-400">
              {kpis.total_evacuation_demand.toLocaleString()}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="text-red-300/80">Mandatory order</span>
            {evacDelta && evacDelta.delta_absolute !== 0 && (
              <span className={`font-mono text-[10px] font-semibold px-1 rounded bg-red-950/80 border border-red-800/60 ${evacDelta.delta_absolute > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {evacDelta.delta_absolute > 0 ? '+' : ''}{evacDelta.delta_absolute.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Shelter Capacity Utilization */}
      <div className="bg-[#111622] border border-[#212b40] rounded-xl p-3.5 flex flex-col justify-between hover:border-cyan-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-medium tracking-wider uppercase">Shelter Fill Rate</span>
          <Home className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-1.5">
            <span className={`text-2xl font-bold font-mono ${kpis.shelter_utilization_pct > 85 ? 'text-amber-400' : 'text-indigo-300'}`}>
              {kpis.shelter_utilization_pct.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{kpis.total_incoming_allocated.toLocaleString()} incoming</span>
            {utilDelta && utilDelta.delta_absolute !== 0 && (
              <span className="font-mono text-[10px] text-amber-400 font-semibold">
                {utilDelta.delta_absolute > 0 ? '+' : ''}{utilDelta.delta_absolute.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 5. Inundated / Closed Roads */}
      <div className="bg-[#111622] border border-[#212b40] rounded-xl p-3.5 flex flex-col justify-between hover:border-cyan-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-medium tracking-wider uppercase">Unsafe Corridors</span>
          <AlertTriangle className="w-4 h-4 text-amber-500" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold font-mono text-amber-400">{kpis.unsafe_roads_count}</span>
            <span className="text-xs text-slate-400 font-mono">/ {kpis.total_roads_count} roads</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="text-amber-300/80">Flooded / Cut off</span>
            {roadsDelta && roadsDelta.delta_absolute !== 0 && (
              <span className="font-mono text-[10px] text-red-400 font-semibold">
                {roadsDelta.delta_absolute > 0 ? '+' : ''}{roadsDelta.delta_absolute}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 6. Critical Logistics Deficits */}
      <div className="bg-[#111622] border border-[#212b40] rounded-xl p-3.5 flex flex-col justify-between hover:border-cyan-500/40 transition-colors">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-medium tracking-wider uppercase">Resource Deficits</span>
          <Truck className="w-4 h-4 text-rose-400" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-1.5">
            <span className={`text-2xl font-bold font-mono ${kpis.critical_resource_shortfalls_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {kpis.critical_resource_shortfalls_count}
            </span>
            <span className="text-xs text-slate-400">types short</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {kpis.critical_resource_shortfalls_count > 0 ? (
              <span className="text-rose-400 font-medium">Mutual-aid requested</span>
            ) : (
              <span className="text-emerald-400 font-medium">Inventory adequate</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

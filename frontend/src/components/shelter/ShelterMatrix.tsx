import React from 'react';
import { Shelter, ShelterAllocationItem } from '../../types';

interface ShelterMatrixProps {
  shelters: Shelter[];
  allocations: ShelterAllocationItem[];
  onToggleShelter?: (shelterId: string) => void;
}

export const ShelterMatrix: React.FC<ShelterMatrixProps> = ({
  shelters,
  allocations,
  onToggleShelter,
}) => {
  const activeShelters = shelters.filter((s) => s.is_active);
  const totalCap = activeShelters.reduce((acc, s) => acc + s.total_capacity, 0);
  const totalOccupied = activeShelters.reduce((acc, s) => acc + s.projected_total_occupancy, 0);
  const totalIncoming = activeShelters.reduce((acc, s) => acc + s.incoming_allocated_evacuees, 0);

  return (
    <div className="bg-[#111622] border border-[#212b40] rounded-xl p-4 space-y-4">
      {/* Overview Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1b2334]">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide font-mono uppercase">
            Designated Shelter Capacity & Allocation Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Capacity-constrained optimal evacuee allocation and real-time shelter utilization
          </p>
        </div>

        <div className="flex items-center space-x-3 font-mono text-xs">
          <div className="bg-[#141b2a] border border-[#222e44] px-3 py-1.5 rounded-lg text-right">
            <span className="text-slate-400 block text-[10px]">TOTAL CAPACITY</span>
            <span className="font-bold text-white text-sm">{totalCap.toLocaleString()}</span>
          </div>
          <div className="bg-[#141b2a] border border-[#222e44] px-3 py-1.5 rounded-lg text-right">
            <span className="text-slate-400 block text-[10px]">PROJECTED OCCUPANCY</span>
            <span className="font-bold text-cyan-400 text-sm">{totalOccupied.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Shelters Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#0e1320] text-slate-400 uppercase font-mono text-[10px] border-b border-[#1f293d]">
            <tr>
              <th className="py-2.5 px-3">Shelter ID & Facility</th>
              <th className="py-2.5 px-3">Zone / Elev</th>
              <th className="py-2.5 px-3 text-right">Total Cap</th>
              <th className="py-2.5 px-3 text-right">Prior Occ</th>
              <th className="py-2.5 px-3 text-right">Incoming</th>
              <th className="py-2.5 px-3 text-right">Remaining</th>
              <th className="py-2.5 px-3">Utilization</th>
              <th className="py-2.5 px-3">Safety Rating</th>
              <th className="py-2.5 px-3">Allocated Zones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2334]">
            {shelters.map((s) => {
              const utilColor = s.is_overloaded
                ? 'bg-red-500 text-white'
                : s.utilization_percentage > 85
                ? 'bg-amber-500 text-black font-semibold'
                : 'bg-emerald-500 text-white';

              return (
                <tr
                  key={s.id}
                  className={`hover:bg-[#151c2c] transition-colors ${
                    !s.is_active ? 'opacity-50 bg-[#0a0e17]' : ''
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="font-mono font-bold text-white">{s.name}</div>
                      {!s.is_active && (
                        <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-red-950 text-red-300 border border-red-800">
                          OFFLINE
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {s.id} • {s.water_capacity_liters.toLocaleString()}L Water • {s.food_supply_days}d Food
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px]">
                    <div className="text-slate-200">{s.zone_id}</div>
                    <div className="text-slate-400 text-[10px]">{s.elevation_meters.toFixed(1)}m elev.</div>
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                    {s.total_capacity.toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    {s.current_occupancy.toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-cyan-400">
                    +{s.incoming_allocated_evacuees.toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold">
                    <span className={s.remaining_capacity <= 100 ? 'text-red-400' : 'text-emerald-400'}>
                      {s.remaining_capacity.toLocaleString()}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="w-32">
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                        <span>{s.utilization_percentage.toFixed(1)}%</span>
                        <span>{s.projected_total_occupancy} / {s.total_capacity}</span>
                      </div>
                      <div className="w-full bg-[#1e293b] rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            s.utilization_percentage > 95
                              ? 'bg-red-500'
                              : s.utilization_percentage > 80
                              ? 'bg-amber-500'
                              : 'bg-cyan-500'
                          }`}
                          style={{ width: `${Math.min(100, s.utilization_percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#162032] text-slate-200 border border-[#263754]">
                      {s.safety_score}%
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    {s.assigned_zone_ids.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {s.assigned_zone_ids.map((zid) => (
                          <span
                            key={zid}
                            className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-cyan-950 text-cyan-300 border border-cyan-800"
                          >
                            {zid}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">None</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

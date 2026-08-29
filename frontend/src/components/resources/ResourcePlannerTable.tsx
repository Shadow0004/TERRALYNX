import React from 'react';
import { Truck, AlertTriangle, CheckCircle2, ShieldAlert, ArrowUpRight, Bus, Anchor, Stethoscope, Users, Package } from 'lucide-react';
import { ResourceDeploymentItem } from '../../types';

interface ResourcePlannerTableProps {
  resources: ResourceDeploymentItem[];
  onRequisitionResource?: (resourceType: string) => void;
}

export const ResourcePlannerTable: React.FC<ResourcePlannerTableProps> = ({
  resources,
  onRequisitionResource,
}) => {
  const getResourceIcon = (name: string) => {
    if (name.includes('Bus')) return <Bus className="w-4 h-4 text-cyan-400" />;
    if (name.includes('Boat')) return <Anchor className="w-4 h-4 text-blue-400" />;
    if (name.includes('Ambulance')) return <Stethoscope className="w-4 h-4 text-rose-400" />;
    if (name.includes('Rescue Team') || name.includes('NDRF')) return <Users className="w-4 h-4 text-amber-400" />;
    return <Package className="w-4 h-4 text-indigo-400" />;
  };

  const totalShortfalls = resources.filter((r) => r.is_critical_shortage).length;

  return (
    <div className="bg-[#111622] border border-[#212b40] rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1b2334]">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide font-mono uppercase flex items-center space-x-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            <span>Emergency Fleet & Resource Logistics Matrix</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Logistical requirements computed from population exposure, flood terrain, and evacuation demands
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {totalShortfalls > 0 ? (
            <span className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-red-950 text-red-300 border border-red-700 flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
              <span>{totalShortfalls} LOGISTICAL DEFICITS DETECTED</span>
            </span>
          ) : (
            <span className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
              ALL INVENTORY ADEQUATE
            </span>
          )}
        </div>
      </div>

      {/* Resource Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#0e1320] text-slate-400 uppercase font-mono text-[10px] border-b border-[#1f293d]">
            <tr>
              <th className="py-2.5 px-3">Resource Asset</th>
              <th className="py-2.5 px-3 text-right">Required</th>
              <th className="py-2.5 px-3 text-right">Available</th>
              <th className="py-2.5 px-3 text-right">Shortfall</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Priority Deployment Sectors</th>
              <th className="py-2.5 px-3">Operational Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2334]">
            {resources.map((r) => {
              const isShort = r.shortfall_count > 0;
              return (
                <tr
                  key={r.resource_type}
                  className={`hover:bg-[#151c2c] transition-colors ${
                    isShort ? 'bg-red-950/20' : ''
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-[#141b2a] border border-[#222e44]">
                        {getResourceIcon(r.resource_type)}
                      </div>
                      <div>
                        <span className="font-semibold text-white">{r.resource_type}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Unit: {r.unit}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-white">
                    {r.required_count.toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {r.available_count.toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold">
                    {isShort ? (
                      <span className="text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                        -{r.shortfall_count.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-emerald-400">0</span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {isShort ? (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-red-950 text-red-300 border border-red-800">
                        DEFICIT
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        SUFFICIENT
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {r.priority_deployment_zones.map((zid) => (
                        <span
                          key={zid}
                          className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-cyan-950 text-cyan-300 border border-cyan-800"
                        >
                          {zid}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-[11px] text-slate-400 max-w-xs leading-relaxed">
                    {r.notes}
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

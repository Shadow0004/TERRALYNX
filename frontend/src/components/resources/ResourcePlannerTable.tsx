import React, { useState } from 'react';
import {
  Truck,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  Bus,
  Anchor,
  Stethoscope,
  Users,
  Package,
  Zap,
  Plus,
  Filter,
  Check,
  Building,
  RefreshCw
} from 'lucide-react';
import { ResourceDeploymentItem } from '../../types';

interface ResourcePlannerTableProps {
  resources: ResourceDeploymentItem[];
  onRequisitionResource?: (resourceType: string, count: number) => void;
}

export const ResourcePlannerTable: React.FC<ResourcePlannerTableProps> = ({
  resources,
  onRequisitionResource,
}) => {
  const [filter, setFilter] = useState<'all' | 'deficits' | 'fleet' | 'medical' | 'supplies'>('all');
  const [selectedResource, setSelectedResource] = useState<ResourceDeploymentItem | null>(null);
  const [requisitionCount, setRequisitionCount] = useState<number>(10);
  const [requisitionSuccess, setRequisitionSuccess] = useState<string | null>(null);

  const getResourceIcon = (name: string) => {
    if (name.includes('Bus')) return <Bus className="w-4 h-4 text-cyan-400" />;
    if (name.includes('Boat') || name.includes('Inflatable')) return <Anchor className="w-4 h-4 text-blue-400" />;
    if (name.includes('Ambulance') || name.includes('Medical')) return <Stethoscope className="w-4 h-4 text-rose-400" />;
    if (name.includes('Rescue Team') || name.includes('NDRF')) return <Users className="w-4 h-4 text-amber-400" />;
    if (name.includes('Generator')) return <Zap className="w-4 h-4 text-yellow-400" />;
    return <Package className="w-4 h-4 text-indigo-400" />;
  };

  const totalDeficits = resources.filter((r) => r.is_critical_shortage).length;

  const filteredResources = resources.filter((r) => {
    if (filter === 'deficits') return r.is_critical_shortage;
    if (filter === 'fleet') return r.resource_type.includes('Bus') || r.resource_type.includes('Boat') || r.resource_type.includes('Ambulance');
    if (filter === 'medical') return r.resource_type.includes('Ambulance') || r.resource_type.includes('Medical') || r.resource_type.includes('Trauma');
    if (filter === 'supplies') return r.resource_type.includes('Ration') || r.resource_type.includes('Generator') || r.resource_type.includes('Food');
    return true;
  });

  const handleOpenRequisition = (r: ResourceDeploymentItem) => {
    setSelectedResource(r);
    setRequisitionCount(r.shortfall_count > 0 ? r.shortfall_count : 10);
    setRequisitionSuccess(null);
  };

  const handleConfirmRequisition = () => {
    if (!selectedResource) return;
    if (onRequisitionResource) {
      onRequisitionResource(selectedResource.resource_type, requisitionCount);
    }
    setRequisitionSuccess(`Successfully dispatched ${requisitionCount} ${selectedResource.unit} to local stockpile!`);
    setTimeout(() => {
      setSelectedResource(null);
      setRequisitionSuccess(null);
    }, 1500);
  };

  // Supply chain health summary stats
  const busItem = resources.find((r) => r.resource_type.includes('Bus'));
  const boatItem = resources.find((r) => r.resource_type.includes('Boat'));
  const ambulanceItem = resources.find((r) => r.resource_type.includes('Ambulance'));
  const teamItem = resources.find((r) => r.resource_type.includes('NDRF'));
  const rationItem = resources.find((r) => r.resource_type.includes('Food') || r.resource_type.includes('Ration'));

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Logistical Supply Chain Health Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Fleet Mobility */}
        <div className="bg-[#111622] border border-[#212b40] rounded-xl p-3.5 flex flex-col justify-between hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Fleet Mobility (Buses)</span>
            <Bus className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-white">
                {busItem?.available_count ?? 36}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ {busItem?.required_count ?? 45} required</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">40-pax convoy fleet</span>
              {(busItem?.shortfall_count ?? 0) > 0 ? (
                <span className="font-mono text-red-400 font-bold">-{busItem?.shortfall_count} Shortfall</span>
              ) : (
                <span className="font-mono text-emerald-400 font-bold">100% Ready</span>
              )}
            </div>
          </div>
        </div>

        {/* Swift-Water Rescue */}
        <div className="bg-[#111622] border border-[#212b40] rounded-xl p-3.5 flex flex-col justify-between hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Water Rescue (Boats)</span>
            <Anchor className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-white">
                {boatItem?.available_count ?? 14}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ {boatItem?.required_count ?? 18} required</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Inflatables & OBMs</span>
              {(boatItem?.shortfall_count ?? 0) > 0 ? (
                <span className="font-mono text-red-400 font-bold">-{boatItem?.shortfall_count} Deficit</span>
              ) : (
                <span className="font-mono text-emerald-400 font-bold">Covered</span>
              )}
            </div>
          </div>
        </div>

        {/* Tactical Search & Rescue */}
        <div className="bg-[#111622] border border-[#212b40] rounded-xl p-3.5 flex flex-col justify-between hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Tactical Units (NDRF)</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-white">
                {teamItem?.available_count ?? 12}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ {teamItem?.required_count ?? 14} teams</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">10-man tactical teams</span>
              {(teamItem?.shortfall_count ?? 0) > 0 ? (
                <span className="font-mono text-red-400 font-bold">-{teamItem?.shortfall_count} Teams</span>
              ) : (
                <span className="font-mono text-emerald-400 font-bold">Deployed</span>
              )}
            </div>
          </div>
        </div>

        {/* 72h Survival Supplies */}
        <div className="bg-[#111622] border border-[#212b40] rounded-xl p-3.5 flex flex-col justify-between hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">72h Ration Packs</span>
            <Package className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-white">
                {(rationItem?.available_count ?? 45000).toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-mono">packs</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Food & potable water</span>
              <span className="font-mono text-emerald-400 font-bold">Adequate</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Resource Planning & Logistics Matrix Card */}
      <div className="bg-[#111622] border border-[#212b40] rounded-xl p-4 space-y-4">
        {/* Table Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1b2334]">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide font-mono uppercase flex items-center space-x-2">
              <Truck className="w-5 h-5 text-cyan-400" />
              <span>Emergency Fleet & Resource Logistics Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time resource mobilization and deficit tracking for disaster evacuation
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-1.5">
            {/* Filter Tabs */}
            <div className="flex items-center bg-[#090d16] p-1 rounded-lg border border-[#1e283d] text-xs font-medium">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded transition-colors ${filter === 'all' ? 'bg-[#1b253b] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All ({resources.length})
              </button>
              <button
                onClick={() => setFilter('deficits')}
                className={`px-2.5 py-1 rounded transition-colors ${filter === 'deficits' ? 'bg-red-950 text-red-300 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Deficits ({totalDeficits})
              </button>
              <button
                onClick={() => setFilter('fleet')}
                className={`px-2.5 py-1 rounded transition-colors ${filter === 'fleet' ? 'bg-[#1b253b] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Fleets
              </button>
              <button
                onClick={() => setFilter('medical')}
                className={`px-2.5 py-1 rounded transition-colors ${filter === 'medical' ? 'bg-[#1b253b] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Medical
              </button>
              <button
                onClick={() => setFilter('supplies')}
                className={`px-2.5 py-1 rounded transition-colors ${filter === 'supplies' ? 'bg-[#1b253b] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Supplies
              </button>
            </div>

            {totalDeficits > 0 ? (
              <span className="px-3 py-1.5 text-xs font-mono font-bold rounded-lg bg-red-950 text-red-300 border border-red-700 flex items-center space-x-1.5 shadow-lg">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                <span>{totalDeficits} LOGISTICAL DEFICITS</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 text-xs font-mono font-bold rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
                ALL INVENTORY SUFFICIENT
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
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2334]">
              {filteredResources.map((r) => {
                const isShort = r.shortfall_count > 0;
                return (
                  <tr
                    key={r.resource_type}
                    className={`hover:bg-[#151c2c] transition-colors ${
                      isShort ? 'bg-red-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-lg bg-[#141b2a] border border-[#222e44] shrink-0">
                          {getResourceIcon(r.resource_type)}
                        </div>
                        <div>
                          <span className="font-semibold text-white text-[13px]">{r.resource_type}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">Unit: {r.unit} • {r.notes}</span>
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

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenRequisition(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center space-x-1 ml-auto ${
                          isShort
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg'
                            : 'bg-[#182133] hover:bg-[#202c42] text-slate-300 border border-[#2b3952]'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isShort ? 'Requisition' : 'Allocate'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Interactive Requisition Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#121826] border border-[#2a3754] rounded-2xl p-6 shadow-2xl max-w-md w-full text-slate-200">
            <div className="flex items-start justify-between border-b border-[#1f2a3e] pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-600/50 text-cyan-400">
                  {getResourceIcon(selectedResource.resource_type)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Requisition Mutual-Aid Fleet</h3>
                  <p className="text-xs text-slate-400">{selectedResource.resource_type}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedResource(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {requisitionSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <div className="text-emerald-300 font-bold text-sm">{requisitionSuccess}</div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="bg-[#0b101a] p-3 rounded-xl border border-[#1b263b] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Required:</span>
                    <span className="font-mono font-bold text-white">{selectedResource.required_count} {selectedResource.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Currently Available:</span>
                    <span className="font-mono text-slate-300">{selectedResource.available_count} {selectedResource.unit}</span>
                  </div>
                  {selectedResource.shortfall_count > 0 && (
                    <div className="flex justify-between text-red-400 font-semibold pt-1 border-t border-[#182133]">
                      <span>Deficit Shortfall:</span>
                      <span className="font-mono">-{selectedResource.shortfall_count} {selectedResource.unit}</span>
                    </div>
                  )}
                </div>

                {/* Counter & Presets */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Select Units to Mobilize:
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="100000"
                      value={requisitionCount}
                      onChange={(e) => setRequisitionCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full py-2 px-3 rounded-xl bg-[#0a0e17] border border-[#263553] text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={() => setRequisitionCount((c) => c + 5)}
                      className="px-3 py-2 rounded-xl bg-[#1b253b] hover:bg-[#25334e] text-slate-200 font-mono font-semibold"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => setRequisitionCount((c) => c + 15)}
                      className="px-3 py-2 rounded-xl bg-[#1b253b] hover:bg-[#25334e] text-slate-200 font-mono font-semibold"
                    >
                      +15
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => setSelectedResource(null)}
                    className="w-1/2 py-2.5 rounded-xl bg-[#151c2a] hover:bg-[#1e283c] text-slate-300 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRequisition}
                    className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono transition-all shadow-lg active:scale-95"
                  >
                    Authorize Dispatch
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

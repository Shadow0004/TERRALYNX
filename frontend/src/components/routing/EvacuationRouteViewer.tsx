import React, { useState } from 'react';
import { Route, Navigation, AlertTriangle, ShieldCheck, Clock, Compass, ArrowRight } from 'lucide-react';
import { EvacuationRoute, RoadSegment } from '../../types';

interface EvacuationRouteViewerProps {
  routes: EvacuationRoute[];
  roads: RoadSegment[];
}

export const EvacuationRouteViewer: React.FC<EvacuationRouteViewerProps> = ({ routes, roads }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(routes[0]?.id || null);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'HIGH_RISK':
        return 'bg-red-950 text-red-300 border-red-700';
      case 'MEDIUM_RISK':
        return 'bg-amber-950 text-amber-300 border-amber-700';
      default:
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#111622] border border-[#212b40] rounded-xl p-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide font-mono uppercase flex items-center space-x-2">
            <Route className="w-5 h-5 text-cyan-400" />
            <span>Evacuation Route Corridors & Road Nav Guidance</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Flood-aware graph-routed safe transit corridors connecting threatened zones to designated shelters
          </p>
        </div>
        <div className="font-mono text-xs text-slate-300 bg-[#141b2a] border border-[#232f48] px-3 py-1.5 rounded-lg">
          {routes.length} Active Corridors
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Route List */}
        <div className="bg-[#111622] border border-[#212b40] rounded-xl p-3 space-y-2 max-h-[580px] overflow-y-auto">
          {routes.map((rt) => {
            const isSelected = rt.id === selectedRouteId;
            return (
              <button
                key={rt.id}
                onClick={() => setSelectedRouteId(rt.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-500/70 shadow-md'
                    : 'bg-[#141b2a] border-[#222e44] hover:border-slate-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-slate-400">{rt.id}</span>
                  <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded border ${getRiskBadge(rt.route_risk_level)}`}>
                    {rt.route_risk_level.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs font-bold text-white mt-1.5 flex items-center space-x-1.5">
                  <span className="truncate">{rt.from_zone_name}</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate text-cyan-300">{rt.to_shelter_name}</span>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>~{rt.estimated_travel_time_mins} mins</span>
                  </span>
                  <span>{rt.total_distance_km} km</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Selected Route Detail Inspection */}
        {selectedRoute && (
          <div className="lg:col-span-2 bg-[#111622] border border-[#212b40] rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#1b2334]">
              <div>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#141b2a] text-cyan-300 border border-cyan-800">
                  CORRIDOR DETAIL: {selectedRoute.id}
                </span>
                <h2 className="text-base font-bold text-white mt-1">
                  {selectedRoute.from_zone_name} ➔ {selectedRoute.to_shelter_name}
                </h2>
              </div>
              <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded border ${getRiskBadge(selectedRoute.route_risk_level)}`}>
                {selectedRoute.route_risk_level.replace('_', ' ')}
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#141b2a] border border-[#222e44] p-3 rounded-lg">
                <span className="text-slate-400 text-[11px]">Total Distance</span>
                <div className="text-lg font-bold font-mono text-white mt-0.5">
                  {selectedRoute.total_distance_km} km
                </div>
              </div>
              <div className="bg-[#141b2a] border border-[#222e44] p-3 rounded-lg">
                <span className="text-slate-400 text-[11px]">Estimated Transit Time</span>
                <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
                  {selectedRoute.estimated_travel_time_mins} mins
                </div>
              </div>
              <div className="bg-[#141b2a] border border-[#222e44] p-3 rounded-lg">
                <span className="text-slate-400 text-[11px]">Connecting Segments</span>
                <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
                  {selectedRoute.used_road_ids.length || 1} segments
                </div>
              </div>
            </div>

            {/* Warnings and Hazards on this corridor */}
            {selectedRoute.unsafe_road_warnings.length > 0 ? (
              <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-200 space-y-1.5">
                <div className="flex items-center space-x-1.5 font-bold font-mono text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>CORRIDOR HAZARD ADVISORY:</span>
                </div>
                {selectedRoute.unsafe_road_warnings.map((w, idx) => (
                  <div key={idx} className="leading-relaxed pl-5">• {w}</div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>All road segments on this corridor are clear and verified safe for high-density bus convoys.</span>
              </div>
            )}

            {/* Road Segments Traversed */}
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase mb-2">
                Road Network Sequence
              </h4>
              <div className="space-y-2">
                {selectedRoute.used_road_ids.map((rid) => {
                  const road = roads.find((r) => r.id === rid);
                  if (!road) return null;
                  return (
                    <div
                      key={rid}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#141b2a] border border-[#212d44] text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{road.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {road.from_zone_id} ➔ {road.to_zone_id} • {road.distance_km}km • Min Elev: {road.elevation_min_meters}m
                        </div>
                      </div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#0d121c] border border-[#1e293b] text-cyan-300 font-bold">
                        {road.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

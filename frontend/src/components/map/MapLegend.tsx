import React from 'react';
import { Layers, Shield, Home, Building2, Route, AlertTriangle } from 'lucide-react';

interface MapLegendProps {
  showZones: boolean;
  setShowZones: (val: boolean) => void;
  showRoads: boolean;
  setShowRoads: (val: boolean) => void;
  showShelters: boolean;
  setShowShelters: (val: boolean) => void;
  showRoutes: boolean;
  setShowRoutes: (val: boolean) => void;
  showRadar: boolean;
  setShowRadar: (val: boolean) => void;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  showZones,
  setShowZones,
  showRoads,
  setShowRoads,
  showShelters,
  setShowShelters,
  showRoutes,
  setShowRoutes,
  showRadar,
  setShowRadar,
}) => {
  return (
    <div className="bg-[#0f1422]/95 border border-[#212b40] rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-3 w-64 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1b2334] pb-2 font-mono">
        <span className="font-bold text-slate-100 flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>MAP LAYERS & LEGEND</span>
        </span>
      </div>

      {/* Layer Toggles */}
      <div className="space-y-1.5">
        <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer py-0.5">
          <span className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500/80 border border-red-400"></span>
            <span>Risk Polygons</span>
          </span>
          <input
            type="checkbox"
            checked={showZones}
            onChange={(e) => setShowZones(e.target.checked)}
            className="rounded bg-[#1a2333] border-slate-600 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
          />
        </label>

        <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer py-0.5">
          <span className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
            <span>Road Access Network</span>
          </span>
          <input
            type="checkbox"
            checked={showRoads}
            onChange={(e) => setShowRoads(e.target.checked)}
            className="rounded bg-[#1a2333] border-slate-600 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
          />
        </label>

        <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer py-0.5">
          <span className="flex items-center space-x-2">
            <Home className="w-3.5 h-3.5 text-indigo-400" />
            <span>Shelter Hubs</span>
          </span>
          <input
            type="checkbox"
            checked={showShelters}
            onChange={(e) => setShowShelters(e.target.checked)}
            className="rounded bg-[#1a2333] border-slate-600 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
          />
        </label>

        <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer py-0.5">
          <span className="flex items-center space-x-2">
            <Route className="w-3.5 h-3.5 text-cyan-400" />
            <span>Evacuation Corridors</span>
          </span>
          <input
            type="checkbox"
            checked={showRoutes}
            onChange={(e) => setShowRoutes(e.target.checked)}
            className="rounded bg-[#1a2333] border-slate-600 text-cyan-500 focus:ring-0 w-3.5 h-3.5"
          />
        </label>

        <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer py-0.5">
          <span className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-300 font-medium">Live Doppler Radar</span>
          </span>
          <input
            type="checkbox"
            checked={showRadar}
            onChange={(e) => setShowRadar(e.target.checked)}
            className="rounded bg-[#1a2333] border-slate-600 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
          />
        </label>
      </div>

      {/* Risk Color Swatches */}
      <div className="pt-2 border-t border-[#1b2334] space-y-1 text-[11px]">
        <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">Zone Risk Scale</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-slate-300">Critical (&gt;75)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="text-slate-300">High (50-75)</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            <span className="text-slate-300">Watch (25-50)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300">Safe (&lt;25)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

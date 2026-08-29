import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, Bell, ShieldCheck } from 'lucide-react';
import { EmergencyAlert, AlertTier } from '../../types';

interface ActiveAlertsFeedProps {
  alerts: EmergencyAlert[];
}

export const ActiveAlertsFeed: React.FC<ActiveAlertsFeedProps> = ({ alerts }) => {
  const [filterTier, setFilterTier] = useState<string>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (filterTier === 'ALL') return true;
    return a.tier === filterTier;
  });

  const getTierBadge = (tier: AlertTier) => {
    switch (tier) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-red-950 text-red-300 border border-red-700/60 flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>CRITICAL</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-950 text-amber-300 border border-amber-700/60 flex items-center space-x-1">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
            <span>WARNING</span>
          </span>
        );
      case 'WATCH':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-yellow-950/80 text-yellow-300 border border-yellow-700/60">
            WATCH
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            INFO
          </span>
        );
    }
  };

  return (
    <div className="bg-[#111622] border border-[#212b40] rounded-xl p-4 flex flex-col h-full">
      {/* Feed Header & Filter Buttons */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1b2334] gap-2 flex-wrap">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
            Active Alerts Feed
          </h3>
          <span className="text-xs font-mono text-slate-400">({alerts.length})</span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1">
          {['ALL', 'CRITICAL', 'WARNING', 'WATCH'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTier(t)}
              className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded transition-colors ${
                filterTier === t
                  ? 'bg-cyan-900 text-cyan-200 border border-cyan-700'
                  : 'bg-[#141b2a] text-slate-400 hover:text-slate-200 border border-[#232f48]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Feed Items */}
      <div className="space-y-2.5 mt-3 overflow-y-auto max-h-[340px] pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No active alerts matching this filter.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border text-left transition-all ${
                alert.tier === 'CRITICAL'
                  ? 'bg-[#18111e]/90 border-red-900/60'
                  : alert.tier === 'WARNING'
                  ? 'bg-[#191512]/90 border-amber-900/60'
                  : 'bg-[#121826] border-[#222e44]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getTierBadge(alert.tier)}
                  <h4 className="text-xs font-semibold text-slate-100">{alert.title}</h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{alert.timestamp}</span>
              </div>

              <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                {alert.message}
              </p>

              <div className="mt-2 pt-2 border-t border-[#1e283b] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px]">
                <div className="text-cyan-400 font-medium">
                  <span className="text-slate-400">Action: </span>
                  {alert.action_required}
                </div>
                <div className="font-mono text-slate-400 shrink-0">
                  Trigger: {alert.trigger_metric}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Bus,
  Home,
  CheckCheck,
  Radio,
  Send,
  Zap,
  Users,
  Building
} from 'lucide-react';
import { PriorityActionItem } from '../../types';

interface PriorityActionsListProps {
  actions: PriorityActionItem[];
  onExecuteAction: (id: string) => void;
  onExecuteAllActions?: () => void;
}

export const PriorityActionsList: React.FC<PriorityActionsListProps> = ({
  actions,
  onExecuteAction,
  onExecuteAllActions,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'EXECUTED'>('ALL');
  const [executingId, setExecutingId] = useState<string | null>(null);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'EVACUATION':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'ROUTING':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'LOGISTICS':
        return <Bus className="w-4 h-4 text-cyan-400" />;
      case 'SHELTER':
        return <Home className="w-4 h-4 text-indigo-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getAgencyBadge = (category: string, rank: number) => {
    switch (category) {
      case 'EVACUATION':
        return rank % 2 === 0 ? 'ODRAF Unit 4' : 'NDRF 3rd Bn';
      case 'ROUTING':
        return 'District Traffic Police';
      case 'LOGISTICS':
        return 'State Transport Corp';
      case 'SHELTER':
        return 'Municipal Disaster Cell';
      default:
        return 'Emergency Ops Command';
    }
  };

  const pendingCount = actions.filter((a) => a.status === 'PENDING').length;
  const completedCount = actions.filter((a) => a.status === 'COMPLETED').length;
  const progressPct = actions.length > 0 ? Math.round((completedCount / actions.length) * 100) : 100;

  const filteredActions = actions.filter((a) => {
    if (filter === 'PENDING') return a.status === 'PENDING';
    if (filter === 'EXECUTED') return a.status === 'COMPLETED';
    return true;
  });

  const handleExecute = (id: string) => {
    setExecutingId(id);
    setTimeout(() => {
      onExecuteAction(id);
      setExecutingId(null);
    }, 400);
  };

  const handleBulkExecute = () => {
    if (onExecuteAllActions) {
      onExecuteAllActions();
    } else {
      actions.filter((a) => a.status === 'PENDING').forEach((a) => onExecuteAction(a.id));
    }
  };

  return (
    <div className="bg-[#111622] border border-[#212b40] rounded-xl p-4 flex flex-col h-full font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1b2334]">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono flex items-center space-x-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Incident Action Directives</span>
          </h3>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-red-950 text-red-300 border border-red-800">
            {pendingCount} PENDING
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {pendingCount > 1 && (
            <button
              onClick={handleBulkExecute}
              className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-red-950 hover:bg-red-900 text-red-200 border border-red-700 flex items-center space-x-1.5 transition-all shadow-md active:scale-95"
            >
              <Zap className="w-3 h-3 text-red-400" />
              <span>Authorize All ({pendingCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Directive Execution Progress Bar */}
      <div className="mt-3 bg-[#0a0e18] p-2.5 rounded-lg border border-[#1b2438]">
        <div className="flex justify-between items-center text-[11px] mb-1.5">
          <span className="text-slate-400">Tactical Directives Executed:</span>
          <span className="font-mono font-bold text-cyan-300">{completedCount} / {actions.length} ({progressPct}%)</span>
        </div>
        <div className="w-full bg-[#182133] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Directives List */}
      <div className="space-y-2.5 mt-3 overflow-y-auto max-h-[320px] pr-1">
        {filteredActions.map((action) => {
          const isDone = action.status === 'COMPLETED';
          const isExecuting = executingId === action.id;
          const assignedAgency = getAgencyBadge(action.category, action.priority_rank);

          return (
            <div
              key={action.id}
              className={`p-3 rounded-lg border transition-all ${
                isDone
                  ? 'bg-[#0c101a]/70 border-[#1a2333] opacity-65'
                  : action.urgency === 'IMMEDIATE'
                  ? 'bg-[#18131d]/90 border-red-900/60 hover:border-red-500/60 shadow-lg'
                  : 'bg-[#131a28] border-[#222f46] hover:border-cyan-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start space-x-2.5">
                  <div className="mt-0.5 shrink-0">{getCategoryIcon(action.category)}</div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#0b0e17] text-slate-300 border border-[#222e44]">
                        #{action.priority_rank}
                      </span>
                      <h4 className={`text-xs font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                        {action.title}
                      </h4>
                      <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {assignedAgency}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {action.rationale}
                    </p>

                    <div className="flex items-center space-x-3 mt-2 text-[10px] font-mono text-slate-400 flex-wrap gap-1">
                      <span className="flex items-center space-x-1 text-amber-400 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>Execution Window: &lt;{action.timeframe_mins} mins</span>
                      </span>
                      <span>•</span>
                      <span className="text-slate-300">Target: {action.target_name}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleExecute(action.id)}
                  disabled={isDone || isExecuting}
                  className={`shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                    isDone
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80 cursor-default'
                      : isExecuting
                      ? 'bg-cyan-900 text-cyan-200 animate-pulse'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold shadow-md active:scale-95'
                  }`}
                >
                  {isDone ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Dispatched</span>
                    </>
                  ) : isExecuting ? (
                    <span>Issuing...</span>
                  ) : (
                    <>
                      <span>Authorize</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { CheckCircle2, Clock, ArrowRight, ShieldAlert, AlertTriangle, Bus, Home } from 'lucide-react';
import { PriorityActionItem } from '../../types';

interface PriorityActionsListProps {
  actions: PriorityActionItem[];
  onExecuteAction: (id: string) => void;
}

export const PriorityActionsList: React.FC<PriorityActionsListProps> = ({ actions, onExecuteAction }) => {
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

  return (
    <div className="bg-[#111622] border border-[#212b40] rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#1b2334]">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
            Priority Action Directives
          </h3>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-red-950 text-red-300 border border-red-800">
            {actions.filter((a) => a.status === 'PENDING').length} PENDING
          </span>
        </div>
        <span className="text-[11px] text-slate-400">Ranked by Risk & Window</span>
      </div>

      <div className="space-y-2.5 mt-3 overflow-y-auto max-h-[340px] pr-1">
        {actions.map((action) => {
          const isDone = action.status === 'COMPLETED';
          return (
            <div
              key={action.id}
              className={`p-3 rounded-lg border transition-all ${
                isDone
                  ? 'bg-[#0c101a]/60 border-[#1a2333] opacity-60'
                  : action.urgency === 'IMMEDIATE'
                  ? 'bg-[#18131d]/90 border-red-900/50 hover:border-red-500/50'
                  : 'bg-[#131a28] border-[#222f46] hover:border-cyan-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start space-x-2.5">
                  <div className="mt-0.5">{getCategoryIcon(action.category)}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#0b0e17] text-slate-300 border border-[#222e44]">
                        #{action.priority_rank}
                      </span>
                      <h4 className={`text-xs font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                        {action.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {action.rationale}
                    </p>
                    <div className="flex items-center space-x-3 mt-2 text-[10px] font-mono text-slate-400">
                      <span className="flex items-center space-x-1 text-amber-400 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>Window: &lt;{action.timeframe_mins}m</span>
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">Target: {action.target_name}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onExecuteAction(action.id)}
                  disabled={isDone}
                  className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded flex items-center space-x-1 transition-colors ${
                    isDone
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 cursor-default'
                      : 'bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60'
                  }`}
                >
                  {isDone ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Issued</span>
                    </>
                  ) : (
                    <>
                      <span>Authorize</span>
                      <ArrowRight className="w-3 h-3" />
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

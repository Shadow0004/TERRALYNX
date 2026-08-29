import React from 'react';
import { Building, ShieldCheck, Clock, Navigation, CheckCircle2 } from 'lucide-react';
import { TemporaryShelterCandidate } from '../../types';

interface TemporaryShelterPlannerProps {
  candidates: TemporaryShelterCandidate[];
  onActivateCandidate?: (id: string) => void;
}

export const TemporaryShelterPlanner: React.FC<TemporaryShelterPlannerProps> = ({
  candidates,
  onActivateCandidate,
}) => {
  return (
    <div className="bg-[#111622] border border-[#212b40] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-[#1b2334]">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide font-mono uppercase flex items-center space-x-2">
            <Building className="w-4 h-4 text-cyan-400" />
            <span>Candidate Temporary / Reserve Shelter Sites</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Secondary high-elevation facilities prepared for rapid activation upon overflow
          </p>
        </div>
        <span className="text-xs font-mono text-cyan-400 font-semibold">
          {candidates.length} Sites Staged
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {candidates.map((c) => (
          <div
            key={c.id}
            className="bg-[#141b2a] border border-[#232f48] rounded-xl p-3.5 flex flex-col justify-between hover:border-cyan-500/40 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#0e1320] text-slate-300 border border-[#20293d]">
                    {c.id}
                  </span>
                  <h4 className="font-bold text-xs text-slate-100 mt-1">{c.name}</h4>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {c.suitability_score}% Match
                </span>
              </div>

              <div className="text-[11px] text-slate-400 mt-1.5 space-y-1 font-mono">
                <div>Cap: <span className="text-white font-bold">{c.potential_capacity.toLocaleString()} pax</span></div>
                <div>Elevation: <span className="text-cyan-400 font-bold">{c.elevation_meters.toFixed(1)}m</span> (Flood-Safe)</div>
                <div className="flex items-center space-x-1 text-amber-300">
                  <Clock className="w-3 h-3" />
                  <span>Activation: ~{c.activation_readiness_hours} hrs</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 mt-2 bg-[#0c101a] p-2 rounded border border-[#1b2538] leading-relaxed">
                {c.rationale}
              </p>
            </div>

            <button
              onClick={() => onActivateCandidate && onActivateCandidate(c.id)}
              className="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-mono font-semibold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 transition-colors flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Issue Stage-2 Activation</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

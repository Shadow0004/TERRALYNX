import React from 'react';
import { DistrictState } from '../../types';
import { ThreatBanner } from './ThreatBanner';
import { MetricGrid } from './MetricGrid';
import { PriorityActionsList } from './PriorityActionsList';
import { ActiveAlertsFeed } from './ActiveAlertsFeed';
import { InfrastructureRiskTable } from './InfrastructureRiskTable';

interface CommandCenterViewProps {
  state: DistrictState;
  onExecuteAction: (id: string) => void;
  onNavigateToMap: () => void;
  onNavigateToSimulator: () => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  state,
  onExecuteAction,
  onNavigateToMap,
  onNavigateToSimulator,
}) => {
  return (
    <div className="space-y-4">
      {/* 1. Hazard Telemetry Header */}
      <ThreatBanner hazard={state.hazard} />

      {/* 2. Core Operational Metrics Grid */}
      <MetricGrid kpis={state.kpis} diff={state.simulation_diff} />

      {/* 3. Action Queue & Alert Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PriorityActionsList
          actions={state.priority_actions}
          onExecuteAction={onExecuteAction}
        />
        <ActiveAlertsFeed alerts={state.alerts} />
      </div>

      {/* 4. Infrastructure Readiness & Road Access */}
      <InfrastructureRiskTable
        hospitals={state.hospitals}
        roads={state.roads}
      />
    </div>
  );
};

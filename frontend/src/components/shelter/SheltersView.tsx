import React from 'react';
import { Shelter, ShelterAllocationItem, TemporaryShelterCandidate } from '../../types';
import { ShelterMatrix } from './ShelterMatrix';
import { TemporaryShelterPlanner } from './TemporaryShelterPlanner';

interface SheltersViewProps {
  shelters: Shelter[];
  allocations: ShelterAllocationItem[];
  candidates: TemporaryShelterCandidate[];
  onToggleShelter?: (shelterId: string) => void;
  onActivateCandidate?: (id: string) => void;
}

export const SheltersView: React.FC<SheltersViewProps> = ({
  shelters,
  allocations,
  candidates,
  onToggleShelter,
  onActivateCandidate,
}) => {
  return (
    <div className="space-y-4">
      <ShelterMatrix
        shelters={shelters}
        allocations={allocations}
        onToggleShelter={onToggleShelter}
      />

      <TemporaryShelterPlanner
        candidates={candidates}
        onActivateCandidate={onActivateCandidate}
      />
    </div>
  );
};

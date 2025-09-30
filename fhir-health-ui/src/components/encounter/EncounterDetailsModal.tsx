import React from 'react';
import type { Encounter } from '../../types/fhir';
import { EncounterDetails } from './EncounterDetails';

export interface EncounterDetailsModalProps {
  readonly encounter: Encounter;
  readonly onClose: () => void;
}

export function EncounterDetailsModal({ encounter, onClose }: EncounterDetailsModalProps): React.JSX.Element {
  return (
    <div className="encounter-details-modal-overlay">
      <dialog
        className="encounter-details-modal"
        aria-label="Encounter details dialog"
        open
      >
        <EncounterDetails
          encounter={encounter}
          onClose={onClose}
        />
      </dialog>
    </div>
  );
}

import React, { useState, useCallback } from 'react';
import type { Patient, Encounter, Observation, Condition, MedicationRequest, DiagnosticReport, Procedure } from '../../types/fhir';
import { fhirClient } from '../../services/fhirClient';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useModalNavigation } from '../../hooks/useModalNavigation';
import { Loading } from '../common/Loading';
import { InlineError, ErrorList } from '../common/InlineError';
import { ObservationForm } from './forms/ObservationForm';
import { ConditionForm } from './forms/ConditionForm';
import { MedicationRequestForm } from './forms/MedicationRequestForm';
import { DiagnosticReportForm } from './forms/DiagnosticReportForm';
import { ProcedureForm } from './forms/ProcedureForm';
import type { ModalPageProps } from '../common/Modal';
import './EncounterCreateModal.css';

export interface EncounterCreateModalProps extends ModalPageProps {
  patient: Patient;
  onSuccess: (encounter: Encounter) => void;
}

// This component is now a wrapper that creates the modal configuration
// The actual pages are in the pages/ directory
export function EncounterCreateModal({ 
  modalId, 
  pageId, 
  pageData, 
  patient, 
  onSuccess 
}: EncounterCreateModalProps): React.JSX.Element {
  // This component is now just a placeholder since the modal system
  // handles the rendering. The actual implementation should use the
  // modal system to open the encounter creation wizard.
  return (
    <div className="encounter-create-modal-placeholder">
      <p>This modal should be opened using the new modal system.</p>
    </div>
  );
}
import type { Patient, Encounter } from '../../types/fhir';
import type { ModalConfig } from '../../contexts/ModalContext';
import {
  EncounterDetailsPage,
  ObservationsPage,
  ConditionsPage,
  MedicationsPage,
  DiagnosticsPage,
  ProceduresPage,
  ReviewPage
} from './pages';

export interface EncounterModalOptions {
  patient: Patient;
  onSuccess: (encounter: Encounter) => void;
  onClose?: () => void;
}

/**
 * Creates a modal configuration for the encounter creation wizard
 */
export function createEncounterModalConfig(options: EncounterModalOptions): ModalConfig {
  const { patient, onSuccess, onClose } = options;

  return {
    size: 'large',
    pages: [
      {
        id: 'encounter-details',
        title: 'Encounter Details',
        component: EncounterDetailsPage,
        props: { patient },
      },
      {
        id: 'observations',
        title: 'Observations',
        component: ObservationsPage,
        canGoBack: true,
      },
      {
        id: 'conditions',
        title: 'Conditions',
        component: ConditionsPage,
        canGoBack: true,
      },
      {
        id: 'medications',
        title: 'Medications',
        component: MedicationsPage,
        canGoBack: true,
      },
      {
        id: 'diagnostics',
        title: 'Diagnostic Reports',
        component: DiagnosticsPage,
        canGoBack: true,
      },
      {
        id: 'procedures',
        title: 'Procedures',
        component: ProceduresPage,
        canGoBack: true,
      },
      {
        id: 'review',
        title: 'Review & Create',
        component: ReviewPage,
        canGoBack: true,
        props: { patient, onSuccess },
      },
    ],
    initialPage: 'encounter-details',
    onClose,
    closeOnOverlayClick: false, // Prevent accidental closure
    closeOnEscape: false, // Prevent accidental closure
  };
}

/**
 * Hook to easily open the encounter creation modal
 */
export function useEncounterModal() {
  return {
    createEncounterModalConfig,
  };
}
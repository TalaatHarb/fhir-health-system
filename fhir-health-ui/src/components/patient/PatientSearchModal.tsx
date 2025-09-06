import React, { useCallback } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { usePatient } from '../../contexts/PatientContext';
import { PatientSearch } from './PatientSearch';
import type { Patient } from '../../types/fhir';
import type { ModalPageProps } from '../common/Modal';

export interface PatientSearchModalProps extends ModalPageProps {
  onPatientSelect?: (patient: Patient) => void;
}

export function PatientSearchModal({ modalId, onPatientSelect }: PatientSearchModalProps) {
  const { closeModal } = useModal();
  const { openPatient } = usePatient();

  const handlePatientSelect = useCallback((patient: Patient) => {
    if (onPatientSelect) {
      onPatientSelect(patient);
    } else {
      // Default behavior: open patient in new tab
      openPatient(patient);
    }
    
    // Close the modal after selection
    closeModal(modalId);
  }, [onPatientSelect, openPatient, closeModal, modalId]);

  const handleCreatePatient = useCallback(() => {
    // Close search modal and let the PatientSearch component handle create modal
    closeModal(modalId);
  }, [closeModal, modalId]);

  return (
    <div className="patient-search-modal">
      <PatientSearch
        onPatientSelect={handlePatientSelect}
        onCreatePatient={handleCreatePatient}
      />
    </div>
  );
}
import React, { useCallback } from 'react';
import { usePatient } from '../../contexts/PatientContext';
import { useModal } from '../../contexts/ModalContext';
import { useTranslation } from '../../hooks/useTranslation';
import { PatientTab } from './PatientTab';
import { PatientSearch } from './PatientSearch';
import { PatientSearchModal } from './PatientSearchModal';
import './TabManager.css';

export function TabManager(): React.JSX.Element {
  const { state, closePatient, setActivePatient, openCreateModal } = usePatient();
  const { openModal } = useModal();
  const { t } = useTranslation();
  const { openPatients, activePatientId } = state;

  const openPatientsList = Array.from(openPatients.entries());

  // Handle opening the patient search modal
  const handleOpenSearchModal = useCallback(() => {
    openModal('patient-search', {
      size: 'large',
      pages: [
        {
          id: 'search',
          title: t('patient.searchPatient'),
          component: PatientSearchModal,
        },
      ],
      initialPage: 'search',
      closeOnOverlayClick: true,
      closeOnEscape: true,
    });
  }, [openModal]);

  // Handle opening the create patient modal
  const handleOpenCreateModal = useCallback(() => {
    openCreateModal();
  }, [openCreateModal]);

  // If no patients are open, show the search interface
  if (openPatientsList.length === 0) {
    return <PatientSearch />;
  }

  return (
    <div className="tab-manager">
      {/* Tab Navigation */}
      <div className="tab-nav">
        <div className="tab-list">
          {openPatientsList.map(([patientId, patient]) => (
            <div
              key={patientId}
              className={`tab-item ${activePatientId === patientId ? 'active' : ''}`}
              onClick={() => setActivePatient(patientId)}
            >
              <span className="tab-title">
                {patient.name?.[0]?.given?.[0]} {patient.name?.[0]?.family}
              </span>
              <button
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  closePatient(patientId);
                }}
                aria-label={`${t('common.close')} ${patient.name?.[0]?.given?.[0]} ${patient.name?.[0]?.family} tab`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        {/* Patient Action Buttons */}
        <div className="tab-actions">
          <button
            className="tab-action-button tab-action-button--search"
            onClick={handleOpenSearchModal}
            title={t('patient.searchPatient')}
          >
            {t('patient.searchPatient')}
          </button>
          <button
            className="tab-action-button tab-action-button--add"
            onClick={handleOpenCreateModal}
            disabled={state.createLoading}
            title={t('patient.createPatient')}
          >
            + {t('patient.addPatient')}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {openPatientsList.map(([patientId, patient]) => (
          <PatientTab
            key={patientId}
            patient={patient}
            isActive={activePatientId === patientId}
            onClose={() => closePatient(patientId)}
          />
        ))}
      </div>
    </div>
  );
}
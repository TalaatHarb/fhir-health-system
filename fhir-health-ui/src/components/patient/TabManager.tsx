import React from 'react';
import { usePatient } from '../../contexts/PatientContext';
import { PatientTab } from './PatientTab';
import { PatientSearch } from './PatientSearch';
import './TabManager.css';

export function TabManager(): React.JSX.Element {
  const { state, closePatient, setActivePatient } = usePatient();
  const { openPatients, activePatientId } = state;

  const openPatientsList = Array.from(openPatients.entries());

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
                aria-label={`Close ${patient.name?.[0]?.given?.[0]} ${patient.name?.[0]?.family} tab`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        {/* Add New Patient Button */}
        <div className="tab-actions">
          <PatientSearch showAsButton />
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
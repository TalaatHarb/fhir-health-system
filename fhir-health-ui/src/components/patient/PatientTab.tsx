import React from 'react';
import type { Patient, Encounter } from '../../types/fhir';
import { EncounterTimeline } from '../encounter/EncounterTimeline';
import './PatientTab.css';

export interface PatientTabProps {
  patient: Patient;
  isActive: boolean;
  onClose: () => void;
}

export function PatientTab({ patient, isActive, onClose }: PatientTabProps): React.JSX.Element {
  if (!isActive) {
    return <div className="patient-tab hidden" />;
  }

  // Handle encounter selection
  const handleEncounterSelect = (encounter: Encounter) => {
    // TODO: Implement encounter details view in future task
    console.log('Selected encounter:', encounter);
  };

  // Handle create encounter
  const handleCreateEncounter = () => {
    // TODO: Implement encounter creation in future task
    console.log('Create new encounter for patient:', patient.id);
  };

  // Extract patient information
  const primaryName = patient.name?.[0];
  const fullName = primaryName ? 
    `${primaryName.given?.join(' ') || ''} ${primaryName.family || ''}`.trim() : 
    'Unknown Patient';
  
  const birthDate = patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'Unknown';
  const gender = patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'Unknown';
  
  // Extract contact information
  const primaryAddress = patient.address?.[0];
  const addressText = primaryAddress ? 
    [
      primaryAddress.line?.join(', '),
      primaryAddress.city,
      primaryAddress.state,
      primaryAddress.postalCode
    ].filter(Boolean).join(', ') : 'No address on file';
  
  const primaryPhone = patient.telecom?.find(contact => contact.system === 'phone')?.value;
  const primaryEmail = patient.telecom?.find(contact => contact.system === 'email')?.value;

  return (
    <div className="patient-tab active">
      <div className="patient-tab-header">
        <div className="patient-info">
          <h2 className="patient-name">{fullName}</h2>
          <div className="patient-details">
            <span className="patient-detail">
              <strong>DOB:</strong> {birthDate}
            </span>
            <span className="patient-detail">
              <strong>Gender:</strong> {gender}
            </span>
            <span className="patient-detail">
              <strong>ID:</strong> {patient.id}
            </span>
          </div>
        </div>
        
        <button
          className="close-tab-button"
          onClick={onClose}
          aria-label={`Close ${fullName} tab`}
        >
          ×
        </button>
      </div>

      <div className="patient-tab-content">
        <div className="patient-sections">
          {/* Contact Information Section */}
          <section className="patient-section">
            <h3 className="section-title">Contact Information</h3>
            <div className="section-content">
              <div className="contact-item">
                <strong>Address:</strong>
                <span>{addressText}</span>
              </div>
              {primaryPhone && (
                <div className="contact-item">
                  <strong>Phone:</strong>
                  <span>{primaryPhone}</span>
                </div>
              )}
              {primaryEmail && (
                <div className="contact-item">
                  <strong>Email:</strong>
                  <span>{primaryEmail}</span>
                </div>
              )}
            </div>
          </section>

          {/* Encounters Section */}
          <section className="patient-section">
            <div className="section-content">
              <EncounterTimeline
                patient={patient}
                onEncounterSelect={handleEncounterSelect}
                onCreateEncounter={handleCreateEncounter}
              />
            </div>
          </section>

          {/* Resources Section - Placeholder for future implementation */}
          <section className="patient-section">
            <h3 className="section-title">Resources</h3>
            <div className="section-content">
              <div className="placeholder-content">
                <p>Resource visualization will be implemented in a future task.</p>
                <p>This section will show observations, conditions, medications, and other FHIR resources.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
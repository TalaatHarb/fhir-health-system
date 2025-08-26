import React, { useState, useCallback } from 'react';
import type { Patient, Encounter, Observation, Condition, MedicationRequest, DiagnosticReport, Procedure } from '../../types/fhir';
import { fhirClient } from '../../services/fhirClient';
import { useNotifications } from '../../contexts/NotificationContext';
import { Loading } from '../common/Loading';
import { InlineError, ErrorList } from '../common/InlineError';
import { ObservationForm } from './forms/ObservationForm';
import { ConditionForm } from './forms/ConditionForm';
import { MedicationRequestForm } from './forms/MedicationRequestForm';
import { DiagnosticReportForm } from './forms/DiagnosticReportForm';
import { ProcedureForm } from './forms/ProcedureForm';
import './EncounterCreateModal.css';

export interface EncounterCreateModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (encounter: Encounter) => void;
}

export interface EncounterFormData {
  status: Encounter['status'];
  class: string;
  type?: string;
  period: {
    start: string;
    end?: string;
  };
  reasonCode?: string;
  reasonText?: string;
}

export interface ResourceFormData {
  observations: Omit<Observation, 'id' | 'resourceType' | 'subject' | 'encounter'>[];
  conditions: Omit<Condition, 'id' | 'resourceType' | 'subject' | 'encounter'>[];
  medicationRequests: Omit<MedicationRequest, 'id' | 'resourceType' | 'subject' | 'encounter'>[];
  diagnosticReports: Omit<DiagnosticReport, 'id' | 'resourceType' | 'subject' | 'encounter'>[];
  procedures: Omit<Procedure, 'id' | 'resourceType' | 'subject' | 'encounter'>[];
}

export interface EncounterCreateState {
  loading: boolean;
  error: string | null;
  validationErrors: string[];
  activeTab: 'encounter' | 'observations' | 'conditions' | 'medications' | 'diagnostics' | 'procedures';
  encounterData: EncounterFormData;
  resourceData: ResourceFormData;
}

export function EncounterCreateModal({ 
  patient, 
  isOpen, 
  onClose, 
  onSuccess 
}: EncounterCreateModalProps): React.JSX.Element {
  const { showSuccess, showError } = useNotifications();
  const [state, setState] = useState<EncounterCreateState>({
    loading: false,
    error: null,
    validationErrors: [],
    activeTab: 'encounter',
    encounterData: {
      status: 'finished',
      class: 'AMB',
      period: {
        start: new Date().toISOString().slice(0, 16), // Current datetime in YYYY-MM-DDTHH:mm format
      }
    },
    resourceData: {
      observations: [],
      conditions: [],
      medicationRequests: [],
      diagnosticReports: [],
      procedures: []
    }
  });

  // Handle encounter form changes
  const handleEncounterChange = useCallback((field: keyof EncounterFormData, value: any) => {
    setState(prev => ({
      ...prev,
      encounterData: {
        ...prev.encounterData,
        [field]: value
      }
    }));
  }, []);

  // Handle resource additions
  const handleAddResource = useCallback((resourceType: keyof ResourceFormData, resource: any) => {
    setState(prev => ({
      ...prev,
      resourceData: {
        ...prev.resourceData,
        [resourceType]: [...prev.resourceData[resourceType], resource]
      }
    }));
  }, []);

  // Handle resource removal
  const handleRemoveResource = useCallback((resourceType: keyof ResourceFormData, index: number) => {
    setState(prev => ({
      ...prev,
      resourceData: {
        ...prev.resourceData,
        [resourceType]: prev.resourceData[resourceType].filter((_, i) => i !== index)
      }
    }));
  }, []);

  // Validate encounter form
  const validateEncounterForm = (): string[] => {
    const errors: string[] = [];
    
    if (!state.encounterData.status) {
      errors.push('Encounter status is required');
    }
    
    if (!state.encounterData.class) {
      errors.push('Encounter class is required');
    }
    
    if (!state.encounterData.period.start) {
      errors.push('Encounter start date is required');
    }
    
    if (state.encounterData.period.end && 
        new Date(state.encounterData.period.end) < new Date(state.encounterData.period.start)) {
      errors.push('Encounter end date must be after start date');
    }
    
    return errors;
  };

  // Submit encounter and resources
  const handleSubmit = useCallback(async () => {
    const validationErrors = validateEncounterForm();
    if (validationErrors.length > 0) {
      setState(prev => ({ ...prev, validationErrors, error: null }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null, validationErrors: [] }));

    try {
      // Create encounter
      const encounterData: Omit<Encounter, 'id'> = {
        resourceType: 'Encounter',
        status: state.encounterData.status,
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: state.encounterData.class,
          display: getEncounterClassDisplay(state.encounterData.class)
        },
        subject: {
          reference: `Patient/${patient.id}`,
          display: getPatientDisplayName(patient)
        },
        period: {
          start: state.encounterData.period.start,
          ...(state.encounterData.period.end && { end: state.encounterData.period.end })
        },
        ...(state.encounterData.type && {
          type: [{
            coding: [{
              system: 'http://snomed.info/sct',
              code: state.encounterData.type,
              display: getEncounterTypeDisplay(state.encounterData.type)
            }]
          }]
        }),
        ...(state.encounterData.reasonCode && {
          reasonCode: [{
            coding: [{
              system: 'http://snomed.info/sct',
              code: state.encounterData.reasonCode,
              display: state.encounterData.reasonText || state.encounterData.reasonCode
            }],
            text: state.encounterData.reasonText
          }]
        })
      };

      const createdEncounter = await fhirClient.createEncounter(encounterData);

      // Create associated resources
      const resourcePromises: Promise<any>[] = [];

      // Create observations
      state.resourceData.observations.forEach(obs => {
        const observationData: Omit<Observation, 'id'> = {
          ...obs,
          resourceType: 'Observation',
          subject: { reference: `Patient/${patient.id}` },
          encounter: { reference: `Encounter/${createdEncounter.id}` }
        };
        resourcePromises.push(fhirClient.createResource(observationData));
      });

      // Create conditions
      state.resourceData.conditions.forEach(condition => {
        const conditionData: Omit<Condition, 'id'> = {
          ...condition,
          resourceType: 'Condition',
          subject: { reference: `Patient/${patient.id}` },
          encounter: { reference: `Encounter/${createdEncounter.id}` }
        };
        resourcePromises.push(fhirClient.createResource(conditionData));
      });

      // Create medication requests
      state.resourceData.medicationRequests.forEach(medReq => {
        const medicationRequestData: Omit<MedicationRequest, 'id'> = {
          ...medReq,
          resourceType: 'MedicationRequest',
          subject: { reference: `Patient/${patient.id}` },
          encounter: { reference: `Encounter/${createdEncounter.id}` }
        };
        resourcePromises.push(fhirClient.createResource(medicationRequestData));
      });

      // Create diagnostic reports
      state.resourceData.diagnosticReports.forEach(report => {
        const diagnosticReportData: Omit<DiagnosticReport, 'id'> = {
          ...report,
          resourceType: 'DiagnosticReport',
          subject: { reference: `Patient/${patient.id}` },
          encounter: { reference: `Encounter/${createdEncounter.id}` }
        };
        resourcePromises.push(fhirClient.createResource(diagnosticReportData));
      });

      // Create procedures
      state.resourceData.procedures.forEach(procedure => {
        const procedureData: Omit<Procedure, 'id'> = {
          ...procedure,
          resourceType: 'Procedure',
          subject: { reference: `Patient/${patient.id}` },
          encounter: { reference: `Encounter/${createdEncounter.id}` }
        };
        resourcePromises.push(fhirClient.createResource(procedureData));
      });

      // Wait for all resources to be created
      await Promise.all(resourcePromises);

      setState(prev => ({ ...prev, loading: false }));
      
      // Show success notification
      const resourceCount = getResourceCount();
      showSuccess(
        'Encounter Created', 
        `Encounter created successfully${resourceCount > 0 ? ` with ${resourceCount} associated resource(s)` : ''}.`
      );
      
      onSuccess(createdEncounter);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create encounter';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      showError('Failed to Create Encounter', errorMessage);
    }
  }, [patient, state.encounterData, state.resourceData, onSuccess, onClose]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!state.loading) {
      onClose();
    }
  }, [state.loading, onClose]);

  // Helper functions
  const getPatientDisplayName = (patient: Patient): string => {
    const primaryName = patient.name?.[0];
    return primaryName ? 
      `${primaryName.given?.join(' ') || ''} ${primaryName.family || ''}`.trim() : 
      'Unknown Patient';
  };

  const getEncounterClassDisplay = (classCode: string): string => {
    const classMap: Record<string, string> = {
      'AMB': 'Ambulatory',
      'EMER': 'Emergency',
      'FLD': 'Field',
      'HH': 'Home Health',
      'IMP': 'Inpatient',
      'ACUTE': 'Inpatient Acute',
      'NONAC': 'Inpatient Non-Acute',
      'OBSENC': 'Observation Encounter',
      'PRENC': 'Pre-Admission',
      'SS': 'Short Stay',
      'VR': 'Virtual'
    };
    return classMap[classCode] || classCode;
  };

  const getEncounterTypeDisplay = (typeCode: string): string => {
    const typeMap: Record<string, string> = {
      '185349003': 'Encounter for check up',
      '270427003': 'Patient-initiated encounter',
      '308646001': 'Death certificate',
      '390906007': 'Follow-up encounter',
      '406547006': 'Urgent follow-up',
      '185347001': 'Encounter for problem'
    };
    return typeMap[typeCode] || typeCode;
  };

  const getResourceCount = (): number => {
    return Object.values(state.resourceData).reduce((total, resources) => total + resources.length, 0);
  };

  if (!isOpen) {
    return <div className="encounter-create-modal hidden" />;
  }

  return (
    <div className="encounter-create-modal-overlay" onClick={handleClose}>
      <div className="encounter-create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Encounter</h2>
          <p className="patient-info">
            Patient: {getPatientDisplayName(patient)} (ID: {patient.id})
          </p>
          <button
            className="close-button"
            onClick={handleClose}
            disabled={state.loading}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="tab-navigation">
            <button
              className={`tab-button ${state.activeTab === 'encounter' ? 'active' : ''}`}
              onClick={() => setState(prev => ({ ...prev, activeTab: 'encounter' }))}
              disabled={state.loading}
            >
              Encounter Details
            </button>
            <button
              className={`tab-button ${state.activeTab === 'observations' ? 'active' : ''}`}
              onClick={() => setState(prev => ({ ...prev, activeTab: 'observations' }))}
              disabled={state.loading}
            >
              Observations ({state.resourceData.observations.length})
            </button>
            <button
              className={`tab-button ${state.activeTab === 'conditions' ? 'active' : ''}`}
              onClick={() => setState(prev => ({ ...prev, activeTab: 'conditions' }))}
              disabled={state.loading}
            >
              Conditions ({state.resourceData.conditions.length})
            </button>
            <button
              className={`tab-button ${state.activeTab === 'medications' ? 'active' : ''}`}
              onClick={() => setState(prev => ({ ...prev, activeTab: 'medications' }))}
              disabled={state.loading}
            >
              Medications ({state.resourceData.medicationRequests.length})
            </button>
            <button
              className={`tab-button ${state.activeTab === 'diagnostics' ? 'active' : ''}`}
              onClick={() => setState(prev => ({ ...prev, activeTab: 'diagnostics' }))}
              disabled={state.loading}
            >
              Diagnostics ({state.resourceData.diagnosticReports.length})
            </button>
            <button
              className={`tab-button ${state.activeTab === 'procedures' ? 'active' : ''}`}
              onClick={() => setState(prev => ({ ...prev, activeTab: 'procedures' }))}
              disabled={state.loading}
            >
              Procedures ({state.resourceData.procedures.length})
            </button>
          </div>

          <div className="tab-content">
            {state.activeTab === 'encounter' && (
              <div className="encounter-form">
                <div className="form-group">
                  <label htmlFor="encounter-status">Status *</label>
                  <select
                    id="encounter-status"
                    value={state.encounterData.status}
                    onChange={(e) => handleEncounterChange('status', e.target.value as Encounter['status'])}
                    disabled={state.loading}
                    required
                  >
                    <option value="planned">Planned</option>
                    <option value="arrived">Arrived</option>
                    <option value="triaged">Triaged</option>
                    <option value="in-progress">In Progress</option>
                    <option value="onleave">On Leave</option>
                    <option value="finished">Finished</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="encounter-class">Class *</label>
                  <select
                    id="encounter-class"
                    value={state.encounterData.class}
                    onChange={(e) => handleEncounterChange('class', e.target.value)}
                    disabled={state.loading}
                    required
                  >
                    <option value="AMB">Ambulatory</option>
                    <option value="EMER">Emergency</option>
                    <option value="FLD">Field</option>
                    <option value="HH">Home Health</option>
                    <option value="IMP">Inpatient</option>
                    <option value="ACUTE">Inpatient Acute</option>
                    <option value="NONAC">Inpatient Non-Acute</option>
                    <option value="OBSENC">Observation Encounter</option>
                    <option value="PRENC">Pre-Admission</option>
                    <option value="SS">Short Stay</option>
                    <option value="VR">Virtual</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="encounter-type">Type</label>
                  <select
                    id="encounter-type"
                    value={state.encounterData.type || ''}
                    onChange={(e) => handleEncounterChange('type', e.target.value || undefined)}
                    disabled={state.loading}
                  >
                    <option value="">Select type (optional)</option>
                    <option value="185349003">Check up</option>
                    <option value="270427003">Patient-initiated encounter</option>
                    <option value="390906007">Follow-up encounter</option>
                    <option value="406547006">Urgent follow-up</option>
                    <option value="185347001">Encounter for problem</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="encounter-start">Start Date/Time *</label>
                    <input
                      type="datetime-local"
                      id="encounter-start"
                      value={state.encounterData.period.start}
                      onChange={(e) => handleEncounterChange('period', { 
                        ...state.encounterData.period, 
                        start: e.target.value 
                      })}
                      disabled={state.loading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="encounter-end">End Date/Time</label>
                    <input
                      type="datetime-local"
                      id="encounter-end"
                      value={state.encounterData.period.end || ''}
                      onChange={(e) => handleEncounterChange('period', { 
                        ...state.encounterData.period, 
                        end: e.target.value || undefined 
                      })}
                      disabled={state.loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="encounter-reason-code">Reason Code</label>
                  <input
                    type="text"
                    id="encounter-reason-code"
                    value={state.encounterData.reasonCode || ''}
                    onChange={(e) => handleEncounterChange('reasonCode', e.target.value || undefined)}
                    disabled={state.loading}
                    placeholder="SNOMED CT code (optional)"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="encounter-reason-text">Reason Description</label>
                  <textarea
                    id="encounter-reason-text"
                    value={state.encounterData.reasonText || ''}
                    onChange={(e) => handleEncounterChange('reasonText', e.target.value || undefined)}
                    disabled={state.loading}
                    placeholder="Describe the reason for this encounter"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {state.activeTab === 'observations' && (
              <ObservationForm
                observations={state.resourceData.observations}
                onAdd={(observation) => handleAddResource('observations', observation)}
                onRemove={(index) => handleRemoveResource('observations', index)}
                disabled={state.loading}
              />
            )}

            {state.activeTab === 'conditions' && (
              <ConditionForm
                conditions={state.resourceData.conditions}
                onAdd={(condition) => handleAddResource('conditions', condition)}
                onRemove={(index) => handleRemoveResource('conditions', index)}
                disabled={state.loading}
              />
            )}

            {state.activeTab === 'medications' && (
              <MedicationRequestForm
                medicationRequests={state.resourceData.medicationRequests}
                onAdd={(medicationRequest) => handleAddResource('medicationRequests', medicationRequest)}
                onRemove={(index) => handleRemoveResource('medicationRequests', index)}
                disabled={state.loading}
              />
            )}

            {state.activeTab === 'diagnostics' && (
              <DiagnosticReportForm
                diagnosticReports={state.resourceData.diagnosticReports}
                onAdd={(diagnosticReport) => handleAddResource('diagnosticReports', diagnosticReport)}
                onRemove={(index) => handleRemoveResource('diagnosticReports', index)}
                disabled={state.loading}
              />
            )}

            {state.activeTab === 'procedures' && (
              <ProcedureForm
                procedures={state.resourceData.procedures}
                onAdd={(procedure) => handleAddResource('procedures', procedure)}
                onRemove={(index) => handleRemoveResource('procedures', index)}
                disabled={state.loading}
              />
            )}
          </div>
        </div>

        {state.validationErrors.length > 0 && (
          <ErrorList 
            errors={state.validationErrors}
            title="Please fix the following errors before submitting:"
            maxErrors={5}
          />
        )}

        {state.error && (
          <div className="modal-error">
            <InlineError error={state.error} size="large" />
          </div>
        )}

        <div className="modal-footer">
          <div className="resource-summary">
            {getResourceCount() > 0 && (
              <p>{getResourceCount()} resource(s) will be created with this encounter</p>
            )}
          </div>
          
          <div className="modal-actions">
            <button
              className="cancel-button"
              onClick={handleClose}
              disabled={state.loading}
            >
              Cancel
            </button>
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={state.loading}
            >
              {state.loading ? <Loading size="small" /> : 'Create Encounter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
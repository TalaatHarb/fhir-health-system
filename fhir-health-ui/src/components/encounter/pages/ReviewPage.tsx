import React, { useState, useCallback } from 'react';
import type { Patient, Encounter, Observation, Condition, MedicationRequest, DiagnosticReport, Procedure } from '../../../types/fhir';
import { fhirClient } from '../../../services/fhirClient';
import { useNotifications } from '../../../contexts/NotificationContext';
import { useTranslation } from '../../../hooks/useTranslation';
import { useModalNavigation } from '../../../hooks/useModalNavigation';
import type { ModalPageProps } from '../../common/Modal';
import { Loading } from '../../common/Loading';
import { InlineError } from '../../common/InlineError';
import type { EncounterFormData } from './EncounterDetailsPage';

export interface ReviewPageProps extends ModalPageProps {
  patient: Patient;
  onSuccess: (encounter: Encounter) => void;
}

export function ReviewPage({ modalId, pageId, pageData, patient, onSuccess }: ReviewPageProps) {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotifications();
  const { close, getPageData } = useModalNavigation(modalId);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all data from previous pages
  const encounterDetailsData = getPageData('encounter-details');
  const observationsData = getPageData('observations');
  const conditionsData = getPageData('conditions');
  const medicationsData = getPageData('medications');
  const diagnosticsData = getPageData('diagnostics');
  const proceduresData = getPageData('procedures');

  const encounterData: EncounterFormData = encounterDetailsData.encounterData;
  const observations: Omit<Observation, 'id' | 'resourceType' | 'subject' | 'encounter'>[] = observationsData.observations || [];
  const conditions: Omit<Condition, 'id' | 'resourceType' | 'subject' | 'encounter'>[] = conditionsData.conditions || [];
  const medicationRequests: Omit<MedicationRequest, 'id' | 'resourceType' | 'subject' | 'encounter'>[] = medicationsData.medicationRequests || [];
  const diagnosticReports: Omit<DiagnosticReport, 'id' | 'resourceType' | 'subject' | 'encounter'>[] = diagnosticsData.diagnosticReports || [];
  const procedures: Omit<Procedure, 'id' | 'resourceType' | 'subject' | 'encounter'>[] = proceduresData.procedures || [];

  // Helper functions
  const getPatientDisplayName = (patient: Patient): string => {
    const primaryName = patient.name?.[0];
    return primaryName ? 
      `${primaryName.given?.join(' ') || ''} ${primaryName.family || ''}`.trim() : 
      t('patient.unknownPatient');
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
    return observations.length + conditions.length + medicationRequests.length + diagnosticReports.length + procedures.length;
  };

  // Submit encounter and resources
  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Create encounter
      const encounterDataToCreate: Omit<Encounter, 'id'> = {
        resourceType: 'Encounter',
        status: encounterData.status,
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: encounterData.class,
          display: getEncounterClassDisplay(encounterData.class)
        },
        subject: {
          reference: `Patient/${patient.id}`,
          display: getPatientDisplayName(patient)
        },
        period: {
          start: encounterData.period.start,
          ...(encounterData.period.end && { end: encounterData.period.end })
        },
        ...(encounterData.type && {
          type: [{
            coding: [{
              system: 'http://snomed.info/sct',
              code: encounterData.type,
              display: getEncounterTypeDisplay(encounterData.type)
            }]
          }]
        }),
        ...(encounterData.reasonCode && {
          reasonCode: [{
            coding: [{
              system: 'http://snomed.info/sct',
              code: encounterData.reasonCode,
              display: encounterData.reasonText || encounterData.reasonCode
            }],
            text: encounterData.reasonText
          }]
        })
      };

      const createdEncounter = await fhirClient.createEncounter(encounterDataToCreate);

      // Create associated resources
      const resourcePromises: Promise<any>[] = [];

      // Create observations
      observations.forEach(obs => {
        const observationData: Omit<Observation, 'id'> = {
          ...obs,
          resourceType: 'Observation',
          subject: { reference: `Patient/${patient.id}` },
          encounter: { reference: `Encounter/${createdEncounter.id}` }
        };
        resourcePromises.push(fhirClient.createResource(observationData));
      });

      // Create conditions
      conditions.forEach(condition => {
        const conditionData: Omit<Condition, 'id'> = {
          ...condition,
          resourceType: 'Condition',
          subject: { reference: `Patient/${patient.id}` },
          encounter: { reference: `Encounter/${createdEncounter.id}` }
        };
        resourcePromises.push(fhirClient.createResource(conditionData));
      });

      // Create medication requests
      medicationRequests.forEach(medReq => {
        const medicationRequestData: Omit<MedicationRequest, 'id'> = {
          ...medReq,
          resourceType: 'MedicationRequest',
          subject: { reference: `Patient/${patient.id}` },
          encounter: { reference: `Encounter/${createdEncounter.id}` }
        };
        resourcePromises.push(fhirClient.createResource(medicationRequestData));
      });

      // Create diagnostic reports
      diagnosticReports.forEach(report => {
        const diagnosticReportData: Omit<DiagnosticReport, 'id'> = {
          ...report,
          resourceType: 'DiagnosticReport',
          subject: { reference: `Patient/${patient.id}` },
          encounter: { reference: `Encounter/${createdEncounter.id}` }
        };
        resourcePromises.push(fhirClient.createResource(diagnosticReportData));
      });

      // Create procedures
      procedures.forEach(procedure => {
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

      setLoading(false);
      
      // Show success notification
      const resourceCount = getResourceCount();
      showSuccess(
        t('encounter.encounterCreated'), 
        resourceCount > 0 
          ? t('encounter.encounterCreatedWithResources', { count: resourceCount.toString() })
          : t('encounter.encounterCreated')
      );
      
      onSuccess(createdEncounter);
      close();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('encounter.createFailed');
      setLoading(false);
      setError(errorMessage);
      showError(t('encounter.createFailed'), errorMessage);
    }
  }, [encounterData, observations, conditions, medicationRequests, diagnosticReports, procedures, patient, onSuccess, close, showSuccess, showError, t]);

  const handlePrevious = useCallback(() => {
    // Navigate back to procedures page
    close(); // For now, just close. In a real implementation, you might want to navigate back
  }, [close]);

  return (
    <div className="review-page">
      <div className="review-header">
        <h3>{t('encounter.reviewEncounter')}</h3>
        <p className="patient-info">
          {t('patient.patientName')}: {getPatientDisplayName(patient)} ({t('patient.patientId')}: {patient.id})
        </p>
      </div>

      <div className="review-content">
        <div className="encounter-summary">
          <h4>{t('encounter.encounterDetails')}</h4>
          <div className="summary-item">
            <strong>{t('encounter.encounterStatus')}:</strong> {encounterData.status}
          </div>
          <div className="summary-item">
            <strong>{t('encounter.encounterClass')}:</strong> {getEncounterClassDisplay(encounterData.class)}
          </div>
          {encounterData.type && (
            <div className="summary-item">
              <strong>{t('encounter.encounterType')}:</strong> {getEncounterTypeDisplay(encounterData.type)}
            </div>
          )}
          <div className="summary-item">
            <strong>{t('encounter.startDateTime')}:</strong> {new Date(encounterData.period.start).toLocaleString()}
          </div>
          {encounterData.period.end && (
            <div className="summary-item">
              <strong>{t('encounter.endDateTime')}:</strong> {new Date(encounterData.period.end).toLocaleString()}
            </div>
          )}
          {encounterData.reasonText && (
            <div className="summary-item">
              <strong>{t('encounter.reasonDescription')}:</strong> {encounterData.reasonText}
            </div>
          )}
        </div>

        <div className="resources-summary">
          <h4>{t('encounter.resourcesSummary')}</h4>
          <div className="resource-counts">
            <div className="count-item">
              <strong>{t('encounter.observations')}:</strong> {observations.length}
            </div>
            <div className="count-item">
              <strong>{t('encounter.conditions')}:</strong> {conditions.length}
            </div>
            <div className="count-item">
              <strong>{t('encounter.medications')}:</strong> {medicationRequests.length}
            </div>
            <div className="count-item">
              <strong>{t('encounter.diagnostics')}:</strong> {diagnosticReports.length}
            </div>
            <div className="count-item">
              <strong>{t('encounter.procedures')}:</strong> {procedures.length}
            </div>
          </div>
          
          {getResourceCount() > 0 && (
            <p className="total-resources">
              {t('encounter.totalResources', { count: getResourceCount().toString() })}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="review-error">
          <InlineError error={error} size="large" />
        </div>
      )}

      <div className="page-actions">
        <button
          type="button"
          className="previous-button"
          onClick={handlePrevious}
          disabled={loading}
        >
          {t('common.previous')}
        </button>
        <button
          type="button"
          className="submit-button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <Loading size="small" /> : t('encounter.createEncounter')}
        </button>
      </div>
    </div>
  );
}
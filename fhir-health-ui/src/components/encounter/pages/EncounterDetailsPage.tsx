import React, { useState, useCallback } from 'react';
import type { Patient, Encounter } from '../../../types/fhir';
import { useTranslation } from '../../../hooks/useTranslation';
import { useModalNavigation } from '../../../hooks/useModalNavigation';
import type { ModalPageProps } from '../../common/Modal';
import { InlineError, ErrorList } from '../../common/InlineError';

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

export interface EncounterDetailsPageProps extends ModalPageProps {
  patient: Patient;
}

export function EncounterDetailsPage({ modalId, pageId, pageData, patient }: EncounterDetailsPageProps) {
  const { t } = useTranslation();
  const { navigate, updateCurrentPageData, getCurrentPageData } = useModalNavigation(modalId);
  
  // Get encounter data from modal page data or use initial data
  const currentData = getCurrentPageData();
  const [encounterData, setEncounterData] = useState<EncounterFormData>(
    currentData.encounterData || {
      status: 'finished',
      class: 'AMB',
      period: {
        start: new Date().toISOString().slice(0, 16), // Current datetime in YYYY-MM-DDTHH:mm format
      }
    }
  );
  const [validationErrors, setValidationErrors] = useState<string[]>(currentData.validationErrors || []);

  // Handle encounter form changes
  const handleEncounterChange = useCallback((field: keyof EncounterFormData, value: any) => {
    const newEncounterData = {
      ...encounterData,
      [field]: value
    };
    
    setEncounterData(newEncounterData);
    
    // Update modal page data
    updateCurrentPageData({
      encounterData: newEncounterData,
      validationErrors,
    });
  }, [encounterData, validationErrors, updateCurrentPageData]);

  // Validate encounter form
  const validateEncounterForm = (): string[] => {
    const errors: string[] = [];
    
    if (!encounterData.status) {
      errors.push(t('encounter.statusRequired'));
    }
    
    if (!encounterData.class) {
      errors.push(t('encounter.classRequired'));
    }
    
    if (!encounterData.period.start) {
      errors.push(t('encounter.startDateRequired'));
    }
    
    if (encounterData.period.end && 
        new Date(encounterData.period.end) < new Date(encounterData.period.start)) {
      errors.push(t('encounter.endDateAfterStart'));
    }
    
    return errors;
  };

  // Handle navigation to next page
  const handleNext = useCallback(() => {
    const errors = validateEncounterForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      updateCurrentPageData({
        encounterData,
        validationErrors: errors,
      });
      return;
    }

    // Navigate to observations page
    navigate('observations');
  }, [encounterData, validateEncounterForm, navigate, updateCurrentPageData]);

  // Helper functions
  const getPatientDisplayName = (patient: Patient): string => {
    const primaryName = patient.name?.[0];
    return primaryName ? 
      `${primaryName.given?.join(' ') || ''} ${primaryName.family || ''}`.trim() : 
      t('patient.unknownPatient');
  };

  return (
    <div className="encounter-details-page">
      <div className="patient-info">
        <p>
          {t('patient.patientName')}: {getPatientDisplayName(patient)} ({t('patient.patientId')}: {patient.id})
        </p>
      </div>

      <div className="encounter-form">
        <div className="form-group">
          <label htmlFor="encounter-status">{t('encounter.encounterStatus')} *</label>
          <select
            id="encounter-status"
            value={encounterData.status}
            onChange={(e) => handleEncounterChange('status', e.target.value as Encounter['status'])}
            required
          >
            <option value="planned">{t('encounter.statusPlanned')}</option>
            <option value="arrived">{t('encounter.statusArrived')}</option>
            <option value="triaged">{t('encounter.statusTriaged')}</option>
            <option value="in-progress">{t('encounter.statusInProgress')}</option>
            <option value="onleave">{t('encounter.statusOnLeave')}</option>
            <option value="finished">{t('encounter.statusFinished')}</option>
            <option value="cancelled">{t('encounter.statusCancelled')}</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="encounter-class">{t('encounter.encounterClass')} *</label>
          <select
            id="encounter-class"
            value={encounterData.class}
            onChange={(e) => handleEncounterChange('class', e.target.value)}
            required
          >
            <option value="AMB">{t('encounter.classAmbulatory')}</option>
            <option value="EMER">{t('encounter.classEmergency')}</option>
            <option value="FLD">{t('encounter.classField')}</option>
            <option value="HH">{t('encounter.classHomeHealth')}</option>
            <option value="IMP">{t('encounter.classInpatient')}</option>
            <option value="ACUTE">{t('encounter.classInpatientAcute')}</option>
            <option value="NONAC">{t('encounter.classInpatientNonAcute')}</option>
            <option value="OBSENC">{t('encounter.classObservation')}</option>
            <option value="PRENC">{t('encounter.classPreAdmission')}</option>
            <option value="SS">{t('encounter.classShortStay')}</option>
            <option value="VR">{t('encounter.classVirtual')}</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="encounter-type">{t('encounter.encounterType')}</label>
          <select
            id="encounter-type"
            value={encounterData.type || ''}
            onChange={(e) => handleEncounterChange('type', e.target.value || undefined)}
          >
            <option value="">{t('encounter.selectTypeOptional')}</option>
            <option value="185349003">{t('encounter.typeCheckup')}</option>
            <option value="270427003">{t('encounter.typePatientInitiated')}</option>
            <option value="390906007">{t('encounter.typeFollowUp')}</option>
            <option value="406547006">{t('encounter.typeUrgentFollowUp')}</option>
            <option value="185347001">{t('encounter.typeProblem')}</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="encounter-start">{t('encounter.startDateTime')} *</label>
            <input
              type="datetime-local"
              id="encounter-start"
              value={encounterData.period.start}
              onChange={(e) => handleEncounterChange('period', { 
                ...encounterData.period, 
                start: e.target.value 
              })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="encounter-end">{t('encounter.endDateTime')}</label>
            <input
              type="datetime-local"
              id="encounter-end"
              value={encounterData.period.end || ''}
              onChange={(e) => handleEncounterChange('period', { 
                ...encounterData.period, 
                end: e.target.value || undefined 
              })}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="encounter-reason-code">{t('encounter.reasonCode')}</label>
          <input
            type="text"
            id="encounter-reason-code"
            value={encounterData.reasonCode || ''}
            onChange={(e) => handleEncounterChange('reasonCode', e.target.value || undefined)}
            placeholder={t('encounter.reasonCodePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label htmlFor="encounter-reason-text">{t('encounter.reasonDescription')}</label>
          <textarea
            id="encounter-reason-text"
            value={encounterData.reasonText || ''}
            onChange={(e) => handleEncounterChange('reasonText', e.target.value || undefined)}
            placeholder={t('encounter.reasonDescriptionPlaceholder')}
            rows={3}
          />
        </div>
      </div>

      {validationErrors.length > 0 && (
        <ErrorList 
          errors={validationErrors}
          title={t('validation.fixErrors')}
          maxErrors={5}
        />
      )}

      <div className="page-actions">
        <button
          type="button"
          className="next-button"
          onClick={handleNext}
        >
          {t('encounter.nextAddResources')}
        </button>
      </div>
    </div>
  );
}
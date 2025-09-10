import React, { useState, useEffect, useCallback } from 'react';
import type { Patient, Encounter, Bundle } from '../../types/fhir';
import { fhirClient } from '../../services/fhirClient';
import { useTranslation } from '../../hooks/useTranslation';
import { Loading } from '../common/Loading';
import { EncounterTimelineItem } from './EncounterTimelineItem';
import './EncounterTimeline.css';

export interface EncounterTimelineProps {
  patient: Patient;
  onEncounterSelect?: (encounter: Encounter) => void;
  onCreateEncounter?: () => void;
  refreshTrigger?: number; // Optional prop to trigger refresh
}

export interface EncounterTimelineState {
  encounters: Encounter[];
  loading: boolean;
  error: string | null;
  expandedEncounterId: string | null;
}

export function EncounterTimeline({ 
  patient, 
  onEncounterSelect, 
  onCreateEncounter,
  refreshTrigger 
}: EncounterTimelineProps): React.JSX.Element {
  const { t } = useTranslation();
  const [state, setState] = useState<EncounterTimelineState>({
    encounters: [],
    loading: false,
    error: null,
    expandedEncounterId: null,
  });

  // Fetch encounters for the patient
  const fetchEncounters = useCallback(async () => {
    if (!patient.id) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const bundle: Bundle<Encounter> = await fhirClient.getPatientEncounters(patient.id, {
        count: 100,
        sort: '-date' // Sort by date descending (most recent first)
      });

      const encounters = bundle.entry?.map(entry => entry.resource!).filter(Boolean) || [];
      
      // Sort encounters by period start date (most recent first)
      const sortedEncounters = encounters.sort((a, b) => {
        const dateA = a.period?.start ? new Date(a.period.start).getTime() : 0;
        const dateB = b.period?.start ? new Date(b.period.start).getTime() : 0;
        return dateB - dateA; // Descending order
      });

      setState(prev => ({
        ...prev,
        encounters: sortedEncounters,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('encounter.loadFailed');
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [patient.id]);

  // Load encounters when component mounts, patient changes, or refresh is triggered
  useEffect(() => {
    fetchEncounters();
  }, [fetchEncounters, refreshTrigger]);

  // Handle encounter expansion/collapse
  const handleEncounterToggle = useCallback((encounterId: string) => {
    setState(prev => ({
      ...prev,
      expandedEncounterId: prev.expandedEncounterId === encounterId ? null : encounterId,
    }));
  }, []);

  // Handle encounter selection
  const handleEncounterSelect = useCallback((encounter: Encounter) => {
    onEncounterSelect?.(encounter);
  }, [onEncounterSelect]);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    fetchEncounters();
  }, [fetchEncounters]);

  // Get patient display name
  const getPatientName = (): string => {
    const primaryName = patient.name?.[0];
    return primaryName ? 
      `${primaryName.given?.join(' ') || ''} ${primaryName.family || ''}`.trim() : 
      t('patient.unknownPatient');
  };

  return (
    <div className="encounter-timeline">
      <div className="encounter-timeline-header">
        <h3 className="timeline-title">
          {t('encounter.encounterTimeline')} - {getPatientName()}
        </h3>
        {onCreateEncounter && (
          <button
            className="create-encounter-button"
            onClick={onCreateEncounter}
            disabled={state.loading}
          >
            {t('encounter.createEncounter')}
          </button>
        )}
      </div>

      <div className="encounter-timeline-content">
        {state.loading && (
          <div className="timeline-loading">
            <Loading />
            <p>{t('encounter.loadingEncounters')}</p>
          </div>
        )}

        {state.error && (
          <div className="timeline-error">
            <div className="error-message">
              <h4>{t('encounter.errorLoadingEncounters')}</h4>
              <p>{state.error}</p>
            </div>
            <button 
              className="retry-button"
              onClick={handleRetry}
            >
              {t('common.retry')}
            </button>
          </div>
        )}

        {!state.loading && !state.error && state.encounters.length === 0 && (
          <div className="timeline-empty">
            <div className="empty-state">
              <h4>{t('encounter.noEncounters')}</h4>
              <p>{t('encounter.noEncountersDescription')}</p>
              {onCreateEncounter && (
                <button
                  className="create-first-encounter-button"
                  onClick={onCreateEncounter}
                >
                  {t('encounter.createFirstEncounter')}
                </button>
              )}
            </div>
          </div>
        )}

        {!state.loading && !state.error && state.encounters.length > 0 && (
          <div className="timeline-list">
            <div className="timeline-line" />
            {state.encounters.map((encounter, index) => (
              <EncounterTimelineItem
                key={encounter.id || `encounter-${index}`}
                encounter={encounter}
                isExpanded={state.expandedEncounterId === encounter.id}
                onToggle={() => encounter.id && handleEncounterToggle(encounter.id)}
                onSelect={() => handleEncounterSelect(encounter)}
                isFirst={index === 0}
                isLast={index === state.encounters.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useCallback } from 'react';
import type { Observation } from '../../../types/fhir';
import { useTranslation } from '../../../hooks/useTranslation';
import { useModalNavigation } from '../../../hooks/useModalNavigation';
import type { ModalPageProps } from '../../common/Modal';
import { ObservationForm } from '../forms/ObservationForm';

export interface ObservationsPageProps extends ModalPageProps {}

export function ObservationsPage({ modalId, pageId, pageData }: ObservationsPageProps) {
  const { t } = useTranslation();
  const { navigate, updateCurrentPageData, getCurrentPageData } = useModalNavigation(modalId);
  
  // Get observations data from modal page data or use initial data
  const currentData = getCurrentPageData();
  const [observations, setObservations] = useState<Omit<Observation, 'id' | 'resourceType' | 'subject' | 'encounter'>[]>(
    currentData.observations || []
  );

  // Handle adding observation
  const handleAddObservation = useCallback((observation: Omit<Observation, 'id' | 'resourceType' | 'subject' | 'encounter'>) => {
    const newObservations = [...observations, observation];
    setObservations(newObservations);
    
    // Update modal page data
    updateCurrentPageData({
      observations: newObservations,
    });
  }, [observations, updateCurrentPageData]);

  // Handle removing observation
  const handleRemoveObservation = useCallback((index: number) => {
    const newObservations = observations.filter((_, i) => i !== index);
    setObservations(newObservations);
    
    // Update modal page data
    updateCurrentPageData({
      observations: newObservations,
    });
  }, [observations, updateCurrentPageData]);

  // Handle navigation
  const handleNext = useCallback(() => {
    navigate('conditions');
  }, [navigate]);

  const handlePrevious = useCallback(() => {
    navigate('encounter-details');
  }, [navigate]);

  return (
    <div className="observations-page">
      <div className="page-header">
        <p className="page-description">
          {t('encounter.observationsDescription')}
        </p>
      </div>

      <ObservationForm
        observations={observations}
        onAdd={handleAddObservation}
        onRemove={handleRemoveObservation}
        disabled={false}
      />

      <div className="page-actions">
        <button
          type="button"
          className="previous-button"
          onClick={handlePrevious}
        >
          {t('common.previous')}
        </button>
        <button
          type="button"
          className="next-button"
          onClick={handleNext}
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  );
}
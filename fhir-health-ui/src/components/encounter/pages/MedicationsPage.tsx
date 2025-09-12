import React, { useState, useCallback } from 'react';
import type { MedicationRequest } from '../../../types/fhir';
import { useTranslation } from '../../../hooks/useTranslation';
import { useModalNavigation } from '../../../hooks/useModalNavigation';
import type { ModalPageProps } from '../../common/Modal';
import { MedicationRequestForm } from '../forms/MedicationRequestForm';

export interface MedicationsPageProps extends ModalPageProps {}

export function MedicationsPage({ modalId, pageId, pageData }: MedicationsPageProps) {
  const { t } = useTranslation();
  const { navigate, updateCurrentPageData, getCurrentPageData } = useModalNavigation(modalId);
  
  // Get medications data from modal page data or use initial data
  const currentData = getCurrentPageData();
  const [medicationRequests, setMedicationRequests] = useState<Omit<MedicationRequest, 'id' | 'resourceType' | 'subject' | 'encounter'>[]>(
    currentData.medicationRequests || []
  );

  // Handle adding medication request
  const handleAddMedicationRequest = useCallback((medicationRequest: Omit<MedicationRequest, 'id' | 'resourceType' | 'subject' | 'encounter'>) => {
    const newMedicationRequests = [...medicationRequests, medicationRequest];
    setMedicationRequests(newMedicationRequests);
    
    // Update modal page data
    updateCurrentPageData({
      medicationRequests: newMedicationRequests,
    });
  }, [medicationRequests, updateCurrentPageData]);

  // Handle removing medication request
  const handleRemoveMedicationRequest = useCallback((index: number) => {
    const newMedicationRequests = medicationRequests.filter((_, i) => i !== index);
    setMedicationRequests(newMedicationRequests);
    
    // Update modal page data
    updateCurrentPageData({
      medicationRequests: newMedicationRequests,
    });
  }, [medicationRequests, updateCurrentPageData]);

  // Handle navigation
  const handleNext = useCallback(() => {
    navigate('diagnostics');
  }, [navigate]);

  const handlePrevious = useCallback(() => {
    navigate('conditions');
  }, [navigate]);

  return (
    <div className="medications-page">
      <div className="page-header">
        <p className="page-description">
          {t('encounter.medicationsDescription')}
        </p>
      </div>

      <MedicationRequestForm
        medicationRequests={medicationRequests}
        onAdd={handleAddMedicationRequest}
        onRemove={handleRemoveMedicationRequest}
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
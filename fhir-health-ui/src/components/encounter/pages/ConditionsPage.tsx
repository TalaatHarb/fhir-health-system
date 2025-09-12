import React, { useState, useCallback } from 'react';
import type { Condition } from '../../../types/fhir';
import { useTranslation } from '../../../hooks/useTranslation';
import { useModalNavigation } from '../../../hooks/useModalNavigation';
import type { ModalPageProps } from '../../common/Modal';
import { ConditionForm } from '../forms/ConditionForm';

export interface ConditionsPageProps extends ModalPageProps {}

export function ConditionsPage({ modalId, pageId, pageData }: ConditionsPageProps) {
  const { t } = useTranslation();
  const { navigate, updateCurrentPageData, getCurrentPageData } = useModalNavigation(modalId);
  
  // Get conditions data from modal page data or use initial data
  const currentData = getCurrentPageData();
  const [conditions, setConditions] = useState<Omit<Condition, 'id' | 'resourceType' | 'subject' | 'encounter'>[]>(
    currentData.conditions || []
  );

  // Handle adding condition
  const handleAddCondition = useCallback((condition: Omit<Condition, 'id' | 'resourceType' | 'subject' | 'encounter'>) => {
    const newConditions = [...conditions, condition];
    setConditions(newConditions);
    
    // Update modal page data
    updateCurrentPageData({
      conditions: newConditions,
    });
  }, [conditions, updateCurrentPageData]);

  // Handle removing condition
  const handleRemoveCondition = useCallback((index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
    
    // Update modal page data
    updateCurrentPageData({
      conditions: newConditions,
    });
  }, [conditions, updateCurrentPageData]);

  // Handle navigation
  const handleNext = useCallback(() => {
    navigate('medications');
  }, [navigate]);

  const handlePrevious = useCallback(() => {
    navigate('observations');
  }, [navigate]);

  return (
    <div className="conditions-page">
      <div className="page-header">
        <p className="page-description">
          {t('encounter.conditionsDescription')}
        </p>
      </div>

      <ConditionForm
        conditions={conditions}
        onAdd={handleAddCondition}
        onRemove={handleRemoveCondition}
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
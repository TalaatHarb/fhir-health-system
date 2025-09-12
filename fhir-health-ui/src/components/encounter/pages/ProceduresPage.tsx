import React, { useState, useCallback } from 'react';
import type { Procedure } from '../../../types/fhir';
import { useTranslation } from '../../../hooks/useTranslation';
import { useModalNavigation } from '../../../hooks/useModalNavigation';
import type { ModalPageProps } from '../../common/Modal';
import { ProcedureForm } from '../forms/ProcedureForm';

export interface ProceduresPageProps extends ModalPageProps {}

export function ProceduresPage({ modalId, pageId, pageData }: ProceduresPageProps) {
  const { t } = useTranslation();
  const { navigate, updateCurrentPageData, getCurrentPageData } = useModalNavigation(modalId);
  
  // Get procedures data from modal page data or use initial data
  const currentData = getCurrentPageData();
  const [procedures, setProcedures] = useState<Omit<Procedure, 'id' | 'resourceType' | 'subject' | 'encounter'>[]>(
    currentData.procedures || []
  );

  // Handle adding procedure
  const handleAddProcedure = useCallback((procedure: Omit<Procedure, 'id' | 'resourceType' | 'subject' | 'encounter'>) => {
    const newProcedures = [...procedures, procedure];
    setProcedures(newProcedures);
    
    // Update modal page data
    updateCurrentPageData({
      procedures: newProcedures,
    });
  }, [procedures, updateCurrentPageData]);

  // Handle removing procedure
  const handleRemoveProcedure = useCallback((index: number) => {
    const newProcedures = procedures.filter((_, i) => i !== index);
    setProcedures(newProcedures);
    
    // Update modal page data
    updateCurrentPageData({
      procedures: newProcedures,
    });
  }, [procedures, updateCurrentPageData]);

  // Handle navigation
  const handleNext = useCallback(() => {
    navigate('review');
  }, [navigate]);

  const handlePrevious = useCallback(() => {
    navigate('diagnostics');
  }, [navigate]);

  return (
    <div className="procedures-page">
      <div className="page-header">
        <p className="page-description">
          {t('encounter.proceduresDescription')}
        </p>
      </div>

      <ProcedureForm
        procedures={procedures}
        onAdd={handleAddProcedure}
        onRemove={handleRemoveProcedure}
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
          {t('encounter.reviewAndCreate')}
        </button>
      </div>
    </div>
  );
}
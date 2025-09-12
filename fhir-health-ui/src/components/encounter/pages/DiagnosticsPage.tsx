import React, { useState, useCallback } from 'react';
import type { DiagnosticReport } from '../../../types/fhir';
import { useTranslation } from '../../../hooks/useTranslation';
import { useModalNavigation } from '../../../hooks/useModalNavigation';
import type { ModalPageProps } from '../../common/Modal';
import { DiagnosticReportForm } from '../forms/DiagnosticReportForm';

export interface DiagnosticsPageProps extends ModalPageProps {}

export function DiagnosticsPage({ modalId, pageId, pageData }: DiagnosticsPageProps) {
  const { t } = useTranslation();
  const { navigate, updateCurrentPageData, getCurrentPageData } = useModalNavigation(modalId);
  
  // Get diagnostics data from modal page data or use initial data
  const currentData = getCurrentPageData();
  const [diagnosticReports, setDiagnosticReports] = useState<Omit<DiagnosticReport, 'id' | 'resourceType' | 'subject' | 'encounter'>[]>(
    currentData.diagnosticReports || []
  );

  // Handle adding diagnostic report
  const handleAddDiagnosticReport = useCallback((diagnosticReport: Omit<DiagnosticReport, 'id' | 'resourceType' | 'subject' | 'encounter'>) => {
    const newDiagnosticReports = [...diagnosticReports, diagnosticReport];
    setDiagnosticReports(newDiagnosticReports);
    
    // Update modal page data
    updateCurrentPageData({
      diagnosticReports: newDiagnosticReports,
    });
  }, [diagnosticReports, updateCurrentPageData]);

  // Handle removing diagnostic report
  const handleRemoveDiagnosticReport = useCallback((index: number) => {
    const newDiagnosticReports = diagnosticReports.filter((_, i) => i !== index);
    setDiagnosticReports(newDiagnosticReports);
    
    // Update modal page data
    updateCurrentPageData({
      diagnosticReports: newDiagnosticReports,
    });
  }, [diagnosticReports, updateCurrentPageData]);

  // Handle navigation
  const handleNext = useCallback(() => {
    navigate('procedures');
  }, [navigate]);

  const handlePrevious = useCallback(() => {
    navigate('medications');
  }, [navigate]);

  return (
    <div className="diagnostics-page">
      <div className="page-header">
        <p className="page-description">
          {t('encounter.diagnosticsDescription')}
        </p>
      </div>

      <DiagnosticReportForm
        diagnosticReports={diagnosticReports}
        onAdd={handleAddDiagnosticReport}
        onRemove={handleRemoveDiagnosticReport}
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
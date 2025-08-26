import React, { useState, useCallback } from 'react';
import type { DiagnosticReport } from '../../../types/fhir';
import './ResourceForm.css';

export interface DiagnosticReportFormProps {
  diagnosticReports: Omit<DiagnosticReport, 'id' | 'resourceType' | 'subject' | 'encounter'>[];
  onAdd: (diagnosticReport: Omit<DiagnosticReport, 'id' | 'resourceType' | 'subject' | 'encounter'>) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export interface DiagnosticReportFormData {
  status: DiagnosticReport['status'];
  category: string;
  categoryDisplay: string;
  code: string;
  codeDisplay: string;
  effectiveType: 'dateTime' | 'period';
  effectiveDateTime?: string;
  effectivePeriodStart?: string;
  effectivePeriodEnd?: string;
  issued: string;
  conclusion?: string;
  conclusionCode?: string;
  conclusionCodeDisplay?: string;
}

const DIAGNOSTIC_REPORT_STATUS_CODES = [
  { code: 'registered', display: 'Registered' },
  { code: 'partial', display: 'Partial' },
  { code: 'preliminary', display: 'Preliminary' },
  { code: 'final', display: 'Final' },
  { code: 'amended', display: 'Amended' },
  { code: 'corrected', display: 'Corrected' },
  { code: 'appended', display: 'Appended' },
  { code: 'cancelled', display: 'Cancelled' },
  { code: 'entered-in-error', display: 'Entered in Error' },
  { code: 'unknown', display: 'Unknown' }
];

const DIAGNOSTIC_REPORT_CATEGORIES = [
  { code: 'LAB', display: 'Laboratory', system: 'http://terminology.hl7.org/CodeSystem/v2-0074' },
  { code: 'RAD', display: 'Radiology', system: 'http://terminology.hl7.org/CodeSystem/v2-0074' },
  { code: 'CT', display: 'CAT Scan', system: 'http://terminology.hl7.org/CodeSystem/v2-0074' },
  { code: 'NMR', display: 'Nuclear Magnetic Resonance', system: 'http://terminology.hl7.org/CodeSystem/v2-0074' },
  { code: 'NMS', display: 'Nuclear Medicine Scan', system: 'http://terminology.hl7.org/CodeSystem/v2-0074' },
  { code: 'NUC', display: 'Nuclear Radiology', system: 'http://terminology.hl7.org/CodeSystem/v2-0074' },
  { code: 'OTH', display: 'Other', system: 'http://terminology.hl7.org/CodeSystem/v2-0074' },
  { code: 'OUS', display: 'OB Ultrasound', system: 'http://terminology.hl7.org/CodeSystem/v2-0074' },
  { code: 'PF', display: 'Pulmonary Function', system: 'http://terminology.hl7.org/CodeSystem/v2-0074' },
  { code: 'PHY', display: 'Physician', system: 'http://terminology.hl7.org/CodeSystem/v2-0074' },
  { code: 'PT', display: 'Physical Therapy', system: 'http://terminology.hl7.org/CodeSystem/v2-0074' },
  { code: 'RUS', display: 'Radiology Ultrasound', system: 'http://terminology.hl7.org/CodeSystem/v2-0074' },
  { code: 'RX', display: 'Radiograph', system: 'http://terminology.hl7.org/CodeSystem/v2-0074' },
  { code: 'SP', display: 'Surgical Pathology', system: 'http://terminology.hl7.org/CodeSystem/v2-0074' },
  { code: 'UR', display: 'Urinalysis', system: 'http://terminology.hl7.org/CodeSystem/v2-0074' },
  { code: 'VUS', display: 'Vascular Ultrasound', system: 'http://terminology.hl7.org/CodeSystem/v2-0074' }
];

const COMMON_DIAGNOSTIC_REPORTS = [
  // Laboratory
  { code: '58410-2', display: 'Complete blood count (hemogram) panel - Blood by Automated count', category: 'LAB' },
  { code: '24323-8', display: 'Comprehensive metabolic 2000 panel - Serum or Plasma', category: 'LAB' },
  { code: '57698-3', display: 'Lipid panel with direct LDL - Serum or Plasma', category: 'LAB' },
  { code: '4548-4', display: 'Hemoglobin A1c/Hemoglobin.total in Blood', category: 'LAB' },
  { code: '33747-0', display: 'General appearance of Patient', category: 'PHY' },
  { code: '11502-2', display: 'Laboratory report', category: 'LAB' },
  
  // Radiology
  { code: '30746-2', display: 'CT Head W contrast IV', category: 'CT' },
  { code: '36643-5', display: 'XR Chest 2 Views', category: 'RX' },
  { code: '69424-9', display: 'US Pelvis Fetus for pregnancy dating', category: 'OUS' },
  { code: '24627-2', display: 'MR Brain WO contrast', category: 'NMR' },
  { code: '36572-6', display: 'XR Abdomen AP single view', category: 'RX' },
  { code: '42272-5', display: 'CT Abdomen and Pelvis W contrast IV', category: 'CT' },
  
  // Other
  { code: '28010-7', display: 'Electrocardiogram study', category: 'OTH' },
  { code: '11524-6', display: 'EKG study', category: 'OTH' },
  { code: '18748-4', display: 'Diagnostic imaging study', category: 'RAD' },
  { code: '11529-5', display: 'Discharge summary', category: 'PHY' }
];

const COMMON_CONCLUSION_CODES = [
  { code: '17621005', display: 'Normal', system: 'http://snomed.info/sct' },
  { code: '263654008', display: 'Abnormal', system: 'http://snomed.info/sct' },
  { code: '10828004', display: 'Positive', system: 'http://snomed.info/sct' },
  { code: '260385009', display: 'Negative', system: 'http://snomed.info/sct' },
  { code: '11896004', display: 'Intermediate', system: 'http://snomed.info/sct' },
  { code: '385432009', display: 'Not applicable', system: 'http://snomed.info/sct' },
  { code: '82334004', display: 'Indeterminate', system: 'http://snomed.info/sct' }
];

export function DiagnosticReportForm({ diagnosticReports, onAdd, onRemove, disabled }: DiagnosticReportFormProps): React.JSX.Element {
  const [formData, setFormData] = useState<DiagnosticReportFormData>({
    status: 'final',
    category: 'LAB',
    categoryDisplay: 'Laboratory',
    code: '',
    codeDisplay: '',
    effectiveType: 'dateTime',
    effectiveDateTime: new Date().toISOString().slice(0, 16),
    issued: new Date().toISOString().slice(0, 16)
  });

  const [showForm, setShowForm] = useState(false);

  // Handle form field changes
  const handleChange = useCallback((field: keyof DiagnosticReportFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle diagnostic report code selection
  const handleReportSelect = useCallback((reportCode: string) => {
    const report = COMMON_DIAGNOSTIC_REPORTS.find(rep => rep.code === reportCode);
    if (report) {
      const categoryObj = DIAGNOSTIC_REPORT_CATEGORIES.find(cat => cat.code === report.category);
      setFormData(prev => ({
        ...prev,
        code: report.code,
        codeDisplay: report.display,
        category: report.category,
        categoryDisplay: categoryObj?.display || report.category
      }));
    }
  }, []);

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.code) errors.push('Diagnostic report code is required');
    if (!formData.codeDisplay) errors.push('Diagnostic report display name is required');
    if (!formData.issued) errors.push('Issued date is required');
    
    if (formData.effectiveType === 'dateTime' && !formData.effectiveDateTime) {
      errors.push('Effective date/time is required when effective type is dateTime');
    }
    if (formData.effectiveType === 'period') {
      if (!formData.effectivePeriodStart) {
        errors.push('Effective period start is required when effective type is period');
      }
      if (formData.effectivePeriodEnd && formData.effectivePeriodStart && 
          new Date(formData.effectivePeriodEnd) < new Date(formData.effectivePeriodStart)) {
        errors.push('Effective period end must be after start');
      }
    }
    
    return errors;
  };

  // Add diagnostic report
  const handleAdd = useCallback(() => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    const categoryObj = DIAGNOSTIC_REPORT_CATEGORIES.find(cat => cat.code === formData.category);
    const conclusionCodeObj = formData.conclusionCode ? 
      COMMON_CONCLUSION_CODES.find(code => code.code === formData.conclusionCode) : undefined;
    
    const diagnosticReport: Omit<DiagnosticReport, 'id' | 'resourceType' | 'subject' | 'encounter'> = {
      status: formData.status,
      category: categoryObj ? [{
        coding: [{
          system: categoryObj.system,
          code: categoryObj.code,
          display: categoryObj.display
        }]
      }] : undefined,
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: formData.code,
          display: formData.codeDisplay
        }],
        text: formData.codeDisplay
      },
      ...(formData.effectiveType === 'dateTime' && formData.effectiveDateTime && {
        effectiveDateTime: formData.effectiveDateTime
      }),
      ...(formData.effectiveType === 'period' && formData.effectivePeriodStart && {
        effectivePeriod: {
          start: formData.effectivePeriodStart,
          ...(formData.effectivePeriodEnd && { end: formData.effectivePeriodEnd })
        }
      }),
      issued: formData.issued,
      ...(formData.conclusion && { conclusion: formData.conclusion }),
      ...(conclusionCodeObj && {
        conclusionCode: [{
          coding: [{
            system: conclusionCodeObj.system,
            code: conclusionCodeObj.code,
            display: conclusionCodeObj.display
          }]
        }]
      })
    };

    onAdd(diagnosticReport);
    
    // Reset form
    setFormData({
      status: 'final',
      category: 'LAB',
      categoryDisplay: 'Laboratory',
      code: '',
      codeDisplay: '',
      effectiveType: 'dateTime',
      effectiveDateTime: new Date().toISOString().slice(0, 16),
      issued: new Date().toISOString().slice(0, 16)
    });
    setShowForm(false);
  }, [formData, onAdd]);

  // Format diagnostic report for display
  const formatDiagnosticReport = (report: Omit<DiagnosticReport, 'id' | 'resourceType' | 'subject' | 'encounter'>, index: number): string => {
    const code = report.code?.text || report.code?.coding?.[0]?.display || 'Unknown';
    const category = report.category?.[0]?.coding?.[0]?.display || 'Unknown category';
    const conclusion = report.conclusion ? ` - ${report.conclusion.substring(0, 50)}${report.conclusion.length > 50 ? '...' : ''}` : '';
    
    return `${code} (${category})${conclusion}`;
  };

  return (
    <div className="resource-form">
      <div className="resource-form-header">
        <h3>Diagnostic Reports</h3>
        <button
          className="add-resource-button"
          onClick={() => setShowForm(true)}
          disabled={disabled || showForm}
        >
          Add Diagnostic Report
        </button>
      </div>

      {diagnosticReports.length > 0 && (
        <div className="resource-list">
          {diagnosticReports.map((diagnosticReport, index) => (
            <div key={index} className="resource-item">
              <div className="resource-content">
                <span className="resource-summary">{formatDiagnosticReport(diagnosticReport, index)}</span>
                <span className="resource-status">{diagnosticReport.status}</span>
              </div>
              <button
                className="remove-resource-button"
                onClick={() => onRemove(index)}
                disabled={disabled}
                aria-label="Remove diagnostic report"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="resource-form-modal">
          <div className="form-content">
            <h4>Add New Diagnostic Report</h4>

            <div className="form-group">
              <label>Common Diagnostic Reports</label>
              <select
                value=""
                onChange={(e) => e.target.value && handleReportSelect(e.target.value)}
                disabled={disabled}
              >
                <option value="">Select a common diagnostic report...</option>
                {COMMON_DIAGNOSTIC_REPORTS.map(report => (
                  <option key={report.code} value={report.code}>
                    {report.display} ({report.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as DiagnosticReport['status'])}
                  disabled={disabled}
                  required
                >
                  {DIAGNOSTIC_REPORT_STATUS_CODES.map(status => (
                    <option key={status.code} value={status.code}>{status.display}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const categoryObj = DIAGNOSTIC_REPORT_CATEGORIES.find(cat => cat.code === e.target.value);
                    handleChange('category', e.target.value);
                    handleChange('categoryDisplay', categoryObj?.display || e.target.value);
                  }}
                  disabled={disabled}
                  required
                >
                  {DIAGNOSTIC_REPORT_CATEGORIES.map(cat => (
                    <option key={cat.code} value={cat.code}>{cat.display}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  disabled={disabled}
                  placeholder="LOINC code"
                  required
                />
              </div>

              <div className="form-group">
                <label>Display Name *</label>
                <input
                  type="text"
                  value={formData.codeDisplay}
                  onChange={(e) => handleChange('codeDisplay', e.target.value)}
                  disabled={disabled}
                  placeholder="Human readable name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Effective Type *</label>
              <select
                value={formData.effectiveType}
                onChange={(e) => handleChange('effectiveType', e.target.value as 'dateTime' | 'period')}
                disabled={disabled}
                required
              >
                <option value="dateTime">Specific date/time</option>
                <option value="period">Period (start and end)</option>
              </select>
            </div>

            {formData.effectiveType === 'dateTime' && (
              <div className="form-group">
                <label>Effective Date/Time *</label>
                <input
                  type="datetime-local"
                  value={formData.effectiveDateTime || ''}
                  onChange={(e) => handleChange('effectiveDateTime', e.target.value)}
                  disabled={disabled}
                  required
                />
              </div>
            )}

            {formData.effectiveType === 'period' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Period Start *</label>
                  <input
                    type="datetime-local"
                    value={formData.effectivePeriodStart || ''}
                    onChange={(e) => handleChange('effectivePeriodStart', e.target.value)}
                    disabled={disabled}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Period End</label>
                  <input
                    type="datetime-local"
                    value={formData.effectivePeriodEnd || ''}
                    onChange={(e) => handleChange('effectivePeriodEnd', e.target.value || undefined)}
                    disabled={disabled}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Issued Date *</label>
              <input
                type="datetime-local"
                value={formData.issued}
                onChange={(e) => handleChange('issued', e.target.value)}
                disabled={disabled}
                required
              />
            </div>

            <div className="form-group">
              <label>Conclusion</label>
              <textarea
                value={formData.conclusion || ''}
                onChange={(e) => handleChange('conclusion', e.target.value || undefined)}
                disabled={disabled}
                placeholder="Clinical interpretation of the results"
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Conclusion Code</label>
              <select
                value={formData.conclusionCode || ''}
                onChange={(e) => {
                  const conclusionObj = COMMON_CONCLUSION_CODES.find(code => code.code === e.target.value);
                  handleChange('conclusionCode', e.target.value || undefined);
                  handleChange('conclusionCodeDisplay', conclusionObj?.display);
                }}
                disabled={disabled}
              >
                <option value="">Select conclusion code (optional)</option>
                {COMMON_CONCLUSION_CODES.map(conclusion => (
                  <option key={conclusion.code} value={conclusion.code}>{conclusion.display}</option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button
                className="cancel-button"
                onClick={() => setShowForm(false)}
                disabled={disabled}
              >
                Cancel
              </button>
              <button
                className="add-button"
                onClick={handleAdd}
                disabled={disabled}
              >
                Add Diagnostic Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
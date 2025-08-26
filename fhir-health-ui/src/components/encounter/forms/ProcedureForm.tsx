import React, { useState, useCallback } from 'react';
import type { Procedure } from '../../../types/fhir';
import './ResourceForm.css';

export interface ProcedureFormProps {
  procedures: Omit<Procedure, 'id' | 'resourceType' | 'subject' | 'encounter'>[];
  onAdd: (procedure: Omit<Procedure, 'id' | 'resourceType' | 'subject' | 'encounter'>) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export interface ProcedureFormData {
  status: Procedure['status'];
  category?: string;
  categoryDisplay?: string;
  code: string;
  codeDisplay: string;
  performedType: 'dateTime' | 'period' | 'string';
  performedDateTime?: string;
  performedPeriodStart?: string;
  performedPeriodEnd?: string;
  performedString?: string;
  reasonCode?: string;
  reasonText?: string;
  outcome?: string;
  outcomeDisplay?: string;
  note?: string;
}

const PROCEDURE_STATUS_CODES = [
  { code: 'preparation', display: 'Preparation' },
  { code: 'in-progress', display: 'In Progress' },
  { code: 'not-done', display: 'Not Done' },
  { code: 'on-hold', display: 'On Hold' },
  { code: 'stopped', display: 'Stopped' },
  { code: 'completed', display: 'Completed' },
  { code: 'entered-in-error', display: 'Entered in Error' },
  { code: 'unknown', display: 'Unknown' }
];

const PROCEDURE_CATEGORIES = [
  { code: '387713003', display: 'Surgical procedure', system: 'http://snomed.info/sct' },
  { code: '103693007', display: 'Diagnostic procedure', system: 'http://snomed.info/sct' },
  { code: '182813001', display: 'Emergency procedure', system: 'http://snomed.info/sct' },
  { code: '76464004', display: 'Preventive procedure', system: 'http://snomed.info/sct' },
  { code: '277132007', display: 'Therapeutic procedure', system: 'http://snomed.info/sct' },
  { code: '394841004', display: 'Other category', system: 'http://snomed.info/sct' }
];

const COMMON_PROCEDURES = [
  // Surgical procedures
  { code: '80146002', display: 'Appendectomy', category: '387713003' },
  { code: '174281007', display: 'Cholecystectomy', category: '387713003' },
  { code: '232717009', display: 'Coronary artery bypass graft', category: '387713003' },
  { code: '81266008', display: 'Heart valve replacement', category: '387713003' },
  { code: '52734007', display: 'Total hip replacement', category: '387713003' },
  { code: '179344006', display: 'Cataract extraction', category: '387713003' },
  
  // Diagnostic procedures
  { code: '73761001', display: 'Colonoscopy', category: '103693007' },
  { code: '423827005', display: 'Upper endoscopy', category: '103693007' },
  { code: '71388002', display: 'Procedure', category: '103693007' },
  { code: '386053000', display: 'Evaluation procedure', category: '103693007' },
  
  // Therapeutic procedures
  { code: '182840001', display: 'Injection', category: '277132007' },
  { code: '18946005', display: 'Immunization', category: '76464004' },
  { code: '33879002', display: 'Administration of vaccine', category: '76464004' },
  { code: '76601001', display: 'Intramuscular injection', category: '277132007' },
  { code: '72641008', display: 'Administration of substance', category: '277132007' },
  
  // Emergency procedures
  { code: '89666000', display: 'Cardiopulmonary resuscitation', category: '182813001' },
  { code: '112802009', display: 'Cardioversion', category: '182813001' },
  { code: '225358003', display: 'Wound care', category: '277132007' },
  
  // Common outpatient procedures
  { code: '65546002', display: 'Biopsy', category: '103693007' },
  { code: '86273004', display: 'Suture', category: '277132007' },
  { code: '34896006', display: 'Infusion', category: '277132007' },
  { code: '18629005', display: 'Administration of drug or medicament', category: '277132007' }
];

const OUTCOME_CODES = [
  { code: '385669000', display: 'Successful', system: 'http://snomed.info/sct' },
  { code: '385671000', display: 'Unsuccessful', system: 'http://snomed.info/sct' },
  { code: '385670004', display: 'Partially successful', system: 'http://snomed.info/sct' },
  { code: '182840001', display: 'Procedure stopped', system: 'http://snomed.info/sct' },
  { code: '385658003', display: 'Done', system: 'http://snomed.info/sct' },
  { code: '385660001', display: 'Not done', system: 'http://snomed.info/sct' }
];

export function ProcedureForm({ procedures, onAdd, onRemove, disabled }: ProcedureFormProps): React.JSX.Element {
  const [formData, setFormData] = useState<ProcedureFormData>({
    status: 'completed',
    code: '',
    codeDisplay: '',
    performedType: 'dateTime',
    performedDateTime: new Date().toISOString().slice(0, 16)
  });

  const [showForm, setShowForm] = useState(false);

  // Handle form field changes
  const handleChange = useCallback((field: keyof ProcedureFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle procedure code selection
  const handleProcedureSelect = useCallback((procedureCode: string) => {
    const procedure = COMMON_PROCEDURES.find(proc => proc.code === procedureCode);
    if (procedure) {
      const categoryObj = PROCEDURE_CATEGORIES.find(cat => cat.code === procedure.category);
      setFormData(prev => ({
        ...prev,
        code: procedure.code,
        codeDisplay: procedure.display,
        category: procedure.category,
        categoryDisplay: categoryObj?.display
      }));
    }
  }, []);

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.code) errors.push('Procedure code is required');
    if (!formData.codeDisplay) errors.push('Procedure display name is required');
    
    if (formData.performedType === 'dateTime' && !formData.performedDateTime) {
      errors.push('Performed date/time is required when performed type is dateTime');
    }
    if (formData.performedType === 'period' && !formData.performedPeriodStart) {
      errors.push('Performed period start is required when performed type is period');
    }
    if (formData.performedType === 'string' && !formData.performedString) {
      errors.push('Performed description is required when performed type is string');
    }
    
    if (formData.performedType === 'period' && formData.performedPeriodEnd && formData.performedPeriodStart &&
        new Date(formData.performedPeriodEnd) < new Date(formData.performedPeriodStart)) {
      errors.push('Performed period end must be after start');
    }
    
    return errors;
  };

  // Add procedure
  const handleAdd = useCallback(() => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    const categoryObj = formData.category ? PROCEDURE_CATEGORIES.find(cat => cat.code === formData.category) : undefined;
    const outcomeObj = formData.outcome ? OUTCOME_CODES.find(out => out.code === formData.outcome) : undefined;
    
    const procedure: Omit<Procedure, 'id' | 'resourceType' | 'subject' | 'encounter'> = {
      status: formData.status,
      ...(categoryObj && {
        category: {
          coding: [{
            system: categoryObj.system,
            code: categoryObj.code,
            display: categoryObj.display
          }]
        }
      }),
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: formData.code,
          display: formData.codeDisplay
        }],
        text: formData.codeDisplay
      },
      ...(formData.performedType === 'dateTime' && formData.performedDateTime && {
        performedDateTime: formData.performedDateTime
      }),
      ...(formData.performedType === 'period' && formData.performedPeriodStart && {
        performedPeriod: {
          start: formData.performedPeriodStart,
          ...(formData.performedPeriodEnd && { end: formData.performedPeriodEnd })
        }
      }),
      ...(formData.performedType === 'string' && formData.performedString && {
        performedString: formData.performedString
      }),
      ...(formData.reasonCode && {
        reasonCode: [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: formData.reasonCode,
            display: formData.reasonText || formData.reasonCode
          }],
          text: formData.reasonText
        }]
      }),
      ...(outcomeObj && {
        outcome: {
          coding: [{
            system: outcomeObj.system,
            code: outcomeObj.code,
            display: outcomeObj.display
          }]
        }
      }),
      ...(formData.note && {
        note: [{
          text: formData.note
        }]
      })
    };

    onAdd(procedure);
    
    // Reset form
    setFormData({
      status: 'completed',
      code: '',
      codeDisplay: '',
      performedType: 'dateTime',
      performedDateTime: new Date().toISOString().slice(0, 16)
    });
    setShowForm(false);
  }, [formData, onAdd]);

  // Format procedure for display
  const formatProcedure = (procedure: Omit<Procedure, 'id' | 'resourceType' | 'subject' | 'encounter'>, index: number): string => {
    const code = procedure.code?.text || procedure.code?.coding?.[0]?.display || 'Unknown';
    const category = procedure.category?.coding?.[0]?.display || '';
    const outcome = procedure.outcome?.coding?.[0]?.display || '';
    
    return `${code}${category ? ` (${category})` : ''}${outcome ? ` - ${outcome}` : ''}`;
  };

  return (
    <div className="resource-form">
      <div className="resource-form-header">
        <h3>Procedures</h3>
        <button
          className="add-resource-button"
          onClick={() => setShowForm(true)}
          disabled={disabled || showForm}
        >
          Add Procedure
        </button>
      </div>

      {procedures.length > 0 && (
        <div className="resource-list">
          {procedures.map((procedure, index) => (
            <div key={index} className="resource-item">
              <div className="resource-content">
                <span className="resource-summary">{formatProcedure(procedure, index)}</span>
                <span className="resource-status">{procedure.status}</span>
              </div>
              <button
                className="remove-resource-button"
                onClick={() => onRemove(index)}
                disabled={disabled}
                aria-label="Remove procedure"
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
            <h4>Add New Procedure</h4>

            <div className="form-group">
              <label>Common Procedures</label>
              <select
                value=""
                onChange={(e) => e.target.value && handleProcedureSelect(e.target.value)}
                disabled={disabled}
              >
                <option value="">Select a common procedure...</option>
                {COMMON_PROCEDURES.map(procedure => (
                  <option key={procedure.code} value={procedure.code}>
                    {procedure.display}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as Procedure['status'])}
                  disabled={disabled}
                  required
                >
                  {PROCEDURE_STATUS_CODES.map(status => (
                    <option key={status.code} value={status.code}>{status.display}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => {
                    const categoryObj = PROCEDURE_CATEGORIES.find(cat => cat.code === e.target.value);
                    handleChange('category', e.target.value || undefined);
                    handleChange('categoryDisplay', categoryObj?.display);
                  }}
                  disabled={disabled}
                >
                  <option value="">Select category (optional)</option>
                  {PROCEDURE_CATEGORIES.map(cat => (
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
                  placeholder="SNOMED CT code"
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
              <label>Performed Type *</label>
              <select
                value={formData.performedType}
                onChange={(e) => handleChange('performedType', e.target.value as 'dateTime' | 'period' | 'string')}
                disabled={disabled}
                required
              >
                <option value="dateTime">Specific date/time</option>
                <option value="period">Period (start and end)</option>
                <option value="string">Description</option>
              </select>
            </div>

            {formData.performedType === 'dateTime' && (
              <div className="form-group">
                <label>Performed Date/Time *</label>
                <input
                  type="datetime-local"
                  value={formData.performedDateTime || ''}
                  onChange={(e) => handleChange('performedDateTime', e.target.value)}
                  disabled={disabled}
                  required
                />
              </div>
            )}

            {formData.performedType === 'period' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Period Start *</label>
                  <input
                    type="datetime-local"
                    value={formData.performedPeriodStart || ''}
                    onChange={(e) => handleChange('performedPeriodStart', e.target.value)}
                    disabled={disabled}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Period End</label>
                  <input
                    type="datetime-local"
                    value={formData.performedPeriodEnd || ''}
                    onChange={(e) => handleChange('performedPeriodEnd', e.target.value || undefined)}
                    disabled={disabled}
                  />
                </div>
              </div>
            )}

            {formData.performedType === 'string' && (
              <div className="form-group">
                <label>Performed Description *</label>
                <input
                  type="text"
                  value={formData.performedString || ''}
                  onChange={(e) => handleChange('performedString', e.target.value)}
                  disabled={disabled}
                  placeholder="e.g., 'during surgery', 'post-operative'"
                  required
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Reason Code</label>
                <input
                  type="text"
                  value={formData.reasonCode || ''}
                  onChange={(e) => handleChange('reasonCode', e.target.value || undefined)}
                  disabled={disabled}
                  placeholder="SNOMED CT code (optional)"
                />
              </div>

              <div className="form-group">
                <label>Reason Description</label>
                <input
                  type="text"
                  value={formData.reasonText || ''}
                  onChange={(e) => handleChange('reasonText', e.target.value || undefined)}
                  disabled={disabled}
                  placeholder="Reason for procedure"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Outcome</label>
              <select
                value={formData.outcome || ''}
                onChange={(e) => {
                  const outcomeObj = OUTCOME_CODES.find(out => out.code === e.target.value);
                  handleChange('outcome', e.target.value || undefined);
                  handleChange('outcomeDisplay', outcomeObj?.display);
                }}
                disabled={disabled}
              >
                <option value="">Select outcome (optional)</option>
                {OUTCOME_CODES.map(outcome => (
                  <option key={outcome.code} value={outcome.code}>{outcome.display}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.note || ''}
                onChange={(e) => handleChange('note', e.target.value || undefined)}
                disabled={disabled}
                placeholder="Additional notes about this procedure"
                rows={3}
              />
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
                Add Procedure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
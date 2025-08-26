import React, { useState, useCallback } from 'react';
import type { Condition, CodeableConcept } from '../../../types/fhir';
import './ResourceForm.css';

export interface ConditionFormProps {
  conditions: Omit<Condition, 'id' | 'resourceType' | 'subject' | 'encounter'>[];
  onAdd: (condition: Omit<Condition, 'id' | 'resourceType' | 'subject' | 'encounter'>) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export interface ConditionFormData {
  clinicalStatus: string;
  verificationStatus: string;
  category: string;
  severity?: string;
  severityDisplay?: string;
  code: string;
  codeDisplay: string;
  onsetType: 'dateTime' | 'string' | 'none';
  onsetDateTime?: string;
  onsetString?: string;
  abatementType: 'dateTime' | 'string' | 'boolean' | 'none';
  abatementDateTime?: string;
  abatementString?: string;
  abatementBoolean?: boolean;
  recordedDate: string;
  note?: string;
}

const CLINICAL_STATUS_CODES = [
  { code: 'active', display: 'Active', system: 'http://terminology.hl7.org/CodeSystem/condition-clinical' },
  { code: 'recurrence', display: 'Recurrence', system: 'http://terminology.hl7.org/CodeSystem/condition-clinical' },
  { code: 'relapse', display: 'Relapse', system: 'http://terminology.hl7.org/CodeSystem/condition-clinical' },
  { code: 'inactive', display: 'Inactive', system: 'http://terminology.hl7.org/CodeSystem/condition-clinical' },
  { code: 'remission', display: 'Remission', system: 'http://terminology.hl7.org/CodeSystem/condition-clinical' },
  { code: 'resolved', display: 'Resolved', system: 'http://terminology.hl7.org/CodeSystem/condition-clinical' }
];

const VERIFICATION_STATUS_CODES = [
  { code: 'unconfirmed', display: 'Unconfirmed', system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status' },
  { code: 'provisional', display: 'Provisional', system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status' },
  { code: 'differential', display: 'Differential', system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status' },
  { code: 'confirmed', display: 'Confirmed', system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status' },
  { code: 'refuted', display: 'Refuted', system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status' },
  { code: 'entered-in-error', display: 'Entered in Error', system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status' }
];

const CONDITION_CATEGORIES = [
  { code: 'problem-list-item', display: 'Problem List Item', system: 'http://terminology.hl7.org/CodeSystem/condition-category' },
  { code: 'encounter-diagnosis', display: 'Encounter Diagnosis', system: 'http://terminology.hl7.org/CodeSystem/condition-category' }
];

const SEVERITY_CODES = [
  { code: '255604002', display: 'Mild', system: 'http://snomed.info/sct' },
  { code: '6736007', display: 'Moderate', system: 'http://snomed.info/sct' },
  { code: '24484000', display: 'Severe', system: 'http://snomed.info/sct' },
  { code: '399166001', display: 'Fatal', system: 'http://snomed.info/sct' }
];

const COMMON_CONDITIONS = [
  { code: '38341003', display: 'Hypertensive disorder', system: 'http://snomed.info/sct' },
  { code: '73211009', display: 'Diabetes mellitus', system: 'http://snomed.info/sct' },
  { code: '195967001', display: 'Asthma', system: 'http://snomed.info/sct' },
  { code: '53741008', display: 'Coronary arteriosclerosis', system: 'http://snomed.info/sct' },
  { code: '44054006', display: 'Diabetes mellitus type 2', system: 'http://snomed.info/sct' },
  { code: '271737000', display: 'Anemia', system: 'http://snomed.info/sct' },
  { code: '15777000', display: 'Prediabetes', system: 'http://snomed.info/sct' },
  { code: '162864005', display: 'Body mass index 30+ - obesity', system: 'http://snomed.info/sct' },
  { code: '40275004', display: 'Contact dermatitis', system: 'http://snomed.info/sct' },
  { code: '25064002', display: 'Headache', system: 'http://snomed.info/sct' },
  { code: '49727002', display: 'Cough', system: 'http://snomed.info/sct' },
  { code: '386661006', display: 'Fever', system: 'http://snomed.info/sct' }
];

export function ConditionForm({ conditions, onAdd, onRemove, disabled }: ConditionFormProps): React.JSX.Element {
  const [formData, setFormData] = useState<ConditionFormData>({
    clinicalStatus: 'active',
    verificationStatus: 'confirmed',
    category: 'encounter-diagnosis',
    code: '',
    codeDisplay: '',
    onsetType: 'none',
    abatementType: 'none',
    recordedDate: new Date().toISOString().slice(0, 16)
  });

  const [showForm, setShowForm] = useState(false);

  // Handle form field changes
  const handleChange = useCallback((field: keyof ConditionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle condition code selection
  const handleConditionSelect = useCallback((conditionCode: string) => {
    const condition = COMMON_CONDITIONS.find(cond => cond.code === conditionCode);
    if (condition) {
      setFormData(prev => ({
        ...prev,
        code: condition.code,
        codeDisplay: condition.display
      }));
    }
  }, []);

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.code) errors.push('Condition code is required');
    if (!formData.codeDisplay) errors.push('Condition display name is required');
    if (!formData.recordedDate) errors.push('Recorded date is required');
    
    if (formData.onsetType === 'dateTime' && !formData.onsetDateTime) {
      errors.push('Onset date/time is required when onset type is dateTime');
    }
    if (formData.onsetType === 'string' && !formData.onsetString) {
      errors.push('Onset description is required when onset type is string');
    }
    
    if (formData.abatementType === 'dateTime' && !formData.abatementDateTime) {
      errors.push('Abatement date/time is required when abatement type is dateTime');
    }
    if (formData.abatementType === 'string' && !formData.abatementString) {
      errors.push('Abatement description is required when abatement type is string');
    }
    if (formData.abatementType === 'boolean' && formData.abatementBoolean === undefined) {
      errors.push('Abatement boolean is required when abatement type is boolean');
    }
    
    return errors;
  };

  // Add condition
  const handleAdd = useCallback(() => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    const clinicalStatusObj = CLINICAL_STATUS_CODES.find(status => status.code === formData.clinicalStatus);
    const verificationStatusObj = VERIFICATION_STATUS_CODES.find(status => status.code === formData.verificationStatus);
    const categoryObj = CONDITION_CATEGORIES.find(cat => cat.code === formData.category);
    const severityObj = formData.severity ? SEVERITY_CODES.find(sev => sev.code === formData.severity) : undefined;
    
    const condition: Omit<Condition, 'id' | 'resourceType' | 'subject' | 'encounter'> = {
      clinicalStatus: clinicalStatusObj ? {
        coding: [{
          system: clinicalStatusObj.system,
          code: clinicalStatusObj.code,
          display: clinicalStatusObj.display
        }]
      } : undefined,
      verificationStatus: verificationStatusObj ? {
        coding: [{
          system: verificationStatusObj.system,
          code: verificationStatusObj.code,
          display: verificationStatusObj.display
        }]
      } : undefined,
      category: categoryObj ? [{
        coding: [{
          system: categoryObj.system,
          code: categoryObj.code,
          display: categoryObj.display
        }]
      }] : undefined,
      ...(severityObj && {
        severity: {
          coding: [{
            system: severityObj.system,
            code: severityObj.code,
            display: severityObj.display
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
      ...(formData.onsetType === 'dateTime' && formData.onsetDateTime && {
        onsetDateTime: formData.onsetDateTime
      }),
      ...(formData.onsetType === 'string' && formData.onsetString && {
        onsetString: formData.onsetString
      }),
      ...(formData.abatementType === 'dateTime' && formData.abatementDateTime && {
        abatementDateTime: formData.abatementDateTime
      }),
      ...(formData.abatementType === 'string' && formData.abatementString && {
        abatementString: formData.abatementString
      }),
      ...(formData.abatementType === 'boolean' && formData.abatementBoolean !== undefined && {
        abatementBoolean: formData.abatementBoolean
      }),
      recordedDate: formData.recordedDate,
      ...(formData.note && {
        note: [{
          text: formData.note
        }]
      })
    };

    onAdd(condition);
    
    // Reset form
    setFormData({
      clinicalStatus: 'active',
      verificationStatus: 'confirmed',
      category: 'encounter-diagnosis',
      code: '',
      codeDisplay: '',
      onsetType: 'none',
      abatementType: 'none',
      recordedDate: new Date().toISOString().slice(0, 16)
    });
    setShowForm(false);
  }, [formData, onAdd]);

  // Format condition for display
  const formatCondition = (condition: Omit<Condition, 'id' | 'resourceType' | 'subject' | 'encounter'>, index: number): string => {
    const code = condition.code?.text || condition.code?.coding?.[0]?.display || 'Unknown';
    const clinicalStatus = condition.clinicalStatus?.coding?.[0]?.display || 'Unknown status';
    const severity = condition.severity?.coding?.[0]?.display;
    
    return `${code} (${clinicalStatus}${severity ? `, ${severity}` : ''})`;
  };

  return (
    <div className="resource-form">
      <div className="resource-form-header">
        <h3>Conditions</h3>
        <button
          className="add-resource-button"
          onClick={() => setShowForm(true)}
          disabled={disabled || showForm}
        >
          Add Condition
        </button>
      </div>

      {conditions.length > 0 && (
        <div className="resource-list">
          {conditions.map((condition, index) => (
            <div key={index} className="resource-item">
              <div className="resource-content">
                <span className="resource-summary">{formatCondition(condition, index)}</span>
                <span className="resource-status">
                  {condition.verificationStatus?.coding?.[0]?.display || 'Unknown'}
                </span>
              </div>
              <button
                className="remove-resource-button"
                onClick={() => onRemove(index)}
                disabled={disabled}
                aria-label="Remove condition"
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
            <h4>Add New Condition</h4>

            <div className="form-group">
              <label>Common Conditions</label>
              <select
                value=""
                onChange={(e) => e.target.value && handleConditionSelect(e.target.value)}
                disabled={disabled}
              >
                <option value="">Select a common condition...</option>
                {COMMON_CONDITIONS.map(condition => (
                  <option key={condition.code} value={condition.code}>
                    {condition.display}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Clinical Status *</label>
                <select
                  value={formData.clinicalStatus}
                  onChange={(e) => handleChange('clinicalStatus', e.target.value)}
                  disabled={disabled}
                  required
                >
                  {CLINICAL_STATUS_CODES.map(status => (
                    <option key={status.code} value={status.code}>{status.display}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Verification Status *</label>
                <select
                  value={formData.verificationStatus}
                  onChange={(e) => handleChange('verificationStatus', e.target.value)}
                  disabled={disabled}
                  required
                >
                  {VERIFICATION_STATUS_CODES.map(status => (
                    <option key={status.code} value={status.code}>{status.display}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  disabled={disabled}
                  required
                >
                  {CONDITION_CATEGORIES.map(cat => (
                    <option key={cat.code} value={cat.code}>{cat.display}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Severity</label>
                <select
                  value={formData.severity || ''}
                  onChange={(e) => {
                    const severity = SEVERITY_CODES.find(sev => sev.code === e.target.value);
                    handleChange('severity', e.target.value || undefined);
                    handleChange('severityDisplay', severity?.display);
                  }}
                  disabled={disabled}
                >
                  <option value="">Select severity (optional)</option>
                  {SEVERITY_CODES.map(severity => (
                    <option key={severity.code} value={severity.code}>{severity.display}</option>
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
              <label>Onset Type</label>
              <select
                value={formData.onsetType}
                onChange={(e) => handleChange('onsetType', e.target.value as 'dateTime' | 'string' | 'none')}
                disabled={disabled}
              >
                <option value="none">No onset information</option>
                <option value="dateTime">Specific date/time</option>
                <option value="string">Description</option>
              </select>
            </div>

            {formData.onsetType === 'dateTime' && (
              <div className="form-group">
                <label>Onset Date/Time *</label>
                <input
                  type="datetime-local"
                  value={formData.onsetDateTime || ''}
                  onChange={(e) => handleChange('onsetDateTime', e.target.value)}
                  disabled={disabled}
                  required
                />
              </div>
            )}

            {formData.onsetType === 'string' && (
              <div className="form-group">
                <label>Onset Description *</label>
                <input
                  type="text"
                  value={formData.onsetString || ''}
                  onChange={(e) => handleChange('onsetString', e.target.value)}
                  disabled={disabled}
                  placeholder="e.g., 'childhood', 'after surgery'"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Abatement Type</label>
              <select
                value={formData.abatementType}
                onChange={(e) => handleChange('abatementType', e.target.value as 'dateTime' | 'string' | 'boolean' | 'none')}
                disabled={disabled}
              >
                <option value="none">No abatement information</option>
                <option value="dateTime">Specific date/time</option>
                <option value="string">Description</option>
                <option value="boolean">Resolved (yes/no)</option>
              </select>
            </div>

            {formData.abatementType === 'dateTime' && (
              <div className="form-group">
                <label>Abatement Date/Time *</label>
                <input
                  type="datetime-local"
                  value={formData.abatementDateTime || ''}
                  onChange={(e) => handleChange('abatementDateTime', e.target.value)}
                  disabled={disabled}
                  required
                />
              </div>
            )}

            {formData.abatementType === 'string' && (
              <div className="form-group">
                <label>Abatement Description *</label>
                <input
                  type="text"
                  value={formData.abatementString || ''}
                  onChange={(e) => handleChange('abatementString', e.target.value)}
                  disabled={disabled}
                  placeholder="e.g., 'after treatment', 'gradually'"
                  required
                />
              </div>
            )}

            {formData.abatementType === 'boolean' && (
              <div className="form-group">
                <label>Resolved *</label>
                <select
                  value={formData.abatementBoolean?.toString() || ''}
                  onChange={(e) => handleChange('abatementBoolean', e.target.value === 'true')}
                  disabled={disabled}
                  required
                >
                  <option value="">Select...</option>
                  <option value="true">Yes (resolved)</option>
                  <option value="false">No (not resolved)</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Recorded Date *</label>
              <input
                type="datetime-local"
                value={formData.recordedDate}
                onChange={(e) => handleChange('recordedDate', e.target.value)}
                disabled={disabled}
                required
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.note || ''}
                onChange={(e) => handleChange('note', e.target.value || undefined)}
                disabled={disabled}
                placeholder="Additional notes about this condition"
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
                Add Condition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useCallback } from 'react';
import type { Observation, CodeableConcept, Quantity } from '../../../types/fhir';
import { InlineError, ErrorList } from '../../common/InlineError';
import './ResourceForm.css';

export interface ObservationFormProps {
  observations: Omit<Observation, 'id' | 'resourceType' | 'subject' | 'encounter'>[];
  onAdd: (observation: Omit<Observation, 'id' | 'resourceType' | 'subject' | 'encounter'>) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export interface ObservationFormData {
  status: Observation['status'];
  category: string;
  code: string;
  codeDisplay: string;
  valueType: 'quantity' | 'string' | 'boolean' | 'codeable';
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
  valueString?: string;
  valueBoolean?: boolean;
  valueCodeable?: {
    code: string;
    display: string;
    system?: string;
  };
  effectiveDateTime: string;
  interpretation?: string;
  interpretationDisplay?: string;
  note?: string;
}

const OBSERVATION_CATEGORIES = [
  { code: 'vital-signs', display: 'Vital Signs', system: 'http://terminology.hl7.org/CodeSystem/observation-category' },
  { code: 'laboratory', display: 'Laboratory', system: 'http://terminology.hl7.org/CodeSystem/observation-category' },
  { code: 'exam', display: 'Exam', system: 'http://terminology.hl7.org/CodeSystem/observation-category' },
  { code: 'imaging', display: 'Imaging', system: 'http://terminology.hl7.org/CodeSystem/observation-category' },
  { code: 'procedure', display: 'Procedure', system: 'http://terminology.hl7.org/CodeSystem/observation-category' },
  { code: 'survey', display: 'Survey', system: 'http://terminology.hl7.org/CodeSystem/observation-category' },
  { code: 'social-history', display: 'Social History', system: 'http://terminology.hl7.org/CodeSystem/observation-category' }
];

const COMMON_OBSERVATIONS = [
  // Vital Signs
  { code: '8310-5', display: 'Body temperature', category: 'vital-signs', unit: 'Cel', system: 'http://unitsofmeasure.org' },
  { code: '8867-4', display: 'Heart rate', category: 'vital-signs', unit: '/min', system: 'http://unitsofmeasure.org' },
  { code: '8480-6', display: 'Systolic blood pressure', category: 'vital-signs', unit: 'mm[Hg]', system: 'http://unitsofmeasure.org' },
  { code: '8462-4', display: 'Diastolic blood pressure', category: 'vital-signs', unit: 'mm[Hg]', system: 'http://unitsofmeasure.org' },
  { code: '9279-1', display: 'Respiratory rate', category: 'vital-signs', unit: '/min', system: 'http://unitsofmeasure.org' },
  { code: '2708-6', display: 'Oxygen saturation', category: 'vital-signs', unit: '%', system: 'http://unitsofmeasure.org' },
  { code: '29463-7', display: 'Body weight', category: 'vital-signs', unit: 'kg', system: 'http://unitsofmeasure.org' },
  { code: '8302-2', display: 'Body height', category: 'vital-signs', unit: 'cm', system: 'http://unitsofmeasure.org' },
  
  // Laboratory
  { code: '33747-0', display: 'General appearance', category: 'exam', valueType: 'string' },
  { code: '72133-2', display: 'Pain severity', category: 'exam', unit: '{score}', system: 'http://unitsofmeasure.org' },
  { code: '11156-7', display: 'Leukocytes', category: 'laboratory', unit: '10*3/uL', system: 'http://unitsofmeasure.org' },
  { code: '718-7', display: 'Hemoglobin', category: 'laboratory', unit: 'g/dL', system: 'http://unitsofmeasure.org' }
];

const INTERPRETATION_CODES = [
  { code: 'N', display: 'Normal', system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation' },
  { code: 'A', display: 'Abnormal', system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation' },
  { code: 'H', display: 'High', system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation' },
  { code: 'L', display: 'Low', system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation' },
  { code: 'HH', display: 'Critical high', system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation' },
  { code: 'LL', display: 'Critical low', system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation' }
];

export function ObservationForm({ observations, onAdd, onRemove, disabled }: ObservationFormProps): React.JSX.Element {
  const [formData, setFormData] = useState<ObservationFormData>({
    status: 'final',
    category: 'vital-signs',
    code: '',
    codeDisplay: '',
    valueType: 'quantity',
    effectiveDateTime: new Date().toISOString().slice(0, 16)
  });

  const [showForm, setShowForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Handle form field changes
  const handleChange = useCallback((field: keyof ObservationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle observation code selection
  const handleObservationSelect = useCallback((obsCode: string) => {
    const observation = COMMON_OBSERVATIONS.find(obs => obs.code === obsCode);
    if (observation) {
      setFormData(prev => ({
        ...prev,
        code: observation.code,
        codeDisplay: observation.display,
        category: observation.category,
        valueType: observation.valueType as any || 'quantity',
        ...(observation.unit && {
          valueQuantity: {
            value: 0,
            unit: observation.unit,
            system: observation.system,
            code: observation.unit
          }
        })
      }));
    }
  }, []);

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.code) errors.push('Observation code is required');
    if (!formData.codeDisplay) errors.push('Observation display name is required');
    if (!formData.effectiveDateTime) errors.push('Effective date/time is required');
    
    if (formData.valueType === 'quantity') {
      if (!formData.valueQuantity?.value && formData.valueQuantity?.value !== 0) {
        errors.push('Quantity value is required');
      }
      if (!formData.valueQuantity?.unit) {
        errors.push('Quantity unit is required');
      }
    } else if (formData.valueType === 'string') {
      if (!formData.valueString) {
        errors.push('String value is required');
      }
    } else if (formData.valueType === 'codeable') {
      if (!formData.valueCodeable?.code) {
        errors.push('Codeable value is required');
      }
    }
    
    return errors;
  };

  // Add observation
  const handleAdd = useCallback(() => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);

    const categoryObj = OBSERVATION_CATEGORIES.find(cat => cat.code === formData.category);
    
    const observation: Omit<Observation, 'id' | 'resourceType' | 'subject' | 'encounter'> = {
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
      effectiveDateTime: formData.effectiveDateTime,
      ...(formData.valueType === 'quantity' && formData.valueQuantity && {
        valueQuantity: {
          value: formData.valueQuantity.value,
          unit: formData.valueQuantity.unit,
          system: formData.valueQuantity.system || 'http://unitsofmeasure.org',
          code: formData.valueQuantity.code || formData.valueQuantity.unit
        }
      }),
      ...(formData.valueType === 'string' && formData.valueString && {
        valueString: formData.valueString
      }),
      ...(formData.valueType === 'boolean' && formData.valueBoolean !== undefined && {
        valueBoolean: formData.valueBoolean
      }),
      ...(formData.valueType === 'codeable' && formData.valueCodeable && {
        valueCodeableConcept: {
          coding: [{
            system: formData.valueCodeable.system || 'http://snomed.info/sct',
            code: formData.valueCodeable.code,
            display: formData.valueCodeable.display
          }],
          text: formData.valueCodeable.display
        }
      }),
      ...(formData.interpretation && {
        interpretation: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: formData.interpretation,
            display: formData.interpretationDisplay || formData.interpretation
          }]
        }]
      }),
      ...(formData.note && {
        note: [{
          text: formData.note
        }]
      })
    };

    onAdd(observation);
    
    // Reset form
    setFormData({
      status: 'final',
      category: 'vital-signs',
      code: '',
      codeDisplay: '',
      valueType: 'quantity',
      effectiveDateTime: new Date().toISOString().slice(0, 16)
    });
    setValidationErrors([]);
    setShowForm(false);
  }, [formData, onAdd]);

  // Format observation for display
  const formatObservation = (obs: Omit<Observation, 'id' | 'resourceType' | 'subject' | 'encounter'>, index: number): string => {
    const code = obs.code?.text || obs.code?.coding?.[0]?.display || 'Unknown';
    let value = '';
    
    if (obs.valueQuantity) {
      value = `${obs.valueQuantity.value} ${obs.valueQuantity.unit}`;
    } else if (obs.valueString) {
      value = obs.valueString;
    } else if (obs.valueBoolean !== undefined) {
      value = obs.valueBoolean ? 'Yes' : 'No';
    } else if (obs.valueCodeableConcept) {
      value = obs.valueCodeableConcept.text || obs.valueCodeableConcept.coding?.[0]?.display || 'Coded value';
    }
    
    return `${code}: ${value}`;
  };

  return (
    <div className="resource-form">
      <div className="resource-form-header">
        <h3>Observations</h3>
        <button
          className="add-resource-button"
          onClick={() => setShowForm(true)}
          disabled={disabled || showForm}
        >
          Add Observation
        </button>
      </div>

      {observations.length > 0 && (
        <div className="resource-list">
          {observations.map((observation, index) => (
            <div key={index} className="resource-item">
              <div className="resource-content">
                <span className="resource-summary">{formatObservation(observation, index)}</span>
                <span className="resource-status">{observation.status}</span>
              </div>
              <button
                className="remove-resource-button"
                onClick={() => onRemove(index)}
                disabled={disabled}
                aria-label="Remove observation"
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
            <h4>Add New Observation</h4>

            <div className="form-group">
              <label htmlFor="common-observations">Common Observations</label>
              <select
                id="common-observations"
                value=""
                onChange={(e) => e.target.value && handleObservationSelect(e.target.value)}
                disabled={disabled}
              >
                <option value="">Select a common observation...</option>
                {COMMON_OBSERVATIONS.map(obs => (
                  <option key={obs.code} value={obs.code}>
                    {obs.display} ({obs.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as Observation['status'])}
                  disabled={disabled}
                  required
                >
                  <option value="registered">Registered</option>
                  <option value="preliminary">Preliminary</option>
                  <option value="final">Final</option>
                  <option value="amended">Amended</option>
                  <option value="corrected">Corrected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  disabled={disabled}
                  required
                >
                  {OBSERVATION_CATEGORIES.map(cat => (
                    <option key={cat.code} value={cat.code}>{cat.display}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="code">Code *</label>
                <input
                  id="code"
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  disabled={disabled}
                  placeholder="LOINC code"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="code-display">Display Name *</label>
                <input
                  id="code-display"
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
              <label htmlFor="value-type">Value Type *</label>
              <select
                id="value-type"
                value={formData.valueType}
                onChange={(e) => handleChange('valueType', e.target.value as 'quantity' | 'string' | 'boolean' | 'codeable')}
                disabled={disabled}
                required
              >
                <option value="quantity">Quantity (numeric with unit)</option>
                <option value="string">String (text)</option>
                <option value="boolean">Boolean (yes/no)</option>
                <option value="codeable">Codeable (coded value)</option>
              </select>
            </div>

            {formData.valueType === 'quantity' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="quantity-value">Value *</label>
                  <input
                    id="quantity-value"
                    type="number"
                    step="any"
                    value={formData.valueQuantity?.value || ''}
                    onChange={(e) => handleChange('valueQuantity', {
                      ...formData.valueQuantity,
                      value: parseFloat(e.target.value) || 0
                    })}
                    disabled={disabled}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor='unit-input'>Unit *</label>
                  <input
                    id='unit-input'
                    type="text"
                    value={formData.valueQuantity?.unit || ''}
                    onChange={(e) => handleChange('valueQuantity', {
                      ...formData.valueQuantity,
                      unit: e.target.value,
                      code: e.target.value
                    })}
                    disabled={disabled}
                    placeholder="e.g., kg, cm, /min"
                    required
                  />
                </div>
              </div>
            )}

            {formData.valueType === 'string' && (
              <div className="form-group">
                <label htmlFor='value-input'>Value *</label>
                <input
                  id='value-input'
                  type="text"
                  value={formData.valueString || ''}
                  onChange={(e) => handleChange('valueString', e.target.value)}
                  disabled={disabled}
                  required
                />
              </div>
            )}

            {formData.valueType === 'boolean' && (
              <div className="form-group">
                <label htmlFor='value-options'>Value *</label>
                <select
                  id='value-options'
                  value={formData.valueBoolean?.toString() || ''}
                  onChange={(e) => handleChange('valueBoolean', e.target.value === 'true')}
                  disabled={disabled}
                  required
                >
                  <option value="">Select...</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            )}

            {formData.valueType === 'codeable' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Code *</label>
                  <input
                    type="text"
                    value={formData.valueCodeable?.code || ''}
                    onChange={(e) => handleChange('valueCodeable', {
                      ...formData.valueCodeable,
                      code: e.target.value
                    })}
                    disabled={disabled}
                    placeholder="SNOMED CT code"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor='display-input'>Display *</label>
                  <input
                    id='display-input'
                    type="text"
                    value={formData.valueCodeable?.display || ''}
                    onChange={(e) => handleChange('valueCodeable', {
                      ...formData.valueCodeable,
                      display: e.target.value
                    })}
                    disabled={disabled}
                    placeholder="Human readable value"
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor='eff-date-time'>Effective Date/Time *</label>
              <input
                id='eff-date-time'
                type="datetime-local"
                value={formData.effectiveDateTime}
                onChange={(e) => handleChange('effectiveDateTime', e.target.value)}
                disabled={disabled}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor='interpr-options'>Interpretation</label>
              <select
                id='interpr-options'
                value={formData.interpretation || ''}
                onChange={(e) => {
                  const interp = INTERPRETATION_CODES.find(i => i.code === e.target.value);
                  handleChange('interpretation', e.target.value || undefined);
                  handleChange('interpretationDisplay', interp?.display);
                }}
                disabled={disabled}
              >
                <option value="">Select interpretation (optional)</option>
                {INTERPRETATION_CODES.map(interp => (
                  <option key={interp.code} value={interp.code}>{interp.display}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.note || ''}
                onChange={(e) => handleChange('note', e.target.value || undefined)}
                disabled={disabled}
                placeholder="Additional notes about this observation"
                rows={3}
              />
            </div>

            {validationErrors.length > 0 && (
              <ErrorList 
                errors={validationErrors}
                title="Please fix the following errors:"
                maxErrors={5}
              />
            )}

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
                Add Observation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useCallback } from 'react';
import type { MedicationRequest, Dosage } from '../../../types/fhir';
import './ResourceForm.css';

export interface MedicationRequestFormProps {
  medicationRequests: Omit<MedicationRequest, 'id' | 'resourceType' | 'subject' | 'encounter'>[];
  onAdd: (medicationRequest: Omit<MedicationRequest, 'id' | 'resourceType' | 'subject' | 'encounter'>) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export interface MedicationRequestFormData {
  status: MedicationRequest['status'];
  intent: MedicationRequest['intent'];
  priority?: MedicationRequest['priority'];
  medicationCode: string;
  medicationDisplay: string;
  authoredOn: string;
  reasonCode?: string;
  reasonText?: string;
  dosageText?: string;
  dosageRoute?: string;
  dosageRouteDisplay?: string;
  dosageFrequency?: number;
  dosagePeriod?: number;
  dosagePeriodUnit?: string;
  doseQuantity?: number;
  doseUnit?: string;
  dispenseQuantity?: number;
  dispenseUnit?: string;
  dispenseSupplyDuration?: number;
  dispenseSupplyUnit?: string;
  note?: string;
}

const MEDICATION_STATUS_CODES = [
  { code: 'active', display: 'Active' },
  { code: 'on-hold', display: 'On Hold' },
  { code: 'cancelled', display: 'Cancelled' },
  { code: 'completed', display: 'Completed' },
  { code: 'entered-in-error', display: 'Entered in Error' },
  { code: 'stopped', display: 'Stopped' },
  { code: 'draft', display: 'Draft' },
  { code: 'unknown', display: 'Unknown' }
];

const MEDICATION_INTENT_CODES = [
  { code: 'proposal', display: 'Proposal' },
  { code: 'plan', display: 'Plan' },
  { code: 'order', display: 'Order' },
  { code: 'original-order', display: 'Original Order' },
  { code: 'reflex-order', display: 'Reflex Order' },
  { code: 'filler-order', display: 'Filler Order' },
  { code: 'instance-order', display: 'Instance Order' },
  { code: 'option', display: 'Option' }
];

const MEDICATION_PRIORITY_CODES = [
  { code: 'routine', display: 'Routine' },
  { code: 'urgent', display: 'Urgent' },
  { code: 'asap', display: 'ASAP' },
  { code: 'stat', display: 'STAT' }
];

const ROUTE_CODES = [
  { code: '26643006', display: 'Oral', system: 'http://snomed.info/sct' },
  { code: '47625008', display: 'Intravenous', system: 'http://snomed.info/sct' },
  { code: '78421000', display: 'Intramuscular', system: 'http://snomed.info/sct' },
  { code: '34206005', display: 'Subcutaneous', system: 'http://snomed.info/sct' },
  { code: '372449004', display: 'Dental', system: 'http://snomed.info/sct' },
  { code: '372451000', display: 'Endotracheal', system: 'http://snomed.info/sct' },
  { code: '372452007', display: 'Endosinusial', system: 'http://snomed.info/sct' },
  { code: '372453002', display: 'Endocervical', system: 'http://snomed.info/sct' },
  { code: '372454008', display: 'Endotracheopulmonary', system: 'http://snomed.info/sct' },
  { code: '372457001', display: 'Gingival', system: 'http://snomed.info/sct' },
  { code: '372458006', display: 'Intraamniotic', system: 'http://snomed.info/sct' },
  { code: '372459003', display: 'Intra-arterial', system: 'http://snomed.info/sct' },
  { code: '372460008', display: 'Intraarticular', system: 'http://snomed.info/sct' },
  { code: '372461007', display: 'Intrabiliary', system: 'http://snomed.info/sct' },
  { code: '372463005', display: 'Intracoronary', system: 'http://snomed.info/sct' },
  { code: '372464004', display: 'Intradermal', system: 'http://snomed.info/sct' },
  { code: '372465003', display: 'Intradiscal', system: 'http://snomed.info/sct' },
  { code: '372466002', display: 'Intralesional', system: 'http://snomed.info/sct' },
  { code: '372467006', display: 'Intralymphatic', system: 'http://snomed.info/sct' },
  { code: '372468001', display: 'Intraocular', system: 'http://snomed.info/sct' },
  { code: '372469009', display: 'Intrapleural', system: 'http://snomed.info/sct' },
  { code: '372470005', display: 'Intraprostatic', system: 'http://snomed.info/sct' },
  { code: '372471009', display: 'Intrapulmonary', system: 'http://snomed.info/sct' },
  { code: '372473007', display: 'Intrathoracic', system: 'http://snomed.info/sct' },
  { code: '372474001', display: 'Intrathecal', system: 'http://snomed.info/sct' },
  { code: '372475000', display: 'Intrauterine', system: 'http://snomed.info/sct' },
  { code: '372476004', display: 'Intravascular', system: 'http://snomed.info/sct' },
  { code: '372477008', display: 'Intraventricular', system: 'http://snomed.info/sct' },
  { code: '372478003', display: 'Intravesical', system: 'http://snomed.info/sct' },
  { code: '372479006', display: 'Intravitreal', system: 'http://snomed.info/sct' },
  { code: '372480009', display: 'Nasal', system: 'http://snomed.info/sct' },
  { code: '372481008', display: 'Ocular', system: 'http://snomed.info/sct' }
];

const COMMON_MEDICATIONS = [
  { code: '387207008', display: 'Acetaminophen', system: 'http://snomed.info/sct' },
  { code: '387458008', display: 'Aspirin', system: 'http://snomed.info/sct' },
  { code: '387494007', display: 'Ibuprofen', system: 'http://snomed.info/sct' },
  { code: '387467008', display: 'Amoxicillin', system: 'http://snomed.info/sct' },
  { code: '387517004', display: 'Metformin', system: 'http://snomed.info/sct' },
  { code: '387506000', display: 'Lisinopril', system: 'http://snomed.info/sct' },
  { code: '387584000', display: 'Atorvastatin', system: 'http://snomed.info/sct' },
  { code: '387475002', display: 'Amlodipine', system: 'http://snomed.info/sct' },
  { code: '387068006', display: 'Albuterol', system: 'http://snomed.info/sct' },
  { code: '387562000', display: 'Metoprolol', system: 'http://snomed.info/sct' },
  { code: '387467008', display: 'Amoxicillin', system: 'http://snomed.info/sct' },
  { code: '387207008', display: 'Acetaminophen', system: 'http://snomed.info/sct' }
];

const PERIOD_UNITS = [
  { code: 'min', display: 'minutes' },
  { code: 'h', display: 'hours' },
  { code: 'd', display: 'days' },
  { code: 'wk', display: 'weeks' },
  { code: 'mo', display: 'months' }
];

export function MedicationRequestForm({ medicationRequests, onAdd, onRemove, disabled }: MedicationRequestFormProps): React.JSX.Element {
  const [formData, setFormData] = useState<MedicationRequestFormData>({
    status: 'active',
    intent: 'order',
    medicationCode: '',
    medicationDisplay: '',
    authoredOn: new Date().toISOString().slice(0, 16)
  });

  const [showForm, setShowForm] = useState(false);

  // Handle form field changes
  const handleChange = useCallback((field: keyof MedicationRequestFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle medication code selection
  const handleMedicationSelect = useCallback((medicationCode: string) => {
    const medication = COMMON_MEDICATIONS.find(med => med.code === medicationCode);
    if (medication) {
      setFormData(prev => ({
        ...prev,
        medicationCode: medication.code,
        medicationDisplay: medication.display
      }));
    }
  }, []);

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.medicationCode) errors.push('Medication code is required');
    if (!formData.medicationDisplay) errors.push('Medication display name is required');
    if (!formData.authoredOn) errors.push('Authored date is required');
    
    if (formData.dosageFrequency && !formData.dosagePeriod) {
      errors.push('Dosage period is required when frequency is specified');
    }
    if (formData.dosagePeriod && !formData.dosagePeriodUnit) {
      errors.push('Dosage period unit is required when period is specified');
    }
    if (formData.doseQuantity && !formData.doseUnit) {
      errors.push('Dose unit is required when quantity is specified');
    }
    
    return errors;
  };

  // Add medication request
  const handleAdd = useCallback(() => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    const routeObj = formData.dosageRoute ? ROUTE_CODES.find(route => route.code === formData.dosageRoute) : undefined;
    
    const medicationRequest: Omit<MedicationRequest, 'id' | 'resourceType' | 'subject' | 'encounter'> = {
      status: formData.status,
      intent: formData.intent,
      ...(formData.priority && { priority: formData.priority }),
      medicationCodeableConcept: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: formData.medicationCode,
          display: formData.medicationDisplay
        }],
        text: formData.medicationDisplay
      },
      authoredOn: formData.authoredOn,
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
      ...(formData.dosageText || formData.dosageRoute || formData.dosageFrequency || formData.doseQuantity) && {
        dosageInstruction: [{
          ...(formData.dosageText && { text: formData.dosageText }),
          ...(routeObj && {
            route: {
              coding: [{
                system: routeObj.system,
                code: routeObj.code,
                display: routeObj.display
              }]
            }
          }),
          ...(formData.dosageFrequency && formData.dosagePeriod && formData.dosagePeriodUnit && {
            timing: {
              repeat: {
                frequency: formData.dosageFrequency,
                period: formData.dosagePeriod,
                periodUnit: formData.dosagePeriodUnit as any
              }
            }
          }),
          ...(formData.doseQuantity && formData.doseUnit && {
            doseAndRate: [{
              doseQuantity: {
                value: formData.doseQuantity,
                unit: formData.doseUnit,
                system: 'http://unitsofmeasure.org',
                code: formData.doseUnit
              }
            }]
          })
        }]
      },
      ...(formData.dispenseQuantity && formData.dispenseUnit && {
        dispenseRequest: {
          quantity: {
            value: formData.dispenseQuantity,
            unit: formData.dispenseUnit,
            system: 'http://unitsofmeasure.org',
            code: formData.dispenseUnit
          },
          ...(formData.dispenseSupplyDuration && formData.dispenseSupplyUnit && {
            expectedSupplyDuration: {
              value: formData.dispenseSupplyDuration,
              unit: formData.dispenseSupplyUnit,
              system: 'http://unitsofmeasure.org',
              code: formData.dispenseSupplyUnit
            }
          })
        }
      }),
      ...(formData.note && {
        note: [{
          text: formData.note
        }]
      })
    };

    onAdd(medicationRequest);
    
    // Reset form
    setFormData({
      status: 'active',
      intent: 'order',
      medicationCode: '',
      medicationDisplay: '',
      authoredOn: new Date().toISOString().slice(0, 16)
    });
    setShowForm(false);
  }, [formData, onAdd]);

  // Format medication request for display
  const formatMedicationRequest = (medReq: Omit<MedicationRequest, 'id' | 'resourceType' | 'subject' | 'encounter'>, index: number): string => {
    const medication = medReq.medicationCodeableConcept?.text || 
                     medReq.medicationCodeableConcept?.coding?.[0]?.display || 
                     'Unknown medication';
    const dosage = medReq.dosageInstruction?.[0]?.text || 
                  (medReq.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity ? 
                   `${medReq.dosageInstruction[0].doseAndRate[0].doseQuantity.value} ${medReq.dosageInstruction[0].doseAndRate[0].doseQuantity.unit}` : 
                   'No dosage specified');
    
    return `${medication} - ${dosage}`;
  };

  return (
    <div className="resource-form">
      <div className="resource-form-header">
        <h3>Medication Requests</h3>
        <button
          className="add-resource-button"
          onClick={() => setShowForm(true)}
          disabled={disabled || showForm}
        >
          Add Medication Request
        </button>
      </div>

      {medicationRequests.length > 0 && (
        <div className="resource-list">
          {medicationRequests.map((medicationRequest, index) => (
            <div key={index} className="resource-item">
              <div className="resource-content">
                <span className="resource-summary">{formatMedicationRequest(medicationRequest, index)}</span>
                <span className="resource-status">{medicationRequest.status}</span>
              </div>
              <button
                className="remove-resource-button"
                onClick={() => onRemove(index)}
                disabled={disabled}
                aria-label="Remove medication request"
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
            <h4>Add New Medication Request</h4>

            <div className="form-group">
              <label>Common Medications</label>
              <select
                value=""
                onChange={(e) => e.target.value && handleMedicationSelect(e.target.value)}
                disabled={disabled}
              >
                <option value="">Select a common medication...</option>
                {COMMON_MEDICATIONS.map(medication => (
                  <option key={medication.code} value={medication.code}>
                    {medication.display}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as MedicationRequest['status'])}
                  disabled={disabled}
                  required
                >
                  {MEDICATION_STATUS_CODES.map(status => (
                    <option key={status.code} value={status.code}>{status.display}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Intent *</label>
                <select
                  value={formData.intent}
                  onChange={(e) => handleChange('intent', e.target.value as MedicationRequest['intent'])}
                  disabled={disabled}
                  required
                >
                  {MEDICATION_INTENT_CODES.map(intent => (
                    <option key={intent.code} value={intent.code}>{intent.display}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select
                value={formData.priority || ''}
                onChange={(e) => handleChange('priority', e.target.value as MedicationRequest['priority'] || undefined)}
                disabled={disabled}
              >
                <option value="">Select priority (optional)</option>
                {MEDICATION_PRIORITY_CODES.map(priority => (
                  <option key={priority.code} value={priority.code}>{priority.display}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Medication Code *</label>
                <input
                  type="text"
                  value={formData.medicationCode}
                  onChange={(e) => handleChange('medicationCode', e.target.value)}
                  disabled={disabled}
                  placeholder="SNOMED CT code"
                  required
                />
              </div>

              <div className="form-group">
                <label>Medication Name *</label>
                <input
                  type="text"
                  value={formData.medicationDisplay}
                  onChange={(e) => handleChange('medicationDisplay', e.target.value)}
                  disabled={disabled}
                  placeholder="Human readable name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Authored Date *</label>
              <input
                type="datetime-local"
                value={formData.authoredOn}
                onChange={(e) => handleChange('authoredOn', e.target.value)}
                disabled={disabled}
                required
              />
            </div>

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
                  placeholder="Reason for medication"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Dosage Instructions</label>
              <textarea
                value={formData.dosageText || ''}
                onChange={(e) => handleChange('dosageText', e.target.value || undefined)}
                disabled={disabled}
                placeholder="Free text dosage instructions"
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Route of Administration</label>
              <select
                value={formData.dosageRoute || ''}
                onChange={(e) => {
                  const route = ROUTE_CODES.find(r => r.code === e.target.value);
                  handleChange('dosageRoute', e.target.value || undefined);
                  handleChange('dosageRouteDisplay', route?.display);
                }}
                disabled={disabled}
              >
                <option value="">Select route (optional)</option>
                {ROUTE_CODES.map(route => (
                  <option key={route.code} value={route.code}>{route.display}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Frequency</label>
                <input
                  type="number"
                  min="1"
                  value={formData.dosageFrequency || ''}
                  onChange={(e) => handleChange('dosageFrequency', parseInt(e.target.value) || undefined)}
                  disabled={disabled}
                  placeholder="Times per period"
                />
              </div>

              <div className="form-group">
                <label>Period</label>
                <input
                  type="number"
                  min="1"
                  value={formData.dosagePeriod || ''}
                  onChange={(e) => handleChange('dosagePeriod', parseInt(e.target.value) || undefined)}
                  disabled={disabled}
                  placeholder="Period duration"
                />
              </div>

              <div className="form-group">
                <label>Period Unit</label>
                <select
                  value={formData.dosagePeriodUnit || ''}
                  onChange={(e) => handleChange('dosagePeriodUnit', e.target.value || undefined)}
                  disabled={disabled}
                >
                  <option value="">Select unit</option>
                  {PERIOD_UNITS.map(unit => (
                    <option key={unit.code} value={unit.code}>{unit.display}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Dose Quantity</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.doseQuantity || ''}
                  onChange={(e) => handleChange('doseQuantity', parseFloat(e.target.value) || undefined)}
                  disabled={disabled}
                  placeholder="Dose amount"
                />
              </div>

              <div className="form-group">
                <label>Dose Unit</label>
                <input
                  type="text"
                  value={formData.doseUnit || ''}
                  onChange={(e) => handleChange('doseUnit', e.target.value || undefined)}
                  disabled={disabled}
                  placeholder="e.g., mg, mL, tablet"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Dispense Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.dispenseQuantity || ''}
                  onChange={(e) => handleChange('dispenseQuantity', parseFloat(e.target.value) || undefined)}
                  disabled={disabled}
                  placeholder="Amount to dispense"
                />
              </div>

              <div className="form-group">
                <label>Dispense Unit</label>
                <input
                  type="text"
                  value={formData.dispenseUnit || ''}
                  onChange={(e) => handleChange('dispenseUnit', e.target.value || undefined)}
                  disabled={disabled}
                  placeholder="e.g., tablet, bottle"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Supply Duration</label>
                <input
                  type="number"
                  min="0"
                  value={formData.dispenseSupplyDuration || ''}
                  onChange={(e) => handleChange('dispenseSupplyDuration', parseFloat(e.target.value) || undefined)}
                  disabled={disabled}
                  placeholder="Expected supply duration"
                />
              </div>

              <div className="form-group">
                <label>Supply Unit</label>
                <select
                  value={formData.dispenseSupplyUnit || ''}
                  onChange={(e) => handleChange('dispenseSupplyUnit', e.target.value || undefined)}
                  disabled={disabled}
                >
                  <option value="">Select unit</option>
                  {PERIOD_UNITS.map(unit => (
                    <option key={unit.code} value={unit.code}>{unit.display}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.note || ''}
                onChange={(e) => handleChange('note', e.target.value || undefined)}
                disabled={disabled}
                placeholder="Additional notes about this medication request"
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
                Add Medication Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
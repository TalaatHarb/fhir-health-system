import React from 'react';
import type { MedicationRequest } from '../../types/fhir';
import './ResourceViewer.css';

export interface MedicationRequestViewerProps {
  medicationRequest: MedicationRequest;
  viewMode?: 'summary' | 'detailed';
  onSelect?: () => void;
}

export function MedicationRequestViewer({ 
  medicationRequest, 
  viewMode = 'summary', 
  onSelect 
}: MedicationRequestViewerProps): React.JSX.Element {

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Get medication display name
  const getMedicationName = (): string => {
    if (medicationRequest.medicationCodeableConcept) {
      return medicationRequest.medicationCodeableConcept.text || 
             medicationRequest.medicationCodeableConcept.coding?.[0]?.display || 
             medicationRequest.medicationCodeableConcept.coding?.[0]?.code || 
             'Unknown Medication';
    }
    if (medicationRequest.medicationReference) {
      return medicationRequest.medicationReference.display || 
             medicationRequest.medicationReference.reference || 
             'Unknown Medication';
    }
    return 'Unknown Medication';
  };

  // Get status info
  const getStatusInfo = () => {
    const status = medicationRequest.status;
    const statusClasses = {
      'active': 'status-active',
      'on-hold': 'status-preliminary',
      'cancelled': 'status-cancelled',
      'completed': 'status-completed',
      'entered-in-error': 'status-entered-in-error',
      'stopped': 'status-inactive',
      'draft': 'status-draft',
      'unknown': 'status-unknown',
    };

    return {
      text: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
      className: statusClasses[status] || 'status-unknown',
    };
  };

  // Get intent info
  const getIntentInfo = () => {
    const intent = medicationRequest.intent;
    const intentDisplay = {
      'proposal': 'Proposal',
      'plan': 'Plan',
      'order': 'Order',
      'original-order': 'Original Order',
      'reflex-order': 'Reflex Order',
      'filler-order': 'Filler Order',
      'instance-order': 'Instance Order',
      'option': 'Option',
    };

    return intentDisplay[intent] || intent.charAt(0).toUpperCase() + intent.slice(1);
  };

  // Get priority info
  const getPriorityInfo = () => {
    if (!medicationRequest.priority) return null;

    const priority = medicationRequest.priority;
    const priorityClasses = {
      'routine': 'priority-routine',
      'urgent': 'priority-urgent',
      'asap': 'priority-asap',
      'stat': 'priority-stat',
    };

    return {
      text: priority.charAt(0).toUpperCase() + priority.slice(1),
      className: priorityClasses[priority] || 'priority-routine',
    };
  };

  // Get category display
  const getCategory = (): string => {
    const category = medicationRequest.category?.[0];
    return category?.text || 
           category?.coding?.[0]?.display || 
           category?.coding?.[0]?.code || 
           'General';
  };

  // Get enhanced dosage instructions with visual representation
  const getDosageInstructions = (): React.JSX.Element[] => {
    if (!medicationRequest.dosageInstruction || medicationRequest.dosageInstruction.length === 0) {
      return [];
    }

    return medicationRequest.dosageInstruction.map((dosage, index) => (
      <div key={index} className="dosage-display">
        {dosage.text && (
          <div className="dosage-text">{dosage.text}</div>
        )}
        
        {/* Enhanced Visual Dosage Display */}
        <div className="medication-dosage-visual">
          <div className="dosage-schedule">
            {dosage.doseAndRate && dosage.doseAndRate.length > 0 && (
              <div className="dosage-amount">
                <div className="dosage-amount-value">
                  {dosage.doseAndRate.map((doseRate, drIndex) => {
                    if (doseRate.doseQuantity) {
                      return doseRate.doseQuantity.value;
                    }
                    if (doseRate.doseRange) {
                      const low = doseRate.doseRange.low?.value || 0;
                      const high = doseRate.doseRange.high?.value || 0;
                      return `${low}-${high}`;
                    }
                    return '?';
                  }).join(', ')}
                </div>
                <div className="dosage-amount-unit">
                  {dosage.doseAndRate[0]?.doseQuantity?.unit || 
                   dosage.doseAndRate[0]?.doseQuantity?.code || 
                   dosage.doseAndRate[0]?.doseRange?.low?.unit ||
                   'units'}
                </div>
              </div>
            )}
            
            {dosage.timing && (
              <div className="dosage-frequency">
                <div className="frequency-text">
                  {dosage.timing.code?.text || 
                   dosage.timing.code?.coding?.[0]?.display ||
                   (dosage.timing.repeat?.frequency ? 
                     `${dosage.timing.repeat.frequency}x per ${dosage.timing.repeat.periodUnit || 'day'}` : 
                     'As directed')}
                </div>
                {dosage.timing.repeat && (
                  <div className="frequency-details">
                    {dosage.timing.repeat.period && dosage.timing.repeat.periodUnit && 
                      `Every ${dosage.timing.repeat.period} ${dosage.timing.repeat.periodUnit}${dosage.timing.repeat.period > 1 ? 's' : ''}`}
                    {dosage.timing.repeat.duration && dosage.timing.repeat.durationUnit &&
                      ` for ${dosage.timing.repeat.duration} ${dosage.timing.repeat.durationUnit}${dosage.timing.repeat.duration > 1 ? 's' : ''}`}
                  </div>
                )}
              </div>
            )}
            
            {dosage.route && (
              <div className="dosage-route">
                {dosage.route.text || dosage.route.coding?.[0]?.display || 'Unknown route'}
              </div>
            )}
          </div>
          
          {dosage.patientInstruction && (
            <div className="patient-instructions">
              <strong>Instructions:</strong> {dosage.patientInstruction}
            </div>
          )}
        </div>
        
        <div className="dosage-details">
          {dosage.method && (
            <div className="dosage-detail">
              <span className="dosage-label">Method:</span>
              <span className="dosage-value">
                {dosage.method.text || dosage.method.coding?.[0]?.display || 'Unknown'}
              </span>
            </div>
          )}
          
          {dosage.asNeededBoolean !== undefined && (
            <div className="dosage-detail">
              <span className="dosage-label">As Needed:</span>
              <span className="dosage-value">
                {dosage.asNeededBoolean ? 'Yes' : 'No'}
              </span>
            </div>
          )}
          
          {dosage.asNeededCodeableConcept && (
            <div className="dosage-detail">
              <span className="dosage-label">As Needed For:</span>
              <span className="dosage-value">
                {dosage.asNeededCodeableConcept.text || 
                 dosage.asNeededCodeableConcept.coding?.[0]?.display ||
                 'Unknown condition'}
              </span>
            </div>
          )}
        </div>
      </div>
    ));
  };

  // Get dispense request info
  const getDispenseRequest = (): React.JSX.Element | null => {
    const dispenseRequest = medicationRequest.dispenseRequest;
    if (!dispenseRequest) return null;

    return (
      <div className="dispense-request">
        <h5>Dispense Request</h5>
        <div className="dispense-details">
          {dispenseRequest.quantity && (
            <div className="dispense-detail">
              <span className="detail-label">Quantity:</span>
              <span className="detail-value">
                {dispenseRequest.quantity.value} {dispenseRequest.quantity.unit || dispenseRequest.quantity.code || ''}
              </span>
            </div>
          )}
          
          {dispenseRequest.numberOfRepeatsAllowed !== undefined && (
            <div className="dispense-detail">
              <span className="detail-label">Refills:</span>
              <span className="detail-value">{dispenseRequest.numberOfRepeatsAllowed}</span>
            </div>
          )}
          
          {dispenseRequest.expectedSupplyDuration && (
            <div className="dispense-detail">
              <span className="detail-label">Supply Duration:</span>
              <span className="detail-value">
                {dispenseRequest.expectedSupplyDuration.value} {dispenseRequest.expectedSupplyDuration.unit || 'days'}
              </span>
            </div>
          )}
          
          {dispenseRequest.validityPeriod && (
            <div className="dispense-detail">
              <span className="detail-label">Valid Period:</span>
              <span className="detail-value">
                {dispenseRequest.validityPeriod.start && formatDate(dispenseRequest.validityPeriod.start)}
                {dispenseRequest.validityPeriod.start && dispenseRequest.validityPeriod.end && ' - '}
                {dispenseRequest.validityPeriod.end && formatDate(dispenseRequest.validityPeriod.end)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const statusInfo = getStatusInfo();
  const priorityInfo = getPriorityInfo();
  const medicationName = getMedicationName();
  const category = getCategory();
  const intentInfo = getIntentInfo();
  const dosageInstructions = getDosageInstructions();

  if (viewMode === 'summary') {
    return (
      <div className="resource-viewer medication-request-viewer summary">
        <div className="resource-header">
          <div className="resource-icon">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6,3H18V5H6V3M3,7A2,2 0 0,1 5,5H19A2,2 0 0,1 21,7V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V7M5,7V19H19V7H5M7,9H17V11H7V9M7,13H17V15H7V13M7,17H13V19H7V17Z" />
            </svg>
          </div>
          <div className="resource-title">
            <h4>{medicationName}</h4>
            <span className="resource-id">
              {category} • {intentInfo}
              {medicationRequest.authoredOn && ` • ${formatDate(medicationRequest.authoredOn)}`}
            </span>
          </div>
          <div className="medication-summary-status">
            <span className={`status-indicator ${statusInfo.className}`}>
              {statusInfo.text}
            </span>
            {priorityInfo && (
              <span className={`priority-indicator ${priorityInfo.className}`}>
                {priorityInfo.text}
              </span>
            )}
          </div>
          {onSelect && (
            <button className="view-details-button" onClick={onSelect}>
              View Details
            </button>
          )}
        </div>
        
        {dosageInstructions.length > 0 && (
          <div className="medication-summary-dosage">
            {dosageInstructions[0]}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="resource-viewer medication-request-viewer detailed">
      <div className="resource-header">
        <div className="resource-icon">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6,3H18V5H6V3M3,7A2,2 0 0,1 5,5H19A2,2 0 0,1 21,7V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V7M5,7V19H19V7H5M7,9H17V11H7V9M7,13H17V15H7V13M7,17H13V19H7V17Z" />
          </svg>
        </div>
        <div className="resource-title">
          <h4>{medicationName}</h4>
          <span className="resource-id">ID: {medicationRequest.id || 'Unknown'}</span>
        </div>
        <div className="medication-status-indicators">
          <span className={`status-indicator ${statusInfo.className}`}>
            {statusInfo.text}
          </span>
          {priorityInfo && (
            <span className={`priority-indicator ${priorityInfo.className}`}>
              {priorityInfo.text}
            </span>
          )}
        </div>
      </div>

      <div className="resource-content">
        <div className="medication-request-details">
          <div className="detail-section">
            <h5>Basic Information</h5>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{category}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className={`detail-value ${statusInfo.className}`}>
                  {statusInfo.text}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Intent:</span>
                <span className="detail-value">{intentInfo}</span>
              </div>
              {priorityInfo && (
                <div className="detail-item">
                  <span className="detail-label">Priority:</span>
                  <span className={`detail-value ${priorityInfo.className}`}>
                    {priorityInfo.text}
                  </span>
                </div>
              )}
              {medicationRequest.authoredOn && (
                <div className="detail-item">
                  <span className="detail-label">Authored On:</span>
                  <span className="detail-value">{formatDate(medicationRequest.authoredOn)}</span>
                </div>
              )}
            </div>
          </div>

          {medicationRequest.medicationCodeableConcept?.coding && medicationRequest.medicationCodeableConcept.coding.length > 0 && (
            <div className="detail-section">
              <h5>Medication Coding</h5>
              <div className="coding-list">
                {medicationRequest.medicationCodeableConcept.coding.map((coding, index) => (
                  <div key={index} className="coding-item">
                    <div className="code-display">
                      <span className="code-text">{coding.display || coding.code}</span>
                      {coding.system && (
                        <span className="code-coding">
                          {coding.system}#{coding.code}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dosageInstructions.length > 0 && (
            <div className="detail-section">
              <h5>Dosage Instructions</h5>
              <div className="dosage-list">
                {dosageInstructions}
              </div>
            </div>
          )}

          {getDispenseRequest()}

          {medicationRequest.reasonCode && medicationRequest.reasonCode.length > 0 && (
            <div className="detail-section">
              <h5>Reason for Prescription</h5>
              <div className="reason-list">
                {medicationRequest.reasonCode.map((reason, index) => (
                  <div key={index} className="reason-item">
                    {reason.text || reason.coding?.[0]?.display || reason.coding?.[0]?.code || 'Unknown reason'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {medicationRequest.reasonReference && medicationRequest.reasonReference.length > 0 && (
            <div className="detail-section">
              <h5>Related Conditions</h5>
              <div className="reference-list">
                {medicationRequest.reasonReference.map((reference, index) => (
                  <div key={index} className="reference-item">
                    {reference.display || reference.reference || 'Unknown reference'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(medicationRequest.requester?.display || medicationRequest.performer?.display) && (
            <div className="detail-section">
              <h5>Attribution</h5>
              <div className="detail-grid">
                {medicationRequest.requester?.display && (
                  <div className="detail-item">
                    <span className="detail-label">Requested by:</span>
                    <span className="detail-value">{medicationRequest.requester.display}</span>
                  </div>
                )}
                {medicationRequest.performer?.display && (
                  <div className="detail-item">
                    <span className="detail-label">Performer:</span>
                    <span className="detail-value">{medicationRequest.performer.display}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {medicationRequest.substitution && (
            <div className="detail-section">
              <h5>Substitution</h5>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Allowed:</span>
                  <span className="detail-value">
                    {medicationRequest.substitution.allowedBoolean !== undefined ? 
                      (medicationRequest.substitution.allowedBoolean ? 'Yes' : 'No') :
                      (medicationRequest.substitution.allowedCodeableConcept?.text || 
                       medicationRequest.substitution.allowedCodeableConcept?.coding?.[0]?.display ||
                       'Unknown')}
                  </span>
                </div>
                {medicationRequest.substitution.reason && (
                  <div className="detail-item">
                    <span className="detail-label">Reason:</span>
                    <span className="detail-value">
                      {medicationRequest.substitution.reason.text || 
                       medicationRequest.substitution.reason.coding?.[0]?.display ||
                       'Unknown reason'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {medicationRequest.note && medicationRequest.note.length > 0 && (
            <div className="detail-section">
              <h5>Notes</h5>
              <div className="note-list">
                {medicationRequest.note.map((note, index) => (
                  <div key={index} className="note-item">
                    <div className="note-text">{note.text}</div>
                    {note.time && (
                      <div className="note-time">{formatDate(note.time)}</div>
                    )}
                    {(note.authorString || note.authorReference?.display) && (
                      <div className="note-author">
                        By: {note.authorString || note.authorReference?.display}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
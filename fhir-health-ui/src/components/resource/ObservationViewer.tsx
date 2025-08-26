import React from 'react';
import type { Observation } from '../../types/fhir';
import './ResourceViewer.css';

export interface ObservationViewerProps {
  observation: Observation;
  viewMode?: 'summary' | 'detailed';
  onSelect?: () => void;
}

export function ObservationViewer({ 
  observation, 
  viewMode = 'summary', 
  onSelect 
}: ObservationViewerProps): React.JSX.Element {

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
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Get observation display name
  const getObservationName = (): string => {
    return observation.code?.text || 
           observation.code?.coding?.[0]?.display || 
           observation.code?.coding?.[0]?.code || 
           'Unknown Observation';
  };

  // Get observation category
  const getCategory = (): string => {
    const category = observation.category?.[0];
    return category?.text || 
           category?.coding?.[0]?.display || 
           category?.coding?.[0]?.code || 
           'General';
  };

  // Get observation value display
  const getValueDisplay = (): React.JSX.Element => {
    if (observation.valueQuantity) {
      return (
        <div className="value-display">
          <span className="value-number">{observation.valueQuantity.value}</span>
          <span className="value-unit">{observation.valueQuantity.unit || observation.valueQuantity.code}</span>
        </div>
      );
    }

    if (observation.valueString) {
      return (
        <div className="value-display">
          <span className="value-text">{observation.valueString}</span>
        </div>
      );
    }

    if (observation.valueBoolean !== undefined) {
      return (
        <div className="value-display">
          <span className={`value-boolean ${observation.valueBoolean ? 'true' : 'false'}`}>
            {observation.valueBoolean ? 'Yes' : 'No'}
          </span>
        </div>
      );
    }

    if (observation.valueCodeableConcept) {
      return (
        <div className="value-display">
          <span className="value-text">
            {observation.valueCodeableConcept.text || 
             observation.valueCodeableConcept.coding?.[0]?.display ||
             observation.valueCodeableConcept.coding?.[0]?.code ||
             'Unknown value'}
          </span>
        </div>
      );
    }

    if (observation.valueInteger !== undefined) {
      return (
        <div className="value-display">
          <span className="value-number">{observation.valueInteger}</span>
        </div>
      );
    }

    if (observation.dataAbsentReason) {
      return (
        <div className="value-display">
          <span className="value-text absent-reason">
            {observation.dataAbsentReason.text || 
             observation.dataAbsentReason.coding?.[0]?.display ||
             'Data not available'}
          </span>
        </div>
      );
    }

    return (
      <div className="value-display">
        <span className="value-text">No value recorded</span>
      </div>
    );
  };

  // Get reference range information
  const getReferenceRange = (): React.JSX.Element | null => {
    const range = observation.referenceRange?.[0];
    if (!range) return null;

    const low = range.low?.value;
    const high = range.high?.value;
    const unit = range.low?.unit || range.high?.unit;

    if (low !== undefined && high !== undefined) {
      return (
        <div className="reference-range">
          <span>Normal: {low} - {high} {unit}</span>
        </div>
      );
    } else if (low !== undefined) {
      return (
        <div className="reference-range">
          <span>Normal: ≥ {low} {unit}</span>
        </div>
      );
    } else if (high !== undefined) {
      return (
        <div className="reference-range">
          <span>Normal: ≤ {high} {unit}</span>
        </div>
      );
    }

    return null;
  };

  // Get interpretation
  const getInterpretation = (): React.JSX.Element | null => {
    const interpretation = observation.interpretation?.[0];
    if (!interpretation) return null;

    const text = interpretation.text || 
                 interpretation.coding?.[0]?.display || 
                 interpretation.coding?.[0]?.code;
    
    if (!text) return null;

    const code = interpretation.coding?.[0]?.code?.toLowerCase();
    let className = 'range-normal';
    
    if (code?.includes('high') || code?.includes('h')) {
      className = 'range-high';
    } else if (code?.includes('low') || code?.includes('l')) {
      className = 'range-low';
    } else if (code?.includes('critical') || code?.includes('panic')) {
      className = 'range-critical';
    }

    return (
      <div className="reference-range">
        <span className={`range-indicator ${className}`}>
          {text}
        </span>
      </div>
    );
  };

  // Get status info
  const getStatusInfo = () => {
    const status = observation.status;
    const statusClasses = {
      'registered': 'status-draft',
      'preliminary': 'status-preliminary',
      'final': 'status-final',
      'amended': 'status-active',
      'corrected': 'status-active',
      'cancelled': 'status-cancelled',
      'entered-in-error': 'status-entered-in-error',
      'unknown': 'status-unknown',
    };

    return {
      text: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
      className: statusClasses[status] || 'status-unknown',
    };
  };

  // Get effective date
  const getEffectiveDate = (): string => {
    if (observation.effectiveDateTime) {
      return formatDate(observation.effectiveDateTime);
    }
    if (observation.effectivePeriod?.start) {
      return formatDate(observation.effectivePeriod.start);
    }
    if (observation.effectiveInstant) {
      return formatDate(observation.effectiveInstant);
    }
    return 'Unknown date';
  };

  // Render component values (for multi-component observations like blood pressure)
  const renderComponents = (): React.JSX.Element | null => {
    if (!observation.component || observation.component.length === 0) {
      return null;
    }

    return (
      <div className="observation-components">
        <h5>Components:</h5>
        <div className="component-list">
          {observation.component.map((component, index) => (
            <div key={index} className="component-item">
              <div className="component-name">
                {component.code?.text || 
                 component.code?.coding?.[0]?.display || 
                 component.code?.coding?.[0]?.code ||
                 `Component ${index + 1}`}
              </div>
              <div className="component-value">
                {component.valueQuantity && (
                  <span>
                    {component.valueQuantity.value} {component.valueQuantity.unit || component.valueQuantity.code}
                  </span>
                )}
                {component.valueString && <span>{component.valueString}</span>}
                {component.valueCodeableConcept && (
                  <span>
                    {component.valueCodeableConcept.text || 
                     component.valueCodeableConcept.coding?.[0]?.display ||
                     'Unknown value'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const statusInfo = getStatusInfo();
  const observationName = getObservationName();
  const category = getCategory();
  const effectiveDate = getEffectiveDate();

  if (viewMode === 'summary') {
    return (
      <div className="resource-viewer observation-viewer summary">
        <div className="resource-header">
          <div className="resource-icon">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 21H5V3H13V9H19Z" />
            </svg>
          </div>
          <div className="resource-title">
            <h4>{observationName}</h4>
            <span className="resource-id">{category} • {effectiveDate}</span>
          </div>
          <div className="observation-summary-value">
            {getValueDisplay()}
            {getInterpretation()}
          </div>
          {onSelect && (
            <button className="view-details-button" onClick={onSelect}>
              View Details
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="resource-viewer observation-viewer detailed">
      <div className="resource-header">
        <div className="resource-icon">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 21H5V3H13V9H19Z" />
          </svg>
        </div>
        <div className="resource-title">
          <h4>{observationName}</h4>
          <span className="resource-id">ID: {observation.id || 'Unknown'}</span>
        </div>
        <span className={`status-indicator ${statusInfo.className}`}>
          {statusInfo.text}
        </span>
      </div>

      <div className="resource-content">
        <div className="observation-details">
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
                <span className="detail-label">Effective Date:</span>
                <span className="detail-value">{effectiveDate}</span>
              </div>
              {observation.issued && (
                <div className="detail-item">
                  <span className="detail-label">Issued:</span>
                  <span className="detail-value">{formatDate(observation.issued)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h5>Value</h5>
            <div className="observation-value">
              {getValueDisplay()}
              {getReferenceRange()}
              {getInterpretation()}
            </div>
          </div>

          {observation.code?.coding && observation.code.coding.length > 0 && (
            <div className="detail-section">
              <h5>Coding</h5>
              <div className="coding-list">
                {observation.code.coding.map((coding, index) => (
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

          {renderComponents()}

          {observation.performer && observation.performer.length > 0 && (
            <div className="detail-section">
              <h5>Performed By</h5>
              <div className="performer-list">
                {observation.performer.map((performer, index) => (
                  <div key={index} className="performer-item">
                    {performer.display || performer.reference || 'Unknown performer'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {observation.note && observation.note.length > 0 && (
            <div className="detail-section">
              <h5>Notes</h5>
              <div className="note-list">
                {observation.note.map((note, index) => (
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
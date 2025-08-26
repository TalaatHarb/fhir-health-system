import React from 'react';
import type { Encounter } from '../../types/fhir';
import './EncounterTimelineItem.css';

export interface EncounterTimelineItemProps {
  encounter: Encounter;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function EncounterTimelineItem({
  encounter,
  isExpanded,
  onToggle,
  onSelect,
  isFirst = false,
  isLast = false,
}: EncounterTimelineItemProps): React.JSX.Element {
  
  // Format encounter date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
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

  // Get encounter duration
  const getEncounterDuration = (): string => {
    if (!encounter.period?.start) return '';
    
    try {
      const start = new Date(encounter.period.start);
      if (isNaN(start.getTime())) return '';
      
      const end = encounter.period.end ? new Date(encounter.period.end) : new Date();
      if (isNaN(end.getTime())) return '';
      
      const durationMs = end.getTime() - start.getTime();
      if (durationMs < 0) return '';
      
      const durationMinutes = Math.round(durationMs / (1000 * 60));
      const durationHours = Math.round(durationMs / (1000 * 60 * 60));
      
      if (durationMinutes < 60) {
        return `${durationMinutes} min`;
      } else if (durationHours < 24) {
        return `${durationHours} hr`;
      } else {
        const durationDays = Math.round(durationHours / 24);
        return `${durationDays} day${durationDays > 1 ? 's' : ''}`;
      }
    } catch {
      return '';
    }
  };

  // Get status display info
  const getStatusInfo = () => {
    const status = encounter.status;
    const statusClasses = {
      'planned': 'status-planned',
      'arrived': 'status-arrived',
      'triaged': 'status-triaged',
      'in-progress': 'status-in-progress',
      'onleave': 'status-onleave',
      'finished': 'status-finished',
      'cancelled': 'status-cancelled',
      'entered-in-error': 'status-entered-in-error',
      'unknown': 'status-unknown',
    };

    return {
      text: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
      className: statusClasses[status] || 'status-unknown',
    };
  };

  // Get encounter class display
  const getEncounterClass = (): string => {
    return encounter.class?.display || encounter.class?.code || 'Unknown';
  };

  // Get encounter type display
  const getEncounterType = (): string => {
    const primaryType = encounter.type?.[0];
    return primaryType?.text || primaryType?.coding?.[0]?.display || 'General';
  };

  // Get reason codes display
  const getReasonCodes = (): string[] => {
    return encounter.reasonCode?.map(reason => 
      reason.text || reason.coding?.[0]?.display || 'Unknown reason'
    ).filter(Boolean) || [];
  };

  // Get diagnosis display
  const getDiagnoses = (): string[] => {
    return encounter.diagnosis?.map(diag => 
      diag.condition?.display || `Condition ${diag.condition?.reference || 'Unknown'}`
    ).filter(Boolean) || [];
  };

  const statusInfo = getStatusInfo();
  const duration = getEncounterDuration();
  const encounterClass = getEncounterClass();
  const encounterType = getEncounterType();
  const reasonCodes = getReasonCodes();
  const diagnoses = getDiagnoses();

  return (
    <div className={`encounter-timeline-item ${isFirst ? 'first' : ''} ${isLast ? 'last' : ''}`}>
      <div className="timeline-marker">
        <div className={`timeline-dot ${statusInfo.className}`} />
      </div>
      
      <div className="encounter-card">
        <div className="encounter-header" onClick={onToggle}>
          <div className="encounter-main-info">
            <div className="encounter-title">
              <span className="encounter-type">{encounterType}</span>
              <span className="encounter-class">({encounterClass})</span>
            </div>
            <div className="encounter-date">
              {formatDate(encounter.period?.start)}
              {duration && <span className="encounter-duration"> • {duration}</span>}
            </div>
          </div>
          
          <div className="encounter-status-info">
            <span className={`encounter-status ${statusInfo.className}`}>
              {statusInfo.text}
            </span>
            <button 
              className={`expand-button ${isExpanded ? 'expanded' : ''}`}
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.5 6L8 9.5L11.5 6H4.5Z" />
              </svg>
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="encounter-details">
            <div className="encounter-details-grid">
              {/* Basic Information */}
              <div className="detail-section">
                <h4 className="detail-section-title">Basic Information</h4>
                <div className="detail-items">
                  <div className="detail-item">
                    <span className="detail-label">ID:</span>
                    <span className="detail-value">{encounter.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`detail-value ${statusInfo.className}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Class:</span>
                    <span className="detail-value">{encounterClass}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{encounterType}</span>
                  </div>
                </div>
              </div>

              {/* Timing Information */}
              <div className="detail-section">
                <h4 className="detail-section-title">Timing</h4>
                <div className="detail-items">
                  <div className="detail-item">
                    <span className="detail-label">Start:</span>
                    <span className="detail-value">
                      {formatDate(encounter.period?.start)}
                    </span>
                  </div>
                  {encounter.period?.end && (
                    <div className="detail-item">
                      <span className="detail-label">End:</span>
                      <span className="detail-value">
                        {formatDate(encounter.period.end)}
                      </span>
                    </div>
                  )}
                  {duration && (
                    <div className="detail-item">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{duration}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reason Codes */}
              {reasonCodes.length > 0 && (
                <div className="detail-section">
                  <h4 className="detail-section-title">Reason for Visit</h4>
                  <div className="detail-items">
                    {reasonCodes.map((reason, index) => (
                      <div key={index} className="detail-item">
                        <span className="detail-value">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnoses */}
              {diagnoses.length > 0 && (
                <div className="detail-section">
                  <h4 className="detail-section-title">Diagnoses</h4>
                  <div className="detail-items">
                    {diagnoses.map((diagnosis, index) => (
                      <div key={index} className="detail-item">
                        <span className="detail-value">{diagnosis}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants */}
              {encounter.participant && encounter.participant.length > 0 && (
                <div className="detail-section">
                  <h4 className="detail-section-title">Participants</h4>
                  <div className="detail-items">
                    {encounter.participant.map((participant, index) => (
                      <div key={index} className="detail-item">
                        <span className="detail-label">
                          {participant.type?.[0]?.text || 'Participant'}:
                        </span>
                        <span className="detail-value">
                          {participant.individual?.display || 'Unknown'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="encounter-actions">
              <button 
                className="view-details-button"
                onClick={onSelect}
              >
                View Full Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
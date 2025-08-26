import React from 'react';
import type { Procedure } from '../../types/fhir';
import './ResourceViewer.css';

export interface ProcedureViewerProps {
  procedure: Procedure;
  viewMode?: 'summary' | 'detailed';
  onSelect?: () => void;
}

export function ProcedureViewer({ 
  procedure, 
  viewMode = 'summary', 
  onSelect 
}: ProcedureViewerProps): React.JSX.Element {

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

  // Get procedure display name
  const getProcedureName = (): string => {
    return procedure.code?.text || 
           procedure.code?.coding?.[0]?.display || 
           procedure.code?.coding?.[0]?.code || 
           'Unknown Procedure';
  };

  // Get procedure category
  const getCategory = (): string => {
    return procedure.category?.text || 
           procedure.category?.coding?.[0]?.display || 
           procedure.category?.coding?.[0]?.code || 
           'General';
  };

  // Get status info
  const getStatusInfo = () => {
    const status = procedure.status;
    const statusClasses = {
      'preparation': 'status-preliminary',
      'in-progress': 'status-in-progress',
      'not-done': 'status-cancelled',
      'on-hold': 'status-preliminary',
      'stopped': 'status-inactive',
      'completed': 'status-completed',
      'entered-in-error': 'status-entered-in-error',
      'unknown': 'status-unknown',
    };

    return {
      text: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
      className: statusClasses[status] || 'status-unknown',
    };
  };

  // Get performed date/period
  const getPerformedInfo = (): string => {
    if (procedure.performedDateTime) {
      return formatDate(procedure.performedDateTime);
    }
    if (procedure.performedPeriod?.start) {
      const start = formatDate(procedure.performedPeriod.start);
      const end = procedure.performedPeriod.end ? formatDate(procedure.performedPeriod.end) : 'Ongoing';
      return procedure.performedPeriod.end ? `${start} - ${end}` : start;
    }
    if (procedure.performedString) {
      return procedure.performedString;
    }
    if (procedure.performedAge) {
      return `Age ${procedure.performedAge.value} ${procedure.performedAge.unit || 'years'}`;
    }
    return 'Unknown date';
  };

  // Get performers
  const getPerformers = (): string[] => {
    return procedure.performer?.map(performer => {
      const name = performer.actor?.display || performer.actor?.reference || 'Unknown performer';
      const role = performer.function?.text || performer.function?.coding?.[0]?.display;
      return role ? `${name} (${role})` : name;
    }).filter(Boolean) || [];
  };

  // Get body sites
  const getBodySites = (): string[] => {
    return procedure.bodySite?.map(site => 
      site.text || site.coding?.[0]?.display || site.coding?.[0]?.code || 'Unknown site'
    ).filter(Boolean) || [];
  };

  // Get reason codes
  const getReasonCodes = (): string[] => {
    return procedure.reasonCode?.map(reason => 
      reason.text || reason.coding?.[0]?.display || reason.coding?.[0]?.code || 'Unknown reason'
    ).filter(Boolean) || [];
  };

  // Get reason references
  const getReasonReferences = (): string[] => {
    return procedure.reasonReference?.map(reference => 
      reference.display || reference.reference || 'Unknown reference'
    ).filter(Boolean) || [];
  };

  // Get outcome
  const getOutcome = (): string | null => {
    if (!procedure.outcome) return null;
    return procedure.outcome.text || 
           procedure.outcome.coding?.[0]?.display || 
           procedure.outcome.coding?.[0]?.code || 
           'Unknown outcome';
  };

  // Get complications
  const getComplications = (): string[] => {
    const complications: string[] = [];
    
    if (procedure.complication) {
      complications.push(...procedure.complication.map(comp => 
        comp.text || comp.coding?.[0]?.display || comp.coding?.[0]?.code || 'Unknown complication'
      ));
    }
    
    if (procedure.complicationDetail) {
      complications.push(...procedure.complicationDetail.map(detail => 
        detail.display || detail.reference || 'Unknown complication detail'
      ));
    }
    
    return complications.filter(Boolean);
  };

  // Get follow-up instructions
  const getFollowUp = (): string[] => {
    return procedure.followUp?.map(followUp => 
      followUp.text || followUp.coding?.[0]?.display || followUp.coding?.[0]?.code || 'Unknown follow-up'
    ).filter(Boolean) || [];
  };

  const statusInfo = getStatusInfo();
  const procedureName = getProcedureName();
  const category = getCategory();
  const performedInfo = getPerformedInfo();
  const performers = getPerformers();
  const bodySites = getBodySites();
  const reasonCodes = getReasonCodes();
  const reasonReferences = getReasonReferences();
  const outcome = getOutcome();
  const complications = getComplications();
  const followUp = getFollowUp();

  if (viewMode === 'summary') {
    return (
      <div className="resource-viewer procedure-viewer summary">
        <div className="resource-header">
          <div className="resource-icon">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19M17,8.5L13.5,12L17,15.5V13H21V11H17V8.5M7,15.5L10.5,12L7,8.5V11H3V13H7V15.5Z" />
            </svg>
          </div>
          <div className="resource-title">
            <h4>{procedureName}</h4>
            <span className="resource-id">
              {category} • {performedInfo}
              {bodySites.length > 0 && ` • ${bodySites[0]}`}
            </span>
          </div>
          <div className="procedure-summary-status">
            <span className={`status-indicator ${statusInfo.className}`}>
              {statusInfo.text}
            </span>
          </div>
          {onSelect && (
            <button className="view-details-button" onClick={onSelect}>
              View Details
            </button>
          )}
        </div>
        
        {outcome && (
          <div className="procedure-summary-outcome">
            <div className="outcome-preview">
              <strong>Outcome:</strong> {outcome}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="resource-viewer procedure-viewer detailed">
      <div className="resource-header">
        <div className="resource-icon">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19M17,8.5L13.5,12L17,15.5V13H21V11H17V8.5M7,15.5L10.5,12L7,8.5V11H3V13H7V15.5Z" />
          </svg>
        </div>
        <div className="resource-title">
          <h4>{procedureName}</h4>
          <span className="resource-id">ID: {procedure.id || 'Unknown'}</span>
        </div>
        <span className={`status-indicator ${statusInfo.className}`}>
          {statusInfo.text}
        </span>
      </div>

      <div className="resource-content">
        <div className="procedure-details">
          {/* Enhanced Procedure Timeline */}
          <div className="procedure-timeline">
            <div className={`procedure-phase ${procedure.status}`}>
              <div className={`phase-indicator ${procedure.status}`}>
                {procedure.status === 'completed' ? '✓' : 
                 procedure.status === 'in-progress' ? '⟳' :
                 procedure.status === 'preparation' ? '◐' : '●'}
              </div>
              <div className="phase-content">
                <div className="phase-title">{procedureName}</div>
                <div className="phase-description">
                  Status: {statusInfo.text} • {performedInfo}
                  {procedure.location?.display && ` • ${procedure.location.display}`}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Outcome Display */}
          {(outcome || complications.length > 0) && (
            <div className={`procedure-outcome-card ${complications.length > 0 ? 'outcome-complications' : 'outcome-success'}`}>
              <div className="outcome-title">
                {complications.length > 0 ? 'Procedure Outcome with Complications' : 'Procedure Outcome'}
              </div>
              {outcome && (
                <div className="outcome-description">
                  <strong>Result:</strong> {outcome}
                </div>
              )}
              {complications.length > 0 && (
                <div className="outcome-description">
                  <strong>Complications:</strong>
                  <ul>
                    {complications.map((complication, index) => (
                      <li key={index}>{complication}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

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
                <span className="detail-label">Performed:</span>
                <span className="detail-value">{performedInfo}</span>
              </div>
              {procedure.location?.display && (
                <div className="detail-item">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{procedure.location.display}</span>
                </div>
              )}
            </div>
          </div>

          {procedure.statusReason && (
            <div className="detail-section">
              <h5>Status Reason</h5>
              <div className="status-reason">
                {procedure.statusReason.text || 
                 procedure.statusReason.coding?.[0]?.display ||
                 procedure.statusReason.coding?.[0]?.code ||
                 'Unknown reason'}
              </div>
            </div>
          )}

          {performers.length > 0 && (
            <div className="detail-section">
              <h5>Performed By</h5>
              <div className="performer-list">
                {performers.map((performer, index) => (
                  <div key={index} className="performer-item">
                    {performer}
                  </div>
                ))}
              </div>
            </div>
          )}

          {bodySites.length > 0 && (
            <div className="detail-section">
              <h5>Body Sites</h5>
              <div className="body-site-list">
                {bodySites.map((site, index) => (
                  <span key={index} className="body-site-tag">
                    {site}
                  </span>
                ))}
              </div>
            </div>
          )}

          {procedure.code?.coding && procedure.code.coding.length > 0 && (
            <div className="detail-section">
              <h5>Procedure Coding</h5>
              <div className="coding-list">
                {procedure.code.coding.map((coding, index) => (
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

          {(reasonCodes.length > 0 || reasonReferences.length > 0) && (
            <div className="detail-section">
              <h5>Reason for Procedure</h5>
              {reasonCodes.length > 0 && (
                <div className="reason-codes">
                  <h6>Reason Codes:</h6>
                  <div className="reason-list">
                    {reasonCodes.map((reason, index) => (
                      <div key={index} className="reason-item">
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {reasonReferences.length > 0 && (
                <div className="reason-references">
                  <h6>Related Conditions:</h6>
                  <div className="reference-list">
                    {reasonReferences.map((reference, index) => (
                      <div key={index} className="reference-item">
                        {reference}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {outcome && (
            <div className="detail-section">
              <h5>Outcome</h5>
              <div className="outcome-content">
                <div className="outcome-text">
                  {outcome}
                </div>
              </div>
            </div>
          )}

          {complications.length > 0 && (
            <div className="detail-section">
              <h5>Complications</h5>
              <div className="complication-list">
                {complications.map((complication, index) => (
                  <div key={index} className="complication-item">
                    {complication}
                  </div>
                ))}
              </div>
            </div>
          )}

          {followUp.length > 0 && (
            <div className="detail-section">
              <h5>Follow-up Instructions</h5>
              <div className="followup-list">
                {followUp.map((instruction, index) => (
                  <div key={index} className="followup-item">
                    {instruction}
                  </div>
                ))}
              </div>
            </div>
          )}

          {procedure.focalDevice && procedure.focalDevice.length > 0 && (
            <div className="detail-section">
              <h5>Devices Used</h5>
              <div className="device-list">
                {procedure.focalDevice.map((device, index) => (
                  <div key={index} className="device-item">
                    <div className="device-info">
                      <div className="device-name">
                        {device.manipulated?.display || device.manipulated?.reference || `Device ${index + 1}`}
                      </div>
                      {device.action && (
                        <div className="device-action">
                          Action: {device.action.text || device.action.coding?.[0]?.display || 'Unknown action'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(procedure.usedReference || procedure.usedCode) && (
            <div className="detail-section">
              <h5>Items Used</h5>
              {procedure.usedReference && procedure.usedReference.length > 0 && (
                <div className="used-references">
                  <h6>Referenced Items:</h6>
                  <div className="used-list">
                    {procedure.usedReference.map((item, index) => (
                      <div key={index} className="used-item">
                        {item.display || item.reference || `Item ${index + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {procedure.usedCode && procedure.usedCode.length > 0 && (
                <div className="used-codes">
                  <h6>Coded Items:</h6>
                  <div className="used-list">
                    {procedure.usedCode.map((code, index) => (
                      <div key={index} className="used-item">
                        {code.text || code.coding?.[0]?.display || code.coding?.[0]?.code || `Code ${index + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {procedure.report && procedure.report.length > 0 && (
            <div className="detail-section">
              <h5>Reports</h5>
              <div className="report-list">
                {procedure.report.map((report, index) => (
                  <div key={index} className="report-item">
                    {report.display || report.reference || `Report ${index + 1}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(procedure.recorder?.display || procedure.asserter?.display) && (
            <div className="detail-section">
              <h5>Attribution</h5>
              <div className="detail-grid">
                {procedure.recorder?.display && (
                  <div className="detail-item">
                    <span className="detail-label">Recorded by:</span>
                    <span className="detail-value">{procedure.recorder.display}</span>
                  </div>
                )}
                {procedure.asserter?.display && (
                  <div className="detail-item">
                    <span className="detail-label">Asserted by:</span>
                    <span className="detail-value">{procedure.asserter.display}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {procedure.note && procedure.note.length > 0 && (
            <div className="detail-section">
              <h5>Notes</h5>
              <div className="note-list">
                {procedure.note.map((note, index) => (
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
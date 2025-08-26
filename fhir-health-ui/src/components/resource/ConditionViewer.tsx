import React from 'react';
import type { Condition } from '../../types/fhir';
import './ResourceViewer.css';

export interface ConditionViewerProps {
  condition: Condition;
  viewMode?: 'summary' | 'detailed';
  onSelect?: () => void;
}

export function ConditionViewer({ 
  condition, 
  viewMode = 'summary', 
  onSelect 
}: ConditionViewerProps): React.JSX.Element {

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

  // Get condition display name
  const getConditionName = (): string => {
    return condition.code?.text || 
           condition.code?.coding?.[0]?.display || 
           condition.code?.coding?.[0]?.code || 
           'Unknown Condition';
  };

  // Get condition category
  const getCategory = (): string => {
    const category = condition.category?.[0];
    return category?.text || 
           category?.coding?.[0]?.display || 
           category?.coding?.[0]?.code || 
           'General';
  };

  // Get clinical status info
  const getClinicalStatusInfo = () => {
    const status = condition.clinicalStatus?.coding?.[0]?.code || 'unknown';
    const display = condition.clinicalStatus?.text || 
                   condition.clinicalStatus?.coding?.[0]?.display || 
                   status;

    const statusClasses = {
      'active': 'status-active',
      'recurrence': 'status-active',
      'relapse': 'status-active',
      'inactive': 'status-inactive',
      'remission': 'status-inactive',
      'resolved': 'status-completed',
      'unknown': 'status-unknown',
    };

    return {
      text: display.charAt(0).toUpperCase() + display.slice(1),
      className: statusClasses[status] || 'status-unknown',
    };
  };

  // Get verification status info
  const getVerificationStatusInfo = () => {
    const status = condition.verificationStatus?.coding?.[0]?.code || 'unknown';
    const display = condition.verificationStatus?.text || 
                   condition.verificationStatus?.coding?.[0]?.display || 
                   status;

    return {
      text: display.charAt(0).toUpperCase() + display.slice(1).replace('-', ' '),
      status: status,
    };
  };

  // Get severity info with enhanced visualization
  const getSeverityInfo = () => {
    if (!condition.severity) return null;

    const severity = condition.severity.coding?.[0]?.code || 'unknown';
    const display = condition.severity.text || 
                   condition.severity.coding?.[0]?.display || 
                   severity;

    const severityClasses = {
      'mild': 'severity-mild',
      'moderate': 'severity-moderate',
      'severe': 'severity-severe',
      'fatal': 'severity-fatal',
    };

    const severityIcons = {
      'mild': '●',
      'moderate': '●●',
      'severe': '●●●',
      'fatal': '⚠',
    };

    return {
      text: display.charAt(0).toUpperCase() + display.slice(1),
      className: severityClasses[severity] || 'severity-unknown',
      icon: severityIcons[severity] || '●',
      level: severity,
    };
  };

  // Render enhanced severity indicator
  const renderSeverityIndicator = () => {
    const severityInfo = getSeverityInfo();
    if (!severityInfo) return null;

    return (
      <div className={`condition-severity-indicator ${severityInfo.level}`}>
        <div className="severity-icon">
          {severityInfo.icon}
        </div>
        <div className="severity-text">
          {severityInfo.text} Severity
        </div>
        {severityInfo.level === 'fatal' && (
          <div className="severity-warning">
            Requires immediate attention
          </div>
        )}
      </div>
    );
  };

  // Get onset information
  const getOnsetInfo = (): string => {
    if (condition.onsetDateTime) {
      return formatDate(condition.onsetDateTime);
    }
    if (condition.onsetString) {
      return condition.onsetString;
    }
    if (condition.onsetPeriod?.start) {
      return formatDate(condition.onsetPeriod.start);
    }
    if (condition.onsetAge) {
      return `Age ${condition.onsetAge.value} ${condition.onsetAge.unit || 'years'}`;
    }
    return 'Unknown onset';
  };

  // Get abatement information
  const getAbatementInfo = (): string | null => {
    if (condition.abatementDateTime) {
      return formatDate(condition.abatementDateTime);
    }
    if (condition.abatementString) {
      return condition.abatementString;
    }
    if (condition.abatementPeriod?.start) {
      return formatDate(condition.abatementPeriod.start);
    }
    if (condition.abatementAge) {
      return `Age ${condition.abatementAge.value} ${condition.abatementAge.unit || 'years'}`;
    }
    if (condition.abatementBoolean === true) {
      return 'Resolved';
    }
    return null;
  };

  // Get body site information
  const getBodySites = (): string[] => {
    return condition.bodySite?.map(site => 
      site.text || site.coding?.[0]?.display || site.coding?.[0]?.code || 'Unknown site'
    ).filter(Boolean) || [];
  };

  const clinicalStatusInfo = getClinicalStatusInfo();
  const verificationStatusInfo = getVerificationStatusInfo();
  const severityInfo = getSeverityInfo();
  const conditionName = getConditionName();
  const category = getCategory();
  const onsetInfo = getOnsetInfo();
  const abatementInfo = getAbatementInfo();
  const bodySites = getBodySites();

  if (viewMode === 'summary') {
    return (
      <div className="resource-viewer condition-viewer summary">
        <div className="resource-header">
          <div className="resource-icon">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,7V13H13V7H11M11,15V17H13V15H11Z" />
            </svg>
          </div>
          <div className="resource-title">
            <h4>{conditionName}</h4>
            <span className="resource-id">{category} • {onsetInfo}</span>
          </div>
          <div className="condition-summary-status">
            <span className={`status-indicator ${clinicalStatusInfo.className}`}>
              {clinicalStatusInfo.text}
            </span>
            {severityInfo && (
              <span className={`status-indicator ${severityInfo.className}`}>
                {severityInfo.text}
              </span>
            )}
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
    <div className="resource-viewer condition-viewer detailed">
      <div className="resource-header">
        <div className="resource-icon">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,7V13H13V7H11M11,15V17H13V15H11Z" />
          </svg>
        </div>
        <div className="resource-title">
          <h4>{conditionName}</h4>
          <span className="resource-id">ID: {condition.id || 'Unknown'}</span>
        </div>
        <div className="condition-status-indicators">
          <span className={`status-indicator ${clinicalStatusInfo.className}`}>
            {clinicalStatusInfo.text}
          </span>
          {severityInfo && (
            <span className={`status-indicator ${severityInfo.className}`}>
              {severityInfo.text}
            </span>
          )}
        </div>
      </div>

      <div className="resource-content">
        <div className="condition-details">
          <div className="detail-section">
            <h5>Basic Information</h5>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{category}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Clinical Status:</span>
                <span className={`detail-value ${clinicalStatusInfo.className}`}>
                  {clinicalStatusInfo.text}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Verification Status:</span>
                <span className="detail-value">{verificationStatusInfo.text}</span>
              </div>
              {severityInfo && (
                <div className="detail-item">
                  <span className="detail-label">Severity:</span>
                  <span className={`detail-value ${severityInfo.className}`}>
                    {severityInfo.text}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Severity Visualization */}
          {renderSeverityIndicator()}

          <div className="detail-section">
            <h5>Timeline</h5>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Onset:</span>
                <span className="detail-value">{onsetInfo}</span>
              </div>
              {abatementInfo && (
                <div className="detail-item">
                  <span className="detail-label">Abatement:</span>
                  <span className="detail-value">{abatementInfo}</span>
                </div>
              )}
              {condition.recordedDate && (
                <div className="detail-item">
                  <span className="detail-label">Recorded:</span>
                  <span className="detail-value">{formatDate(condition.recordedDate)}</span>
                </div>
              )}
            </div>
          </div>

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

          {condition.code?.coding && condition.code.coding.length > 0 && (
            <div className="detail-section">
              <h5>Coding</h5>
              <div className="coding-list">
                {condition.code.coding.map((coding, index) => (
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

          {condition.stage && condition.stage.length > 0 && (
            <div className="detail-section">
              <h5>Stage Information</h5>
              <div className="stage-list">
                {condition.stage.map((stage, index) => (
                  <div key={index} className="stage-item">
                    {stage.summary && (
                      <div className="stage-summary">
                        <span className="stage-label">Summary:</span>
                        <span className="stage-value">
                          {stage.summary.text || 
                           stage.summary.coding?.[0]?.display ||
                           stage.summary.coding?.[0]?.code ||
                           'Unknown stage'}
                        </span>
                      </div>
                    )}
                    {stage.type && (
                      <div className="stage-type">
                        <span className="stage-label">Type:</span>
                        <span className="stage-value">
                          {stage.type.text || 
                           stage.type.coding?.[0]?.display ||
                           stage.type.coding?.[0]?.code ||
                           'Unknown type'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {condition.evidence && condition.evidence.length > 0 && (
            <div className="detail-section">
              <h5>Evidence</h5>
              <div className="evidence-list">
                {condition.evidence.map((evidence, index) => (
                  <div key={index} className="evidence-item">
                    {evidence.code && evidence.code.length > 0 && (
                      <div className="evidence-codes">
                        {evidence.code.map((code, codeIndex) => (
                          <span key={codeIndex} className="evidence-code">
                            {code.text || code.coding?.[0]?.display || code.coding?.[0]?.code}
                          </span>
                        ))}
                      </div>
                    )}
                    {evidence.detail && evidence.detail.length > 0 && (
                      <div className="evidence-details">
                        {evidence.detail.map((detail, detailIndex) => (
                          <span key={detailIndex} className="evidence-detail">
                            {detail.display || detail.reference}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(condition.recorder?.display || condition.asserter?.display) && (
            <div className="detail-section">
              <h5>Attribution</h5>
              <div className="detail-grid">
                {condition.recorder?.display && (
                  <div className="detail-item">
                    <span className="detail-label">Recorded by:</span>
                    <span className="detail-value">{condition.recorder.display}</span>
                  </div>
                )}
                {condition.asserter?.display && (
                  <div className="detail-item">
                    <span className="detail-label">Asserted by:</span>
                    <span className="detail-value">{condition.asserter.display}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {condition.note && condition.note.length > 0 && (
            <div className="detail-section">
              <h5>Notes</h5>
              <div className="note-list">
                {condition.note.map((note, index) => (
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
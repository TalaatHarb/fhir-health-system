import React from 'react';
import type { DiagnosticReport } from '../../types/fhir';
import './ResourceViewer.css';

export interface DiagnosticReportViewerProps {
  diagnosticReport: DiagnosticReport;
  viewMode?: 'summary' | 'detailed';
  onSelect?: () => void;
}

export function DiagnosticReportViewer({ 
  diagnosticReport, 
  viewMode = 'summary', 
  onSelect 
}: DiagnosticReportViewerProps): React.JSX.Element {

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

  // Get report display name
  const getReportName = (): string => {
    return diagnosticReport.code?.text || 
           diagnosticReport.code?.coding?.[0]?.display || 
           diagnosticReport.code?.coding?.[0]?.code || 
           'Unknown Diagnostic Report';
  };

  // Get report category
  const getCategory = (): string => {
    const category = diagnosticReport.category?.[0];
    return category?.text || 
           category?.coding?.[0]?.display || 
           category?.coding?.[0]?.code || 
           'General';
  };

  // Get status info
  const getStatusInfo = () => {
    const status = diagnosticReport.status;
    const statusClasses = {
      'registered': 'status-draft',
      'partial': 'status-preliminary',
      'preliminary': 'status-preliminary',
      'final': 'status-final',
      'amended': 'status-active',
      'corrected': 'status-active',
      'appended': 'status-active',
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
    if (diagnosticReport.effectiveDateTime) {
      return formatDate(diagnosticReport.effectiveDateTime);
    }
    if (diagnosticReport.effectivePeriod?.start) {
      return formatDate(diagnosticReport.effectivePeriod.start);
    }
    return 'Unknown date';
  };

  // Get issued date
  const getIssuedDate = (): string => {
    return diagnosticReport.issued ? formatDate(diagnosticReport.issued) : 'Not issued';
  };

  // Get performers
  const getPerformers = (): string[] => {
    const performers: string[] = [];
    
    if (diagnosticReport.performer) {
      performers.push(...diagnosticReport.performer.map(p => p.display || p.reference || 'Unknown performer'));
    }
    
    if (diagnosticReport.resultsInterpreter) {
      performers.push(...diagnosticReport.resultsInterpreter.map(p => p.display || p.reference || 'Unknown interpreter'));
    }
    
    return performers.filter(Boolean);
  };

  // Get conclusion summary
  const getConclusionSummary = (): string => {
    if (diagnosticReport.conclusion) {
      return diagnosticReport.conclusion.length > 100 ? 
        `${diagnosticReport.conclusion.substring(0, 100)}...` : 
        diagnosticReport.conclusion;
    }
    
    if (diagnosticReport.conclusionCode && diagnosticReport.conclusionCode.length > 0) {
      const codes = diagnosticReport.conclusionCode.map(code => 
        code.text || code.coding?.[0]?.display || code.coding?.[0]?.code
      ).filter(Boolean);
      return codes.join(', ');
    }
    
    return 'No conclusion available';
  };

  // Get result count
  const getResultCount = (): number => {
    return diagnosticReport.result?.length || 0;
  };

  // Get media count
  const getMediaCount = (): number => {
    return diagnosticReport.media?.length || 0;
  };

  const statusInfo = getStatusInfo();
  const reportName = getReportName();
  const category = getCategory();
  const effectiveDate = getEffectiveDate();
  const issuedDate = getIssuedDate();
  const performers = getPerformers();
  const conclusionSummary = getConclusionSummary();
  const resultCount = getResultCount();
  const mediaCount = getMediaCount();

  if (viewMode === 'summary') {
    return (
      <div className="resource-viewer diagnostic-report-viewer summary">
        <div className="resource-header">
          <div className="resource-icon">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
          <div className="resource-title">
            <h4>{reportName}</h4>
            <span className="resource-id">
              {category} • {effectiveDate}
              {resultCount > 0 && ` • ${resultCount} result${resultCount > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="report-summary-status">
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
        
        {conclusionSummary !== 'No conclusion available' && (
          <div className="report-summary-conclusion">
            <div className="conclusion-preview">
              <strong>Conclusion:</strong> {conclusionSummary}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="resource-viewer diagnostic-report-viewer detailed">
      <div className="resource-header">
        <div className="resource-icon">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div>
        <div className="resource-title">
          <h4>{reportName}</h4>
          <span className="resource-id">ID: {diagnosticReport.id || 'Unknown'}</span>
        </div>
        <span className={`status-indicator ${statusInfo.className}`}>
          {statusInfo.text}
        </span>
      </div>

      <div className="resource-content">
        <div className="diagnostic-report-details">
          {/* Enhanced Structured Display */}
          <div className="diagnostic-report-structure">
            <div className="report-metadata">
              <div className={`report-status-card ${diagnosticReport.status}`}>
                <h6>Report Status</h6>
                <div className={`status-indicator ${statusInfo.className}`}>
                  {statusInfo.text}
                </div>
                <div className="status-details">
                  <div>Effective: {effectiveDate}</div>
                  <div>Issued: {issuedDate}</div>
                </div>
              </div>
              
              {performers.length > 0 && (
                <div className="report-performers-card">
                  <h6>Performed By</h6>
                  <div className="performer-list">
                    {performers.map((performer, index) => (
                      <div key={index} className="performer-item">
                        {performer}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {resultCount > 0 && (
                <div className="report-results-summary">
                  <h6>Results Summary</h6>
                  <div className="results-count">
                    {resultCount} result{resultCount > 1 ? 's' : ''} available
                  </div>
                  {mediaCount > 0 && (
                    <div className="media-count">
                      {mediaCount} media item{mediaCount > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="report-content">
              {diagnosticReport.conclusion && (
                <div className="report-conclusion-highlight">
                  <div className="conclusion-highlight-title">Clinical Conclusion</div>
                  <div className="conclusion-highlight-text">
                    {diagnosticReport.conclusion}
                  </div>
                </div>
              )}
              
              {diagnosticReport.conclusionCode && diagnosticReport.conclusionCode.length > 0 && (
                <div className="conclusion-codes-section">
                  <h6>Conclusion Codes</h6>
                  <div className="conclusion-code-list">
                    {diagnosticReport.conclusionCode.map((code, index) => (
                      <div key={index} className="conclusion-code-item">
                        <div className="code-display">
                          <span className="code-text">
                            {code.text || code.coding?.[0]?.display || code.coding?.[0]?.code}
                          </span>
                          {code.coding?.[0]?.system && (
                            <span className="code-coding">
                              {code.coding[0].system}#{code.coding[0].code}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

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
              <div className="detail-item">
                <span className="detail-label">Issued:</span>
                <span className="detail-value">{issuedDate}</span>
              </div>
            </div>
          </div>

          {diagnosticReport.effectivePeriod && (
            <div className="detail-section">
              <h5>Effective Period</h5>
              <div className="detail-grid">
                {diagnosticReport.effectivePeriod.start && (
                  <div className="detail-item">
                    <span className="detail-label">Start:</span>
                    <span className="detail-value">{formatDate(diagnosticReport.effectivePeriod.start)}</span>
                  </div>
                )}
                {diagnosticReport.effectivePeriod.end && (
                  <div className="detail-item">
                    <span className="detail-label">End:</span>
                    <span className="detail-value">{formatDate(diagnosticReport.effectivePeriod.end)}</span>
                  </div>
                )}
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

          {diagnosticReport.code?.coding && diagnosticReport.code.coding.length > 0 && (
            <div className="detail-section">
              <h5>Report Coding</h5>
              <div className="coding-list">
                {diagnosticReport.code.coding.map((coding, index) => (
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

          {diagnosticReport.specimen && diagnosticReport.specimen.length > 0 && (
            <div className="detail-section">
              <h5>Specimens</h5>
              <div className="specimen-list">
                {diagnosticReport.specimen.map((specimen, index) => (
                  <div key={index} className="specimen-item">
                    {specimen.display || specimen.reference || `Specimen ${index + 1}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {diagnosticReport.result && diagnosticReport.result.length > 0 && (
            <div className="detail-section">
              <h5>Results ({diagnosticReport.result.length})</h5>
              <div className="result-list">
                {diagnosticReport.result.map((result, index) => (
                  <div key={index} className="result-item">
                    <div className="result-reference">
                      {result.display || result.reference || `Result ${index + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {diagnosticReport.imagingStudy && diagnosticReport.imagingStudy.length > 0 && (
            <div className="detail-section">
              <h5>Imaging Studies</h5>
              <div className="imaging-list">
                {diagnosticReport.imagingStudy.map((study, index) => (
                  <div key={index} className="imaging-item">
                    {study.display || study.reference || `Study ${index + 1}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {diagnosticReport.media && diagnosticReport.media.length > 0 && (
            <div className="detail-section">
              <h5>Media ({diagnosticReport.media.length})</h5>
              <div className="media-list">
                {diagnosticReport.media.map((media, index) => (
                  <div key={index} className="media-item">
                    <div className="media-info">
                      <div className="media-link">
                        {media.link?.display || media.link?.reference || `Media ${index + 1}`}
                      </div>
                      {media.comment && (
                        <div className="media-comment">{media.comment}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {diagnosticReport.conclusion && (
            <div className="detail-section">
              <h5>Conclusion</h5>
              <div className="conclusion-content">
                <div className="conclusion-text">
                  {diagnosticReport.conclusion}
                </div>
              </div>
            </div>
          )}

          {diagnosticReport.conclusionCode && diagnosticReport.conclusionCode.length > 0 && (
            <div className="detail-section">
              <h5>Conclusion Codes</h5>
              <div className="conclusion-code-list">
                {diagnosticReport.conclusionCode.map((code, index) => (
                  <div key={index} className="conclusion-code-item">
                    <div className="code-display">
                      <span className="code-text">
                        {code.text || code.coding?.[0]?.display || code.coding?.[0]?.code}
                      </span>
                      {code.coding?.[0]?.system && (
                        <span className="code-coding">
                          {code.coding[0].system}#{code.coding[0].code}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {diagnosticReport.presentedForm && diagnosticReport.presentedForm.length > 0 && (
            <div className="detail-section">
              <h5>Presented Forms</h5>
              <div className="presented-form-list">
                {diagnosticReport.presentedForm.map((form, index) => (
                  <div key={index} className="presented-form-item">
                    <div className="form-info">
                      <div className="form-title">
                        {form.title || `Form ${index + 1}`}
                      </div>
                      {form.contentType && (
                        <div className="form-type">
                          Type: {form.contentType}
                        </div>
                      )}
                      {form.size && (
                        <div className="form-size">
                          Size: {form.size} bytes
                        </div>
                      )}
                      {form.creation && (
                        <div className="form-creation">
                          Created: {formatDate(form.creation)}
                        </div>
                      )}
                      {form.url && (
                        <div className="form-url">
                          <a href={form.url} target="_blank" rel="noopener noreferrer">
                            View Document
                          </a>
                        </div>
                      )}
                    </div>
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
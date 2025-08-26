import React from 'react';
import type { AnyFHIRResource } from '../../types/fhir';
import { ObservationViewer } from './ObservationViewer';
import { ConditionViewer } from './ConditionViewer';
import { MedicationRequestViewer } from './MedicationRequestViewer';
import { DiagnosticReportViewer } from './DiagnosticReportViewer';
import { ProcedureViewer } from './ProcedureViewer';
import './ResourceViewer.css';

export interface ResourceViewerProps {
  resource: AnyFHIRResource;
  viewMode?: 'summary' | 'detailed';
  onSelect?: () => void;
}

export function ResourceViewer({ 
  resource, 
  viewMode = 'summary', 
  onSelect 
}: ResourceViewerProps): React.JSX.Element {
  
  // Format resource date for display
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

  // Get resource icon based on type
  const getResourceIcon = (resourceType: string): React.JSX.Element => {
    const iconProps = { width: "20", height: "20", fill: "currentColor" };
    
    switch (resourceType) {
      case 'Observation':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 21H5V3H13V9H19Z" />
          </svg>
        );
      case 'Condition':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,7V13H13V7H11M11,15V17H13V15H11Z" />
          </svg>
        );
      case 'MedicationRequest':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <path d="M6,3H18V5H6V3M3,7A2,2 0 0,1 5,5H19A2,2 0 0,1 21,7V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V7M5,7V19H19V7H5M7,9H17V11H7V9M7,13H17V15H7V13M7,17H13V19H7V17Z" />
          </svg>
        );
      case 'DiagnosticReport':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        );
      case 'Procedure':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19M17,8.5L13.5,12L17,15.5V13H21V11H17V8.5M7,15.5L10.5,12L7,8.5V11H3V13H7V15.5Z" />
          </svg>
        );
      default:
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        );
    }
  };

  // Render resource-specific viewer
  const renderResourceViewer = (): React.JSX.Element => {
    switch (resource.resourceType) {
      case 'Observation':
        return (
          <ObservationViewer 
            observation={resource} 
            viewMode={viewMode}
            onSelect={onSelect}
          />
        );
      case 'Condition':
        return (
          <ConditionViewer 
            condition={resource} 
            viewMode={viewMode}
            onSelect={onSelect}
          />
        );
      case 'MedicationRequest':
        return (
          <MedicationRequestViewer 
            medicationRequest={resource} 
            viewMode={viewMode}
            onSelect={onSelect}
          />
        );
      case 'DiagnosticReport':
        return (
          <DiagnosticReportViewer 
            diagnosticReport={resource} 
            viewMode={viewMode}
            onSelect={onSelect}
          />
        );
      case 'Procedure':
        return (
          <ProcedureViewer 
            procedure={resource} 
            viewMode={viewMode}
            onSelect={onSelect}
          />
        );
      default:
        return (
          <div className={`resource-viewer generic-resource ${viewMode}`}>
            <div className="resource-header">
              <div className="resource-icon">
                {getResourceIcon(resource.resourceType)}
              </div>
              <div className="resource-title">
                <h4>{resource.resourceType}</h4>
                <span className="resource-id">ID: {resource.id || 'Unknown'}</span>
              </div>
              {onSelect && viewMode === 'summary' && (
                <button className="view-details-button" onClick={onSelect}>
                  View Details
                </button>
              )}
            </div>
            <div className="resource-content">
              <p>Resource type "{resource.resourceType}" is not yet supported for detailed viewing.</p>
              {viewMode === 'detailed' && (
                <div className="raw-resource">
                  <h5>Raw Resource Data:</h5>
                  <pre>{JSON.stringify(resource, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="resource-viewer-wrapper">
      {renderResourceViewer()}
    </div>
  );
}
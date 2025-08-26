import React, { useState, useEffect, useCallback } from 'react';
import type { 
  Encounter, 
  Observation, 
  Condition, 
  MedicationRequest, 
  DiagnosticReport, 
  Procedure,
  Bundle,
  AnyFHIRResource
} from '../../types/fhir';
import { fhirClient } from '../../services/fhirClient';
import { Loading } from '../common/Loading';
import { ResourceViewer } from '../resource/ResourceViewer';
import './EncounterDetails.css';

export interface EncounterDetailsProps {
  encounter: Encounter;
  onClose?: () => void;
}

export interface EncounterResourcesState {
  observations: Observation[];
  conditions: Condition[];
  medicationRequests: MedicationRequest[];
  diagnosticReports: DiagnosticReport[];
  procedures: Procedure[];
  loading: boolean;
  error: string | null;
}

export function EncounterDetails({ encounter, onClose }: EncounterDetailsProps): React.JSX.Element {
  const [resourcesState, setResourcesState] = useState<EncounterResourcesState>({
    observations: [],
    conditions: [],
    medicationRequests: [],
    diagnosticReports: [],
    procedures: [],
    loading: false,
    error: null,
  });

  const [selectedResource, setSelectedResource] = useState<AnyFHIRResource | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'observations' | 'conditions' | 'medications' | 'reports' | 'procedures'>('overview');

  // Fetch all resources associated with this encounter
  const fetchEncounterResources = useCallback(async () => {
    if (!encounter.id) return;

    setResourcesState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const resources = await fhirClient.getEncounterResources(encounter.id);

      setResourcesState(prev => ({
        ...prev,
        observations: resources.observations.entry?.map(entry => entry.resource!).filter(Boolean) || [],
        conditions: resources.conditions.entry?.map(entry => entry.resource!).filter(Boolean) || [],
        medicationRequests: resources.medicationRequests.entry?.map(entry => entry.resource!).filter(Boolean) || [],
        diagnosticReports: resources.diagnosticReports.entry?.map(entry => entry.resource!).filter(Boolean) || [],
        procedures: resources.procedures.entry?.map(entry => entry.resource!).filter(Boolean) || [],
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load encounter resources';
      setResourcesState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [encounter.id]);

  // Load resources when component mounts or encounter changes
  useEffect(() => {
    fetchEncounterResources();
  }, [fetchEncounterResources]);

  // Handle resource selection for detailed view
  const handleResourceSelect = useCallback((resource: AnyFHIRResource) => {
    setSelectedResource(resource);
  }, []);

  // Handle resource modal close
  const handleResourceModalClose = useCallback(() => {
    setSelectedResource(null);
  }, []);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    fetchEncounterResources();
  }, [fetchEncounterResources]);

  // Format encounter date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
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
        return `${durationMinutes} minutes`;
      } else if (durationHours < 24) {
        return `${durationHours} hour${durationHours > 1 ? 's' : ''}`;
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

  // Get resource counts for tabs
  const getResourceCounts = () => ({
    observations: resourcesState.observations.length,
    conditions: resourcesState.conditions.length,
    medications: resourcesState.medicationRequests.length,
    reports: resourcesState.diagnosticReports.length,
    procedures: resourcesState.procedures.length,
  });

  const statusInfo = getStatusInfo();
  const duration = getEncounterDuration();
  const resourceCounts = getResourceCounts();
  const encounterClass = encounter.class?.display || encounter.class?.code || 'Unknown';
  const encounterType = encounter.type?.[0]?.text || encounter.type?.[0]?.coding?.[0]?.display || 'General';

  return (
    <div className="encounter-details">
      <div className="encounter-details-header">
        <div className="encounter-details-title">
          <h2>Encounter Details</h2>
          <div className="encounter-summary">
            <span className="encounter-type">{encounterType}</span>
            <span className="encounter-class">({encounterClass})</span>
            <span className={`encounter-status ${statusInfo.className}`}>
              {statusInfo.text}
            </span>
          </div>
        </div>
        {onClose && (
          <button className="close-button" onClick={onClose} aria-label="Close encounter details">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" />
            </svg>
          </button>
        )}
      </div>

      <div className="encounter-details-content">
        {/* Encounter Overview */}
        <div className="encounter-overview">
          <div className="overview-grid">
            <div className="overview-item">
              <span className="overview-label">Date & Time:</span>
              <span className="overview-value">{formatDate(encounter.period?.start)}</span>
            </div>
            {encounter.period?.end && (
              <div className="overview-item">
                <span className="overview-label">End Time:</span>
                <span className="overview-value">{formatDate(encounter.period.end)}</span>
              </div>
            )}
            {duration && (
              <div className="overview-item">
                <span className="overview-label">Duration:</span>
                <span className="overview-value">{duration}</span>
              </div>
            )}
            <div className="overview-item">
              <span className="overview-label">Encounter ID:</span>
              <span className="overview-value">{encounter.id}</span>
            </div>
          </div>
        </div>

        {/* Resource Tabs */}
        <div className="resource-tabs">
          <div className="tab-list">
            <button
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab-button ${activeTab === 'observations' ? 'active' : ''}`}
              onClick={() => setActiveTab('observations')}
            >
              Observations ({resourceCounts.observations})
            </button>
            <button
              className={`tab-button ${activeTab === 'conditions' ? 'active' : ''}`}
              onClick={() => setActiveTab('conditions')}
            >
              Conditions ({resourceCounts.conditions})
            </button>
            <button
              className={`tab-button ${activeTab === 'medications' ? 'active' : ''}`}
              onClick={() => setActiveTab('medications')}
            >
              Medications ({resourceCounts.medications})
            </button>
            <button
              className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Reports ({resourceCounts.reports})
            </button>
            <button
              className={`tab-button ${activeTab === 'procedures' ? 'active' : ''}`}
              onClick={() => setActiveTab('procedures')}
            >
              Procedures ({resourceCounts.procedures})
            </button>
          </div>

          <div className="tab-content">
            {resourcesState.loading && (
              <div className="resources-loading">
                <Loading />
                <p>Loading encounter resources...</p>
              </div>
            )}

            {resourcesState.error && (
              <div className="resources-error">
                <div className="error-message">
                  <h4>Error Loading Resources</h4>
                  <p>{resourcesState.error}</p>
                </div>
                <button className="retry-button" onClick={handleRetry}>
                  Retry
                </button>
              </div>
            )}

            {!resourcesState.loading && !resourcesState.error && (
              <>
                {activeTab === 'overview' && (
                  <div className="overview-tab">
                    <div className="resource-summary">
                      <h3>Associated Resources</h3>
                      <div className="resource-summary-grid">
                        <div className="resource-summary-item">
                          <span className="resource-count">{resourceCounts.observations}</span>
                          <span className="resource-type">Observations</span>
                        </div>
                        <div className="resource-summary-item">
                          <span className="resource-count">{resourceCounts.conditions}</span>
                          <span className="resource-type">Conditions</span>
                        </div>
                        <div className="resource-summary-item">
                          <span className="resource-count">{resourceCounts.medications}</span>
                          <span className="resource-type">Medications</span>
                        </div>
                        <div className="resource-summary-item">
                          <span className="resource-count">{resourceCounts.reports}</span>
                          <span className="resource-type">Reports</span>
                        </div>
                        <div className="resource-summary-item">
                          <span className="resource-count">{resourceCounts.procedures}</span>
                          <span className="resource-type">Procedures</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional encounter details */}
                    {encounter.reasonCode && encounter.reasonCode.length > 0 && (
                      <div className="encounter-reasons">
                        <h3>Reason for Visit</h3>
                        <div className="reason-list">
                          {encounter.reasonCode.map((reason, index) => (
                            <div key={index} className="reason-item">
                              {reason.text || reason.coding?.[0]?.display || 'Unknown reason'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {encounter.diagnosis && encounter.diagnosis.length > 0 && (
                      <div className="encounter-diagnoses">
                        <h3>Diagnoses</h3>
                        <div className="diagnosis-list">
                          {encounter.diagnosis.map((diagnosis, index) => (
                            <div key={index} className="diagnosis-item">
                              <span className="diagnosis-condition">
                                {diagnosis.condition?.display || `Condition ${diagnosis.condition?.reference || 'Unknown'}`}
                              </span>
                              {diagnosis.rank && (
                                <span className="diagnosis-rank">Rank: {diagnosis.rank}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'observations' && (
                  <div className="observations-tab">
                    {resourcesState.observations.length === 0 ? (
                      <div className="empty-resources">
                        <p>No observations recorded for this encounter.</p>
                      </div>
                    ) : (
                      <div className="resource-list">
                        {resourcesState.observations.map((observation, index) => (
                          <ResourceViewer
                            key={observation.id || `observation-${index}`}
                            resource={observation}
                            viewMode="summary"
                            onSelect={() => handleResourceSelect(observation)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'conditions' && (
                  <div className="conditions-tab">
                    {resourcesState.conditions.length === 0 ? (
                      <div className="empty-resources">
                        <p>No conditions recorded for this encounter.</p>
                      </div>
                    ) : (
                      <div className="resource-list">
                        {resourcesState.conditions.map((condition, index) => (
                          <ResourceViewer
                            key={condition.id || `condition-${index}`}
                            resource={condition}
                            viewMode="summary"
                            onSelect={() => handleResourceSelect(condition)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'medications' && (
                  <div className="medications-tab">
                    {resourcesState.medicationRequests.length === 0 ? (
                      <div className="empty-resources">
                        <p>No medication requests recorded for this encounter.</p>
                      </div>
                    ) : (
                      <div className="resource-list">
                        {resourcesState.medicationRequests.map((medication, index) => (
                          <ResourceViewer
                            key={medication.id || `medication-${index}`}
                            resource={medication}
                            viewMode="summary"
                            onSelect={() => handleResourceSelect(medication)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reports' && (
                  <div className="reports-tab">
                    {resourcesState.diagnosticReports.length === 0 ? (
                      <div className="empty-resources">
                        <p>No diagnostic reports recorded for this encounter.</p>
                      </div>
                    ) : (
                      <div className="resource-list">
                        {resourcesState.diagnosticReports.map((report, index) => (
                          <ResourceViewer
                            key={report.id || `report-${index}`}
                            resource={report}
                            viewMode="summary"
                            onSelect={() => handleResourceSelect(report)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'procedures' && (
                  <div className="procedures-tab">
                    {resourcesState.procedures.length === 0 ? (
                      <div className="empty-resources">
                        <p>No procedures recorded for this encounter.</p>
                      </div>
                    ) : (
                      <div className="resource-list">
                        {resourcesState.procedures.map((procedure, index) => (
                          <ResourceViewer
                            key={procedure.id || `procedure-${index}`}
                            resource={procedure}
                            viewMode="summary"
                            onSelect={() => handleResourceSelect(procedure)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Resource Detail Modal */}
      {selectedResource && (
        <div className="resource-modal-overlay" onClick={handleResourceModalClose}>
          <div className="resource-modal" onClick={(e) => e.stopPropagation()}>
            <div className="resource-modal-header">
              <h3>Resource Details</h3>
              <button 
                className="close-button" 
                onClick={handleResourceModalClose}
                aria-label="Close resource details"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" />
                </svg>
              </button>
            </div>
            <div className="resource-modal-content">
              <ResourceViewer
                resource={selectedResource}
                viewMode="detailed"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
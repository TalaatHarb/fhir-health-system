import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EncounterDetails } from '../../../components/encounter/EncounterDetails';
import { fhirClient } from '../../../services/fhirClient';
import type { Encounter, Bundle, Observation, Condition, MedicationRequest, DiagnosticReport, Procedure } from '../../../types/fhir';

// Mock the FHIR client
vi.mock('../../../services/fhirClient', () => ({
  fhirClient: {
    getEncounterResources: vi.fn(),
  },
}));

const mockFhirClient = fhirClient as any;

describe('EncounterDetails', () => {
  const mockEncounter: Encounter = {
    resourceType: 'Encounter',
    id: 'encounter-123',
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'Ambulatory',
    },
    type: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '185349003',
        display: 'Encounter for check up',
      }],
      text: 'Check-up',
    }],
    subject: {
      reference: 'Patient/patient-123',
      display: 'John Doe',
    },
    period: {
      start: '2024-01-15T10:00:00Z',
      end: '2024-01-15T11:00:00Z',
    },
    reasonCode: [{
      text: 'Annual physical examination',
    }],
    diagnosis: [{
      condition: {
        reference: 'Condition/condition-123',
        display: 'Hypertension',
      },
      rank: 1,
    }],
  };

  const mockObservation: Observation = {
    resourceType: 'Observation',
    id: 'obs-123',
    status: 'final',
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '8480-6',
        display: 'Systolic blood pressure',
      }],
      text: 'Systolic BP',
    },
    subject: {
      reference: 'Patient/patient-123',
    },
    encounter: {
      reference: 'Encounter/encounter-123',
    },
    valueQuantity: {
      value: 120,
      unit: 'mmHg',
      system: 'http://unitsofmeasure.org',
      code: 'mm[Hg]',
    },
    effectiveDateTime: '2024-01-15T10:30:00Z',
  };

  const mockCondition: Condition = {
    resourceType: 'Condition',
    id: 'condition-123',
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: 'active',
        display: 'Active',
      }],
    },
    verificationStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        code: 'confirmed',
        display: 'Confirmed',
      }],
    },
    code: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '38341003',
        display: 'Hypertension',
      }],
      text: 'High blood pressure',
    },
    subject: {
      reference: 'Patient/patient-123',
    },
    encounter: {
      reference: 'Encounter/encounter-123',
    },
    onsetDateTime: '2023-06-01',
  };

  const mockMedicationRequest: MedicationRequest = {
    resourceType: 'MedicationRequest',
    id: 'med-123',
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '314076',
        display: 'Lisinopril 10 MG Oral Tablet',
      }],
      text: 'Lisinopril 10mg',
    },
    subject: {
      reference: 'Patient/patient-123',
    },
    encounter: {
      reference: 'Encounter/encounter-123',
    },
    authoredOn: '2024-01-15',
  };

  const mockDiagnosticReport: DiagnosticReport = {
    resourceType: 'DiagnosticReport',
    id: 'report-123',
    status: 'final',
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '58410-2',
        display: 'Complete blood count (hemogram) panel',
      }],
      text: 'CBC',
    },
    subject: {
      reference: 'Patient/patient-123',
    },
    encounter: {
      reference: 'Encounter/encounter-123',
    },
    effectiveDateTime: '2024-01-15T10:15:00Z',
    issued: '2024-01-15T14:00:00Z',
    conclusion: 'All values within normal limits',
  };

  const mockProcedure: Procedure = {
    resourceType: 'Procedure',
    id: 'proc-123',
    status: 'completed',
    code: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '5880005',
        display: 'Physical examination procedure',
      }],
      text: 'Physical exam',
    },
    subject: {
      reference: 'Patient/patient-123',
    },
    encounter: {
      reference: 'Encounter/encounter-123',
    },
    performedDateTime: '2024-01-15T10:45:00Z',
  };

  const mockEncounterResources = {
    observations: {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{ resource: mockObservation }],
    } as Bundle<Observation>,
    conditions: {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{ resource: mockCondition }],
    } as Bundle<Condition>,
    medicationRequests: {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{ resource: mockMedicationRequest }],
    } as Bundle<MedicationRequest>,
    diagnosticReports: {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{ resource: mockDiagnosticReport }],
    } as Bundle<DiagnosticReport>,
    procedures: {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [{ resource: mockProcedure }],
    } as Bundle<Procedure>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFhirClient.getEncounterResources.mockResolvedValue(mockEncounterResources);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders encounter details header correctly', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    expect(screen.getByText('Encounter Details')).toBeInTheDocument();
    expect(screen.getByText('Check-up')).toBeInTheDocument();
    expect(screen.getByText('(Ambulatory)')).toBeInTheDocument();
    expect(screen.getByText('Finished')).toBeInTheDocument();
  });

  it('displays encounter overview information', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('January 15, 2024 at 12:00 PM')).toBeInTheDocument();
    });

    expect(screen.getByText('January 15, 2024 at 01:00 PM')).toBeInTheDocument();
    expect(screen.getByText('1 hour')).toBeInTheDocument();
    expect(screen.getByText('encounter-123')).toBeInTheDocument();
  });

  it('loads and displays resource counts in tabs', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('Observations (1)')).toBeInTheDocument();
    });

    expect(screen.getByText('Conditions (1)')).toBeInTheDocument();
    expect(screen.getByText('Medications (1)')).toBeInTheDocument();
    expect(screen.getByText('Reports (1)')).toBeInTheDocument();
    expect(screen.getByText('Procedures (1)')).toBeInTheDocument();
  });

  it('displays overview tab with resource summary', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('Associated Resources')).toBeInTheDocument();
    });

    // Check resource counts in overview
    const observationCount = screen.getAllByText('1')[0];
    expect(observationCount).toBeInTheDocument();
    expect(screen.getByText('Observations')).toBeInTheDocument();
  });

  it('displays reason for visit and diagnoses in overview', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('Reason for Visit')).toBeInTheDocument();
    });

    expect(screen.getByText('Annual physical examination')).toBeInTheDocument();
    expect(screen.getByText('Diagnoses')).toBeInTheDocument();
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
    expect(screen.getByText('Rank: 1')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('Observations (1)')).toBeInTheDocument();
    });

    // Click on observations tab
    fireEvent.click(screen.getByText('Observations (1)'));
    
    await waitFor(() => {
      expect(screen.getByText('Systolic BP')).toBeInTheDocument();
    });

    // Click on conditions tab
    fireEvent.click(screen.getByText('Conditions (1)'));
    
    await waitFor(() => {
      expect(screen.getByText('High blood pressure')).toBeInTheDocument();
    });
  });

  it('displays empty state when no resources are found', async () => {
    const emptyResources = {
      observations: { resourceType: 'Bundle', type: 'searchset', entry: [] } as Bundle<Observation>,
      conditions: { resourceType: 'Bundle', type: 'searchset', entry: [] } as Bundle<Condition>,
      medicationRequests: { resourceType: 'Bundle', type: 'searchset', entry: [] } as Bundle<MedicationRequest>,
      diagnosticReports: { resourceType: 'Bundle', type: 'searchset', entry: [] } as Bundle<DiagnosticReport>,
      procedures: { resourceType: 'Bundle', type: 'searchset', entry: [] } as Bundle<Procedure>,
    };

    mockFhirClient.getEncounterResources.mockResolvedValue(emptyResources);

    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('Observations (0)')).toBeInTheDocument();
    });

    // Click on observations tab
    fireEvent.click(screen.getByText('Observations (0)'));
    
    await waitFor(() => {
      expect(screen.getByText('No observations recorded for this encounter.')).toBeInTheDocument();
    });
  });

  it('handles resource loading error', async () => {
    const errorMessage = 'Failed to load resources';
    mockFhirClient.getEncounterResources.mockRejectedValue(new Error(errorMessage));

    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Resources')).toBeInTheDocument();
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('retries loading resources on error', async () => {
    const errorMessage = 'Network error';
    mockFhirClient.getEncounterResources
      .mockRejectedValueOnce(new Error(errorMessage))
      .mockResolvedValueOnce(mockEncounterResources);

    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Resources')).toBeInTheDocument();
    });

    // Click retry button
    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('Observations (1)')).toBeInTheDocument();
    });
  });

  it('opens resource detail modal when resource is selected', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('Observations (1)')).toBeInTheDocument();
    });

    // Click on observations tab
    fireEvent.click(screen.getByText('Observations (1)'));
    
    await waitFor(() => {
      expect(screen.getByText('Systolic BP')).toBeInTheDocument();
    });

    // Click on view details button
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    await waitFor(() => {
      expect(screen.getByText('Resource Details')).toBeInTheDocument();
    });
  });

  it('closes resource detail modal', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('Observations (1)')).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByText('Observations (1)'));
    
    await waitFor(() => {
      expect(screen.getByText('Systolic BP')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Details'));

    await waitFor(() => {
      expect(screen.getByText('Resource Details')).toBeInTheDocument();
    });

    // Close modal
    const closeButtons = screen.getAllByLabelText('Close resource details');
    fireEvent.click(closeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('Resource Details')).not.toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<EncounterDetails encounter={mockEncounter} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Close encounter details');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles encounter without period gracefully', async () => {
    const encounterWithoutPeriod: Encounter = {
      ...mockEncounter,
      period: undefined,
    };

    render(<EncounterDetails encounter={encounterWithoutPeriod} />);

    await waitFor(() => {
      expect(screen.getByText('Unknown date')).toBeInTheDocument();
    });
  });

  it('handles encounter without ID gracefully', async () => {
    const encounterWithoutId: Encounter = {
      ...mockEncounter,
      id: undefined,
    };

    mockFhirClient.getEncounterResources.mockResolvedValue({
      observations: { resourceType: 'Bundle', type: 'searchset', entry: [] } as Bundle<Observation>,
      conditions: { resourceType: 'Bundle', type: 'searchset', entry: [] } as Bundle<Condition>,
      medicationRequests: { resourceType: 'Bundle', type: 'searchset', entry: [] } as Bundle<MedicationRequest>,
      diagnosticReports: { resourceType: 'Bundle', type: 'searchset', entry: [] } as Bundle<DiagnosticReport>,
      procedures: { resourceType: 'Bundle', type: 'searchset', entry: [] } as Bundle<Procedure>,
    });

    render(<EncounterDetails encounter={encounterWithoutId} />);

    // Should not attempt to load resources without encounter ID
    expect(mockFhirClient.getEncounterResources).not.toHaveBeenCalled();
  });

  it('displays loading state while fetching resources', () => {
    // Make the promise never resolve to test loading state
    mockFhirClient.getEncounterResources.mockImplementation(() => new Promise(() => {}));

    render(<EncounterDetails encounter={mockEncounter} />);

    expect(screen.getByText('Loading encounter resources...')).toBeInTheDocument();
  });
});
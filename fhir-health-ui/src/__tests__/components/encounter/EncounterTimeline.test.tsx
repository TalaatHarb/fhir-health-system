import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EncounterTimeline } from '../../../components/encounter/EncounterTimeline';
import { fhirClient } from '../../../services/fhirClient';
import type { Patient, Encounter, Bundle } from '../../../types/fhir';

// Mock the FHIR client
vi.mock('../../../services/fhirClient', () => ({
  fhirClient: {
    getPatientEncounters: vi.fn(),
  },
}));

// Mock the Loading component
vi.mock('../../../components/common/Loading', () => ({
  Loading: () => <div data-testid="loading">Loading...</div>,
}));

describe('EncounterTimeline', () => {
  const mockPatient: Patient = {
    resourceType: 'Patient',
    id: 'patient-123',
    name: [
      {
        given: ['John'],
        family: 'Doe',
      },
    ],
    gender: 'male',
    birthDate: '1980-01-01',
  };

  const mockEncounters: Encounter[] = [
    {
      resourceType: 'Encounter',
      id: 'encounter-1',
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
        display: 'Ambulatory',
      },
      type: [
        {
          text: 'General Consultation',
        },
      ],
      subject: {
        reference: 'Patient/patient-123',
      },
      period: {
        start: '2024-01-15T10:00:00Z',
        end: '2024-01-15T11:00:00Z',
      },
      reasonCode: [
        {
          text: 'Annual checkup',
        },
      ],
    },
    {
      resourceType: 'Encounter',
      id: 'encounter-2',
      status: 'in-progress',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'IMP',
        display: 'Inpatient',
      },
      type: [
        {
          text: 'Emergency Visit',
        },
      ],
      subject: {
        reference: 'Patient/patient-123',
      },
      period: {
        start: '2024-01-20T14:30:00Z',
      },
    },
  ];

  const mockBundle: Bundle<Encounter> = {
    resourceType: 'Bundle',
    type: 'searchset',
    total: 2,
    entry: mockEncounters.map(encounter => ({
      resource: encounter,
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders timeline header with patient name', () => {
    vi.mocked(fhirClient.getPatientEncounters).mockResolvedValue(mockBundle);

    render(<EncounterTimeline patient={mockPatient} />);

    expect(screen.getByText('Encounter Timeline - John Doe')).toBeInTheDocument();
  });

  it('shows loading state while fetching encounters', () => {
    vi.mocked(fhirClient.getPatientEncounters).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<EncounterTimeline patient={mockPatient} />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Loading encounters...')).toBeInTheDocument();
  });

  it('displays encounters in chronological order (most recent first)', async () => {
    vi.mocked(fhirClient.getPatientEncounters).mockResolvedValue(mockBundle);

    render(<EncounterTimeline patient={mockPatient} />);

    await waitFor(() => {
      expect(screen.getByText('Emergency Visit')).toBeInTheDocument();
      expect(screen.getByText('General Consultation')).toBeInTheDocument();
    });

    // Check that encounters are ordered correctly (most recent first)
    const encounterElements = screen.getAllByText(/Visit|Consultation/);
    expect(encounterElements[0]).toHaveTextContent('Emergency Visit'); // 2024-01-20
    expect(encounterElements[1]).toHaveTextContent('General Consultation'); // 2024-01-15
  });

  it('shows empty state when no encounters exist', async () => {
    const emptyBundle: Bundle<Encounter> = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 0,
      entry: [],
    };

    vi.mocked(fhirClient.getPatientEncounters).mockResolvedValue(emptyBundle);

    render(<EncounterTimeline patient={mockPatient} />);

    await waitFor(() => {
      expect(screen.getByText('No Encounters Found')).toBeInTheDocument();
      expect(screen.getByText('This patient has no recorded encounters.')).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    const errorMessage = 'Failed to load encounters';
    vi.mocked(fhirClient.getPatientEncounters).mockRejectedValue(new Error(errorMessage));

    render(<EncounterTimeline patient={mockPatient} />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Encounters')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('retries loading encounters when retry button is clicked', async () => {
    const errorMessage = 'Network error';
    vi.mocked(fhirClient.getPatientEncounters)
      .mockRejectedValueOnce(new Error(errorMessage))
      .mockResolvedValueOnce(mockBundle);

    render(<EncounterTimeline patient={mockPatient} />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Error Loading Encounters')).toBeInTheDocument();
    });

    // Click retry button
    fireEvent.click(screen.getByText('Retry'));

    // Should show loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for successful load
    await waitFor(() => {
      expect(screen.getByText('Emergency Visit')).toBeInTheDocument();
    });

    expect(fhirClient.getPatientEncounters).toHaveBeenCalledTimes(2);
  });

  it('calls onEncounterSelect when encounter is selected', async () => {
    const onEncounterSelect = vi.fn();
    vi.mocked(fhirClient.getPatientEncounters).mockResolvedValue(mockBundle);

    render(
      <EncounterTimeline 
        patient={mockPatient} 
        onEncounterSelect={onEncounterSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Emergency Visit')).toBeInTheDocument();
    });

    // Expand the first encounter to show details
    const expandButtons = screen.getAllByLabelText(/Expand details/);
    fireEvent.click(expandButtons[0]);

    // Wait for details to appear and click "View Full Details"
    await waitFor(() => {
      expect(screen.getByText('View Full Details')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Full Details'));

    expect(onEncounterSelect).toHaveBeenCalledWith(mockEncounters[1]); // Emergency Visit (most recent)
  });

  it('calls onCreateEncounter when create button is clicked', async () => {
    const onCreateEncounter = vi.fn();
    vi.mocked(fhirClient.getPatientEncounters).mockResolvedValue(mockBundle);

    render(
      <EncounterTimeline 
        patient={mockPatient} 
        onCreateEncounter={onCreateEncounter}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Create New Encounter')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create New Encounter'));

    expect(onCreateEncounter).toHaveBeenCalled();
  });

  it('shows create first encounter button in empty state', async () => {
    const onCreateEncounter = vi.fn();
    const emptyBundle: Bundle<Encounter> = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 0,
      entry: [],
    };

    vi.mocked(fhirClient.getPatientEncounters).mockResolvedValue(emptyBundle);

    render(
      <EncounterTimeline 
        patient={mockPatient} 
        onCreateEncounter={onCreateEncounter}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Create First Encounter')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create First Encounter'));

    expect(onCreateEncounter).toHaveBeenCalled();
  });

  it('fetches encounters with correct parameters', async () => {
    vi.mocked(fhirClient.getPatientEncounters).mockResolvedValue(mockBundle);

    render(<EncounterTimeline patient={mockPatient} />);

    await waitFor(() => {
      expect(fhirClient.getPatientEncounters).toHaveBeenCalledWith('patient-123', {
        count: 100,
        sort: '-date',
      });
    });
  });

  it('handles patient without ID gracefully', () => {
    const patientWithoutId: Patient = {
      resourceType: 'Patient',
      name: [{ given: ['Jane'], family: 'Doe' }],
    };

    render(<EncounterTimeline patient={patientWithoutId} />);

    expect(screen.getByText('Encounter Timeline - Jane Doe')).toBeInTheDocument();
    expect(fhirClient.getPatientEncounters).not.toHaveBeenCalled();
  });

  it('disables create button while loading', () => {
    vi.mocked(fhirClient.getPatientEncounters).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const onCreateEncounter = vi.fn();

    render(
      <EncounterTimeline 
        patient={mockPatient} 
        onCreateEncounter={onCreateEncounter}
      />
    );

    const createButton = screen.getByText('Create New Encounter');
    expect(createButton).toBeDisabled();
  });

  it('refetches encounters when patient changes', async () => {
    vi.mocked(fhirClient.getPatientEncounters).mockResolvedValue(mockBundle);

    const { rerender } = render(<EncounterTimeline patient={mockPatient} />);

    await waitFor(() => {
      expect(fhirClient.getPatientEncounters).toHaveBeenCalledWith('patient-123', expect.any(Object));
    });

    const newPatient: Patient = {
      ...mockPatient,
      id: 'patient-456',
    };

    rerender(<EncounterTimeline patient={newPatient} />);

    await waitFor(() => {
      expect(fhirClient.getPatientEncounters).toHaveBeenCalledWith('patient-456', expect.any(Object));
    });

    expect(fhirClient.getPatientEncounters).toHaveBeenCalledTimes(2);
  });
});
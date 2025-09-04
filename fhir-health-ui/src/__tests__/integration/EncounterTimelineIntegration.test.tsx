import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PatientTab } from '../../components/patient/PatientTab';
import { fhirClient } from '../../services/fhirClient';
import { NotificationProvider } from '../../contexts/NotificationContext';
import type { Patient, Encounter, Bundle } from '../../types/fhir';

// Mock the FHIR client
vi.mock('../../services/fhirClient', () => ({
  fhirClient: {
    getPatientEncounters: vi.fn(),
    getEncounterResources: vi.fn(),
  },
}));

// Mock the Loading component
vi.mock('../../components/common/Loading', () => ({
  Loading: () => <div data-testid="loading">Loading...</div>,
}));

describe('Encounter Timeline Integration', () => {
  // Helper function to render components with required providers
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <NotificationProvider>
        {component}
      </NotificationProvider>
    );
  };

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
    address: [
      {
        line: ['123 Main St'],
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
      },
    ],
    telecom: [
      {
        system: 'phone',
        value: '555-1234',
      },
      {
        system: 'email',
        value: 'john.doe@example.com',
      },
    ],
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
          text: 'Annual Physical',
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
      reasonCode: [
        {
          text: 'Chest pain',
        },
      ],
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

  const mockEncounterResources = {
    observations: { resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] },
    conditions: { resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] },
    medicationRequests: { resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] },
    diagnosticReports: { resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] },
    procedures: { resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.log to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('integrates encounter timeline within patient tab', async () => {
    vi.mocked(fhirClient.getPatientEncounters).mockResolvedValue(mockBundle);

    renderWithProviders(
      <PatientTab 
        patient={mockPatient} 
        isActive={true} 
        onClose={() => {}} 
      />
    );

    // Should show patient information
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/DOB:/)).toBeInTheDocument();
    expect(screen.getByText(/1\/1\/1980/)).toBeInTheDocument();

    // Should show encounter timeline
    await waitFor(() => {
      expect(screen.getByText('Encounter Timeline - John Doe')).toBeInTheDocument();
    });

    // Should load and display encounters
    await waitFor(() => {
      expect(screen.getByText('Emergency Visit')).toBeInTheDocument();
      expect(screen.getByText('Annual Physical')).toBeInTheDocument();
    });
  });

  it('handles encounter selection within patient tab', async () => {
    vi.mocked(fhirClient.getPatientEncounters).mockResolvedValue(mockBundle);
    vi.mocked(fhirClient.getEncounterResources).mockResolvedValue(mockEncounterResources);

    renderWithProviders(
      <PatientTab 
        patient={mockPatient} 
        isActive={true} 
        onClose={() => {}} 
      />
    );

    // Wait for encounters to load
    await waitFor(() => {
      expect(screen.getByText('Emergency Visit')).toBeInTheDocument();
    });

    // Expand the first encounter
    const expandButtons = screen.getAllByLabelText(/Expand details/);
    fireEvent.click(expandButtons[0]);

    // Wait for details to appear
    await waitFor(() => {
      expect(screen.getByText('View Full Details')).toBeInTheDocument();
    });

    // Click view details button
    fireEvent.click(screen.getByText('View Full Details'));

    // Should show the encounter details modal
    await waitFor(() => {
      expect(screen.getByText('Encounter Details')).toBeInTheDocument();
    });

    // Should show the encounter details modal
    const encounterDetailsModal = document.querySelector('.encounter-details');
    expect(encounterDetailsModal).toBeInTheDocument();
    
    // Should show the modal overlay
    const modalOverlay = document.querySelector('.encounter-details-modal-overlay');
    expect(modalOverlay).toBeInTheDocument();
  });

  it('handles create encounter within patient tab', async () => {
    vi.mocked(fhirClient.getPatientEncounters).mockResolvedValue(mockBundle);

    renderWithProviders(
      <PatientTab 
        patient={mockPatient} 
        isActive={true} 
        onClose={() => {}} 
      />
    );

    // Wait for timeline to load
    await waitFor(() => {
      expect(screen.getByText('Create New Encounter')).toBeInTheDocument();
    });

    // Click create encounter button
    fireEvent.click(screen.getByText('Create New Encounter'));

    // Should open the encounter creation modal
    await waitFor(() => {
      expect(screen.getByText('Encounter Details')).toBeInTheDocument();
      expect(screen.getByText('Patient: John Doe (ID: patient-123)')).toBeInTheDocument();
    });
  });

  it('shows encounter timeline loading state in patient tab', () => {
    vi.mocked(fhirClient.getPatientEncounters).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(
      <PatientTab 
        patient={mockPatient} 
        isActive={true} 
        onClose={() => {}} 
      />
    );

    // Should show patient info immediately
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Should show loading state for encounters
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Loading encounters...')).toBeInTheDocument();
  });

  it('shows encounter timeline error state in patient tab', async () => {
    const errorMessage = 'Failed to load encounters';
    vi.mocked(fhirClient.getPatientEncounters).mockRejectedValue(new Error(errorMessage));

    renderWithProviders(
      <PatientTab 
        patient={mockPatient} 
        isActive={true} 
        onClose={() => {}} 
      />
    );

    // Should show patient info
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Should show error state for encounters
    await waitFor(() => {
      expect(screen.getByText('Error Loading Encounters')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows empty encounter state in patient tab', async () => {
    const emptyBundle: Bundle<Encounter> = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 0,
      entry: [],
    };

    vi.mocked(fhirClient.getPatientEncounters).mockResolvedValue(emptyBundle);

    renderWithProviders(
      <PatientTab 
        patient={mockPatient} 
        isActive={true} 
        onClose={() => {}} 
      />
    );

    // Should show patient info
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Should show empty state for encounters
    await waitFor(() => {
      expect(screen.getByText('No Encounters Found')).toBeInTheDocument();
      expect(screen.getByText('This patient has no recorded encounters.')).toBeInTheDocument();
      expect(screen.getByText('Create First Encounter')).toBeInTheDocument();
    });
  });

  it('handles create first encounter in empty state', async () => {
    const emptyBundle: Bundle<Encounter> = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 0,
      entry: [],
    };

    vi.mocked(fhirClient.getPatientEncounters).mockResolvedValue(emptyBundle);

    renderWithProviders(
      <PatientTab 
        patient={mockPatient} 
        isActive={true} 
        onClose={() => {}} 
      />
    );

    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByText('Create First Encounter')).toBeInTheDocument();
    });

    // Click create first encounter button
    fireEvent.click(screen.getByText('Create First Encounter'));

    // Should open the encounter creation modal
    await waitFor(() => {
      expect(screen.getByText('Encounter Details')).toBeInTheDocument();
      expect(screen.getByText('Patient: John Doe (ID: patient-123)')).toBeInTheDocument();
    });
  });

  it('displays encounter details correctly in expanded state', async () => {
    vi.mocked(fhirClient.getPatientEncounters).mockResolvedValue(mockBundle);

    renderWithProviders(
      <PatientTab 
        patient={mockPatient} 
        isActive={true} 
        onClose={() => {}} 
      />
    );

    // Wait for encounters to load
    await waitFor(() => {
      expect(screen.getByText('Emergency Visit')).toBeInTheDocument();
    });

    // Expand the first encounter (Emergency Visit)
    const expandButtons = screen.getAllByLabelText(/Expand details/);
    fireEvent.click(expandButtons[0]);

    // Wait for details to appear
    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Timing')).toBeInTheDocument();
      expect(screen.getByText('Reason for Visit')).toBeInTheDocument();
    });

    // Check specific details
    expect(screen.getByText('encounter-2')).toBeInTheDocument(); // ID
    expect(screen.getAllByText('In progress')).toHaveLength(2); // Status (header + details)
    expect(screen.getByText('Inpatient')).toBeInTheDocument(); // Class
    expect(screen.getAllByText('Emergency Visit')).toHaveLength(2); // Type (header + details)
    expect(screen.getByText('Chest pain')).toBeInTheDocument(); // Reason
  });

  it('maintains patient tab functionality with encounter timeline', async () => {
    const onClose = vi.fn();
    vi.mocked(fhirClient.getPatientEncounters).mockResolvedValue(mockBundle);

    renderWithProviders(
      <PatientTab 
        patient={mockPatient} 
        isActive={true} 
        onClose={onClose} 
      />
    );

    // Should show all patient tab sections
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();

    // Should show encounter timeline
    await waitFor(() => {
      expect(screen.getByText('Encounter Timeline - John Doe')).toBeInTheDocument();
    });

    // Close button should still work
    const closeButton = screen.getByLabelText('Close John Doe tab');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles patient tab inactive state correctly', () => {
    renderWithProviders(
      <PatientTab 
        patient={mockPatient} 
        isActive={false} 
        onClose={() => {}} 
      />
    );

    // Should render hidden div when inactive
    const hiddenDiv = document.querySelector('.patient-tab.hidden');
    expect(hiddenDiv).toBeInTheDocument();

    // Should not fetch encounters when inactive
    expect(fhirClient.getPatientEncounters).not.toHaveBeenCalled();
  });
});
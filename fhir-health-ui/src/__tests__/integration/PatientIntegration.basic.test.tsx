import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PatientProvider } from '../../contexts/PatientContext';
import { PatientSearch } from '../../components/patient/PatientSearch';
import { PatientCreateModal } from '../../components/patient/PatientCreateModal';
import { fhirClient } from '../../services/fhirClient';
import type { Patient, Bundle } from '../../types/fhir';

// Mock the FHIR client
vi.mock('../../services/fhirClient', () => ({
  fhirClient: {
    searchPatients: vi.fn(),
    createPatient: vi.fn(),
    setOrganization: vi.fn(),
  },
}));

// Mock the organization context
vi.mock('../../contexts/OrganizationContext', () => ({
  useOrganization: () => ({
    currentOrganization: { id: 'org-1', name: 'Test Hospital' },
    organizations: [],
    selectOrganization: vi.fn(),
    showOrganizationModal: vi.fn(),
    hideOrganizationModal: vi.fn(),
    loading: false,
    error: null,
  }),
}));

// Test component that includes both search and create modal
const PatientManagementTest = () => {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);

  return (
    <div>
      <PatientSearch
        onPatientSelect={(patient) => setSelectedPatient(patient)}
        onCreatePatient={() => setShowCreateModal(true)}
      />
      
      <PatientCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPatientCreated={(patient) => {
          setSelectedPatient(patient);
          setShowCreateModal(false);
        }}
      />
      
      {selectedPatient && (
        <div data-testid="selected-patient">
          Selected: {selectedPatient.name?.[0]?.given?.[0]} {selectedPatient.name?.[0]?.family}
        </div>
      )}
    </div>
  );
};

describe('Patient Integration - Basic Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render patient search interface', () => {
    render(
      <PatientProvider>
        <PatientManagementTest />
      </PatientProvider>
    );

    expect(screen.getByText('Patient Search')).toBeInTheDocument();
    expect(screen.getByText('Create New Patient')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name, family name, or identifier...')).toBeInTheDocument();
  });

  it('should handle patient search workflow', async () => {
    const mockPatients: Patient[] = [
      {
        resourceType: 'Patient',
        id: 'patient-1',
        name: [{ given: ['John'], family: 'Doe' }],
        gender: 'male',
        birthDate: '1990-01-15',
      },
    ];

    const mockBundle: Bundle<Patient> = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: mockPatients.map(patient => ({ resource: patient })),
    };

    vi.mocked(fhirClient.searchPatients).mockResolvedValue(mockBundle);

    render(
      <PatientProvider>
        <PatientManagementTest />
      </PatientProvider>
    );

    // Perform search
    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    await user.type(searchInput, 'John');

    const searchButton = screen.getByText('Search');
    await user.click(searchButton);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Search Results (1)')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Select patient
    await user.click(screen.getByText('John Doe'));

    expect(screen.getByTestId('selected-patient')).toHaveTextContent('Selected: John Doe');
  });

  it('should handle patient creation workflow', async () => {
    const mockCreatedPatient: Patient = {
      resourceType: 'Patient',
      id: 'new-patient',
      name: [{ given: ['Alice'], family: 'Johnson' }],
      gender: 'female',
      birthDate: '1992-03-10',
    };

    vi.mocked(fhirClient.createPatient).mockResolvedValue(mockCreatedPatient);

    render(
      <PatientProvider>
        <PatientManagementTest />
      </PatientProvider>
    );

    // Open create modal
    await user.click(screen.getByText('Create New Patient'));

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    // Fill form
    await user.type(screen.getByLabelText('Given Name *'), 'Alice');
    await user.type(screen.getByLabelText('Family Name *'), 'Johnson');
    await user.selectOptions(screen.getByLabelText('Gender *'), 'female');
    await user.type(screen.getByLabelText('Birth Date *'), '1992-03-10');

    // Submit form
    await user.click(screen.getByText('Create Patient'));

    // Wait for FHIR client to be called
    await waitFor(() => {
      expect(fhirClient.createPatient).toHaveBeenCalled();
    });

    // Verify modal is closed
    await waitFor(() => {
      expect(screen.queryByText('Basic Information')).not.toBeInTheDocument();
    });
  });

  it('should handle search errors', async () => {
    vi.mocked(fhirClient.searchPatients).mockRejectedValue(new Error('Network error'));

    render(
      <PatientProvider>
        <PatientManagementTest />
      </PatientProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    await user.type(searchInput, 'John');

    const searchButton = screen.getByText('Search');
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Error searching patients: Network error')).toBeInTheDocument();
    });
  });

  it('should handle empty search results', async () => {
    const emptyBundle: Bundle<Patient> = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [],
    };

    vi.mocked(fhirClient.searchPatients).mockResolvedValue(emptyBundle);

    render(
      <PatientProvider>
        <PatientManagementTest />
      </PatientProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    await user.type(searchInput, 'NonexistentPatient');

    const searchButton = screen.getByText('Search');
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('No patients found matching "NonexistentPatient"')).toBeInTheDocument();
    });
  });

  it('should handle modal close', async () => {
    render(
      <PatientProvider>
        <PatientManagementTest />
      </PatientProvider>
    );

    // Open modal
    await user.click(screen.getByText('Create New Patient'));

    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    // Close modal
    await user.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('Basic Information')).not.toBeInTheDocument();
    });
  });
});
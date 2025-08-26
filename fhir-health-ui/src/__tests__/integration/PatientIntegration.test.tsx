import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PatientProvider } from '../../contexts/PatientContext';
import { PatientSearch } from '../../components/patient/PatientSearch';
import { PatientCreateModal } from '../../components/patient/PatientCreateModal';
import { fhirClient } from '../../services/fhirClient';
import type { Patient, Bundle, Organization } from '../../types/fhir';

// Mock the FHIR client
vi.mock('../../services/fhirClient', () => ({
  fhirClient: {
    searchPatients: vi.fn(),
    createPatient: vi.fn(),
    setOrganization: vi.fn(),
  },
}));

// Mock organization context
const mockOrganization: Organization = {
  resourceType: 'Organization',
  id: 'org-1',
  name: 'Test Hospital',
  active: true,
};

const MockOrganizationProvider = ({ children }: { children: React.ReactNode }) => {
  // Mock the useOrganization hook
  React.useEffect(() => {
    // Simulate organization context providing current organization
  }, []);

  return <div data-testid="mock-org-provider">{children}</div>;
};

// Mock the organization context
vi.mock('../../contexts/OrganizationContext', () => ({
  useOrganization: () => ({
    currentOrganization: mockOrganization,
    organizations: [mockOrganization],
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

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MockOrganizationProvider>
      <PatientProvider>
        {ui}
      </PatientProvider>
    </MockOrganizationProvider>
  );
};

describe('Patient Integration Tests', () => {
  const user = userEvent.setup();

  // Mock patients for testing
  const mockPatients: Patient[] = [
    {
      resourceType: 'Patient',
      id: 'patient-1',
      name: [{ given: ['John'], family: 'Doe' }],
      gender: 'male',
      birthDate: '1990-01-15',
      identifier: [{ value: 'MRN123456' }],
    },
    {
      resourceType: 'Patient',
      id: 'patient-2',
      name: [{ given: ['Jane'], family: 'Smith' }],
      gender: 'female',
      birthDate: '1985-05-20',
      identifier: [{ value: 'MRN789012' }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should complete full patient search workflow', async () => {
    const mockBundle: Bundle<Patient> = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 2,
      entry: mockPatients.map(patient => ({ resource: patient })),
    };

    vi.mocked(fhirClient.searchPatients).mockResolvedValue(mockBundle);

    renderWithProviders(<PatientManagementTest />);

    // Verify initial state
    expect(screen.getByText('Patient Search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name, family name, or identifier...')).toBeInTheDocument();

    // Perform search
    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    await user.type(searchInput, 'John');

    const searchButton = screen.getByText('Search');
    await user.click(searchButton);

    // Wait for search results
    await waitFor(() => {
      expect(screen.getByText('Search Results (2)')).toBeInTheDocument();
    });

    // Verify search results are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('ID: MRN123456')).toBeInTheDocument();

    // Select a patient
    const patientItem = screen.getByText('John Doe');
    await user.click(patientItem);

    // Verify patient selection
    expect(screen.getByTestId('selected-patient')).toHaveTextContent('Selected: John Doe');

    // Verify FHIR client was called correctly
    expect(fhirClient.searchPatients).toHaveBeenCalledWith({
      name: 'John',
      _count: 20,
    });
  });

  it('should complete full patient creation workflow', async () => {
    const mockCreatedPatient: Patient = {
      resourceType: 'Patient',
      id: 'patient-new',
      name: [{ given: ['Alice'], family: 'Johnson' }],
      gender: 'female',
      birthDate: '1992-03-10',
    };

    vi.mocked(fhirClient.createPatient).mockResolvedValue(mockCreatedPatient);

    renderWithProviders(<PatientManagementTest />);

    // Open create modal
    const createButton = screen.getByText('Create New Patient');
    await user.click(createButton);

    // Verify modal is open
    await waitFor(() => {
      expect(screen.getByText('Create New Patient')).toBeInTheDocument();
    });

    // Fill out the form
    await user.type(screen.getByLabelText('Given Name *'), 'Alice');
    await user.type(screen.getByLabelText('Family Name *'), 'Johnson');
    await user.selectOptions(screen.getByLabelText('Gender *'), 'female');
    await user.type(screen.getByLabelText('Birth Date *'), '1992-03-10');
    await user.type(screen.getByLabelText('Email'), 'alice.johnson@example.com');
    await user.type(screen.getByLabelText('Phone'), '555-987-6543');

    // Submit the form
    const submitButton = screen.getByText('Create Patient');
    await user.click(submitButton);

    // Wait for patient creation
    await waitFor(() => {
      expect(screen.getByTestId('selected-patient')).toHaveTextContent('Selected: Alice Johnson');
    });

    // Verify FHIR client was called correctly
    expect(fhirClient.createPatient).toHaveBeenCalledWith({
      resourceType: 'Patient',
      active: true,
      name: [{ use: 'official', family: 'Johnson', given: ['Alice'] }],
      gender: 'female',
      birthDate: '1992-03-10',
      telecom: [
        { system: 'email', value: 'alice.johnson@example.com', use: 'home' },
        { system: 'phone', value: '555-987-6543', use: 'home' },
      ],
      managingOrganization: {
        reference: 'Organization/org-1',
        display: 'Test Hospital',
      },
    });

    // Verify modal is closed
    expect(screen.queryByText('Basic Information')).not.toBeInTheDocument();
  });

  it('should handle search errors gracefully', async () => {
    const errorMessage = 'Network connection failed';
    vi.mocked(fhirClient.searchPatients).mockRejectedValue(new Error(errorMessage));

    renderWithProviders(<PatientManagementTest />);

    // Perform search
    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    await user.type(searchInput, 'John');

    const searchButton = screen.getByText('Search');
    await user.click(searchButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(`Error searching patients: ${errorMessage}`)).toBeInTheDocument();
    });

    // Verify retry button is available
    expect(screen.getByText('Retry')).toBeInTheDocument();

    // Test retry functionality
    vi.mocked(fhirClient.searchPatients).mockResolvedValue({
      resourceType: 'Bundle',
      type: 'searchset',
      total: 0,
      entry: [],
    });

    const retryButton = screen.getByText('Retry');
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.queryByText(`Error searching patients: ${errorMessage}`)).not.toBeInTheDocument();
    });
  });

  it('should handle creation errors gracefully', async () => {
    const errorMessage = 'Patient creation failed';
    vi.mocked(fhirClient.createPatient).mockRejectedValue(new Error(errorMessage));

    renderWithProviders(<PatientManagementTest />);

    // Open create modal
    const createButton = screen.getByText('Create New Patient');
    await user.click(createButton);

    // Fill required fields
    await user.type(screen.getByLabelText('Given Name *'), 'Bob');
    await user.type(screen.getByLabelText('Family Name *'), 'Wilson');
    await user.selectOptions(screen.getByLabelText('Gender *'), 'male');
    await user.type(screen.getByLabelText('Birth Date *'), '1988-07-22');

    // Submit the form
    const submitButton = screen.getByText('Create Patient');
    await user.click(submitButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(`Error creating patient: ${errorMessage}`)).toBeInTheDocument();
    });

    // Verify modal is still open
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.queryByTestId('selected-patient')).not.toBeInTheDocument();
  });

  it('should handle empty search results', async () => {
    const emptyBundle: Bundle<Patient> = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 0,
      entry: [],
    };

    vi.mocked(fhirClient.searchPatients).mockResolvedValue(emptyBundle);

    renderWithProviders(<PatientManagementTest />);

    // Perform search
    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    await user.type(searchInput, 'NonexistentPatient');

    const searchButton = screen.getByText('Search');
    await user.click(searchButton);

    // Wait for no results message
    await waitFor(() => {
      expect(screen.getByText('No patients found matching "NonexistentPatient"')).toBeInTheDocument();
    });

    expect(screen.getByText('Try a different search term or create a new patient.')).toBeInTheDocument();
  });

  it('should handle debounced search input', async () => {
    vi.useFakeTimers();

    const mockBundle: Bundle<Patient> = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 1,
      entry: [{ resource: mockPatients[0] }],
    };

    vi.mocked(fhirClient.searchPatients).mockResolvedValue(mockBundle);

    renderWithProviders(<PatientManagementTest />);

    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');

    // Type quickly
    await user.type(searchInput, 'J');
    await user.type(searchInput, 'o');
    await user.type(searchInput, 'h');
    await user.type(searchInput, 'n');

    // Should not have called search yet
    expect(fhirClient.searchPatients).not.toHaveBeenCalled();

    // Fast-forward timers to trigger debounced search
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Now search should be called
    await waitFor(() => {
      expect(fhirClient.searchPatients).toHaveBeenCalledWith({
        name: 'John',
        _count: 20,
      });
    });

    vi.useRealTimers();
  });

  it('should clear search when input is emptied', async () => {
    vi.useFakeTimers();

    renderWithProviders(<PatientManagementTest />);

    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');

    // Type and then clear
    await user.type(searchInput, 'John');
    await user.clear(searchInput);

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should not call search for empty input
    expect(fhirClient.searchPatients).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should handle form validation in create modal', async () => {
    renderWithProviders(<PatientManagementTest />);

    // Open create modal
    const createButton = screen.getByText('Create New Patient');
    await user.click(createButton);

    // Try to submit without filling required fields
    const submitButton = screen.getByText('Create Patient');
    await user.click(submitButton);

    // Should show validation errors
    expect(screen.getByText('Given name is required')).toBeInTheDocument();
    expect(screen.getByText('Family name is required')).toBeInTheDocument();
    expect(screen.getByText('Gender is required')).toBeInTheDocument();
    expect(screen.getByText('Birth date is required')).toBeInTheDocument();

    // Should not call create patient
    expect(fhirClient.createPatient).not.toHaveBeenCalled();

    // Fill one field and verify error clears
    await user.type(screen.getByLabelText('Given Name *'), 'Test');
    expect(screen.queryByText('Given name is required')).not.toBeInTheDocument();
  });

  it('should handle modal close and form reset', async () => {
    renderWithProviders(<PatientManagementTest />);

    // Open create modal
    const createButton = screen.getByText('Create New Patient');
    await user.click(createButton);

    // Fill some fields
    await user.type(screen.getByLabelText('Given Name *'), 'Test');
    await user.type(screen.getByLabelText('Email'), 'test@example.com');

    // Close modal
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Verify modal is closed
    expect(screen.queryByText('Basic Information')).not.toBeInTheDocument();

    // Reopen modal
    await user.click(createButton);

    // Verify form is reset
    expect(screen.getByLabelText('Given Name *')).toHaveValue('');
    expect(screen.getByLabelText('Email')).toHaveValue('');
  });
});
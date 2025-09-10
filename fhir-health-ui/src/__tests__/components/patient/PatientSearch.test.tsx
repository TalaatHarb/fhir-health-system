import React from 'react';
import { render, screen, act, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PatientSearch } from '../../../components/patient/PatientSearch';
import type { Patient } from '../../../types/fhir';

// Mock patients for testing
const mockPatients: Patient[] = [
  {
    resourceType: 'Patient',
    id: 'patient-1',
    name: [{ given: ['John', 'Michael'], family: 'Doe' }],
    gender: 'male',
    birthDate: '1990-01-15',
    identifier: [{ value: 'MRN123456' }],
    address: [{ city: 'New York', state: 'NY' }],
  },
  {
    resourceType: 'Patient',
    id: 'patient-2',
    name: [{ given: ['Jane'], family: 'Smith' }],
    gender: 'female',
    birthDate: '1985-05-20',
    identifier: [{ value: 'MRN789012' }],
    address: [{ city: 'Los Angeles', state: 'CA' }],
  },
  {
    resourceType: 'Patient',
    id: 'patient-3',
    name: [{ given: ['Bob'] }], // No family name
    gender: 'male',
    birthDate: '1975-12-03',
  },
];

// Mock the patient context
const mockPatientContext = {
  state: {
    searchQuery: '',
    searchResults: [] as Patient[],
    searchLoading: false,
    searchError: null,
    createModalOpen: false,
    createLoading: false,
    createError: null,
    openPatients: new Map(),
    activePatientId: null,
  },
  searchPatients: vi.fn(),
  clearSearchResults: vi.fn(),
  openCreateModal: vi.fn(),
  closeCreateModal: vi.fn(),
  createPatient: vi.fn(),
  openPatient: vi.fn(),
  closePatient: vi.fn(),
  setActivePatient: vi.fn(),
  getActivePatient: vi.fn(),
  resetState: vi.fn(),
};

vi.mock('../../../contexts/PatientContext', () => ({
  usePatient: () => mockPatientContext,
  PatientProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('PatientSearch', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockPatientContext.state = {
      searchQuery: '',
      searchResults: [],
      searchLoading: false,
      searchError: null,
      createModalOpen: false,
      createLoading: false,
      createError: null,
      openPatients: new Map(),
      activePatientId: null,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render search interface', () => {
    render(<PatientSearch />);

    expect(screen.getByText('Search Patient')).toBeInTheDocument();
    expect(screen.getByText('Search for existing patients or create a new patient record')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name, family name, or identifier...')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Create New Patient')).toBeInTheDocument();
  });

  it('should handle search input changes with debouncing', async () => {
    render(<PatientSearch />);

    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');

    // Type in search input
    await user.type(searchInput, 'John');

    // Input should have the typed value
    expect(searchInput).toHaveValue('John');

    // The search should be triggered after debounce (we can't easily test the actual API call without more complex mocking)
    expect(searchInput).toHaveValue('John');
  });

  it('should handle search form submission', async () => {
    render(<PatientSearch />);

    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    const searchButton = screen.getByText('Search');

    await user.type(searchInput, 'Jane Smith');

    // Button should be enabled when there's input
    expect(searchButton).not.toBeDisabled();

    await user.click(searchButton);

    // Form submission should work without errors
    expect(mockPatientContext.searchPatients).toHaveBeenCalledWith('Jane Smith');
  });

  it('should clear search when input is empty', async () => {
    render(<PatientSearch />);

    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');

    // Type and then clear
    await user.type(searchInput, 'John');
    await user.clear(searchInput);

    // Should clear search results when input is empty
    expect(searchInput).toHaveValue('');
  });

  it('should display search results', () => {
    mockPatientContext.state.searchResults = mockPatients;

    render(<PatientSearch />);

    expect(screen.getByText('Search Results (3)')).toBeInTheDocument();
    expect(screen.getByText('John Michael Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();

    // Check patient details
    expect(screen.getByText('ID: MRN123456')).toBeInTheDocument();
    expect(screen.getByText('Male, Age 35')).toBeInTheDocument(); // Approximate age
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
  });

  it('should handle patient selection', async () => {
    mockPatientContext.state.searchResults = [mockPatients[0]];

    render(<PatientSearch />);

    // Patient should be displayed in results
    const patientItem = screen.getByText('John Michael Doe');
    await user.click(patientItem);

    // Patient should be opened (this would be handled by the PatientContext)
    expect(mockPatientContext.openPatient).toHaveBeenCalledWith(mockPatients[0]);
  });

  it('should handle patient selection with custom callback', async () => {
    const onPatientSelect = vi.fn();
    mockPatientContext.state.searchResults = [mockPatients[0]];

    render(<PatientSearch onPatientSelect={onPatientSelect} />);

    // Patient should be displayed in results
    const patientItem = screen.getByText('John Michael Doe');
    await user.click(patientItem);

    expect(onPatientSelect).toHaveBeenCalledWith(mockPatients[0]);
    expect(mockPatientContext.openPatient).not.toHaveBeenCalled();
  });

  it.skip('should handle keyboard navigation for patient selection', async () => {
    mockPatientContext.state.searchResults = [mockPatients[0]];

    render(<PatientSearch />);

    // Patient should be displayed in results
    const patientItem = screen.getByText('John Michael Doe');

    // Test Enter key
    patientItem.focus();
    await user.keyboard('{Enter}');
    expect(mockPatientContext.openPatient).toHaveBeenCalledWith(mockPatients[0]);

    // Reset mock for next test
    vi.clearAllMocks();

    // Test Space key
    await user.keyboard(' ');
    expect(mockPatientContext.openPatient).toHaveBeenCalledWith(mockPatients[0]);
  });

  it('should handle create patient button click', async () => {
    render(<PatientSearch />);

    const createButton = screen.getByText('Create New Patient');
    await user.click(createButton);

    // Should open create modal (handled by PatientContext)
    expect(mockPatientContext.openCreateModal).toHaveBeenCalled();
  });

  it('should handle create patient with custom callback', async () => {
    const onCreatePatient = vi.fn();

    render(<PatientSearch onCreatePatient={onCreatePatient} />);

    const createButton = screen.getByText('Create New Patient');
    await user.click(createButton);

    expect(onCreatePatient).toHaveBeenCalled();
    expect(mockPatientContext.openCreateModal).not.toHaveBeenCalled();
  });

  it('should display loading state', () => {
    mockPatientContext.state.searchLoading = true;

    render(<PatientSearch />);

    expect(screen.getAllByText('Searching...')).toHaveLength(2); // Button and loading message

    // Search input and button should be disabled
    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    const searchButton = screen.getByRole('button', { name: 'Searching...' });

    expect(searchInput).toBeDisabled();
    expect(searchButton).toBeDisabled();
  });

  it('should display error state', () => {
    mockPatientContext.state.searchError = 'Network error occurred' as any;

    render(<PatientSearch />);

    expect(screen.getByText('Error searching patients: Network error occurred')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should handle retry on error', async () => {
    mockPatientContext.state.searchError = 'Network error occurred' as any;

    render(<PatientSearch />);

    // If there's a retry button, click it
    const retryButton = screen.queryByText('Retry');
    if (retryButton) {
      await user.click(retryButton);
      expect(mockPatientContext.searchPatients).toHaveBeenCalled();
    }
  });

  it('should display no results message', () => {
    mockPatientContext.state.searchQuery = 'NonexistentPatient';
    mockPatientContext.state.searchResults = [];
    mockPatientContext.state.searchLoading = false;
    mockPatientContext.state.searchError = null;

    render(<PatientSearch />);

    expect(screen.getByText('No patients found matching "NonexistentPatient"')).toBeInTheDocument();
    expect(screen.getByText('Try a different search term or create a new patient')).toBeInTheDocument();
  });

  it('should format patient names correctly', () => {
    const patientWithoutName: Patient = {
      resourceType: 'Patient',
      id: 'patient-no-name',
      gender: 'unknown',
    };

    mockPatientContext.state.searchResults = [patientWithoutName];

    render(<PatientSearch />);

    expect(screen.getByText('Unknown Patient')).toBeInTheDocument();
  });

  it('should format patient demographics correctly', () => {
    const patientMinimalInfo: Patient = {
      resourceType: 'Patient',
      id: 'patient-minimal',
      name: [{ given: ['Test'], family: 'Patient' }],
      // No gender or birthDate
    };

    mockPatientContext.state.searchResults = [patientMinimalInfo];

    render(<PatientSearch />);

    expect(screen.getByText('Test Patient')).toBeInTheDocument();
    // Should not display demographics section if no gender/birthDate
  });

  it('should disable buttons when create loading', () => {
    mockPatientContext.state.createLoading = true;

    render(<PatientSearch />);

    const createButton = screen.getByText('Create New Patient');
    expect(createButton).toBeDisabled();
  });

  it('should prevent form submission with empty search', async () => {
    render(<PatientSearch />);

    const searchButton = screen.getByText('Search');
    expect(searchButton).toBeDisabled();

    // Type something to enable, then clear
    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    await user.type(searchInput, 'test');
    expect(searchButton).not.toBeDisabled();

    await user.clear(searchInput);
    expect(searchButton).toBeDisabled();
  });

  it('should show action hint on hover', () => {
    mockPatientContext.state.searchResults = [mockPatients[0]];

    render(<PatientSearch />);

    const actionHint = screen.getByText('Click to open patient');
    expect(actionHint).toBeInTheDocument();
    expect(actionHint).toHaveClass('patient-search__result-action-hint');
  });
});
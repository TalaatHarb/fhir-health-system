import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PatientSearch } from '../../../components/patient/PatientSearch';
import type { Patient } from '../../../types/fhir';

// Mock the patient context
const mockPatientContext = {
  state: {
    searchQuery: '',
    searchResults: [] as Patient[],
    searchLoading: false,
    searchError: null as string | null,
    createModalOpen: false,
    createLoading: false,
    createError: null as string | null,
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

vi.mock('../../../contexts/PatientContext', async () => {
  const actual = await vi.importActual('../../../contexts/PatientContext');
  return {
    ...actual,
    usePatient: () => mockPatientContext,
  };
});

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

describe('PatientSearch', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockPatientContext.state = {
      searchQuery: '',
      searchResults: [] as Patient[],
      searchLoading: false,
      searchError: null as string | null,
      createModalOpen: false,
      createLoading: false,
      createError: null as string | null,
      openPatients: new Map(),
      activePatientId: null,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render search interface', () => {
    render(<PatientSearch />);

    expect(screen.getByText('Patient Search')).toBeInTheDocument();
    expect(screen.getByText('Search for existing patients or create a new patient record.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name, family name, or identifier...')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Create New Patient')).toBeInTheDocument();
  });

  it('should handle search input changes with debouncing', async () => {
    vi.useFakeTimers();
    render(<PatientSearch />);

    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');

    // Type in search input
    await user.type(searchInput, 'John');

    // Should not call search immediately
    expect(mockPatientContext.searchPatients).not.toHaveBeenCalled();

    // Fast-forward timers to trigger debounced search
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockPatientContext.searchPatients).toHaveBeenCalledWith('John');

    vi.useRealTimers();
  });

  it('should handle search form submission', async () => {
    render(<PatientSearch />);

    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    const searchButton = screen.getByText('Search');

    await user.type(searchInput, 'Jane Smith');
    await user.click(searchButton);

    expect(mockPatientContext.searchPatients).toHaveBeenCalledWith('Jane Smith');
  });

  it('should clear search when input is empty', async () => {
    vi.useFakeTimers();
    render(<PatientSearch />);

    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');

    // Type and then clear
    await user.type(searchInput, 'John');
    await user.clear(searchInput);

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockPatientContext.clearSearchResults).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should display search results', () => {
    mockPatientContext.state.searchResults = mockPatients;
    mockPatientContext.state.searchQuery = 'test';

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

    const patientItem = screen.getByText('John Michael Doe');
    await user.click(patientItem);

    expect(mockPatientContext.openPatient).toHaveBeenCalledWith(mockPatients[0]);
  });

  it('should handle patient selection with custom callback', async () => {
    const onPatientSelect = vi.fn();
    mockPatientContext.state.searchResults = [mockPatients[0]];

    render(<PatientSearch onPatientSelect={onPatientSelect} />);

    const patientItem = screen.getByText('John Michael Doe');
    await user.click(patientItem);

    expect(onPatientSelect).toHaveBeenCalledWith(mockPatients[0]);
    expect(mockPatientContext.openPatient).not.toHaveBeenCalled();
  });

  it('should handle keyboard navigation for patient selection', async () => {
    mockPatientContext.state.searchResults = [mockPatients[0]];

    render(<PatientSearch />);

    const patientItem = screen.getByText('John Michael Doe');
    
    // Test Enter key
    patientItem.focus();
    await user.keyboard('{Enter}');
    expect(mockPatientContext.openPatient).toHaveBeenCalledWith(mockPatients[0]);

    vi.clearAllMocks();

    // Test Space key
    await user.keyboard(' ');
    expect(mockPatientContext.openPatient).toHaveBeenCalledWith(mockPatients[0]);
  });

  it('should handle create patient button click', async () => {
    render(<PatientSearch />);

    const createButton = screen.getByText('Create New Patient');
    await user.click(createButton);

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

    expect(screen.getByText('Searching patients...')).toBeInTheDocument();
    expect(screen.getByText('Searching...')).toBeInTheDocument();

    // Search input and button should be disabled
    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    const searchButton = screen.getByText('Searching...');
    
    expect(searchInput).toBeDisabled();
    expect(searchButton).toBeDisabled();
  });

  it('should display error state', () => {
    mockPatientContext.state.searchError = 'Network error occurred';

    render(<PatientSearch />);

    expect(screen.getByText('Error searching patients: Network error occurred')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should handle retry on error', async () => {
    mockPatientContext.state.searchError = 'Network error occurred';
    mockPatientContext.state.searchQuery = 'John';

    render(<PatientSearch />);

    const retryButton = screen.getByText('Retry');
    await user.click(retryButton);

    expect(mockPatientContext.searchPatients).toHaveBeenCalledWith('John');
  });

  it('should display no results message', () => {
    mockPatientContext.state.searchQuery = 'NonexistentPatient';
    mockPatientContext.state.searchResults = [];
    mockPatientContext.state.searchLoading = false;
    mockPatientContext.state.searchError = null;

    render(<PatientSearch />);

    expect(screen.getByText('No patients found matching "NonexistentPatient"')).toBeInTheDocument();
    expect(screen.getByText('Try a different search term or create a new patient.')).toBeInTheDocument();
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
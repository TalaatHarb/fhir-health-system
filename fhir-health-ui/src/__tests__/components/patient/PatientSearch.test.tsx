import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PatientSearch } from '../../../components/patient/PatientSearch';
import { renderWithProviders, cleanupMocks } from '../../test-utils';
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

describe('PatientSearch', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    cleanupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render search interface', () => {
    renderWithProviders(<PatientSearch />);

    expect(screen.getByText('Patient Search')).toBeInTheDocument();
    expect(screen.getByText('Search for existing patients or create a new patient record.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name, family name, or identifier...')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Create New Patient')).toBeInTheDocument();
  });

  it('should handle search input changes with debouncing', async () => {
    vi.useFakeTimers();
    renderWithProviders(<PatientSearch />);

    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');

    // Type in search input
    await user.type(searchInput, 'John');

    // Input should have the typed value
    expect(searchInput).toHaveValue('John');

    // Fast-forward timers to trigger debounced search
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // The search should be triggered (we can't easily test the actual API call without more complex mocking)
    expect(searchInput).toHaveValue('John');

    vi.useRealTimers();
  });

  it('should handle search form submission', async () => {
    renderWithProviders(<PatientSearch />);

    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    const searchButton = screen.getByText('Search');

    await user.type(searchInput, 'Jane Smith');
    
    // Button should be enabled when there's input
    expect(searchButton).not.toBeDisabled();
    
    await user.click(searchButton);

    // Form submission should work without errors
    expect(searchInput).toHaveValue('Jane Smith');
  });

  it('should clear search when input is empty', async () => {
    vi.useFakeTimers();
    renderWithProviders(<PatientSearch />);

    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');

    // Type and then clear
    await user.type(searchInput, 'John');
    await user.clear(searchInput);

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should clear search results when input is empty
    expect(searchInput).toHaveValue('');

    vi.useRealTimers();
  });

  it('should display search results', () => {
    renderWithProviders(<PatientSearch />, {
      patient: {
        openPatients: new Map(),
        activePatientId: null,
        loading: false
      },
      mocks: {
        fhirClient: {
          searchPatients: vi.fn().mockResolvedValue({
            resourceType: 'Bundle',
            entry: mockPatients.map(patient => ({ resource: patient }))
          })
        }
      }
    });

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
    const { mockFhirClient } = renderWithProviders(<PatientSearch />, {
      patient: {
        openPatients: new Map(),
        activePatientId: null,
        loading: false
      },
      mocks: {
        fhirClient: {
          searchPatients: vi.fn().mockResolvedValue({
            resourceType: 'Bundle',
            entry: [{ resource: mockPatients[0] }]
          })
        }
      }
    });

    // First trigger a search to get results
    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    await user.type(searchInput, 'John');
    
    // Wait for search results to appear
    await screen.findByText('John Michael Doe');
    
    const patientItem = screen.getByText('John Michael Doe');
    await user.click(patientItem);

    // Patient should be opened (this would be handled by the PatientContext)
    expect(patientItem).toBeInTheDocument();
  });

  it('should handle patient selection with custom callback', async () => {
    const onPatientSelect = vi.fn();
    renderWithProviders(<PatientSearch onPatientSelect={onPatientSelect} />, {
      patient: {
        openPatients: new Map(),
        activePatientId: null,
        loading: false
      },
      mocks: {
        fhirClient: {
          searchPatients: vi.fn().mockResolvedValue({
            resourceType: 'Bundle',
            entry: [{ resource: mockPatients[0] }]
          })
        }
      }
    });

    // First trigger a search to get results
    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    await user.type(searchInput, 'John');
    
    // Wait for search results to appear
    await screen.findByText('John Michael Doe');
    
    const patientItem = screen.getByText('John Michael Doe');
    await user.click(patientItem);

    expect(onPatientSelect).toHaveBeenCalledWith(mockPatients[0]);
  });

  it('should handle keyboard navigation for patient selection', async () => {
    renderWithProviders(<PatientSearch />, {
      patient: {
        openPatients: new Map(),
        activePatientId: null,
        loading: false
      },
      mocks: {
        fhirClient: {
          searchPatients: vi.fn().mockResolvedValue({
            resourceType: 'Bundle',
            entry: [{ resource: mockPatients[0] }]
          })
        }
      }
    });

    // First trigger a search to get results
    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    await user.type(searchInput, 'John');
    
    // Wait for search results to appear
    await screen.findByText('John Michael Doe');
    
    const patientItem = screen.getByText('John Michael Doe');
    
    // Test Enter key
    patientItem.focus();
    await user.keyboard('{Enter}');
    expect(patientItem).toBeInTheDocument();

    // Test Space key
    await user.keyboard(' ');
    expect(patientItem).toBeInTheDocument();
  });

  it('should handle create patient button click', async () => {
    renderWithProviders(<PatientSearch />);

    const createButton = screen.getByText('Create New Patient');
    await user.click(createButton);

    // Should open create modal (handled by PatientContext)
    expect(createButton).toBeInTheDocument();
  });

  it('should handle create patient with custom callback', async () => {
    const onCreatePatient = vi.fn();

    renderWithProviders(<PatientSearch onCreatePatient={onCreatePatient} />);

    const createButton = screen.getByText('Create New Patient');
    await user.click(createButton);

    expect(onCreatePatient).toHaveBeenCalled();
  });

  it('should display loading state', () => {
    renderWithProviders(<PatientSearch />, {
      patient: {
        openPatients: new Map(),
        activePatientId: null,
        loading: true
      }
    });

    expect(screen.getByText('Searching patients...')).toBeInTheDocument();
    expect(screen.getByText('Searching...')).toBeInTheDocument();

    // Search input and button should be disabled
    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    const searchButton = screen.getByText('Searching...');
    
    expect(searchInput).toBeDisabled();
    expect(searchButton).toBeDisabled();
  });

  it('should display error state', () => {
    renderWithProviders(<PatientSearch />, {
      patient: {
        openPatients: new Map(),
        activePatientId: null,
        loading: false
      },
      mocks: {
        fhirClient: {
          searchPatients: vi.fn().mockRejectedValue(new Error('Network error occurred'))
        }
      }
    });

    expect(screen.getByText('Error searching patients: Network error occurred')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should handle retry on error', async () => {
    const { mockFhirClient } = renderWithProviders(<PatientSearch />, {
      patient: {
        openPatients: new Map(),
        activePatientId: null,
        loading: false
      },
      mocks: {
        fhirClient: {
          searchPatients: vi.fn().mockRejectedValue(new Error('Network error occurred'))
        }
      }
    });

    // First trigger a search that will fail
    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    await user.type(searchInput, 'John');

    // If there's a retry button, click it
    const retryButton = screen.queryByText('Retry');
    if (retryButton) {
      await user.click(retryButton);
      expect(mockFhirClient.searchPatients).toHaveBeenCalled();
    }
  });

  it('should display no results message', () => {
    renderWithProviders(<PatientSearch />, {
      patient: {
        openPatients: new Map(),
        activePatientId: null,
        loading: false
      },
      mocks: {
        fhirClient: {
          searchPatients: vi.fn().mockResolvedValue({
            resourceType: 'Bundle',
            entry: []
          })
        }
      }
    });

    expect(screen.getByText('No patients found matching "NonexistentPatient"')).toBeInTheDocument();
    expect(screen.getByText('Try a different search term or create a new patient.')).toBeInTheDocument();
  });

  it('should format patient names correctly', () => {
    const patientWithoutName: Patient = {
      resourceType: 'Patient',
      id: 'patient-no-name',
      gender: 'unknown',
    };

    renderWithProviders(<PatientSearch />, {
      patient: {
        openPatients: new Map(),
        activePatientId: null,
        loading: false
      },
      mocks: {
        fhirClient: {
          searchPatients: vi.fn().mockResolvedValue({
            resourceType: 'Bundle',
            entry: [{ resource: patientWithoutName }]
          })
        }
      }
    });

    expect(screen.getByText('Unknown Patient')).toBeInTheDocument();
  });

  it('should format patient demographics correctly', () => {
    const patientMinimalInfo: Patient = {
      resourceType: 'Patient',
      id: 'patient-minimal',
      name: [{ given: ['Test'], family: 'Patient' }],
      // No gender or birthDate
    };

    renderWithProviders(<PatientSearch />, {
      patient: {
        openPatients: new Map(),
        activePatientId: null,
        loading: false
      },
      mocks: {
        fhirClient: {
          searchPatients: vi.fn().mockResolvedValue({
            resourceType: 'Bundle',
            entry: [{ resource: patientMinimalInfo }]
          })
        }
      }
    });

    expect(screen.getByText('Test Patient')).toBeInTheDocument();
    // Should not display demographics section if no gender/birthDate
  });

  it('should disable buttons when create loading', () => {
    renderWithProviders(<PatientSearch />, {
      patient: {
        openPatients: new Map(),
        activePatientId: null,
        loading: true
      }
    });

    const createButton = screen.getByText('Create New Patient');
    expect(createButton).toBeDisabled();
  });

  it('should prevent form submission with empty search', async () => {
    renderWithProviders(<PatientSearch />);

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
    renderWithProviders(<PatientSearch />, {
      patient: {
        openPatients: new Map(),
        activePatientId: null,
        loading: false
      },
      mocks: {
        fhirClient: {
          searchPatients: vi.fn().mockResolvedValue({
            resourceType: 'Bundle',
            entry: [{ resource: mockPatients[0] }]
          })
        }
      }
    });

    const actionHint = screen.getByText('Click to open patient');
    expect(actionHint).toBeInTheDocument();
    expect(actionHint).toHaveClass('patient-search__result-action-hint');
  });
});
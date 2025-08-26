import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PatientProvider, usePatient } from '../../contexts/PatientContext';
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

// Mock the useOrganization hook
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

// Test component that uses the patient context
const TestComponent = () => {
  const {
    state,
    searchPatients,
    clearSearchResults,
    openCreateModal,
    closeCreateModal,
    createPatient,
    openPatient,
    closePatient,
    setActivePatient,
    getActivePatient,
    resetState,
  } = usePatient();

  return (
    <div>
      <div data-testid="search-query">{state.searchQuery}</div>
      <div data-testid="search-loading">{state.searchLoading.toString()}</div>
      <div data-testid="search-error">{state.searchError || 'none'}</div>
      <div data-testid="search-results-count">{state.searchResults.length}</div>
      <div data-testid="create-modal-open">{state.createModalOpen.toString()}</div>
      <div data-testid="create-loading">{state.createLoading.toString()}</div>
      <div data-testid="create-error">{state.createError || 'none'}</div>
      <div data-testid="open-patients-count">{state.openPatients.size}</div>
      <div data-testid="active-patient-id">{state.activePatientId || 'none'}</div>
      
      <button onClick={() => searchPatients('John Doe')}>Search Patients</button>
      <button onClick={clearSearchResults}>Clear Search</button>
      <button onClick={openCreateModal}>Open Create Modal</button>
      <button onClick={closeCreateModal}>Close Create Modal</button>
      <button onClick={() => createPatient({
        name: [{ given: ['John'], family: 'Doe' }],
        gender: 'male',
        birthDate: '1990-01-01',
      })}>Create Patient</button>
      <button onClick={() => openPatient({
        resourceType: 'Patient',
        id: 'patient-1',
        name: [{ given: ['Jane'], family: 'Smith' }],
      })}>Open Patient</button>
      <button onClick={() => closePatient('patient-1')}>Close Patient</button>
      <button onClick={() => setActivePatient('patient-1')}>Set Active Patient</button>
      <button onClick={resetState}>Reset State</button>
      
      <div data-testid="active-patient-name">
        {getActivePatient()?.name?.[0]?.given?.[0] || 'none'}
      </div>
    </div>
  );
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <PatientProvider>
      {ui}
    </PatientProvider>
  );
};

describe('PatientContext', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should provide initial state', () => {
    renderWithProviders(<TestComponent />);

    expect(screen.getByTestId('search-query')).toHaveTextContent('');
    expect(screen.getByTestId('search-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('search-error')).toHaveTextContent('none');
    expect(screen.getByTestId('search-results-count')).toHaveTextContent('0');
    expect(screen.getByTestId('create-modal-open')).toHaveTextContent('false');
    expect(screen.getByTestId('create-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('create-error')).toHaveTextContent('none');
    expect(screen.getByTestId('open-patients-count')).toHaveTextContent('0');
    expect(screen.getByTestId('active-patient-id')).toHaveTextContent('none');
  });

  it('should handle patient search successfully', async () => {
    const mockPatients: Patient[] = [
      {
        resourceType: 'Patient',
        id: 'patient-1',
        name: [{ given: ['John'], family: 'Doe' }],
        gender: 'male',
        birthDate: '1990-01-01',
      },
      {
        resourceType: 'Patient',
        id: 'patient-2',
        name: [{ given: ['Jane'], family: 'Smith' }],
        gender: 'female',
        birthDate: '1985-05-15',
      },
    ];

    const mockBundle: Bundle<Patient> = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 2,
      entry: mockPatients.map(patient => ({ resource: patient })),
    };

    vi.mocked(fhirClient.searchPatients).mockResolvedValue(mockBundle);

    renderWithProviders(<TestComponent />);

    await user.click(screen.getByText('Search Patients'));

    // Should show loading state initially
    expect(screen.getByTestId('search-loading')).toHaveTextContent('true');

    await waitFor(() => {
      expect(screen.getByTestId('search-loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('search-query')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('search-results-count')).toHaveTextContent('2');
    expect(screen.getByTestId('search-error')).toHaveTextContent('none');

    expect(fhirClient.searchPatients).toHaveBeenCalledWith({
      name: 'John Doe',
      _count: 20,
    });
  });

  it('should handle patient search error', async () => {
    const errorMessage = 'Search failed';
    vi.mocked(fhirClient.searchPatients).mockRejectedValue(new Error(errorMessage));

    renderWithProviders(<TestComponent />);

    await user.click(screen.getByText('Search Patients'));

    await waitFor(() => {
      expect(screen.getByTestId('search-loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('search-error')).toHaveTextContent(errorMessage);
    expect(screen.getByTestId('search-results-count')).toHaveTextContent('0');
  });

  it('should clear search results', async () => {
    renderWithProviders(<TestComponent />);

    // First perform a search
    const mockBundle: Bundle<Patient> = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 1,
      entry: [{ resource: {
        resourceType: 'Patient',
        id: 'patient-1',
        name: [{ given: ['John'], family: 'Doe' }],
      }}],
    };

    vi.mocked(fhirClient.searchPatients).mockResolvedValue(mockBundle);

    await user.click(screen.getByText('Search Patients'));

    await waitFor(() => {
      expect(screen.getByTestId('search-results-count')).toHaveTextContent('1');
    });

    // Then clear results
    await user.click(screen.getByText('Clear Search'));

    expect(screen.getByTestId('search-query')).toHaveTextContent('');
    expect(screen.getByTestId('search-results-count')).toHaveTextContent('0');
    expect(screen.getByTestId('search-error')).toHaveTextContent('none');
  });

  it('should handle create modal state', async () => {
    renderWithProviders(<TestComponent />);

    // Open modal
    await user.click(screen.getByText('Open Create Modal'));
    expect(screen.getByTestId('create-modal-open')).toHaveTextContent('true');

    // Close modal
    await user.click(screen.getByText('Close Create Modal'));
    expect(screen.getByTestId('create-modal-open')).toHaveTextContent('false');
  });

  it('should handle patient creation successfully', async () => {
    const mockCreatedPatient: Patient = {
      resourceType: 'Patient',
      id: 'patient-new',
      name: [{ given: ['John'], family: 'Doe' }],
      gender: 'male',
      birthDate: '1990-01-01',
    };

    vi.mocked(fhirClient.createPatient).mockResolvedValue(mockCreatedPatient);

    renderWithProviders(<TestComponent />);

    await user.click(screen.getByText('Create Patient'));

    // Should show loading state initially
    expect(screen.getByTestId('create-loading')).toHaveTextContent('true');

    await waitFor(() => {
      expect(screen.getByTestId('create-loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('create-modal-open')).toHaveTextContent('false');
    expect(screen.getByTestId('create-error')).toHaveTextContent('none');
    expect(screen.getByTestId('open-patients-count')).toHaveTextContent('1');
    expect(screen.getByTestId('active-patient-id')).toHaveTextContent('patient-new');

    expect(fhirClient.createPatient).toHaveBeenCalledWith({
      resourceType: 'Patient',
      name: [{ given: ['John'], family: 'Doe' }],
      gender: 'male',
      birthDate: '1990-01-01',
    });
  });

  it('should handle patient creation error', async () => {
    const errorMessage = 'Creation failed';
    vi.mocked(fhirClient.createPatient).mockRejectedValue(new Error(errorMessage));

    renderWithProviders(<TestComponent />);

    await user.click(screen.getByText('Create Patient'));

    await waitFor(() => {
      expect(screen.getByTestId('create-loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('create-error')).toHaveTextContent(errorMessage);
    expect(screen.getByTestId('create-modal-open')).toHaveTextContent('true');
    expect(screen.getByTestId('open-patients-count')).toHaveTextContent('0');
  });

  it('should handle multi-patient tab management', async () => {
    renderWithProviders(<TestComponent />);

    // Open a patient
    await user.click(screen.getByText('Open Patient'));

    expect(screen.getByTestId('open-patients-count')).toHaveTextContent('1');
    expect(screen.getByTestId('active-patient-id')).toHaveTextContent('patient-1');
    expect(screen.getByTestId('active-patient-name')).toHaveTextContent('Jane');

    // Set different active patient
    await user.click(screen.getByText('Set Active Patient'));
    expect(screen.getByTestId('active-patient-id')).toHaveTextContent('patient-1');

    // Close patient
    await user.click(screen.getByText('Close Patient'));
    expect(screen.getByTestId('open-patients-count')).toHaveTextContent('0');
    expect(screen.getByTestId('active-patient-id')).toHaveTextContent('none');
    expect(screen.getByTestId('active-patient-name')).toHaveTextContent('none');
  });

  it('should reset state', async () => {
    renderWithProviders(<TestComponent />);

    // First set some state
    await user.click(screen.getByText('Open Create Modal'));
    await user.click(screen.getByText('Open Patient'));

    expect(screen.getByTestId('create-modal-open')).toHaveTextContent('true');
    expect(screen.getByTestId('open-patients-count')).toHaveTextContent('1');

    // Reset state
    await user.click(screen.getByText('Reset State'));

    expect(screen.getByTestId('search-query')).toHaveTextContent('');
    expect(screen.getByTestId('search-results-count')).toHaveTextContent('0');
    expect(screen.getByTestId('create-modal-open')).toHaveTextContent('false');
    expect(screen.getByTestId('open-patients-count')).toHaveTextContent('0');
    expect(screen.getByTestId('active-patient-id')).toHaveTextContent('none');
  });

  it('should handle empty search query', async () => {
    renderWithProviders(<TestComponent />);

    // Mock searchPatients to be called with empty string
    const TestComponentWithEmptySearch = () => {
      const { searchPatients } = usePatient();
      return (
        <button onClick={() => searchPatients('')}>Search Empty</button>
      );
    };

    render(
      <PatientProvider>
        <TestComponentWithEmptySearch />
      </PatientProvider>
    );

    await user.click(screen.getByText('Search Empty'));

    // Should not call the FHIR client for empty search
    expect(fhirClient.searchPatients).not.toHaveBeenCalled();
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('usePatient must be used within a PatientProvider');

    consoleSpy.mockRestore();
  });
});
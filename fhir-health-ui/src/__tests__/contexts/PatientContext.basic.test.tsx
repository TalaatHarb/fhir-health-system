import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PatientProvider, usePatient } from '../../contexts/PatientContext';
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

// Test component
const TestComponent = () => {
  const {
    state,
    searchPatients,
    clearSearchResults,
    openCreateModal,
    createPatient,
    openPatient,
  } = usePatient();

  return (
    <div>
      <div data-testid="search-results-count">{state.searchResults.length}</div>
      <div data-testid="search-error">{state.searchError || 'none'}</div>
      <div data-testid="create-modal-open">{state.createModalOpen.toString()}</div>
      <div data-testid="open-patients-count">{state.openPatients.size}</div>
      
      <button onClick={() => searchPatients('John')}>Search</button>
      <button onClick={clearSearchResults}>Clear</button>
      <button onClick={openCreateModal}>Open Modal</button>
      <button onClick={() => createPatient({
        name: [{ given: ['Test'], family: 'Patient' }],
        gender: 'male',
        birthDate: '1990-01-01',
      })}>Create Patient</button>
      <button onClick={() => openPatient({
        resourceType: 'Patient',
        id: 'test-id',
        name: [{ given: ['Test'], family: 'Patient' }],
      })}>Open Patient</button>
    </div>
  );
};

describe('PatientContext - Basic Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial state', () => {
    render(
      <PatientProvider>
        <TestComponent />
      </PatientProvider>
    );

    expect(screen.getByTestId('search-results-count')).toHaveTextContent('0');
    expect(screen.getByTestId('search-error')).toHaveTextContent('none');
    expect(screen.getByTestId('create-modal-open')).toHaveTextContent('false');
    expect(screen.getByTestId('open-patients-count')).toHaveTextContent('0');
  });

  it('should handle successful patient search', async () => {
    const mockPatients: Patient[] = [
      {
        resourceType: 'Patient',
        id: 'patient-1',
        name: [{ given: ['John'], family: 'Doe' }],
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
        <TestComponent />
      </PatientProvider>
    );

    await user.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByTestId('search-results-count')).toHaveTextContent('1');
    });

    expect(fhirClient.searchPatients).toHaveBeenCalledWith({
      name: 'John',
      _count: 20,
    });
  });

  it('should handle search error', async () => {
    const errorMessage = 'Search failed';
    vi.mocked(fhirClient.searchPatients).mockRejectedValue(new Error(errorMessage));

    render(
      <PatientProvider>
        <TestComponent />
      </PatientProvider>
    );

    await user.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByTestId('search-error')).toHaveTextContent(errorMessage);
    });
  });

  it('should clear search results', async () => {
    render(
      <PatientProvider>
        <TestComponent />
      </PatientProvider>
    );

    await user.click(screen.getByText('Clear'));

    expect(screen.getByTestId('search-results-count')).toHaveTextContent('0');
    expect(screen.getByTestId('search-error')).toHaveTextContent('none');
  });

  it('should handle create modal', async () => {
    render(
      <PatientProvider>
        <TestComponent />
      </PatientProvider>
    );

    await user.click(screen.getByText('Open Modal'));

    expect(screen.getByTestId('create-modal-open')).toHaveTextContent('true');
  });

  it('should handle patient creation', async () => {
    const mockCreatedPatient: Patient = {
      resourceType: 'Patient',
      id: 'new-patient',
      name: [{ given: ['Test'], family: 'Patient' }],
    };

    vi.mocked(fhirClient.createPatient).mockResolvedValue(mockCreatedPatient);

    render(
      <PatientProvider>
        <TestComponent />
      </PatientProvider>
    );

    await user.click(screen.getByText('Create Patient'));

    await waitFor(() => {
      expect(screen.getByTestId('open-patients-count')).toHaveTextContent('1');
    });

    expect(fhirClient.createPatient).toHaveBeenCalled();
  });

  it('should handle opening patient', async () => {
    render(
      <PatientProvider>
        <TestComponent />
      </PatientProvider>
    );

    await user.click(screen.getByText('Open Patient'));

    expect(screen.getByTestId('open-patients-count')).toHaveTextContent('1');
  });
});
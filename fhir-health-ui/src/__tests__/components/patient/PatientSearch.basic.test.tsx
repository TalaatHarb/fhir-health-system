import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PatientSearch } from '../../../components/patient/PatientSearch';
import type { Patient } from '../../../types/fhir';

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
}));

describe('PatientSearch - Basic Tests', () => {
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

  it('should render search interface', () => {
    render(<PatientSearch />);

    expect(screen.getByText('Patient Search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name, family name, or identifier...')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Create New Patient')).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    render(<PatientSearch />);

    const searchInput = screen.getByPlaceholderText('Search by name, family name, or identifier...');
    const searchButton = screen.getByText('Search');

    await user.type(searchInput, 'John Doe');
    await user.click(searchButton);

    expect(mockPatientContext.searchPatients).toHaveBeenCalledWith('John Doe');
  });

  it('should display search results', () => {
    const mockPatients: Patient[] = [
      {
        resourceType: 'Patient',
        id: 'patient-1',
        name: [{ given: ['John'], family: 'Doe' }],
        gender: 'male',
        birthDate: '1990-01-15',
      },
    ];

    mockPatientContext.state.searchResults = mockPatients;

    render(<PatientSearch />);

    expect(screen.getByText('Search Results (1)')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should handle patient selection', async () => {
    const mockPatient: Patient = {
      resourceType: 'Patient',
      id: 'patient-1',
      name: [{ given: ['John'], family: 'Doe' }],
    };

    mockPatientContext.state.searchResults = [mockPatient];

    render(<PatientSearch />);

    const patientItem = screen.getByText('John Doe');
    await user.click(patientItem);

    expect(mockPatientContext.openPatient).toHaveBeenCalledWith(mockPatient);
  });

  it('should handle create patient button', async () => {
    render(<PatientSearch />);

    const createButton = screen.getByText('Create New Patient');
    await user.click(createButton);

    expect(mockPatientContext.openCreateModal).toHaveBeenCalled();
  });

  it('should display loading state', () => {
    mockPatientContext.state.searchLoading = true;

    render(<PatientSearch />);

    expect(screen.getByText('Searching patients...')).toBeInTheDocument();
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    mockPatientContext.state.searchError = 'Network error' as any;

    render(<PatientSearch />);

    expect(screen.getByText('Error searching patients: Network error')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should display no results message', () => {
    mockPatientContext.state.searchQuery = 'NonexistentPatient';
    mockPatientContext.state.searchResults = [];
    mockPatientContext.state.searchLoading = false;
    mockPatientContext.state.searchError = null;

    render(<PatientSearch />);

    expect(screen.getByText('No patients found matching "NonexistentPatient"')).toBeInTheDocument();
  });

  it('should format patient names correctly', () => {
    const patientWithoutName: Patient = {
      resourceType: 'Patient',
      id: 'patient-no-name',
    };

    mockPatientContext.state.searchResults = [patientWithoutName];

    render(<PatientSearch />);

    expect(screen.getByText('Unknown Patient')).toBeInTheDocument();
  });

  it('should handle custom callbacks', async () => {
    const onPatientSelect = vi.fn();
    const onCreatePatient = vi.fn();

    render(
      <PatientSearch
        onPatientSelect={onPatientSelect}
        onCreatePatient={onCreatePatient}
      />
    );

    // Test create callback
    await user.click(screen.getByText('Create New Patient'));
    expect(onCreatePatient).toHaveBeenCalled();
    expect(mockPatientContext.openCreateModal).not.toHaveBeenCalled();

    // Test patient select callback
    const mockPatient: Patient = {
      resourceType: 'Patient',
      id: 'patient-1',
      name: [{ given: ['John'], family: 'Doe' }],
    };

    mockPatientContext.state.searchResults = [mockPatient];
    render(
      <PatientSearch
        onPatientSelect={onPatientSelect}
        onCreatePatient={onCreatePatient}
      />
    );

    await user.click(screen.getByText('John Doe'));
    expect(onPatientSelect).toHaveBeenCalledWith(mockPatient);
    expect(mockPatientContext.openPatient).not.toHaveBeenCalled();
  });
});
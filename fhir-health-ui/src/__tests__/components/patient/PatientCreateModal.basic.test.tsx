import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PatientCreateModal } from '../../../components/patient/PatientCreateModal';
import { renderWithProviders } from '../../test-utils';

// Mock the patient context
const mockPatientContext = {
  state: {
    searchQuery: '',
    searchResults: [],
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

describe('PatientCreateModal - Basic Tests', () => {
  const user = userEvent.setup();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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

  it('should not render when closed', () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Create New Patient')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Create New Patient')).toBeInTheDocument();
    expect(screen.getByLabelText('Given Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Family Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Gender *')).toBeInTheDocument();
    expect(screen.getByLabelText('Birth Date *')).toBeInTheDocument();
  });

  it('should handle form input changes', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const givenNameInput = screen.getByLabelText('Given Name *');
    const familyNameInput = screen.getByLabelText('Family Name *');

    await user.type(givenNameInput, 'John');
    await user.type(familyNameInput, 'Doe');

    expect(givenNameInput).toHaveValue('John');
    expect(familyNameInput).toHaveValue('Doe');
  });

  it('should not submit with empty required fields', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const submitButton = screen.getByText('Create Patient');
    await user.click(submitButton);

    // Should not call createPatient when validation fails
    expect(mockPatientContext.createPatient).not.toHaveBeenCalled();
  });

  it('should submit valid form', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Fill required fields
    await user.type(screen.getByLabelText('Given Name *'), 'John');
    await user.type(screen.getByLabelText('Family Name *'), 'Doe');
    await user.selectOptions(screen.getByLabelText('Gender *'), 'male');
    await user.type(screen.getByLabelText('Birth Date *'), '1990-01-15');

    const submitButton = screen.getByText('Create Patient');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPatientContext.createPatient).toHaveBeenCalledWith({
        active: true,
        name: [{ use: 'official', family: 'Doe', given: ['John'] }],
        gender: 'male',
        birthDate: '1990-01-15',
      });
    });
  });

  it('should handle close button', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close modal');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle cancel button', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle email input', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should display loading state', () => {
    mockPatientContext.state.createLoading = true;

    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(screen.getByLabelText('Given Name *')).toBeDisabled();
  });

  it.skip('should display error state', () => {
    mockPatientContext.state.createError = 'Creation failed' as any;

    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Error creating patient: Creation failed')).toBeInTheDocument();
  });

  it('should include optional fields in submission', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Fill required fields
    await user.type(screen.getByLabelText('Given Name *'), 'Jane');
    await user.type(screen.getByLabelText('Family Name *'), 'Smith');
    await user.selectOptions(screen.getByLabelText('Gender *'), 'female');
    await user.type(screen.getByLabelText('Birth Date *'), '1985-05-20');

    // Fill optional fields
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Phone'), '555-123-4567');
    await user.type(screen.getByLabelText('City'), 'New York');

    const submitButton = screen.getByText('Create Patient');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPatientContext.createPatient).toHaveBeenCalledWith({
        active: true,
        name: [{ use: 'official', family: 'Smith', given: ['Jane'] }],
        gender: 'female',
        birthDate: '1985-05-20',
        telecom: [
          { system: 'email', value: 'jane@example.com', use: 'home' },
          { system: 'phone', value: '555-123-4567', use: 'home' },
        ],
        address: [{
          use: 'home',
          type: 'both',
          city: 'New York',
          country: 'US',
        }],
      });
    });
  });
});
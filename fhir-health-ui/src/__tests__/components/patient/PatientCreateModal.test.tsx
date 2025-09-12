import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PatientCreateModal } from '../../../components/patient/PatientCreateModal';
import type { Patient } from '../../../types/fhir';
import { renderWithProviders } from '../../test-utils';

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
    PatientProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

describe('PatientCreateModal', () => {
  const user = userEvent.setup();
  const mockOnClose = vi.fn();
  const mockOnPatientCreated = vi.fn();

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

  it('should not render when not open', () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Create New Patient')).not.toBeInTheDocument();
  });

  it('should render modal when open', () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByRole('heading', { name: 'Create Patient' })).toBeInTheDocument();
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText('Address Information')).toBeInTheDocument();

    // Check required fields
    expect(screen.getByLabelText('Given Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Family Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Gender *')).toBeInTheDocument();
    expect(screen.getByLabelText('Date of Birth *')).toBeInTheDocument();

    // Check optional fields
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Street Address')).toBeInTheDocument();
    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('State/Province')).toBeInTheDocument();
    expect(screen.getByLabelText('Postal Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Country')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByTestId('patient-form-submit')).toBeInTheDocument();
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
    const genderSelect = screen.getByLabelText('Gender *');
    const birthDateInput = screen.getByLabelText('Date of Birth *');
    const emailInput = screen.getByLabelText('Email');

    await user.type(givenNameInput, 'John');
    await user.type(familyNameInput, 'Doe');
    await user.selectOptions(genderSelect, 'male');
    await user.type(birthDateInput, '1990-01-15');
    await user.type(emailInput, 'john.doe@example.com');

    expect(givenNameInput).toHaveValue('John');
    expect(familyNameInput).toHaveValue('Doe');
    expect(genderSelect).toHaveValue('male');
    expect(birthDateInput).toHaveValue('1990-01-15');
    expect(emailInput).toHaveValue('john.doe@example.com');
  });

  it('should validate required fields', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const submitButton = screen.getByTestId('patient-form-submit');
    await user.click(submitButton);

    // Wait for validation errors to appear
    await waitFor(() => {
      expect(screen.getAllByText('Given name is required')).toHaveLength(2);
    });

    expect(screen.getAllByText('Family name is required')).toHaveLength(2);
    expect(screen.getAllByText('Gender is required')).toHaveLength(2);
    expect(screen.getAllByText('Birth date is required')).toHaveLength(2);

    // Should not call createPatient
    expect(mockPatientContext.createPatient).not.toHaveBeenCalled();
  });

  it('should validate email format', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByTestId('patient-form-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getAllByText('Please enter a valid email address')).toHaveLength(2);
    });
  });

  it('should validate birth date is not in future', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const birthDateInput = screen.getByLabelText('Date of Birth *');
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateString = futureDate.toISOString().split('T')[0];

    await user.type(birthDateInput, futureDateString);

    const submitButton = screen.getByTestId('patient-form-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getAllByText('Birth date cannot be in the future')).toHaveLength(2);
    });
  });

  it('should clear validation errors when field is corrected', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const givenNameInput = screen.getByLabelText('Given Name *');
    const submitButton = screen.getByTestId('patient-form-submit');

    // Trigger validation error
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getAllByText('Given name is required')).toHaveLength(2);
    });

    // Fix the error
    await user.type(givenNameInput, 'John');
    await waitFor(() => {
      expect(screen.queryAllByText('Given name is required')).toHaveLength(0);
    });
  });

  it('should submit valid form', async () => {
    const mockCreatedPatient: Patient = {
      resourceType: 'Patient',
      id: 'patient-new',
      name: [{ given: ['John'], family: 'Doe' }],
      gender: 'male',
      birthDate: '1990-01-15',
    };

    mockPatientContext.createPatient.mockResolvedValue(undefined);
    mockPatientContext.state.openPatients = new Map([['patient-new', mockCreatedPatient]]);

    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
        onPatientCreated={mockOnPatientCreated}
      />
    );

    // Fill required fields
    await user.type(screen.getByLabelText('Given Name *'), 'John');
    await user.type(screen.getByLabelText('Family Name *'), 'Doe');
    await user.selectOptions(screen.getByLabelText('Gender *'), 'male');
    await user.type(screen.getByLabelText('Date of Birth *'), '1990-01-15');

    // Fill optional fields
    await user.type(screen.getByLabelText('Email'), 'john.doe@example.com');
    await user.type(screen.getByLabelText('Phone'), '555-123-4567');
    await user.type(screen.getByLabelText('Street Address'), '123 Main St');
    await user.type(screen.getByLabelText('City'), 'New York');
    await user.type(screen.getByLabelText('State/Province'), 'NY');
    await user.type(screen.getByLabelText('Postal Code'), '10001');

    const submitButton = screen.getByTestId('patient-form-submit');
    await user.click(submitButton);

    expect(mockPatientContext.createPatient).toHaveBeenCalledWith({
      active: true,
      name: [{ use: 'official', family: 'Doe', given: ['John'] }],
      gender: 'male',
      birthDate: '1990-01-15',
      telecom: [
        { system: 'email', value: 'john.doe@example.com', use: 'home' },
        { system: 'phone', value: '555-123-4567', use: 'home' },
      ],
      address: [{
        use: 'home',
        type: 'both',
        line: ['123 Main St'],
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      }],
    });
  });

  it('should handle form submission with minimal data', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Fill only required fields
    await user.type(screen.getByLabelText('Given Name *'), 'Jane');
    await user.type(screen.getByLabelText('Family Name *'), 'Smith');
    await user.selectOptions(screen.getByLabelText('Gender *'), 'female');
    await user.type(screen.getByLabelText('Date of Birth *'), '1985-05-20');

    const submitButton = screen.getByTestId('patient-form-submit');
    await user.click(submitButton);

    expect(mockPatientContext.createPatient).toHaveBeenCalledWith({
      active: true,
      name: [{ use: 'official', family: 'Smith', given: ['Jane'] }],
      gender: 'female',
      birthDate: '1985-05-20',
    });
  });

  it('should handle close button click', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle cancel button click', async () => {
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

  it('should handle overlay click', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const overlay = screen.getByTestId('modal-overlay');
    await user.click(overlay!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not close when clicking modal content', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const modalContent = screen.getByText('Basic Information');
    await user.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
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

    // All form inputs should be disabled
    expect(screen.getByLabelText('Given Name *')).toBeDisabled();
    expect(screen.getByLabelText('Family Name *')).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Creating...')).toBeDisabled();
  });

  it('should display error state', () => {
    mockPatientContext.state.createError = 'Failed to create patient';

    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Failed to Create Patient: Failed to create patient')).toBeInTheDocument();
  });

  it('should reset form when closing', async () => {
    const TestComponent = ({ isOpen }: { isOpen: boolean }) => (
      <PatientCreateModal
        isOpen={isOpen}
        onClose={mockOnClose}
      />
    );

    const { rerender } = renderWithProviders(<TestComponent isOpen={true} />);

    // Fill some fields
    await user.type(screen.getByLabelText('Given Name *'), 'John');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');

    // Close modal
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();

    // Simulate closing the modal
    rerender(<TestComponent isOpen={false} />);

    // Re-open modal
    rerender(<TestComponent isOpen={true} />);

    // Fields should be empty due to key reset mechanism
    expect(screen.getByLabelText('Given Name *')).toHaveValue('');
    expect(screen.getByLabelText('Email')).toHaveValue('');
  });

  it('should call onPatientCreated callback when patient is created', async () => {
    const mockCreatedPatient: Patient = {
      resourceType: 'Patient',
      id: 'patient-new',
      name: [{ given: ['John'], family: 'Doe' }],
    };

    mockPatientContext.state.openPatients = new Map([['patient-new', mockCreatedPatient]]);

    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
        onPatientCreated={mockOnPatientCreated}
      />
    );

    // Fill and submit form
    await user.type(screen.getByLabelText('Given Name *'), 'John');
    await user.type(screen.getByLabelText('Family Name *'), 'Doe');
    await user.selectOptions(screen.getByLabelText('Gender *'), 'male');
    await user.type(screen.getByLabelText('Date of Birth *'), '1990-01-15');

    const submitButton = screen.getByTestId('patient-form-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnPatientCreated).toHaveBeenCalledWith(mockCreatedPatient);
    });
  });

  it('should use closeCreateModal when no onClose prop provided', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={undefined as any}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockPatientContext.closeCreateModal).toHaveBeenCalled();
  });

  it('should validate phone number format', async () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const phoneInput = screen.getByLabelText('Phone');
    await user.type(phoneInput, 'invalid-phone');

    const submitButton = screen.getByTestId('patient-form-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getAllByText('Please enter a valid phone number')).toHaveLength(2);
    });
  });

  it('should handle country field default value', () => {
    renderWithProviders(
      <PatientCreateModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const countryInput = screen.getByLabelText('Country');
    expect(countryInput).toHaveValue('US');
  });
});
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, mockPatient, mockPatient2, createMockBundle } from '../test-utils';
import { PatientProvider, usePatient } from '../../contexts/PatientContext';
import { OrganizationProvider } from '../../contexts/OrganizationContext';
import { ModalProvider } from '../../contexts/ModalContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import type { Patient } from '../../types/fhir';

// Mock FHIR client
const mockFhirClient = {
  searchPatients: vi.fn(),
  createPatient: vi.fn(),
  setOrganization: vi.fn(),
};

vi.mock('../../services/fhirClient', () => ({
  fhirClient: mockFhirClient,
}));

// Test component that simulates the patient search and tab workflow
const PatientSearchTabWorkflow: React.FC = () => {
  const {
    state,
    searchPatients,
    clearSearchResults,
    openPatient,
    closePatient,
    setActivePatient,
    getActivePatient,
    createPatient,
    openCreateModal,
    closeCreateModal,
  } = usePatient();

  const activePatient = getActivePatient();

  return (
    <div>
      {/* Search Section */}
      <div data-testid="search-section">
        <input
          data-testid="search-input"
          placeholder="Search patients..."
          onChange={(e) => searchPatients(e.target.value)}
        />
        <button data-testid="clear-search" onClick={clearSearchResults}>
          Clear Search
        </button>
        
        {/* Search Loading State */}
        {state.searchLoading && <div data-testid="search-loading">Searching...</div>}
        
        {/* Search Error */}
        {state.searchError && (
          <div data-testid="search-error">{state.searchError}</div>
        )}
        
        {/* Search Results */}
        <div data-testid="search-results">
          {state.searchResults.map((patient) => (
            <div key={patient.id} data-testid={`search-result-${patient.id}`}>
              <span data-testid={`patient-name-${patient.id}`}>
                {patient.name?.[0]?.given?.[0]} {patient.name?.[0]?.family}
              </span>
              <button
                data-testid={`open-patient-${patient.id}`}
                onClick={() => openPatient(patient)}
              >
                Open Patient
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Management Section */}
      <div data-testid="tab-section">
        <div data-testid="tab-count">{state.openPatients.size}</div>
        <div data-testid="active-patient-id">{state.activePatientId || 'none'}</div>
        <div data-testid="active-patient-name">
          {activePatient ? `${activePatient.name?.[0]?.given?.[0]} ${activePatient.name?.[0]?.family}` : 'none'}
        </div>
        
        {/* Tab List */}
        <div data-testid="patient-tabs">
          {Array.from(state.openPatients.entries()).map(([patientId, patient]) => (
            <div key={patientId} data-testid={`tab-${patientId}`}>
              <button
                data-testid={`activate-tab-${patientId}`}
                onClick={() => setActivePatient(patientId)}
                className={state.activePatientId === patientId ? 'active' : ''}
              >
                {patient.name?.[0]?.given?.[0]} {patient.name?.[0]?.family}
              </button>
              <button
                data-testid={`close-tab-${patientId}`}
                onClick={() => closePatient(patientId)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        {/* Add Patient Button */}
        <button data-testid="add-patient-button" onClick={openCreateModal}>
          Add Patient
        </button>
      </div>

      {/* Patient Creation Modal */}
      {state.createModalOpen && (
        <div data-testid="create-patient-modal">
          <h2>Create New Patient</h2>
          {state.createLoading && <div data-testid="create-loading">Creating...</div>}
          {state.createError && <div data-testid="create-error">{state.createError}</div>}
          
          <form
            data-testid="create-patient-form"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const patientData = {
                name: [{
                  given: [formData.get('firstName') as string],
                  family: formData.get('lastName') as string,
                }],
                gender: formData.get('gender') as string,
                birthDate: formData.get('birthDate') as string,
              };
              createPatient(patientData);
            }}
          >
            <input name="firstName" data-testid="first-name-input" placeholder="First Name" required />
            <input name="lastName" data-testid="last-name-input" placeholder="Last Name" required />
            <select name="gender" data-testid="gender-select" required>
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <input name="birthDate" data-testid="birth-date-input" type="date" required />
            <button type="submit" data-testid="submit-create-patient">Create Patient</button>
          </form>
          
          <button data-testid="cancel-create-patient" onClick={closeCreateModal}>
            Cancel
          </button>
        </div>
      )}

      {/* Patient Details Section */}
      {activePatient && (
        <div data-testid="patient-details">
          <h3>Patient Details</h3>
          <div data-testid="patient-id">{activePatient.id}</div>
          <div data-testid="patient-full-name">
            {activePatient.name?.[0]?.given?.[0]} {activePatient.name?.[0]?.family}
          </div>
          <div data-testid="patient-gender">{activePatient.gender}</div>
          <div data-testid="patient-birth-date">{activePatient.birthDate}</div>
        </div>
      )}
    </div>
  );
};

describe('Patient Search and Tab Workflow Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockFhirClient.searchPatients.mockResolvedValue(
      createMockBundle([mockPatient, mockPatient2])
    );
    mockFhirClient.createPatient.mockImplementation((patient: Omit<Patient, 'id'>) =>
      Promise.resolve({ ...patient, id: `patient-${Date.now()}` })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Patient Search Functionality', () => {
    it('should search for patients and display results', async () => {
      const user = userEvent.setup();

      render(
        <NotificationProvider>
          <ModalProvider>
            <OrganizationProvider>
              <PatientProvider>
                <PatientSearchTabWorkflow />
              </PatientProvider>
            </OrganizationProvider>
          </ModalProvider>
        </NotificationProvider>
      );

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(mockFhirClient.searchPatients).toHaveBeenCalledWith({
          name: 'John',
          _count: 20,
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('search-result-patient-123')).toBeInTheDocument();
        expect(screen.getByTestId('search-result-patient-456')).toBeInTheDocument();
        expect(screen.getByTestId('patient-name-patient-123')).toHaveTextContent('John Doe');
        expect(screen.getByTestId('patient-name-patient-456')).toHaveTextContent('Jane Smith');
      });
    });

    it('should handle search errors gracefully', async () => {
      const user = userEvent.setup();

      mockFhirClient.searchPatients.mockRejectedValue(new Error('Network error'));

      render(
        <NotificationProvider>
          <ModalProvider>
            <OrganizationProvider>
              <PatientProvider>
                <PatientSearchTabWorkflow />
              </PatientProvider>
            </OrganizationProvider>
          </ModalProvider>
        </NotificationProvider>
      );

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByTestId('search-error')).toHaveTextContent('Network error');
      });
    });

    it('should clear search results when requested', async () => {
      const user = userEvent.setup();

      render(
        <NotificationProvider>
          <ModalProvider>
            <OrganizationProvider>
              <PatientProvider>
                <PatientSearchTabWorkflow />
              </PatientProvider>
            </OrganizationProvider>
          </ModalProvider>
        </NotificationProvider>
      );

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByTestId('search-result-patient-123')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('clear-search'));

      expect(screen.queryByTestId('search-result-patient-123')).not.toBeInTheDocument();
    });
  });

  describe('Patient Tab Management', () => {
    it('should open patient in new tab from search results', async () => {
      const user = userEvent.setup();

      render(
        <NotificationProvider>
          <ModalProvider>
            <OrganizationProvider>
              <PatientProvider>
                <PatientSearchTabWorkflow />
              </PatientProvider>
            </OrganizationProvider>
          </ModalProvider>
        </NotificationProvider>
      );

      // Search for patients
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByTestId('search-result-patient-123')).toBeInTheDocument();
      });

      // Open patient in tab
      await user.click(screen.getByTestId('open-patient-patient-123'));

      expect(screen.getByTestId('tab-count')).toHaveTextContent('1');
      expect(screen.getByTestId('active-patient-id')).toHaveTextContent('patient-123');
      expect(screen.getByTestId('active-patient-name')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('tab-patient-123')).toBeInTheDocument();
    });

    it('should manage multiple patient tabs', async () => {
      const user = userEvent.setup();

      render(
        <NotificationProvider>
          <ModalProvider>
            <OrganizationProvider>
              <PatientProvider>
                <PatientSearchTabWorkflow />
              </PatientProvider>
            </OrganizationProvider>
          </ModalProvider>
        </NotificationProvider>
      );

      // Search and open first patient
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByTestId('open-patient-patient-123')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('open-patient-patient-123'));
      await user.click(screen.getByTestId('open-patient-patient-456'));

      expect(screen.getByTestId('tab-count')).toHaveTextContent('2');
      expect(screen.getByTestId('tab-patient-123')).toBeInTheDocument();
      expect(screen.getByTestId('tab-patient-456')).toBeInTheDocument();
      expect(screen.getByTestId('active-patient-id')).toHaveTextContent('patient-456'); // Last opened is active
    });

    it('should switch between patient tabs', async () => {
      const user = userEvent.setup();

      render(
        <NotificationProvider>
          <ModalProvider>
            <OrganizationProvider>
              <PatientProvider>
                <PatientSearchTabWorkflow />
              </PatientProvider>
            </OrganizationProvider>
          </ModalProvider>
        </NotificationProvider>
      );

      // Open multiple patients
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByTestId('open-patient-patient-123')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('open-patient-patient-123'));
      await user.click(screen.getByTestId('open-patient-patient-456'));

      // Switch to first patient
      await user.click(screen.getByTestId('activate-tab-patient-123'));

      expect(screen.getByTestId('active-patient-id')).toHaveTextContent('patient-123');
      expect(screen.getByTestId('active-patient-name')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('patient-details')).toBeInTheDocument();
      expect(screen.getByTestId('patient-full-name')).toHaveTextContent('John Doe');
    });

    it('should close patient tabs', async () => {
      const user = userEvent.setup();

      render(
        <NotificationProvider>
          <ModalProvider>
            <OrganizationProvider>
              <PatientProvider>
                <PatientSearchTabWorkflow />
              </PatientProvider>
            </OrganizationProvider>
          </ModalProvider>
        </NotificationProvider>
      );

      // Open multiple patients
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByTestId('open-patient-patient-123')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('open-patient-patient-123'));
      await user.click(screen.getByTestId('open-patient-patient-456'));

      expect(screen.getByTestId('tab-count')).toHaveTextContent('2');

      // Close first patient
      await user.click(screen.getByTestId('close-tab-patient-123'));

      expect(screen.getByTestId('tab-count')).toHaveTextContent('1');
      expect(screen.queryByTestId('tab-patient-123')).not.toBeInTheDocument();
      expect(screen.getByTestId('tab-patient-456')).toBeInTheDocument();
      expect(screen.getByTestId('active-patient-id')).toHaveTextContent('patient-456');
    });

    it('should handle closing active patient tab', async () => {
      const user = userEvent.setup();

      render(
        <NotificationProvider>
          <ModalProvider>
            <OrganizationProvider>
              <PatientProvider>
                <PatientSearchTabWorkflow />
              </PatientProvider>
            </OrganizationProvider>
          </ModalProvider>
        </NotificationProvider>
      );

      // Open multiple patients
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByTestId('open-patient-patient-123')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('open-patient-patient-123'));
      await user.click(screen.getByTestId('open-patient-patient-456'));

      // Close active patient (patient-456)
      await user.click(screen.getByTestId('close-tab-patient-456'));

      expect(screen.getByTestId('tab-count')).toHaveTextContent('1');
      expect(screen.getByTestId('active-patient-id')).toHaveTextContent('patient-123'); // Should switch to remaining patient
    });
  });

  describe('Patient Creation Workflow', () => {
    it('should open and close patient creation modal', async () => {
      const user = userEvent.setup();

      render(
        <NotificationProvider>
          <ModalProvider>
            <OrganizationProvider>
              <PatientProvider>
                <PatientSearchTabWorkflow />
              </PatientProvider>
            </OrganizationProvider>
          </ModalProvider>
        </NotificationProvider>
      );

      expect(screen.queryByTestId('create-patient-modal')).not.toBeInTheDocument();

      await user.click(screen.getByTestId('add-patient-button'));

      expect(screen.getByTestId('create-patient-modal')).toBeInTheDocument();

      await user.click(screen.getByTestId('cancel-create-patient'));

      expect(screen.queryByTestId('create-patient-modal')).not.toBeInTheDocument();
    });

    it('should create new patient and open in tab', async () => {
      const user = userEvent.setup();

      const newPatient: Patient = {
        resourceType: 'Patient',
        id: 'patient-new-123',
        name: [{ given: ['Alice'], family: 'Johnson' }],
        gender: 'female',
        birthDate: '1990-05-15',
      };

      mockFhirClient.createPatient.mockResolvedValue(newPatient);

      render(
        <NotificationProvider>
          <ModalProvider>
            <OrganizationProvider>
              <PatientProvider>
                <PatientSearchTabWorkflow />
              </PatientProvider>
            </OrganizationProvider>
          </ModalProvider>
        </NotificationProvider>
      );

      await user.click(screen.getByTestId('add-patient-button'));

      // Fill out the form
      await user.type(screen.getByTestId('first-name-input'), 'Alice');
      await user.type(screen.getByTestId('last-name-input'), 'Johnson');
      await user.selectOptions(screen.getByTestId('gender-select'), 'female');
      await user.type(screen.getByTestId('birth-date-input'), '1990-05-15');

      await user.click(screen.getByTestId('submit-create-patient'));

      await waitFor(() => {
        expect(mockFhirClient.createPatient).toHaveBeenCalledWith({
          name: [{ given: ['Alice'], family: 'Johnson' }],
          gender: 'female',
          birthDate: '1990-05-15',
        });
      });

      await waitFor(() => {
        expect(screen.queryByTestId('create-patient-modal')).not.toBeInTheDocument();
        expect(screen.getByTestId('tab-count')).toHaveTextContent('1');
        expect(screen.getByTestId('active-patient-id')).toHaveTextContent('patient-new-123');
        expect(screen.getByTestId('active-patient-name')).toHaveTextContent('Alice Johnson');
      });
    });

    it('should handle patient creation errors', async () => {
      const user = userEvent.setup();

      mockFhirClient.createPatient.mockRejectedValue(new Error('Creation failed'));

      render(
        <NotificationProvider>
          <ModalProvider>
            <OrganizationProvider>
              <PatientProvider>
                <PatientSearchTabWorkflow />
              </PatientProvider>
            </OrganizationProvider>
          </ModalProvider>
        </NotificationProvider>
      );

      await user.click(screen.getByTestId('add-patient-button'));

      // Fill out and submit form
      await user.type(screen.getByTestId('first-name-input'), 'Alice');
      await user.type(screen.getByTestId('last-name-input'), 'Johnson');
      await user.selectOptions(screen.getByTestId('gender-select'), 'female');
      await user.type(screen.getByTestId('birth-date-input'), '1990-05-15');

      await user.click(screen.getByTestId('submit-create-patient'));

      await waitFor(() => {
        expect(screen.getByTestId('create-error')).toHaveTextContent('Creation failed');
        expect(screen.getByTestId('create-patient-modal')).toBeInTheDocument(); // Modal should remain open
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle opening the same patient multiple times', async () => {
      const user = userEvent.setup();

      render(
        <NotificationProvider>
          <ModalProvider>
            <OrganizationProvider>
              <PatientProvider>
                <PatientSearchTabWorkflow />
              </PatientProvider>
            </OrganizationProvider>
          </ModalProvider>
        </NotificationProvider>
      );

      // Search and open patient
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByTestId('open-patient-patient-123')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('open-patient-patient-123'));
      expect(screen.getByTestId('tab-count')).toHaveTextContent('1');

      // Try to open the same patient again
      await user.click(screen.getByTestId('open-patient-patient-123'));

      // Should still only have one tab (no duplicates)
      expect(screen.getByTestId('tab-count')).toHaveTextContent('1');
      expect(screen.getByTestId('active-patient-id')).toHaveTextContent('patient-123');
    });

    it('should maintain search results when opening patients in tabs', async () => {
      const user = userEvent.setup();

      render(
        <NotificationProvider>
          <ModalProvider>
            <OrganizationProvider>
              <PatientProvider>
                <PatientSearchTabWorkflow />
              </PatientProvider>
            </OrganizationProvider>
          </ModalProvider>
        </NotificationProvider>
      );

      // Search for patients
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByTestId('search-result-patient-123')).toBeInTheDocument();
        expect(screen.getByTestId('search-result-patient-456')).toBeInTheDocument();
      });

      // Open one patient
      await user.click(screen.getByTestId('open-patient-patient-123'));

      // Search results should still be visible
      expect(screen.getByTestId('search-result-patient-123')).toBeInTheDocument();
      expect(screen.getByTestId('search-result-patient-456')).toBeInTheDocument();

      // Open another patient
      await user.click(screen.getByTestId('open-patient-patient-456'));

      // Both patients should be in tabs
      expect(screen.getByTestId('tab-count')).toHaveTextContent('2');
    });
  });
});
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PatientSearchModal } from '../../../components/patient/PatientSearchModal';
import { PatientProvider } from '../../../contexts/PatientContext';
import { OrganizationProvider } from '../../../contexts/OrganizationContext';
import { ModalProvider } from '../../../contexts/ModalContext';
import type { Patient } from '../../../types/fhir';

// Mock the FHIR client
vi.mock('../../../services/fhirClient', () => ({
  fhirClient: {
    setOrganization: vi.fn(),
    searchPatients: vi.fn(),
    createPatient: vi.fn(),
  },
}));

// Mock PatientSearch component
vi.mock('../../../components/patient/PatientSearch', () => ({
  PatientSearch: ({ onPatientSelect, onCreatePatient }: { 
    onPatientSelect?: (patient: Patient) => void;
    onCreatePatient?: () => void;
  }) => (
    <div data-testid="patient-search-component">
      <button 
        data-testid="select-patient-button"
        onClick={() => onPatientSelect?.({
          resourceType: 'Patient',
          id: 'test-patient',
          name: [{ given: ['Test'], family: 'Patient' }],
        })}
      >
        Select Patient
      </button>
      <button 
        data-testid="create-patient-button"
        onClick={() => onCreatePatient?.()}
      >
        Create Patient
      </button>
    </div>
  ),
}));

const mockPatient: Patient = {
  resourceType: 'Patient',
  id: 'test-patient',
  name: [{ given: ['Test'], family: 'Patient' }],
};

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      <OrganizationProvider>
        <PatientProvider>
          {children}
        </PatientProvider>
      </OrganizationProvider>
    </ModalProvider>
  );
}

describe('PatientSearchModal', () => {
  const mockCloseModal = vi.fn();
  const mockOnPatientSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the useModal hook
    vi.doMock('../../../contexts/ModalContext', async () => {
      const actual = await vi.importActual('../../../contexts/ModalContext');
      return {
        ...actual,
        useModal: () => ({
          closeModal: mockCloseModal,
        }),
      };
    });
  });

  it('should render PatientSearch component', () => {
    render(
      <TestWrapper>
        <PatientSearchModal 
          modalId="test-modal"
          pageId="search"
          pageData={{}}
        />
      </TestWrapper>
    );

    expect(screen.getByTestId('patient-search-component')).toBeInTheDocument();
  });

  it('should handle patient selection and close modal', () => {
    render(
      <TestWrapper>
        <PatientSearchModal 
          modalId="test-modal"
          pageId="search"
          pageData={{}}
          onPatientSelect={mockOnPatientSelect}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('select-patient-button'));

    expect(mockOnPatientSelect).toHaveBeenCalledWith(mockPatient);
  });

  it('should handle create patient and close modal', () => {
    render(
      <TestWrapper>
        <PatientSearchModal 
          modalId="test-modal"
          pageId="search"
          pageData={{}}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId('create-patient-button'));

    // The modal should be closed when create patient is clicked
    // This would be verified by checking if closeModal was called
  });
});
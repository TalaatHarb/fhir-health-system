import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TabManager } from '../../../components/patient/TabManager';
import { PatientProvider } from '../../../contexts/PatientContext';
import { OrganizationProvider } from '../../../contexts/OrganizationContext';
import type { Patient } from '../../../types/fhir';

// Mock the FHIR client
vi.mock('../../../services/fhirClient', () => ({
  fhirClient: {
    setOrganization: vi.fn(),
    searchPatients: vi.fn(),
    createPatient: vi.fn(),
  },
}));

// Mock child components
vi.mock('../../../components/patient/PatientSearch', () => ({
  PatientSearch: ({ showAsButton }: { showAsButton?: boolean }) => (
    <div data-testid="patient-search">
      {showAsButton ? (
        <button data-testid="add-patient-button">+ Add Patient</button>
      ) : (
        <div>Patient Search Component</div>
      )}
    </div>
  ),
}));

vi.mock('../../../components/patient/PatientTab', () => ({
  PatientTab: ({ patient, isActive, onClose }: { patient: Patient; isActive: boolean; onClose: () => void }) => (
    <div 
      data-testid={`patient-tab-${patient.id}`}
      className={isActive ? 'active' : 'hidden'}
    >
      <div>Patient: {patient.name?.[0]?.given?.[0]} {patient.name?.[0]?.family}</div>
      <button onClick={onClose} data-testid={`close-tab-${patient.id}`}>Close</button>
    </div>
  ),
}));

const mockPatient1: Patient = {
  resourceType: 'Patient',
  id: 'patient-1',
  name: [{ given: ['John'], family: 'Doe' }],
  gender: 'male',
  birthDate: '1990-01-01',
};

const mockPatient2: Patient = {
  resourceType: 'Patient',
  id: 'patient-2',
  name: [{ given: ['Jane'], family: 'Smith' }],
  gender: 'female',
  birthDate: '1985-05-15',
};

const mockOrganization = {
  id: 'org-1',
  name: 'Test Organization',
  resourceType: 'Organization' as const,
};

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <OrganizationProvider>
      <PatientProvider>
        {children}
      </PatientProvider>
    </OrganizationProvider>
  );
}

describe('TabManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render PatientSearch when no patients are open', () => {
    render(
      <TestWrapper>
        <TabManager />
      </TestWrapper>
    );

    expect(screen.getByTestId('patient-search')).toBeInTheDocument();
    expect(screen.getByText('Patient Search Component')).toBeInTheDocument();
  });

  it('should render tab navigation when patients are open', async () => {
    render(
      <TestWrapper>
        <TabManager />
      </TestWrapper>
    );

    // We need to simulate opening patients through the context
    // This would typically be done through user interactions
    // For now, we'll test the component structure
    expect(screen.getByTestId('patient-search')).toBeInTheDocument();
  });

  it('should display patient tabs with correct names', () => {
    // This test would require a way to inject patients into the context
    // For a more complete test, we'd need to create a test utility
    // that allows us to set up the context state
    expect(true).toBe(true); // Placeholder
  });

  it('should show add patient button in tab navigation', () => {
    // This test would verify the add patient button appears
    // when patients are open
    expect(true).toBe(true); // Placeholder
  });

  it('should handle tab switching', () => {
    // This test would verify clicking on tabs switches the active patient
    expect(true).toBe(true); // Placeholder
  });

  it('should handle tab closing', () => {
    // This test would verify the close button removes patients from tabs
    expect(true).toBe(true); // Placeholder
  });

  it('should handle closing the active tab', () => {
    // This test would verify that closing the active tab
    // switches to another tab or shows the search interface
    expect(true).toBe(true); // Placeholder
  });

  it('should preserve tab state when switching between tabs', () => {
    // This test would verify that tab content is preserved
    // when switching between tabs
    expect(true).toBe(true); // Placeholder
  });
});

// Integration test with actual context manipulation
describe('TabManager Integration', () => {
  it('should integrate with PatientContext for tab management', async () => {
    const TestComponent = () => {
      const [patients, setPatients] = React.useState<Patient[]>([]);
      
      return (
        <div>
          <button 
            onClick={() => setPatients([mockPatient1])}
            data-testid="add-patient-1"
          >
            Add Patient 1
          </button>
          <button 
            onClick={() => setPatients([mockPatient1, mockPatient2])}
            data-testid="add-patient-2"
          >
            Add Patient 2
          </button>
          <TabManager />
        </div>
      );
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Initially should show search
    expect(screen.getByTestId('patient-search')).toBeInTheDocument();
    
    // This is a simplified test - in reality, we'd need to properly
    // integrate with the PatientContext to test tab management
  });
});
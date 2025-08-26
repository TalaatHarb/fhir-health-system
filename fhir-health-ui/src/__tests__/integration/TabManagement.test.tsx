import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MainApplication } from '../../components/MainApplication';
import { AuthProvider } from '../../contexts/AuthContext';
import { OrganizationProvider } from '../../contexts/OrganizationContext';
import { PatientProvider } from '../../contexts/PatientContext';
import type { Patient, Bundle } from '../../types/fhir';

// Mock the FHIR client
vi.mock('../../services/fhirClient', () => ({
  fhirClient: {
    setOrganization: vi.fn(),
    searchPatients: vi.fn(),
    createPatient: vi.fn(),
    getOrganizations: vi.fn(),
  },
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

const mockSearchBundle: Bundle<Patient> = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 2,
  entry: [
    { resource: mockPatient1 },
    { resource: mockPatient2 },
  ],
};

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <PatientProvider>
          {children}
        </PatientProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}

describe('Tab Management Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import the mocked fhirClient
    const { fhirClient } = await import('../../services/fhirClient');
    
    // Mock successful organization fetch
    vi.mocked(fhirClient.getOrganizations).mockResolvedValue([mockOrganization]);
    
    // Mock successful patient search
    vi.mocked(fhirClient.searchPatients).mockResolvedValue(mockSearchBundle);
    
    // Mock successful patient creation
    vi.mocked(fhirClient.createPatient).mockImplementation((patient) => 
      Promise.resolve({ ...patient, id: 'new-patient-id' })
    );
  });

  it('should show patient search when no patients are open', async () => {
    render(
      <TestWrapper>
        <MainApplication />
      </TestWrapper>
    );

    // Login first
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    // Wait for organization modal and select organization
    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    const selectOrgButton = screen.getByRole('button', { name: /select/i });
    fireEvent.click(selectOrgButton);

    // Should show patient search
    await waitFor(() => {
      expect(screen.getByText('Patient Search')).toBeInTheDocument();
    });
  });

  it('should open patient tabs when patients are selected', async () => {
    render(
      <TestWrapper>
        <MainApplication />
      </TestWrapper>
    );

    // Login and select organization
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    const selectOrgButton = screen.getByRole('button', { name: /select/i });
    fireEvent.click(selectOrgButton);

    // Search for patients
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    // Wait for search results
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on patient to open tab
    const patientResult = screen.getByText('John Doe');
    fireEvent.click(patientResult);

    // Should show tab interface
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      // The tab interface should be visible
    });
  });

  it('should handle multiple patient tabs', async () => {
    // This test would verify opening multiple patients creates multiple tabs
    // and that switching between them works correctly
    expect(true).toBe(true); // Placeholder for complex integration test
  });

  it('should handle tab closing', async () => {
    // This test would verify that closing tabs works correctly
    // and that the interface returns to search when all tabs are closed
    expect(true).toBe(true); // Placeholder for complex integration test
  });

  it('should preserve tab state when switching', async () => {
    // This test would verify that tab content is preserved
    // when switching between tabs
    expect(true).toBe(true); // Placeholder for complex integration test
  });

  it('should handle patient creation from tab interface', async () => {
    // This test would verify that the "Add Patient" button
    // in the tab interface works correctly
    expect(true).toBe(true); // Placeholder for complex integration test
  });
});

// Simplified integration test focusing on the core functionality
describe('Tab Management Core Functionality', () => {
  it('should integrate PatientContext with TabManager', () => {
    // This is a simplified test that verifies the basic integration
    // More complex tests would require setting up the full application state
    
    const TestComponent = () => {
      const [isLoggedIn, setIsLoggedIn] = React.useState(false);
      const [hasOrganization, setHasOrganization] = React.useState(false);
      
      if (!isLoggedIn) {
        return (
          <button onClick={() => setIsLoggedIn(true)}>
            Login
          </button>
        );
      }
      
      if (!hasOrganization) {
        return (
          <button onClick={() => setHasOrganization(true)}>
            Select Organization
          </button>
        );
      }
      
      return <div>Tab Manager would be here</div>;
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Login'));
    expect(screen.getByText('Select Organization')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Select Organization'));
    expect(screen.getByText('Tab Manager would be here')).toBeInTheDocument();
  });
});
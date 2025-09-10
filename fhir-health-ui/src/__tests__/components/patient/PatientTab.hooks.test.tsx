import React from 'react';
import { render } from '../../test-utils';
import { vi, describe, it, expect } from 'vitest';
import { PatientTab } from '../../../components/patient/PatientTab';
import { PatientProvider } from '../../../contexts/PatientContext';
import { OrganizationProvider } from '../../../contexts/OrganizationContext';
import type { Patient } from '../../../types/fhir';

// Mock child components to avoid complex dependencies
vi.mock('../../../components/encounter/EncounterTimeline', () => ({
  EncounterTimeline: () => <div data-testid="encounter-timeline">Encounter Timeline</div>,
}));

vi.mock('../../../components/encounter/EncounterCreateModal', () => ({
  EncounterCreateModal: () => <div data-testid="encounter-create-modal">Encounter Create Modal</div>,
}));

vi.mock('../../../components/encounter/EncounterDetails', () => ({
  EncounterDetails: () => <div data-testid="encounter-details">Encounter Details</div>,
}));

const mockPatient: Patient = {
  resourceType: 'Patient',
  id: 'test-patient',
  name: [{ given: ['John'], family: 'Doe' }],
  gender: 'male',
  birthDate: '1990-01-01',
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

describe('PatientTab Hooks Fix', () => {
  it('should not cause hooks error when switching between active and inactive states', () => {
    // This test specifically verifies that the hooks issue is fixed
    const { rerender } = render(
      <TestWrapper>
        <PatientTab 
          patient={mockPatient}
          isActive={false}
          onClose={() => {}}
        />
      </TestWrapper>
    );

    // Should render hidden div without hooks error
    expect(document.querySelector('.patient-tab.hidden')).toBeInTheDocument();

    // Now switch to active - this should not cause a hooks error
    rerender(
      <TestWrapper>
        <PatientTab 
          patient={mockPatient}
          isActive={true}
          onClose={() => {}}
        />
      </TestWrapper>
    );

    // Should render active content
    expect(document.querySelector('.patient-tab.active')).toBeInTheDocument();

    // Switch back to inactive - this should also not cause hooks error
    rerender(
      <TestWrapper>
        <PatientTab 
          patient={mockPatient}
          isActive={false}
          onClose={() => {}}
        />
      </TestWrapper>
    );

    // Should render hidden div again
    expect(document.querySelector('.patient-tab.hidden')).toBeInTheDocument();
  });

  it('should handle multiple rapid state changes without hooks errors', () => {
    const { rerender } = render(
      <TestWrapper>
        <PatientTab 
          patient={mockPatient}
          isActive={false}
          onClose={() => {}}
        />
      </TestWrapper>
    );

    // Rapidly switch states multiple times
    for (let i = 0; i < 5; i++) {
      rerender(
        <TestWrapper>
          <PatientTab 
            patient={mockPatient}
            isActive={true}
            onClose={() => {}}
          />
        </TestWrapper>
      );

      rerender(
        <TestWrapper>
          <PatientTab 
            patient={mockPatient}
            isActive={false}
            onClose={() => {}}
          />
        </TestWrapper>
      );
    }

    // Should still work without errors
    expect(document.querySelector('.patient-tab.hidden')).toBeInTheDocument();
  });
});
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PatientProvider, usePatient } from '../../contexts/PatientContext';
import { OrganizationProvider } from '../../contexts/OrganizationContext';
import type { Patient } from '../../types/fhir';

// Mock the FHIR client
vi.mock('../../services/fhirClient', () => ({
  fhirClient: {
    setOrganization: vi.fn(),
    searchPatients: vi.fn(),
    createPatient: vi.fn(),
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

const mockPatient3: Patient = {
  resourceType: 'Patient',
  id: 'patient-3',
  name: [{ given: ['Bob'], family: 'Johnson' }],
  gender: 'male',
  birthDate: '1975-03-20',
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

describe('PatientContext - Multi-Patient Tab Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with no open patients', () => {
    const { result } = renderHook(() => usePatient(), {
      wrapper: TestWrapper,
    });

    expect(result.current.state.openPatients.size).toBe(0);
    expect(result.current.state.activePatientId).toBeNull();
    expect(result.current.getActivePatient()).toBeNull();
  });

  it('should open a patient and set it as active', () => {
    const { result } = renderHook(() => usePatient(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.openPatient(mockPatient1);
    });

    expect(result.current.state.openPatients.size).toBe(1);
    expect(result.current.state.openPatients.has('patient-1')).toBe(true);
    expect(result.current.state.activePatientId).toBe('patient-1');
    expect(result.current.getActivePatient()).toEqual(mockPatient1);
  });

  it('should open multiple patients', () => {
    const { result } = renderHook(() => usePatient(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.openPatient(mockPatient1);
    });

    act(() => {
      result.current.openPatient(mockPatient2);
    });

    expect(result.current.state.openPatients.size).toBe(2);
    expect(result.current.state.openPatients.has('patient-1')).toBe(true);
    expect(result.current.state.openPatients.has('patient-2')).toBe(true);
    expect(result.current.state.activePatientId).toBe('patient-2'); // Last opened becomes active
  });

  it('should switch active patient', () => {
    const { result } = renderHook(() => usePatient(), {
      wrapper: TestWrapper,
    });

    // Open two patients
    act(() => {
      result.current.openPatient(mockPatient1);
    });

    act(() => {
      result.current.openPatient(mockPatient2);
    });

    // Switch to first patient
    act(() => {
      result.current.setActivePatient('patient-1');
    });

    expect(result.current.state.activePatientId).toBe('patient-1');
    expect(result.current.getActivePatient()).toEqual(mockPatient1);
  });

  it('should close a patient', () => {
    const { result } = renderHook(() => usePatient(), {
      wrapper: TestWrapper,
    });

    // Open two patients
    act(() => {
      result.current.openPatient(mockPatient1);
    });

    act(() => {
      result.current.openPatient(mockPatient2);
    });

    // Close first patient
    act(() => {
      result.current.closePatient('patient-1');
    });

    expect(result.current.state.openPatients.size).toBe(1);
    expect(result.current.state.openPatients.has('patient-1')).toBe(false);
    expect(result.current.state.openPatients.has('patient-2')).toBe(true);
    expect(result.current.state.activePatientId).toBe('patient-2'); // Should remain active
  });

  it('should handle closing the active patient', () => {
    const { result } = renderHook(() => usePatient(), {
      wrapper: TestWrapper,
    });

    // Open two patients
    act(() => {
      result.current.openPatient(mockPatient1);
    });

    act(() => {
      result.current.openPatient(mockPatient2);
    });

    // Close the active patient (patient-2)
    act(() => {
      result.current.closePatient('patient-2');
    });

    expect(result.current.state.openPatients.size).toBe(1);
    expect(result.current.state.openPatients.has('patient-2')).toBe(false);
    expect(result.current.state.activePatientId).toBe('patient-1'); // Should switch to remaining patient
    expect(result.current.getActivePatient()).toEqual(mockPatient1);
  });

  it('should handle closing the last patient', () => {
    const { result } = renderHook(() => usePatient(), {
      wrapper: TestWrapper,
    });

    // Open one patient
    act(() => {
      result.current.openPatient(mockPatient1);
    });

    // Close the only patient
    act(() => {
      result.current.closePatient('patient-1');
    });

    expect(result.current.state.openPatients.size).toBe(0);
    expect(result.current.state.activePatientId).toBeNull();
    expect(result.current.getActivePatient()).toBeNull();
  });

  it('should handle opening the same patient multiple times', () => {
    const { result } = renderHook(() => usePatient(), {
      wrapper: TestWrapper,
    });

    // Open same patient twice
    act(() => {
      result.current.openPatient(mockPatient1);
    });

    act(() => {
      result.current.openPatient(mockPatient1);
    });

    expect(result.current.state.openPatients.size).toBe(1);
    expect(result.current.state.activePatientId).toBe('patient-1');
  });

  it('should handle setting active patient to null', () => {
    const { result } = renderHook(() => usePatient(), {
      wrapper: TestWrapper,
    });

    // Open a patient
    act(() => {
      result.current.openPatient(mockPatient1);
    });

    // Set active patient to null
    act(() => {
      result.current.setActivePatient(null);
    });

    expect(result.current.state.openPatients.size).toBe(1); // Patient still open
    expect(result.current.state.activePatientId).toBeNull();
    expect(result.current.getActivePatient()).toBeNull();
  });

  it('should handle setting active patient to non-existent patient', () => {
    const { result } = renderHook(() => usePatient(), {
      wrapper: TestWrapper,
    });

    // Open a patient
    act(() => {
      result.current.openPatient(mockPatient1);
    });

    // Try to set active patient to non-existent patient
    act(() => {
      result.current.setActivePatient('non-existent-patient');
    });

    expect(result.current.state.activePatientId).toBe('non-existent-patient');
    expect(result.current.getActivePatient()).toBeNull(); // Should return null for non-existent patient
  });

  it('should preserve patient state isolation', () => {
    const { result } = renderHook(() => usePatient(), {
      wrapper: TestWrapper,
    });

    // Open multiple patients
    act(() => {
      result.current.openPatient(mockPatient1);
    });

    act(() => {
      result.current.openPatient(mockPatient2);
    });

    act(() => {
      result.current.openPatient(mockPatient3);
    });

    // Verify all patients are stored correctly
    expect(result.current.state.openPatients.get('patient-1')).toEqual(mockPatient1);
    expect(result.current.state.openPatients.get('patient-2')).toEqual(mockPatient2);
    expect(result.current.state.openPatients.get('patient-3')).toEqual(mockPatient3);
  });

  it('should handle complex tab management scenario', () => {
    const { result } = renderHook(() => usePatient(), {
      wrapper: TestWrapper,
    });

    // Open three patients
    act(() => {
      result.current.openPatient(mockPatient1);
    });

    act(() => {
      result.current.openPatient(mockPatient2);
    });

    act(() => {
      result.current.openPatient(mockPatient3);
    });

    expect(result.current.state.activePatientId).toBe('patient-3');

    // Switch to middle patient
    act(() => {
      result.current.setActivePatient('patient-2');
    });

    expect(result.current.state.activePatientId).toBe('patient-2');

    // Close the active patient (patient-2)
    act(() => {
      result.current.closePatient('patient-2');
    });

    // Should switch to one of the remaining patients
    expect(result.current.state.openPatients.size).toBe(2);
    expect(['patient-1', 'patient-3']).toContain(result.current.state.activePatientId);

    // Close another patient
    act(() => {
      result.current.closePatient('patient-1');
    });

    expect(result.current.state.openPatients.size).toBe(1);
    expect(result.current.state.activePatientId).toBe('patient-3');

    // Close the last patient
    act(() => {
      result.current.closePatient('patient-3');
    });

    expect(result.current.state.openPatients.size).toBe(0);
    expect(result.current.state.activePatientId).toBeNull();
  });

  it('should reset state and close all patients', () => {
    const { result } = renderHook(() => usePatient(), {
      wrapper: TestWrapper,
    });

    // Open multiple patients
    act(() => {
      result.current.openPatient(mockPatient1);
    });

    act(() => {
      result.current.openPatient(mockPatient2);
    });

    // Reset state
    act(() => {
      result.current.resetState();
    });

    expect(result.current.state.openPatients.size).toBe(0);
    expect(result.current.state.activePatientId).toBeNull();
    expect(result.current.getActivePatient()).toBeNull();
  });
});
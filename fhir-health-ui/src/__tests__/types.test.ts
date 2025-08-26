import { describe, it, expect } from 'vitest'
import type { Patient, Organization, FHIRResource } from '../types/fhir'
import type { AuthState, PatientState } from '../types/app'

describe('Type Definitions', () => {
  it('should have proper FHIR Patient interface', () => {
    const patient: Patient = {
      resourceType: 'Patient',
      id: 'test-patient-1',
      name: [{
        use: 'official',
        family: 'Doe',
        given: ['John']
      }],
      gender: 'male',
      birthDate: '1990-01-01'
    }

    expect(patient.resourceType).toBe('Patient')
    expect(patient.name?.[0]?.family).toBe('Doe')
  })

  it('should have proper Organization interface', () => {
    const org: Organization = {
      resourceType: 'Organization',
      id: 'test-org-1',
      name: 'Test Healthcare System',
      active: true
    }

    expect(org.resourceType).toBe('Organization')
    expect(org.name).toBe('Test Healthcare System')
  })

  it('should have proper AuthState interface', () => {
    const authState: AuthState = {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null
    }

    expect(authState.isAuthenticated).toBe(false)
    expect(authState.user).toBeNull()
  })

  it('should have proper PatientState interface', () => {
    const patientState: PatientState = {
      openPatients: new Map(),
      activePatientId: null,
      searchResults: [],
      searchLoading: false,
      searchError: null,
      createPatientModalOpen: false
    }

    expect(patientState.openPatients.size).toBe(0)
    expect(patientState.activePatientId).toBeNull()
  })

  it('should support FHIRResource union type', () => {
    const patient: Patient = {
      resourceType: 'Patient',
      id: 'test-1'
    }

    const resource: FHIRResource = patient
    expect(resource.resourceType).toBe('Patient')
  })
})
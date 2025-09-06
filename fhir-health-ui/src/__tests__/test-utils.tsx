import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../contexts/AuthContext';
import { OrganizationProvider } from '../contexts/OrganizationContext';
import { PatientProvider } from '../contexts/PatientContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import type { User, Organization, Patient, Notification } from '../types';
import type { Bundle, FHIRResource, Encounter, Observation, Condition, MedicationRequest } from '../types/fhir';

// Utility to create mock FHIR responses
export const createMockBundle = <T extends FHIRResource>(resources: T[]): Bundle<T> => ({
  resourceType: 'Bundle' as const,
  id: `bundle-${Date.now()}`,
  type: 'searchset' as const,
  total: resources.length,
  entry: resources.map((resource, index) => ({
    fullUrl: `http://example.com/fhir/${resource.resourceType}/${resource.id ?? index}`,
    resource,
  })),
});

// Mock data definitions
export const mockUser: User = {
  id: 'user-123',
  username: 'demoUser',
  name: 'Demo User',
  email: 'demo@example.com',
  roles: ['healthcare-professional'],
};

export const mockOrganization: Organization = {
  resourceType: 'Organization',
  id: 'org-1',
  name: 'General Hospital',
  active: true,
  type: [
    {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/organization-type',
          code: 'prov',
          display: 'Healthcare Provider',
        },
      ],
    },
  ],
  telecom: [
    {
      system: 'phone',
      value: '+1-555-123-4567',
      use: 'work',
    },
    {
      system: 'email',
      value: 'contact@generalhospital.org',
      use: 'work',
    },
  ],
  address: [
    {
      use: 'work',
      type: 'physical',
      line: ['123 Healthcare Ave'],
      city: 'Medical City',
      state: 'HC',
      postalCode: '12345',
      country: 'US',
    },
  ],
};

export const mockOrganization2: Organization = {
  resourceType: 'Organization',
  id: 'org-2',
  name: 'Community Clinic',
  active: true,
  type: [
    {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/organization-type',
          code: 'prov',
          display: 'Healthcare Provider',
        },
      ],
    },
  ],
  telecom: [
    {
      system: 'phone',
      value: '+1-555-987-6543',
      use: 'work',
    },
  ],
  address: [
    {
      use: 'work',
      type: 'physical',
      line: ['456 Community St'],
      city: 'Health City',
      state: 'HC',
      postalCode: '54321',
      country: 'US',
    },
  ],
};

export const mockPatient: Patient = {
  resourceType: 'Patient',
  id: 'patient-123',
  active: true,
  name: [
    {
      use: 'official',
      family: 'Doe',
      given: ['John'],
    },
  ],
  gender: 'male',
  birthDate: '1990-01-01',
  telecom: [
    {
      system: 'phone',
      value: '+1-555-987-6543',
      use: 'mobile',
    },
    {
      system: 'email',
      value: 'john.doe@example.com',
      use: 'home',
    },
  ],
  address: [
    {
      use: 'home',
      type: 'physical',
      line: ['456 Patient St'],
      city: 'Patient City',
      state: 'PC',
      postalCode: '54321',
      country: 'US',
    },
  ],
  managingOrganization: {
    reference: `Organization/${mockOrganization.id}`,
    display: mockOrganization.name,
  },
};

export const mockPatient2: Patient = {
  resourceType: 'Patient',
  id: 'patient-456',
  active: true,
  name: [
    {
      use: 'official',
      family: 'Smith',
      given: ['Jane'],
    },
  ],
  gender: 'female',
  birthDate: '1985-05-15',
  telecom: [
    {
      system: 'phone',
      value: '+1-555-123-7890',
      use: 'mobile',
    },
  ],
  managingOrganization: {
    reference: `Organization/${mockOrganization.id}`,
    display: mockOrganization.name,
  },
};

export const mockNotification: Notification = {
  id: 'notification-123',
  type: 'success',
  title: 'Test Notification',
  message: 'This is a test notification message',
  timestamp: new Date(),
  duration: 4000,
};

export const mockNotificationError: Notification = {
  id: 'notification-error-123',
  type: 'error',
  title: 'Test Error',
  message: 'This is a test error notification',
  timestamp: new Date(),
  duration: 8000,
};

// Mock function interface for better type safety
export interface MockFhirClient {
  searchPatients: ReturnType<typeof vi.fn>;
  createPatient: ReturnType<typeof vi.fn>;
  updatePatient: ReturnType<typeof vi.fn>;
  deletePatient: ReturnType<typeof vi.fn>;
  getPatient: ReturnType<typeof vi.fn>;
  searchOrganizations: ReturnType<typeof vi.fn>;
  getOrganization: ReturnType<typeof vi.fn>;
  setOrganization: ReturnType<typeof vi.fn>;
  searchEncounters: ReturnType<typeof vi.fn>;
  getPatientEncounters: ReturnType<typeof vi.fn>;
  createEncounter: ReturnType<typeof vi.fn>;
  updateEncounter: ReturnType<typeof vi.fn>;
  createResource: ReturnType<typeof vi.fn>;
  updateResource: ReturnType<typeof vi.fn>;
  deleteResource: ReturnType<typeof vi.fn>;
  searchResource: ReturnType<typeof vi.fn>;
  searchObservations: ReturnType<typeof vi.fn>;
  searchConditions: ReturnType<typeof vi.fn>;
  searchMedicationRequests: ReturnType<typeof vi.fn>;
  searchDiagnosticReports: ReturnType<typeof vi.fn>;
  searchProcedures: ReturnType<typeof vi.fn>;
  validateResource: ReturnType<typeof vi.fn>;
  bundleResources: ReturnType<typeof vi.fn>;
}

export interface MockEnhancedFhirClient {
  // Connection and status methods
  checkConnection: ReturnType<typeof vi.fn>;
  isOffline: ReturnType<typeof vi.fn>;

  // Offline queue management
  processOfflineQueue: ReturnType<typeof vi.fn>;
  queueOperation: ReturnType<typeof vi.fn>;
  getQueueStatus: ReturnType<typeof vi.fn>;

  // Retry and circuit breaker methods
  retryFailedOperations: ReturnType<typeof vi.fn>;
  getCircuitBreakerState: ReturnType<typeof vi.fn>;
  resetCircuitBreaker: ReturnType<typeof vi.fn>;

  // Cache management
  clearAllCaches: ReturnType<typeof vi.fn>;
  clearPatientCaches: ReturnType<typeof vi.fn>;
  clearEncounterCaches: ReturnType<typeof vi.fn>;
  clearResourceCaches: ReturnType<typeof vi.fn>;

  // Enhanced FHIR operations with retry/offline support
  searchPatients: ReturnType<typeof vi.fn>;
  getPatient: ReturnType<typeof vi.fn>;
  createPatient: ReturnType<typeof vi.fn>;
  updatePatient: ReturnType<typeof vi.fn>;
  searchEncounters: ReturnType<typeof vi.fn>;
  getPatientEncounters: ReturnType<typeof vi.fn>;
  getEncounter: ReturnType<typeof vi.fn>;
  createEncounter: ReturnType<typeof vi.fn>;
  getResource: ReturnType<typeof vi.fn>;
  createResource: ReturnType<typeof vi.fn>;
  searchResources: ReturnType<typeof vi.fn>;
  getEncounterResources: ReturnType<typeof vi.fn>;
  getOrganizations: ReturnType<typeof vi.fn>;
  getOrganization: ReturnType<typeof vi.fn>;
}

// Import comprehensive mock data factories
export { PatientFactory, ClinicalDataFactory, createPatientScenario, createTimelineData } from './factories';

// Import element selection utilities
export * from './utils/element-selectors';

// Import async testing utilities
export * from './utils/async-test-config';
export * from './utils/async-test-utils';

// Legacy mock data factories for backward compatibility
export const createMockEncounter = (patientId: string, overrides: Partial<Encounter> = {}): Encounter => ({
  resourceType: 'Encounter',
  id: `encounter-${Date.now()}`,
  status: 'finished',
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
    display: 'ambulatory'
  },
  type: [{
    coding: [{
      system: 'http://snomed.info/sct',
      code: '185349003',
      display: 'Encounter for check up'
    }]
  }],
  subject: {
    reference: `Patient/${patientId}`,
    display: 'Test Patient'
  },
  period: {
    start: '2024-01-15T10:00:00Z',
    end: '2024-01-15T11:00:00Z'
  },
  serviceProvider: {
    reference: `Organization/${mockOrganization.id}`,
    display: mockOrganization.name
  },
  ...overrides
});

export const createMockObservation = (patientId: string, encounterId?: string, overrides: Partial<Observation> = {}): Observation => ({
  resourceType: 'Observation',
  id: `observation-${Date.now()}`,
  status: 'final',
  category: [{
    coding: [{
      system: 'http://terminology.hl7.org/CodeSystem/observation-category',
      code: 'vital-signs',
      display: 'Vital Signs'
    }]
  }],
  code: {
    coding: [{
      system: 'http://loinc.org',
      code: '8867-4',
      display: 'Heart rate'
    }]
  },
  subject: {
    reference: `Patient/${patientId}`
  },
  ...(encounterId && { encounter: { reference: `Encounter/${encounterId}` } }),
  effectiveDateTime: '2024-01-15T10:30:00Z',
  valueQuantity: {
    value: 72,
    unit: 'beats/min',
    system: 'http://unitsofmeasure.org',
    code: '/min'
  },
  ...overrides
});

export const createMockCondition = (patientId: string, encounterId?: string, overrides: Partial<Condition> = {}): Condition => ({
  resourceType: 'Condition',
  id: `condition-${Date.now()}`,
  clinicalStatus: {
    coding: [{
      system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
      code: 'active'
    }]
  },
  verificationStatus: {
    coding: [{
      system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
      code: 'confirmed'
    }]
  },
  category: [{
    coding: [{
      system: 'http://terminology.hl7.org/CodeSystem/condition-category',
      code: 'encounter-diagnosis',
      display: 'Encounter Diagnosis'
    }]
  }],
  code: {
    coding: [{
      system: 'http://snomed.info/sct',
      code: '38341003',
      display: 'Hypertensive disorder'
    }]
  },
  subject: {
    reference: `Patient/${patientId}`
  },
  ...(encounterId && { encounter: { reference: `Encounter/${encounterId}` } }),
  onsetDateTime: '2024-01-15',
  ...overrides
});

export const createMockMedicationRequest = (patientId: string, encounterId?: string, overrides: Partial<MedicationRequest> = {}): MedicationRequest => ({
  resourceType: 'MedicationRequest',
  id: `medication-request-${Date.now()}`,
  status: 'active',
  intent: 'order',
  medicationCodeableConcept: {
    coding: [{
      system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
      code: '316049',
      display: 'Lisinopril'
    }]
  },
  subject: {
    reference: `Patient/${patientId}`
  },
  ...(encounterId && { encounter: { reference: `Encounter/${encounterId}` } }),
  authoredOn: '2024-01-15T10:45:00Z',
  dosageInstruction: [{
    text: 'Take 10mg once daily',
    timing: {
      repeat: {
        frequency: 1,
        period: 1,
        periodUnit: 'd'
      }
    }
  }],
  ...overrides
});

// Complete FHIR client mock with all required methods and realistic test data
export const createCompleteFhirClientMock = (): MockFhirClient => ({
  // Patient operations
  searchPatients: vi.fn().mockResolvedValue(createMockBundle([mockPatient, mockPatient2])),
  createPatient: vi.fn().mockImplementation((patient: Omit<Patient, 'id'>) =>
    Promise.resolve({ ...patient, id: `patient-${Date.now()}` })
  ),
  updatePatient: vi.fn().mockImplementation((id: string, patient: Patient) =>
    Promise.resolve({ ...patient, id })
  ),
  deletePatient: vi.fn().mockResolvedValue(undefined),
  getPatient: vi.fn().mockImplementation((id: string) =>
    Promise.resolve(id === 'patient-123' ? mockPatient : { ...mockPatient, id })
  ),

  // Organization operations
  searchOrganizations: vi.fn().mockResolvedValue(createMockBundle([mockOrganization, mockOrganization2])),
  getOrganization: vi.fn().mockImplementation((id: string) => {
    if (id === 'org-1') return Promise.resolve(mockOrganization);
    if (id === 'org-2') return Promise.resolve(mockOrganization2);
    return Promise.resolve({ ...mockOrganization, id });
  }),
  setOrganization: vi.fn(),

  // Encounter operations
  searchEncounters: vi.fn().mockResolvedValue(createMockBundle([createMockEncounter('patient-123')])),
  getPatientEncounters: vi.fn().mockImplementation((patientId: string) => {
    const encounters = [
      createMockEncounter(patientId, { id: 'encounter-1', period: { start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z' } }),
      createMockEncounter(patientId, { id: 'encounter-2', period: { start: '2024-01-10T14:00:00Z', end: '2024-01-10T15:00:00Z' } }),
      createMockEncounter(patientId, { id: 'encounter-3', period: { start: '2024-01-05T09:00:00Z', end: '2024-01-05T10:00:00Z' } })
    ];
    return Promise.resolve(createMockBundle(encounters));
  }),
  createEncounter: vi.fn().mockImplementation((encounter: Omit<Encounter, 'id'>) =>
    Promise.resolve({ ...encounter, id: `encounter-${Date.now()}` })
  ),
  updateEncounter: vi.fn().mockImplementation((id: string, encounter: Encounter) =>
    Promise.resolve({ ...encounter, id })
  ),

  // Generic resource operations
  createResource: vi.fn().mockImplementation(<T extends FHIRResource>(resource: Omit<T, 'id'>) =>
    Promise.resolve({ ...resource, id: `${resource.resourceType.toLowerCase()}-${Date.now()}` } as T)
  ),
  updateResource: vi.fn().mockImplementation(<T extends FHIRResource>(id: string, resource: T) =>
    Promise.resolve({ ...resource, id } as T)
  ),
  deleteResource: vi.fn().mockResolvedValue(undefined),
  searchResource: vi.fn().mockResolvedValue(createMockBundle([])),

  // Clinical data operations
  searchObservations: vi.fn().mockImplementation((query: any) => {
    const patientId = query?.patient ?? 'patient-123';
    const observations = [
      createMockObservation(patientId, undefined, {
        code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
        valueQuantity: { value: 72, unit: 'beats/min' }
      }),
      createMockObservation(patientId, undefined, {
        code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
        valueQuantity: { value: 120, unit: 'mmHg' }
      })
    ];
    return Promise.resolve(createMockBundle(observations));
  }),
  searchConditions: vi.fn().mockImplementation((query: any) => {
    const patientId = query?.patient ?? 'patient-123';
    const conditions = [
      createMockCondition(patientId, undefined, {
        code: { coding: [{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertensive disorder' }] }
      })
    ];
    return Promise.resolve(createMockBundle(conditions));
  }),
  searchMedicationRequests: vi.fn().mockImplementation((query: any) => {
    const patientId = query?.patient ?? 'patient-123';
    const medications = [
      createMockMedicationRequest(patientId, undefined, {
        medicationCodeableConcept: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '316049', display: 'Lisinopril' }] }
      })
    ];
    return Promise.resolve(createMockBundle(medications));
  }),
  searchDiagnosticReports: vi.fn().mockResolvedValue(createMockBundle([])),
  searchProcedures: vi.fn().mockResolvedValue(createMockBundle([])),

  // Utility operations
  validateResource: vi.fn().mockImplementation((resource: FHIRResource) => {
    const errors: string[] = [];

    // Basic validation
    if (!resource.resourceType) {
      errors.push('Missing resourceType');
    }

    // Resource-specific validation
    if (resource.resourceType === 'Patient') {
      const patient = resource as Patient;
      if (!patient.name || patient.name.length === 0) {
        errors.push('Patient must have at least one name');
      }
    }

    if (resource.resourceType === 'Encounter') {
      const encounter = resource as Encounter;
      if (!encounter.status) {
        errors.push('Encounter must have a status');
      }
      if (!encounter.subject) {
        errors.push('Encounter must have a subject');
      }
    }

    return Promise.resolve({
      valid: errors.length === 0,
      errors
    });
  }),
  bundleResources: vi.fn().mockImplementation((resources: FHIRResource[]) => {
    const bundle: Bundle<FHIRResource> = {
      resourceType: 'Bundle',
      id: `bundle-${Date.now()}`,
      type: 'collection',
      total: resources.length,
      entry: resources.map((resource, index) => ({
        fullUrl: `http://example.com/fhir/${resource.resourceType}/${resource.id ?? index}`,
        resource
      }))
    };
    return Promise.resolve(bundle);
  }),
});

// Network simulation utilities for testing offline/online scenarios
export interface NetworkSimulationConfig {
  isOffline?: boolean;
  networkDelay?: number;
  errorRate?: number;
  timeoutRate?: number;
  circuitBreakerOpen?: boolean;
}

export const createNetworkSimulation = (config: NetworkSimulationConfig = {}): {
  simulateNetworkConditions: <T>(operation: () => Promise<T>) => Promise<T>;
  isOffline: () => boolean;
  getDelay: () => number;
  getErrorRate: () => number;
  getTimeoutRate: () => number;
  isCircuitBreakerOpen: () => boolean;
} => {
  const {
    isOffline = false,
    networkDelay = 0,
    errorRate = 0,
    timeoutRate = 0,
    circuitBreakerOpen = false
  } = config;

  const simulateNetworkConditions = async <T,>(operation: () => Promise<T>): Promise<T> => {
    // Simulate circuit breaker open state
    if (circuitBreakerOpen) {
      throw new Error('Circuit breaker is open');
    }

    // Simulate offline state
    if (isOffline) {
      throw new Error('NetworkError: No internet connection');
    }

    // Simulate timeout
    if (Math.random() < timeoutRate) {
      throw new Error('AbortError: Request timeout');
    }

    // Simulate network errors
    if (Math.random() < errorRate) {
      throw new Error('NetworkError: Request failed');
    }

    // Simulate network delay
    if (networkDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, networkDelay));
    }

    return operation();
  };

  return {
    simulateNetworkConditions,
    isOffline: () => isOffline,
    getDelay: () => networkDelay,
    getErrorRate: () => errorRate,
    getTimeoutRate: () => timeoutRate,
    isCircuitBreakerOpen: () => circuitBreakerOpen
  };
};

// Complete enhanced FHIR client mock with retry mechanisms and offline support
export const createEnhancedFhirClientMock = (networkConfig: NetworkSimulationConfig = {}): MockEnhancedFhirClient => {
  const networkSim = createNetworkSimulation(networkConfig);
  const baseFhirMock = createCompleteFhirClientMock();

  // Mock offline queue state
  let offlineQueue: Array<{ type: string; data: unknown; id: string; timestamp: number }> = [];
  let circuitBreakerState: 'closed' | 'open' | 'half-open' = networkConfig.circuitBreakerOpen ? 'open' : 'closed';

  return {
    // Connection and status methods
    checkConnection: vi.fn().mockImplementation(async () => {
      try {
        await networkSim.simulateNetworkConditions(() => Promise.resolve(true));
        return true;
      } catch {
        return false;
      }
    }),

    isOffline: vi.fn().mockImplementation(() => networkSim.isOffline()),

    // Offline queue management
    processOfflineQueue: vi.fn().mockImplementation(async (processor?: (operation: any) => Promise<void>) => {
      if (networkSim.isOffline()) {
        throw new Error('Cannot process offline queue while offline');
      }

      const processedIds: string[] = [];

      for (const operation of offlineQueue) {
        try {
          if (processor) {
            await processor(operation);
          }
          processedIds.push(operation.id);
        } catch {
          // Keep failed operations in queue
        }
      }

      // Remove processed operations
      offlineQueue = offlineQueue.filter(op => !processedIds.includes(op.id));
    }),

    queueOperation: vi.fn().mockImplementation((operation: { type: string; data: unknown }) => {
      const queuedOp = {
        ...operation,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };
      offlineQueue.push(queuedOp);
    }),

    getQueueStatus: vi.fn().mockImplementation(() => ({
      pending: offlineQueue.length,
      failed: 0,
      operations: offlineQueue.map(op => ({ type: op.type, timestamp: op.timestamp }))
    })),

    // Retry and circuit breaker methods
    retryFailedOperations: vi.fn().mockImplementation(async () => {
      const failedOps = offlineQueue.filter(op => Date.now() - op.timestamp > 60000); // Operations older than 1 minute

      if (networkSim.isOffline()) {
        return failedOps;
      }

      const retriedOps = [];
      for (const op of failedOps) {
        try {
          await networkSim.simulateNetworkConditions(() => Promise.resolve());
          retriedOps.push(op);
        } catch {
          // Keep in failed state
        }
      }

      return retriedOps;
    }),

    getCircuitBreakerState: vi.fn().mockImplementation(() => circuitBreakerState),

    resetCircuitBreaker: vi.fn().mockImplementation(() => {
      circuitBreakerState = 'closed';
    }),

    // Cache management
    clearAllCaches: vi.fn().mockImplementation(() => {
      // Simulate clearing all localStorage cache entries
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('offline-')) {
          localStorage.removeItem(key);
        }
      });
    }),

    clearPatientCaches: vi.fn().mockImplementation(() => {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('offline-patients-search-') || key.startsWith('offline-patient-')) {
          localStorage.removeItem(key);
        }
      });
    }),

    clearEncounterCaches: vi.fn().mockImplementation((patientId?: string) => {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('offline-encounters-search-') ||
          (patientId && key.startsWith(`offline-patient-encounters-${patientId}-`))) {
          localStorage.removeItem(key);
        }
      });
    }),

    clearResourceCaches: vi.fn().mockImplementation((resourceType?: string) => {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (resourceType && key.startsWith(`offline-resources-${resourceType}-`)) {
          localStorage.removeItem(key);
        } else if (!resourceType && key.startsWith('offline-resources-')) {
          localStorage.removeItem(key);
        }
      });
    }),

    // Enhanced FHIR operations with retry/offline support
    searchPatients: vi.fn().mockImplementation(async (query: any = {}) => {
      return networkSim.simulateNetworkConditions(() => baseFhirMock.searchPatients(query));
    }),

    getPatient: vi.fn().mockImplementation(async (id: string) => {
      return networkSim.simulateNetworkConditions(() => baseFhirMock.getPatient(id));
    }),

    createPatient: vi.fn().mockImplementation(async (patient: any) => {
      if (networkSim.isOffline()) {
        // Queue the operation for later processing
        const queuedOp = {
          type: 'createPatient',
          data: patient,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        };
        offlineQueue.push(queuedOp);
        throw new Error('Operation queued for offline processing');
      }

      return networkSim.simulateNetworkConditions(() => baseFhirMock.createPatient(patient));
    }),

    updatePatient: vi.fn().mockImplementation(async (id: string, patient: any) => {
      if (networkSim.isOffline()) {
        const queuedOp = {
          type: 'updatePatient',
          data: { id, patient },
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        };
        offlineQueue.push(queuedOp);
        throw new Error('Operation queued for offline processing');
      }

      return networkSim.simulateNetworkConditions(() => baseFhirMock.updatePatient(id, patient));
    }),

    searchEncounters: vi.fn().mockImplementation(async (query: any = {}) => {
      return networkSim.simulateNetworkConditions(() => baseFhirMock.searchEncounters(query));
    }),

    getPatientEncounters: vi.fn().mockImplementation(async (patientId: string, _options: any = {}) => {
      return networkSim.simulateNetworkConditions(() => baseFhirMock.getPatientEncounters(patientId));
    }),

    getEncounter: vi.fn().mockImplementation(async (id: string) => {
      return networkSim.simulateNetworkConditions(() =>
        Promise.resolve(createMockEncounter('patient-123', { id }))
      );
    }),

    createEncounter: vi.fn().mockImplementation(async (encounter: any) => {
      if (networkSim.isOffline()) {
        const queuedOp = {
          type: 'createEncounter',
          data: encounter,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        };
        offlineQueue.push(queuedOp);
        throw new Error('Operation queued for offline processing');
      }

      return networkSim.simulateNetworkConditions(() => baseFhirMock.createEncounter(encounter));
    }),

    getResource: vi.fn().mockImplementation(async (resourceType: string, id: string) => {
      return networkSim.simulateNetworkConditions(() => {
        // Create mock resource based on type
        switch (resourceType) {
          case 'Patient':
            return baseFhirMock.getPatient(id);
          case 'Encounter':
            return Promise.resolve(createMockEncounter('patient-123', { id }));
          case 'Observation':
            return Promise.resolve(createMockObservation('patient-123', undefined, { id }));
          case 'Condition':
            return Promise.resolve(createMockCondition('patient-123', undefined, { id }));
          case 'MedicationRequest':
            return Promise.resolve(createMockMedicationRequest('patient-123', undefined, { id }));
          default:
            return Promise.resolve({ resourceType, id });
        }
      });
    }),

    createResource: vi.fn().mockImplementation(async (resource: any) => {
      if (networkSim.isOffline()) {
        const queuedOp = {
          type: 'createResource',
          data: resource,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        };
        offlineQueue.push(queuedOp);
        throw new Error('Operation queued for offline processing');
      }

      return networkSim.simulateNetworkConditions(() => baseFhirMock.createResource(resource));
    }),

    searchResources: vi.fn().mockImplementation(async (resourceType: string, query: any = {}) => {
      return networkSim.simulateNetworkConditions(() => {
        // Return appropriate mock data based on resource type
        switch (resourceType) {
          case 'Patient':
            return baseFhirMock.searchPatients(query);
          case 'Encounter':
            return baseFhirMock.searchEncounters(query);
          case 'Observation':
            return baseFhirMock.searchObservations(query);
          case 'Condition':
            return baseFhirMock.searchConditions(query);
          case 'MedicationRequest':
            return baseFhirMock.searchMedicationRequests(query);
          default:
            return Promise.resolve(createMockBundle([]));
        }
      });
    }),

    getEncounterResources: vi.fn().mockImplementation(async (encounterId: string) => {
      return networkSim.simulateNetworkConditions(() => {
        const patientId = 'patient-123';
        return Promise.resolve({
          observations: createMockBundle([
            createMockObservation(patientId, encounterId, {
              code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] }
            })
          ]),
          conditions: createMockBundle([
            createMockCondition(patientId, encounterId, {
              code: { coding: [{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertensive disorder' }] }
            })
          ]),
          medicationRequests: createMockBundle([
            createMockMedicationRequest(patientId, encounterId, {
              medicationCodeableConcept: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '316049', display: 'Lisinopril' }] }
            })
          ]),
          diagnosticReports: createMockBundle([]),
          procedures: createMockBundle([])
        });
      });
    }),

    getOrganizations: vi.fn().mockImplementation(async () => {
      return networkSim.simulateNetworkConditions(() => baseFhirMock.searchOrganizations());
    }),

    getOrganization: vi.fn().mockImplementation(async (id: string) => {
      return networkSim.simulateNetworkConditions(() => baseFhirMock.getOrganization(id));
    }),
  };
};

// Mock FHIR client with direct object creation
vi.mock('../services/fhirClient', () => ({
  fhirClient: {
    // Patient operations
    searchPatients: vi.fn().mockImplementation(() => {
      const mockBundle = createMockBundle([mockPatient, mockPatient2]);
      return Promise.resolve(mockBundle);
    }),
    createPatient: vi.fn().mockImplementation((patient: Omit<Patient, 'id'>) =>
      Promise.resolve({ ...patient, id: `patient-${Date.now()}` })
    ),
    updatePatient: vi.fn().mockImplementation((id: string, patient: Patient) =>
      Promise.resolve({ ...patient, id })
    ),
    deletePatient: vi.fn().mockResolvedValue(undefined),
    getPatient: vi.fn().mockImplementation((id: string) =>
      Promise.resolve(id === 'patient-123' ? mockPatient : { ...mockPatient, id })
    ),

    // Organization operations
    searchOrganizations: vi.fn().mockImplementation(() =>
      Promise.resolve(createMockBundle([mockOrganization, mockOrganization2]))
    ),
    getOrganization: vi.fn().mockImplementation((id: string) => {
      if (id === 'org-1') return Promise.resolve(mockOrganization);
      if (id === 'org-2') return Promise.resolve(mockOrganization2);
      return Promise.resolve({ ...mockOrganization, id });
    }),
    setOrganization: vi.fn(),

    // Encounter operations
    searchEncounters: vi.fn().mockImplementation(() =>
      Promise.resolve(createMockBundle([createMockEncounter('patient-123')]))
    ),
    getPatientEncounters: vi.fn().mockImplementation((patientId: string) => {
      const encounters = [
        createMockEncounter(patientId, { id: 'encounter-1', period: { start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z' } }),
        createMockEncounter(patientId, { id: 'encounter-2', period: { start: '2024-01-10T14:00:00Z', end: '2024-01-10T15:00:00Z' } }),
        createMockEncounter(patientId, { id: 'encounter-3', period: { start: '2024-01-05T09:00:00Z', end: '2024-01-05T10:00:00Z' } })
      ];
      return Promise.resolve(createMockBundle(encounters));
    }),
    createEncounter: vi.fn().mockImplementation((encounter: Omit<Encounter, 'id'>) =>
      Promise.resolve({ ...encounter, id: `encounter-${Date.now()}` })
    ),
    updateEncounter: vi.fn().mockImplementation((id: string, encounter: Encounter) =>
      Promise.resolve({ ...encounter, id })
    ),

    // Generic resource operations
    createResource: vi.fn().mockImplementation(<T extends FHIRResource>(resource: Omit<T, 'id'>) =>
      Promise.resolve({ ...resource, id: `${resource.resourceType.toLowerCase()}-${Date.now()}` } as T)
    ),
    updateResource: vi.fn().mockImplementation(<T extends FHIRResource>(id: string, resource: T) =>
      Promise.resolve({ ...resource, id } as T)
    ),
    deleteResource: vi.fn().mockResolvedValue(undefined),
    searchResource: vi.fn().mockImplementation(() => Promise.resolve(createMockBundle([]))),

    // Clinical data operations
    searchObservations: vi.fn().mockImplementation((query: any) => {
      const patientId = query?.patient || 'patient-123';
      const observations = [
        createMockObservation(patientId, undefined, {
          code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
          valueQuantity: { value: 72, unit: 'beats/min' }
        }),
        createMockObservation(patientId, undefined, {
          code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
          valueQuantity: { value: 120, unit: 'mmHg' }
        })
      ];
      return Promise.resolve(createMockBundle(observations));
    }),
    searchConditions: vi.fn().mockImplementation((query: any) => {
      const patientId = query?.patient || 'patient-123';
      const conditions = [
        createMockCondition(patientId, undefined, {
          code: { coding: [{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertensive disorder' }] }
        })
      ];
      return Promise.resolve(createMockBundle(conditions));
    }),
    searchMedicationRequests: vi.fn().mockImplementation((query: any) => {
      const patientId = query?.patient || 'patient-123';
      const medications = [
        createMockMedicationRequest(patientId, undefined, {
          medicationCodeableConcept: { coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '316049', display: 'Lisinopril' }] }
        })
      ];
      return Promise.resolve(createMockBundle(medications));
    }),
    searchDiagnosticReports: vi.fn().mockImplementation(() => Promise.resolve(createMockBundle([]))),
    searchProcedures: vi.fn().mockImplementation(() => Promise.resolve(createMockBundle([]))),

    // Utility operations
    validateResource: vi.fn().mockImplementation((resource: FHIRResource) => {
      const errors: string[] = [];

      // Basic validation
      if (!resource.resourceType) {
        errors.push('Missing resourceType');
      }

      // Resource-specific validation
      if (resource.resourceType === 'Patient') {
        const patient = resource as Patient;
        if (!patient.name || patient.name.length === 0) {
          errors.push('Patient must have at least one name');
        }
      }

      if (resource.resourceType === 'Encounter') {
        const encounter = resource as Encounter;
        if (!encounter.status) {
          errors.push('Encounter must have a status');
        }
        if (!encounter.subject) {
          errors.push('Encounter must have a subject');
        }
      }

      return Promise.resolve({
        valid: errors.length === 0,
        errors
      });
    }),
    bundleResources: vi.fn().mockImplementation((resources: FHIRResource[]) => {
      const bundle: Bundle<FHIRResource> = {
        resourceType: 'Bundle',
        id: `bundle-${Date.now()}`,
        type: 'collection',
        total: resources.length,
        entry: resources.map((resource, index) => ({
          fullUrl: `http://example.com/fhir/${resource.resourceType}/${resource.id ?? index}`,
          resource
        }))
      };
      return Promise.resolve(bundle);
    }),
  },
}));

// Mock enhanced FHIR client with comprehensive retry and offline support
vi.mock('../services/enhancedFhirClient', () => {
  const enhancedMock = createEnhancedFhirClientMock();
  return {
    enhancedFhirClient: enhancedMock,
    createEnhancedFHIRClient: vi.fn().mockImplementation((config: any) =>
      createEnhancedFhirClientMock({
        isOffline: config?.enableOfflineSupport === false ? false : undefined,
        networkDelay: config?.networkDelay || 0,
        errorRate: config?.errorRate || 0,
        circuitBreakerOpen: config?.enableCircuitBreaker === false ? false : undefined
      })
    ),
    EnhancedFHIRClient: vi.fn().mockImplementation((config: any) =>
      createEnhancedFhirClientMock({
        isOffline: config?.enableOfflineSupport === false ? false : undefined,
        networkDelay: config?.networkDelay || 0,
        errorRate: config?.errorRate || 0,
        circuitBreakerOpen: config?.enableCircuitBreaker === false ? false : undefined
      })
    ),
  };
});

// Mock offline detection hook
vi.mock('../hooks/useOfflineDetection', () => ({
  useOfflineDetection: vi.fn(() => ({
    isOffline: false,
    wasOffline: false,
  })),
}));



// Enhanced Test Wrapper Options Interface
export interface EnhancedTestWrapperOptions {
  // Router configuration
  routing?: {
    initialEntries?: string[];
    useMemoryRouter?: boolean;
  };

  // Authentication state
  auth?: {
    isAuthenticated?: boolean;
    user?: User | null;
    permissions?: string[];
  };

  // Organization context
  organization?: {
    current?: Organization | null;
    available?: Organization[];
    loading?: boolean;
    modalOpen?: boolean;
    error?: string | null;
  };

  // Patient context
  patient?: {
    openPatients?: Map<string, Patient>;
    activePatientId?: string | null;
    searchResults?: Patient[];
    searchLoading?: boolean;
    searchError?: string | null;
    createModalOpen?: boolean;
    createLoading?: boolean;
    createError?: string | null;
  };

  // Notification system
  notifications?: {
    messages?: Notification[];
    maxMessages?: number;
  };

  // Mock configurations
  mocks?: {
    fhirClient?: Partial<MockFhirClient>;
    enhancedClient?: Partial<MockEnhancedFhirClient>;
    apiResponses?: Record<string, any>;
  };

  // Test environment
  environment?: {
    isOffline?: boolean;
    networkDelay?: number;
    errorSimulation?: boolean;
    errorRate?: number;
    timeoutRate?: number;
    circuitBreakerOpen?: boolean;
  };

  // Additional render options
  renderOptions?: Omit<RenderOptions, 'wrapper'>;
}

// Backward compatibility - keep the old interface name as an alias
export type TestWrapperOptions = EnhancedTestWrapperOptions;

// Provider state management utilities
export const createProviderStateManager = (options: EnhancedTestWrapperOptions): {
  routerConfig: any;
  authConfig: any;
  orgConfig: any;
  patientConfig: any;
  notificationConfig: any;
  envConfig: any;
} => {
  const {
    routing = {},
    auth = {},
    organization = {},
    patient = {},
    notifications = {},
    environment = {},
  } = options;

  // Router configuration
  const routerConfig = {
    initialEntries: routing.initialEntries ?? ['/'],
    useMemoryRouter: routing.useMemoryRouter !== false, // Default to true
  };

  // Auth state configuration
  const authConfig = {
    isAuthenticated: auth.isAuthenticated !== false, // Default to true
    user: auth.user ?? mockUser,
    permissions: auth.permissions ?? [],
  };

  // Organization state configuration
  const orgConfig = {
    current: organization.current ?? mockOrganization,
    available: organization.available ?? [mockOrganization],
    loading: organization.loading ?? false,
    modalOpen: organization.modalOpen ?? false,
    error: organization.error || null,
  };

  // Patient state configuration
  const patientConfig = {
    openPatients: patient.openPatients ?? new Map(),
    activePatientId: patient.activePatientId ?? null,
    searchResults: patient.searchResults ?? [],
    searchLoading: patient.searchLoading ?? false,
    searchError: patient.searchError ?? null,
    createModalOpen: patient.createModalOpen || false,
    createLoading: patient.createLoading || false,
    createError: patient.createError || null,
  };

  // Notification state configuration
  const notificationConfig = {
    messages: notifications.messages ?? [],
    maxMessages: notifications.maxMessages ?? 5,
  };

  // Environment configuration
  const envConfig = {
    isOffline: environment.isOffline || false,
    networkDelay: environment.networkDelay || 0,
    errorSimulation: environment.errorSimulation || false,
    errorRate: environment.errorRate || 0,
    timeoutRate: environment.timeoutRate || 0,
    circuitBreakerOpen: environment.circuitBreakerOpen || false,
  };

  return {
    routerConfig,
    authConfig,
    orgConfig,
    patientConfig,
    notificationConfig,
    envConfig,
  };
};

// Enhanced test wrapper component creation
function createTestWrapper(options: EnhancedTestWrapperOptions = {}) {
  const stateManager = createProviderStateManager(options);
  const { routerConfig, authConfig, envConfig } = stateManager;

  // Mock localStorage for auth persistence
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => {
      if (key === 'fhir-auth' && authConfig.isAuthenticated && authConfig.user) {
        return JSON.stringify({
          isAuthenticated: authConfig.isAuthenticated,
          user: authConfig.user
        });
      }
      return null;
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });

  // Mock network conditions if specified
  if (envConfig.isOffline) {
    vi.mock('../hooks/useOfflineDetection', () => ({
      useOfflineDetection: vi.fn(() => ({
        isOffline: true,
        wasOffline: true,
      })),
    }));
  }

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    const RouterComponent = routerConfig.useMemoryRouter ? MemoryRouter : BrowserRouter;
    const routerProps = routerConfig.useMemoryRouter ? { initialEntries: routerConfig.initialEntries } : {};

    return (
      <RouterComponent {...routerProps}>
        <NotificationProvider>
          <AuthProvider>
            <OrganizationProvider>
              <PatientProvider>
                {children}
              </PatientProvider>
            </OrganizationProvider>
          </AuthProvider>
        </NotificationProvider>
      </RouterComponent>
    );
  };
}

// Enhanced custom render function that includes all providers
export function renderWithProviders(
  ui: React.ReactElement,
  options: EnhancedTestWrapperOptions = {}
): ReturnType<typeof render> {
  const { renderOptions, ...wrapperOptions } = options;
  const Wrapper = createTestWrapper(wrapperOptions);

  return render(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  });
}

// Utility to render with authenticated user
export function renderWithAuth(
  ui: React.ReactElement,
  options: EnhancedTestWrapperOptions = {}
): ReturnType<typeof render> {
  return renderWithProviders(ui, {
    auth: {
      isAuthenticated: true,
      user: mockUser,
      permissions: ['healthcare-professional'],
      ...options.auth,
    },
    organization: {
      current: mockOrganization,
      available: [mockOrganization],
      loading: false,
      modalOpen: false,
      error: null,
      ...options.organization,
    },
    ...options,
  });
}

// Utility to render without authentication
export function renderWithoutAuth(
  ui: React.ReactElement,
  options: EnhancedTestWrapperOptions = {}
): ReturnType<typeof render> {
  return renderWithProviders(ui, {
    auth: {
      isAuthenticated: false,
      user: null,
      permissions: [],
      ...options.auth,
    },
    organization: {
      current: null,
      available: [],
      loading: false,
      modalOpen: false,
      error: null,
      ...options.organization,
    },
    ...options,
  });
}

// Utility to render with specific organization context
export function renderWithOrganization(
  ui: React.ReactElement,
  organization: Organization,
  options: EnhancedTestWrapperOptions = {}
): ReturnType<typeof render> {
  return renderWithProviders(ui, {
    organization: {
      current: organization,
      available: [organization],
      loading: false,
      modalOpen: false,
      error: null,
      ...options.organization,
    },
    ...options,
  });
}

// Utility to render with patient context
export function renderWithPatient(
  ui: React.ReactElement,
  patient: Patient,
  options: EnhancedTestWrapperOptions = {}
): ReturnType<typeof render> {
  const openPatients = new Map([[patient.id!, patient]]);

  return renderWithProviders(ui, {
    patient: {
      openPatients,
      activePatientId: patient.id!,
      searchResults: [],
      searchLoading: false,
      searchError: null,
      createModalOpen: false,
      createLoading: false,
      createError: null,
      ...options.patient,
    },
    ...options,
  });
}

// Utility to render with multiple patients
export function renderWithMultiplePatients(
  ui: React.ReactElement,
  patients: Patient[],
  activePatientId?: string,
  options: EnhancedTestWrapperOptions = {}
): ReturnType<typeof render> {
  const openPatients = new Map(patients.map(p => [p.id!, p]));
  const activeId = activePatientId ?? (patients.length > 0 ? patients[0].id! : null);

  return renderWithProviders(ui, {
    patient: {
      openPatients,
      activePatientId: activeId,
      searchResults: patients,
      searchLoading: false,
      searchError: null,
      createModalOpen: false,
      createLoading: false,
      createError: null,
      ...options.patient,
    },
    ...options,
  });
}

// Utility to render with notifications
export function renderWithNotifications(
  ui: React.ReactElement,
  notifications: Notification[],
  options: EnhancedTestWrapperOptions = {}
): ReturnType<typeof render> {
  return renderWithProviders(ui, {
    notifications: {
      messages: notifications,
      maxMessages: 5,
      ...options.notifications,
    },
    ...options,
  });
}

// Utility to render with offline environment
export function renderWithOfflineEnvironment(
  ui: React.ReactElement,
  options: EnhancedTestWrapperOptions = {}
): ReturnType<typeof render> {
  return renderWithProviders(ui, {
    environment: {
      isOffline: true,
      networkDelay: 1000,
      errorSimulation: false,
      ...options.environment,
    },
    ...options,
  });
}

// Mock fetch for FHIR API calls
export function mockFhirApi(): { mockFetch: ReturnType<typeof vi.fn>; cleanup: () => void } {
  const mockFetch = vi.fn();

  // Default successful responses
  mockFetch.mockImplementation((url: string, options?: RequestInit) => {
    const method = options?.method || 'GET';

    if (method === 'GET' && url.includes('/Patient')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(createMockBundle([mockPatient])),
      });
    }

    if (method === 'GET' && url.includes('/Organization')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(createMockBundle([mockOrganization])),
      });
    }

    if (method === 'POST') {
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          ...mockPatient,
          id: `patient-${Date.now()}`,
        }),
      });
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
  });

  global.fetch = mockFetch;

  const cleanup = () => {
    if (global.fetch && vi.isMockFunction(global.fetch)) {
      (global.fetch as ReturnType<typeof vi.fn>).mockRestore();
    }
  };

  return { mockFetch, cleanup };
}

// Enhanced cleanup function for tests
export function cleanupMocks(): void {
  vi.clearAllMocks();

  // Reset localStorage mock
  const mockLocalStorage = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });

  // Reset fetch mock if it exists
  if (global.fetch && vi.isMockFunction(global.fetch)) {
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  }

  // Reset any environment mocks
  vi.clearAllTimers();
  vi.useRealTimers();
}

// Utility to setup mock timers for async operations
export function setupMockTimers(): { cleanup: () => void; advanceTime: (ms: number) => void } {
  vi.useFakeTimers();
  return {
    advanceTime: (ms: number) => vi.advanceTimersByTime(ms),
    cleanup: () => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    },
  };
}

// Utility to create mock provider configurations
export function createMockProviderConfig(overrides: Partial<EnhancedTestWrapperOptions> = {}): EnhancedTestWrapperOptions {
  return {
    routing: {
      initialEntries: ['/'],
      useMemoryRouter: true,
    },
    auth: {
      isAuthenticated: true,
      user: mockUser,
      permissions: ['healthcare-professional'],
    },
    organization: {
      current: mockOrganization,
      available: [mockOrganization],
      loading: false,
      modalOpen: false,
      error: null,
    },
    patient: {
      openPatients: new Map(),
      activePatientId: null,
      searchResults: [],
      searchLoading: false,
      searchError: null,
      createModalOpen: false,
      createLoading: false,
      createError: null,
    },
    notifications: {
      messages: [],
      maxMessages: 5,
    },
    environment: {
      isOffline: false,
      networkDelay: 0,
      errorSimulation: false,
    },
    ...overrides,
  };
}

// Test debugging utilities
export const debugTestState = (options: EnhancedTestWrapperOptions): void => {
  const stateManager = createProviderStateManager(options);
  console.warn('Test State Configuration:', {
    router: stateManager.routerConfig,
    auth: stateManager.authConfig,
    organization: stateManager.orgConfig,
    patient: stateManager.patientConfig,
    notifications: stateManager.notificationConfig,
    environment: stateManager.envConfig,
  });
};

// Utility to wait for async operations with custom timeout
export const waitForAsync = async (
  callback: () => void | Promise<void>,
  timeout: number = 5000
): Promise<void> => {
  const { waitFor } = await import('@testing-library/react');
  return waitFor(callback, { timeout });
};

// Utility to simulate network delays in tests
export const simulateNetworkDelay = (ms: number = 100): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Async operation management utilities
export interface AsyncTestConfig {
  timeouts: {
    default: number;
    network: number;
    rendering: number;
    userInteraction: number;
    dataLoading: number;
  };
  retries: {
    maxAttempts: number;
    backoffMs: number;
    conditions: string[];
  };
  waitStrategies: {
    elementAppearance: { timeout: number; interval: number };
    dataLoading: { timeout: number; interval: number };
    networkResponse: { timeout: number; interval: number };
  };
}

export const defaultAsyncTestConfig: AsyncTestConfig = {
  timeouts: {
    default: 5000,
    network: 10000,
    rendering: 3000,
    userInteraction: 2000,
    dataLoading: 8000,
  },
  retries: {
    maxAttempts: 3,
    backoffMs: 100,
    conditions: ['NetworkError', 'TimeoutError', 'AbortError'],
  },
  waitStrategies: {
    elementAppearance: { timeout: 3000, interval: 50 },
    dataLoading: { timeout: 8000, interval: 100 },
    networkResponse: { timeout: 10000, interval: 200 },
  },
};

// Async testing utilities
export const asyncTestUtils = {
  /**
   * Wait for data loading to complete
   */
  waitForDataLoading: async (
    callback: () => boolean | Promise<boolean>,
    config: AsyncTestConfig = defaultAsyncTestConfig
  ): Promise<void> => {
    const { waitFor } = await import('@testing-library/react');
    return waitFor(async () => {
      const result = await callback();
      if (!result) {
        throw new Error('Condition not met');
      }
    }, {
      timeout: config.timeouts.dataLoading,
      interval: config.waitStrategies.dataLoading.interval,
    });
  },

  /**
   * Wait for network response simulation
   */
  waitForNetworkResponse: async (
    callback: () => boolean | Promise<boolean>,
    config: AsyncTestConfig = defaultAsyncTestConfig
  ): Promise<void> => {
    const { waitFor } = await import('@testing-library/react');
    return waitFor(async () => {
      const result = await callback();
      if (!result) {
        throw new Error('Condition not met');
      }
    }, {
      timeout: config.timeouts.network,
      interval: config.waitStrategies.networkResponse.interval,
    });
  },

  /**
   * Wait for element to appear with custom timeout
   */
  waitForElementAppearance: async (
    callback: () => boolean | Promise<boolean>,
    config: AsyncTestConfig = defaultAsyncTestConfig
  ): Promise<void> => {
    const { waitFor } = await import('@testing-library/react');
    return waitFor(async () => {
      const result = await callback();
      if (!result) {
        throw new Error('Condition not met');
      }
    }, {
      timeout: config.timeouts.rendering,
      interval: config.waitStrategies.elementAppearance.interval,
    });
  },

  /**
   * Retry async operation with backoff
   */
  retryAsyncOperation: async <T,>(
    operation: () => Promise<T>,
    config: AsyncTestConfig = defaultAsyncTestConfig
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= config.retries.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if error should trigger retry
        const shouldRetry = config.retries.conditions.some(condition =>
          lastError.name.includes(condition) || lastError.message.includes(condition)
        );

        if (!shouldRetry || attempt === config.retries.maxAttempts) {
          throw lastError;
        }

        // Wait before retry with exponential backoff
        const delay = config.retries.backoffMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  },

  /**
   * Create timeout promise for operations
   */
  withTimeout: async <T,>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string = 'Operation timed out'
  ): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  },

  /**
   * Simulate flaky network conditions for testing
   */
  simulateFlakyNetwork: async <T,>(
    operation: () => Promise<T>,
    failureRate: number = 0.3,
    maxRetries: number = 3
  ): Promise<T> => {
    let attempts = 0;

    while (attempts < maxRetries) {
      attempts++;

      // Simulate network failure
      if (Math.random() < failureRate) {
        if (attempts === maxRetries) {
          throw new Error('NetworkError: Simulated network failure');
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempts));
        continue;
      }

      // Simulate network delay
      await simulateNetworkDelay(50 + Math.random() * 200);

      return operation();
    }

    throw new Error('NetworkError: Max retries exceeded');
  },
};

// Performance optimization helpers for test execution
export const testPerformanceUtils = {
  /**
   * Measure test execution time
   */
  measureExecutionTime: async <T,>(
    operation: () => Promise<T>,
    label: string = 'Operation'
  ): Promise<{ result: T; duration: number }> => {
    const startTime = performance.now();
    const result = await operation();
    const duration = performance.now() - startTime;

    console.warn(`${label} took ${duration.toFixed(2)}ms`);

    return { result, duration };
  },

  /**
   * Batch async operations for better performance
   */
  batchAsyncOperations: async <T,>(
    operations: (() => Promise<T>)[],
    batchSize: number = 5
  ): Promise<T[]> => {
    const results: T[] = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
    }

    return results;
  },

  /**
   * Optimize test data loading
   */
  preloadTestData: async (
    dataLoaders: Record<string, () => Promise<any>>
  ): Promise<Record<string, any>> => {
    const entries = Object.entries(dataLoaders);
    const results = await Promise.all(
      entries.map(async ([key, loader]) => [key, await loader()])
    );

    return Object.fromEntries(results);
  },
};

// Debugging utilities for async operations
export const asyncDebugUtils = {
  /**
   * Log async operation progress
   */
  logAsyncProgress: (operation: string, stage: string, data?: any) => {
    console.warn(`[ASYNC DEBUG] ${operation} - ${stage}`, data ?? '');
  },

  /**
   * Track pending promises for debugging
   */
  trackPromises: (() => {
    const pendingPromises = new Set<Promise<any>>();

    return {
      add: <T,>(promise: Promise<T>, label: string = 'Unknown'): Promise<T> => {
        pendingPromises.add(promise);
        console.warn(`[PROMISE TRACKER] Added: ${label} (Total: ${pendingPromises.size})`);

        void promise.finally(() => {
          pendingPromises.delete(promise);
          console.warn(`[PROMISE TRACKER] Resolved: ${label} (Remaining: ${pendingPromises.size})`);
        });

        return promise;
      },

      getPendingCount: () => pendingPromises.size,

      waitForAll: async (timeout: number = 5000) => {
        const startTime = Date.now();

        while (pendingPromises.size > 0 && Date.now() - startTime < timeout) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        if (pendingPromises.size > 0) {
          console.warn(`[PROMISE TRACKER] ${pendingPromises.size} promises still pending after timeout`);
        }
      },
    };
  })(),

  /**
   * Monitor test environment state
   */
  monitorTestState: (interval: number = 1000) => {
    const monitor = setInterval(() => {
      console.warn('[TEST STATE MONITOR]', {
        pendingPromises: asyncDebugUtils.trackPromises.getPendingCount(),
        localStorage: Object.keys(localStorage).length,
        timers: vi.getTimerCount?.() || 'N/A',
      });
    }, interval);

    return () => clearInterval(monitor);
  },
};

// Export all mock data and utilities (functions already exported above)

// Re-export testing library utilities with additional custom utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export commonly used testing utilities
export { vi } from 'vitest';
export { expect } from 'vitest';
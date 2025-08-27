import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../contexts/AuthContext';
import { OrganizationProvider } from '../contexts/OrganizationContext';
import { PatientProvider } from '../contexts/PatientContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import type { User, Organization, Patient } from '../types';
import { ok } from 'assert';
import { ok } from 'assert';
import { ok } from 'assert';
import { ok } from 'assert';
import { T } from 'vitest/dist/chunks/reporters.d.BFLkQcL6.js';
import { ok } from 'assert';
import { ok } from 'assert';
import { ok } from 'assert';
import { ok } from 'assert';
import { T } from 'vitest/dist/chunks/reporters.d.BFLkQcL6.js';

// Mock FHIR client
vi.mock('../services/fhirClient', () => ({
  fhirClient: {
    searchPatients: vi.fn().mockResolvedValue({ entry: [] }),
    createPatient: vi.fn().mockResolvedValue({ id: 'patient-123', resourceType: 'Patient' }),
    searchOrganizations: vi.fn().mockResolvedValue({ entry: [] }),
    setOrganization: vi.fn(),
    getPatient: vi.fn().mockResolvedValue({ id: 'patient-123', resourceType: 'Patient' }),
    searchEncounters: vi.fn().mockResolvedValue({ entry: [] }),
    createEncounter: vi.fn().mockResolvedValue({ id: 'encounter-123', resourceType: 'Encounter' }),
    searchObservations: vi.fn().mockResolvedValue({ entry: [] }),
    searchConditions: vi.fn().mockResolvedValue({ entry: [] }),
    searchMedicationRequests: vi.fn().mockResolvedValue({ entry: [] }),
    searchDiagnosticReports: vi.fn().mockResolvedValue({ entry: [] }),
    searchProcedures: vi.fn().mockResolvedValue({ entry: [] }),
  },
}));

// Mock enhanced FHIR client
vi.mock('../services/enhancedFhirClient', () => ({
  enhancedFhirClient: {
    checkConnection: vi.fn().mockResolvedValue(true),
    processOfflineQueue: vi.fn().mockResolvedValue(undefined),
    isOffline: vi.fn().mockReturnValue(false),
    queueOperation: vi.fn(),
  },
}));

// Mock offline detection hook
vi.mock('../hooks/useOfflineDetection', () => ({
  useOfflineDetection: vi.fn(() => ({
    isOffline: false,
    wasOffline: false,
  })),
}));

// Default mock data
export const mockUser: User = {
  id: 'user-123',
  username: 'demo-user',
  name: 'Demo User',
  email: 'demo@example.com',
  roles: ['healthcare-professional'],
};

export const mockOrganization: Organization = {
  resourceType: 'Organization',
  id: 'org-123',
  name: 'Test Healthcare Organization',
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
      value: 'contact@testhealthcare.org',
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

// Test wrapper options
export interface TestWrapperOptions {
  // Router options
  initialEntries?: string[];
  useMemoryRouter?: boolean;
  
  // Auth options
  isAuthenticated?: boolean;
  user?: User | null;
  
  // Organization options
  currentOrganization?: Organization | null;
  organizations?: Organization[];
  
  // Patient options
  openPatients?: Map<string, Patient>;
  activePatientId?: string | null;
  
  // Additional render options
  renderOptions?: Omit<RenderOptions, 'wrapper'>;
}

// Create test wrapper component
function createTestWrapper(options: TestWrapperOptions = {}) {
  const {
    initialEntries = ['/'],
    useMemoryRouter = true,
    isAuthenticated = true,
    user = mockUser,
    currentOrganization = mockOrganization,
    organizations = [mockOrganization],
    openPatients = new Map(),
    activePatientId = null,
  } = options;

  // Mock localStorage for auth persistence
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => {
      if (key === 'fhir-auth' && isAuthenticated && user) {
        return JSON.stringify({ isAuthenticated, user });
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

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    const RouterComponent = useMemoryRouter ? MemoryRouter : BrowserRouter;
    const routerProps = useMemoryRouter ? { initialEntries } : {};

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

// Custom render function that includes all providers
export function renderWithProviders(
  ui: React.ReactElement,
  options: TestWrapperOptions = {}
) {
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
  options: TestWrapperOptions = {}
) {
  return renderWithProviders(ui, {
    isAuthenticated: true,
    user: mockUser,
    currentOrganization: mockOrganization,
    organizations: [mockOrganization],
    ...options,
  });
}

// Utility to render without authentication
export function renderWithoutAuth(
  ui: React.ReactElement,
  options: TestWrapperOptions = {}
) {
  return renderWithProviders(ui, {
    isAuthenticated: false,
    user: null,
    currentOrganization: null,
    organizations: [],
    ...options,
  });
}

// Utility to render with specific organization context
export function renderWithOrganization(
  ui: React.ReactElement,
  organization: Organization,
  options: TestWrapperOptions = {}
) {
  return renderWithProviders(ui, {
    currentOrganization: organization,
    organizations: [organization],
    ...options,
  });
}

// Utility to render with patient context
export function renderWithPatient(
  ui: React.ReactElement,
  patient: Patient,
  options: TestWrapperOptions = {}
) {
  const openPatients = new Map([[patient.id!, patient]]);
  
  return renderWithProviders(ui, {
    openPatients,
    activePatientId: patient.id!,
    ...options,
  });
}

// Utility to create mock FHIR responses
export const createMockBundle = <T>(resources: T[]) => ({
  resourceType: 'Bundle' as const,
  id: `bundle-${Date.now()}`,
  type: 'searchset' as const,
  total: resources.length,
  entry: resources.map((resource, index) => ({
    fullUrl: `http://example.com/fhir/${(resource as any).resourceType}/${(resource as any).id || index}`,
    resource,
  })),
});

// Mock fetch for FHIR API calls
export function mockFhirApi() {
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
  return mockFetch;
}

// Cleanup function for tests
export function cleanupMocks() {
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
}

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
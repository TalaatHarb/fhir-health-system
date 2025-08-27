import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../contexts/AuthContext';
import { OrganizationProvider } from '../contexts/OrganizationContext';
import { PatientProvider } from '../contexts/PatientContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import type { User, Organization, Patient, Notification, NotificationAction } from '../types';

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
  checkConnection: ReturnType<typeof vi.fn>;
  processOfflineQueue: ReturnType<typeof vi.fn>;
  isOffline: ReturnType<typeof vi.fn>;
  queueOperation: ReturnType<typeof vi.fn>;
  retryFailedOperations: ReturnType<typeof vi.fn>;
  getQueueStatus: ReturnType<typeof vi.fn>;
}

// Complete FHIR client mock with all required methods
export const createCompleteFhirClientMock = (): MockFhirClient => ({
  // Patient operations
  searchPatients: vi.fn().mockResolvedValue({ entry: [] }),
  createPatient: vi.fn().mockResolvedValue({ id: 'patient-123', resourceType: 'Patient' }),
  updatePatient: vi.fn().mockResolvedValue({ id: 'patient-123', resourceType: 'Patient' }),
  deletePatient: vi.fn().mockResolvedValue(undefined),
  getPatient: vi.fn().mockResolvedValue({ id: 'patient-123', resourceType: 'Patient' }),
  
  // Organization operations
  searchOrganizations: vi.fn().mockResolvedValue({ entry: [] }),
  getOrganization: vi.fn().mockResolvedValue({ id: 'org-123', resourceType: 'Organization' }),
  setOrganization: vi.fn(),
  
  // Encounter operations
  searchEncounters: vi.fn().mockResolvedValue({ entry: [] }),
  getPatientEncounters: vi.fn().mockResolvedValue({ entry: [] }),
  createEncounter: vi.fn().mockResolvedValue({ id: 'encounter-123', resourceType: 'Encounter' }),
  updateEncounter: vi.fn().mockResolvedValue({ id: 'encounter-123', resourceType: 'Encounter' }),
  
  // Generic resource operations
  createResource: vi.fn().mockResolvedValue({ id: 'resource-123', resourceType: 'Resource' }),
  updateResource: vi.fn().mockResolvedValue({ id: 'resource-123', resourceType: 'Resource' }),
  deleteResource: vi.fn().mockResolvedValue(undefined),
  searchResource: vi.fn().mockResolvedValue({ entry: [] }),
  
  // Clinical data operations
  searchObservations: vi.fn().mockResolvedValue({ entry: [] }),
  searchConditions: vi.fn().mockResolvedValue({ entry: [] }),
  searchMedicationRequests: vi.fn().mockResolvedValue({ entry: [] }),
  searchDiagnosticReports: vi.fn().mockResolvedValue({ entry: [] }),
  searchProcedures: vi.fn().mockResolvedValue({ entry: [] }),
  
  // Utility operations
  validateResource: vi.fn().mockResolvedValue({ valid: true, errors: [] }),
  bundleResources: vi.fn().mockResolvedValue({ resourceType: 'Bundle', entry: [] }),
});

// Complete enhanced FHIR client mock
export const createEnhancedFhirClientMock = (): MockEnhancedFhirClient => ({
  checkConnection: vi.fn().mockResolvedValue(true),
  processOfflineQueue: vi.fn().mockResolvedValue(undefined),
  isOffline: vi.fn().mockReturnValue(false),
  queueOperation: vi.fn(),
  retryFailedOperations: vi.fn().mockResolvedValue([]),
  getQueueStatus: vi.fn().mockReturnValue({ pending: 0, failed: 0 }),
});

// Mock FHIR client with direct object creation
vi.mock('../services/fhirClient', () => ({
  fhirClient: {
    // Patient operations
    searchPatients: vi.fn().mockResolvedValue({ entry: [] }),
    createPatient: vi.fn().mockResolvedValue({ id: 'patient-123', resourceType: 'Patient' }),
    updatePatient: vi.fn().mockResolvedValue({ id: 'patient-123', resourceType: 'Patient' }),
    deletePatient: vi.fn().mockResolvedValue(undefined),
    getPatient: vi.fn().mockResolvedValue({ id: 'patient-123', resourceType: 'Patient' }),
    
    // Organization operations
    searchOrganizations: vi.fn().mockResolvedValue({ entry: [] }),
    getOrganization: vi.fn().mockResolvedValue({ id: 'org-123', resourceType: 'Organization' }),
    setOrganization: vi.fn(),
    
    // Encounter operations
    searchEncounters: vi.fn().mockResolvedValue({ entry: [] }),
    getPatientEncounters: vi.fn().mockResolvedValue({ entry: [] }),
    createEncounter: vi.fn().mockResolvedValue({ id: 'encounter-123', resourceType: 'Encounter' }),
    updateEncounter: vi.fn().mockResolvedValue({ id: 'encounter-123', resourceType: 'Encounter' }),
    
    // Generic resource operations
    createResource: vi.fn().mockResolvedValue({ id: 'resource-123', resourceType: 'Resource' }),
    updateResource: vi.fn().mockResolvedValue({ id: 'resource-123', resourceType: 'Resource' }),
    deleteResource: vi.fn().mockResolvedValue(undefined),
    searchResource: vi.fn().mockResolvedValue({ entry: [] }),
    
    // Clinical data operations
    searchObservations: vi.fn().mockResolvedValue({ entry: [] }),
    searchConditions: vi.fn().mockResolvedValue({ entry: [] }),
    searchMedicationRequests: vi.fn().mockResolvedValue({ entry: [] }),
    searchDiagnosticReports: vi.fn().mockResolvedValue({ entry: [] }),
    searchProcedures: vi.fn().mockResolvedValue({ entry: [] }),
    
    // Utility operations
    validateResource: vi.fn().mockResolvedValue({ valid: true, errors: [] }),
    bundleResources: vi.fn().mockResolvedValue({ resourceType: 'Bundle', entry: [] }),
  },
}));

// Mock enhanced FHIR client with direct object creation
vi.mock('../services/enhancedFhirClient', () => ({
  enhancedFhirClient: {
    checkConnection: vi.fn().mockResolvedValue(true),
    processOfflineQueue: vi.fn().mockResolvedValue(undefined),
    isOffline: vi.fn().mockReturnValue(false),
    queueOperation: vi.fn(),
    retryFailedOperations: vi.fn().mockResolvedValue([]),
    getQueueStatus: vi.fn().mockReturnValue({ pending: 0, failed: 0 }),
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

// Additional mock data for comprehensive testing
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
  title: 'Error Notification',
  message: 'This is a test error notification',
  timestamp: new Date(),
  duration: 8000,
};

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
  };
  
  // Additional render options
  renderOptions?: Omit<RenderOptions, 'wrapper'>;
}

// Backward compatibility - keep the old interface name as an alias
export type TestWrapperOptions = EnhancedTestWrapperOptions;

// Provider state management utilities
export const createProviderStateManager = (options: EnhancedTestWrapperOptions) => {
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
    initialEntries: routing.initialEntries || ['/'],
    useMemoryRouter: routing.useMemoryRouter !== false, // Default to true
  };

  // Auth state configuration
  const authConfig = {
    isAuthenticated: auth.isAuthenticated !== false, // Default to true
    user: auth.user || mockUser,
    permissions: auth.permissions || [],
  };

  // Organization state configuration
  const orgConfig = {
    current: organization.current || mockOrganization,
    available: organization.available || [mockOrganization],
    loading: organization.loading || false,
    modalOpen: organization.modalOpen || false,
    error: organization.error || null,
  };

  // Patient state configuration
  const patientConfig = {
    openPatients: patient.openPatients || new Map(),
    activePatientId: patient.activePatientId || null,
    searchResults: patient.searchResults || [],
    searchLoading: patient.searchLoading || false,
    searchError: patient.searchError || null,
    createModalOpen: patient.createModalOpen || false,
    createLoading: patient.createLoading || false,
    createError: patient.createError || null,
  };

  // Notification state configuration
  const notificationConfig = {
    messages: notifications.messages || [],
    maxMessages: notifications.maxMessages || 5,
  };

  // Environment configuration
  const envConfig = {
    isOffline: environment.isOffline || false,
    networkDelay: environment.networkDelay || 0,
    errorSimulation: environment.errorSimulation || false,
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
  const { routerConfig, authConfig, orgConfig, patientConfig, notificationConfig, envConfig } = stateManager;

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
  options: EnhancedTestWrapperOptions = {}
) {
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
) {
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
) {
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
) {
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
) {
  const openPatients = new Map(patients.map(p => [p.id!, p]));
  const activeId = activePatientId || (patients.length > 0 ? patients[0].id! : null);
  
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
) {
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
) {
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

// Enhanced cleanup function for tests
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

  // Reset fetch mock if it exists
  if (global.fetch && vi.isMockFunction(global.fetch)) {
    global.fetch.mockReset();
  }

  // Reset any environment mocks
  vi.clearAllTimers();
  vi.useRealTimers();
}

// Utility to setup mock timers for async operations
export function setupMockTimers() {
  vi.useFakeTimers();
  return {
    advanceTimers: (ms: number) => vi.advanceTimersByTime(ms),
    runAllTimers: () => vi.runAllTimers(),
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
export const debugTestState = (options: EnhancedTestWrapperOptions) => {
  const stateManager = createProviderStateManager(options);
  console.log('Test State Configuration:', {
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
) => {
  const { waitFor } = await import('@testing-library/react');
  return waitFor(callback, { timeout });
};

// Utility to simulate network delays in tests
export const simulateNetworkDelay = (ms: number = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Export all mock data and utilities (functions already exported above)

// Re-export testing library utilities with additional custom utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export commonly used testing utilities
export { vi } from 'vitest';
export { expect } from 'vitest';
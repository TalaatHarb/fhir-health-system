import { FHIRClient, type FHIRClientConfig, type FHIRError } from './fhirClient';
import { withRetry, retryConfigs, fhirRetryCondition, CircuitBreaker } from '../utils/retryMechanism';
import { offlineUtils } from '../hooks/useOfflineDetection';
import type { 
  Patient, 
  Organization, 
  Encounter, 
  Bundle, 
  FHIRResource,
  ResourceType,
  PatientSearchQuery,
  EncounterSearchQuery,
  ResourceSearchQuery
} from '../types/fhir';

export interface EnhancedFHIRClientConfig extends FHIRClientConfig {
  enableRetry?: boolean;
  enableCircuitBreaker?: boolean;
  enableOfflineSupport?: boolean;
  retryConfig?: typeof retryConfigs.standard;
  circuitBreakerConfig?: {
    failureThreshold?: number;
    recoveryTimeout?: number;
  };
  onError?: (error: FHIRError, operation: string) => void;
  onRetry?: (attempt: number, error: FHIRError, operation: string) => void;
  onOffline?: (operation: string) => void;
}

/**
 * Enhanced FHIR Client with error handling, retry mechanisms, and offline support
 */
export class EnhancedFHIRClient extends FHIRClient {
  private circuitBreaker?: CircuitBreaker;
  private enableRetry: boolean;
  private enableOfflineSupport: boolean;
  private retryConfig: typeof retryConfigs.standard;
  private onError?: (error: FHIRError, operation: string) => void;
  private onRetry?: (attempt: number, error: FHIRError, operation: string) => void;
  private onOffline?: (operation: string) => void;

  constructor(config: EnhancedFHIRClientConfig) {
    super(config);
    
    this.enableRetry = config.enableRetry ?? true;
    this.enableOfflineSupport = config.enableOfflineSupport ?? true;
    this.retryConfig = config.retryConfig ?? retryConfigs.standard;
    this.onError = config.onError;
    this.onRetry = config.onRetry;
    this.onOffline = config.onOffline;

    if (config.enableCircuitBreaker ?? true) {
      const cbConfig = config.circuitBreakerConfig ?? {};
      this.circuitBreaker = new CircuitBreaker(
        cbConfig.failureThreshold,
        cbConfig.recoveryTimeout
      );
    }
  }

  /**
   * Execute operation with error handling, retry, and circuit breaker
   */
  private async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string,
    cacheKey?: string
  ): Promise<T> {
    const executeOperation = async (): Promise<T> => {
      if (this.circuitBreaker) {
        return this.circuitBreaker.execute(operation);
      }
      return operation();
    };

    try {
      if (this.enableRetry) {
        return await withRetry(executeOperation, {
          ...this.retryConfig,
          retryCondition: fhirRetryCondition,
          onRetry: (attempt, error) => {
            this.onRetry?.(attempt, error as FHIRError, operationName);
          },
        });
      } else {
        return await executeOperation();
      }
    } catch (error) {
      const fhirError = error as FHIRError;
      this.onError?.(fhirError, operationName);

      // Handle offline scenarios
      if (this.enableOfflineSupport && this.isNetworkError(error)) {
        this.onOffline?.(operationName);
        
        // Try to return cached data if available
        if (cacheKey) {
          const cachedData = offlineUtils.getOfflineData<T>(cacheKey);
          if (cachedData) {
            return cachedData;
          }
        }
      }

      throw fhirError;
    }
  }

  /**
   * Check if error is a network-related error
   */
  private isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      return error.name === 'NetworkError' || 
             error.name === 'AbortError' || 
             error.message.includes('fetch') ||
             error.message.includes('timeout');
    }
    return false;
  }

  /**
   * Cache successful responses for offline use
   */
  private cacheResponse<T>(cacheKey: string, data: T): void {
    if (this.enableOfflineSupport) {
      offlineUtils.storeOfflineData(cacheKey, data);
    }
  }

  // Enhanced Patient Operations

  async searchPatients(query: PatientSearchQuery = {}): Promise<Bundle<Patient>> {
    const cacheKey = `patients-search-${JSON.stringify(query)}`;
    
    const result = await this.executeWithErrorHandling(
      () => super.searchPatients(query),
      'searchPatients',
      cacheKey
    );

    this.cacheResponse(cacheKey, result);
    return result;
  }

  async getPatient(id: string): Promise<Patient> {
    const cacheKey = `patient-${id}`;
    
    const result = await this.executeWithErrorHandling(
      () => super.getPatient(id),
      'getPatient',
      cacheKey
    );

    this.cacheResponse(cacheKey, result);
    return result;
  }

  async createPatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
    return this.executeWithErrorHandling(
      async () => {
        const result = await super.createPatient(patient);
        
        // Clear related caches
        this.clearPatientCaches();
        
        return result;
      },
      'createPatient'
    );
  }

  async updatePatient(id: string, patient: Patient): Promise<Patient> {
    return this.executeWithErrorHandling(
      async () => {
        const result = await super.updatePatient(id, patient);
        
        // Update caches
        this.cacheResponse(`patient-${id}`, result);
        this.clearPatientCaches();
        
        return result;
      },
      'updatePatient'
    );
  }

  // Enhanced Encounter Operations

  async searchEncounters(query: EncounterSearchQuery = {}): Promise<Bundle<Encounter>> {
    const cacheKey = `encounters-search-${JSON.stringify(query)}`;
    
    const result = await this.executeWithErrorHandling(
      () => super.searchEncounters(query),
      'searchEncounters',
      cacheKey
    );

    this.cacheResponse(cacheKey, result);
    return result;
  }

  async getPatientEncounters(patientId: string, options: { count?: number; sort?: string } = {}): Promise<Bundle<Encounter>> {
    const cacheKey = `patient-encounters-${patientId}-${JSON.stringify(options)}`;
    
    const result = await this.executeWithErrorHandling(
      () => super.getPatientEncounters(patientId, options),
      'getPatientEncounters',
      cacheKey
    );

    this.cacheResponse(cacheKey, result);
    return result;
  }

  async getEncounter(id: string): Promise<Encounter> {
    const cacheKey = `encounter-${id}`;
    
    const result = await this.executeWithErrorHandling(
      () => super.getEncounter(id),
      'getEncounter',
      cacheKey
    );

    this.cacheResponse(cacheKey, result);
    return result;
  }

  async createEncounter(encounter: Omit<Encounter, 'id'>): Promise<Encounter> {
    return this.executeWithErrorHandling(
      async () => {
        const result = await super.createEncounter(encounter);
        
        // Clear related caches
        if (encounter.subject?.reference) {
          this.clearEncounterCaches(encounter.subject.reference.split('/')[1]);
        }
        
        return result;
      },
      'createEncounter'
    );
  }

  // Enhanced Resource Operations

  async getResource<T extends FHIRResource>(resourceType: ResourceType, id: string): Promise<T> {
    const cacheKey = `resource-${resourceType}-${id}`;
    
    const result = await this.executeWithErrorHandling(
      () => super.getResource<T>(resourceType, id),
      'getResource',
      cacheKey
    );

    this.cacheResponse(cacheKey, result);
    return result;
  }

  async createResource<T extends FHIRResource>(resource: Omit<T, 'id'>): Promise<T> {
    return this.executeWithErrorHandling(
      async () => {
        const result = await super.createResource(resource);
        
        // Clear related caches
        this.clearResourceCaches(resource.resourceType as ResourceType);
        
        return result;
      },
      'createResource'
    );
  }

  async searchResources<T extends FHIRResource>(
    resourceType: ResourceType,
    query: ResourceSearchQuery = {}
  ): Promise<Bundle<T>> {
    const cacheKey = `resources-${resourceType}-${JSON.stringify(query)}`;
    
    const result = await this.executeWithErrorHandling(
      () => super.searchResources<T>(resourceType, query),
      'searchResources',
      cacheKey
    );

    this.cacheResponse(cacheKey, result);
    return result;
  }

  async getEncounterResources(encounterId: string): Promise<{
    observations: Bundle<any>;
    conditions: Bundle<any>;
    medicationRequests: Bundle<any>;
    diagnosticReports: Bundle<any>;
    procedures: Bundle<any>;
  }> {
    const cacheKey = `encounter-resources-${encounterId}`;
    
    const result = await this.executeWithErrorHandling(
      () => super.getEncounterResources(encounterId),
      'getEncounterResources',
      cacheKey
    );

    this.cacheResponse(cacheKey, result);
    return result;
  }

  // Enhanced Organization Operations

  async getOrganizations(): Promise<Bundle<Organization>> {
    const cacheKey = 'organizations';
    
    const result = await this.executeWithErrorHandling(
      () => super.getOrganizations(),
      'getOrganizations',
      cacheKey
    );

    this.cacheResponse(cacheKey, result);
    return result;
  }

  async getOrganization(id: string): Promise<Organization> {
    const cacheKey = `organization-${id}`;
    
    const result = await this.executeWithErrorHandling(
      () => super.getOrganization(id),
      'getOrganization',
      cacheKey
    );

    this.cacheResponse(cacheKey, result);
    return result;
  }

  // Enhanced Utility Methods

  async checkConnection(): Promise<boolean> {
    try {
      return await this.executeWithErrorHandling(
        () => super.checkConnection(),
        'checkConnection'
      );
    } catch {
      return false;
    }
  }

  // Cache Management Methods

  private clearPatientCaches(): void {
    if (!this.enableOfflineSupport) return;
    
    // Clear patient search caches
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('offline-patients-search-')) {
        localStorage.removeItem(key);
      }
    });
  }

  private clearEncounterCaches(patientId?: string): void {
    if (!this.enableOfflineSupport) return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('offline-encounters-search-') || 
          (patientId && key.startsWith(`offline-patient-encounters-${patientId}-`))) {
        localStorage.removeItem(key);
      }
    });
  }

  private clearResourceCaches(resourceType: ResourceType): void {
    if (!this.enableOfflineSupport) return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`offline-resources-${resourceType}-`)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Clear all cached data
   */
  clearAllCaches(): void {
    if (!this.enableOfflineSupport) return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('offline-')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerState(): 'closed' | 'open' | 'half-open' | 'disabled' {
    return this.circuitBreaker?.getState() ?? 'disabled';
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker?.reset();
  }

  /**
   * Process offline queue when connection is restored
   */
  async processOfflineQueue(): Promise<void> {
    if (!this.enableOfflineSupport) return;

    await offlineUtils.processOfflineQueue(async (operation) => {
      switch (operation.type) {
        case 'createPatient':
          await this.createPatient(operation.data as Omit<Patient, 'id'>);
          break;
        case 'updatePatient':
          const { id, patient } = operation.data as { id: string; patient: Patient };
          await this.updatePatient(id, patient);
          break;
        case 'createEncounter':
          await this.createEncounter(operation.data as Omit<Encounter, 'id'>);
          break;
        case 'createResource':
          await this.createResource(operation.data as Omit<FHIRResource, 'id'>);
          break;
        // Add more operation types as needed
      }
    });
  }
}

/**
 * Create enhanced FHIR client instance
 */
export const createEnhancedFHIRClient = (config: EnhancedFHIRClientConfig): EnhancedFHIRClient => {
  return new EnhancedFHIRClient(config);
};

/**
 * Default enhanced FHIR client instance
 */
export const enhancedFhirClient = createEnhancedFHIRClient({
  baseUrl: 'http://localhost:3001/fhir',
  headers: {
    'Content-Type': 'application/fhir+json',
    'Accept': 'application/fhir+json'
  },
  enableRetry: true,
  enableCircuitBreaker: true,
  enableOfflineSupport: true,
  retryConfig: retryConfigs.standard,
});
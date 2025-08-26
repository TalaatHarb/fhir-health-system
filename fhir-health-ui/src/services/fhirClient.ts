import type {
  Patient,
  Organization,
  Encounter,
  Observation,
  Condition,
  MedicationRequest,
  DiagnosticReport,
  Procedure,
  Bundle,
  FHIRResource,
  ResourceType,
  PatientSearchQuery,
  EncounterSearchQuery,
  ResourceSearchQuery
} from '../types/fhir';

// FHIR Client Configuration
export interface FHIRClientConfig {
  baseUrl: string;
  organizationId?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

// FHIR Error Types
export interface FHIRError extends Error {
  status?: number;
  resourceType?: 'OperationOutcome';
  issue?: OperationOutcomeIssue[];
}

export interface OperationOutcomeIssue {
  severity: 'fatal' | 'error' | 'warning' | 'information';
  code: string;
  details?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  diagnostics?: string;
  location?: string[];
  expression?: string[];
}

// HTTP Response wrapper
interface FHIRResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

/**
 * FHIR R4 Client for healthcare data operations
 * Provides methods for CRUD operations on FHIR resources
 */
export class FHIRClient {
  private config: FHIRClientConfig;
  private defaultHeaders: Record<string, string>;

  constructor(config: FHIRClientConfig) {
    this.config = {
      timeout: 30000,
      ...config
    };
    
    this.defaultHeaders = {
      'Content-Type': 'application/fhir+json',
      'Accept': 'application/fhir+json',
      ...config.headers
    };
  }

  /**
   * Update client configuration
   */
  updateConfig(config: Partial<FHIRClientConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.headers) {
      this.defaultHeaders = { ...this.defaultHeaders, ...config.headers };
    }
  }

  /**
   * Make HTTP request to FHIR server
   */
  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<FHIRResponse<T>> {
    const url = `${this.config.baseUrl}/${endpoint.replace(/^\//, '')}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      
      return {
        data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.config.timeout}ms`);
        }
        // If it's already a FHIRError, re-throw it as-is
        if ('status' in error && typeof error.status === 'number') {
          throw error;
        }
        throw this.createFHIRError(error.message, 0);
      }
      throw error;
    }
  }

  /**
   * Handle error responses from FHIR server
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let operationOutcome: any = null;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/fhir+json') || contentType?.includes('application/json')) {
        operationOutcome = await response.json();
        
        if (operationOutcome.resourceType === 'OperationOutcome' && operationOutcome.issue) {
          const issues = operationOutcome.issue
            .map((issue: OperationOutcomeIssue) => issue.diagnostics || issue.details?.text || issue.code)
            .filter(Boolean);
          
          if (issues.length > 0) {
            errorMessage = issues.join('; ');
          }
        }
      }
    } catch {
      // If we can't parse the error response, use the default message
    }

    const error = this.createFHIRError(errorMessage, response.status);
    if (operationOutcome?.resourceType === 'OperationOutcome') {
      error.resourceType = 'OperationOutcome';
      error.issue = operationOutcome.issue;
    }
    
    throw error;
  }

  /**
   * Create a standardized FHIR error
   */
  private createFHIRError(message: string, status: number): FHIRError {
    const error = new Error(message) as FHIRError;
    error.name = 'FHIRError';
    error.status = status;
    return error;
  }

  /**
   * Build query string from search parameters
   */
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 0) {
        searchParams.append(key, String(value));
      }
    });
    
    return searchParams.toString();
  }

  // Patient Operations

  /**
   * Search for patients based on query parameters
   */
  async searchPatients(query: PatientSearchQuery = {}): Promise<Bundle<Patient>> {
    const queryString = this.buildQueryString({
      ...query,
      ...(this.config.organizationId && { organization: this.config.organizationId })
    });
    
    const endpoint = `Patient${queryString ? `?${queryString}` : ''}`;
    const response = await this.makeRequest<Bundle<Patient>>(endpoint);
    
    return response.data;
  }

  /**
   * Get a specific patient by ID
   */
  async getPatient(id: string): Promise<Patient> {
    const response = await this.makeRequest<Patient>(`Patient/${id}`);
    return response.data;
  }

  /**
   * Create a new patient
   */
  async createPatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
    // Add organization reference if configured
    const patientData = {
      ...patient,
      ...(this.config.organizationId && {
        managingOrganization: {
          reference: `Organization/${this.config.organizationId}`
        }
      })
    };

    const response = await this.makeRequest<Patient>('Patient', {
      method: 'POST',
      body: JSON.stringify(patientData)
    });
    
    return response.data;
  }

  /**
   * Update an existing patient
   */
  async updatePatient(id: string, patient: Patient): Promise<Patient> {
    const response = await this.makeRequest<Patient>(`Patient/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patient)
    });
    
    return response.data;
  }

  /**
   * Delete a patient
   */
  async deletePatient(id: string): Promise<void> {
    await this.makeRequest(`Patient/${id}`, {
      method: 'DELETE'
    });
  }

  // Encounter Operations

  /**
   * Search for encounters
   */
  async searchEncounters(query: EncounterSearchQuery = {}): Promise<Bundle<Encounter>> {
    const queryString = this.buildQueryString(query);
    const endpoint = `Encounter${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<Bundle<Encounter>>(endpoint);
    return response.data;
  }

  /**
   * Get encounters for a specific patient
   */
  async getPatientEncounters(patientId: string, options: { count?: number; sort?: string } = {}): Promise<Bundle<Encounter>> {
    const query: EncounterSearchQuery = {
      patient: patientId,
      _count: options.count || 50,
      ...(options.sort && { _sort: options.sort })
    };
    
    return this.searchEncounters(query);
  }

  /**
   * Get a specific encounter by ID
   */
  async getEncounter(id: string): Promise<Encounter> {
    const response = await this.makeRequest<Encounter>(`Encounter/${id}`);
    return response.data;
  }

  /**
   * Create a new encounter
   */
  async createEncounter(encounter: Omit<Encounter, 'id'>): Promise<Encounter> {
    const response = await this.makeRequest<Encounter>('Encounter', {
      method: 'POST',
      body: JSON.stringify(encounter)
    });
    
    return response.data;
  }

  /**
   * Update an existing encounter
   */
  async updateEncounter(id: string, encounter: Encounter): Promise<Encounter> {
    const response = await this.makeRequest<Encounter>(`Encounter/${id}`, {
      method: 'PUT',
      body: JSON.stringify(encounter)
    });
    
    return response.data;
  }

  /**
   * Delete an encounter
   */
  async deleteEncounter(id: string): Promise<void> {
    await this.makeRequest(`Encounter/${id}`, {
      method: 'DELETE'
    });
  }

  // Generic Resource Operations

  /**
   * Get a resource by type and ID
   */
  async getResource<T extends FHIRResource>(resourceType: ResourceType, id: string): Promise<T> {
    const response = await this.makeRequest<T>(`${resourceType}/${id}`);
    return response.data;
  }

  /**
   * Create a new resource
   */
  async createResource<T extends FHIRResource>(resource: Omit<T, 'id'>): Promise<T> {
    const response = await this.makeRequest<T>(resource.resourceType, {
      method: 'POST',
      body: JSON.stringify(resource)
    });
    
    return response.data;
  }

  /**
   * Update an existing resource
   */
  async updateResource<T extends FHIRResource>(id: string, resource: T): Promise<T> {
    const response = await this.makeRequest<T>(`${resource.resourceType}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(resource)
    });
    
    return response.data;
  }

  /**
   * Delete a resource
   */
  async deleteResource(resourceType: ResourceType, id: string): Promise<void> {
    await this.makeRequest(`${resourceType}/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Search for resources of a specific type
   */
  async searchResources<T extends FHIRResource>(
    resourceType: ResourceType,
    query: ResourceSearchQuery = {}
  ): Promise<Bundle<T>> {
    const queryString = this.buildQueryString(query);
    const endpoint = `${resourceType}${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<Bundle<T>>(endpoint);
    return response.data;
  }

  // Specific Resource Type Operations

  /**
   * Get observations for a patient
   */
  async getPatientObservations(patientId: string, options: { 
    category?: string; 
    code?: string; 
    date?: string;
    count?: number;
  } = {}): Promise<Bundle<Observation>> {
    const query: ResourceSearchQuery = {
      patient: patientId,
      _count: options.count || 50,
      ...(options.category && { category: options.category }),
      ...(options.code && { code: options.code }),
      ...(options.date && { date: options.date })
    };
    
    return this.searchResources<Observation>('Observation', query);
  }

  /**
   * Get conditions for a patient
   */
  async getPatientConditions(patientId: string, options: { 
    category?: string; 
    status?: string;
    count?: number;
  } = {}): Promise<Bundle<Condition>> {
    const query: ResourceSearchQuery = {
      patient: patientId,
      _count: options.count || 50,
      ...(options.category && { category: options.category }),
      ...(options.status && { status: options.status })
    };
    
    return this.searchResources<Condition>('Condition', query);
  }

  /**
   * Get medication requests for a patient
   */
  async getPatientMedicationRequests(patientId: string, options: { 
    status?: string;
    count?: number;
  } = {}): Promise<Bundle<MedicationRequest>> {
    const query: ResourceSearchQuery = {
      patient: patientId,
      _count: options.count || 50,
      ...(options.status && { status: options.status })
    };
    
    return this.searchResources<MedicationRequest>('MedicationRequest', query);
  }

  /**
   * Get diagnostic reports for a patient
   */
  async getPatientDiagnosticReports(patientId: string, options: { 
    category?: string; 
    status?: string;
    count?: number;
  } = {}): Promise<Bundle<DiagnosticReport>> {
    const query: ResourceSearchQuery = {
      patient: patientId,
      _count: options.count || 50,
      ...(options.category && { category: options.category }),
      ...(options.status && { status: options.status })
    };
    
    return this.searchResources<DiagnosticReport>('DiagnosticReport', query);
  }

  /**
   * Get procedures for a patient
   */
  async getPatientProcedures(patientId: string, options: { 
    status?: string;
    count?: number;
  } = {}): Promise<Bundle<Procedure>> {
    const query: ResourceSearchQuery = {
      patient: patientId,
      _count: options.count || 50,
      ...(options.status && { status: options.status })
    };
    
    return this.searchResources<Procedure>('Procedure', query);
  }

  /**
   * Get all resources associated with an encounter
   */
  async getEncounterResources(encounterId: string): Promise<{
    observations: Bundle<Observation>;
    conditions: Bundle<Condition>;
    medicationRequests: Bundle<MedicationRequest>;
    diagnosticReports: Bundle<DiagnosticReport>;
    procedures: Bundle<Procedure>;
  }> {
    const encounterQuery = { encounter: encounterId };
    
    const [
      observations,
      conditions,
      medicationRequests,
      diagnosticReports,
      procedures
    ] = await Promise.all([
      this.searchResources<Observation>('Observation', encounterQuery),
      this.searchResources<Condition>('Condition', encounterQuery),
      this.searchResources<MedicationRequest>('MedicationRequest', encounterQuery),
      this.searchResources<DiagnosticReport>('DiagnosticReport', encounterQuery),
      this.searchResources<Procedure>('Procedure', encounterQuery)
    ]);

    return {
      observations,
      conditions,
      medicationRequests,
      diagnosticReports,
      procedures
    };
  }

  // Organization Operations

  /**
   * Get available organizations
   */
  async getOrganizations(): Promise<Bundle<Organization>> {
    const response = await this.makeRequest<Bundle<Organization>>('Organization');
    return response.data;
  }

  /**
   * Get a specific organization by ID
   */
  async getOrganization(id: string): Promise<Organization> {
    const response = await this.makeRequest<Organization>(`Organization/${id}`);
    return response.data;
  }

  // Batch Operations

  /**
   * Execute a batch of operations
   */
  async batch(bundle: Bundle): Promise<Bundle> {
    const response = await this.makeRequest<Bundle>('', {
      method: 'POST',
      body: JSON.stringify(bundle)
    });
    
    return response.data;
  }

  /**
   * Execute a transaction bundle
   */
  async transaction(bundle: Bundle): Promise<Bundle> {
    const transactionBundle = {
      ...bundle,
      type: 'transaction' as const
    };
    
    const response = await this.makeRequest<Bundle>('', {
      method: 'POST',
      body: JSON.stringify(transactionBundle)
    });
    
    return response.data;
  }

  // Utility Methods

  /**
   * Check if the FHIR server is accessible
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.makeRequest('metadata');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get server capability statement
   */
  async getCapabilityStatement(): Promise<any> {
    const response = await this.makeRequest('metadata');
    return response.data;
  }
}

// Default FHIR client instance factory
export const createFHIRClient = (config: FHIRClientConfig): FHIRClient => {
  return new FHIRClient(config);
};
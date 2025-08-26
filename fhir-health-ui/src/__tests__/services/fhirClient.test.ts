import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FHIRClient, createFHIRClient, FHIRError } from '../../services/fhirClient';
import type { Patient, Encounter, Bundle, Organization } from '../../types/fhir';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('FHIRClient', () => {
  let client: FHIRClient;
  const baseConfig = {
    baseUrl: 'https://test-fhir-server.com/fhir',
    organizationId: 'org-123',
    headers: { 'Authorization': 'Bearer test-token' }
  };

  beforeEach(() => {
    client = new FHIRClient(baseConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create client with provided configuration', () => {
      expect(client).toBeInstanceOf(FHIRClient);
    });

    it('should create client using factory function', () => {
      const factoryClient = createFHIRClient(baseConfig);
      expect(factoryClient).toBeInstanceOf(FHIRClient);
    });

    it('should update configuration', () => {
      const newConfig = { baseUrl: 'https://new-server.com/fhir' };
      client.updateConfig(newConfig);
      
      // Test that the new config is used in requests
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ resourceType: 'Patient', id: '123' })
      });

      client.getPatient('123');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://new-server.com/fhir/Patient/123',
        expect.any(Object)
      );
    });
  });

  describe('HTTP Request Handling', () => {
    it('should make successful requests with correct headers', async () => {
      const mockPatient: Patient = {
        resourceType: 'Patient',
        id: '123',
        name: [{ family: 'Doe', given: ['John'] }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(mockPatient)
      });

      const result = await client.getPatient('123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/Patient/123',
        {
          headers: {
            'Content-Type': 'application/fhir+json',
            'Accept': 'application/fhir+json',
            'Authorization': 'Bearer test-token'
          },
          signal: expect.any(AbortSignal)
        }
      );
      expect(result).toEqual(mockPatient);
    });

    it('should handle timeout errors', async () => {
      const shortTimeoutClient = new FHIRClient({ ...baseConfig, timeout: 100 });
      
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('AbortError');
            error.name = 'AbortError';
            reject(error);
          }, 50);
        })
      );

      await expect(shortTimeoutClient.getPatient('123'))
        .rejects.toThrow('Request timeout after 100ms');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getPatient('123'))
        .rejects.toThrow('Network error');
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/fhir+json' }),
        json: () => Promise.resolve({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'not-found',
            diagnostics: 'Patient not found'
          }]
        })
      });

      await expect(client.getPatient('123'))
        .rejects.toThrow('Patient not found');
    });

    it('should handle non-FHIR error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'text/plain' }),
        json: () => Promise.reject(new Error('Not JSON'))
      });

      await expect(client.getPatient('123'))
        .rejects.toThrow('HTTP 500: Internal Server Error');
    });
  });

  describe('Patient Operations', () => {
    const mockPatient: Patient = {
      resourceType: 'Patient',
      id: '123',
      name: [{ family: 'Doe', given: ['John'] }],
      gender: 'male',
      birthDate: '1990-01-01'
    };

    const mockPatientBundle: Bundle<Patient> = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 1,
      entry: [{ resource: mockPatient }]
    };

    it('should search patients with query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(mockPatientBundle)
      });

      const result = await client.searchPatients({ 
        name: 'John Doe', 
        gender: 'male',
        _count: 10 
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/Patient?name=John+Doe&gender=male&_count=10&organization=org-123',
        expect.any(Object)
      );
      expect(result).toEqual(mockPatientBundle);
    });

    it('should get patient by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(mockPatient)
      });

      const result = await client.getPatient('123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/Patient/123',
        expect.any(Object)
      );
      expect(result).toEqual(mockPatient);
    });

    it('should create patient with organization reference', async () => {
      const newPatient = {
        resourceType: 'Patient' as const,
        name: [{ family: 'Smith', given: ['Jane'] }],
        gender: 'female' as const
      };

      const createdPatient = {
        ...newPatient,
        id: '456',
        managingOrganization: { reference: 'Organization/org-123' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers(),
        json: () => Promise.resolve(createdPatient)
      });

      const result = await client.createPatient(newPatient);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/Patient',
        {
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify({
            ...newPatient,
            managingOrganization: { reference: 'Organization/org-123' }
          }),
          signal: expect.any(AbortSignal)
        }
      );
      expect(result).toEqual(createdPatient);
    });

    it('should update patient', async () => {
      const updatedPatient = { ...mockPatient, name: [{ family: 'Updated', given: ['John'] }] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(updatedPatient)
      });

      const result = await client.updatePatient('123', updatedPatient);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/Patient/123',
        {
          method: 'PUT',
          headers: expect.any(Object),
          body: JSON.stringify(updatedPatient),
          signal: expect.any(AbortSignal)
        }
      );
      expect(result).toEqual(updatedPatient);
    });

    it('should delete patient', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
        json: () => Promise.resolve({})
      });

      await client.deletePatient('123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/Patient/123',
        {
          method: 'DELETE',
          headers: expect.any(Object),
          signal: expect.any(AbortSignal)
        }
      );
    });
  });

  describe('Encounter Operations', () => {
    const mockEncounter: Encounter = {
      resourceType: 'Encounter',
      id: 'enc-123',
      status: 'finished',
      class: { code: 'AMB', display: 'Ambulatory' },
      subject: { reference: 'Patient/123' },
      period: { start: '2024-01-01T10:00:00Z', end: '2024-01-01T11:00:00Z' }
    };

    const mockEncounterBundle: Bundle<Encounter> = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 1,
      entry: [{ resource: mockEncounter }]
    };

    it('should search encounters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(mockEncounterBundle)
      });

      const result = await client.searchEncounters({ 
        patient: '123',
        status: 'finished'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/Encounter?patient=123&status=finished',
        expect.any(Object)
      );
      expect(result).toEqual(mockEncounterBundle);
    });

    it('should get patient encounters with sorting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(mockEncounterBundle)
      });

      const result = await client.getPatientEncounters('123', { 
        count: 25, 
        sort: '-date' 
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/Encounter?patient=123&_count=25&_sort=-date',
        expect.any(Object)
      );
      expect(result).toEqual(mockEncounterBundle);
    });

    it('should get encounter by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(mockEncounter)
      });

      const result = await client.getEncounter('enc-123');

      expect(result).toEqual(mockEncounter);
    });

    it('should create encounter', async () => {
      const newEncounter = {
        resourceType: 'Encounter' as const,
        status: 'in-progress' as const,
        class: { code: 'AMB', display: 'Ambulatory' },
        subject: { reference: 'Patient/123' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers(),
        json: () => Promise.resolve({ ...newEncounter, id: 'enc-456' })
      });

      const result = await client.createEncounter(newEncounter);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/Encounter',
        {
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify(newEncounter),
          signal: expect.any(AbortSignal)
        }
      );
      expect(result.id).toBe('enc-456');
    });
  });

  describe('Generic Resource Operations', () => {
    it('should get resource by type and ID', async () => {
      const mockObservation = {
        resourceType: 'Observation',
        id: 'obs-123',
        status: 'final',
        code: { text: 'Blood Pressure' },
        subject: { reference: 'Patient/123' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(mockObservation)
      });

      const result = await client.getResource('Observation', 'obs-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/Observation/obs-123',
        expect.any(Object)
      );
      expect(result).toEqual(mockObservation);
    });

    it('should create resource', async () => {
      const newObservation = {
        resourceType: 'Observation' as const,
        status: 'final' as const,
        code: { text: 'Temperature' },
        subject: { reference: 'Patient/123' },
        valueQuantity: { value: 98.6, unit: 'F' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers(),
        json: () => Promise.resolve({ ...newObservation, id: 'obs-456' })
      });

      const result = await client.createResource(newObservation);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/Observation',
        {
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify(newObservation),
          signal: expect.any(AbortSignal)
        }
      );
      expect(result.id).toBe('obs-456');
    });

    it('should search resources with filters', async () => {
      const mockBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 2,
        entry: [
          { resource: { resourceType: 'Observation', id: 'obs-1' } },
          { resource: { resourceType: 'Observation', id: 'obs-2' } }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(mockBundle)
      });

      const result = await client.searchResources('Observation', {
        patient: '123',
        category: 'vital-signs',
        _count: 20
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/Observation?patient=123&category=vital-signs&_count=20',
        expect.any(Object)
      );
      expect(result).toEqual(mockBundle);
    });
  });

  describe('Specific Resource Type Operations', () => {
    it('should get patient observations with filters', async () => {
      const mockBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 1,
        entry: [{ resource: { resourceType: 'Observation', id: 'obs-123' } }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(mockBundle)
      });

      const result = await client.getPatientObservations('123', {
        category: 'vital-signs',
        code: 'blood-pressure',
        count: 10
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/Observation?patient=123&_count=10&category=vital-signs&code=blood-pressure',
        expect.any(Object)
      );
      expect(result).toEqual(mockBundle);
    });

    it('should get encounter resources', async () => {
      const mockObservations = { resourceType: 'Bundle', type: 'searchset', entry: [] };
      const mockConditions = { resourceType: 'Bundle', type: 'searchset', entry: [] };
      const mockMedications = { resourceType: 'Bundle', type: 'searchset', entry: [] };
      const mockReports = { resourceType: 'Bundle', type: 'searchset', entry: [] };
      const mockProcedures = { resourceType: 'Bundle', type: 'searchset', entry: [] };

      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers(), json: () => Promise.resolve(mockObservations) })
        .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers(), json: () => Promise.resolve(mockConditions) })
        .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers(), json: () => Promise.resolve(mockMedications) })
        .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers(), json: () => Promise.resolve(mockReports) })
        .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers(), json: () => Promise.resolve(mockProcedures) });

      const result = await client.getEncounterResources('enc-123');

      expect(mockFetch).toHaveBeenCalledTimes(5);
      expect(result).toEqual({
        observations: mockObservations,
        conditions: mockConditions,
        medicationRequests: mockMedications,
        diagnosticReports: mockReports,
        procedures: mockProcedures
      });
    });
  });

  describe('Organization Operations', () => {
    const mockOrganization: Organization = {
      resourceType: 'Organization',
      id: 'org-123',
      name: 'Test Hospital',
      active: true
    };

    it('should get organizations', async () => {
      const mockBundle: Bundle<Organization> = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 1,
        entry: [{ resource: mockOrganization }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(mockBundle)
      });

      const result = await client.getOrganizations();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/Organization',
        expect.any(Object)
      );
      expect(result).toEqual(mockBundle);
    });

    it('should get organization by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(mockOrganization)
      });

      const result = await client.getOrganization('org-123');

      expect(result).toEqual(mockOrganization);
    });
  });

  describe('Batch and Transaction Operations', () => {
    it('should execute batch operations', async () => {
      const batchBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'batch',
        entry: [
          {
            request: { method: 'GET', url: 'Patient/123' }
          }
        ]
      };

      const responseBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'batch-response',
        entry: [
          {
            response: { status: '200' },
            resource: { resourceType: 'Patient', id: '123' }
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(responseBundle)
      });

      const result = await client.batch(batchBundle);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/',
        {
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify(batchBundle),
          signal: expect.any(AbortSignal)
        }
      );
      expect(result).toEqual(responseBundle);
    });

    it('should execute transaction operations', async () => {
      const transactionBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'collection',
        entry: [
          {
            request: { method: 'POST', url: 'Patient' },
            resource: { resourceType: 'Patient', name: [{ family: 'Test' }] }
          }
        ]
      };

      const responseBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'transaction-response',
        entry: [
          {
            response: { status: '201' },
            resource: { resourceType: 'Patient', id: '123', name: [{ family: 'Test' }] }
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(responseBundle)
      });

      const result = await client.transaction(transactionBundle);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/',
        {
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify({
            ...transactionBundle,
            type: 'transaction'
          }),
          signal: expect.any(AbortSignal)
        }
      );
      expect(result).toEqual(responseBundle);
    });
  });

  describe('Utility Methods', () => {
    it('should check connection successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ resourceType: 'CapabilityStatement' })
      });

      const result = await client.checkConnection();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-fhir-server.com/fhir/metadata',
        expect.any(Object)
      );
      expect(result).toBe(true);
    });

    it('should handle connection failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.checkConnection();

      expect(result).toBe(false);
    });

    it('should get capability statement', async () => {
      const mockCapability = {
        resourceType: 'CapabilityStatement',
        status: 'active',
        fhirVersion: '4.0.1'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve(mockCapability)
      });

      const result = await client.getCapabilityStatement();

      expect(result).toEqual(mockCapability);
    });
  });

  describe('Error Handling', () => {
    it('should create FHIR error with operation outcome', async () => {
      const operationOutcome = {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'invalid',
            diagnostics: 'Invalid resource format'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/fhir+json' }),
        json: () => Promise.resolve(operationOutcome)
      });

      await expect(client.getPatient('123')).rejects.toMatchObject({
        message: 'Invalid resource format',
        status: 400,
        resourceType: 'OperationOutcome'
      });
    });

    it('should handle multiple issues in operation outcome', async () => {
      const operationOutcome = {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'required',
            diagnostics: 'Missing required field: name'
          },
          {
            severity: 'error',
            code: 'invalid',
            diagnostics: 'Invalid date format'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/fhir+json' }),
        json: () => Promise.resolve(operationOutcome)
      });

      await expect(client.createPatient({ resourceType: 'Patient' }))
        .rejects.toThrow('Missing required field: name; Invalid date format');
    });
  });

  describe('Query String Building', () => {
    it('should build query string correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ resourceType: 'Bundle', type: 'searchset', entry: [] })
      });

      await client.searchPatients({
        name: 'John Doe',
        gender: 'male',
        birthdate: '1990-01-01',
        _count: 10
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('name=John+Doe'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('gender=male'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('birthdate=1990-01-01'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('_count=10'),
        expect.any(Object)
      );
    });

    it('should skip undefined and null values in query string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ resourceType: 'Bundle', type: 'searchset', entry: [] })
      });

      await client.searchPatients({
        name: 'John',
        gender: undefined,
        birthdate: null,
        _count: 0
      });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('name=John');
      expect(calledUrl).not.toContain('gender=');
      expect(calledUrl).not.toContain('birthdate=');
      expect(calledUrl).not.toContain('_count=0');
    });
  });
});
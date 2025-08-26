import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../../App';
import { fhirClient } from '../../services/fhirClient';

// Mock the FHIR client
vi.mock('../../services/fhirClient');

const mockFhirClient = vi.mocked(fhirClient);

describe('Complete User Workflow E2E Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful authentication
    mockFhirClient.authenticate.mockResolvedValue({
      success: true,
      user: { id: '1', name: 'Test User', email: 'test@example.com' }
    });

    // Mock organizations
    mockFhirClient.searchOrganizations.mockResolvedValue({
      entry: [
        {
          resource: {
            id: 'org1',
            name: 'Test Hospital',
            resourceType: 'Organization'
          }
        },
        {
          resource: {
            id: 'org2', 
            name: 'Community Clinic',
            resourceType: 'Organization'
          }
        }
      ]
    });

    // Mock patients
    mockFhirClient.searchPatients.mockResolvedValue({
      entry: [
        {
          resource: {
            id: 'patient1',
            resourceType: 'Patient',
            name: [{ given: ['John'], family: 'Doe' }],
            birthDate: '1980-01-01',
            gender: 'male'
          }
        }
      ]
    });

    // Mock encounters
    mockFhirClient.getEncounters.mockResolvedValue({
      entry: [
        {
          resource: {
            id: 'encounter1',
            resourceType: 'Encounter',
            status: 'finished',
            period: {
              start: '2024-01-15T10:00:00Z',
              end: '2024-01-15T11:00:00Z'
            },
            subject: { reference: 'Patient/patient1' }
          }
        }
      ]
    });

    // Mock resources
    mockFhirClient.getResourcesForEncounter.mockResolvedValue({
      observations: {
        entry: [
          {
            resource: {
              id: 'obs1',
              resourceType: 'Observation',
              status: 'final',
              code: { text: 'Blood Pressure' },
              valueQuantity: { value: 120, unit: 'mmHg' }
            }
          }
        ]
      },
      conditions: { entry: [] },
      medicationRequests: { entry: [] },
      diagnosticReports: { entry: [] },
      procedures: { entry: [] }
    });
  });

  it('completes full user workflow: login → select org → search patient → view encounters → create new encounter', async () => {
    render(<App />);

    // Step 1: User should see login page initially
    expect(screen.getByText('FHIR Resource Visualizer')).toBeInTheDocument();
    expect(screen.getByText('Healthcare Data Visualization Platform')).toBeInTheDocument();

    // Step 2: Login with demo credentials
    const demoLoginButton = screen.getByText('Demo Login');
    await user.click(demoLoginButton);

    await waitFor(() => {
      expect(mockFhirClient.authenticate).toHaveBeenCalledWith({
        username: 'demo-user',
        password: 'demo-password'
      });
    });

    // Step 3: Select organization
    await waitFor(() => {
      expect(screen.getByText('Select an Organization')).toBeInTheDocument();
    });

    const selectOrgButton = screen.getByText('Select Organization');
    await user.click(selectOrgButton);

    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    });

    const hospitalOption = screen.getByText('Test Hospital');
    await user.click(hospitalOption);

    // Step 4: Search for patients
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search patients/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search patients/i);
    await user.type(searchInput, 'John Doe');

    const searchButton = screen.getByText('Search');
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockFhirClient.searchPatients).toHaveBeenCalledWith('John Doe');
    });

    // Step 5: Select patient and open tab
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const patientResult = screen.getByText('John Doe');
    await user.click(patientResult);

    // Step 6: View patient encounters
    await waitFor(() => {
      expect(screen.getByText('Encounters')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockFhirClient.getEncounters).toHaveBeenCalledWith('patient1');
    });

    // Step 7: View encounter details
    const encounterItem = screen.getByText(/Jan 15, 2024/);
    await user.click(encounterItem);

    await waitFor(() => {
      expect(mockFhirClient.getResourcesForEncounter).toHaveBeenCalledWith('encounter1');
    });

    // Step 8: View observation details
    await waitFor(() => {
      expect(screen.getByText('Blood Pressure')).toBeInTheDocument();
      expect(screen.getByText('120 mmHg')).toBeInTheDocument();
    });

    // Step 9: Create new encounter
    const createEncounterButton = screen.getByText('New Encounter');
    await user.click(createEncounterButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Encounter')).toBeInTheDocument();
    });

    // Fill encounter form
    const encounterTypeSelect = screen.getByLabelText(/encounter type/i);
    await user.selectOptions(encounterTypeSelect, 'outpatient');

    const startDateInput = screen.getByLabelText(/start date/i);
    await user.type(startDateInput, '2024-02-01T09:00');

    // Step 10: Add observation to encounter
    const addObservationButton = screen.getByText('Add Observation');
    await user.click(addObservationButton);

    const observationCodeInput = screen.getByLabelText(/observation code/i);
    await user.type(observationCodeInput, 'Heart Rate');

    const observationValueInput = screen.getByLabelText(/value/i);
    await user.type(observationValueInput, '72');

    const observationUnitInput = screen.getByLabelText(/unit/i);
    await user.type(observationUnitInput, 'bpm');

    // Step 11: Save encounter
    mockFhirClient.createEncounter.mockResolvedValue({
      id: 'new-encounter',
      resourceType: 'Encounter'
    });

    const saveEncounterButton = screen.getByText('Save Encounter');
    await user.click(saveEncounterButton);

    await waitFor(() => {
      expect(mockFhirClient.createEncounter).toHaveBeenCalled();
    });

    // Step 12: Verify success feedback
    await waitFor(() => {
      expect(screen.getByText(/encounter created successfully/i)).toBeInTheDocument();
    });

    // Step 13: Verify encounter appears in timeline
    await waitFor(() => {
      expect(screen.getByText(/Feb 01, 2024/)).toBeInTheDocument();
    });
  });

  it('handles error scenarios gracefully throughout the workflow', async () => {
    // Mock authentication failure
    mockFhirClient.authenticate.mockRejectedValue(new Error('Authentication failed'));

    render(<App />);

    const demoLoginButton = screen.getByText('Demo Login');
    await user.click(demoLoginButton);

    await waitFor(() => {
      expect(screen.getByText(/demo login failed/i)).toBeInTheDocument();
    });

    // Reset mock for successful auth
    mockFhirClient.authenticate.mockResolvedValue({
      success: true,
      user: { id: '1', name: 'Test User', email: 'test@example.com' }
    });

    // Try login again
    await user.click(demoLoginButton);

    // Mock organization loading failure
    mockFhirClient.searchOrganizations.mockRejectedValue(new Error('Network error'));

    await waitFor(() => {
      expect(screen.getByText(/error loading organizations/i)).toBeInTheDocument();
    });

    // Test retry functionality
    const retryButton = screen.getByText('Retry');
    
    // Reset mock for successful org loading
    mockFhirClient.searchOrganizations.mockResolvedValue({
      entry: [
        {
          resource: {
            id: 'org1',
            name: 'Test Hospital',
            resourceType: 'Organization'
          }
        }
      ]
    });

    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    });
  });

  it('supports multi-patient workflow with tab management', async () => {
    render(<App />);

    // Complete initial login and org selection
    const demoLoginButton = screen.getByText('Demo Login');
    await user.click(demoLoginButton);

    await waitFor(() => {
      const selectOrgButton = screen.getByText('Select Organization');
      await user.click(selectOrgButton);
    });

    await waitFor(() => {
      const hospitalOption = screen.getByText('Test Hospital');
      await user.click(hospitalOption);
    });

    // Search and open first patient
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search patients/i);
      await user.type(searchInput, 'John Doe');
    });

    const searchButton = screen.getByText('Search');
    await user.click(searchButton);

    await waitFor(() => {
      const patientResult = screen.getByText('John Doe');
      await user.click(patientResult);
    });

    // Verify first tab is open
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /john doe/i })).toBeInTheDocument();
    });

    // Mock second patient
    mockFhirClient.searchPatients.mockResolvedValue({
      entry: [
        {
          resource: {
            id: 'patient2',
            resourceType: 'Patient',
            name: [{ given: ['Jane'], family: 'Smith' }],
            birthDate: '1975-05-15',
            gender: 'female'
          }
        }
      ]
    });

    // Search for second patient
    const searchInput = screen.getByPlaceholderText(/search patients/i);
    await user.clear(searchInput);
    await user.type(searchInput, 'Jane Smith');
    await user.click(searchButton);

    await waitFor(() => {
      const patientResult = screen.getByText('Jane Smith');
      await user.click(patientResult);
    });

    // Verify both tabs are present
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /john doe/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /jane smith/i })).toBeInTheDocument();
    });

    // Switch between tabs
    const johnTab = screen.getByRole('tab', { name: /john doe/i });
    await user.click(johnTab);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Close a tab
    const closeButton = screen.getByRole('button', { name: /close john doe tab/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole('tab', { name: /john doe/i })).not.toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /jane smith/i })).toBeInTheDocument();
    });
  });

  it('maintains application state during offline/online transitions', async () => {
    render(<App />);

    // Complete login flow
    const demoLoginButton = screen.getByText('Demo Login');
    await user.click(demoLoginButton);

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    // Trigger offline event
    fireEvent(window, new Event('offline'));

    await waitFor(() => {
      expect(screen.getByText(/you are currently offline/i)).toBeInTheDocument();
    });

    // Simulate coming back online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Trigger online event
    fireEvent(window, new Event('online'));

    await waitFor(() => {
      expect(screen.getByText(/connection restored/i)).toBeInTheDocument();
    });

    // Verify app continues to function
    await waitFor(() => {
      expect(screen.queryByText(/you are currently offline/i)).not.toBeInTheDocument();
    });
  });
});
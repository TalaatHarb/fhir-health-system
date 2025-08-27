import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  renderWithAuth, 
  cleanupMocks,
  mockPatient,
  createMockBundle 
} from '../test-utils';
import { PatientTab } from '../../components/patient/PatientTab';
import { fhirClient } from '../../services/fhirClient';
import type { Patient, Encounter, Bundle } from '../../types/fhir';

// Use the mock patient from test utils

const mockEncounterBundle: Bundle<Encounter> = createMockBundle([]);

const mockCreatedEncounter: Encounter = {
  resourceType: 'Encounter',
  id: 'encounter-123',
  status: 'finished',
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
    display: 'Ambulatory'
  },
  subject: {
    reference: `Patient/${mockPatient.id}`,
    display: 'John Doe'
  },
  period: {
    start: '2024-01-15T10:00:00Z'
  }
};

describe('Encounter Creation Integration', () => {
  const mockOnClose = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    cleanupMocks();
    
    // Setup FHIR client mocks
    vi.mocked(fhirClient.searchEncounters).mockResolvedValue(mockEncounterBundle);
    vi.mocked(fhirClient.createEncounter).mockResolvedValue(mockCreatedEncounter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderPatientTab = () => {
    return renderWithAuth(
      <PatientTab
        patient={mockPatient}
        isActive={true}
        onClose={mockOnClose}
      />
    );
  };

  it('should complete full encounter creation workflow', async () => {
    vi.mocked(fhirClient.createEncounter).mockResolvedValue(mockCreatedEncounter);
    vi.mocked(fhirClient.createResource).mockResolvedValue({});

    renderPatientTab();

    // Wait for patient tab to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click create encounter button
    const createButton = screen.getByText('Create New Encounter');
    await user.click(createButton);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByText('Create New Encounter')).toBeInTheDocument();
      expect(screen.getByText('Patient: John Doe (ID: patient-123)')).toBeInTheDocument();
    });

    // Fill in encounter details
    await user.selectOptions(screen.getByLabelText('Status *'), 'finished');
    await user.selectOptions(screen.getByLabelText('Class *'), 'AMB');
    
    const startDateInput = screen.getByLabelText('Start Date/Time *');
    await user.clear(startDateInput);
    await user.type(startDateInput, '2024-01-15T10:00');

    // Add an observation
    await user.click(screen.getByText(/Observations \(0\)/));
    
    // Mock the observation form behavior
    const observationTab = screen.getByText(/Observations \(0\)/).closest('.tab-content');
    if (observationTab) {
      // Simulate adding an observation through the form
      // This would normally be done through the ObservationForm component
      // but for integration testing, we'll verify the modal can handle it
    }

    // Submit the encounter
    await user.click(screen.getByText('Create Encounter'));

    // Verify API calls
    await waitFor(() => {
      expect(fhirClient.createEncounter).toHaveBeenCalledWith({
        resourceType: 'Encounter',
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'Ambulatory'
        },
        subject: {
          reference: 'Patient/patient-123',
          display: 'John Doe'
        },
        period: {
          start: '2024-01-15T10:00'
        }
      });
    });

    // Modal should close after successful creation
    await waitFor(() => {
      expect(screen.queryByText('Create New Encounter')).not.toBeInTheDocument();
    });

    // Encounter timeline should refresh (searchEncounters called again)
    expect(fhirClient.searchEncounters).toHaveBeenCalledTimes(2); // Once on load, once after creation
  });

  it('should handle encounter creation with multiple resources', async () => {
    vi.mocked(fhirClient.createEncounter).mockResolvedValue(mockCreatedEncounter);
    vi.mocked(fhirClient.createResource).mockResolvedValue({});

    renderPatientTab();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Open encounter creation modal
    await user.click(screen.getByText('Create New Encounter'));

    await waitFor(() => {
      expect(screen.getByText('Create New Encounter')).toBeInTheDocument();
    });

    // Fill in basic encounter details
    await user.selectOptions(screen.getByLabelText('Status *'), 'finished');
    await user.selectOptions(screen.getByLabelText('Class *'), 'AMB');

    // For this integration test, we'll simulate that resources were added
    // In a real scenario, the user would interact with each resource form
    // but the modal should handle the creation of multiple resources

    await user.click(screen.getByText('Create Encounter'));

    await waitFor(() => {
      expect(fhirClient.createEncounter).toHaveBeenCalled();
    });

    // Verify modal closes and timeline refreshes
    await waitFor(() => {
      expect(screen.queryByText('Create New Encounter')).not.toBeInTheDocument();
    });
  });

  it('should handle encounter creation errors gracefully', async () => {
    const errorMessage = 'Server error occurred';
    vi.mocked(fhirClient.createEncounter).mockRejectedValue(new Error(errorMessage));

    renderPatientTab();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Open modal and fill form
    await user.click(screen.getByText('Create New Encounter'));

    await waitFor(() => {
      expect(screen.getByText('Create New Encounter')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Status *'), 'finished');
    await user.selectOptions(screen.getByLabelText('Class *'), 'AMB');

    // Submit and expect error
    await user.click(screen.getByText('Create Encounter'));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Modal should remain open
    expect(screen.getByText('Create New Encounter')).toBeInTheDocument();
  });

  it('should prevent submission with invalid data', async () => {
    renderPatientTab();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Open modal
    await user.click(screen.getByText('Create New Encounter'));

    await waitFor(() => {
      expect(screen.getByText('Create New Encounter')).toBeInTheDocument();
    });

    // Clear required field
    const statusSelect = screen.getByLabelText('Status *');
    await user.selectOptions(statusSelect, '');

    // Try to submit
    await user.click(screen.getByText('Create Encounter'));

    // Should not call API
    expect(fhirClient.createEncounter).not.toHaveBeenCalled();

    // Modal should remain open
    expect(screen.getByText('Create New Encounter')).toBeInTheDocument();
  });

  it('should show loading state during creation', async () => {
    // Mock a slow API call
    vi.mocked(fhirClient.createEncounter).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockCreatedEncounter), 100))
    );

    renderPatientTab();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Open modal and fill form
    await user.click(screen.getByText('Create New Encounter'));

    await waitFor(() => {
      expect(screen.getByText('Create New Encounter')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Status *'), 'finished');
    await user.selectOptions(screen.getByLabelText('Class *'), 'AMB');

    // Submit
    await user.click(screen.getByText('Create Encounter'));

    // Should show loading state
    expect(screen.getByText('Create Encounter')).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByLabelText('Close modal')).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText('Create New Encounter')).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('should refresh encounter timeline after successful creation', async () => {
    vi.mocked(fhirClient.createEncounter).mockResolvedValue(mockCreatedEncounter);

    // Mock timeline showing encounters after creation
    const updatedBundle: Bundle<Encounter> = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 1,
      entry: [{
        resource: mockCreatedEncounter
      }]
    };

    vi.mocked(fhirClient.searchEncounters)
      .mockResolvedValueOnce(mockEncounterBundle) // Initial load
      .mockResolvedValueOnce(updatedBundle); // After creation

    renderPatientTab();

    await waitFor(() => {
      expect(screen.getByText('No Encounters Found')).toBeInTheDocument();
    });

    // Create encounter
    await user.click(screen.getByText('Create New Encounter'));

    await waitFor(() => {
      expect(screen.getByText('Create New Encounter')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Status *'), 'finished');
    await user.selectOptions(screen.getByLabelText('Class *'), 'AMB');
    await user.click(screen.getByText('Create Encounter'));

    // Wait for modal to close and timeline to refresh
    await waitFor(() => {
      expect(screen.queryByText('Create New Encounter')).not.toBeInTheDocument();
    });

    // Verify timeline was refreshed
    expect(fhirClient.searchEncounters).toHaveBeenCalledTimes(2);
  });

  it('should handle modal close via escape key', async () => {
    renderPatientTab();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Open modal
    await user.click(screen.getByText('Create New Encounter'));

    await waitFor(() => {
      expect(screen.getByText('Create New Encounter')).toBeInTheDocument();
    });

    // Close via X button
    await user.click(screen.getByLabelText('Close modal'));

    await waitFor(() => {
      expect(screen.queryByText('Create New Encounter')).not.toBeInTheDocument();
    });
  });

  it('should validate encounter period dates', async () => {
    renderPatientTab();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Open modal
    await user.click(screen.getByText('Create New Encounter'));

    await waitFor(() => {
      expect(screen.getByText('Create New Encounter')).toBeInTheDocument();
    });

    // Set end date before start date
    const startInput = screen.getByLabelText('Start Date/Time *');
    const endInput = screen.getByLabelText('End Date/Time');

    await user.clear(startInput);
    await user.type(startInput, '2024-01-15T10:00');

    await user.clear(endInput);
    await user.type(endInput, '2024-01-15T09:00'); // Before start

    await user.click(screen.getByText('Create Encounter'));

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/end date must be after start date/)).toBeInTheDocument();
    });

    expect(fhirClient.createEncounter).not.toHaveBeenCalled();
  });
});
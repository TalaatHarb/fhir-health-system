import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EncounterCreateModal } from '../../../components/encounter/EncounterCreateModal';
import { fhirClient } from '../../../services/fhirClient';
import type { Patient, Encounter } from '../../../types/fhir';
import { renderWithProviders} from '../../test-utils';

// Mock the FHIR client
vi.mock('../../../services/fhirClient', () => ({
  fhirClient: {
    createEncounter: vi.fn(),
    createResource: vi.fn()
  }
}));

// Mock the resource form components
vi.mock('../../../components/encounter/forms/ObservationForm', () => ({
  ObservationForm: ({ onAdd, onRemove, observations }: any) => (
    <div data-testid="observation-form">
      <button onClick={() => onAdd({ status: 'final', code: { text: 'Test Observation' } })}>
        Add Test Observation
      </button>
      {observations.map((obs: any, index: number) => (
        <div key={index} data-testid={`observation-${index}`}>
          {obs.code.text}
          <button onClick={() => onRemove(index)}>Remove</button>
        </div>
      ))}
    </div>
  )
}));

vi.mock('../../../components/encounter/forms/ConditionForm', () => ({
  ConditionForm: ({ onAdd, onRemove, conditions }: any) => (
    <div data-testid="condition-form">
      <button onClick={() => onAdd({ code: { text: 'Test Condition' } })}>
        Add Test Condition
      </button>
      {conditions.map((condition: any, index: number) => (
        <div key={index} data-testid={`condition-${index}`}>
          {condition.code.text}
          <button onClick={() => onRemove(index)}>Remove</button>
        </div>
      ))}
    </div>
  )
}));

vi.mock('../../../components/encounter/forms/MedicationRequestForm', () => ({
  MedicationRequestForm: ({ onAdd, onRemove, medicationRequests }: any) => (
    <div data-testid="medication-form">
      <button onClick={() => onAdd({ medicationCodeableConcept: { text: 'Test Medication' } })}>
        Add Test Medication
      </button>
      {medicationRequests.map((med: any, index: number) => (
        <div key={index} data-testid={`medication-${index}`}>
          {med.medicationCodeableConcept.text}
          <button onClick={() => onRemove(index)}>Remove</button>
        </div>
      ))}
    </div>
  )
}));

vi.mock('../../../components/encounter/forms/DiagnosticReportForm', () => ({
  DiagnosticReportForm: ({ onAdd, onRemove, diagnosticReports }: any) => (
    <div data-testid="diagnostic-form">
      <button onClick={() => onAdd({ code: { text: 'Test Diagnostic Report' } })}>
        Add Test Diagnostic Report
      </button>
      {diagnosticReports.map((report: any, index: number) => (
        <div key={index} data-testid={`diagnostic-${index}`}>
          {report.code.text}
          <button onClick={() => onRemove(index)}>Remove</button>
        </div>
      ))}
    </div>
  )
}));

vi.mock('../../../components/encounter/forms/ProcedureForm', () => ({
  ProcedureForm: ({ onAdd, onRemove, procedures }: any) => (
    <div data-testid="procedure-form">
      <button onClick={() => onAdd({ code: { text: 'Test Procedure' } })}>
        Add Test Procedure
      </button>
      {procedures.map((procedure: any, index: number) => (
        <div key={index} data-testid={`procedure-${index}`}>
          {procedure.code.text}
          <button onClick={() => onRemove(index)}>Remove</button>
        </div>
      ))}
    </div>
  )
}));

const mockPatient: Patient = {
  resourceType: 'Patient',
  id: 'patient-123',
  name: [{
    given: ['John'],
    family: 'Doe'
  }],
  gender: 'male',
  birthDate: '1980-01-01'
};

const mockEncounter: Encounter = {
  resourceType: 'Encounter',
  id: 'encounter-123',
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
    start: '2024-01-15T10:00:00Z'
  }
};

describe('EncounterCreateModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (isOpen = true) => {
    return renderWithProviders(
      <EncounterCreateModal
        patient={mockPatient}
        isOpen={isOpen}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
  };

  it('should not render when closed', () => {
    renderModal(false);
    expect(screen.queryByText('Create Encounter')).not.toBeInTheDocument();
  });

  it('should render modal when open', () => {
    renderModal();
    expect(screen.getByRole('heading', { name: 'Create Encounter' })).toBeInTheDocument();
    expect(screen.getByText('Patient Name: John Doe (Patient ID: patient-123)')).toBeInTheDocument();
  });

  it('should display all tabs', () => {
    renderModal();
    expect(screen.getByText('Encounter Details')).toBeInTheDocument();
    expect(screen.getByText(/Observations \(0\)/)).toBeInTheDocument();
    expect(screen.getByText(/Conditions \(0\)/)).toBeInTheDocument();
    expect(screen.getByText(/Medications \(0\)/)).toBeInTheDocument();
    expect(screen.getByText(/Diagnostics \(0\)/)).toBeInTheDocument();
    expect(screen.getByText(/Procedures \(0\)/)).toBeInTheDocument();
  });

  it('should show encounter form by default', () => {
    renderModal();
    expect(screen.getByLabelText('Status *')).toBeInTheDocument();
    expect(screen.getByLabelText('Class *')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date/Time *')).toBeInTheDocument();
  });

  it('should switch between tabs', async () => {
    renderModal();
    
    // Click on Observations tab
    await user.click(screen.getByText(/Observations \(0\)/));
    expect(screen.getByTestId('observation-form')).toBeInTheDocument();
    
    // Click on Conditions tab
    await user.click(screen.getByText(/Conditions \(0\)/));
    expect(screen.getByTestId('condition-form')).toBeInTheDocument();
  });

  it('should update resource counts when resources are added', async () => {
    renderModal();
    
    // Switch to observations tab and add an observation
    await user.click(screen.getByText(/Observations \(0\)/));
    await user.click(screen.getByText('Add Test Observation'));
    
    // Check that the tab count updated
    expect(screen.getByText(/Observations \(1\)/)).toBeInTheDocument();
    
    // Switch to conditions tab and add a condition
    await user.click(screen.getByText(/Conditions \(0\)/));
    await user.click(screen.getByText('Add Test Condition'));
    
    expect(screen.getByText(/Conditions \(1\)/)).toBeInTheDocument();
  });

  it('should validate required encounter fields', async () => {
    renderModal();
    
    // Clear the start date field (which is required)
    const startDateInput = screen.getByLabelText('Start Date/Time *');
    await user.clear(startDateInput);
    
    // Try to submit
    await user.click(screen.getByRole('button', { name: 'Create Encounter' }));
    
    // Should show validation error and not call the API
    await waitFor(() => {
      expect(screen.getByText(/Encounter start date is required/)).toBeInTheDocument();
    });
    expect(fhirClient.createEncounter).not.toHaveBeenCalled();
  });

  it('should create encounter with basic data', async () => {
    vi.mocked(fhirClient.createEncounter).mockResolvedValue(mockEncounter);
    
    renderModal();
    
    // Fill in encounter details
    await user.selectOptions(screen.getByLabelText('Status *'), 'finished');
    await user.selectOptions(screen.getByLabelText('Class *'), 'AMB');
    
    const startDateInput = screen.getByLabelText('Start Date/Time *');
    await user.clear(startDateInput);
    await user.type(startDateInput, '2024-01-15T10:00');
    
    // Submit
    await user.click(screen.getByRole('button', { name: 'Create Encounter' }));
    
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
    
    expect(mockOnSuccess).toHaveBeenCalledWith(mockEncounter);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should create encounter with resources', async () => {
    vi.mocked(fhirClient.createEncounter).mockResolvedValue(mockEncounter);
    vi.mocked(fhirClient.createResource).mockResolvedValue({});
    
    renderModal();
    
    // Add an observation
    await user.click(screen.getByText(/Observations \(0\)/));
    await user.click(screen.getByText('Add Test Observation'));
    
    // Add a condition
    await user.click(screen.getByText(/Conditions \(0\)/));
    await user.click(screen.getByText('Add Test Condition'));
    
    // Go back to encounter details and submit
    await user.click(screen.getByText('Encounter Details'));
    await user.click(screen.getByRole('button', { name: 'Create Encounter' }));
    
    await waitFor(() => {
      expect(fhirClient.createEncounter).toHaveBeenCalled();
      expect(fhirClient.createResource).toHaveBeenCalledTimes(2); // One for observation, one for condition
    });
  });

  it('should handle encounter creation error', async () => {
    const errorMessage = 'Failed to create encounter';
    vi.mocked(fhirClient.createEncounter).mockRejectedValue(new Error(errorMessage));
    
    renderModal();
    
    // Submit
    await user.click(screen.getByRole('button', { name: 'Create Encounter' }));
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should close modal when cancel is clicked', async () => {
    renderModal();
    
    await user.click(screen.getByText('Cancel'));
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when X button is clicked', async () => {
    renderModal();
    
    await user.click(screen.getByLabelText('Close'));
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should prevent closing when loading', async () => {
    vi.mocked(fhirClient.createEncounter).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderModal();
    
    // Start submission (will be loading)
    await user.click(screen.getByRole('button', { name: 'Create Encounter' }));
    
    // Try to close - should be disabled
    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeDisabled();
    
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeDisabled();
  });

  it('should show resource summary in footer', async () => {
    renderModal();
    
    // Add resources
    await user.click(screen.getByText(/Observations \(0\)/));
    await user.click(screen.getByText('Add Test Observation'));
    
    await user.click(screen.getByText(/Conditions \(0\)/));
    await user.click(screen.getByText('Add Test Condition'));
    
    // Check footer shows resource count
    expect(screen.getByText('2 resource(s) will be created with this encounter')).toBeInTheDocument();
  });

  it('should validate end date is after start date', async () => {
    renderModal();
    
    const startDateInput = screen.getByLabelText('Start Date/Time *');
    const endDateInput = screen.getByLabelText('End Date/Time');
    
    await user.clear(startDateInput);
    await user.type(startDateInput, '2024-01-15T10:00');
    
    await user.clear(endDateInput);
    await user.type(endDateInput, '2024-01-15T09:00'); // Before start date
    
    await user.click(screen.getByRole('button', { name: 'Create Encounter' }));
    
    await waitFor(() => {
      expect(screen.getByText(/Encounter end date must be after start date/)).toBeInTheDocument();
    });
    
    expect(fhirClient.createEncounter).not.toHaveBeenCalled();
  });

  it('should handle resource removal', async () => {
    renderModal();
    
    // Add an observation
    await user.click(screen.getByText(/Observations \(0\)/));
    await user.click(screen.getByText('Add Test Observation'));
    
    expect(screen.getByText(/Observations \(1\)/)).toBeInTheDocument();
    expect(screen.getByTestId('observation-0')).toBeInTheDocument();
    
    // Remove the observation
    await user.click(screen.getByText('Remove'));
    
    expect(screen.getByText(/Observations \(0\)/)).toBeInTheDocument();
    expect(screen.queryByTestId('observation-0')).not.toBeInTheDocument();
  });

  it('should populate encounter type display correctly', async () => {
    renderModal();
    
    const typeSelect = screen.getByLabelText('Encounter Type');
    await user.selectOptions(typeSelect, '185349003');
    
    // The display should be handled internally by the component
    expect(typeSelect).toHaveValue('185349003');
  });

  it('should handle reason code and text', async () => {
    vi.mocked(fhirClient.createEncounter).mockResolvedValue(mockEncounter);
    
    renderModal();
    
    const reasonCodeInput = screen.getByLabelText('Reason Code');
    const reasonTextInput = screen.getByLabelText('Reason Description');
    
    await user.type(reasonCodeInput, '185349003');
    await user.type(reasonTextInput, 'Annual check-up');
    
    await user.click(screen.getByRole('button', { name: 'Create Encounter' }));
    
    await waitFor(() => {
      expect(fhirClient.createEncounter).toHaveBeenCalledWith(
        expect.objectContaining({
          reasonCode: [{
            coding: [{
              system: 'http://snomed.info/sct',
              code: '185349003',
              display: 'Annual check-up'
            }],
            text: 'Annual check-up'
          }]
        })
      );
    });
  });
});
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ResourceViewer } from '../../../components/resource/ResourceViewer';
import type { Observation, Condition, MedicationRequest, DiagnosticReport, Procedure, AnyFHIRResource } from '../../../types/fhir';

describe('ResourceViewer', () => {
  const mockObservation: Observation = {
    resourceType: 'Observation',
    id: 'obs-123',
    status: 'final',
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '8480-6',
        display: 'Systolic blood pressure',
      }],
      text: 'Systolic BP',
    },
    subject: {
      reference: 'Patient/patient-123',
    },
    valueQuantity: {
      value: 120,
      unit: 'mmHg',
      system: 'http://unitsofmeasure.org',
      code: 'mm[Hg]',
    },
    effectiveDateTime: '2024-01-15T10:30:00Z',
  };

  const mockCondition: Condition = {
    resourceType: 'Condition',
    id: 'condition-123',
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: 'active',
        display: 'Active',
      }],
    },
    code: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '38341003',
        display: 'Hypertension',
      }],
      text: 'High blood pressure',
    },
    subject: {
      reference: 'Patient/patient-123',
    },
    onsetDateTime: '2023-06-01',
  };

  const mockMedicationRequest: MedicationRequest = {
    resourceType: 'MedicationRequest',
    id: 'med-123',
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '314076',
        display: 'Lisinopril 10 MG Oral Tablet',
      }],
      text: 'Lisinopril 10mg',
    },
    subject: {
      reference: 'Patient/patient-123',
    },
    authoredOn: '2024-01-15',
  };

  const mockDiagnosticReport: DiagnosticReport = {
    resourceType: 'DiagnosticReport',
    id: 'report-123',
    status: 'final',
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '58410-2',
        display: 'Complete blood count (hemogram) panel',
      }],
      text: 'CBC',
    },
    subject: {
      reference: 'Patient/patient-123',
    },
    effectiveDateTime: '2024-01-15T10:15:00Z',
    conclusion: 'All values within normal limits',
  };

  const mockProcedure: Procedure = {
    resourceType: 'Procedure',
    id: 'proc-123',
    status: 'completed',
    code: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '5880005',
        display: 'Physical examination procedure',
      }],
      text: 'Physical exam',
    },
    subject: {
      reference: 'Patient/patient-123',
    },
    performedDateTime: '2024-01-15T10:45:00Z',
  };

  const mockUnsupportedResource: AnyFHIRResource = {
    resourceType: 'Patient',
    id: 'patient-123',
  } as any;

  it('renders observation viewer for observation resource', () => {
    render(<ResourceViewer resource={mockObservation} viewMode="summary" />);

    expect(screen.getByText('Systolic BP')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('mmHg')).toBeInTheDocument();
  });

  it('renders condition viewer for condition resource', () => {
    render(<ResourceViewer resource={mockCondition} viewMode="summary" />);

    expect(screen.getByText('High blood pressure')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders medication request viewer for medication request resource', () => {
    render(<ResourceViewer resource={mockMedicationRequest} viewMode="summary" />);

    expect(screen.getByText('Lisinopril 10mg')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders diagnostic report viewer for diagnostic report resource', () => {
    render(<ResourceViewer resource={mockDiagnosticReport} viewMode="summary" />);

    expect(screen.getByText('CBC')).toBeInTheDocument();
    expect(screen.getByText('Final')).toBeInTheDocument();
  });

  it('renders procedure viewer for procedure resource', () => {
    render(<ResourceViewer resource={mockProcedure} viewMode="summary" />);

    expect(screen.getByText('Physical exam')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders generic viewer for unsupported resource types', () => {
    render(<ResourceViewer resource={mockUnsupportedResource} viewMode="summary" />);

    expect(screen.getByText('Patient')).toBeInTheDocument();
    expect(screen.getByText('ID: patient-123')).toBeInTheDocument();
    expect(screen.getByText('Resource type "Patient" is not yet supported for detailed viewing.')).toBeInTheDocument();
  });

  it('shows view details button in summary mode when onSelect is provided', () => {
    const mockOnSelect = vi.fn();
    render(<ResourceViewer resource={mockObservation} viewMode="summary" onSelect={mockOnSelect} />);

    const viewDetailsButton = screen.getByText('View Details');
    expect(viewDetailsButton).toBeInTheDocument();

    fireEvent.click(viewDetailsButton);
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('does not show view details button when onSelect is not provided', () => {
    render(<ResourceViewer resource={mockObservation} viewMode="summary" />);

    expect(screen.queryByText('View Details')).not.toBeInTheDocument();
  });

  it('renders detailed view when viewMode is detailed', () => {
    render(<ResourceViewer resource={mockObservation} viewMode="detailed" />);

    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.queryByText('View Details')).not.toBeInTheDocument();
  });

  it('shows raw resource data for unsupported resource types in detailed mode', () => {
    render(<ResourceViewer resource={mockUnsupportedResource} viewMode="detailed" />);

    expect(screen.getByText('Raw Resource Data:')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'pre' && content.includes('Patient');
    })).toBeInTheDocument();
  });

  it('defaults to summary view mode when not specified', () => {
    const mockOnSelect = vi.fn();
    render(<ResourceViewer resource={mockObservation} onSelect={mockOnSelect} />);

    // Should show view details button (summary mode behavior)
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('handles resources without IDs gracefully', () => {
    const resourceWithoutId = { ...mockObservation, id: undefined };
    render(<ResourceViewer resource={resourceWithoutId} viewMode="detailed" />);

    expect(screen.getByText('ID: Unknown')).toBeInTheDocument();
  });

  it('renders correct icons for different resource types', () => {
    const { rerender } = render(<ResourceViewer resource={mockObservation} viewMode="summary" />);
    
    // Check that SVG icon is rendered (we can't easily test the specific icon content)
    expect(document.querySelector('svg')).toBeInTheDocument();

    // Test different resource types
    rerender(<ResourceViewer resource={mockCondition} viewMode="summary" />);
    expect(document.querySelector('svg')).toBeInTheDocument();

    rerender(<ResourceViewer resource={mockMedicationRequest} viewMode="summary" />);
    expect(document.querySelector('svg')).toBeInTheDocument();

    rerender(<ResourceViewer resource={mockDiagnosticReport} viewMode="summary" />);
    expect(document.querySelector('svg')).toBeInTheDocument();

    rerender(<ResourceViewer resource={mockProcedure} viewMode="summary" />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});
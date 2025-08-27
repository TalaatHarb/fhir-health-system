import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ObservationViewer } from '../../../components/resource/ObservationViewer';
import type { Observation } from '../../../types/fhir';

describe('ObservationViewer', () => {
  const mockQuantityObservation: Observation = {
    resourceType: 'Observation',
    id: 'obs-123',
    status: 'final',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs',
      }],
      text: 'Vital Signs',
    }],
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
    issued: '2024-01-15T10:35:00Z',
    performer: [{
      reference: 'Practitioner/practitioner-123',
      display: 'Dr. Smith',
    }],
    referenceRange: [{
      low: {
        value: 90,
        unit: 'mmHg',
        system: 'http://unitsofmeasure.org',
        code: 'mm[Hg]',
      },
      high: {
        value: 140,
        unit: 'mmHg',
        system: 'http://unitsofmeasure.org',
        code: 'mm[Hg]',
      },
    }],
    interpretation: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
        code: 'N',
        display: 'Normal',
      }],
      text: 'Normal',
    }],
    note: [{
      text: 'Patient was calm during measurement',
      time: '2024-01-15T10:35:00Z',
      authorString: 'Nurse Johnson',
    }],
  };

  const mockStringObservation: Observation = {
    resourceType: 'Observation',
    id: 'obs-456',
    status: 'preliminary',
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '72133-2',
        display: 'Smoking status',
      }],
      text: 'Smoking Status',
    },
    subject: {
      reference: 'Patient/patient-123',
    },
    valueString: 'Never smoker',
    effectiveDateTime: '2024-01-15T10:30:00Z',
  };

  const mockBooleanObservation: Observation = {
    resourceType: 'Observation',
    id: 'obs-789',
    status: 'final',
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '64518-9',
        display: 'Pregnancy status',
      }],
      text: 'Pregnant',
    },
    subject: {
      reference: 'Patient/patient-123',
    },
    valueBoolean: false,
    effectiveDateTime: '2024-01-15T10:30:00Z',
  };

  const mockComponentObservation: Observation = {
    resourceType: 'Observation',
    id: 'obs-bp',
    status: 'final',
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '85354-9',
        display: 'Blood pressure panel',
      }],
      text: 'Blood Pressure',
    },
    subject: {
      reference: 'Patient/patient-123',
    },
    effectiveDateTime: '2024-01-15T10:30:00Z',
    component: [{
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '8480-6',
          display: 'Systolic blood pressure',
        }],
        text: 'Systolic BP',
      },
      valueQuantity: {
        value: 120,
        unit: 'mmHg',
        system: 'http://unitsofmeasure.org',
        code: 'mm[Hg]',
      },
    }, {
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '8462-4',
          display: 'Diastolic blood pressure',
        }],
        text: 'Diastolic BP',
      },
      valueQuantity: {
        value: 80,
        unit: 'mmHg',
        system: 'http://unitsofmeasure.org',
        code: 'mm[Hg]',
      },
    }],
  };

  const mockAbsentDataObservation: Observation = {
    resourceType: 'Observation',
    id: 'obs-absent',
    status: 'final',
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '33747-0',
        display: 'General appearance',
      }],
      text: 'Appearance',
    },
    subject: {
      reference: 'Patient/patient-123',
    },
    effectiveDateTime: '2024-01-15T10:30:00Z',
    dataAbsentReason: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/data-absent-reason',
        code: 'not-performed',
        display: 'Not Performed',
      }],
      text: 'Assessment not performed',
    },
  };

  it('renders quantity observation in summary mode', () => {
    render(<ObservationViewer observation={mockQuantityObservation} viewMode="summary" />);

    expect(screen.getByText('Systolic BP')).toBeInTheDocument();
    expect(screen.getByText(/Vital Signs/)).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('mmHg')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('renders string observation in summary mode', () => {
    render(<ObservationViewer observation={mockStringObservation} viewMode="summary" />);

    expect(screen.getByText('Smoking Status')).toBeInTheDocument();
    expect(screen.getByText('Never smoker')).toBeInTheDocument();
  });

  it('renders boolean observation in summary mode', () => {
    render(<ObservationViewer observation={mockBooleanObservation} viewMode="summary" />);

    expect(screen.getByText('Pregnant')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('renders observation with absent data', () => {
    render(<ObservationViewer observation={mockAbsentDataObservation} viewMode="summary" />);

    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Assessment not performed')).toBeInTheDocument();
  });

  it('shows view details button in summary mode when onSelect is provided', () => {
    const mockOnSelect = vi.fn();
    render(<ObservationViewer observation={mockQuantityObservation} viewMode="summary" onSelect={mockOnSelect} />);

    const viewDetailsButton = screen.getByText('View Details');
    expect(viewDetailsButton).toBeInTheDocument();

    fireEvent.click(viewDetailsButton);
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('renders detailed view with all information', () => {
    render(<ObservationViewer observation={mockQuantityObservation} viewMode="detailed" />);

    expect(screen.getByText('Systolic BP')).toBeInTheDocument();
    expect(screen.getByText('ID: obs-123')).toBeInTheDocument();
    expect(screen.getAllByText('Final')[0]).toBeInTheDocument();
    
    // Basic Information section
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Category:')).toBeInTheDocument();
    expect(screen.getByText('Vital Signs')).toBeInTheDocument();
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Effective Date:')).toBeInTheDocument();
    expect(screen.getByText('Issued:')).toBeInTheDocument();

    // Value section
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('mmHg')).toBeInTheDocument();
    expect(screen.getByText('Normal: 90 - 140 mmHg')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();

    // Coding section
    expect(screen.getByText('Coding')).toBeInTheDocument();
    expect(screen.getByText('Systolic blood pressure')).toBeInTheDocument();
    expect(screen.getByText('http://loinc.org#8480-6')).toBeInTheDocument();

    // Performed By section
    expect(screen.getByText('Performed By')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();

    // Notes section
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Patient was calm during measurement')).toBeInTheDocument();
    expect(screen.getByText('By: Nurse Johnson')).toBeInTheDocument();
  });

  it('renders component observation with components section', () => {
    render(<ObservationViewer observation={mockComponentObservation} viewMode="detailed" />);

    expect(screen.getByText('Blood Pressure')).toBeInTheDocument();
    expect(screen.getByText('Components:')).toBeInTheDocument();
    expect(screen.getByText('Systolic BP')).toBeInTheDocument();
    expect(screen.getByText('120 mmHg')).toBeInTheDocument();
    expect(screen.getByText('Diastolic BP')).toBeInTheDocument();
    expect(screen.getByText('80 mmHg')).toBeInTheDocument();
  });

  it('handles observation without category gracefully', () => {
    const observationWithoutCategory = { ...mockQuantityObservation, category: undefined };
    render(<ObservationViewer observation={observationWithoutCategory} viewMode="summary" />);

    expect(screen.getByText(/General/)).toBeInTheDocument();
  });

  it('handles observation without effective date gracefully', () => {
    const observationWithoutDate = { ...mockQuantityObservation, effectiveDateTime: undefined };
    render(<ObservationViewer observation={observationWithoutDate} viewMode="summary" />);

    expect(screen.getByText('Vital Signs • Unknown date')).toBeInTheDocument();
  });

  it('handles observation without reference range', () => {
    const observationWithoutRange = { ...mockQuantityObservation, referenceRange: undefined };
    render(<ObservationViewer observation={observationWithoutRange} viewMode="detailed" />);

    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.queryByText('Normal:')).not.toBeInTheDocument();
  });

  it('handles observation without interpretation', () => {
    const observationWithoutInterpretation = { ...mockQuantityObservation, interpretation: undefined };
    render(<ObservationViewer observation={observationWithoutInterpretation} viewMode="detailed" />);

    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.queryByText('Normal')).not.toBeInTheDocument();
  });

  it('handles observation without notes', () => {
    const observationWithoutNotes = { ...mockQuantityObservation, note: undefined };
    render(<ObservationViewer observation={observationWithoutNotes} viewMode="detailed" />);

    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
  });

  it('handles observation without performer', () => {
    const observationWithoutPerformer = { ...mockQuantityObservation, performer: undefined };
    render(<ObservationViewer observation={observationWithoutPerformer} viewMode="detailed" />);

    expect(screen.queryByText('Performed By')).not.toBeInTheDocument();
  });

  it('displays different status styles correctly', () => {
    const { rerender } = render(<ObservationViewer observation={mockQuantityObservation} viewMode="detailed" />);
    
    expect(screen.getAllByText('Final')[0]).toHaveClass('status-final');

    const preliminaryObservation = { ...mockQuantityObservation, status: 'preliminary' as const };
    rerender(<ObservationViewer observation={preliminaryObservation} viewMode="detailed" />);
    
    expect(screen.getAllByText('Preliminary')[0]).toHaveClass('status-preliminary');
  });

  it('handles observation with no value gracefully', () => {
    const observationWithoutValue = {
      ...mockQuantityObservation,
      valueQuantity: undefined,
      valueString: undefined,
      valueBoolean: undefined,
      valueCodeableConcept: undefined,
      valueInteger: undefined,
      dataAbsentReason: undefined,
    };
    
    render(<ObservationViewer observation={observationWithoutValue} viewMode="summary" />);

    expect(screen.getByText('No value recorded')).toBeInTheDocument();
  });

  it('handles observation with integer value', () => {
    const observationWithInteger = {
      ...mockQuantityObservation,
      valueQuantity: undefined,
      valueInteger: 42,
    };
    
    render(<ObservationViewer observation={observationWithInteger} viewMode="summary" />);

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('handles observation with codeable concept value', () => {
    const observationWithCodeableConcept = {
      ...mockQuantityObservation,
      valueQuantity: undefined,
      valueCodeableConcept: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '260385009',
          display: 'Negative',
        }],
        text: 'Negative result',
      },
    };
    
    render(<ObservationViewer observation={observationWithCodeableConcept} viewMode="summary" />);

    expect(screen.getByText('Negative result')).toBeInTheDocument();
  });
});
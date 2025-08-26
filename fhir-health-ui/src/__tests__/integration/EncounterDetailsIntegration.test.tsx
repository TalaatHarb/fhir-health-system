import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EncounterDetails } from '../../components/encounter/EncounterDetails';
import { fhirClient } from '../../services/fhirClient';
import type { Encounter, Bundle, Observation, Condition, MedicationRequest, DiagnosticReport, Procedure } from '../../types/fhir';

// Mock the FHIR client
vi.mock('../../services/fhirClient', () => ({
  fhirClient: {
    getEncounterResources: vi.fn(),
  },
}));

const mockFhirClient = fhirClient as any;

describe('EncounterDetails Integration', () => {
  const mockEncounter: Encounter = {
    resourceType: 'Encounter',
    id: 'encounter-123',
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'Ambulatory',
    },
    type: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '185349003',
        display: 'Encounter for check up',
      }],
      text: 'Annual Check-up',
    }],
    subject: {
      reference: 'Patient/patient-123',
      display: 'John Doe',
    },
    period: {
      start: '2024-01-15T10:00:00Z',
      end: '2024-01-15T11:30:00Z',
    },
    reasonCode: [{
      text: 'Annual physical examination',
    }, {
      text: 'Follow-up for hypertension',
    }],
    diagnosis: [{
      condition: {
        reference: 'Condition/condition-123',
        display: 'Essential hypertension',
      },
      rank: 1,
    }, {
      condition: {
        reference: 'Condition/condition-456',
        display: 'Type 2 diabetes mellitus',
      },
      rank: 2,
    }],
  };

  const mockObservations: Observation[] = [
    {
      resourceType: 'Observation',
      id: 'obs-bp-systolic',
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'vital-signs',
          display: 'Vital Signs',
        }],
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '8480-6',
          display: 'Systolic blood pressure',
        }],
        text: 'Systolic BP',
      },
      subject: { reference: 'Patient/patient-123' },
      encounter: { reference: 'Encounter/encounter-123' },
      valueQuantity: {
        value: 135,
        unit: 'mmHg',
        system: 'http://unitsofmeasure.org',
        code: 'mm[Hg]',
      },
      effectiveDateTime: '2024-01-15T10:15:00Z',
      interpretation: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: 'H',
          display: 'High',
        }],
      }],
    },
    {
      resourceType: 'Observation',
      id: 'obs-weight',
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'vital-signs',
          display: 'Vital Signs',
        }],
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '29463-7',
          display: 'Body weight',
        }],
        text: 'Weight',
      },
      subject: { reference: 'Patient/patient-123' },
      encounter: { reference: 'Encounter/encounter-123' },
      valueQuantity: {
        value: 85.5,
        unit: 'kg',
        system: 'http://unitsofmeasure.org',
        code: 'kg',
      },
      effectiveDateTime: '2024-01-15T10:10:00Z',
    },
  ];

  const mockConditions: Condition[] = [
    {
      resourceType: 'Condition',
      id: 'condition-123',
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
          display: 'Active',
        }],
      },
      verificationStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed',
          display: 'Confirmed',
        }],
      },
      severity: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '6736007',
          display: 'Moderate',
        }],
      },
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '59621000',
          display: 'Essential hypertension',
        }],
        text: 'High blood pressure',
      },
      subject: { reference: 'Patient/patient-123' },
      encounter: { reference: 'Encounter/encounter-123' },
      onsetDateTime: '2022-03-15',
    },
  ];

  const mockMedicationRequests: MedicationRequest[] = [
    {
      resourceType: 'MedicationRequest',
      id: 'med-123',
      status: 'active',
      intent: 'order',
      priority: 'routine',
      medicationCodeableConcept: {
        coding: [{
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: '314076',
          display: 'Lisinopril 10 MG Oral Tablet',
        }],
        text: 'Lisinopril 10mg tablets',
      },
      subject: { reference: 'Patient/patient-123' },
      encounter: { reference: 'Encounter/encounter-123' },
      authoredOn: '2024-01-15',
      dosageInstruction: [{
        text: 'Take one tablet by mouth once daily',
        route: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '26643006',
            display: 'Oral route',
          }],
        },
        doseAndRate: [{
          doseQuantity: {
            value: 1,
            unit: 'tablet',
            system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
            code: 'TAB',
          },
        }],
      }],
    },
  ];

  const mockDiagnosticReports: DiagnosticReport[] = [
    {
      resourceType: 'DiagnosticReport',
      id: 'report-123',
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
          code: 'LAB',
          display: 'Laboratory',
        }],
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '58410-2',
          display: 'Complete blood count (hemogram) panel',
        }],
        text: 'Complete Blood Count',
      },
      subject: { reference: 'Patient/patient-123' },
      encounter: { reference: 'Encounter/encounter-123' },
      effectiveDateTime: '2024-01-15T09:30:00Z',
      issued: '2024-01-15T14:00:00Z',
      conclusion: 'All values within normal limits. No signs of anemia or infection.',
      result: [
        { reference: 'Observation/obs-hemoglobin', display: 'Hemoglobin' },
        { reference: 'Observation/obs-wbc', display: 'White blood cell count' },
      ],
    },
  ];

  const mockProcedures: Procedure[] = [
    {
      resourceType: 'Procedure',
      id: 'proc-123',
      status: 'completed',
      category: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '103693007',
          display: 'Diagnostic procedure',
        }],
      },
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '5880005',
          display: 'Physical examination procedure',
        }],
        text: 'Physical examination',
      },
      subject: { reference: 'Patient/patient-123' },
      encounter: { reference: 'Encounter/encounter-123' },
      performedDateTime: '2024-01-15T10:30:00Z',
      performer: [{
        actor: {
          reference: 'Practitioner/practitioner-123',
          display: 'Dr. Sarah Johnson',
        },
        function: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '17561000',
            display: 'Cardiologist',
          }],
        },
      }],
      outcome: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '385669000',
          display: 'Successful',
        }],
        text: 'Examination completed successfully',
      },
    },
  ];

  const mockEncounterResources = {
    observations: {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: mockObservations.map(obs => ({ resource: obs })),
    } as Bundle<Observation>,
    conditions: {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: mockConditions.map(cond => ({ resource: cond })),
    } as Bundle<Condition>,
    medicationRequests: {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: mockMedicationRequests.map(med => ({ resource: med })),
    } as Bundle<MedicationRequest>,
    diagnosticReports: {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: mockDiagnosticReports.map(report => ({ resource: report })),
    } as Bundle<DiagnosticReport>,
    procedures: {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: mockProcedures.map(proc => ({ resource: proc })),
    } as Bundle<Procedure>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFhirClient.getEncounterResources.mockResolvedValue(mockEncounterResources);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays complete encounter details with all resource types', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    // Check encounter header
    expect(screen.getByText('Encounter Details')).toBeInTheDocument();
    expect(screen.getByText('Annual Check-up')).toBeInTheDocument();
    expect(screen.getByText('(Ambulatory)')).toBeInTheDocument();
    expect(screen.getByText('Finished')).toBeInTheDocument();

    // Wait for resources to load
    await waitFor(() => {
      expect(screen.getByText('Observations (2)')).toBeInTheDocument();
    });

    expect(screen.getByText('Conditions (1)')).toBeInTheDocument();
    expect(screen.getByText('Medications (1)')).toBeInTheDocument();
    expect(screen.getByText('Reports (1)')).toBeInTheDocument();
    expect(screen.getByText('Procedures (1)')).toBeInTheDocument();
  });

  it('shows encounter overview with reasons and diagnoses', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('Associated Resources')).toBeInTheDocument();
    });

    // Check reason for visit
    expect(screen.getByText('Reason for Visit')).toBeInTheDocument();
    expect(screen.getByText('Annual physical examination')).toBeInTheDocument();
    expect(screen.getByText('Follow-up for hypertension')).toBeInTheDocument();

    // Check diagnoses
    expect(screen.getByText('Diagnoses')).toBeInTheDocument();
    expect(screen.getByText('Essential hypertension')).toBeInTheDocument();
    expect(screen.getByText('Type 2 diabetes mellitus')).toBeInTheDocument();
    expect(screen.getByText('Rank: 1')).toBeInTheDocument();
    expect(screen.getByText('Rank: 2')).toBeInTheDocument();
  });

  it('navigates through all resource tabs and displays resources correctly', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('Observations (2)')).toBeInTheDocument();
    });

    // Test Observations tab
    fireEvent.click(screen.getByText('Observations (2)'));
    
    await waitFor(() => {
      expect(screen.getByText('Systolic BP')).toBeInTheDocument();
    });
    expect(screen.getByText('Weight')).toBeInTheDocument();
    expect(screen.getByText('135')).toBeInTheDocument();
    expect(screen.getByText('85.5')).toBeInTheDocument();

    // Test Conditions tab
    fireEvent.click(screen.getByText('Conditions (1)'));
    
    await waitFor(() => {
      expect(screen.getByText('High blood pressure')).toBeInTheDocument();
    });
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();

    // Test Medications tab
    fireEvent.click(screen.getByText('Medications (1)'));
    
    await waitFor(() => {
      expect(screen.getByText('Lisinopril 10mg tablets')).toBeInTheDocument();
    });
    expect(screen.getByText('Take one tablet by mouth once daily')).toBeInTheDocument();

    // Test Reports tab
    fireEvent.click(screen.getByText('Reports (1)'));
    
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });
    expect(screen.getByText('All values within normal limits. No signs of anemia or infection.')).toBeInTheDocument();

    // Test Procedures tab
    fireEvent.click(screen.getByText('Procedures (1)'));
    
    await waitFor(() => {
      expect(screen.getByText('Physical examination')).toBeInTheDocument();
    });
    expect(screen.getByText('Examination completed successfully')).toBeInTheDocument();
  });

  it('opens and closes resource detail modal', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('Observations (2)')).toBeInTheDocument();
    });

    // Navigate to observations tab
    fireEvent.click(screen.getByText('Observations (2)'));
    
    await waitFor(() => {
      expect(screen.getByText('Systolic BP')).toBeInTheDocument();
    });

    // Click on view details for the first observation
    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    // Check modal is open
    await waitFor(() => {
      expect(screen.getByText('Resource Details')).toBeInTheDocument();
    });

    // Check detailed view content
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Vital Signs')).toBeInTheDocument();
    expect(screen.getByText('Final')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByLabelText('Close resource details');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Resource Details')).not.toBeInTheDocument();
    });
  });

  it('handles complex medication request with detailed dosage information', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('Medications (1)')).toBeInTheDocument();
    });

    // Navigate to medications tab
    fireEvent.click(screen.getByText('Medications (1)'));
    
    await waitFor(() => {
      expect(screen.getByText('Lisinopril 10mg tablets')).toBeInTheDocument();
    });

    // Open detailed view
    fireEvent.click(screen.getByText('View Details'));

    await waitFor(() => {
      expect(screen.getByText('Resource Details')).toBeInTheDocument();
    });

    // Check detailed medication information
    expect(screen.getByText('Dosage Instructions')).toBeInTheDocument();
    expect(screen.getByText('Take one tablet by mouth once daily')).toBeInTheDocument();
    expect(screen.getByText('Route:')).toBeInTheDocument();
    expect(screen.getByText('Oral route')).toBeInTheDocument();
    expect(screen.getByText('Dose:')).toBeInTheDocument();
    expect(screen.getByText('1 tablet')).toBeInTheDocument();
  });

  it('displays diagnostic report with results and conclusion', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('Reports (1)')).toBeInTheDocument();
    });

    // Navigate to reports tab
    fireEvent.click(screen.getByText('Reports (1)'));
    
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Open detailed view
    fireEvent.click(screen.getByText('View Details'));

    await waitFor(() => {
      expect(screen.getByText('Resource Details')).toBeInTheDocument();
    });

    // Check detailed report information
    expect(screen.getByText('Conclusion')).toBeInTheDocument();
    expect(screen.getByText('All values within normal limits. No signs of anemia or infection.')).toBeInTheDocument();
    expect(screen.getByText('Results (2)')).toBeInTheDocument();
    expect(screen.getByText('Hemoglobin')).toBeInTheDocument();
    expect(screen.getByText('White blood cell count')).toBeInTheDocument();
  });

  it('shows procedure details with performer and outcome', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('Procedures (1)')).toBeInTheDocument();
    });

    // Navigate to procedures tab
    fireEvent.click(screen.getByText('Procedures (1)'));
    
    await waitFor(() => {
      expect(screen.getByText('Physical examination')).toBeInTheDocument();
    });

    // Open detailed view
    fireEvent.click(screen.getByText('View Details'));

    await waitFor(() => {
      expect(screen.getByText('Resource Details')).toBeInTheDocument();
    });

    // Check detailed procedure information
    expect(screen.getByText('Performed By')).toBeInTheDocument();
    expect(screen.getByText('Dr. Sarah Johnson (Cardiologist)')).toBeInTheDocument();
    expect(screen.getByText('Outcome')).toBeInTheDocument();
    expect(screen.getByText('Examination completed successfully')).toBeInTheDocument();
  });

  it('handles encounter with duration calculation correctly', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('1 hour 30 minutes')).toBeInTheDocument();
    });

    expect(screen.getByText('January 15, 2024 at 10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('January 15, 2024 at 11:30 AM')).toBeInTheDocument();
  });

  it('maintains tab state when switching between tabs', async () => {
    render(<EncounterDetails encounter={mockEncounter} />);

    await waitFor(() => {
      expect(screen.getByText('Observations (2)')).toBeInTheDocument();
    });

    // Go to observations tab
    fireEvent.click(screen.getByText('Observations (2)'));
    
    await waitFor(() => {
      expect(screen.getByText('Systolic BP')).toBeInTheDocument();
    });

    // Go to conditions tab
    fireEvent.click(screen.getByText('Conditions (1)'));
    
    await waitFor(() => {
      expect(screen.getByText('High blood pressure')).toBeInTheDocument();
    });

    // Go back to observations tab - content should still be there
    fireEvent.click(screen.getByText('Observations (2)'));
    
    await waitFor(() => {
      expect(screen.getByText('Systolic BP')).toBeInTheDocument();
    });
    expect(screen.getByText('Weight')).toBeInTheDocument();
  });
});
import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { MedicationRequestViewer } from '../../../components/resource/MedicationRequestViewer';
import type { MedicationRequest } from '../../../types/fhir';

const createMockMedicationRequest = (
  id: string,
  status: string = 'active',
  priority?: string
): MedicationRequest => ({
  resourceType: 'MedicationRequest',
  id,
  status: status as any,
  intent: 'order',
  medicationCodeableConcept: {
    text: 'Lisinopril 10mg',
    coding: [{
      system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
      code: '314076',
      display: 'Lisinopril 10 MG Oral Tablet'
    }]
  },
  subject: {
    reference: 'Patient/123'
  },
  authoredOn: '2024-01-15T10:30:00Z',
  priority: priority as any,
  dosageInstruction: [{
    text: 'Take one tablet by mouth once daily',
    route: {
      text: 'Oral',
      coding: [{
        system: 'http://snomed.info/sct',
        code: '26643006',
        display: 'Oral route'
      }]
    },
    method: {
      text: 'Swallow',
      coding: [{
        system: 'http://snomed.info/sct',
        code: '421521009',
        display: 'Swallow'
      }]
    },
    doseAndRate: [{
      doseQuantity: {
        value: 10,
        unit: 'mg',
        system: 'http://unitsofmeasure.org',
        code: 'mg'
      }
    }],
    timing: {
      repeat: {
        frequency: 1,
        period: 1,
        periodUnit: 'day'
      },
      code: {
        text: 'Once daily',
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation',
          code: 'QD',
          display: 'Once daily'
        }]
      }
    },
    patientInstruction: 'Take with food to reduce stomach upset'
  }],
  dispenseRequest: {
    quantity: {
      value: 30,
      unit: 'tablets',
      system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
      code: 'TAB'
    },
    numberOfRepeatsAllowed: 5,
    expectedSupplyDuration: {
      value: 30,
      unit: 'days',
      system: 'http://unitsofmeasure.org',
      code: 'd'
    }
  }
});

describe('Enhanced MedicationRequestViewer', () => {
  describe('Enhanced Dosage Visualization', () => {
    it('renders visual dosage display with amount and frequency', () => {
      const medicationRequest = createMockMedicationRequest('1');

      render(
        <MedicationRequestViewer 
          medicationRequest={medicationRequest}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Dosage Instructions')).toBeInTheDocument();
      
      // Check for visual dosage display
      const dosageVisual = screen.getByText('10').closest('.medication-dosage-visual');
      expect(dosageVisual).toBeInTheDocument();
      
      // Check dosage amount
      const dosageAmount = screen.getByText('10').closest('.dosage-amount');
      expect(dosageAmount).toBeInTheDocument();
      expect(screen.getByText('mg')).toBeInTheDocument();
      
      // Check frequency
      expect(screen.getByText('1x per day')).toBeInTheDocument();
      
      // Check route
      expect(screen.getByText('Oral')).toBeInTheDocument();
    });

    it('renders patient instructions prominently', () => {
      const medicationRequest = createMockMedicationRequest('1');

      render(
        <MedicationRequestViewer 
          medicationRequest={medicationRequest}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Instructions:')).toBeInTheDocument();
      expect(screen.getByText('Take with food to reduce stomach upset')).toBeInTheDocument();
    });

    it('handles complex timing with duration', () => {
      const complexMedRequest: MedicationRequest = {
        ...createMockMedicationRequest('1'),
        dosageInstruction: [{
          text: 'Take twice daily for 7 days',
          doseAndRate: [{
            doseQuantity: {
              value: 500,
              unit: 'mg'
            }
          }],
          timing: {
            repeat: {
              frequency: 2,
              period: 1,
              periodUnit: 'day',
              duration: 7,
              durationUnit: 'day'
            }
          }
        }]
      };

      render(
        <MedicationRequestViewer 
          medicationRequest={complexMedRequest}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('2x per day')).toBeInTheDocument();
      expect(screen.getByText('for 7 days')).toBeInTheDocument();
    });

    it('handles dose ranges correctly', () => {
      const rangeRequest: MedicationRequest = {
        ...createMockMedicationRequest('1'),
        dosageInstruction: [{
          doseAndRate: [{
            doseRange: {
              low: {
                value: 5,
                unit: 'mg'
              },
              high: {
                value: 10,
                unit: 'mg'
              }
            }
          }],
          timing: {
            repeat: {
              frequency: 1,
              period: 1,
              periodUnit: 'day'
            }
          }
        }]
      };

      render(
        <MedicationRequestViewer 
          medicationRequest={rangeRequest}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('5-10')).toBeInTheDocument();
      expect(screen.getByText('mg')).toBeInTheDocument();
    });

    it('displays as-needed information', () => {
      const asNeededRequest: MedicationRequest = {
        ...createMockMedicationRequest('1'),
        dosageInstruction: [{
          asNeededBoolean: true,
          asNeededCodeableConcept: {
            text: 'Pain',
            coding: [{
              system: 'http://snomed.info/sct',
              code: '22253000',
              display: 'Pain'
            }]
          },
          doseAndRate: [{
            doseQuantity: {
              value: 10,
              unit: 'mg'
            }
          }]
        }]
      };

      render(
        <MedicationRequestViewer 
          medicationRequest={asNeededRequest}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('As Needed:')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('As Needed For:')).toBeInTheDocument();
      expect(screen.getByText('Pain')).toBeInTheDocument();
    });
  });

  describe('Priority Indicators', () => {
    it('renders routine priority correctly', () => {
      const medicationRequest = createMockMedicationRequest('1', 'active', 'routine');

      render(
        <MedicationRequestViewer 
          medicationRequest={medicationRequest}
          viewMode="detailed"
        />
      );

      const priorityIndicator = screen.getByText('Routine');
      expect(priorityIndicator).toBeInTheDocument();
      expect(priorityIndicator).toHaveClass('priority-routine');
    });

    it('renders urgent priority correctly', () => {
      const medicationRequest = createMockMedicationRequest('1', 'active', 'urgent');

      render(
        <MedicationRequestViewer 
          medicationRequest={medicationRequest}
          viewMode="detailed"
        />
      );

      const priorityIndicator = screen.getByText('Urgent');
      expect(priorityIndicator).toBeInTheDocument();
      expect(priorityIndicator).toHaveClass('priority-urgent');
    });

    it('renders stat priority correctly', () => {
      const medicationRequest = createMockMedicationRequest('1', 'active', 'stat');

      render(
        <MedicationRequestViewer 
          medicationRequest={medicationRequest}
          viewMode="detailed"
        />
      );

      const priorityIndicator = screen.getByText('Stat');
      expect(priorityIndicator).toBeInTheDocument();
      expect(priorityIndicator).toHaveClass('priority-stat');
    });

    it('does not render priority indicator when no priority', () => {
      const medicationRequest = createMockMedicationRequest('1');

      render(
        <MedicationRequestViewer 
          medicationRequest={medicationRequest}
          viewMode="detailed"
        />
      );

      expect(screen.queryByText(/Routine|Urgent|Stat|Asap/)).not.toBeInTheDocument();
    });
  });

  describe('Summary View Enhancements', () => {
    it('shows enhanced dosage in summary view', () => {
      const medicationRequest = createMockMedicationRequest('1');

      render(
        <MedicationRequestViewer 
          medicationRequest={medicationRequest}
          viewMode="summary"
        />
      );

      // Should show the first dosage instruction
      const summaryDosage = screen.getByText('Take one tablet by mouth once daily').closest('.medication-summary-dosage');
      expect(summaryDosage).toBeInTheDocument();
    });

    it('shows status and priority indicators in summary', () => {
      const medicationRequest = createMockMedicationRequest('1', 'active', 'urgent');

      render(
        <MedicationRequestViewer 
          medicationRequest={medicationRequest}
          viewMode="summary"
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Urgent')).toBeInTheDocument();
      
      const summaryStatus = screen.getByText('Active').closest('.medication-summary-status');
      expect(summaryStatus).toBeInTheDocument();
    });
  });

  describe('Dispense Request Visualization', () => {
    it('renders dispense request information', () => {
      const medicationRequest = createMockMedicationRequest('1');

      render(
        <MedicationRequestViewer 
          medicationRequest={medicationRequest}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Dispense Request')).toBeInTheDocument();
      expect(screen.getByText('Quantity:')).toBeInTheDocument();
      expect(screen.getByText('30 tablets')).toBeInTheDocument();
      expect(screen.getByText('Refills:')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Supply Duration:')).toBeInTheDocument();
      expect(screen.getByText('30 days')).toBeInTheDocument();
    });
  });

  describe('Reason for Prescription', () => {
    it('renders reason codes', () => {
      const medicationWithReason: MedicationRequest = {
        ...createMockMedicationRequest('1'),
        reasonCode: [{
          text: 'Hypertension',
          coding: [{
            system: 'http://snomed.info/sct',
            code: '38341003',
            display: 'Hypertensive disorder'
          }]
        }]
      };

      render(
        <MedicationRequestViewer 
          medicationRequest={medicationWithReason}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Reason for Prescription')).toBeInTheDocument();
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });

    it('renders reason references', () => {
      const medicationWithReasonRef: MedicationRequest = {
        ...createMockMedicationRequest('1'),
        reasonReference: [{
          reference: 'Condition/hypertension-1',
          display: 'Essential hypertension'
        }]
      };

      render(
        <MedicationRequestViewer 
          medicationRequest={medicationWithReasonRef}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Related Conditions')).toBeInTheDocument();
      expect(screen.getByText('Essential hypertension')).toBeInTheDocument();
    });
  });

  describe('Substitution Information', () => {
    it('renders substitution allowed information', () => {
      const medicationWithSubstitution: MedicationRequest = {
        ...createMockMedicationRequest('1'),
        substitution: {
          allowedBoolean: true,
          reason: {
            text: 'Cost savings',
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
              code: 'CT',
              display: 'Continuing therapy'
            }]
          }
        }
      };

      render(
        <MedicationRequestViewer 
          medicationRequest={medicationWithSubstitution}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Substitution')).toBeInTheDocument();
      expect(screen.getByText('Allowed:')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('Reason:')).toBeInTheDocument();
      expect(screen.getByText('Cost savings')).toBeInTheDocument();
    });

    it('renders substitution not allowed', () => {
      const medicationWithNoSubstitution: MedicationRequest = {
        ...createMockMedicationRequest('1'),
        substitution: {
          allowedBoolean: false
        }
      };

      render(
        <MedicationRequestViewer 
          medicationRequest={medicationWithNoSubstitution}
          viewMode="detailed"
        />
      );

      expect(screen.getByText('Substitution')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });
});
import type { 
  Encounter, 
  Observation, 
  Condition, 
  MedicationRequest,
  DiagnosticReport,
  Procedure,
  CodeableConcept,
  Coding,
  Reference,
  Period,
  Quantity,
  Bundle,
  FHIRResource
} from '../../types/fhir';

/**
 * Factory for creating realistic clinical FHIR resources with proper relationships
 * Supports Encounter, Observation, Condition, MedicationRequest, DiagnosticReport, and Procedure resources
 */
export class ClinicalDataFactory {
  private static idCounter = 2000;

  /**
   * Generate a unique resource ID
   */
  private static generateId(resourceType: string): string {
    return `${resourceType.toLowerCase()}-${this.idCounter++}`;
  }

  /**
   * Create a basic encounter
   */
  static createEncounter(patientId: string, overrides: Partial<Encounter> = {}): Encounter {
    const id = overrides.id || this.generateId('encounter');
    const now = new Date();
    const startTime = new Date(now.getTime() - (2 * 60 * 60 * 1000)); // 2 hours ago
    
    return {
      resourceType: 'Encounter',
      id,
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
        display: 'ambulatory'
      },
      type: [{
        coding: [{
          system: 'http://snomed.info/sct',
          code: '185349003',
          display: 'Encounter for check up'
        }]
      }],
      subject: {
        reference: `Patient/${patientId}`,
        display: 'Test Patient'
      },
      period: {
        start: startTime.toISOString(),
        end: now.toISOString()
      },
      serviceProvider: {
        reference: 'Organization/org-123',
        display: 'Test Healthcare Organization'
      },
      ...overrides
    };
  }

  /**
   * Create an emergency department encounter
   */
  static createEmergencyEncounter(patientId: string, overrides: Partial<Encounter> = {}): Encounter {
    return this.createEncounter(patientId, {
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'EMER',
        display: 'emergency'
      },
      type: [{
        coding: [{
          system: 'http://snomed.info/sct',
          code: '50849002',
          display: 'Emergency room admission'
        }]
      }],
      priority: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActPriority',
          code: 'UR',
          display: 'urgent'
        }]
      },
      ...overrides
    });
  }

  /**
   * Create an inpatient encounter
   */
  static createInpatientEncounter(patientId: string, overrides: Partial<Encounter> = {}): Encounter {
    const admissionDate = new Date();
    admissionDate.setDate(admissionDate.getDate() - 3); // 3 days ago
    const dischargeDate = new Date();
    dischargeDate.setDate(dischargeDate.getDate() - 1); // 1 day ago

    return this.createEncounter(patientId, {
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'IMP',
        display: 'inpatient encounter'
      },
      type: [{
        coding: [{
          system: 'http://snomed.info/sct',
          code: '32485007',
          display: 'Hospital admission'
        }]
      }],
      period: {
        start: admissionDate.toISOString(),
        end: dischargeDate.toISOString()
      },
      hospitalization: {
        admitSource: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/admit-source',
            code: 'emd',
            display: 'From accident/emergency department'
          }]
        },
        dischargeDisposition: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/discharge-disposition',
            code: 'home',
            display: 'Home'
          }]
        }
      },
      ...overrides
    });
  }

  /**
   * Create a vital signs observation
   */
  static createVitalSignsObservation(patientId: string, encounterId?: string, overrides: Partial<Observation> = {}): Observation {
    const id = overrides.id || this.generateId('observation');
    
    return {
      resourceType: 'Observation',
      id,
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'vital-signs',
          display: 'Vital Signs'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '8867-4',
          display: 'Heart rate'
        }]
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      ...(encounterId && { encounter: { reference: `Encounter/${encounterId}` } }),
      effectiveDateTime: new Date().toISOString(),
      valueQuantity: {
        value: 72,
        unit: 'beats/min',
        system: 'http://unitsofmeasure.org',
        code: '/min'
      },
      ...overrides
    };
  }

  /**
   * Create a blood pressure observation
   */
  static createBloodPressureObservation(patientId: string, encounterId?: string, overrides: Partial<Observation> = {}): Observation {
    return this.createVitalSignsObservation(patientId, encounterId, {
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '85354-9',
          display: 'Blood pressure panel with all children optional'
        }]
      },
      component: [
        {
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8480-6',
              display: 'Systolic blood pressure'
            }]
          },
          valueQuantity: {
            value: 120,
            unit: 'mmHg',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]'
          }
        },
        {
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8462-4',
              display: 'Diastolic blood pressure'
            }]
          },
          valueQuantity: {
            value: 80,
            unit: 'mmHg',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]'
          }
        }
      ],
      valueQuantity: undefined, // Remove single value since we have components
      ...overrides
    });
  }

  /**
   * Create a laboratory observation
   */
  static createLabObservation(patientId: string, encounterId?: string, overrides: Partial<Observation> = {}): Observation {
    return {
      resourceType: 'Observation',
      id: overrides.id || this.generateId('observation'),
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'laboratory',
          display: 'Laboratory'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '33747-0',
          display: 'Hemoglobin A1c/Hemoglobin.total in Blood'
        }]
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      ...(encounterId && { encounter: { reference: `Encounter/${encounterId}` } }),
      effectiveDateTime: new Date().toISOString(),
      valueQuantity: {
        value: 6.5,
        unit: '%',
        system: 'http://unitsofmeasure.org',
        code: '%'
      },
      referenceRange: [{
        low: {
          value: 4.0,
          unit: '%'
        },
        high: {
          value: 6.0,
          unit: '%'
        },
        text: 'Normal range'
      }],
      interpretation: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: 'H',
          display: 'High'
        }]
      }],
      ...overrides
    };
  }

  /**
   * Create a condition (diagnosis)
   */
  static createCondition(patientId: string, encounterId?: string, overrides: Partial<Condition> = {}): Condition {
    const id = overrides.id || this.generateId('condition');
    
    return {
      resourceType: 'Condition',
      id,
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
          display: 'Active'
        }]
      },
      verificationStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed',
          display: 'Confirmed'
        }]
      },
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-category',
          code: 'encounter-diagnosis',
          display: 'Encounter Diagnosis'
        }]
      }],
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '38341003',
          display: 'Hypertensive disorder'
        }]
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      ...(encounterId && { encounter: { reference: `Encounter/${encounterId}` } }),
      onsetDateTime: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Create a chronic condition
   */
  static createChronicCondition(patientId: string, overrides: Partial<Condition> = {}): Condition {
    const onsetDate = new Date();
    onsetDate.setFullYear(onsetDate.getFullYear() - 2); // 2 years ago

    return this.createCondition(patientId, undefined, {
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-category',
          code: 'problem-list-item',
          display: 'Problem List Item'
        }]
      }],
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '73211009',
          display: 'Diabetes mellitus'
        }]
      },
      onsetDateTime: onsetDate.toISOString(),
      ...overrides
    });
  }

  /**
   * Create a medication request
   */
  static createMedicationRequest(patientId: string, encounterId?: string, overrides: Partial<MedicationRequest> = {}): MedicationRequest {
    const id = overrides.id || this.generateId('medicationrequest');
    
    return {
      resourceType: 'MedicationRequest',
      id,
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: {
        coding: [{
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: '316049',
          display: 'Lisinopril'
        }]
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      ...(encounterId && { encounter: { reference: `Encounter/${encounterId}` } }),
      authoredOn: new Date().toISOString(),
      dosageInstruction: [{
        text: 'Take 10mg once daily',
        timing: {
          repeat: {
            frequency: 1,
            period: 1,
            periodUnit: 'd'
          }
        },
        route: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '26643006',
            display: 'Oral route'
          }]
        },
        doseAndRate: [{
          doseQuantity: {
            value: 10,
            unit: 'mg',
            system: 'http://unitsofmeasure.org',
            code: 'mg'
          }
        }]
      }],
      ...overrides
    };
  }

  /**
   * Create a diagnostic report
   */
  static createDiagnosticReport(patientId: string, encounterId?: string, overrides: Partial<DiagnosticReport> = {}): DiagnosticReport {
    const id = overrides.id || this.generateId('diagnosticreport');
    
    return {
      resourceType: 'DiagnosticReport',
      id,
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
          code: 'LAB',
          display: 'Laboratory'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '58410-2',
          display: 'Complete blood count (hemogram) panel - Blood by Automated count'
        }]
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      ...(encounterId && { encounter: { reference: `Encounter/${encounterId}` } }),
      effectiveDateTime: new Date().toISOString(),
      issued: new Date().toISOString(),
      conclusion: 'Complete blood count within normal limits.',
      ...overrides
    };
  }

  /**
   * Create a procedure
   */
  static createProcedure(patientId: string, encounterId?: string, overrides: Partial<Procedure> = {}): Procedure {
    const id = overrides.id || this.generateId('procedure');
    
    return {
      resourceType: 'Procedure',
      id,
      status: 'completed',
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '5880005',
          display: 'Physical examination procedure'
        }]
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      ...(encounterId && { encounter: { reference: `Encounter/${encounterId}` } }),
      performedDateTime: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Create a complete clinical dataset for a patient encounter
   */
  static createEncounterWithClinicalData(patientId: string, encounterOverrides: Partial<Encounter> = {}): {
    encounter: Encounter;
    observations: Observation[];
    conditions: Condition[];
    medications: MedicationRequest[];
    diagnosticReports: DiagnosticReport[];
    procedures: Procedure[];
  } {
    const encounter = this.createEncounter(patientId, encounterOverrides);
    const encounterId = encounter.id!;

    return {
      encounter,
      observations: [
        this.createVitalSignsObservation(patientId, encounterId),
        this.createBloodPressureObservation(patientId, encounterId),
        this.createLabObservation(patientId, encounterId)
      ],
      conditions: [
        this.createCondition(patientId, encounterId)
      ],
      medications: [
        this.createMedicationRequest(patientId, encounterId)
      ],
      diagnosticReports: [
        this.createDiagnosticReport(patientId, encounterId)
      ],
      procedures: [
        this.createProcedure(patientId, encounterId)
      ]
    };
  }

  /**
   * Create a bundle of related clinical resources
   */
  static createClinicalDataBundle(resources: FHIRResource[]): Bundle<FHIRResource> {
    return {
      resourceType: 'Bundle',
      id: `bundle-${this.idCounter++}`,
      type: 'collection',
      total: resources.length,
      entry: resources.map((resource, index) => ({
        fullUrl: `http://example.com/fhir/${resource.resourceType}/${resource.id || index}`,
        resource
      }))
    };
  }

  /**
   * Create observations for a specific time period (useful for trending data)
   */
  static createObservationSeries(
    patientId: string, 
    observationType: 'heart-rate' | 'blood-pressure' | 'weight' | 'temperature',
    count: number,
    daysBetween: number = 7
  ): Observation[] {
    const observations: Observation[] = [];
    const baseDate = new Date();
    
    const observationConfigs = {
      'heart-rate': {
        code: { system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' },
        category: 'vital-signs',
        unit: 'beats/min',
        baseValue: 72,
        variance: 10
      },
      'blood-pressure': {
        code: { system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' },
        category: 'vital-signs',
        unit: 'mmHg',
        baseValue: 120,
        variance: 15
      },
      'weight': {
        code: { system: 'http://loinc.org', code: '29463-7', display: 'Body weight' },
        category: 'vital-signs',
        unit: 'kg',
        baseValue: 70,
        variance: 5
      },
      'temperature': {
        code: { system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' },
        category: 'vital-signs',
        unit: 'Cel',
        baseValue: 36.5,
        variance: 1
      }
    };

    const config = observationConfigs[observationType];

    for (let i = 0; i < count; i++) {
      const observationDate = new Date(baseDate);
      observationDate.setDate(observationDate.getDate() - (i * daysBetween));
      
      const value = config.baseValue + (Math.random() - 0.5) * config.variance * 2;
      
      if (observationType === 'blood-pressure') {
        observations.push(this.createBloodPressureObservation(patientId, undefined, {
          effectiveDateTime: observationDate.toISOString(),
          component: [
            {
              code: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '8480-6',
                  display: 'Systolic blood pressure'
                }]
              },
              valueQuantity: {
                value: Math.round(value),
                unit: 'mmHg',
                system: 'http://unitsofmeasure.org',
                code: 'mm[Hg]'
              }
            },
            {
              code: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '8462-4',
                  display: 'Diastolic blood pressure'
                }]
              },
              valueQuantity: {
                value: Math.round(value - 40),
                unit: 'mmHg',
                system: 'http://unitsofmeasure.org',
                code: 'mm[Hg]'
              }
            }
          ]
        }));
      } else {
        observations.push(this.createVitalSignsObservation(patientId, undefined, {
          code: {
            coding: [config.code]
          },
          effectiveDateTime: observationDate.toISOString(),
          valueQuantity: {
            value: Math.round(value * 10) / 10,
            unit: config.unit,
            system: 'http://unitsofmeasure.org',
            code: config.unit === 'beats/min' ? '/min' : config.unit
          }
        }));
      }
    }

    return observations.reverse(); // Return in chronological order
  }

  /**
   * Create medication requests for common treatment protocols
   */
  static createMedicationProtocol(
    patientId: string, 
    protocol: 'hypertension' | 'diabetes' | 'infection',
    encounterId?: string
  ): MedicationRequest[] {
    const protocols = {
      hypertension: [
        {
          medication: { code: '316049', display: 'Lisinopril' },
          dosage: 'Take 10mg once daily'
        },
        {
          medication: { code: '200801', display: 'Amlodipine' },
          dosage: 'Take 5mg once daily'
        }
      ],
      diabetes: [
        {
          medication: { code: '6809', display: 'Metformin' },
          dosage: 'Take 500mg twice daily with meals'
        }
      ],
      infection: [
        {
          medication: { code: '723', display: 'Amoxicillin' },
          dosage: 'Take 500mg three times daily for 7 days'
        }
      ]
    };

    return protocols[protocol].map(med => 
      this.createMedicationRequest(patientId, encounterId, {
        medicationCodeableConcept: {
          coding: [{
            system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            code: med.medication.code,
            display: med.medication.display
          }]
        },
        dosageInstruction: [{
          text: med.dosage
        }]
      })
    );
  }
}
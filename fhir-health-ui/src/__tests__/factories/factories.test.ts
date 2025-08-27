import { describe, it, expect } from 'vitest';
import { PatientFactory } from './PatientFactory';
import { ClinicalDataFactory } from './ClinicalDataFactory';
import { createPatientScenario, createTimelineData } from './index';

describe('PatientFactory', () => {
  it('should create a basic patient with required fields', () => {
    const patient = PatientFactory.createBasicPatient();
    
    expect(patient.resourceType).toBe('Patient');
    expect(patient.id).toBeDefined();
    expect(patient.active).toBe(true);
    expect(patient.name).toBeDefined();
    expect(patient.name![0].family).toBe('Doe');
    expect(patient.name![0].given).toEqual(['John']);
    expect(patient.gender).toBe('male');
    expect(patient.birthDate).toBe('1980-01-15');
  });

  it('should create a detailed patient with comprehensive information', () => {
    const patient = PatientFactory.createDetailedPatient();
    
    expect(patient.resourceType).toBe('Patient');
    expect(patient.name![0].family).toBe('Johnson');
    expect(patient.maritalStatus).toBeDefined();
    expect(patient.contact).toBeDefined();
    expect(patient.communication).toBeDefined();
    expect(patient.address).toHaveLength(2); // home and work addresses
  });

  it('should create a patient family with correct relationships', () => {
    const family = PatientFactory.createPatientFamily(4);
    
    expect(family).toHaveLength(4);
    expect(family[0].name![0].family).toBe('Thompson'); // Father
    expect(family[1].name![0].family).toBe('Thompson'); // Mother
    expect(family[2].name![0].family).toBe('Thompson'); // Child 1
    expect(family[3].name![0].family).toBe('Thompson'); // Child 2
    
    // Children should have parent contact information
    expect(family[2].contact).toBeDefined();
    expect(family[3].contact).toBeDefined();
  });

  it('should create pediatric patient with appropriate age', () => {
    const patient = PatientFactory.createPediatricPatient();
    const birthYear = new Date(patient.birthDate!).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    
    expect(age).toBeLessThan(18);
    expect(patient.contact).toBeDefined(); // Should have parent/guardian contact
  });

  it('should create elderly patient with appropriate age', () => {
    const patient = PatientFactory.createElderlyPatient();
    const birthYear = new Date(patient.birthDate!).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    
    expect(age).toBeGreaterThan(65);
    expect(patient.maritalStatus?.coding![0].code).toBe('W'); // Widowed
  });
});

describe('ClinicalDataFactory', () => {
  const testPatientId = 'patient-test-123';
  const testEncounterId = 'encounter-test-456';

  it('should create a basic encounter', () => {
    const encounter = ClinicalDataFactory.createEncounter(testPatientId);
    
    expect(encounter.resourceType).toBe('Encounter');
    expect(encounter.id).toBeDefined();
    expect(encounter.status).toBe('finished');
    expect(encounter.subject.reference).toBe(`Patient/${testPatientId}`);
    expect(encounter.period).toBeDefined();
  });

  it('should create an emergency encounter with correct classification', () => {
    const encounter = ClinicalDataFactory.createEmergencyEncounter(testPatientId);
    
    expect(encounter.class.code).toBe('EMER');
    expect(encounter.priority).toBeDefined();
    expect(encounter.priority!.coding![0].code).toBe('UR');
  });

  it('should create vital signs observation', () => {
    const observation = ClinicalDataFactory.createVitalSignsObservation(testPatientId, testEncounterId);
    
    expect(observation.resourceType).toBe('Observation');
    expect(observation.status).toBe('final');
    expect(observation.category![0].coding![0].code).toBe('vital-signs');
    expect(observation.subject.reference).toBe(`Patient/${testPatientId}`);
    expect(observation.encounter!.reference).toBe(`Encounter/${testEncounterId}`);
    expect(observation.valueQuantity).toBeDefined();
  });

  it('should create blood pressure observation with components', () => {
    const observation = ClinicalDataFactory.createBloodPressureObservation(testPatientId, testEncounterId);
    
    expect(observation.component).toBeDefined();
    expect(observation.component).toHaveLength(2);
    expect(observation.component![0].code.coding![0].code).toBe('8480-6'); // Systolic
    expect(observation.component![1].code.coding![0].code).toBe('8462-4'); // Diastolic
  });

  it('should create a condition with proper clinical status', () => {
    const condition = ClinicalDataFactory.createCondition(testPatientId, testEncounterId);
    
    expect(condition.resourceType).toBe('Condition');
    expect(condition.clinicalStatus!.coding![0].code).toBe('active');
    expect(condition.verificationStatus!.coding![0].code).toBe('confirmed');
    expect(condition.subject.reference).toBe(`Patient/${testPatientId}`);
    expect(condition.encounter!.reference).toBe(`Encounter/${testEncounterId}`);
  });

  it('should create a medication request with dosage instructions', () => {
    const medication = ClinicalDataFactory.createMedicationRequest(testPatientId, testEncounterId);
    
    expect(medication.resourceType).toBe('MedicationRequest');
    expect(medication.status).toBe('active');
    expect(medication.intent).toBe('order');
    expect(medication.subject.reference).toBe(`Patient/${testPatientId}`);
    expect(medication.dosageInstruction).toBeDefined();
    expect(medication.dosageInstruction![0].text).toBeDefined();
  });

  it('should create complete encounter with clinical data', () => {
    const clinicalData = ClinicalDataFactory.createEncounterWithClinicalData(testPatientId);
    
    expect(clinicalData.encounter).toBeDefined();
    expect(clinicalData.observations).toHaveLength(3);
    expect(clinicalData.conditions).toHaveLength(1);
    expect(clinicalData.medications).toHaveLength(1);
    expect(clinicalData.diagnosticReports).toHaveLength(1);
    expect(clinicalData.procedures).toHaveLength(1);
    
    // Verify relationships
    const encounterId = clinicalData.encounter.id!;
    expect(clinicalData.observations[0].encounter!.reference).toBe(`Encounter/${encounterId}`);
    expect(clinicalData.conditions[0].encounter!.reference).toBe(`Encounter/${encounterId}`);
    expect(clinicalData.medications[0].encounter!.reference).toBe(`Encounter/${encounterId}`);
  });

  it('should create observation series for trending data', () => {
    const observations = ClinicalDataFactory.createObservationSeries(testPatientId, 'heart-rate', 5, 7);
    
    expect(observations).toHaveLength(5);
    expect(observations[0].code.coding![0].code).toBe('8867-4'); // Heart rate LOINC code
    
    // Verify chronological order
    const dates = observations.map(obs => new Date(obs.effectiveDateTime!));
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i].getTime()).toBeGreaterThan(dates[i - 1].getTime());
    }
  });

  it('should create medication protocol for hypertension', () => {
    const medications = ClinicalDataFactory.createMedicationProtocol(testPatientId, 'hypertension');
    
    expect(medications).toHaveLength(2);
    expect(medications[0].medicationCodeableConcept!.coding![0].display).toBe('Lisinopril');
    expect(medications[1].medicationCodeableConcept!.coding![0].display).toBe('Amlodipine');
  });
});

describe('Utility Functions', () => {
  it('should create basic patient scenario using factories directly', () => {
    const patient = PatientFactory.createBasicPatient();
    const encounter = ClinicalDataFactory.createEncounter(patient.id!);
    const observation = ClinicalDataFactory.createVitalSignsObservation(patient.id!, encounter.id);
    
    expect(patient).toBeDefined();
    expect(encounter).toBeDefined();
    expect(observation).toBeDefined();
    expect(encounter.subject.reference).toBe(`Patient/${patient.id}`);
    expect(observation.encounter!.reference).toBe(`Encounter/${encounter.id}`);
  });

  it('should create chronic disease scenario using factories directly', () => {
    const patient = PatientFactory.createPatientWithConditions(['Diabetes', 'Hypertension']);
    const encounter = ClinicalDataFactory.createEncounter(patient.id!);
    const clinicalData = ClinicalDataFactory.createEncounterWithClinicalData(patient.id!);
    
    expect(patient).toBeDefined();
    expect(encounter).toBeDefined();
    expect(clinicalData.observations.length).toBeGreaterThan(1);
    expect(clinicalData.conditions.length).toBeGreaterThan(0);
    expect(clinicalData.medications.length).toBeGreaterThan(0);
  });

  it('should create timeline data for trending using factories directly', () => {
    const heartRate = ClinicalDataFactory.createObservationSeries('patient-123', 'heart-rate', 12, 7);
    const bloodPressure = ClinicalDataFactory.createObservationSeries('patient-123', 'blood-pressure', 6, 14);
    const weight = ClinicalDataFactory.createObservationSeries('patient-123', 'weight', 3, 30);
    
    expect(heartRate).toBeDefined();
    expect(bloodPressure).toBeDefined();
    expect(weight).toBeDefined();
    
    expect(heartRate.length).toBe(12);
    expect(bloodPressure.length).toBe(6);
    expect(weight.length).toBe(3);
  });
});

describe('Data Relationships', () => {
  it('should maintain proper FHIR resource relationships', () => {
    const patient = PatientFactory.createBasicPatient();
    const encounter = ClinicalDataFactory.createEncounter(patient.id!);
    const observation = ClinicalDataFactory.createVitalSignsObservation(patient.id!, encounter.id);
    
    expect(encounter.subject.reference).toBe(`Patient/${patient.id}`);
    expect(observation.subject.reference).toBe(`Patient/${patient.id}`);
    expect(observation.encounter!.reference).toBe(`Encounter/${encounter.id}`);
  });

  it('should create bundle with proper entry structure', () => {
    const patient = PatientFactory.createBasicPatient();
    const encounter = ClinicalDataFactory.createEncounter(patient.id!);
    const resources = [patient, encounter];
    
    const bundle = ClinicalDataFactory.createClinicalDataBundle(resources);
    
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('collection');
    expect(bundle.total).toBe(2);
    expect(bundle.entry).toHaveLength(2);
    expect(bundle.entry![0].resource).toBe(patient);
    expect(bundle.entry![1].resource).toBe(encounter);
  });
});
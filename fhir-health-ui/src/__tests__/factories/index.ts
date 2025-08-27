/**
 * Mock Data Factories for FHIR Health UI Testing
 * 
 * This module provides comprehensive factories for creating realistic test data
 * for FHIR resources with proper relationships and clinical scenarios.
 */

export { PatientFactory } from './PatientFactory';
export { ClinicalDataFactory } from './ClinicalDataFactory';

// Re-export common types for convenience
export type {
  Patient,
  Encounter,
  Observation,
  Condition,
  MedicationRequest,
  DiagnosticReport,
  Procedure,
  Bundle,
  FHIRResource
} from '../../types/fhir';

/**
 * Utility function to create a complete patient scenario with clinical data
 */
export const createPatientScenario = (scenarioType: 'basic' | 'chronic-disease' | 'emergency' | 'pediatric') => {

  switch (scenarioType) {
    case 'basic':
      const basicPatient = PatientFactory.createBasicPatient();
      const basicEncounter = ClinicalDataFactory.createEncounter(basicPatient.id!);
      return {
        patient: basicPatient,
        encounter: basicEncounter,
        observations: [
          ClinicalDataFactory.createVitalSignsObservation(basicPatient.id!, basicEncounter.id)
        ],
        conditions: [],
        medications: []
      };

    case 'chronic-disease':
      const chronicPatient = PatientFactory.createPatientWithConditions(['Diabetes', 'Hypertension']);
      const chronicEncounter = ClinicalDataFactory.createEncounter(chronicPatient.id!);
      return {
        patient: chronicPatient,
        encounter: chronicEncounter,
        observations: [
          ClinicalDataFactory.createVitalSignsObservation(chronicPatient.id!, chronicEncounter.id),
          ClinicalDataFactory.createBloodPressureObservation(chronicPatient.id!, chronicEncounter.id),
          ClinicalDataFactory.createLabObservation(chronicPatient.id!, chronicEncounter.id)
        ],
        conditions: [
          ClinicalDataFactory.createChronicCondition(chronicPatient.id!),
          ClinicalDataFactory.createCondition(chronicPatient.id!, chronicEncounter.id)
        ],
        medications: ClinicalDataFactory.createMedicationProtocol(chronicPatient.id!, 'hypertension', chronicEncounter.id)
      };

    case 'emergency':
      const emergencyPatient = PatientFactory.createBasicPatient();
      const emergencyEncounter = ClinicalDataFactory.createEmergencyEncounter(emergencyPatient.id!);
      return {
        patient: emergencyPatient,
        encounter: emergencyEncounter,
        observations: [
          ClinicalDataFactory.createVitalSignsObservation(emergencyPatient.id!, emergencyEncounter.id),
          ClinicalDataFactory.createBloodPressureObservation(emergencyPatient.id!, emergencyEncounter.id)
        ],
        conditions: [
          ClinicalDataFactory.createCondition(emergencyPatient.id!, emergencyEncounter.id)
        ],
        medications: ClinicalDataFactory.createMedicationProtocol(emergencyPatient.id!, 'infection', emergencyEncounter.id)
      };

    case 'pediatric':
      const pediatricPatient = PatientFactory.createPediatricPatient();
      const pediatricEncounter = ClinicalDataFactory.createEncounter(pediatricPatient.id!);
      return {
        patient: pediatricPatient,
        encounter: pediatricEncounter,
        observations: [
          ClinicalDataFactory.createVitalSignsObservation(pediatricPatient.id!, pediatricEncounter.id)
        ],
        conditions: [],
        medications: []
      };

    default:
      throw new Error(`Unknown scenario type: ${scenarioType}`);
  }
};

/**
 * Utility function to create test data for timeline/trending scenarios
 */
export const createTimelineData = (patientId: string, months: number = 6) => {
  
  return {
    heartRate: ClinicalDataFactory.createObservationSeries(patientId, 'heart-rate', months * 4, 7),
    bloodPressure: ClinicalDataFactory.createObservationSeries(patientId, 'blood-pressure', months * 2, 14),
    weight: ClinicalDataFactory.createObservationSeries(patientId, 'weight', months, 30)
  };
};
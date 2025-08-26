/**
 * Mock FHIR data for development and testing
 */

const { v4: uuidv4 } = require('uuid');

// Organizations
const organizations = [
  {
    resourceType: 'Organization',
    id: 'org-1',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-15T10:00:00Z'
    },
    identifier: [{
      system: 'http://hl7.org/fhir/sid/us-npi',
      value: '1234567890'
    }],
    active: true,
    name: 'General Hospital',
    type: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/organization-type',
        code: 'prov',
        display: 'Healthcare Provider'
      }]
    }],
    telecom: [{
      system: 'phone',
      value: '+1-555-123-4567'
    }, {
      system: 'email',
      value: 'contact@generalhospital.org'
    }],
    address: [{
      use: 'work',
      line: ['123 Hospital Drive'],
      city: 'Medical City',
      state: 'CA',
      postalCode: '90210',
      country: 'US'
    }]
  },
  {
    resourceType: 'Organization',
    id: 'org-2',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-15T10:00:00Z'
    },
    identifier: [{
      system: 'http://hl7.org/fhir/sid/us-npi',
      value: '0987654321'
    }],
    active: true,
    name: 'Community Health Center',
    type: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/organization-type',
        code: 'prov',
        display: 'Healthcare Provider'
      }]
    }],
    telecom: [{
      system: 'phone',
      value: '+1-555-987-6543'
    }],
    address: [{
      use: 'work',
      line: ['456 Community Lane'],
      city: 'Healthville',
      state: 'NY',
      postalCode: '10001',
      country: 'US'
    }]
  },
  {
    resourceType: 'Organization',
    id: 'org-3',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-15T10:00:00Z'
    },
    identifier: [{
      system: 'http://hl7.org/fhir/sid/us-npi',
      value: '1122334455'
    }],
    active: true,
    name: 'Specialty Medical Group',
    type: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/organization-type',
        code: 'prov',
        display: 'Healthcare Provider'
      }]
    }],
    telecom: [{
      system: 'phone',
      value: '+1-555-456-7890'
    }],
    address: [{
      use: 'work',
      line: ['789 Specialist Boulevard'],
      city: 'Expert Town',
      state: 'TX',
      postalCode: '75001',
      country: 'US'
    }]
  }
];

// Patients
const patients = [
  {
    resourceType: 'Patient',
    id: 'patient-1',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-15T10:00:00Z'
    },
    identifier: [{
      system: 'http://hospital.smarthealthit.org',
      value: 'MRN123456'
    }],
    active: true,
    name: [{
      use: 'official',
      family: 'Smith',
      given: ['John', 'Michael']
    }],
    telecom: [{
      system: 'phone',
      value: '+1-555-234-5678',
      use: 'home'
    }, {
      system: 'email',
      value: 'john.smith@email.com'
    }],
    gender: 'male',
    birthDate: '1985-03-15',
    address: [{
      use: 'home',
      line: ['123 Main Street', 'Apt 4B'],
      city: 'Anytown',
      state: 'CA',
      postalCode: '90210',
      country: 'US'
    }],
    managingOrganization: {
      reference: 'Organization/org-1'
    }
  },
  {
    resourceType: 'Patient',
    id: 'patient-2',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-15T10:00:00Z'
    },
    identifier: [{
      system: 'http://hospital.smarthealthit.org',
      value: 'MRN789012'
    }],
    active: true,
    name: [{
      use: 'official',
      family: 'Johnson',
      given: ['Sarah', 'Elizabeth']
    }],
    telecom: [{
      system: 'phone',
      value: '+1-555-345-6789',
      use: 'home'
    }],
    gender: 'female',
    birthDate: '1992-07-22',
    address: [{
      use: 'home',
      line: ['456 Oak Avenue'],
      city: 'Springfield',
      state: 'NY',
      postalCode: '10001',
      country: 'US'
    }],
    managingOrganization: {
      reference: 'Organization/org-1'
    }
  },
  {
    resourceType: 'Patient',
    id: 'patient-3',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-15T10:00:00Z'
    },
    identifier: [{
      system: 'http://hospital.smarthealthit.org',
      value: 'MRN345678'
    }],
    active: true,
    name: [{
      use: 'official',
      family: 'Williams',
      given: ['Robert', 'James']
    }],
    telecom: [{
      system: 'phone',
      value: '+1-555-456-7890',
      use: 'home'
    }],
    gender: 'male',
    birthDate: '1978-11-08',
    address: [{
      use: 'home',
      line: ['789 Pine Street'],
      city: 'Riverside',
      state: 'TX',
      postalCode: '75001',
      country: 'US'
    }],
    managingOrganization: {
      reference: 'Organization/org-2'
    }
  },
  {
    resourceType: 'Patient',
    id: 'patient-4',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-15T10:00:00Z'
    },
    identifier: [{
      system: 'http://hospital.smarthealthit.org',
      value: 'MRN901234'
    }],
    active: true,
    name: [{
      use: 'official',
      family: 'Davis',
      given: ['Emily', 'Rose']
    }],
    telecom: [{
      system: 'phone',
      value: '+1-555-567-8901',
      use: 'home'
    }],
    gender: 'female',
    birthDate: '1995-12-03',
    address: [{
      use: 'home',
      line: ['321 Elm Drive'],
      city: 'Lakeside',
      state: 'FL',
      postalCode: '33101',
      country: 'US'
    }],
    managingOrganization: {
      reference: 'Organization/org-3'
    }
  },
  {
    resourceType: 'Patient',
    id: 'patient-5',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-15T10:00:00Z'
    },
    identifier: [{
      system: 'http://hospital.smarthealthit.org',
      value: 'MRN567890'
    }],
    active: true,
    name: [{
      use: 'official',
      family: 'Brown',
      given: ['Michael', 'David']
    }],
    telecom: [{
      system: 'phone',
      value: '+1-555-678-9012',
      use: 'home'
    }],
    gender: 'male',
    birthDate: '1960-05-20',
    address: [{
      use: 'home',
      line: ['654 Maple Lane'],
      city: 'Hillside',
      state: 'CA',
      postalCode: '90211',
      country: 'US'
    }],
    managingOrganization: {
      reference: 'Organization/org-1'
    }
  },
  {
    resourceType: 'Patient',
    id: 'patient-6',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-15T10:00:00Z'
    },
    identifier: [{
      system: 'http://hospital.smarthealthit.org',
      value: 'MRN234567'
    }],
    active: true,
    name: [{
      use: 'official',
      family: 'Wilson',
      given: ['Jennifer', 'Marie']
    }],
    telecom: [{
      system: 'phone',
      value: '+1-555-789-0123',
      use: 'home'
    }],
    gender: 'female',
    birthDate: '1988-09-14',
    address: [{
      use: 'home',
      line: ['987 Cedar Court'],
      city: 'Greenfield',
      state: 'NY',
      postalCode: '10002',
      country: 'US'
    }],
    managingOrganization: {
      reference: 'Organization/org-2'
    }
  }
];

// Encounters
const encounters = [
  {
    resourceType: 'Encounter',
    id: 'encounter-1',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-15T10:00:00Z'
    },
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
      reference: 'Patient/patient-1'
    },
    period: {
      start: '2024-01-10T09:00:00Z',
      end: '2024-01-10T10:30:00Z'
    },
    reasonCode: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '185349003',
        display: 'Encounter for check up'
      }]
    }],
    serviceProvider: {
      reference: 'Organization/org-1'
    }
  },
  {
    resourceType: 'Encounter',
    id: 'encounter-2',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-12T10:00:00Z'
    },
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory'
    },
    type: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '185345009',
        display: 'Encounter for symptom'
      }]
    }],
    subject: {
      reference: 'Patient/patient-1'
    },
    period: {
      start: '2024-01-12T14:00:00Z',
      end: '2024-01-12T15:00:00Z'
    },
    reasonCode: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '25064002',
        display: 'Headache'
      }]
    }],
    serviceProvider: {
      reference: 'Organization/org-1'
    }
  },
  {
    resourceType: 'Encounter',
    id: 'encounter-3',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-14T10:00:00Z'
    },
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
      reference: 'Patient/patient-2'
    },
    period: {
      start: '2024-01-14T11:00:00Z',
      end: '2024-01-14T12:00:00Z'
    },
    reasonCode: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '185349003',
        display: 'Encounter for check up'
      }]
    }],
    serviceProvider: {
      reference: 'Organization/org-1'
    }
  },
  {
    resourceType: 'Encounter',
    id: 'encounter-4',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-16T10:00:00Z'
    },
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory'
    },
    type: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '185345009',
        display: 'Encounter for symptom'
      }]
    }],
    subject: {
      reference: 'Patient/patient-5'
    },
    period: {
      start: '2024-01-16T10:00:00Z',
      end: '2024-01-16T11:30:00Z'
    },
    reasonCode: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '29857009',
        display: 'Chest pain'
      }]
    }],
    serviceProvider: {
      reference: 'Organization/org-1'
    }
  },
  {
    resourceType: 'Encounter',
    id: 'encounter-5',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-17T10:00:00Z'
    },
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
      reference: 'Patient/patient-6'
    },
    period: {
      start: '2024-01-17T09:00:00Z',
      end: '2024-01-17T10:00:00Z'
    },
    reasonCode: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '185349003',
        display: 'Encounter for check up'
      }]
    }],
    serviceProvider: {
      reference: 'Organization/org-2'
    }
  },
  {
    resourceType: 'Encounter',
    id: 'encounter-6',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-18T10:00:00Z'
    },
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory'
    },
    type: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '185345009',
        display: 'Encounter for symptom'
      }]
    }],
    subject: {
      reference: 'Patient/patient-3'
    },
    period: {
      start: '2024-01-18T14:00:00Z',
      end: '2024-01-18T15:30:00Z'
    },
    reasonCode: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '84229001',
        display: 'Fatigue'
      }]
    }],
    serviceProvider: {
      reference: 'Organization/org-2'
    }
  }
];

// Observations
const observations = [
  {
    resourceType: 'Observation',
    id: 'observation-1',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-10T10:00:00Z'
    },
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
        code: '8480-6',
        display: 'Systolic blood pressure'
      }]
    },
    subject: {
      reference: 'Patient/patient-1'
    },
    encounter: {
      reference: 'Encounter/encounter-1'
    },
    effectiveDateTime: '2024-01-10T09:30:00Z',
    valueQuantity: {
      value: 120,
      unit: 'mmHg',
      system: 'http://unitsofmeasure.org',
      code: 'mm[Hg]'
    },
    referenceRange: [{
      low: {
        value: 90,
        unit: 'mmHg'
      },
      high: {
        value: 140,
        unit: 'mmHg'
      }
    }]
  },
  {
    resourceType: 'Observation',
    id: 'observation-2',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-10T10:00:00Z'
    },
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
        code: '8462-4',
        display: 'Diastolic blood pressure'
      }]
    },
    subject: {
      reference: 'Patient/patient-1'
    },
    encounter: {
      reference: 'Encounter/encounter-1'
    },
    effectiveDateTime: '2024-01-10T09:30:00Z',
    valueQuantity: {
      value: 80,
      unit: 'mmHg',
      system: 'http://unitsofmeasure.org',
      code: 'mm[Hg]'
    },
    referenceRange: [{
      low: {
        value: 60,
        unit: 'mmHg'
      },
      high: {
        value: 90,
        unit: 'mmHg'
      }
    }]
  },
  {
    resourceType: 'Observation',
    id: 'observation-3',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-10T10:00:00Z'
    },
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
        code: '29463-7',
        display: 'Body Weight'
      }]
    },
    subject: {
      reference: 'Patient/patient-1'
    },
    encounter: {
      reference: 'Encounter/encounter-1'
    },
    effectiveDateTime: '2024-01-10T09:30:00Z',
    valueQuantity: {
      value: 70,
      unit: 'kg',
      system: 'http://unitsofmeasure.org',
      code: 'kg'
    }
  },
  {
    resourceType: 'Observation',
    id: 'observation-4',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-16T10:30:00Z'
    },
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
        code: '8480-6',
        display: 'Systolic blood pressure'
      }]
    },
    subject: {
      reference: 'Patient/patient-5'
    },
    encounter: {
      reference: 'Encounter/encounter-4'
    },
    effectiveDateTime: '2024-01-16T10:15:00Z',
    valueQuantity: {
      value: 150,
      unit: 'mmHg',
      system: 'http://unitsofmeasure.org',
      code: 'mm[Hg]'
    },
    referenceRange: [{
      low: {
        value: 90,
        unit: 'mmHg'
      },
      high: {
        value: 140,
        unit: 'mmHg'
      }
    }],
    interpretation: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
        code: 'H',
        display: 'High'
      }]
    }]
  },
  {
    resourceType: 'Observation',
    id: 'observation-5',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-16T10:30:00Z'
    },
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
      reference: 'Patient/patient-5'
    },
    encounter: {
      reference: 'Encounter/encounter-4'
    },
    effectiveDateTime: '2024-01-16T10:15:00Z',
    valueQuantity: {
      value: 95,
      unit: 'beats/min',
      system: 'http://unitsofmeasure.org',
      code: '/min'
    },
    referenceRange: [{
      low: {
        value: 60,
        unit: 'beats/min'
      },
      high: {
        value: 100,
        unit: 'beats/min'
      }
    }]
  },
  {
    resourceType: 'Observation',
    id: 'lab-1',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-14T12:00:00Z'
    },
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
        code: '718-7',
        display: 'Hemoglobin [Mass/volume] in Blood'
      }]
    },
    subject: {
      reference: 'Patient/patient-2'
    },
    encounter: {
      reference: 'Encounter/encounter-3'
    },
    effectiveDateTime: '2024-01-14T11:30:00Z',
    valueQuantity: {
      value: 13.5,
      unit: 'g/dL',
      system: 'http://unitsofmeasure.org',
      code: 'g/dL'
    },
    referenceRange: [{
      low: {
        value: 12.0,
        unit: 'g/dL'
      },
      high: {
        value: 15.5,
        unit: 'g/dL'
      }
    }]
  },
  {
    resourceType: 'Observation',
    id: 'lab-2',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-14T12:00:00Z'
    },
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
        code: '6690-2',
        display: 'Leukocytes [#/volume] in Blood by Automated count'
      }]
    },
    subject: {
      reference: 'Patient/patient-2'
    },
    encounter: {
      reference: 'Encounter/encounter-3'
    },
    effectiveDateTime: '2024-01-14T11:30:00Z',
    valueQuantity: {
      value: 7.2,
      unit: '10*3/uL',
      system: 'http://unitsofmeasure.org',
      code: '10*3/uL'
    },
    referenceRange: [{
      low: {
        value: 4.5,
        unit: '10*3/uL'
      },
      high: {
        value: 11.0,
        unit: '10*3/uL'
      }
    }]
  }
];

// Conditions
const conditions = [
  {
    resourceType: 'Condition',
    id: 'condition-1',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-12T15:00:00Z'
    },
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: 'active'
      }]
    },
    verificationStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        code: 'confirmed'
      }]
    },
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-category',
        code: 'encounter-diagnosis',
        display: 'Encounter Diagnosis'
      }]
    }],
    severity: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '255604002',
        display: 'Mild'
      }]
    },
    code: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '25064002',
        display: 'Headache'
      }]
    },
    subject: {
      reference: 'Patient/patient-1'
    },
    encounter: {
      reference: 'Encounter/encounter-2'
    },
    onsetDateTime: '2024-01-12T12:00:00Z',
    recordedDate: '2024-01-12T15:00:00Z'
  },
  {
    resourceType: 'Condition',
    id: 'condition-2',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-16T11:00:00Z'
    },
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: 'active'
      }]
    },
    verificationStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        code: 'confirmed'
      }]
    },
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-category',
        code: 'encounter-diagnosis',
        display: 'Encounter Diagnosis'
      }]
    }],
    severity: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '24484000',
        display: 'Severe'
      }]
    },
    code: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '38341003',
        display: 'Hypertensive disorder'
      }]
    },
    subject: {
      reference: 'Patient/patient-5'
    },
    encounter: {
      reference: 'Encounter/encounter-4'
    },
    onsetDateTime: '2024-01-16T10:00:00Z',
    recordedDate: '2024-01-16T11:00:00Z'
  },
  {
    resourceType: 'Condition',
    id: 'condition-3',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-18T15:00:00Z'
    },
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: 'active'
      }]
    },
    verificationStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        code: 'provisional'
      }]
    },
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-category',
        code: 'encounter-diagnosis',
        display: 'Encounter Diagnosis'
      }]
    }],
    severity: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '255604002',
        display: 'Mild'
      }]
    },
    code: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '271737000',
        display: 'Anemia'
      }]
    },
    subject: {
      reference: 'Patient/patient-3'
    },
    encounter: {
      reference: 'Encounter/encounter-6'
    },
    onsetDateTime: '2024-01-18T14:00:00Z',
    recordedDate: '2024-01-18T15:00:00Z'
  }
];

// Medication Requests
const medicationRequests = [
  {
    resourceType: 'MedicationRequest',
    id: 'medication-1',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-12T15:30:00Z'
    },
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '161',
        display: 'Acetaminophen'
      }]
    },
    subject: {
      reference: 'Patient/patient-1'
    },
    encounter: {
      reference: 'Encounter/encounter-2'
    },
    authoredOn: '2024-01-12T15:30:00Z',
    requester: {
      reference: 'Practitioner/practitioner-1'
    },
    dosageInstruction: [{
      text: 'Take 500mg every 6 hours as needed for headache',
      timing: {
        repeat: {
          frequency: 1,
          period: 6,
          periodUnit: 'h'
        }
      },
      asNeededBoolean: true,
      route: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '26643006',
          display: 'Oral route'
        }]
      },
      doseAndRate: [{
        doseQuantity: {
          value: 500,
          unit: 'mg',
          system: 'http://unitsofmeasure.org',
          code: 'mg'
        }
      }]
    }],
    dispenseRequest: {
      numberOfRepeatsAllowed: 2,
      quantity: {
        value: 30,
        unit: 'tablets'
      }
    }
  },
  {
    resourceType: 'MedicationRequest',
    id: 'medication-2',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-16T11:30:00Z'
    },
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '197361',
        display: 'Lisinopril'
      }]
    },
    subject: {
      reference: 'Patient/patient-5'
    },
    encounter: {
      reference: 'Encounter/encounter-4'
    },
    authoredOn: '2024-01-16T11:30:00Z',
    requester: {
      reference: 'Practitioner/practitioner-1'
    },
    dosageInstruction: [{
      text: 'Take 10mg once daily for blood pressure control',
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
    dispenseRequest: {
      numberOfRepeatsAllowed: 5,
      quantity: {
        value: 90,
        unit: 'tablets'
      }
    }
  },
  {
    resourceType: 'MedicationRequest',
    id: 'medication-3',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-18T15:30:00Z'
    },
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: '6058',
        display: 'Ferrous sulfate'
      }]
    },
    subject: {
      reference: 'Patient/patient-3'
    },
    encounter: {
      reference: 'Encounter/encounter-6'
    },
    authoredOn: '2024-01-18T15:30:00Z',
    requester: {
      reference: 'Practitioner/practitioner-2'
    },
    dosageInstruction: [{
      text: 'Take 325mg twice daily with food for iron deficiency',
      timing: {
        repeat: {
          frequency: 2,
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
          value: 325,
          unit: 'mg',
          system: 'http://unitsofmeasure.org',
          code: 'mg'
        }
      }]
    }],
    dispenseRequest: {
      numberOfRepeatsAllowed: 3,
      quantity: {
        value: 60,
        unit: 'tablets'
      }
    }
  }
];

// Diagnostic Reports
const diagnosticReports = [
  {
    resourceType: 'DiagnosticReport',
    id: 'diagnostic-1',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-14T12:30:00Z'
    },
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
      reference: 'Patient/patient-2'
    },
    encounter: {
      reference: 'Encounter/encounter-3'
    },
    effectiveDateTime: '2024-01-14T11:30:00Z',
    issued: '2024-01-14T12:30:00Z',
    result: [
      {
        reference: 'Observation/lab-1'
      },
      {
        reference: 'Observation/lab-2'
      }
    ],
    conclusion: 'Complete blood count within normal limits'
  },
  {
    resourceType: 'DiagnosticReport',
    id: 'diagnostic-2',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-16T12:00:00Z'
    },
    status: 'final',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
        code: 'RAD',
        display: 'Radiology'
      }]
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '36643-5',
        display: 'Chest X-ray'
      }]
    },
    subject: {
      reference: 'Patient/patient-5'
    },
    encounter: {
      reference: 'Encounter/encounter-4'
    },
    effectiveDateTime: '2024-01-16T11:00:00Z',
    issued: '2024-01-16T12:00:00Z',
    conclusion: 'Chest X-ray shows no acute cardiopulmonary abnormalities. Heart size is normal.'
  },
  {
    resourceType: 'DiagnosticReport',
    id: 'diagnostic-3',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-18T16:00:00Z'
    },
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
        code: '2951-2',
        display: 'Sodium [Moles/volume] in Serum or Plasma'
      }]
    },
    subject: {
      reference: 'Patient/patient-3'
    },
    encounter: {
      reference: 'Encounter/encounter-6'
    },
    effectiveDateTime: '2024-01-18T15:00:00Z',
    issued: '2024-01-18T16:00:00Z',
    conclusion: 'Basic metabolic panel shows mild electrolyte imbalance consistent with fatigue symptoms.'
  }
];

// Procedures
const procedures = [
  {
    resourceType: 'Procedure',
    id: 'procedure-1',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-10T10:30:00Z'
    },
    status: 'completed',
    category: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '103693007',
        display: 'Diagnostic procedure'
      }]
    },
    code: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '5880005',
        display: 'Physical examination procedure'
      }]
    },
    subject: {
      reference: 'Patient/patient-1'
    },
    encounter: {
      reference: 'Encounter/encounter-1'
    },
    performedDateTime: '2024-01-10T09:45:00Z',
    performer: [{
      actor: {
        reference: 'Practitioner/practitioner-1'
      }
    }],
    outcome: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '385669000',
        display: 'Successful'
      }]
    },
    note: [{
      text: 'Routine physical examination completed. Patient appears healthy.'
    }]
  },
  {
    resourceType: 'Procedure',
    id: 'procedure-2',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-16T11:30:00Z'
    },
    status: 'completed',
    category: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '103693007',
        display: 'Diagnostic procedure'
      }]
    },
    code: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '399208008',
        display: 'Plain chest X-ray'
      }]
    },
    subject: {
      reference: 'Patient/patient-5'
    },
    encounter: {
      reference: 'Encounter/encounter-4'
    },
    performedDateTime: '2024-01-16T11:00:00Z',
    performer: [{
      actor: {
        reference: 'Practitioner/practitioner-1'
      }
    }],
    outcome: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '385669000',
        display: 'Successful'
      }]
    },
    note: [{
      text: 'Chest X-ray performed to evaluate chest pain. No acute findings.'
    }]
  },
  {
    resourceType: 'Procedure',
    id: 'procedure-3',
    meta: {
      versionId: '1',
      lastUpdated: '2024-01-18T15:30:00Z'
    },
    status: 'completed',
    category: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '103693007',
        display: 'Diagnostic procedure'
      }]
    },
    code: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '396550006',
        display: 'Blood test'
      }]
    },
    subject: {
      reference: 'Patient/patient-3'
    },
    encounter: {
      reference: 'Encounter/encounter-6'
    },
    performedDateTime: '2024-01-18T15:00:00Z',
    performer: [{
      actor: {
        reference: 'Practitioner/practitioner-2'
      }
    }],
    outcome: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '385669000',
        display: 'Successful'
      }]
    },
    note: [{
      text: 'Blood work completed to investigate fatigue symptoms. Results show mild anemia.'
    }]
  }
];

module.exports = {
  organizations,
  patients,
  encounters,
  observations,
  conditions,
  medicationRequests,
  diagnosticReports,
  procedures
};
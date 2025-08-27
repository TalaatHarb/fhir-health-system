# Mock Data Factories

This directory contains comprehensive factories for creating realistic FHIR test data with proper relationships and clinical scenarios.

## Overview

The mock data factories provide a systematic way to generate test data for FHIR Health UI components and services. They support various patient demographics, clinical scenarios, and resource relationships.

## Factories

### PatientFactory

Creates realistic Patient resources with various demographics and scenarios.

#### Basic Usage

```typescript
import { PatientFactory } from './factories';

// Create a basic patient
const patient = PatientFactory.createBasicPatient();

// Create a detailed patient with comprehensive information
const detailedPatient = PatientFactory.createDetailedPatient();

// Create a pediatric patient
const child = PatientFactory.createPediatricPatient();

// Create an elderly patient
const elderly = PatientFactory.createElderlyPatient();
```

#### Family Scenarios

```typescript
// Create a family of 4 members
const family = PatientFactory.createPatientFamily(4);

// Create patient with specific conditions
const diabeticPatient = PatientFactory.createPatientWithConditions(['Diabetes', 'Hypertension']);

// Create patient with encounter history
const patientWithHistory = PatientFactory.createPatientWithEncounters(5);
```

#### Demographic Testing

```typescript
// Create patient with specific demographics
const patient = PatientFactory.createPatientWithDemographics({
  age: 45,
  gender: 'female',
  maritalStatus: 'M',
  language: 'en-US'
});

// Create batch of patients for testing pagination
const patients = PatientFactory.createPatientBatch(20, 'TestPatient');
```

### ClinicalDataFactory

Creates realistic clinical FHIR resources with proper relationships.

#### Encounters

```typescript
import { ClinicalDataFactory } from './factories';

// Create basic encounter
const encounter = ClinicalDataFactory.createEncounter('patient-123');

// Create emergency encounter
const emergency = ClinicalDataFactory.createEmergencyEncounter('patient-123');

// Create inpatient encounter
const inpatient = ClinicalDataFactory.createInpatientEncounter('patient-123');
```

#### Observations

```typescript
// Create vital signs observation
const vitals = ClinicalDataFactory.createVitalSignsObservation('patient-123', 'encounter-456');

// Create blood pressure observation with components
const bp = ClinicalDataFactory.createBloodPressureObservation('patient-123', 'encounter-456');

// Create laboratory observation
const lab = ClinicalDataFactory.createLabObservation('patient-123', 'encounter-456');
```

#### Conditions and Medications

```typescript
// Create condition (diagnosis)
const condition = ClinicalDataFactory.createCondition('patient-123', 'encounter-456');

// Create chronic condition
const chronic = ClinicalDataFactory.createChronicCondition('patient-123');

// Create medication request
const medication = ClinicalDataFactory.createMedicationRequest('patient-123', 'encounter-456');
```

#### Complete Clinical Scenarios

```typescript
// Create complete encounter with all clinical data
const clinicalData = ClinicalDataFactory.createEncounterWithClinicalData('patient-123');
// Returns: { encounter, observations, conditions, medications, diagnosticReports, procedures }

// Create observation series for trending
const heartRateData = ClinicalDataFactory.createObservationSeries(
  'patient-123', 
  'heart-rate', 
  12, // count
  7   // days between observations
);

// Create medication protocol
const hypertensionMeds = ClinicalDataFactory.createMedicationProtocol('patient-123', 'hypertension');
```

## Testing Scenarios

### Basic Patient Scenario

```typescript
const patient = PatientFactory.createBasicPatient();
const encounter = ClinicalDataFactory.createEncounter(patient.id!);
const observation = ClinicalDataFactory.createVitalSignsObservation(patient.id!, encounter.id);

// Test component with basic patient data
render(<PatientComponent patient={patient} />);
```

### Chronic Disease Management

```typescript
const patient = PatientFactory.createPatientWithConditions(['Diabetes', 'Hypertension']);
const clinicalData = ClinicalDataFactory.createEncounterWithClinicalData(patient.id!);

// Test chronic disease management components
render(<ChronicCareComponent 
  patient={patient} 
  conditions={clinicalData.conditions}
  medications={clinicalData.medications}
/>);
```

### Timeline and Trending Data

```typescript
const patient = PatientFactory.createBasicPatient();
const heartRateData = ClinicalDataFactory.createObservationSeries(patient.id!, 'heart-rate', 24, 7);
const weightData = ClinicalDataFactory.createObservationSeries(patient.id!, 'weight', 12, 30);

// Test trending charts and timeline components
render(<TrendingChart 
  heartRate={heartRateData}
  weight={weightData}
/>);
```

### Family Medicine Scenarios

```typescript
const family = PatientFactory.createPatientFamily(4);
const [father, mother, child1, child2] = family;

// Test family medicine workflows
render(<FamilyDashboard patients={family} />);
```

## Data Relationships

The factories maintain proper FHIR resource relationships:

- **Patient → Encounter**: Encounters reference their patient
- **Encounter → Observations/Conditions/Medications**: Clinical resources reference their encounter
- **Patient → Clinical Resources**: All clinical resources reference their patient
- **Bundle Entries**: Resources are properly bundled with full URLs

## FHIR Compliance

All generated resources follow FHIR R4 specifications:

- Proper resource types and required fields
- Valid coding systems (SNOMED CT, LOINC, RxNorm)
- Realistic clinical values and ranges
- Proper status codes and timestamps
- Valid reference formats

## Best Practices

### Use Specific Factories

```typescript
// Good: Use specific factory methods
const pediatricPatient = PatientFactory.createPediatricPatient();
const emergencyEncounter = ClinicalDataFactory.createEmergencyEncounter(patientId);

// Avoid: Generic factory with many overrides
const patient = PatientFactory.createBasicPatient({
  // lots of overrides...
});
```

### Maintain Relationships

```typescript
// Good: Maintain proper relationships
const patient = PatientFactory.createBasicPatient();
const encounter = ClinicalDataFactory.createEncounter(patient.id!);
const observation = ClinicalDataFactory.createVitalSignsObservation(patient.id!, encounter.id);

// Avoid: Orphaned resources
const observation = ClinicalDataFactory.createVitalSignsObservation('random-id');
```

### Use Realistic Data

```typescript
// Good: Use realistic clinical scenarios
const diabeticPatient = PatientFactory.createPatientWithConditions(['Diabetes']);
const diabetesMeds = ClinicalDataFactory.createMedicationProtocol(patient.id!, 'diabetes');

// Avoid: Unrealistic combinations
const pediatricPatient = PatientFactory.createPediatricPatient();
const geriatricCondition = ClinicalDataFactory.createCondition(patient.id!, undefined, {
  code: { coding: [{ code: 'dementia' }] }
});
```

## Testing Integration

### With Test Utils

```typescript
import { renderWithProviders } from '../test-utils';
import { PatientFactory } from './factories';

it('should display patient information', () => {
  const patient = PatientFactory.createDetailedPatient();
  
  const { getByText } = renderWithProviders(
    <PatientCard patient={patient} />,
    {
      patient: {
        openPatients: new Map([[patient.id!, { patient, encounters: [], resources: new Map() }]]),
        activePatientId: patient.id!
      }
    }
  );
  
  expect(getByText(patient.name![0].text!)).toBeInTheDocument();
});
```

### With Mock Services

```typescript
import { createCompleteFhirClientMock } from '../test-utils';
import { PatientFactory } from './factories';

it('should handle patient search', async () => {
  const patients = PatientFactory.createPatientBatch(5);
  const mockClient = createCompleteFhirClientMock();
  
  mockClient.searchPatients.mockResolvedValue(createMockBundle(patients));
  
  // Test search functionality
});
```

## Performance Considerations

- Factories generate data on-demand, not pre-computed
- Use `createPatientBatch()` for large datasets
- Consider caching for repeated test scenarios
- Use specific factories to avoid unnecessary data generation

## Extending Factories

To add new factory methods:

1. Add the method to the appropriate factory class
2. Follow FHIR R4 specifications
3. Maintain proper resource relationships
4. Add comprehensive tests
5. Update this documentation

Example:

```typescript
// In PatientFactory
static createPregnantPatient(overrides: Partial<Patient> = {}): Patient {
  return this.createDetailedPatient({
    gender: 'female',
    // Add pregnancy-specific extensions or conditions
    ...overrides
  });
}
```
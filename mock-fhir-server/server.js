const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import data and routes
const { organizations, patients, encounters, observations, conditions, medicationRequests, diagnosticReports, procedures } = require('./data/mockData');
const { searchPatients, paginateResults, validateSearchParams } = require('./utils/searchUtils');
const { createFHIRBundle, createOperationOutcome } = require('./utils/fhirUtils');

// FHIR Base URL
const FHIR_BASE = '/fhir/R4';

// Capability Statement endpoint
app.get(`${FHIR_BASE}/metadata`, (req, res) => {
  const capabilityStatement = {
    resourceType: 'CapabilityStatement',
    id: 'mock-fhir-server',
    status: 'active',
    date: new Date().toISOString(),
    publisher: 'Mock FHIR Server',
    kind: 'instance',
    software: {
      name: 'Mock FHIR Server',
      version: '1.0.0'
    },
    implementation: {
      description: 'Mock FHIR R4 Server for Development and Testing'
    },
    fhirVersion: '4.0.1',
    format: ['json'],
    rest: [{
      mode: 'server',
      resource: [
        {
          type: 'Organization',
          interaction: [
            { code: 'read' },
            { code: 'search-type' }
          ]
        },
        {
          type: 'Patient',
          interaction: [
            { code: 'read' },
            { code: 'create' },
            { code: 'search-type' }
          ],
          searchParam: [
            { name: 'name', type: 'string' },
            { name: 'identifier', type: 'token' },
            { name: 'birthdate', type: 'date' },
            { name: 'gender', type: 'token' }
          ]
        },
        {
          type: 'Encounter',
          interaction: [
            { code: 'read' },
            { code: 'create' },
            { code: 'search-type' }
          ],
          searchParam: [
            { name: 'patient', type: 'reference' },
            { name: 'date', type: 'date' },
            { name: 'status', type: 'token' }
          ]
        },
        {
          type: 'Observation',
          interaction: [
            { code: 'read' },
            { code: 'create' },
            { code: 'search-type' }
          ]
        },
        {
          type: 'Condition',
          interaction: [
            { code: 'read' },
            { code: 'create' },
            { code: 'search-type' }
          ]
        },
        {
          type: 'MedicationRequest',
          interaction: [
            { code: 'read' },
            { code: 'create' },
            { code: 'search-type' }
          ]
        },
        {
          type: 'DiagnosticReport',
          interaction: [
            { code: 'read' },
            { code: 'create' },
            { code: 'search-type' }
          ]
        },
        {
          type: 'Procedure',
          interaction: [
            { code: 'read' },
            { code: 'create' },
            { code: 'search-type' }
          ]
        }
      ]
    }]
  };
  
  res.json(capabilityStatement);
});

// Organization endpoints
app.get(`${FHIR_BASE}/Organization`, (req, res) => {
  const bundle = createFHIRBundle('Organization', organizations, req.query);
  res.json(bundle);
});

app.get(`${FHIR_BASE}/Organization/:id`, (req, res) => {
  const organization = organizations.find(org => org.id === req.params.id);
  if (!organization) {
    return res.status(404).json(createOperationOutcome('error', 'not-found', 'Organization not found'));
  }
  res.json(organization);
});

// Patient endpoints
app.get(`${FHIR_BASE}/Patient`, (req, res) => {
  try {
    const searchResults = searchPatients(patients, req.query);
    const paginatedResults = paginateResults(searchResults, req.query);
    const bundle = createFHIRBundle('Patient', paginatedResults.data, req.query, paginatedResults.total);
    res.json(bundle);
  } catch (error) {
    res.status(400).json(createOperationOutcome('error', 'invalid', error.message));
  }
});

app.get(`${FHIR_BASE}/Patient/:id`, (req, res) => {
  const patient = patients.find(p => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json(createOperationOutcome('error', 'not-found', 'Patient not found'));
  }
  res.json(patient);
});

app.post(`${FHIR_BASE}/Patient`, (req, res) => {
  try {
    const newPatient = {
      ...req.body,
      id: uuidv4(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString()
      }
    };
    
    patients.push(newPatient);
    res.status(201).json(newPatient);
  } catch (error) {
    res.status(400).json(createOperationOutcome('error', 'invalid', 'Invalid patient data'));
  }
});

// Encounter endpoints
app.get(`${FHIR_BASE}/Encounter`, (req, res) => {
  let filteredEncounters = encounters;
  
  if (req.query.patient) {
    const patientId = req.query.patient.replace('Patient/', '');
    filteredEncounters = encounters.filter(enc => 
      enc.subject.reference === `Patient/${patientId}`
    );
  }
  
  if (req.query.status) {
    filteredEncounters = filteredEncounters.filter(enc => enc.status === req.query.status);
  }
  
  const paginatedResults = paginateResults(filteredEncounters, req.query);
  const bundle = createFHIRBundle('Encounter', paginatedResults.data, req.query, paginatedResults.total);
  res.json(bundle);
});

app.get(`${FHIR_BASE}/Encounter/:id`, (req, res) => {
  const encounter = encounters.find(enc => enc.id === req.params.id);
  if (!encounter) {
    return res.status(404).json(createOperationOutcome('error', 'not-found', 'Encounter not found'));
  }
  res.json(encounter);
});

app.post(`${FHIR_BASE}/Encounter`, (req, res) => {
  try {
    const newEncounter = {
      ...req.body,
      id: uuidv4(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString()
      }
    };
    
    encounters.push(newEncounter);
    res.status(201).json(newEncounter);
  } catch (error) {
    res.status(400).json(createOperationOutcome('error', 'invalid', 'Invalid encounter data'));
  }
});

// Observation endpoints
app.get(`${FHIR_BASE}/Observation`, (req, res) => {
  let filteredObservations = observations;
  
  if (req.query.patient) {
    const patientId = req.query.patient.replace('Patient/', '');
    filteredObservations = observations.filter(obs => 
      obs.subject.reference === `Patient/${patientId}`
    );
  }
  
  if (req.query.encounter) {
    const encounterId = req.query.encounter.replace('Encounter/', '');
    filteredObservations = filteredObservations.filter(obs => 
      obs.encounter && obs.encounter.reference === `Encounter/${encounterId}`
    );
  }
  
  const paginatedResults = paginateResults(filteredObservations, req.query);
  const bundle = createFHIRBundle('Observation', paginatedResults.data, req.query, paginatedResults.total);
  res.json(bundle);
});

app.get(`${FHIR_BASE}/Observation/:id`, (req, res) => {
  const observation = observations.find(obs => obs.id === req.params.id);
  if (!observation) {
    return res.status(404).json(createOperationOutcome('error', 'not-found', 'Observation not found'));
  }
  res.json(observation);
});

app.post(`${FHIR_BASE}/Observation`, (req, res) => {
  try {
    const newObservation = {
      ...req.body,
      id: uuidv4(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString()
      }
    };
    
    observations.push(newObservation);
    res.status(201).json(newObservation);
  } catch (error) {
    res.status(400).json(createOperationOutcome('error', 'invalid', 'Invalid observation data'));
  }
});

// Similar endpoints for other resources (Condition, MedicationRequest, DiagnosticReport, Procedure)
// Condition endpoints
app.get(`${FHIR_BASE}/Condition`, (req, res) => {
  let filteredConditions = conditions;
  
  if (req.query.patient) {
    const patientId = req.query.patient.replace('Patient/', '');
    filteredConditions = conditions.filter(cond => 
      cond.subject.reference === `Patient/${patientId}`
    );
  }
  
  const paginatedResults = paginateResults(filteredConditions, req.query);
  const bundle = createFHIRBundle('Condition', paginatedResults.data, req.query, paginatedResults.total);
  res.json(bundle);
});

app.get(`${FHIR_BASE}/Condition/:id`, (req, res) => {
  const condition = conditions.find(cond => cond.id === req.params.id);
  if (!condition) {
    return res.status(404).json(createOperationOutcome('error', 'not-found', 'Condition not found'));
  }
  res.json(condition);
});

app.post(`${FHIR_BASE}/Condition`, (req, res) => {
  try {
    const newCondition = {
      ...req.body,
      id: uuidv4(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString()
      }
    };
    
    conditions.push(newCondition);
    res.status(201).json(newCondition);
  } catch (error) {
    res.status(400).json(createOperationOutcome('error', 'invalid', 'Invalid condition data'));
  }
});

// MedicationRequest endpoints
app.get(`${FHIR_BASE}/MedicationRequest`, (req, res) => {
  let filteredMedications = medicationRequests;
  
  if (req.query.patient) {
    const patientId = req.query.patient.replace('Patient/', '');
    filteredMedications = medicationRequests.filter(med => 
      med.subject.reference === `Patient/${patientId}`
    );
  }
  
  const paginatedResults = paginateResults(filteredMedications, req.query);
  const bundle = createFHIRBundle('MedicationRequest', paginatedResults.data, req.query, paginatedResults.total);
  res.json(bundle);
});

app.get(`${FHIR_BASE}/MedicationRequest/:id`, (req, res) => {
  const medicationRequest = medicationRequests.find(med => med.id === req.params.id);
  if (!medicationRequest) {
    return res.status(404).json(createOperationOutcome('error', 'not-found', 'MedicationRequest not found'));
  }
  res.json(medicationRequest);
});

app.post(`${FHIR_BASE}/MedicationRequest`, (req, res) => {
  try {
    const newMedicationRequest = {
      ...req.body,
      id: uuidv4(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString()
      }
    };
    
    medicationRequests.push(newMedicationRequest);
    res.status(201).json(newMedicationRequest);
  } catch (error) {
    res.status(400).json(createOperationOutcome('error', 'invalid', 'Invalid medication request data'));
  }
});

// DiagnosticReport endpoints
app.get(`${FHIR_BASE}/DiagnosticReport`, (req, res) => {
  let filteredReports = diagnosticReports;
  
  if (req.query.patient) {
    const patientId = req.query.patient.replace('Patient/', '');
    filteredReports = diagnosticReports.filter(report => 
      report.subject.reference === `Patient/${patientId}`
    );
  }
  
  const paginatedResults = paginateResults(filteredReports, req.query);
  const bundle = createFHIRBundle('DiagnosticReport', paginatedResults.data, req.query, paginatedResults.total);
  res.json(bundle);
});

app.get(`${FHIR_BASE}/DiagnosticReport/:id`, (req, res) => {
  const diagnosticReport = diagnosticReports.find(report => report.id === req.params.id);
  if (!diagnosticReport) {
    return res.status(404).json(createOperationOutcome('error', 'not-found', 'DiagnosticReport not found'));
  }
  res.json(diagnosticReport);
});

app.post(`${FHIR_BASE}/DiagnosticReport`, (req, res) => {
  try {
    const newDiagnosticReport = {
      ...req.body,
      id: uuidv4(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString()
      }
    };
    
    diagnosticReports.push(newDiagnosticReport);
    res.status(201).json(newDiagnosticReport);
  } catch (error) {
    res.status(400).json(createOperationOutcome('error', 'invalid', 'Invalid diagnostic report data'));
  }
});

// Procedure endpoints
app.get(`${FHIR_BASE}/Procedure`, (req, res) => {
  let filteredProcedures = procedures;
  
  if (req.query.patient) {
    const patientId = req.query.patient.replace('Patient/', '');
    filteredProcedures = procedures.filter(proc => 
      proc.subject.reference === `Patient/${patientId}`
    );
  }
  
  const paginatedResults = paginateResults(filteredProcedures, req.query);
  const bundle = createFHIRBundle('Procedure', paginatedResults.data, req.query, paginatedResults.total);
  res.json(bundle);
});

app.get(`${FHIR_BASE}/Procedure/:id`, (req, res) => {
  const procedure = procedures.find(proc => proc.id === req.params.id);
  if (!procedure) {
    return res.status(404).json(createOperationOutcome('error', 'not-found', 'Procedure not found'));
  }
  res.json(procedure);
});

app.post(`${FHIR_BASE}/Procedure`, (req, res) => {
  try {
    const newProcedure = {
      ...req.body,
      id: uuidv4(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString()
      }
    };
    
    procedures.push(newProcedure);
    res.status(201).json(newProcedure);
  } catch (error) {
    res.status(400).json(createOperationOutcome('error', 'invalid', 'Invalid procedure data'));
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json(createOperationOutcome('error', 'exception', 'Internal server error'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json(createOperationOutcome('error', 'not-found', 'Resource not found'));
});

app.listen(PORT, () => {
  console.log(`Mock FHIR Server running on port ${PORT}`);
  console.log(`FHIR Base URL: http://localhost:${PORT}${FHIR_BASE}`);
  console.log(`Capability Statement: http://localhost:${PORT}${FHIR_BASE}/metadata`);
});

module.exports = app;
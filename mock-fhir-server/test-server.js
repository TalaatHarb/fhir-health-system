/**
 * Simple test script to verify FHIR server endpoints
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001/fhir/R4';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    console.log(`Testing: ${url}`);
    
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`✓ ${path} - Status: ${res.statusCode}, Type: ${parsed.resourceType}`);
          if (parsed.resourceType === 'Bundle') {
            console.log(`  Entries: ${parsed.entry ? parsed.entry.length : 0}, Total: ${parsed.total || 0}`);
          }
          resolve(parsed);
        } catch (error) {
          console.log(`✗ ${path} - Parse error: ${error.message}`);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.log(`✗ ${path} - Request error: ${error.message}`);
      reject(error);
    });
  });
}

async function runTests() {
  console.log('Starting FHIR server endpoint tests...\n');
  
  const tests = [
    '/metadata',
    '/Organization',
    '/Organization/org-1',
    '/Patient',
    '/Patient?name=Smith',
    '/Patient/patient-1',
    '/Encounter',
    '/Encounter?patient=Patient/patient-1',
    '/Encounter/encounter-1',
    '/Observation',
    '/Observation?patient=Patient/patient-1',
    '/Observation/observation-1',
    '/Condition',
    '/Condition/condition-1',
    '/MedicationRequest',
    '/MedicationRequest/medication-1',
    '/DiagnosticReport',
    '/DiagnosticReport/diagnostic-1',
    '/Procedure',
    '/Procedure/procedure-1'
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await makeRequest(test);
      passed++;
    } catch (error) {
      failed++;
    }
    console.log(''); // Empty line for readability
  }
  
  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! FHIR server is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please check the server implementation.');
  }
}

// Check if server is running
console.log('Checking if FHIR server is running...');
makeRequest('/metadata')
  .then(() => {
    console.log('Server is running, starting tests...\n');
    runTests();
  })
  .catch(() => {
    console.log('❌ Server is not running. Please start it with: npm start');
    console.log('Then run this test with: node test-server.js');
  });
/**
 * Search utilities for FHIR resources
 */

function searchPatients(patients, query) {
  let results = [...patients];
  
  // Search by name
  if (query.name) {
    const searchTerm = query.name.toLowerCase();
    results = results.filter(patient => {
      if (!patient.name || !Array.isArray(patient.name)) return false;
      
      return patient.name.some(name => {
        const given = name.given ? name.given.join(' ').toLowerCase() : '';
        const family = name.family ? name.family.toLowerCase() : '';
        const fullName = `${given} ${family}`.trim();
        
        return fullName.includes(searchTerm) || 
               given.includes(searchTerm) || 
               family.includes(searchTerm);
      });
    });
  }
  
  // Search by identifier
  if (query.identifier) {
    results = results.filter(patient => {
      if (!patient.identifier || !Array.isArray(patient.identifier)) return false;
      
      return patient.identifier.some(identifier => 
        identifier.value && identifier.value.includes(query.identifier)
      );
    });
  }
  
  // Search by birthdate
  if (query.birthdate) {
    results = results.filter(patient => 
      patient.birthDate && patient.birthDate === query.birthdate
    );
  }
  
  // Search by gender
  if (query.gender) {
    results = results.filter(patient => 
      patient.gender && patient.gender === query.gender
    );
  }
  
  return results;
}

function paginateResults(data, query) {
  const count = parseInt(query._count) || 20;
  const offset = parseInt(query._offset) || 0;
  
  const total = data.length;
  const paginatedData = data.slice(offset, offset + count);
  
  return {
    data: paginatedData,
    total: total,
    offset: offset,
    count: count
  };
}

function validateSearchParams(resourceType, params) {
  const validParams = {
    'Patient': ['name', 'identifier', 'birthdate', 'gender', '_count', '_offset'],
    'Encounter': ['patient', 'date', 'status', '_count', '_offset'],
    'Observation': ['patient', 'encounter', 'code', '_count', '_offset'],
    'Condition': ['patient', 'encounter', '_count', '_offset'],
    'MedicationRequest': ['patient', 'encounter', '_count', '_offset'],
    'DiagnosticReport': ['patient', 'encounter', '_count', '_offset'],
    'Procedure': ['patient', 'encounter', '_count', '_offset']
  };
  
  const allowedParams = validParams[resourceType] || [];
  const invalidParams = Object.keys(params).filter(param => !allowedParams.includes(param));
  
  if (invalidParams.length > 0) {
    throw new Error(`Invalid search parameters: ${invalidParams.join(', ')}`);
  }
  
  return true;
}

module.exports = {
  searchPatients,
  paginateResults,
  validateSearchParams
};
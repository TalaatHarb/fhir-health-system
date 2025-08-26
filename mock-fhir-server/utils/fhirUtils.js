/**
 * FHIR utility functions for creating compliant responses
 */

function createFHIRBundle(resourceType, entries, query = {}, total = null) {
  const bundle = {
    resourceType: 'Bundle',
    id: require('uuid').v4(),
    meta: {
      lastUpdated: new Date().toISOString()
    },
    type: 'searchset',
    total: total !== null ? total : entries.length,
    entry: entries.map(resource => ({
      fullUrl: `http://localhost:3001/fhir/R4/${resourceType}/${resource.id}`,
      resource: resource,
      search: {
        mode: 'match'
      }
    }))
  };
  
  // Add pagination links if applicable
  const count = parseInt(query._count) || 20;
  const offset = parseInt(query._offset) || 0;
  
  if (bundle.total > count) {
    bundle.link = [];
    
    // Self link
    const selfParams = new URLSearchParams(query);
    bundle.link.push({
      relation: 'self',
      url: `http://localhost:3001/fhir/R4/${resourceType}?${selfParams.toString()}`
    });
    
    // Next link
    if (offset + count < bundle.total) {
      const nextParams = new URLSearchParams(query);
      nextParams.set('_offset', offset + count);
      bundle.link.push({
        relation: 'next',
        url: `http://localhost:3001/fhir/R4/${resourceType}?${nextParams.toString()}`
      });
    }
    
    // Previous link
    if (offset > 0) {
      const prevParams = new URLSearchParams(query);
      prevParams.set('_offset', Math.max(0, offset - count));
      bundle.link.push({
        relation: 'previous',
        url: `http://localhost:3001/fhir/R4/${resourceType}?${prevParams.toString()}`
      });
    }
  }
  
  return bundle;
}

function createOperationOutcome(severity, code, diagnostics, details = null) {
  return {
    resourceType: 'OperationOutcome',
    id: require('uuid').v4(),
    meta: {
      lastUpdated: new Date().toISOString()
    },
    issue: [{
      severity: severity,
      code: code,
      diagnostics: diagnostics,
      details: details ? {
        text: details
      } : undefined
    }]
  };
}

function validateFHIRResource(resource, resourceType) {
  if (!resource.resourceType) {
    throw new Error('Missing resourceType');
  }
  
  if (resource.resourceType !== resourceType) {
    throw new Error(`Expected resourceType ${resourceType}, got ${resource.resourceType}`);
  }
  
  // Add more validation as needed
  return true;
}

function addMetadata(resource) {
  return {
    ...resource,
    meta: {
      versionId: '1',
      lastUpdated: new Date().toISOString(),
      ...resource.meta
    }
  };
}

module.exports = {
  createFHIRBundle,
  createOperationOutcome,
  validateFHIRResource,
  addMetadata
};
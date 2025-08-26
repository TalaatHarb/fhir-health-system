// Service exports will be added as services are created
// This file serves as the main entry point for all services

export { FHIRClient, createFHIRClient, fhirClient } from './fhirClient';
export type { FHIRClientConfig, FHIRError } from './fhirClient';
export { EnhancedFHIRClient, createEnhancedFHIRClient, enhancedFhirClient } from './enhancedFhirClient';
export type { EnhancedFHIRClientConfig } from './enhancedFhirClient';

// export { AuthService } from './authService';
// export { ValidationService } from './validationService';
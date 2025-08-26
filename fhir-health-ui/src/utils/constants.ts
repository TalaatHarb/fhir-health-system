// Application Constants

// FHIR Resource Types
export const FHIR_RESOURCE_TYPES = {
  PATIENT: 'Patient',
  ORGANIZATION: 'Organization',
  ENCOUNTER: 'Encounter',
  OBSERVATION: 'Observation',
  CONDITION: 'Condition',
  MEDICATION_REQUEST: 'MedicationRequest',
  DIAGNOSTIC_REPORT: 'DiagnosticReport',
  PROCEDURE: 'Procedure',
} as const;

// FHIR Status Values
export const ENCOUNTER_STATUS = {
  PLANNED: 'planned',
  ARRIVED: 'arrived',
  TRIAGED: 'triaged',
  IN_PROGRESS: 'in-progress',
  ONLEAVE: 'onleave',
  FINISHED: 'finished',
  CANCELLED: 'cancelled',
  ENTERED_IN_ERROR: 'entered-in-error',
  UNKNOWN: 'unknown',
} as const;

export const OBSERVATION_STATUS = {
  REGISTERED: 'registered',
  PRELIMINARY: 'preliminary',
  FINAL: 'final',
  AMENDED: 'amended',
  CORRECTED: 'corrected',
  CANCELLED: 'cancelled',
  ENTERED_IN_ERROR: 'entered-in-error',
  UNKNOWN: 'unknown',
} as const;

// Application Configuration
const MINUTES_TO_MS = 60 * 1000;
const THIRTY_MINUTES_IN_MS = 30 * MINUTES_TO_MS;
const FIVE_SECONDS_IN_MS = 5 * 1000;

export const APP_CONFIG = {
  NAME: 'FHIR Resource Visualizer',
  VERSION: '1.0.0',
  DEFAULT_PAGE_SIZE: 20,
  MAX_OPEN_PATIENTS: 10,
  SESSION_TIMEOUT: THIRTY_MINUTES_IN_MS,
  NOTIFICATION_DURATION: FIVE_SECONDS_IN_MS,
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// UI Constants
export const UI_CONSTANTS = {
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200,
  },
  Z_INDEX: {
    DROPDOWN: 1000,
    MODAL: 1050,
    TOOLTIP: 1070,
    NOTIFICATION: 1080,
  },
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
} as const;

// Healthcare Data Constants
export const HEALTHCARE_CONSTANTS = {
  GENDER_OPTIONS: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'unknown', label: 'Unknown' },
  ],
  PRIORITY_LEVELS: [
    { value: 'routine', label: 'Routine' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'asap', label: 'ASAP' },
    { value: 'stat', label: 'STAT' },
  ],
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access to this resource is forbidden.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An internal server error occurred.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FHIR_VALIDATION_ERROR: 'Invalid FHIR resource format.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in.',
  LOGOUT_SUCCESS: 'Successfully logged out.',
  PATIENT_CREATED: 'Patient created successfully.',
  PATIENT_UPDATED: 'Patient updated successfully.',
  ENCOUNTER_CREATED: 'Encounter created successfully.',
  RESOURCE_CREATED: 'Resource created successfully.',
  RESOURCE_UPDATED: 'Resource updated successfully.',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'fhir_auth_token',
  USER_PREFERENCES: 'fhir_user_preferences',
  CURRENT_ORGANIZATION: 'fhir_current_organization',
  THEME: 'fhir_theme',
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  ISO_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  TIME_ONLY: 'HH:mm',
} as const;

// Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-()]+$/,
  POSTAL_CODE: /^[\d\w\s-]+$/,
  FHIR_ID: /^[A-Za-z0-9\-.]{1,64}$/,
} as const;
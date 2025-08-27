/**
 * Interface for components that support test-id attributes
 */
export interface TestableComponent {
  /**
   * Optional test identifier for automated testing
   * Should follow kebab-case naming convention
   * Example: "patient-search-input", "submit-button", "error-message"
   */
  testId?: string;
}

/**
 * Common test-id naming conventions
 */
export const TestIds = {
  // Authentication
  LOGIN_FORM: 'login-form',
  USERNAME_INPUT: 'username-input',
  PASSWORD_INPUT: 'password-input',
  LOGIN_BUTTON: 'login-button',
  DEMO_LOGIN_BUTTON: 'demo-login-button',
  LOGIN_ERROR: 'login-error',
  
  // Navigation
  MAIN_HEADER: 'main-header',
  APP_TITLE: 'app-title',
  USER_WELCOME: 'user-welcome',
  LOGOUT_BUTTON: 'logout-button',
  SWITCH_ORG_BUTTON: 'switch-org-button',
  
  // Organization
  ORG_MODAL: 'organization-modal',
  ORG_MODAL_TITLE: 'organization-modal-title',
  ORG_MODAL_CLOSE: 'organization-modal-close',
  ORG_LIST: 'organization-list',
  ORG_ITEM: 'organization-item',
  ORG_SELECT_BUTTON: 'organization-select-button',
  ORG_LOADING: 'organization-loading',
  ORG_ERROR: 'organization-error',
  
  // Patient Search
  PATIENT_SEARCH: 'patient-search',
  PATIENT_SEARCH_INPUT: 'patient-search-input',
  PATIENT_SEARCH_BUTTON: 'patient-search-button',
  PATIENT_CREATE_BUTTON: 'patient-create-button',
  PATIENT_RESULTS: 'patient-search-results',
  PATIENT_RESULT_ITEM: 'patient-result-item',
  PATIENT_SEARCH_ERROR: 'patient-search-error',
  PATIENT_SEARCH_LOADING: 'patient-search-loading',
  PATIENT_NO_RESULTS: 'patient-no-results',
  
  // Patient Management
  PATIENT_TAB: 'patient-tab',
  PATIENT_TAB_CLOSE: 'patient-tab-close',
  PATIENT_TAB_CONTENT: 'patient-tab-content',
  PATIENT_CREATE_MODAL: 'patient-create-modal',
  PATIENT_FORM: 'patient-form',
  PATIENT_FORM_SUBMIT: 'patient-form-submit',
  PATIENT_FORM_CANCEL: 'patient-form-cancel',
  
  // Form Fields
  GIVEN_NAME_INPUT: 'given-name-input',
  FAMILY_NAME_INPUT: 'family-name-input',
  GENDER_SELECT: 'gender-select',
  BIRTH_DATE_INPUT: 'birth-date-input',
  EMAIL_INPUT: 'email-input',
  PHONE_INPUT: 'phone-input',
  
  // Common UI
  LOADING_SPINNER: 'loading-spinner',
  ERROR_MESSAGE: 'error-message',
  SUCCESS_MESSAGE: 'success-message',
  WARNING_MESSAGE: 'warning-message',
  MODAL_OVERLAY: 'modal-overlay',
  MODAL_CONTENT: 'modal-content',
  MODAL_CLOSE: 'modal-close',
  
  // Buttons
  SUBMIT_BUTTON: 'submit-button',
  CANCEL_BUTTON: 'cancel-button',
  RETRY_BUTTON: 'retry-button',
  CLOSE_BUTTON: 'close-button',
  
  // Lists and Tables
  RESULTS_LIST: 'results-list',
  LIST_ITEM: 'list-item',
  TABLE_ROW: 'table-row',
  TABLE_CELL: 'table-cell',
  
  // Status Indicators
  SELECTED_INDICATOR: 'selected-indicator',
  CURRENT_ORG: 'current-org',
  SELECTED_PATIENT: 'selected-patient',
  
  // Counters and Stats
  ORG_COUNT: 'org-count',
  PATIENT_COUNT: 'patient-count',
  RESULTS_COUNT: 'results-count'
} as const;

/**
 * Helper function to generate consistent test-id values
 */
export const generateTestId = (base: string, suffix?: string): string => {
  if (!suffix) return base;
  return `${base}-${suffix}`;
};

/**
 * Helper function to create test-id props object
 */
export const createTestIdProps = (testId?: string) => {
  return testId ? { 'data-testid': testId } : {};
};
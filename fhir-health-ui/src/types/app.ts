// Application State TypeScript Interfaces

import { Patient, Organization, Encounter, FHIRResource } from './fhir';

// User and Authentication Types
export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  roles?: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

// Organization State Types
export interface OrganizationState {
  current: Organization | null;
  available: Organization[];
  modalOpen: boolean;
  loading: boolean;
  error: string | null;
}

export interface OrganizationContextValue {
  currentOrganization: Organization | null;
  organizations: Organization[];
  selectOrganization: (org: Organization) => void;
  fetchOrganizations: () => Promise<void>;
  showOrganizationModal: () => void;
  hideOrganizationModal: () => void;
  loading: boolean;
  error: string | null;
}

// Patient State Types
export interface PatientData {
  patient: Patient;
  encounters: Encounter[];
  resources: Map<string, FHIRResource[]>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date;
}

export interface PatientState {
  openPatients: Map<string, PatientData>;
  activePatientId: string | null;
  searchResults: Patient[];
  searchLoading: boolean;
  searchError: string | null;
  createPatientModalOpen: boolean;
}

export interface PatientContextValue {
  openPatients: Map<string, PatientData>;
  activePatientId: string | null;
  searchResults: Patient[];
  searchLoading: boolean;
  searchError: string | null;
  openPatient: (patient: Patient) => void;
  closePatient: (patientId: string) => void;
  setActivePatient: (patientId: string) => void;
  searchPatients: (query: string) => Promise<void>;
  clearSearchResults: () => void;
  showCreatePatientModal: () => void;
  hideCreatePatientModal: () => void;
  createPatient: (patient: Partial<Patient>) => Promise<Patient>;
  refreshPatientData: (patientId: string) => Promise<void>;
}

// UI State Types
export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  loading: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface UIContextValue {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

// Application State Root
export interface AppState {
  auth: AuthState;
  organization: OrganizationState;
  patients: PatientState;
  ui: UIState;
}

// Action Types for State Management
export type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

export type OrganizationAction =
  | { type: 'FETCH_ORGANIZATIONS_START' }
  | { type: 'FETCH_ORGANIZATIONS_SUCCESS'; payload: Organization[] }
  | { type: 'FETCH_ORGANIZATIONS_FAILURE'; payload: string }
  | { type: 'SELECT_ORGANIZATION'; payload: Organization }
  | { type: 'SHOW_ORGANIZATION_MODAL' }
  | { type: 'HIDE_ORGANIZATION_MODAL' }
  | { type: 'CLEAR_ERROR' };

export type PatientAction =
  | { type: 'SEARCH_PATIENTS_START' }
  | { type: 'SEARCH_PATIENTS_SUCCESS'; payload: Patient[] }
  | { type: 'SEARCH_PATIENTS_FAILURE'; payload: string }
  | { type: 'CLEAR_SEARCH_RESULTS' }
  | { type: 'OPEN_PATIENT'; payload: Patient }
  | { type: 'CLOSE_PATIENT'; payload: string }
  | { type: 'SET_ACTIVE_PATIENT'; payload: string }
  | { type: 'UPDATE_PATIENT_DATA'; payload: { patientId: string; data: Partial<PatientData> } }
  | { type: 'SHOW_CREATE_PATIENT_MODAL' }
  | { type: 'HIDE_CREATE_PATIENT_MODAL' }
  | { type: 'CREATE_PATIENT_SUCCESS'; payload: Patient }
  | { type: 'CLEAR_ERROR' };

export type UIAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_LOADING'; payload: boolean };

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export interface ErrorProps extends BaseComponentProps {
  error: string | Error;
  onRetry?: () => void;
  showRetry?: boolean;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    custom?: (value: unknown) => string | null;
  };
}

export interface FormState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// API Types
export interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
  message?: string;
}

export interface APIError {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

// FHIR Client Configuration
export interface FHIRClientConfig {
  baseUrl: string;
  organizationId?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
  status?: string[];
  category?: string[];
  resourceType?: string[];
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  label: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Resource Visualization Types
export interface ResourceVisualizationProps {
  resource: FHIRResource;
  viewMode: 'summary' | 'detailed';
  onEdit?: (resource: FHIRResource) => void;
  onDelete?: (resource: FHIRResource) => void;
  readonly?: boolean;
}

export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description?: string;
  type: 'encounter' | 'observation' | 'condition' | 'medication' | 'procedure' | 'diagnostic';
  status?: string;
  resource?: FHIRResource;
  icon?: string;
  color?: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

// Navigation Types
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  children?: NavigationItem[];
  permissions?: string[];
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  active?: boolean;
}

// Tab Management Types
export interface TabItem {
  id: string;
  title: string;
  content: React.ReactNode;
  closable?: boolean;
  modified?: boolean;
}

export interface TabManagerState {
  tabs: TabItem[];
  activeTabId: string | null;
}

// Validation Types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Export utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
// Component exports will be added as components are created
// This file serves as the main entry point for all components

// Auth components
export { LoginPage } from './auth/LoginPage';
export { ProtectedRoute, withProtectedRoute } from './auth/ProtectedRoute';

// Common components
export { Loading } from './common/Loading';
export { LoadingSpinner, LoadingOverlay, ProgressBar, Skeleton } from './common/LoadingSpinner';

// Main Application
export { MainApplication } from './MainApplication';

// Organization components  
export { OrganizationModal } from './organization/OrganizationModal';

// Patient components
export { PatientSearch } from './patient/PatientSearch';
export { PatientCreateModal } from './patient/PatientCreateModal';
export { PatientTab } from './patient/PatientTab';
export { TabManager } from './patient/TabManager';

// Encounter components
export { EncounterTimeline } from './encounter/EncounterTimeline';
export { EncounterTimelineItem } from './encounter/EncounterTimelineItem';
// export { EncounterDetails } from './encounter/EncounterDetails';

// Resource components
// export { ResourceViewer } from './resource/ResourceViewer';

// Error handling components
export { ErrorBoundary, PatientErrorBoundary, EncounterErrorBoundary } from './common/ErrorBoundary';
export { Toast, ToastContainer } from './common/Toast';
export { InlineError, FieldError, ErrorList } from './common/InlineError';

// UI components
export { ThemeToggle } from './ui/ThemeToggle';
export { ThemeDemo } from './ui/ThemeDemo';
// export { Button } from './ui/Button';

// Modal components
export { Modal, ModalManager, withModalPage, ModalNavigation } from './common/Modal';
export { ModalSystemDemo } from './common/ModalSystemDemo';
export { 
  ConfirmationPage, 
  FormPage, 
  ListSelectionPage, 
  LoadingPage, 
  SuccessPage, 
  ErrorPage 
} from './common/ExampleModalPages';

// Layout components
// export { Layout } from './common/Layout';
// export { Header } from './common/Header';
// export { Sidebar } from './common/Sidebar';
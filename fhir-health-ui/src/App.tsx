import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, OrganizationProvider, PatientProvider, ThemeProvider, I18nProvider } from './contexts';
import { NotificationProvider } from './contexts/NotificationContext';
import { ModalProvider } from './contexts/ModalContext';
import { ProtectedRoute } from './components';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/Toast';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { useNotifications } from './contexts/NotificationContext';
import { useOfflineDetection } from './hooks/useOfflineDetection';
import { enhancedFhirClient } from './services/enhancedFhirClient';
import './App.css';

// Lazy load components for better performance
const LoginPage = React.lazy(() => import('./components/auth/LoginPage').then(module => ({ default: module.LoginPage })));
const MainApplication = React.lazy(() => import('./components/MainApplication').then(module => ({ default: module.MainApplication })));

// Component to handle notifications and offline status
function AppNotifications(): React.JSX.Element {
  const { notifications, removeNotification, showWarning, showSuccess, showError } = useNotifications();
  
  const { isOffline, wasOffline } = useOfflineDetection({
    onOffline: () => {
      showWarning(
        'Connection Lost',
        'You are currently offline. Some features may be limited.',
        [
          {
            label: 'Retry Connection',
            action: async () => {
              const isOnline = await enhancedFhirClient.checkConnection();
              if (isOnline) {
                showSuccess('Connection Restored', 'You are back online.');
              } else {
                showError('Still Offline', 'Unable to connect to the server.');
              }
            }
          }
        ]
      );
    },
    onOnline: () => {
      showSuccess('Connection Restored', 'You are back online.');
      // Process any queued offline operations
      enhancedFhirClient.processOfflineQueue().catch(() => {
        showWarning('Sync Warning', 'Some offline changes could not be synchronized.');
      });
    }
  });

  // Show reconnection success message
  React.useEffect(() => {
    if (wasOffline) {
      showSuccess('Reconnected', 'Connection has been restored. Syncing offline changes...');
    }
  }, [wasOffline, showSuccess]);

  return (
    <>
      <ToastContainer 
        notifications={notifications} 
        onRemove={removeNotification}
        position="top-right"
        maxToasts={5}
      />
      {isOffline && (
        <div className="offline-banner">
          <span>⚠ You are currently offline</span>
        </div>
      )}
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log error to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
          console.error('Global error caught:', error, errorInfo);
          // TODO: Send to error monitoring service
        }
      }}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <BrowserRouter>
        <ThemeProvider>
          <I18nProvider>
            <NotificationProvider>
              <ModalProvider>
                <AuthProvider>
                  <OrganizationProvider>
                    <PatientProvider>
                <Suspense fallback={
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '100vh' 
                  }}>
                    <LoadingSpinner size="large" text="Loading application..." />
                  </div>
                }>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route 
                      path="/app/*" 
                      element={
                        <ProtectedRoute>
                          <MainApplication />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/" element={<Navigate to="/app" replace />} />
                    <Route path="*" element={<Navigate to="/app" replace />} />
                  </Routes>
                </Suspense>
                <AppNotifications />
                    </PatientProvider>
                  </OrganizationProvider>
                </AuthProvider>
              </ModalProvider>
            </NotificationProvider>
          </I18nProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

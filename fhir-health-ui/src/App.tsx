import React from 'react';
import { AuthProvider, OrganizationProvider, PatientProvider } from './contexts';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute, MainApplication } from './components';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/Toast';
import { useNotifications } from './contexts/NotificationContext';
import { useOfflineDetection } from './hooks/useOfflineDetection';
import { enhancedFhirClient } from './services/enhancedFhirClient';
import './App.css';

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
      <NotificationProvider>
        <AuthProvider>
          <OrganizationProvider>
            <PatientProvider>
              <ProtectedRoute>
                <MainApplication />
              </ProtectedRoute>
              <AppNotifications />
            </PatientProvider>
          </OrganizationProvider>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;

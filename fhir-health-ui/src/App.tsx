import React from 'react';
import { AuthProvider, OrganizationProvider, PatientProvider } from './contexts';
import { ProtectedRoute, MainApplication } from './components';
import './App.css';

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <PatientProvider>
          <ProtectedRoute>
            <MainApplication />
          </ProtectedRoute>
        </PatientProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}

export default App;

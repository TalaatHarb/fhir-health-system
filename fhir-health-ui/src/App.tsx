import React from 'react';
import { AuthProvider, OrganizationProvider } from './contexts';
import { ProtectedRoute, MainApplication } from './components';
import './App.css';

function App(): JSX.Element {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <ProtectedRoute>
          <MainApplication />
        </ProtectedRoute>
      </OrganizationProvider>
    </AuthProvider>
  );
}

export default App;

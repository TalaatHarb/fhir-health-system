import React from 'react';
import { AuthProvider } from './contexts';
import { ProtectedRoute, MainApplication } from './components';
import './App.css';

function App(): JSX.Element {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MainApplication />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;

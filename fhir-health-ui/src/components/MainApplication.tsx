import React from 'react';
import { useAuth } from '../contexts';

export function MainApplication(): JSX.Element {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>FHIR Resource Visualizer</h1>
      <div style={{ marginBottom: '2rem' }}>
        <h2>Welcome, {user?.name || 'User'}!</h2>
        <p>You are successfully authenticated.</p>
        <p><strong>Username:</strong> {user?.username}</p>
        <p><strong>Email:</strong> {user?.email}</p>
      </div>
      
      <button 
        onClick={logout}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '600'
        }}
      >
        Logout
      </button>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <p><em>This is a temporary main application component. Future tasks will implement the full FHIR visualization interface.</em></p>
      </div>
    </div>
  );
}
import React from 'react';
import { useAuth, useOrganization } from '../contexts';
import { OrganizationModal } from './organization/OrganizationModal';

export function MainApplication() {
  const { user, logout } = useAuth();
  const { 
    currentOrganization, 
    organizations, 
    selectOrganization, 
    showOrganizationModal,
    hideOrganizationModal,
    loading,
    error
  } = useOrganization();

  // Check if organization modal should be shown
  const isModalOpen = !currentOrganization || organizations.length > 0 && !currentOrganization;

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>FHIR Resource Visualizer</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Welcome, {user?.name || 'User'}!</h2>
        <p>You are successfully authenticated.</p>
        <p><strong>Username:</strong> {user?.username}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        
        {currentOrganization && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            backgroundColor: '#e8f5e8', 
            borderRadius: '6px',
            border: '1px solid #10b981'
          }}>
            <p><strong>Current Organization:</strong> {currentOrganization.name || 'Unnamed Organization'}</p>
            {currentOrganization.id && <p><strong>Organization ID:</strong> {currentOrganization.id}</p>}
            <button
              onClick={showOrganizationModal}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Switch Organization
            </button>
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
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
        
        {currentOrganization && (
          <button
            onClick={showOrganizationModal}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Change Organization
          </button>
        )}
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <p><em>This is a temporary main application component. Future tasks will implement the full FHIR visualization interface.</em></p>
      </div>

      {/* Organization Selection Modal */}
      <OrganizationModal
        isOpen={isModalOpen}
        organizations={organizations}
        currentOrg={currentOrganization}
        onSelect={selectOrganization}
        onClose={hideOrganizationModal}
        loading={loading}
        error={error}
      />
    </div>
  );
}
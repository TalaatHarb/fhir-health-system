import React from 'react';
import { useAuth, useOrganization, usePatient } from '../contexts';
import { OrganizationModal } from './organization/OrganizationModal';
import { PatientSearch } from './patient/PatientSearch';
import { PatientCreateModal } from './patient/PatientCreateModal';

export function MainApplication(): React.JSX.Element {
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
  const { state: patientState } = usePatient();

  // Check if organization modal should be shown
  const isModalOpen = !currentOrganization || organizations.length > 0 && !currentOrganization;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#1f2937', fontSize: '1.5rem', fontWeight: '700' }}>
            FHIR Resource Visualizer
          </h1>
          {currentOrganization && (
            <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
              {currentOrganization.name || 'Unnamed Organization'}
            </p>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Welcome, {user?.name || 'User'}
          </span>
          
          {currentOrganization && (
            <button
              onClick={showOrganizationModal}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Switch Org
            </button>
          )}
          
          <button 
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem' }}>
        {currentOrganization ? (
          <PatientSearch />
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ color: '#1f2937', marginBottom: '1rem' }}>Select an Organization</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              Please select an organization to begin working with patient data.
            </p>
            <button
              onClick={showOrganizationModal}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              Select Organization
            </button>
          </div>
        )}
      </main>

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

      {/* Patient Creation Modal */}
      <PatientCreateModal
        isOpen={patientState.createModalOpen}
        onClose={() => {}}
      />
    </div>
  );
}
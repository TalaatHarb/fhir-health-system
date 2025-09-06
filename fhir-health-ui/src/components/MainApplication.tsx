import React from 'react';
import { useAuth, useOrganization, usePatient } from '../contexts';
import { useTheme } from '../contexts/ThemeContext';
import { OrganizationModal } from './organization/OrganizationModal';
import { TabManager } from './patient/TabManager';
import { PatientCreateModal } from './patient/PatientCreateModal';
import { ModalManager } from './common/Modal';
import { ThemeToggle } from './ui/ThemeToggle';
import { TestIds } from '../types/testable';

export function MainApplication(): React.JSX.Element {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { 
    currentOrganization, 
    organizations, 
    selectOrganization, 
    showOrganizationModal,
    hideOrganizationModal,
    modalOpen,
    loading,
    error
  } = useOrganization();
  const { state: patientState, closeCreateModal } = usePatient();

  // Use the modal state from the context
  const isModalOpen = modalOpen;

  return (
    <div className="layout-container full-viewport" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <header 
        data-testid={TestIds.MAIN_HEADER}
        style={{ 
          backgroundColor: 'var(--color-surface)', 
          borderBottom: '1px solid var(--color-border)',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}
      >
        <div>
          <h1 
            data-testid={TestIds.APP_TITLE}
            style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '1.5rem', fontWeight: '700' }}
          >
            FHIR Resource Visualizer
          </h1>
          {currentOrganization && (
            <p 
              data-testid={TestIds.CURRENT_ORG}
              style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}
            >
              {currentOrganization.name || 'Unnamed Organization'}
            </p>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span 
            data-testid={TestIds.USER_WELCOME}
            style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}
          >
            Welcome, {user?.name || 'User'}
          </span>
          
          {/* Theme Toggle Control */}
          <ThemeToggle showLabel={false} />
          
          {currentOrganization && (
            <button
              data-testid={TestIds.SWITCH_ORG_BUTTON}
              onClick={showOrganizationModal}
              className="btn btn--secondary"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                minHeight: 'auto'
              }}
            >
              Switch Org
            </button>
          )}
          
          <button 
            data-testid={TestIds.LOGOUT_BUTTON}
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              minHeight: 'auto'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main 
        id="main-content" 
        className="layout-content custom-scrollbar" 
        style={{ padding: '2rem', backgroundColor: 'var(--color-background)' }} 
        role="main"
      >
        {currentOrganization ? (
          <TabManager />
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            backgroundColor: 'var(--color-surface)',
            borderRadius: '0.75rem',
            border: '1px solid var(--color-border)'
          }}>
            <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '1rem' }}>Select an Organization</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
              Please select an organization to begin working with patient data.
            </p>
            <button
              data-testid={TestIds.ORG_SELECT_BUTTON}
              onClick={showOrganizationModal}
              className="btn btn--primary"
              style={{
                padding: '0.75rem 1.5rem',
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
        onClose={closeCreateModal}
      />

      {/* Modal Manager for new modal system */}
      <ModalManager />
    </div>
  );
}
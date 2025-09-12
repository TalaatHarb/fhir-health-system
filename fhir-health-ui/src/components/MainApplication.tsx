import React from 'react';
import { useAuth, useOrganization, usePatient } from '../contexts';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { OrganizationModal } from './organization/OrganizationModal';
import { TabManager } from './patient/TabManager';
import { PatientCreateModal } from './patient/PatientCreateModal';
import { ModalManager } from './common/Modal';
import { ThemeToggle } from './ui/ThemeToggle';
import { LanguageSelector } from './ui/LanguageSelector';
import { ThemeErrorBoundary, I18nErrorBoundary, ModalErrorBoundary, PatientErrorBoundary } from './common/ErrorBoundary';
import { TestIds } from '../types/testable';

export function MainApplication(): React.JSX.Element {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
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

  // Graceful fallback for theme system
  const safeTheme = theme || 'light';

  // Graceful fallback for translation system
  const safeT = (key: string, fallback?: string) => {
    try {
      return t(key);
    } catch (error) {
      console.warn(`Translation key "${key}" failed, using fallback`);
      return fallback || key;
    }
  };

  return (
    <div className="layout-container full-viewport" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header with error boundaries for UI components */}
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
          <I18nErrorBoundary>
            <h1 
              data-testid={TestIds.APP_TITLE}
              style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '1.5rem', fontWeight: '700' }}
            >
              {safeT('navigation.dashboard', 'Dashboard')} - FHIR Resource Visualizer
            </h1>
            {currentOrganization && (
              <p 
                data-testid={TestIds.CURRENT_ORG}
                style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}
              >
                {currentOrganization.name || 'Unnamed Organization'}
              </p>
            )}
          </I18nErrorBoundary>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <I18nErrorBoundary>
            <span 
              data-testid={TestIds.USER_WELCOME}
              style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}
            >
              {safeT('auth.loginSuccess', 'Welcome')}, {user?.name || safeT('common.user', 'User')}
            </span>
          </I18nErrorBoundary>
          
          {/* Language Selector with error boundary */}
          <I18nErrorBoundary>
            <LanguageSelector variant="button" showLabel={false} />
          </I18nErrorBoundary>
          
          {/* Theme Toggle Control with error boundary */}
          <ThemeErrorBoundary>
            <ThemeToggle showLabel={false} />
          </ThemeErrorBoundary>
          
          {currentOrganization && (
            <I18nErrorBoundary>
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
                {safeT('organization.selectOrganization', 'Select Organization')}
              </button>
            </I18nErrorBoundary>
          )}
          
          <I18nErrorBoundary>
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
              {safeT('auth.logout', 'Logout')}
            </button>
          </I18nErrorBoundary>
        </div>
      </header>

      {/* Main Content with patient error boundary */}
      <main 
        id="main-content" 
        className="layout-content custom-scrollbar scrollable-vertical optimized-scroll" 
        style={{ padding: '2rem', backgroundColor: 'var(--color-background)' }} 
        role="main"
      >
        {currentOrganization ? (
          <PatientErrorBoundary>
            <TabManager />
          </PatientErrorBoundary>
        ) : (
          <I18nErrorBoundary>
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem 2rem',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '0.75rem',
              border: '1px solid var(--color-border)'
            }}>
              <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
                {safeT('organization.selectOrganization', 'Select Organization')}
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                {safeT('organization.noOrganization', 'No organization selected')}. {safeT('patient.selectToBegin', 'Please select to begin')}.
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
                {safeT('organization.selectOrganization', 'Select Organization')}
              </button>
            </div>
          </I18nErrorBoundary>
        )}
      </main>

      {/* Organization Selection Modal with error boundary */}
      <ModalErrorBoundary>
        <OrganizationModal
          isOpen={isModalOpen}
          organizations={organizations}
          currentOrg={currentOrganization}
          onSelect={selectOrganization}
          onClose={hideOrganizationModal}
          loading={loading}
          error={error}
        />
      </ModalErrorBoundary>

      {/* Patient Creation Modal with error boundary */}
      <ModalErrorBoundary>
        <PatientCreateModal
          isOpen={patientState.createModalOpen}
          onClose={closeCreateModal}
        />
      </ModalErrorBoundary>

      {/* Modal Manager for new modal system with error boundary */}
      <ModalErrorBoundary>
        <ModalManager />
      </ModalErrorBoundary>
    </div>
  );
}
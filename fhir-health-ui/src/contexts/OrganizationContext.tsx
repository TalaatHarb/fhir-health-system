import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Organization, OrganizationContextValue, OrganizationAction, OrganizationState } from '../types';
import { fhirClient } from '../services/fhirClient';

// Initial state
const initialState: OrganizationState = {
  current: null,
  available: [],
  modalOpen: false,
  loading: false,
  error: null,
};

// Organization reducer
function organizationReducer(state: OrganizationState, action: OrganizationAction): OrganizationState {
  switch (action.type) {
    case 'FETCH_ORGANIZATIONS_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'FETCH_ORGANIZATIONS_SUCCESS':
      return {
        ...state,
        loading: false,
        available: action.payload,
        error: null,
      };
    case 'FETCH_ORGANIZATIONS_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'SELECT_ORGANIZATION':
      return {
        ...state,
        current: action.payload,
        modalOpen: false,
        error: null,
      };
    case 'SHOW_ORGANIZATION_MODAL':
      return {
        ...state,
        modalOpen: true,
      };
    case 'HIDE_ORGANIZATION_MODAL':
      return {
        ...state,
        modalOpen: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// Create context
const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

// Provider component
interface OrganizationProviderProps {
  children: React.ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const [state, dispatch] = useReducer(organizationReducer, initialState);

  // Fetch organizations from FHIR server
  const fetchOrganizations = useCallback(async (): Promise<void> => {
    dispatch({ type: 'FETCH_ORGANIZATIONS_START' });
    
    try {
      const bundle = await fhirClient.searchOrganizations({});
      const organizations = bundle.entry?.map(entry => entry.resource).filter(Boolean) as Organization[] || [];
      dispatch({ type: 'FETCH_ORGANIZATIONS_SUCCESS', payload: organizations });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch organizations';
      dispatch({ type: 'FETCH_ORGANIZATIONS_FAILURE', payload: errorMessage });
    }
  }, []);

  // Select organization
  const selectOrganization = useCallback((org: Organization): void => {
    dispatch({ type: 'SELECT_ORGANIZATION', payload: org });
    
    // Update FHIR client configuration with selected organization
    if (org.id) {
      fhirClient.setOrganization(org.id);
    }
  }, []);

  // Show organization modal
  const showOrganizationModal = useCallback((): void => {
    dispatch({ type: 'SHOW_ORGANIZATION_MODAL' });
  }, []);

  // Hide organization modal
  const hideOrganizationModal = useCallback((): void => {
    dispatch({ type: 'HIDE_ORGANIZATION_MODAL' });
  }, []);

  // Auto-fetch organizations on mount and show modal if no organization selected
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Show organization modal if no current organization is selected
  useEffect(() => {
    if (!state.current && !state.modalOpen && (state.available.length > 0 || state.error || state.loading)) {
      dispatch({ type: 'SHOW_ORGANIZATION_MODAL' });
    }
  }, [state.available, state.current, state.modalOpen, state.error, state.loading]);

  const contextValue: OrganizationContextValue = {
    currentOrganization: state.current,
    organizations: state.available,
    selectOrganization,
    fetchOrganizations,
    showOrganizationModal,
    hideOrganizationModal,
    modalOpen: state.modalOpen,
    loading: state.loading,
    error: state.error,
  };

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}

// Hook to use organization context
export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
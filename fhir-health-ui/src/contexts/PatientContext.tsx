import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Patient, Bundle, PatientSearchQuery } from '../types/fhir';
import { fhirClient } from '../services/fhirClient';
import { useOrganization } from './OrganizationContext';

// Patient Context State
export interface PatientState {
  // Search functionality
  searchQuery: string;
  searchResults: Patient[];
  searchLoading: boolean;
  searchError: string | null;
  
  // Patient creation
  createModalOpen: boolean;
  createLoading: boolean;
  createError: string | null;
  
  // Multi-patient tab management
  openPatients: Map<string, Patient>;
  activePatientId: string | null;
}

// Patient Context Actions
export type PatientAction =
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SEARCH_PATIENTS_START' }
  | { type: 'SEARCH_PATIENTS_SUCCESS'; payload: Patient[] }
  | { type: 'SEARCH_PATIENTS_ERROR'; payload: string }
  | { type: 'CLEAR_SEARCH_RESULTS' }
  | { type: 'OPEN_CREATE_MODAL' }
  | { type: 'CLOSE_CREATE_MODAL' }
  | { type: 'CREATE_PATIENT_START' }
  | { type: 'CREATE_PATIENT_SUCCESS'; payload: Patient }
  | { type: 'CREATE_PATIENT_ERROR'; payload: string }
  | { type: 'OPEN_PATIENT'; payload: Patient }
  | { type: 'CLOSE_PATIENT'; payload: string }
  | { type: 'SET_ACTIVE_PATIENT'; payload: string | null }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: PatientState = {
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  searchError: null,
  createModalOpen: false,
  createLoading: false,
  createError: null,
  openPatients: new Map(),
  activePatientId: null,
};

// Patient reducer
function patientReducer(state: PatientState, action: PatientAction): PatientState {
  switch (action.type) {
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
        searchError: null,
      };

    case 'SEARCH_PATIENTS_START':
      return {
        ...state,
        searchLoading: true,
        searchError: null,
      };

    case 'SEARCH_PATIENTS_SUCCESS':
      return {
        ...state,
        searchLoading: false,
        searchResults: action.payload,
        searchError: null,
      };

    case 'SEARCH_PATIENTS_ERROR':
      return {
        ...state,
        searchLoading: false,
        searchError: action.payload,
        searchResults: [],
      };

    case 'CLEAR_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: [],
        searchQuery: '',
        searchError: null,
      };

    case 'OPEN_CREATE_MODAL':
      return {
        ...state,
        createModalOpen: true,
        createError: null,
      };

    case 'CLOSE_CREATE_MODAL':
      return {
        ...state,
        createModalOpen: false,
        createError: null,
      };

    case 'CREATE_PATIENT_START':
      return {
        ...state,
        createLoading: true,
        createError: null,
      };

    case 'CREATE_PATIENT_SUCCESS':
      const newPatient = action.payload;
      const updatedOpenPatients = new Map(state.openPatients);
      updatedOpenPatients.set(newPatient.id!, newPatient);
      
      return {
        ...state,
        createLoading: false,
        createModalOpen: false,
        createError: null,
        openPatients: updatedOpenPatients,
        activePatientId: newPatient.id!,
        // Add to search results if it matches current search
        searchResults: state.searchQuery ? 
          [newPatient, ...state.searchResults] : 
          state.searchResults,
      };

    case 'CREATE_PATIENT_ERROR':
      return {
        ...state,
        createLoading: false,
        createError: action.payload,
      };

    case 'OPEN_PATIENT':
      const patient = action.payload;
      const updatedPatients = new Map(state.openPatients);
      updatedPatients.set(patient.id!, patient);
      
      return {
        ...state,
        openPatients: updatedPatients,
        activePatientId: patient.id!,
      };

    case 'CLOSE_PATIENT':
      const patientIdToClose = action.payload;
      const patientsAfterClose = new Map(state.openPatients);
      patientsAfterClose.delete(patientIdToClose);
      
      // If closing the active patient, set a new active patient or null
      let newActivePatientId = state.activePatientId;
      if (state.activePatientId === patientIdToClose) {
        const remainingPatients = Array.from(patientsAfterClose.keys());
        newActivePatientId = remainingPatients.length > 0 ? remainingPatients[0] : null;
      }
      
      return {
        ...state,
        openPatients: patientsAfterClose,
        activePatientId: newActivePatientId,
      };

    case 'SET_ACTIVE_PATIENT':
      return {
        ...state,
        activePatientId: action.payload,
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Patient Context Value
export interface PatientContextValue {
  // State
  state: PatientState;
  
  // Search functions
  searchPatients: (query: string) => Promise<void>;
  clearSearchResults: () => void;
  
  // Patient creation functions
  openCreateModal: () => void;
  closeCreateModal: () => void;
  createPatient: (patientData: Omit<Patient, 'id' | 'resourceType'>) => Promise<void>;
  
  // Multi-patient tab management
  openPatient: (patient: Patient) => void;
  closePatient: (patientId: string) => void;
  setActivePatient: (patientId: string | null) => void;
  getActivePatient: () => Patient | null;
  
  // Utility functions
  resetState: () => void;
}

// Create context
const PatientContext = createContext<PatientContextValue | undefined>(undefined);

// Patient Provider Props
export interface PatientProviderProps {
  children: React.ReactNode;
}

// Patient Provider Component
export function PatientProvider({ children }: PatientProviderProps) {
  const [state, dispatch] = useReducer(patientReducer, initialState);
  const { currentOrganization } = useOrganization();

  // Update FHIR client when organization changes
  useEffect(() => {
    if (currentOrganization?.id) {
      fhirClient.setOrganization(currentOrganization.id);
    }
  }, [currentOrganization]);

  // Search patients function
  const searchPatients = useCallback(async (query: string) => {
    if (!query.trim()) {
      dispatch({ type: 'CLEAR_SEARCH_RESULTS' });
      return;
    }

    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    dispatch({ type: 'SEARCH_PATIENTS_START' });

    try {
      // Build search query - search by name, family name, or identifier
      const searchQuery: PatientSearchQuery = {
        name: query,
        _count: 20, // Limit results for performance
      };

      const bundle: Bundle<Patient> = await fhirClient.searchPatients(searchQuery);
      const patients = bundle.entry?.map(entry => entry.resource!).filter(Boolean) || [];
      
      dispatch({ type: 'SEARCH_PATIENTS_SUCCESS', payload: patients });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search patients';
      dispatch({ type: 'SEARCH_PATIENTS_ERROR', payload: errorMessage });
    }
  }, []);

  // Clear search results
  const clearSearchResults = useCallback(() => {
    dispatch({ type: 'CLEAR_SEARCH_RESULTS' });
  }, []);

  // Open create modal
  const openCreateModal = useCallback(() => {
    dispatch({ type: 'OPEN_CREATE_MODAL' });
  }, []);

  // Close create modal
  const closeCreateModal = useCallback(() => {
    dispatch({ type: 'CLOSE_CREATE_MODAL' });
  }, []);

  // Create patient function
  const createPatient = useCallback(async (patientData: Omit<Patient, 'id' | 'resourceType'>) => {
    dispatch({ type: 'CREATE_PATIENT_START' });

    try {
      const newPatientData: Omit<Patient, 'id'> = {
        resourceType: 'Patient',
        ...patientData,
        // Add organization reference if available
        ...(currentOrganization?.id && {
          managingOrganization: {
            reference: `Organization/${currentOrganization.id}`,
            display: currentOrganization.name,
          },
        }),
      };

      const createdPatient = await fhirClient.createPatient(newPatientData);
      dispatch({ type: 'CREATE_PATIENT_SUCCESS', payload: createdPatient });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create patient';
      dispatch({ type: 'CREATE_PATIENT_ERROR', payload: errorMessage });
    }
  }, [currentOrganization]);

  // Open patient in new tab
  const openPatient = useCallback((patient: Patient) => {
    dispatch({ type: 'OPEN_PATIENT', payload: patient });
  }, []);

  // Close patient tab
  const closePatient = useCallback((patientId: string) => {
    dispatch({ type: 'CLOSE_PATIENT', payload: patientId });
  }, []);

  // Set active patient
  const setActivePatient = useCallback((patientId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_PATIENT', payload: patientId });
  }, []);

  // Get active patient
  const getActivePatient = useCallback((): Patient | null => {
    if (!state.activePatientId) return null;
    return state.openPatients.get(state.activePatientId) || null;
  }, [state.activePatientId, state.openPatients]);

  // Reset state
  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Context value
  const contextValue: PatientContextValue = {
    state,
    searchPatients,
    clearSearchResults,
    openCreateModal,
    closeCreateModal,
    createPatient,
    openPatient,
    closePatient,
    setActivePatient,
    getActivePatient,
    resetState,
  };

  return (
    <PatientContext.Provider value={contextValue}>
      {children}
    </PatientContext.Provider>
  );
}

// Custom hook to use patient context
export function usePatient(): PatientContextValue {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
}
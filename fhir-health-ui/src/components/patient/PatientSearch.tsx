import React, { useState, useCallback, useEffect } from 'react';
import { usePatient } from '../../contexts/PatientContext';
import type { Patient } from '../../types/fhir';
import './PatientSearch.css';

export interface PatientSearchProps {
  onPatientSelect?: (patient: Patient) => void;
  onCreatePatient?: () => void;
  showAsButton?: boolean;
}

export function PatientSearch({ onPatientSelect, onCreatePatient, showAsButton = false }: PatientSearchProps) {
  const {
    state,
    searchPatients,
    clearSearchResults,
    openCreateModal,
    openPatient,
  } = usePatient();

  const [searchInput, setSearchInput] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

  // Handle search input changes with debouncing
  const handleSearchInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchInput(value);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const newTimeout = setTimeout(() => {
      if (value.trim()) {
        searchPatients(value.trim());
      } else {
        clearSearchResults();
      }
    }, 300); // 300ms debounce

    setSearchTimeout(newTimeout);
  }, [searchPatients, clearSearchResults, searchTimeout]);

  // Handle search form submission
  const handleSearchSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    if (searchInput.trim()) {
      searchPatients(searchInput.trim());
    }
  }, [searchPatients, searchInput]);

  // Handle patient selection
  const handlePatientSelect = useCallback((patient: Patient) => {
    if (onPatientSelect) {
      onPatientSelect(patient);
    } else {
      // Default behavior: open patient in new tab
      openPatient(patient);
    }
  }, [onPatientSelect, openPatient]);

  // Handle create patient button click
  const handleCreatePatient = useCallback(() => {
    if (onCreatePatient) {
      onCreatePatient();
    } else {
      // Default behavior: open create modal
      openCreateModal();
    }
  }, [onCreatePatient, openCreateModal]);

  // Clear search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Format patient display name
  const formatPatientName = (patient: Patient): string => {
    if (!patient.name || patient.name.length === 0) {
      return 'Unknown Patient';
    }

    const primaryName = patient.name[0];
    const parts: string[] = [];

    if (primaryName.given && primaryName.given.length > 0) {
      parts.push(primaryName.given.join(' '));
    }

    if (primaryName.family) {
      parts.push(primaryName.family);
    }

    return parts.length > 0 ? parts.join(' ') : 'Unknown Patient';
  };

  // Format patient identifier
  const formatPatientIdentifier = (patient: Patient): string | null => {
    if (!patient.identifier || patient.identifier.length === 0) {
      return null;
    }

    // Find the first identifier with a value
    const identifier = patient.identifier.find(id => id.value);
    if (!identifier) {
      return null;
    }

    return identifier.value!;
  };

  // Format patient demographics
  const formatPatientDemographics = (patient: Patient): string => {
    const parts: string[] = [];

    if (patient.gender) {
      parts.push(patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1));
    }

    if (patient.birthDate) {
      const birthDate = new Date(patient.birthDate);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      parts.push(`Age ${age}`);
    }

    return parts.join(', ');
  };

  // If showing as button, render compact button version
  if (showAsButton) {
    return (
      <button
        className="patient-search__add-button"
        onClick={handleCreatePatient}
        disabled={state.createLoading}
        title="Search or create new patient"
      >
        + Add Patient
      </button>
    );
  }

  return (
    <div className="patient-search">
      <div className="patient-search__header">
        <h2>Patient Search</h2>
        <p>Search for existing patients or create a new patient record.</p>
      </div>

      <form className="patient-search__form" onSubmit={handleSearchSubmit}>
        <div className="patient-search__input-group">
          <input
            type="text"
            className="patient-search__input"
            placeholder="Search by name, family name, or identifier..."
            value={searchInput}
            onChange={handleSearchInputChange}
            disabled={state.searchLoading}
          />
          <button
            type="submit"
            className="patient-search__search-button"
            disabled={state.searchLoading || !searchInput.trim()}
          >
            {state.searchLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      <div className="patient-search__actions">
        <button
          type="button"
          className="patient-search__create-button"
          onClick={handleCreatePatient}
          disabled={state.createLoading}
        >
          Create New Patient
        </button>
      </div>

      {/* Search Results */}
      {state.searchError && (
        <div className="patient-search__error">
          <p>Error searching patients: {state.searchError}</p>
          <button
            type="button"
            className="patient-search__retry-button"
            onClick={() => searchPatients(searchInput)}
          >
            Retry
          </button>
        </div>
      )}

      {state.searchLoading && (
        <div className="patient-search__loading">
          <p>Searching patients...</p>
        </div>
      )}

      {state.searchResults.length > 0 && (
        <div className="patient-search__results">
          <h3>Search Results ({state.searchResults.length})</h3>
          <div className="patient-search__results-list">
            {state.searchResults.map((patient) => (
              <div
                key={patient.id}
                className="patient-search__result-item"
                onClick={() => handlePatientSelect(patient)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePatientSelect(patient);
                  }
                }}
              >
                <div className="patient-search__result-header">
                  <h4 className="patient-search__result-name">
                    {formatPatientName(patient)}
                  </h4>
                  {formatPatientIdentifier(patient) && (
                    <span className="patient-search__result-id">
                      ID: {formatPatientIdentifier(patient)}
                    </span>
                  )}
                </div>
                
                <div className="patient-search__result-details">
                  {formatPatientDemographics(patient) && (
                    <p className="patient-search__result-demographics">
                      {formatPatientDemographics(patient)}
                    </p>
                  )}
                  
                  {patient.address && patient.address.length > 0 && (
                    <p className="patient-search__result-address">
                      {patient.address[0].city && patient.address[0].state && 
                        `${patient.address[0].city}, ${patient.address[0].state}`
                      }
                    </p>
                  )}
                </div>

                <div className="patient-search__result-actions">
                  <span className="patient-search__result-action-hint">
                    Click to open patient
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!state.searchLoading && state.searchQuery && state.searchResults.length === 0 && !state.searchError && (
        <div className="patient-search__no-results">
          <p>No patients found matching "{state.searchQuery}"</p>
          <p>Try a different search term or create a new patient.</p>
        </div>
      )}
    </div>
  );
}
import React, { useState, useCallback } from 'react';
import { usePatient } from '../../contexts/PatientContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { InlineError, ErrorList } from '../common/InlineError';
import type { Patient, HumanName, Address, ContactPoint } from '../../types/fhir';
import { TestIds } from '../../types/testable';
import './PatientCreateModal.css';

export interface PatientCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated?: (patient: Patient) => void;
}

interface PatientFormData {
  givenName: string;
  familyName: string;
  gender: 'male' | 'female' | 'other' | 'unknown' | '';
  birthDate: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const initialFormData: PatientFormData = {
  givenName: '',
  familyName: '',
  gender: '',
  birthDate: '',
  email: '',
  phone: '',
  addressLine: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
};

export function PatientCreateModal({ isOpen, onClose, onPatientCreated }: PatientCreateModalProps) {
  const { state, createPatient, closeCreateModal } = usePatient();
  const { showSuccess, showError } = useNotifications();
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<Partial<PatientFormData>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PatientFormData, boolean>>>({});

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [validationErrors]);

  // Validate form data
  const validateForm = useCallback((): boolean => {
    const errors: Partial<PatientFormData> = {};

    // Required fields
    if (!formData.givenName.trim()) {
      errors.givenName = 'Given name is required';
    }

    if (!formData.familyName.trim()) {
      errors.familyName = 'Family name is required';
    }

    if (!formData.gender) {
      errors.gender = 'Gender is required' as any;
    }

    if (!formData.birthDate) {
      errors.birthDate = 'Birth date is required';
    } else {
      // Validate birth date is not in the future
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      if (birthDate > today) {
        errors.birthDate = 'Birth date cannot be in the future';
      }
    }

    // Email validation (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation (if provided)
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Convert form data to FHIR Patient resource
  const convertToFHIRPatient = useCallback((): Omit<Patient, 'id' | 'resourceType'> => {
    const patient: Omit<Patient, 'id' | 'resourceType'> = {
      active: true,
    };

    // Name
    const name: HumanName = {
      use: 'official',
      family: formData.familyName.trim(),
      given: [formData.givenName.trim()],
    };
    patient.name = [name];

    // Gender
    if (formData.gender) {
      patient.gender = formData.gender as 'male' | 'female' | 'other' | 'unknown';
    }

    // Birth date
    if (formData.birthDate) {
      patient.birthDate = formData.birthDate;
    }

    // Contact points (telecom)
    const telecom: ContactPoint[] = [];
    
    if (formData.email.trim()) {
      telecom.push({
        system: 'email',
        value: formData.email.trim(),
        use: 'home',
      });
    }

    if (formData.phone.trim()) {
      telecom.push({
        system: 'phone',
        value: formData.phone.trim(),
        use: 'home',
      });
    }

    if (telecom.length > 0) {
      patient.telecom = telecom;
    }

    // Address
    if (formData.addressLine.trim() || formData.city.trim() || formData.state.trim() || formData.postalCode.trim()) {
      const address: Address = {
        use: 'home',
        type: 'both',
      };

      if (formData.addressLine.trim()) {
        address.line = [formData.addressLine.trim()];
      }

      if (formData.city.trim()) {
        address.city = formData.city.trim();
      }

      if (formData.state.trim()) {
        address.state = formData.state.trim();
      }

      if (formData.postalCode.trim()) {
        address.postalCode = formData.postalCode.trim();
      }

      if (formData.country.trim()) {
        address.country = formData.country.trim();
      }

      patient.address = [address];
    }

    return patient;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const patientData = convertToFHIRPatient();
      await createPatient(patientData);
      
      // Show success notification
      showSuccess('Patient Created', `Patient ${formData.givenName} ${formData.familyName} has been created successfully.`);
      
      // Reset form
      setFormData(initialFormData);
      setValidationErrors({});
      setTouched({});
      
      // Close modal
      handleClose();
      
      // Notify parent if callback provided
      if (onPatientCreated && state.openPatients.size > 0) {
        const patients = Array.from(state.openPatients.values());
        const newestPatient = patients[patients.length - 1];
        onPatientCreated(newestPatient);
      }
    } catch (error) {
      // Show error notification
      showError('Failed to Create Patient', error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  }, [validateForm, convertToFHIRPatient, createPatient, onPatientCreated, state.openPatients]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      closeCreateModal();
    }
    
    // Reset form when closing
    setFormData(initialFormData);
    setValidationErrors({});
    setTouched({});
  }, [onClose, closeCreateModal]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <div className="patient-create-modal__overlay" data-testid={TestIds.MODAL_OVERLAY} onClick={handleClose}>
      <div className="patient-create-modal__content" data-testid={TestIds.PATIENT_CREATE_MODAL} onClick={(e) => e.stopPropagation()}>
        <div className="patient-create-modal__header">
          <h2>Create New Patient</h2>
          <button
            type="button"
            className="patient-create-modal__close-button"
            data-testid={TestIds.MODAL_CLOSE}
            onClick={handleClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form className="patient-create-modal__form" data-testid={TestIds.PATIENT_FORM} onSubmit={handleSubmit}>
          {/* Basic Information */}
          <fieldset className="patient-create-modal__fieldset">
            <legend>Basic Information</legend>
            
            <div className="patient-create-modal__form-row">
              <div className="patient-create-modal__form-group">
                <label htmlFor="givenName" className="patient-create-modal__label">
                  Given Name *
                </label>
                <input
                  type="text"
                  id="givenName"
                  data-testid={TestIds.GIVEN_NAME_INPUT}
                  className={`patient-create-modal__input ${validationErrors.givenName ? 'patient-create-modal__input--error' : ''}`}
                  value={formData.givenName}
                  onChange={(e) => handleFieldChange('givenName', e.target.value)}
                  disabled={state.createLoading}
                  required
                />
                <InlineError 
                  error={validationErrors.givenName} 
                  show={touched.givenName && !!validationErrors.givenName}
                />
              </div>

              <div className="patient-create-modal__form-group">
                <label htmlFor="familyName" className="patient-create-modal__label">
                  Family Name *
                </label>
                <input
                  type="text"
                  id="familyName"
                  data-testid={TestIds.FAMILY_NAME_INPUT}
                  className={`patient-create-modal__input ${validationErrors.familyName ? 'patient-create-modal__input--error' : ''}`}
                  value={formData.familyName}
                  onChange={(e) => handleFieldChange('familyName', e.target.value)}
                  disabled={state.createLoading}
                  required
                />
                <InlineError 
                  error={validationErrors.familyName} 
                  show={touched.familyName && !!validationErrors.familyName}
                />
              </div>
            </div>

            <div className="patient-create-modal__form-row">
              <div className="patient-create-modal__form-group">
                <label htmlFor="gender" className="patient-create-modal__label">
                  Gender *
                </label>
                <select
                  id="gender"
                  data-testid={TestIds.GENDER_SELECT}
                  className={`patient-create-modal__select ${validationErrors.gender ? 'patient-create-modal__input--error' : ''}`}
                  value={formData.gender}
                  onChange={(e) => handleFieldChange('gender', e.target.value)}
                  disabled={state.createLoading}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="unknown">Unknown</option>
                </select>
                <InlineError 
                  error={validationErrors.gender} 
                  show={touched.gender && !!validationErrors.gender}
                />
              </div>

              <div className="patient-create-modal__form-group">
                <label htmlFor="birthDate" className="patient-create-modal__label">
                  Birth Date *
                </label>
                <input
                  type="date"
                  id="birthDate"
                  data-testid={TestIds.BIRTH_DATE_INPUT}
                  className={`patient-create-modal__input ${validationErrors.birthDate ? 'patient-create-modal__input--error' : ''}`}
                  value={formData.birthDate}
                  onChange={(e) => handleFieldChange('birthDate', e.target.value)}
                  disabled={state.createLoading}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
                <InlineError 
                  error={validationErrors.birthDate} 
                  show={touched.birthDate && !!validationErrors.birthDate}
                />
              </div>
            </div>
          </fieldset>

          {/* Contact Information */}
          <fieldset className="patient-create-modal__fieldset">
            <legend>Contact Information</legend>
            
            <div className="patient-create-modal__form-row">
              <div className="patient-create-modal__form-group">
                <label htmlFor="email" className="patient-create-modal__label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  data-testid={TestIds.EMAIL_INPUT}
                  className={`patient-create-modal__input ${validationErrors.email ? 'patient-create-modal__input--error' : ''}`}
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  disabled={state.createLoading}
                />
                <InlineError 
                  error={validationErrors.email} 
                  show={touched.email && !!validationErrors.email}
                />
              </div>

              <div className="patient-create-modal__form-group">
                <label htmlFor="phone" className="patient-create-modal__label">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  data-testid={TestIds.PHONE_INPUT}
                  className={`patient-create-modal__input ${validationErrors.phone ? 'patient-create-modal__input--error' : ''}`}
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  disabled={state.createLoading}
                />
                <InlineError 
                  error={validationErrors.phone} 
                  show={touched.phone && !!validationErrors.phone}
                />
              </div>
            </div>
          </fieldset>

          {/* Address Information */}
          <fieldset className="patient-create-modal__fieldset">
            <legend>Address Information</legend>
            
            <div className="patient-create-modal__form-group">
              <label htmlFor="addressLine" className="patient-create-modal__label">
                Street Address
              </label>
              <input
                type="text"
                id="addressLine"
                className="patient-create-modal__input"
                value={formData.addressLine}
                onChange={(e) => handleFieldChange('addressLine', e.target.value)}
                disabled={state.createLoading}
              />
            </div>

            <div className="patient-create-modal__form-row">
              <div className="patient-create-modal__form-group">
                <label htmlFor="city" className="patient-create-modal__label">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  className="patient-create-modal__input"
                  value={formData.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  disabled={state.createLoading}
                />
              </div>

              <div className="patient-create-modal__form-group">
                <label htmlFor="state" className="patient-create-modal__label">
                  State/Province
                </label>
                <input
                  type="text"
                  id="state"
                  className="patient-create-modal__input"
                  value={formData.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  disabled={state.createLoading}
                />
              </div>
            </div>

            <div className="patient-create-modal__form-row">
              <div className="patient-create-modal__form-group">
                <label htmlFor="postalCode" className="patient-create-modal__label">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  className="patient-create-modal__input"
                  value={formData.postalCode}
                  onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                  disabled={state.createLoading}
                />
              </div>

              <div className="patient-create-modal__form-group">
                <label htmlFor="country" className="patient-create-modal__label">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  className="patient-create-modal__input"
                  value={formData.country}
                  onChange={(e) => handleFieldChange('country', e.target.value)}
                  disabled={state.createLoading}
                />
              </div>
            </div>
          </fieldset>

          {/* Error Display */}
          {Object.keys(validationErrors).length > 0 && (
            <ErrorList 
              errors={validationErrors}
              title="Please fix the following errors before submitting:"
              maxErrors={5}
            />
          )}

          {/* Form Actions */}
          <div className="patient-create-modal__actions">
            <button
              type="button"
              className="patient-create-modal__cancel-button"
              data-testid={TestIds.PATIENT_FORM_CANCEL}
              onClick={handleClose}
              disabled={state.createLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="patient-create-modal__submit-button"
              data-testid={TestIds.PATIENT_FORM_SUBMIT}
              disabled={state.createLoading}
            >
              {state.createLoading ? 'Creating...' : 'Create Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useState, useCallback, useEffect } from 'react';
import { usePatient } from '../../contexts/PatientContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTranslation, useDateFormatter } from '../../hooks/useTranslation';
import { useModalNavigation } from '../../hooks/useModalNavigation';
import { useModal } from '../../contexts/ModalContext';
import { InlineError, ErrorList } from '../common/InlineError';
import { Modal } from '../common/Modal';
import type { Patient, HumanName, Address, ContactPoint } from '../../types/fhir';
import type { ModalPageProps } from '../common/Modal';
import { TestIds } from '../../types/testable';
import './PatientCreateModal.css';

// Legacy interface for backward compatibility
export interface LegacyPatientCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated?: (patient: Patient) => void;
}

// New modal page interface
export interface PatientCreateModalProps extends ModalPageProps {
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

// Modal page component for new modal system
export function PatientCreateModalPage({ modalId, pageId, pageData, onPatientCreated }: PatientCreateModalProps) {
  const { state, createPatient, closeCreateModal } = usePatient();
  const { showSuccess, showError } = useNotifications();
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();
  // Handle both new modal system and legacy usage
  const modalNavigation = modalId ? useModalNavigation(modalId) : null;
  const { close, updateCurrentPageData, getCurrentPageData } = modalNavigation || {
    close: () => {},
    updateCurrentPageData: () => {},
    getCurrentPageData: () => ({})
  };
  
  // Get form data from modal page data or use initial data
  const currentData = getCurrentPageData();
  const [formData, setFormData] = useState<PatientFormData>(currentData.formData || initialFormData);
  const [validationErrors, setValidationErrors] = useState<Partial<PatientFormData>>(currentData.validationErrors || {});
  const [touched, setTouched] = useState<Partial<Record<keyof PatientFormData, boolean>>>(currentData.touched || {});

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof PatientFormData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    const newTouched = { ...touched, [field]: true };
    const newValidationErrors = { ...validationErrors };
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      delete newValidationErrors[field];
    }
    
    setFormData(newFormData);
    setTouched(newTouched);
    setValidationErrors(newValidationErrors);
    
    // Update modal page data
    updateCurrentPageData({
      formData: newFormData,
      touched: newTouched,
      validationErrors: newValidationErrors,
    });
  }, [formData, touched, validationErrors, updateCurrentPageData]);

  // Validate form data
  const validateForm = useCallback((): boolean => {
    const errors: Partial<PatientFormData> = {};

    // Required fields
    if (!formData.givenName.trim()) {
      errors.givenName = t('validation.givenNameRequired');
    }

    if (!formData.familyName.trim()) {
      errors.familyName = t('validation.familyNameRequired');
    }

    if (!formData.gender) {
      errors.gender = t('validation.genderRequired') as any;
    }

    if (!formData.birthDate) {
      errors.birthDate = t('validation.birthDateRequired');
    } else {
      // Validate birth date is not in the future
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      if (birthDate > today) {
        errors.birthDate = t('validation.birthDateFuture');
      }
    }

    // Email validation (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('validation.emailInvalid');
    }

    // Phone validation (if provided)
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.phone = t('validation.phoneInvalid');
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
      // Mark all fields as touched when validation fails
      const allTouched = {
        givenName: true,
        familyName: true,
        gender: true,
        birthDate: true,
        email: true,
        phone: true,
        addressLine: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      };
      setTouched(allTouched);
      updateCurrentPageData({
        formData,
        touched: allTouched,
        validationErrors,
      });
      return;
    }

    try {
      const patientData = convertToFHIRPatient();
      await createPatient(patientData);
      
      // Show success notification
      showSuccess(t('patient.patientCreated'), `${t('patient.patientName')} ${formData.givenName} ${formData.familyName} ${t('patient.createdSuccessfully')}.`);
      
      // Close modal
      if (modalNavigation) {
        close();
      } else if (pageData?.onClose) {
        // Legacy mode - use the onClose callback from pageData
        pageData.onClose();
      }
      
      // Notify parent if callback provided
      if (onPatientCreated && state.openPatients.size > 0) {
        const patients = Array.from(state.openPatients.values());
        const newestPatient = patients[patients.length - 1];
        onPatientCreated(newestPatient);
      }
    } catch (error) {
      // Show error notification
      showError(t('errors.createPatientFailed'), error instanceof Error ? error.message : t('errors.unknownError'));
    }
  }, [validateForm, convertToFHIRPatient, createPatient, onPatientCreated, state.openPatients, formData, validationErrors, updateCurrentPageData, close, showSuccess, showError, t]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (modalNavigation) {
      close();
    } else if (pageData?.onClose) {
      // Legacy mode - use the onClose callback from pageData
      pageData.onClose();
    } else {
      // Fallback to patient context closeCreateModal
      closeCreateModal();
    }
  }, [close, modalNavigation, pageData, closeCreateModal]);

  return (
    <div className="patient-create-modal__content" data-testid={TestIds.PATIENT_CREATE_MODAL}>
      <form className="patient-create-modal__form" data-testid={TestIds.PATIENT_FORM} onSubmit={handleSubmit} noValidate>
          {/* Basic Information */}
          <fieldset className="patient-create-modal__fieldset">
            <legend>{t('patient.basicInfo')}</legend>
            
            <div className="patient-create-modal__form-row">
              <div className="patient-create-modal__form-group">
                <label htmlFor="givenName" className="patient-create-modal__label">
                  {t('patient.givenName')} *
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
                  {t('patient.familyName')} *
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
                  {t('patient.gender')} *
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
                  <option value="">{t('patient.selectGender')}</option>
                  <option value="male">{t('patient.male')}</option>
                  <option value="female">{t('patient.female')}</option>
                  <option value="other">{t('patient.other')}</option>
                  <option value="unknown">{t('patient.unknown')}</option>
                </select>
                <InlineError 
                  error={validationErrors.gender} 
                  show={touched.gender && !!validationErrors.gender}
                />
              </div>

              <div className="patient-create-modal__form-group">
                <label htmlFor="birthDate" className="patient-create-modal__label">
                  {t('patient.dateOfBirth')} *
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
            <legend>{t('patient.contactInfo')}</legend>
            
            <div className="patient-create-modal__form-row">
              <div className="patient-create-modal__form-group">
                <label htmlFor="email" className="patient-create-modal__label">
                  {t('patient.email')}
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
                  {t('patient.phone')}
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
            <legend>{t('patient.addressInfo')}</legend>
            
            <div className="patient-create-modal__form-group">
              <label htmlFor="addressLine" className="patient-create-modal__label">
                {t('patient.streetAddress')}
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
                  {t('patient.city')}
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
                  {t('patient.stateProvince')}
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
                  {t('patient.postalCode')}
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
                  {t('patient.country')}
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
          {state.createError && (
            <div className="patient-create-modal__error" role="alert">
              {t('errors.createPatientFailed')}: {state.createError}
            </div>
          )}
          
          {Object.keys(validationErrors).length > 0 && (
            <ErrorList 
              errors={validationErrors}
              title={t('validation.fixErrors')}
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="patient-create-modal__submit-button"
              data-testid={TestIds.PATIENT_FORM_SUBMIT}
              disabled={state.createLoading}
            >
              {state.createLoading ? t('patient.creating') : t('patient.createPatient')}
            </button>
          </div>
      </form>
    </div>
  );
}

// Legacy wrapper component for backward compatibility
export function PatientCreateModal({ isOpen, onClose, onPatientCreated }: LegacyPatientCreateModalProps) {
  const { t } = useTranslation();
  const [modalKey, setModalKey] = useState(0);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setModalKey(prev => prev + 1);
    }
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="modal-overlay modal-overlay--large"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-create-modal-title"
      data-testid="modal-overlay"
    >
      <div 
        className="modal-container modal-container--large"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <h2 id="patient-create-modal-title" className="modal-title">
              {t('patient.createPatient')}
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close"
            title="Close modal"
          >
            <span aria-hidden="true">×</span>
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          <PatientCreateModalPage
            key={modalKey} // Reset component when modal opens
            modalId={null} // No modal ID for legacy mode
            pageId="create"
            pageData={{ onPatientCreated, onClose }}
            onPatientCreated={onPatientCreated}
          />
        </div>
      </div>
    </div>
  );
}
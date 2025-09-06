import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { I18nProvider, useI18n, AVAILABLE_LANGUAGES } from '../../contexts/I18nContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.language
Object.defineProperty(navigator, 'language', {
  writable: true,
  value: 'en-US',
});

// Mock dynamic imports
vi.mock('../../translations/en.json', () => ({
  default: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      loading: 'Loading...',
    },
    patient: {
      createPatient: 'Create Patient',
      patientDetails: 'Patient Details',
    },
  },
}));

vi.mock('../../translations/es.json', () => ({
  default: {
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      loading: 'Cargando...',
    },
    patient: {
      createPatient: 'Crear Paciente',
      patientDetails: 'Detalles del Paciente',
    },
  },
}));

vi.mock('../../translations/fr.json', () => ({
  default: {
    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      loading: 'Chargement...',
    },
    patient: {
      createPatient: 'Créer un Patient',
      patientDetails: 'Détails du Patient',
    },
  },
}));

// Test component that uses I18n context
function TestComponent() {
  const { language, setLanguage, t, availableLanguages, isLoading, error } = useI18n();

  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="available-languages">{availableLanguages.length}</div>
      
      <div data-testid="translation-save">{t('common.save')}</div>
      <div data-testid="translation-cancel">{t('common.cancel')}</div>
      <div data-testid="translation-patient">{t('patient.createPatient')}</div>
      <div data-testid="translation-missing">{t('missing.key')}</div>
      
      <button 
        data-testid="change-to-spanish" 
        onClick={() => setLanguage('es')}
      >
        Change to Spanish
      </button>
      
      <button 
        data-testid="change-to-french" 
        onClick={() => setLanguage('fr')}
      >
        Change to French
      </button>
      
      <button 
        data-testid="change-to-invalid" 
        onClick={() => setLanguage('invalid')}
      >
        Change to Invalid
      </button>
    </div>
  );
}

describe('I18nContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should provide default language and translations', async () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Should start with English as default
    expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    
    // Should have all available languages
    expect(screen.getByTestId('available-languages')).toHaveTextContent(
      AVAILABLE_LANGUAGES.length.toString()
    );

    // Wait for translations to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Should display English translations
    expect(screen.getByTestId('translation-save')).toHaveTextContent('Save');
    expect(screen.getByTestId('translation-cancel')).toHaveTextContent('Cancel');
    expect(screen.getByTestId('translation-patient')).toHaveTextContent('Create Patient');
  });

  it('should handle missing translation keys', async () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Should return the key itself when translation is missing
    expect(screen.getByTestId('translation-missing')).toHaveTextContent('missing.key');
  });

  it('should change language and load new translations', async () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Change to Spanish
    fireEvent.click(screen.getByTestId('change-to-spanish'));

    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('es');
    });

    // Should display Spanish translations
    await waitFor(() => {
      expect(screen.getByTestId('translation-save')).toHaveTextContent('Guardar');
      expect(screen.getByTestId('translation-cancel')).toHaveTextContent('Cancelar');
      expect(screen.getByTestId('translation-patient')).toHaveTextContent('Crear Paciente');
    });

    // Should store language preference
    expect(localStorageMock.setItem).toHaveBeenCalledWith('fhir-health-ui-language', 'es');
  });

  it('should change to French and load French translations', async () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Change to French
    fireEvent.click(screen.getByTestId('change-to-french'));

    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('fr');
    });

    // Should display French translations
    await waitFor(() => {
      expect(screen.getByTestId('translation-save')).toHaveTextContent('Enregistrer');
      expect(screen.getByTestId('translation-cancel')).toHaveTextContent('Annuler');
      expect(screen.getByTestId('translation-patient')).toHaveTextContent('Créer un Patient');
    });
  });

  it('should ignore invalid language codes', async () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    const initialLanguage = screen.getByTestId('current-language').textContent;

    // Try to change to invalid language
    fireEvent.click(screen.getByTestId('change-to-invalid'));

    // Should remain on the same language
    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent(initialLanguage!);
    });

    // Should not store invalid language
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith('fhir-health-ui-language', 'invalid');
  });

  it('should use stored language preference', async () => {
    localStorageMock.getItem.mockReturnValue('es');

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Should start with stored language
    expect(screen.getByTestId('current-language')).toHaveTextContent('es');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Should display Spanish translations
    await waitFor(() => {
      expect(screen.getByTestId('translation-save')).toHaveTextContent('Guardar');
    });
  });

  it('should detect browser language when no stored preference', async () => {
    // Mock Spanish browser language
    Object.defineProperty(navigator, 'language', {
      writable: true,
      value: 'es-ES',
    });

    localStorageMock.getItem.mockReturnValue(null);

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Should detect and use Spanish
    expect(screen.getByTestId('current-language')).toHaveTextContent('es');
  });

  it('should fallback to English for unsupported browser language', async () => {
    // Mock unsupported browser language
    Object.defineProperty(navigator, 'language', {
      writable: true,
      value: 'xx-XX',
    });

    localStorageMock.getItem.mockReturnValue(null);

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Should fallback to English
    expect(screen.getByTestId('current-language')).toHaveTextContent('en');
  });

  it('should handle localStorage errors gracefully', async () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Should still work with localStorage errors
    expect(screen.getByTestId('current-language')).toHaveTextContent('en');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Should still be able to change language
    fireEvent.click(screen.getByTestId('change-to-spanish'));

    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('es');
    });
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useI18n must be used within an I18nProvider');

    consoleSpy.mockRestore();
  });
});

// Test translation function with parameters
describe('Translation function with parameters', () => {
  function ParameterTestComponent() {
    const { t } = useI18n();

    return (
      <div>
        <div data-testid="with-params">
          {t('common.save', { name: 'John' })}
        </div>
        <div data-testid="without-params">
          {t('common.cancel')}
        </div>
      </div>
    );
  }

  it('should handle translation parameters', async () => {
    render(
      <I18nProvider>
        <ParameterTestComponent />
      </I18nProvider>
    );

    await waitFor(() => {
      // Parameters should be ignored if not used in translation
      expect(screen.getByTestId('with-params')).toHaveTextContent('Save');
      expect(screen.getByTestId('without-params')).toHaveTextContent('Cancel');
    });
  });
});
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { I18nProvider, useI18n, AVAILABLE_LANGUAGES } from '../../contexts/I18nContext';

// Test component that uses the I18n context
const TestI18nComponent: React.FC = () => {
  const { language, setLanguage, t, availableLanguages, isLoading, error } = useI18n();

  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="available-languages-count">{availableLanguages.length}</div>
      
      {/* Translation tests */}
      <div data-testid="translation-save">{t('common.save')}</div>
      <div data-testid="translation-patient-create">{t('patient.createPatient')}</div>
      <div data-testid="translation-missing">{t('missing.key')}</div>
      
      {/* Language switching buttons */}
      <button data-testid="set-english" onClick={() => setLanguage('en')}>
        English
      </button>
      <button data-testid="set-spanish" onClick={() => setLanguage('es')}>
        Spanish
      </button>
      <button data-testid="set-french" onClick={() => setLanguage('fr')}>
        French
      </button>
      <button data-testid="set-invalid" onClick={() => setLanguage('invalid')}>
        Invalid
      </button>
    </div>
  );
};

describe('I18nContext Unit Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic I18n Functionality', () => {
    it('should initialize with English by default', async () => {
      render(
        <I18nProvider>
          <TestI18nComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('en');
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });
    });

    it('should provide available languages', async () => {
      render(
        <I18nProvider>
          <TestI18nComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('available-languages-count')).toHaveTextContent(
          AVAILABLE_LANGUAGES.length.toString()
        );
      });
    });

    it('should translate basic keys', async () => {
      render(
        <I18nProvider>
          <TestI18nComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('translation-save')).toHaveTextContent('Save');
        expect(screen.getByTestId('translation-patient-create')).toHaveTextContent('Create Patient');
      });
    });

    it('should return key for missing translations', async () => {
      render(
        <I18nProvider>
          <TestI18nComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('translation-missing')).toHaveTextContent('missing.key');
      });
    });

    it('should not switch to unsupported language', async () => {
      const user = userEvent.setup();

      render(
        <I18nProvider>
          <TestI18nComponent />
        </I18nProvider>
      );

      const initialLanguage = await screen.findByTestId('current-language');
      const initialText = initialLanguage.textContent;

      await user.click(screen.getByTestId('set-invalid'));

      // Language should remain unchanged
      expect(screen.getByTestId('current-language')).toHaveTextContent(initialText!);
    });
  });

  describe('Available Languages Configuration', () => {
    it('should include expected languages', () => {
      const expectedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'];
      
      expectedLanguages.forEach(langCode => {
        const foundLang = AVAILABLE_LANGUAGES.find(l => l.code === langCode);
        expect(foundLang).toBeDefined();
        expect(foundLang?.code).toBe(langCode);
      });
    });

    it('should have proper language structure', () => {
      AVAILABLE_LANGUAGES.forEach(lang => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('nativeName');
        expect(typeof lang.code).toBe('string');
        expect(typeof lang.name).toBe('string');
        expect(typeof lang.nativeName).toBe('string');
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useI18n is used outside provider', () => {
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        render(<TestI18nComponent />);
      }).toThrow('useI18n must be used within an I18nProvider');

      console.error = originalError;
    });
  });

  describe('Local Storage Integration', () => {
    it('should persist language preference', async () => {
      const user = userEvent.setup();

      render(
        <I18nProvider>
          <TestI18nComponent />
        </I18nProvider>
      );

      await user.click(screen.getByTestId('set-spanish'));

      await waitFor(() => {
        expect(localStorage.getItem('fhir-health-ui-language')).toBe('es');
      });
    });

    it('should restore language preference from localStorage', async () => {
      // Set preference in localStorage before rendering
      localStorage.setItem('fhir-health-ui-language', 'es');

      render(
        <I18nProvider>
          <TestI18nComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('es');
      });
    });
  });

  describe('Translation Function', () => {
    it('should handle parameter substitution', async () => {
      const TestParamsComponent: React.FC = () => {
        const { t } = useI18n();
        return (
          <div data-testid="translation-with-params">
            {t('patient.welcome', { name: 'John Doe', age: '30' })}
          </div>
        );
      };

      render(
        <I18nProvider>
          <TestParamsComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        // Should handle missing translation with parameters gracefully
        expect(screen.getByTestId('translation-with-params')).toHaveTextContent('patient.welcome');
      });
    });

    it('should handle nested translation keys', async () => {
      render(
        <I18nProvider>
          <TestI18nComponent />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('translation-save')).toHaveTextContent('Save');
        expect(screen.getByTestId('translation-patient-create')).toHaveTextContent('Create Patient');
      });
    });
  });
});
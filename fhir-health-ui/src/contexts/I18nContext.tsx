import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Language interface
export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

// Translation keys structure
export interface TranslationKeys {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    search: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    submit: string;
    reset: string;
    clear: string;
    select: string;
    none: string;
    all: string;
    yes: string;
    no: string;
  };
  patient: {
    createPatient: string;
    searchPatient: string;
    patientDetails: string;
    patientList: string;
    addPatient: string;
    editPatient: string;
    deletePatient: string;
    patientName: string;
    patientId: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    email: string;
    address: string;
    emergencyContact: string;
    medicalHistory: string;
    allergies: string;
    medications: string;
    noPatients: string;
    patientCreated: string;
    patientUpdated: string;
    patientDeleted: string;
  };
  organization: {
    organizationDetails: string;
    organizationName: string;
    organizationType: string;
    contactInfo: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    selectOrganization: string;
    noOrganization: string;
  };
  encounter: {
    createEncounter: string;
    encounterDetails: string;
    encounterType: string;
    encounterDate: string;
    encounterStatus: string;
    encounterReason: string;
    encounterNotes: string;
    provider: string;
    location: string;
    duration: string;
    noEncounters: string;
    encounterCreated: string;
    encounterUpdated: string;
  };
  auth: {
    login: string;
    logout: string;
    username: string;
    password: string;
    loginFailed: string;
    sessionExpired: string;
    accessDenied: string;
    loginSuccess: string;
    loggingOut: string;
  };
  navigation: {
    home: string;
    patients: string;
    organizations: string;
    encounters: string;
    settings: string;
    help: string;
    about: string;
    dashboard: string;
  };
  theme: {
    lightMode: string;
    darkMode: string;
    systemMode: string;
    themeSettings: string;
  };
  language: {
    languageSettings: string;
    selectLanguage: string;
    currentLanguage: string;
  };
  errors: {
    networkError: string;
    serverError: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    validationError: string;
    unknownError: string;
    connectionLost: string;
    connectionRestored: string;
    offlineMode: string;
    syncError: string;
  };
}

// I18n context interface
export interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
  availableLanguages: Language[];
  isLoading: boolean;
  error: string | null;
}

// Available languages
export const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

const DEFAULT_LANGUAGE = 'en';
const FALLBACK_LANGUAGE = 'en';
const STORAGE_KEY = 'fhir-health-ui-language';

// Create context
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// I18n state interface
interface I18nState {
  currentLanguage: string;
  loadedLanguages: Set<string>;
  translations: Record<string, TranslationKeys>;
  isLoading: boolean;
  error: string | null;
}

// I18n Provider Props
interface I18nProviderProps {
  children: React.ReactNode;
}

// Detect browser language
function detectBrowserLanguage(): string {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  const browserLang = navigator.language || (navigator as any).userLanguage;
  const langCode = browserLang.split('-')[0].toLowerCase();
  
  // Check if detected language is supported
  const isSupported = AVAILABLE_LANGUAGES.some(lang => lang.code === langCode);
  return isSupported ? langCode : DEFAULT_LANGUAGE;
}

// Get stored language preference
function getStoredLanguage(): string {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && AVAILABLE_LANGUAGES.some(lang => lang.code === stored)) {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to read language preference from localStorage:', error);
  }
  
  return detectBrowserLanguage();
}

// Store language preference
function storeLanguage(language: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch (error) {
    console.warn('Failed to store language preference:', error);
  }
}

// Load translation file
async function loadTranslation(language: string): Promise<TranslationKeys> {
  try {
    // Dynamic import of translation files
    const translationModule = await import(`../translations/${language}.json`);
    return translationModule.default;
  } catch (error) {
    console.warn(`Failed to load translation for language: ${language}`, error);
    
    // If not the fallback language, try to load fallback
    if (language !== FALLBACK_LANGUAGE) {
      try {
        const fallbackModule = await import(`../translations/${FALLBACK_LANGUAGE}.json`);
        return fallbackModule.default;
      } catch (fallbackError) {
        console.error('Failed to load fallback translation:', fallbackError);
        throw new Error(`Failed to load translations for ${language} and fallback ${FALLBACK_LANGUAGE}`);
      }
    }
    
    throw error;
  }
}

// Get nested value from object using dot notation
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// I18n Provider Component
export function I18nProvider({ children }: I18nProviderProps): React.JSX.Element {
  const [state, setState] = useState<I18nState>(() => ({
    currentLanguage: getStoredLanguage(),
    loadedLanguages: new Set(),
    translations: {},
    isLoading: true,
    error: null,
  }));

  // Translation function with fallback support
  const t = useCallback((key: string, params?: Record<string, string>): string => {
    const { currentLanguage, translations } = state;
    
    // Get translation from current language
    let translation = getNestedValue(translations[currentLanguage], key);
    
    // Fallback to default language if not found
    if (!translation && currentLanguage !== FALLBACK_LANGUAGE) {
      translation = getNestedValue(translations[FALLBACK_LANGUAGE], key);
    }
    
    // If still no translation, return the key itself
    if (!translation) {
      console.warn(`Translation missing for key: ${key} in language: ${currentLanguage}`);
      return key;
    }
    
    // Replace parameters if provided
    if (params) {
      return Object.entries(params).reduce(
        (text, [param, value]) => text.replace(new RegExp(`{{${param}}}`, 'g'), value),
        translation
      );
    }
    
    return translation;
  }, [state]);

  // Load translation for a specific language
  const loadLanguageTranslation = useCallback(async (language: string) => {
    if (state.loadedLanguages.has(language)) {
      return; // Already loaded
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const translation = await loadTranslation(language);
      
      setState(prev => ({
        ...prev,
        translations: {
          ...prev.translations,
          [language]: translation,
        },
        loadedLanguages: new Set([...prev.loadedLanguages, language]),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load translation';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [state.loadedLanguages]);

  // Set language function with loading state management
  const setLanguage = useCallback(async (language: string) => {
    if (!AVAILABLE_LANGUAGES.some(lang => lang.code === language)) {
      console.warn(`Unsupported language: ${language}`);
      return;
    }

    // Set loading state
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Store preference
      storeLanguage(language);

      // Update current language
      setState(prev => ({
        ...prev,
        currentLanguage: language,
      }));

      // Load translation if not already loaded
      if (!state.loadedLanguages.has(language)) {
        await loadLanguageTranslation(language);
      } else {
        // If already loaded, just clear loading state
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change language';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      console.error('Failed to change language:', error);
    }
  }, [state.loadedLanguages, loadLanguageTranslation]);

  // Load initial translation
  useEffect(() => {
    loadLanguageTranslation(state.currentLanguage);
  }, [state.currentLanguage, loadLanguageTranslation]);

  // Context value
  const contextValue: I18nContextType = {
    language: state.currentLanguage,
    setLanguage,
    t,
    availableLanguages: AVAILABLE_LANGUAGES,
    isLoading: state.isLoading,
    error: state.error,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook to use I18n context with graceful fallback
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    // Graceful fallback when I18n context is not available
    console.warn('useI18n used outside of I18nProvider, using fallback');
    return {
      language: DEFAULT_LANGUAGE,
      setLanguage: () => console.warn('I18n context not available'),
      t: (key: string) => {
        console.warn(`I18n context not available, returning key: ${key}`);
        return key;
      },
      availableLanguages: AVAILABLE_LANGUAGES,
      isLoading: false,
      error: null,
    };
  }
  return context;
}

// Export context for testing
export { I18nContext };
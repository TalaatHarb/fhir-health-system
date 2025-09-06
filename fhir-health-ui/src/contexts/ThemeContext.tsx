import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

// Theme types
export type Theme = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

// Theme configuration with the specified color palettes
export interface ThemeConfig {
  light: {
    primary: string;
    secondary: string;
    accent: string;
    dark: string;
  };
  dark: {
    primary: string;
    secondary: string;
    accent: string;
    light: string;
  };
}

export const themeConfig: ThemeConfig = {
  light: {
    primary: '#DDF4E7',
    secondary: '#67C090',
    accent: '#26667F',
    dark: '#124170',
  },
  dark: {
    primary: '#210F37',
    secondary: '#4F1C51',
    accent: '#A55B4B',
    light: '#DCA06D',
  },
};

// Theme state interface
export interface ThemeState {
  currentTheme: Theme;
  systemPreference: Theme;
  userPreference: ThemePreference;
  isSystemThemeSupported: boolean;
}

// Theme actions
export type ThemeAction =
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_USER_PREFERENCE'; payload: ThemePreference }
  | { type: 'SET_SYSTEM_PREFERENCE'; payload: Theme }
  | { type: 'INITIALIZE_THEME'; payload: { systemPreference: Theme; userPreference: ThemePreference } };

// Theme context value interface
export interface ThemeContextValue {
  theme: Theme;
  userPreference: ThemePreference;
  systemPreference: Theme;
  isSystemThemeSupported: boolean;
  setTheme: (theme: Theme) => void;
  setUserPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
}

// Detect system theme preference
function getSystemTheme(): Theme {
  try {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      return mediaQuery.matches ? 'dark' : 'light';
    }
  } catch (error) {
    console.warn('Failed to detect system theme:', error);
  }
  return 'light';
}

// Check if system theme detection is supported
function isSystemThemeSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 
           window.matchMedia && 
           typeof window.matchMedia === 'function' &&
           window.matchMedia('(prefers-color-scheme: dark)').media !== 'not all';
  } catch (error) {
    console.warn('System theme detection not supported:', error);
    return false;
  }
}

// Get user preference from localStorage
function getUserPreference(): ThemePreference {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('fhir-theme-preference');
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      return saved as ThemePreference;
    }
  }
  return 'system';
}

// Calculate current theme based on user preference and system preference
function calculateCurrentTheme(userPreference: ThemePreference, systemPreference: Theme): Theme {
  if (userPreference === 'system') {
    return systemPreference;
  }
  return userPreference;
}

// Initial state
const initialState: ThemeState = {
  currentTheme: 'light',
  systemPreference: 'light',
  userPreference: 'system',
  isSystemThemeSupported: false,
};

// Theme reducer
function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'INITIALIZE_THEME':
      return {
        ...state,
        systemPreference: action.payload.systemPreference,
        userPreference: action.payload.userPreference,
        currentTheme: calculateCurrentTheme(action.payload.userPreference, action.payload.systemPreference),
        isSystemThemeSupported: isSystemThemeSupported(),
      };
    case 'SET_THEME':
      return {
        ...state,
        currentTheme: action.payload,
      };
    case 'SET_USER_PREFERENCE':
      return {
        ...state,
        userPreference: action.payload,
        currentTheme: calculateCurrentTheme(action.payload, state.systemPreference),
      };
    case 'SET_SYSTEM_PREFERENCE':
      return {
        ...state,
        systemPreference: action.payload,
        currentTheme: calculateCurrentTheme(state.userPreference, action.payload),
      };
    default:
      return state;
  }
}

// Apply theme to CSS custom properties
function applyThemeToDOM(theme: Theme): void {
  const root = document.documentElement;
  const colors = themeConfig[theme];
  
  // Apply theme colors as CSS custom properties
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });
  
  // Set theme attribute for CSS selectors
  root.setAttribute('data-theme', theme);
  
  // Update color-scheme for better browser integration
  root.style.setProperty('color-scheme', theme);
}

// Create context
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Theme provider component
interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Initialize theme on mount
  useEffect(() => {
    const systemPreference = getSystemTheme();
    const userPreference = getUserPreference();
    
    dispatch({
      type: 'INITIALIZE_THEME',
      payload: { systemPreference, userPreference },
    });
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (!isSystemThemeSupported()) return;

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
      const handleChange = (e: MediaQueryListEvent) => {
        const newSystemPreference = e.matches ? 'dark' : 'light';
        dispatch({ type: 'SET_SYSTEM_PREFERENCE', payload: newSystemPreference });
      };

      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } catch (error) {
      console.warn('Failed to set up system theme listener:', error);
    }
  }, []);

  // Apply theme to DOM whenever current theme changes
  useEffect(() => {
    applyThemeToDOM(state.currentTheme);
  }, [state.currentTheme]);

  // Save user preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fhir-theme-preference', state.userPreference);
    }
  }, [state.userPreference]);

  // Set theme directly
  const setTheme = useCallback((theme: Theme): void => {
    dispatch({ type: 'SET_THEME', payload: theme });
    // When setting theme directly, update user preference to match
    dispatch({ type: 'SET_USER_PREFERENCE', payload: theme });
  }, []);

  // Set user preference
  const setUserPreference = useCallback((preference: ThemePreference): void => {
    dispatch({ type: 'SET_USER_PREFERENCE', payload: preference });
  }, []);

  // Toggle between light and dark themes
  const toggleTheme = useCallback((): void => {
    const newTheme = state.currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [state.currentTheme, setTheme]);

  // Context value
  const contextValue: ThemeContextValue = {
    theme: state.currentTheme,
    userPreference: state.userPreference,
    systemPreference: state.systemPreference,
    isSystemThemeSupported: state.isSystemThemeSupported,
    setTheme,
    setUserPreference,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme context
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
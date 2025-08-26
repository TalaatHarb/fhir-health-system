import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { AuthContextValue, AuthState, AuthAction, User, LoginCredentials } from '../types';

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
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
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load authentication state from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('fhir-auth');
    if (savedAuth) {
      try {
        const { user, isAuthenticated } = JSON.parse(savedAuth);
        if (isAuthenticated && user) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        }
      } catch (error) {
        console.error('Failed to parse saved auth state:', error);
        localStorage.removeItem('fhir-auth');
      }
    }
  }, []);

  // Save authentication state to localStorage
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      localStorage.setItem('fhir-auth', JSON.stringify({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }));
    } else {
      localStorage.removeItem('fhir-auth');
    }
  }, [state.isAuthenticated, state.user]);

  // Fake login function - accepts any credentials for development
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create fake user based on credentials
      const user: User = {
        id: `user-${Date.now()}`,
        username: credentials.username || 'demo-user',
        name: credentials.username ? `${credentials.username.charAt(0).toUpperCase()}${credentials.username.slice(1)} User` : 'Demo User',
        email: credentials.username ? `${credentials.username}@example.com` : 'demo@example.com',
        roles: ['healthcare-professional'],
      };

      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
    }
  }, []);

  // Logout function
  const logout = useCallback((): void => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  // Context value
  const contextValue: AuthContextValue = {
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    login,
    logout,
    loading: state.loading,
    error: state.error,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
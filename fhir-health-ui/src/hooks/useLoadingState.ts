import { useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

interface UseLoadingStateReturn extends LoadingState {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
}

/**
 * Hook for managing loading states with error handling
 * Provides utilities for async operations with loading indicators
 */
export function useLoadingState(initialLoading = false): UseLoadingStateReturn {
  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
      error: loading ? null : prev.error, // Clear error when starting new loading
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false, // Stop loading when error occurs
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      const result = await asyncFn();
      setLoading(false);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error;
    }
  }, [setLoading, setError]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    setLoading,
    setError,
    clearError,
    withLoading,
  };
}
import { useState, useEffect, useCallback } from 'react';

export interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  wasOffline: boolean;
  lastOnlineTime: Date | null;
  lastOfflineTime: Date | null;
}

export interface OfflineDetectionOptions {
  checkInterval?: number;
  pingUrl?: string;
  timeout?: number;
  onOnline?: () => void;
  onOffline?: () => void;
}

/**
 * Hook for detecting online/offline status with enhanced features
 */
export function useOfflineDetection(options: OfflineDetectionOptions = {}) {
  const {
    checkInterval = 30000, // 30 seconds
    pingUrl = '/api/health', // Fallback ping endpoint
    timeout = 5000,
    onOnline,
    onOffline
  } = options;

  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    wasOffline: false,
    lastOnlineTime: navigator.onLine ? new Date() : null,
    lastOfflineTime: !navigator.onLine ? new Date() : null,
  });

  // Enhanced online check using actual network request
  const checkOnlineStatus = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(pingUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }, [pingUrl, timeout]);

  // Update state when online status changes
  const updateOnlineStatus = useCallback(async (isOnline: boolean) => {
    const now = new Date();
    
    setState(prevState => {
      const wasOffline = prevState.isOffline;
      
      return {
        isOnline,
        isOffline: !isOnline,
        wasOffline: wasOffline && isOnline, // True if we just came back online
        lastOnlineTime: isOnline ? now : prevState.lastOnlineTime,
        lastOfflineTime: !isOnline ? now : prevState.lastOfflineTime,
      };
    });

    // Call callbacks
    if (isOnline && onOnline) {
      onOnline();
    } else if (!isOnline && onOffline) {
      onOffline();
    }
  }, [onOnline, onOffline]);

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      updateOnlineStatus(true);
    };

    const handleOffline = () => {
      updateOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateOnlineStatus]);

  // Periodic connectivity check
  useEffect(() => {
    if (checkInterval <= 0) return;

    const intervalId = setInterval(async () => {
      const isActuallyOnline = await checkOnlineStatus();
      
      if (isActuallyOnline !== state.isOnline) {
        updateOnlineStatus(isActuallyOnline);
      }
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [checkInterval, checkOnlineStatus, state.isOnline, updateOnlineStatus]);

  // Manual connectivity check
  const recheckConnectivity = useCallback(async (): Promise<boolean> => {
    const isOnline = await checkOnlineStatus();
    updateOnlineStatus(isOnline);
    return isOnline;
  }, [checkOnlineStatus, updateOnlineStatus]);

  return {
    ...state,
    recheckConnectivity,
  };
}

/**
 * Hook for offline-aware data fetching
 */
export function useOfflineAwareFetch<T>(
  fetchFn: () => Promise<T>,
  options: {
    cacheKey?: string;
    fallbackData?: T;
    retryOnReconnect?: boolean;
  } = {}
) {
  const { cacheKey, fallbackData, retryOnReconnect = true } = options;
  const [data, setData] = useState<T | undefined>(fallbackData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  const { isOnline, wasOffline } = useOfflineDetection();

  // Load cached data on mount
  useEffect(() => {
    if (cacheKey) {
      try {
        const cached = localStorage.getItem(`offline-cache-${cacheKey}`);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          setData(cachedData);
          setIsStale(Date.now() - timestamp > 300000); // 5 minutes
        }
      } catch {
        // Ignore cache errors
      }
    }
  }, [cacheKey]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!isOnline) {
      setError(new Error('No internet connection'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      setIsStale(false);

      // Cache the result
      if (cacheKey) {
        try {
          localStorage.setItem(`offline-cache-${cacheKey}`, JSON.stringify({
            data: result,
            timestamp: Date.now(),
          }));
        } catch {
          // Ignore cache storage errors
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fetch failed'));
    } finally {
      setLoading(false);
    }
  }, [fetchFn, isOnline, cacheKey]);

  // Auto-retry when coming back online
  useEffect(() => {
    if (wasOffline && retryOnReconnect) {
      fetchData();
    }
  }, [wasOffline, retryOnReconnect, fetchData]);

  return {
    data,
    loading,
    error,
    isStale,
    refetch: fetchData,
    isOffline: !isOnline,
  };
}

/**
 * Utility functions for offline handling
 */
export const offlineUtils = {
  /**
   * Store data for offline use
   */
  storeOfflineData: <T>(key: string, data: T): void => {
    try {
      localStorage.setItem(`offline-${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch {
      // Ignore storage errors
    }
  },

  /**
   * Retrieve offline data
   */
  getOfflineData: <T>(key: string): T | null => {
    try {
      const stored = localStorage.getItem(`offline-${key}`);
      if (stored) {
        const { data } = JSON.parse(stored);
        return data;
      }
    } catch {
      // Ignore retrieval errors
    }
    return null;
  },

  /**
   * Clear offline data
   */
  clearOfflineData: (key: string): void => {
    try {
      localStorage.removeItem(`offline-${key}`);
    } catch {
      // Ignore removal errors
    }
  },

  /**
   * Queue operations for when online
   */
  queueOfflineOperation: (operation: { type: string; data: unknown }): void => {
    try {
      const queue = JSON.parse(localStorage.getItem('offline-queue') || '[]');
      queue.push({
        ...operation,
        timestamp: Date.now(),
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });
      localStorage.setItem('offline-queue', JSON.stringify(queue));
    } catch {
      // Ignore queue errors
    }
  },

  /**
   * Process queued operations
   */
  processOfflineQueue: async (
    processor: (operation: { type: string; data: unknown; id: string }) => Promise<void>
  ): Promise<void> => {
    try {
      const queue = JSON.parse(localStorage.getItem('offline-queue') || '[]');
      const processedIds: string[] = [];

      for (const operation of queue) {
        try {
          await processor(operation);
          processedIds.push(operation.id);
        } catch {
          // Keep failed operations in queue
        }
      }

      // Remove processed operations
      const remainingQueue = queue.filter(
        (op: { id: string }) => !processedIds.includes(op.id)
      );
      localStorage.setItem('offline-queue', JSON.stringify(remainingQueue));
    } catch {
      // Ignore queue processing errors
    }
  },

  /**
   * Get queue size
   */
  getQueueSize: (): number => {
    try {
      const queue = JSON.parse(localStorage.getItem('offline-queue') || '[]');
      return queue.length;
    } catch {
      return 0;
    }
  },
};
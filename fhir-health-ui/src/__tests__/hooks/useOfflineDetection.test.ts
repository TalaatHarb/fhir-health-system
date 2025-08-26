import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useOfflineDetection, useOfflineAwareFetch, offlineUtils } from '../../hooks/useOfflineDetection';

// Mock fetch
global.fetch = vi.fn();

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

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useOfflineDetection', () => {
  it('initializes with navigator.onLine status', () => {
    navigator.onLine = true;
    
    const { result } = renderHook(() => useOfflineDetection());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
    expect(result.current.wasOffline).toBe(false);
  });

  it('initializes as offline when navigator.onLine is false', () => {
    navigator.onLine = false;
    
    const { result } = renderHook(() => useOfflineDetection());

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });

  it('updates state when online event is fired', () => {
    navigator.onLine = false;
    
    const { result } = renderHook(() => useOfflineDetection());

    expect(result.current.isOffline).toBe(true);

    // Simulate going online
    act(() => {
      navigator.onLine = true;
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
    expect(result.current.wasOffline).toBe(true);
  });

  it('updates state when offline event is fired', () => {
    navigator.onLine = true;
    
    const { result } = renderHook(() => useOfflineDetection());

    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    act(() => {
      navigator.onLine = false;
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it('calls onOnline callback when going online', () => {
    const onOnline = vi.fn();
    navigator.onLine = false;
    
    renderHook(() => useOfflineDetection({ onOnline }));

    act(() => {
      navigator.onLine = true;
      window.dispatchEvent(new Event('online'));
    });

    expect(onOnline).toHaveBeenCalled();
  });

  it('calls onOffline callback when going offline', () => {
    const onOffline = vi.fn();
    navigator.onLine = true;
    
    renderHook(() => useOfflineDetection({ onOffline }));

    act(() => {
      navigator.onLine = false;
      window.dispatchEvent(new Event('offline'));
    });

    expect(onOffline).toHaveBeenCalled();
  });

  it('performs periodic connectivity checks', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(new Response('', { status: 200 }));

    navigator.onLine = true;
    
    const { result } = renderHook(() => useOfflineDetection({
      checkInterval: 1000,
      pingUrl: '/health'
    }));

    expect(result.current.isOnline).toBe(true);

    // Fast-forward to trigger interval check
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetch).toHaveBeenCalledWith('/health', expect.objectContaining({
      method: 'HEAD',
      cache: 'no-cache',
    }));
  });

  it('detects offline status through failed ping', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValue(new Error('Network error'));

    navigator.onLine = true;
    
    const { result } = renderHook(() => useOfflineDetection({
      checkInterval: 1000,
    }));

    // Fast-forward to trigger interval check
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it('can manually recheck connectivity', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(new Response('', { status: 200 }));

    const { result } = renderHook(() => useOfflineDetection());

    await act(async () => {
      const isOnline = await result.current.recheckConnectivity();
      expect(isOnline).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalled();
  });

  it('handles fetch timeout', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useOfflineDetection({
      timeout: 1000,
    }));

    const recheckPromise = act(async () => {
      return result.current.recheckConnectivity();
    });

    // Fast-forward past timeout
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const isOnline = await recheckPromise;
    expect(isOnline).toBe(false);
  });

  it('disables periodic checks when checkInterval is 0', () => {
    const mockFetch = vi.mocked(fetch);
    
    renderHook(() => useOfflineDetection({
      checkInterval: 0,
    }));

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('useOfflineAwareFetch', () => {
  const mockFetchFn = vi.fn();

  beforeEach(() => {
    mockFetchFn.mockClear();
    navigator.onLine = true;
  });

  it('fetches data when online', async () => {
    mockFetchFn.mockResolvedValue('test data');

    const { result } = renderHook(() => 
      useOfflineAwareFetch(mockFetchFn)
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toBe('test data');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('sets error when offline', async () => {
    navigator.onLine = false;

    const { result } = renderHook(() => 
      useOfflineAwareFetch(mockFetchFn)
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toEqual(expect.any(Error));
    expect(result.current.error?.message).toBe('No internet connection');
    expect(mockFetchFn).not.toHaveBeenCalled();
  });

  it('caches successful responses', async () => {
    mockFetchFn.mockResolvedValue('cached data');

    const { result } = renderHook(() => 
      useOfflineAwareFetch(mockFetchFn, { cacheKey: 'test-key' })
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'offline-cache-test-key',
      expect.stringContaining('cached data')
    );
  });

  it('loads cached data on mount', () => {
    const cachedData = JSON.stringify({
      data: 'cached data',
      timestamp: Date.now() - 1000, // 1 second ago
    });
    localStorageMock.getItem.mockReturnValue(cachedData);

    const { result } = renderHook(() => 
      useOfflineAwareFetch(mockFetchFn, { cacheKey: 'test-key' })
    );

    expect(result.current.data).toBe('cached data');
    expect(result.current.isStale).toBe(false);
  });

  it('marks cached data as stale when old', () => {
    const cachedData = JSON.stringify({
      data: 'old cached data',
      timestamp: Date.now() - 400000, // 6+ minutes ago
    });
    localStorageMock.getItem.mockReturnValue(cachedData);

    const { result } = renderHook(() => 
      useOfflineAwareFetch(mockFetchFn, { cacheKey: 'test-key' })
    );

    expect(result.current.data).toBe('old cached data');
    expect(result.current.isStale).toBe(true);
  });

  it('uses fallback data when provided', () => {
    const { result } = renderHook(() => 
      useOfflineAwareFetch(mockFetchFn, { fallbackData: 'fallback' })
    );

    expect(result.current.data).toBe('fallback');
  });

  it('auto-retries when coming back online', async () => {
    mockFetchFn.mockResolvedValue('online data');

    // Start offline
    navigator.onLine = false;
    
    const { result, rerender } = renderHook(() => 
      useOfflineAwareFetch(mockFetchFn, { retryOnReconnect: true })
    );

    // Go online
    navigator.onLine = true;
    
    // Trigger the hook to detect online status change
    rerender();

    // Simulate the wasOffline state change
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetchFn).toHaveBeenCalled();
  });

  it('handles fetch errors gracefully', async () => {
    const fetchError = new Error('Fetch failed');
    mockFetchFn.mockRejectedValue(fetchError);

    const { result } = renderHook(() => 
      useOfflineAwareFetch(mockFetchFn)
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBe(fetchError);
    expect(result.current.loading).toBe(false);
  });
});

describe('offlineUtils', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('storeOfflineData', () => {
    it('stores data with timestamp', () => {
      offlineUtils.storeOfflineData('test-key', { value: 'test' });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'offline-test-key',
        expect.stringContaining('"value":"test"')
      );
    });

    it('handles storage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => {
        offlineUtils.storeOfflineData('test-key', { value: 'test' });
      }).not.toThrow();
    });
  });

  describe('getOfflineData', () => {
    it('retrieves stored data', () => {
      const storedData = JSON.stringify({
        data: { value: 'test' },
        timestamp: Date.now(),
      });
      localStorageMock.getItem.mockReturnValue(storedData);

      const result = offlineUtils.getOfflineData('test-key');

      expect(result).toEqual({ value: 'test' });
    });

    it('returns null when no data exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = offlineUtils.getOfflineData('test-key');

      expect(result).toBeNull();
    });

    it('handles retrieval errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = offlineUtils.getOfflineData('test-key');

      expect(result).toBeNull();
    });
  });

  describe('queueOfflineOperation', () => {
    it('adds operation to queue', () => {
      localStorageMock.getItem.mockReturnValue('[]');

      offlineUtils.queueOfflineOperation({
        type: 'create',
        data: { name: 'test' },
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'offline-queue',
        expect.stringContaining('"type":"create"')
      );
    });

    it('appends to existing queue', () => {
      const existingQueue = JSON.stringify([
        { id: 'existing', type: 'update', data: {} }
      ]);
      localStorageMock.getItem.mockReturnValue(existingQueue);

      offlineUtils.queueOfflineOperation({
        type: 'create',
        data: { name: 'test' },
      });

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const queueData = JSON.parse(setItemCall[1]);
      
      expect(queueData).toHaveLength(2);
      expect(queueData[1].type).toBe('create');
    });
  });

  describe('processOfflineQueue', () => {
    it('processes all queued operations', async () => {
      const queue = JSON.stringify([
        { id: '1', type: 'create', data: { name: 'test1' } },
        { id: '2', type: 'update', data: { name: 'test2' } },
      ]);
      localStorageMock.getItem.mockReturnValue(queue);

      const processor = vi.fn().mockResolvedValue(undefined);

      await offlineUtils.processOfflineQueue(processor);

      expect(processor).toHaveBeenCalledTimes(2);
      expect(processor).toHaveBeenCalledWith({
        id: '1',
        type: 'create',
        data: { name: 'test1' }
      });
    });

    it('removes processed operations from queue', async () => {
      const queue = JSON.stringify([
        { id: '1', type: 'create', data: {} },
        { id: '2', type: 'update', data: {} },
      ]);
      localStorageMock.getItem.mockReturnValue(queue);

      const processor = vi.fn().mockResolvedValue(undefined);

      await offlineUtils.processOfflineQueue(processor);

      // Should clear the queue after successful processing
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'offline-queue',
        '[]'
      );
    });

    it('keeps failed operations in queue', async () => {
      const queue = JSON.stringify([
        { id: '1', type: 'create', data: {} },
        { id: '2', type: 'update', data: {} },
      ]);
      localStorageMock.getItem.mockReturnValue(queue);

      const processor = vi.fn()
        .mockResolvedValueOnce(undefined) // First succeeds
        .mockRejectedValueOnce(new Error('Failed')); // Second fails

      await offlineUtils.processOfflineQueue(processor);

      // Should keep only the failed operation
      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const remainingQueue = JSON.parse(setItemCall[1]);
      
      expect(remainingQueue).toHaveLength(1);
      expect(remainingQueue[0].id).toBe('2');
    });
  });

  describe('getQueueSize', () => {
    it('returns queue size', () => {
      const queue = JSON.stringify([
        { id: '1', type: 'create', data: {} },
        { id: '2', type: 'update', data: {} },
      ]);
      localStorageMock.getItem.mockReturnValue(queue);

      const size = offlineUtils.getQueueSize();

      expect(size).toBe(2);
    });

    it('returns 0 for empty queue', () => {
      localStorageMock.getItem.mockReturnValue('[]');

      const size = offlineUtils.getQueueSize();

      expect(size).toBe(0);
    });

    it('returns 0 on error', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const size = offlineUtils.getQueueSize();

      expect(size).toBe(0);
    });
  });
});
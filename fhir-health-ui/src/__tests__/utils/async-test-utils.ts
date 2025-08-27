/**
 * Async Testing Utilities
 * 
 * Provides utility functions for handling async operations in tests, including
 * waitForDataLoading, waitForNetworkResponse, and debugging utilities.
 * This addresses Requirements 4.1, 4.3, and 4.4.
 */

import { waitFor, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { getGlobalAsyncConfig, createRetryMechanism, createNetworkRetryConfig } from './async-test-config';

export interface WaitForDataLoadingOptions {
  timeout?: number;
  interval?: number;
  loadingIndicatorText?: string | RegExp;
  loadingTestId?: string;
  onTimeout?: (error: Error) => void;
}

export interface WaitForNetworkResponseOptions {
  timeout?: number;
  interval?: number;
  expectedCalls?: number;
  mockFunction?: ReturnType<typeof vi.fn>;
  onTimeout?: (error: Error) => void;
}

export interface AsyncOperationDebugInfo {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: Error;
  retryAttempts?: number;
}

// Global debug tracking
const debugOperations: AsyncOperationDebugInfo[] = [];
let debugMode = false;

/**
 * Enables or disables debug mode for async operations
 */
export const setAsyncDebugMode = (enabled: boolean) => {
  debugMode = enabled;
  if (!enabled) {
    debugOperations.length = 0;
  }
};

/**
 * Gets all recorded debug operations
 */
export const getAsyncDebugOperations = (): AsyncOperationDebugInfo[] => {
  return [...debugOperations];
};

/**
 * Clears debug operation history
 */
export const clearAsyncDebugOperations = () => {
  debugOperations.length = 0;
};

/**
 * Records debug information for an async operation
 */
const recordDebugOperation = (info: AsyncOperationDebugInfo) => {
  if (debugMode) {
    debugOperations.push(info);
    console.debug('Async Operation:', info);
  }
};

/**
 * Waits for data loading to complete by monitoring loading indicators
 */
export const waitForDataLoading = async (options: WaitForDataLoadingOptions = {}): Promise<void> => {
  const config = getGlobalAsyncConfig();
  const {
    timeout = config.waitStrategies.dataLoading.timeout,
    interval = config.waitStrategies.dataLoading.interval,
    loadingIndicatorText = /loading|spinner|fetching/i,
    loadingTestId,
    onTimeout = config.waitStrategies.dataLoading.onTimeout
  } = options;

  const debugInfo: AsyncOperationDebugInfo = {
    operation: 'waitForDataLoading',
    startTime: Date.now(),
    success: false
  };

  try {
    await waitFor(
      () => {
        // Check for loading indicator by test ID
        if (loadingTestId) {
          const loadingElement = screen.queryByTestId(loadingTestId);
          if (loadingElement) {
            throw new Error('Loading indicator still present');
          }
        }

        // Check for loading indicator by text
        const loadingElement = screen.queryByText(loadingIndicatorText);
        if (loadingElement) {
          throw new Error('Loading indicator still present');
        }

        // Check for common loading class names
        const loadingByClass = document.querySelector('.loading, .spinner, .fetching, [data-loading="true"]');
        if (loadingByClass) {
          throw new Error('Loading indicator still present');
        }
      },
      { timeout, interval }
    );

    debugInfo.success = true;
    debugInfo.endTime = Date.now();
    debugInfo.duration = debugInfo.endTime - debugInfo.startTime;
    recordDebugOperation(debugInfo);

  } catch (error) {
    debugInfo.error = error as Error;
    debugInfo.endTime = Date.now();
    debugInfo.duration = debugInfo.endTime - debugInfo.startTime;
    recordDebugOperation(debugInfo);

    if (onTimeout) {
      onTimeout(error as Error);
    }
    throw error;
  }
};

/**
 * Waits for network response by monitoring mock function calls
 */
export const waitForNetworkResponse = async (options: WaitForNetworkResponseOptions = {}): Promise<void> => {
  const config = getGlobalAsyncConfig();
  const {
    timeout = config.waitStrategies.networkResponse.timeout,
    interval = config.waitStrategies.networkResponse.interval,
    expectedCalls = 1,
    mockFunction,
    onTimeout = config.waitStrategies.networkResponse.onTimeout
  } = options;

  const debugInfo: AsyncOperationDebugInfo = {
    operation: 'waitForNetworkResponse',
    startTime: Date.now(),
    success: false
  };

  try {
    await waitFor(
      () => {
        if (mockFunction) {
          if (mockFunction.mock.calls.length < expectedCalls) {
            throw new Error(`Expected ${expectedCalls} calls, got ${mockFunction.mock.calls.length}`);
          }
        } else {
          // Generic wait for network activity to settle
          // This is useful when we don't have a specific mock to monitor
          const pendingPromises = (global as any).__pendingPromises || [];
          if (pendingPromises.length > 0) {
            throw new Error('Network requests still pending');
          }
        }
      },
      { timeout, interval }
    );

    debugInfo.success = true;
    debugInfo.endTime = Date.now();
    debugInfo.duration = debugInfo.endTime - debugInfo.startTime;
    recordDebugOperation(debugInfo);

  } catch (error) {
    debugInfo.error = error as Error;
    debugInfo.endTime = Date.now();
    debugInfo.duration = debugInfo.endTime - debugInfo.startTime;
    recordDebugOperation(debugInfo);

    if (onTimeout) {
      onTimeout(error as Error);
    }
    throw error;
  }
};

/**
 * Waits for element to appear with retry mechanism
 */
export const waitForElementWithRetry = async (
  selector: () => HTMLElement | null,
  options: { timeout?: number; retries?: number } = {}
): Promise<HTMLElement> => {
  const config = getGlobalAsyncConfig();
  const { timeout = config.timeouts.rendering, retries = 3 } = options;

  const retryMechanism = createRetryMechanism({
    maxAttempts: retries,
    backoffMs: 50,
    shouldRetry: (error) => error.message.includes('Unable to find'),
    onRetry: (attempt, error) => {
      console.debug(`Retrying element selection (attempt ${attempt}):`, error.message);
    }
  });

  const debugInfo: AsyncOperationDebugInfo = {
    operation: 'waitForElementWithRetry',
    startTime: Date.now(),
    success: false,
    retryAttempts: 0
  };

  try {
    const element = await retryMechanism(async () => {
      return new Promise<HTMLElement>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Unable to find element within timeout'));
        }, timeout);

        const checkElement = () => {
          const el = selector();
          if (el) {
            clearTimeout(timeoutId);
            resolve(el);
          } else {
            setTimeout(checkElement, 50);
          }
        };

        checkElement();
      });
    });

    debugInfo.success = true;
    debugInfo.endTime = Date.now();
    debugInfo.duration = debugInfo.endTime - debugInfo.startTime;
    recordDebugOperation(debugInfo);

    return element;

  } catch (error) {
    debugInfo.error = error as Error;
    debugInfo.endTime = Date.now();
    debugInfo.duration = debugInfo.endTime - debugInfo.startTime;
    recordDebugOperation(debugInfo);
    throw error;
  }
};

/**
 * Waits for async state updates to complete
 */
export const waitForStateUpdate = async (
  stateChecker: () => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> => {
  const config = getGlobalAsyncConfig();
  const {
    timeout = config.waitStrategies.stateUpdate.timeout,
    interval = config.waitStrategies.stateUpdate.interval
  } = options;

  const debugInfo: AsyncOperationDebugInfo = {
    operation: 'waitForStateUpdate',
    startTime: Date.now(),
    success: false
  };

  try {
    await waitFor(
      () => {
        if (!stateChecker()) {
          throw new Error('State condition not met');
        }
      },
      { timeout, interval }
    );

    debugInfo.success = true;
    debugInfo.endTime = Date.now();
    debugInfo.duration = debugInfo.endTime - debugInfo.startTime;
    recordDebugOperation(debugInfo);

  } catch (error) {
    debugInfo.error = error as Error;
    debugInfo.endTime = Date.now();
    debugInfo.duration = debugInfo.endTime - debugInfo.startTime;
    recordDebugOperation(debugInfo);
    throw error;
  }
};

/**
 * Performance optimization helper that batches multiple async operations
 */
export const batchAsyncOperations = async <T>(
  operations: Array<() => Promise<T>>,
  options: { concurrency?: number; timeout?: number } = {}
): Promise<T[]> => {
  const config = getGlobalAsyncConfig();
  const { concurrency = 3, timeout = config.timeouts.default } = options;

  const debugInfo: AsyncOperationDebugInfo = {
    operation: 'batchAsyncOperations',
    startTime: Date.now(),
    success: false
  };

  try {
    const results: T[] = [];
    
    // Process operations in batches to avoid overwhelming the system
    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (operation, index) => {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Operation ${i + index} timed out`)), timeout);
        });
        
        return Promise.race([operation(), timeoutPromise]);
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    debugInfo.success = true;
    debugInfo.endTime = Date.now();
    debugInfo.duration = debugInfo.endTime - debugInfo.startTime;
    recordDebugOperation(debugInfo);

    return results;

  } catch (error) {
    debugInfo.error = error as Error;
    debugInfo.endTime = Date.now();
    debugInfo.duration = debugInfo.endTime - debugInfo.startTime;
    recordDebugOperation(debugInfo);
    throw error;
  }
};

/**
 * Debugging utility for async operation troubleshooting
 */
export const debugAsyncOperation = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  options: { logDetails?: boolean; measurePerformance?: boolean } = {}
): Promise<T> => {
  const { logDetails = true, measurePerformance = true } = options;

  const debugInfo: AsyncOperationDebugInfo = {
    operation: operationName,
    startTime: Date.now(),
    success: false
  };

  if (logDetails) {
    console.debug(`Starting async operation: ${operationName}`);
  }

  try {
    const result = await operation();
    
    debugInfo.success = true;
    debugInfo.endTime = Date.now();
    debugInfo.duration = debugInfo.endTime - debugInfo.startTime;
    
    if (logDetails) {
      console.debug(`Completed async operation: ${operationName}`, {
        duration: debugInfo.duration,
        success: true
      });
    }
    
    if (measurePerformance && debugInfo.duration! > 1000) {
      console.warn(`Slow async operation detected: ${operationName} took ${debugInfo.duration}ms`);
    }
    
    recordDebugOperation(debugInfo);
    return result;

  } catch (error) {
    debugInfo.error = error as Error;
    debugInfo.endTime = Date.now();
    debugInfo.duration = debugInfo.endTime - debugInfo.startTime;
    
    if (logDetails) {
      console.debug(`Failed async operation: ${operationName}`, {
        duration: debugInfo.duration,
        error: error
      });
    }
    
    recordDebugOperation(debugInfo);
    throw error;
  }
};

/**
 * Creates a performance-optimized test wrapper for async operations
 */
export const createOptimizedAsyncTest = (testName: string) => {
  const startTime = Date.now();
  let operationCount = 0;

  return {
    /**
     * Wraps an async operation with performance tracking
     */
    wrapOperation: async <T>(name: string, operation: () => Promise<T>): Promise<T> => {
      operationCount++;
      return debugAsyncOperation(`${testName}.${name}`, operation, {
        logDetails: debugMode,
        measurePerformance: true
      });
    },

    /**
     * Gets performance summary for the test
     */
    getPerformanceSummary: () => {
      const totalDuration = Date.now() - startTime;
      const operations = debugOperations.filter(op => op.operation.startsWith(testName));
      
      return {
        testName,
        totalDuration,
        operationCount,
        operations: operations.map(op => ({
          name: op.operation,
          duration: op.duration,
          success: op.success
        })),
        averageOperationTime: operations.length > 0 
          ? operations.reduce((sum, op) => sum + (op.duration || 0), 0) / operations.length 
          : 0
      };
    }
  };
};

/**
 * Utility for handling flaky network operations in tests
 */
export const handleFlakyNetworkOperation = async <T>(
  operation: () => Promise<T>,
  options: { maxRetries?: number; backoffMs?: number } = {}
): Promise<T> => {
  const { maxRetries = 3, backoffMs = 100 } = options;
  
  const retryConfig = createNetworkRetryConfig();
  retryConfig.maxAttempts = maxRetries;
  retryConfig.backoffMs = backoffMs;
  
  const retryMechanism = createRetryMechanism(retryConfig);
  
  return debugAsyncOperation('flakyNetworkOperation', () => retryMechanism(operation), {
    logDetails: debugMode,
    measurePerformance: true
  });
};
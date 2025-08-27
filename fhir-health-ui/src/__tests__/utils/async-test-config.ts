/**
 * Async Test Configuration
 * 
 * Provides configurable timeout values and wait strategies for different types of async operations in tests.
 * This addresses Requirements 4.1, 4.2, and 4.3 for proper async operation handling.
 */

export interface AsyncTestConfig {
  // Operation-specific timeouts (in milliseconds)
  timeouts: {
    default: number;
    network: number;
    rendering: number;
    userInteraction: number;
    dataLoading: number;
    formSubmission: number;
    navigation: number;
    animation: number;
  };
  
  // Retry configurations
  retries: {
    maxAttempts: number;
    backoffMs: number;
    conditions: string[];
  };
  
  // Wait strategies for different scenarios
  waitStrategies: {
    elementAppearance: WaitForOptions;
    dataLoading: WaitForOptions;
    networkResponse: WaitForOptions;
    formValidation: WaitForOptions;
    stateUpdate: WaitForOptions;
  };
}

export interface WaitForOptions {
  timeout: number;
  interval: number;
  onTimeout?: (error: Error) => void;
  mutationObserverOptions?: MutationObserverInit;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffMs: number;
  shouldRetry: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

// Default configuration optimized for test performance and reliability
export const DEFAULT_ASYNC_CONFIG: AsyncTestConfig = {
  timeouts: {
    default: 5000,           // General fallback timeout
    network: 10000,          // Network requests (FHIR API calls)
    rendering: 3000,         // Component rendering and DOM updates
    userInteraction: 2000,   // User interactions (clicks, typing)
    dataLoading: 8000,       // Data loading operations
    formSubmission: 6000,    // Form submissions
    navigation: 4000,        // Route navigation
    animation: 1000,         // CSS animations and transitions
  },
  
  retries: {
    maxAttempts: 3,
    backoffMs: 100,
    conditions: [
      'NetworkError',
      'TimeoutError',
      'AbortError',
      'ConnectionError'
    ]
  },
  
  waitStrategies: {
    elementAppearance: {
      timeout: 3000,
      interval: 50,
      mutationObserverOptions: {
        childList: true,
        subtree: true,
        attributes: true
      }
    },
    dataLoading: {
      timeout: 8000,
      interval: 100,
      onTimeout: (error) => {
        console.warn('Data loading timeout - check for loading indicators or network issues', error);
      }
    },
    networkResponse: {
      timeout: 10000,
      interval: 200,
      onTimeout: (error) => {
        console.warn('Network response timeout - check mock implementations', error);
      }
    },
    formValidation: {
      timeout: 2000,
      interval: 50,
      onTimeout: (error) => {
        console.warn('Form validation timeout - check validation logic', error);
      }
    },
    stateUpdate: {
      timeout: 1000,
      interval: 25,
      onTimeout: (error) => {
        console.warn('State update timeout - check React state updates', error);
      }
    }
  }
};

// Fast configuration for unit tests that don't need network simulation
export const FAST_TEST_CONFIG: AsyncTestConfig = {
  ...DEFAULT_ASYNC_CONFIG,
  timeouts: {
    default: 1000,
    network: 2000,
    rendering: 1000,
    userInteraction: 500,
    dataLoading: 1500,
    formSubmission: 1000,
    navigation: 1000,
    animation: 300,
  },
  waitStrategies: {
    ...DEFAULT_ASYNC_CONFIG.waitStrategies,
    elementAppearance: {
      ...DEFAULT_ASYNC_CONFIG.waitStrategies.elementAppearance,
      timeout: 1000,
    },
    dataLoading: {
      ...DEFAULT_ASYNC_CONFIG.waitStrategies.dataLoading,
      timeout: 1500,
    },
    networkResponse: {
      ...DEFAULT_ASYNC_CONFIG.waitStrategies.networkResponse,
      timeout: 2000,
    }
  }
};

// Slow configuration for integration tests with real network simulation
export const INTEGRATION_TEST_CONFIG: AsyncTestConfig = {
  ...DEFAULT_ASYNC_CONFIG,
  timeouts: {
    default: 10000,
    network: 20000,
    rendering: 5000,
    userInteraction: 3000,
    dataLoading: 15000,
    formSubmission: 10000,
    navigation: 8000,
    animation: 2000,
  },
  retries: {
    maxAttempts: 5,
    backoffMs: 200,
    conditions: [
      'NetworkError',
      'TimeoutError',
      'AbortError',
      'ConnectionError',
      'CircuitBreakerError'
    ]
  }
};

/**
 * Creates a retry mechanism for handling flaky async operations
 */
export const createRetryMechanism = (config: RetryConfig) => {
  return async <T>(operation: () => Promise<T>): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if this error type shouldn't be retried
        if (!config.shouldRetry(lastError)) {
          throw lastError;
        }
        
        // Don't retry on the last attempt
        if (attempt === config.maxAttempts) {
          throw lastError;
        }
        
        // Call retry callback if provided
        if (config.onRetry) {
          config.onRetry(attempt, lastError);
        }
        
        // Wait before retrying with exponential backoff
        const delay = config.backoffMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  };
};

/**
 * Creates retry configuration for common error types
 */
export const createCommonRetryConfig = (maxAttempts: number = 3): RetryConfig => ({
  maxAttempts,
  backoffMs: 100,
  shouldRetry: (error: Error) => {
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'AbortError',
      'ConnectionError',
      'CircuitBreakerError'
    ];
    
    return retryableErrors.some(errorType => 
      error.message.includes(errorType) || error.name.includes(errorType)
    );
  },
  onRetry: (attempt, error) => {
    console.debug(`Retrying operation (attempt ${attempt}):`, error.message);
  }
});

/**
 * Creates retry configuration for network operations
 */
export const createNetworkRetryConfig = (): RetryConfig => ({
  maxAttempts: 5,
  backoffMs: 200,
  shouldRetry: (error: Error) => {
    // Retry on network-related errors but not on validation errors
    const networkErrors = ['NetworkError', 'TimeoutError', 'AbortError', 'ConnectionError'];
    const nonRetryableErrors = ['ValidationError', 'AuthenticationError', 'AuthorizationError'];
    
    const isNetworkError = networkErrors.some(errorType => 
      error.message.includes(errorType) || error.name.includes(errorType)
    );
    
    const isNonRetryable = nonRetryableErrors.some(errorType => 
      error.message.includes(errorType) || error.name.includes(errorType)
    );
    
    return isNetworkError && !isNonRetryable;
  },
  onRetry: (attempt, error) => {
    console.debug(`Retrying network operation (attempt ${attempt}):`, error.message);
  }
});

/**
 * Global async test configuration that can be overridden per test
 */
let globalAsyncConfig: AsyncTestConfig = DEFAULT_ASYNC_CONFIG;

export const setGlobalAsyncConfig = (config: Partial<AsyncTestConfig>) => {
  globalAsyncConfig = {
    ...globalAsyncConfig,
    ...config,
    timeouts: { ...globalAsyncConfig.timeouts, ...config.timeouts },
    retries: { ...globalAsyncConfig.retries, ...config.retries },
    waitStrategies: { ...globalAsyncConfig.waitStrategies, ...config.waitStrategies }
  };
};

export const getGlobalAsyncConfig = (): AsyncTestConfig => globalAsyncConfig;

export const resetGlobalAsyncConfig = () => {
  globalAsyncConfig = DEFAULT_ASYNC_CONFIG;
};
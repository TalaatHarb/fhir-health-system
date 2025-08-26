/**
 * Retry Mechanism Utilities
 * Provides configurable retry logic for failed API calls
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  attempts: number;
}

/**
 * Default retry condition - retries on network errors and 5xx server errors
 */
const defaultRetryCondition = (error: unknown): boolean => {
  if (error instanceof Error) {
    // Network errors
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return true;
    }
    
    // Timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return true;
    }
  }
  
  // FHIR errors with 5xx status codes
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: number }).status;
    return status >= 500 && status < 600;
  }
  
  return false;
};

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number, backoffFactor: number): number {
  const exponentialDelay = baseDelay * Math.pow(backoffFactor, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
  const delay = Math.min(exponentialDelay + jitter, maxDelay);
  return Math.floor(delay);
}

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with configurable options
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = defaultRetryCondition,
    onRetry
  } = options;

  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        break;
      }
      
      // Check if we should retry this error
      if (!retryCondition(error)) {
        break;
      }
      
      // Call retry callback if provided
      onRetry?.(attempt, error);
      
      // Calculate and wait for delay
      const delay = calculateDelay(attempt, baseDelay, maxDelay, backoffFactor);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Retry a function and return a result object instead of throwing
 */
export async function tryWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = defaultRetryCondition,
    onRetry
  } = options;

  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return {
        success: true,
        data: result,
        attempts: attempt
      };
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        break;
      }
      
      // Check if we should retry this error
      if (!retryCondition(error)) {
        break;
      }
      
      // Call retry callback if provided
      onRetry?.(attempt, error);
      
      // Calculate and wait for delay
      const delay = calculateDelay(attempt, baseDelay, maxDelay, backoffFactor);
      await sleep(delay);
    }
  }
  
  return {
    success: false,
    error: lastError,
    attempts: maxAttempts
  };
}

/**
 * Create a retry wrapper for a function
 */
export function createRetryWrapper<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    return withRetry(() => fn(...args), options);
  };
}

/**
 * Specific retry configurations for different types of operations
 */
export const retryConfigs = {
  // For critical operations that must succeed
  critical: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
  },
  
  // For standard API calls
  standard: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
  },
  
  // For quick operations that should fail fast
  quick: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffFactor: 2,
  },
  
  // For background operations that can be more patient
  background: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 60000,
    backoffFactor: 1.5,
  }
} as const;

/**
 * FHIR-specific retry condition
 */
export const fhirRetryCondition = (error: unknown): boolean => {
  // Use default condition as base
  if (defaultRetryCondition(error)) {
    return true;
  }
  
  // Also retry on specific FHIR server errors
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: number }).status;
    
    // Retry on rate limiting
    if (status === 429) {
      return true;
    }
    
    // Retry on service unavailable
    if (status === 503) {
      return true;
    }
  }
  
  return false;
};

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private readonly failureThreshold = 5,
    private readonly recoveryTimeout = 60000 // 1 minute
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }
  
  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }
  
  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }
}
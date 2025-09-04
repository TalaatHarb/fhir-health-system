import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  withRetry,
  tryWithRetry,
  createRetryWrapper,
  retryConfigs,
  fhirRetryCondition,
  CircuitBreaker
} from '../../utils/retryMechanism';

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('withRetry', () => {
  it('returns result on successful execution', async () => {
    const successFn = vi.fn().mockResolvedValue('success');

    const result = await withRetry(successFn);

    expect(result).toBe('success');
    expect(successFn).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable errors', async () => {
    const networkError = new Error('fetch failed');
    networkError.name = 'NetworkError';

    const failThenSucceed = vi.fn()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValue('success');

    const promise = withRetry(failThenSucceed, {
      maxAttempts: 3,
      baseDelay: 100,
    });

    // Fast-forward through the delay and wait for promise resolution
    await vi.advanceTimersByTimeAsync(150);

    const result = await promise;

    expect(result).toBe('success');
    expect(failThenSucceed).toHaveBeenCalledTimes(2);
  });

  it.skip('throws error after max attempts', async () => {
    const networkError = new Error('fetch failed');
    networkError.name = 'NetworkError';

    const alwaysFail = vi.fn().mockRejectedValue(networkError);

    const promise = withRetry(alwaysFail, {
      maxAttempts: 3,
      baseDelay: 100,
    });

    // Fast-forward through all delays
    await vi.advanceTimersByTimeAsync(1000);

    await expect(promise).rejects.toThrow('fetch failed');
    expect(alwaysFail).toHaveBeenCalledTimes(3);
  });

  it('does not retry on non-retryable errors', async () => {
    const nonRetryableError = new Error('Validation error');
    const failFn = vi.fn().mockRejectedValue(nonRetryableError);

    await expect(withRetry(failFn, {
      retryCondition: () => false,
    })).rejects.toThrow('Validation error');

    expect(failFn).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry callback', async () => {
    const onRetry = vi.fn();
    const networkError = new Error('fetch failed');
    networkError.name = 'NetworkError';

    const failThenSucceed = vi.fn()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValue('success');

    const promise = withRetry(failThenSucceed, {
      maxAttempts: 3,
      baseDelay: 100,
      onRetry,
    });

    await vi.advanceTimersByTimeAsync(150);
    await promise;

    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it('uses exponential backoff', async () => {
    const networkError = new Error('fetch failed');
    networkError.name = 'NetworkError';

    const failThenSucceed = vi.fn()
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
      .mockResolvedValue('success');

    const promise = withRetry(failThenSucceed, {
      maxAttempts: 3,
      baseDelay: 100,
      backoffFactor: 2,
    });

    // Fast-forward through all delays
    await vi.advanceTimersByTimeAsync(500);

    const result = await promise;

    expect(result).toBe('success');
    expect(failThenSucceed).toHaveBeenCalledTimes(3);
  });

  it('respects maxDelay', async () => {
    const networkError = new Error('fetch failed');
    networkError.name = 'NetworkError';

    const failThenSucceed = vi.fn()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValue('success');

    const promise = withRetry(failThenSucceed, {
      maxAttempts: 2,
      baseDelay: 1000,
      maxDelay: 500, // Lower than baseDelay
      backoffFactor: 2,
    });

    // Should be capped at maxDelay
    await vi.advanceTimersByTimeAsync(600);

    const result = await promise;

    expect(result).toBe('success');
  });
});

describe('tryWithRetry', () => {
  it('returns success result on successful execution', async () => {
    const successFn = vi.fn().mockResolvedValue('success');

    const result = await tryWithRetry(successFn);

    expect(result).toEqual({
      success: true,
      data: 'success',
      attempts: 1,
    });
  });

  it('returns failure result after max attempts', async () => {
    const networkError = new Error('fetch failed');
    networkError.name = 'NetworkError';

    const alwaysFail = vi.fn().mockRejectedValue(networkError);

    const promise = tryWithRetry(alwaysFail, {
      maxAttempts: 2,
      baseDelay: 100,
    });

    await vi.advanceTimersByTimeAsync(200);

    const result = await promise;

    expect(result).toEqual({
      success: false,
      error: expect.any(Error),
      attempts: 2,
    });
  });

  it('returns success after retries', async () => {
    const networkError = new Error('fetch failed');
    networkError.name = 'NetworkError';

    const failThenSucceed = vi.fn()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValue('success');

    const promise = tryWithRetry(failThenSucceed, {
      maxAttempts: 3,
      baseDelay: 100,
    });

    await vi.advanceTimersByTimeAsync(150);

    const result = await promise;

    expect(result).toEqual({
      success: true,
      data: 'success',
      attempts: 2,
    });
  });
});

describe('createRetryWrapper', () => {
  it('creates a wrapped function with retry logic', async () => {
    const originalFn = vi.fn().mockResolvedValue('success');
    const wrappedFn = createRetryWrapper(originalFn, {
      maxAttempts: 3,
    });

    const result = await wrappedFn('arg1', 'arg2');

    expect(result).toBe('success');
    expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('retries wrapped function on failure', async () => {
    const networkError = new Error('fetch failed');
    networkError.name = 'NetworkError';

    const originalFn = vi.fn()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValue('success');

    const wrappedFn = createRetryWrapper(originalFn, {
      maxAttempts: 3,
      baseDelay: 100,
    });

    const promise = wrappedFn('arg1');

    await vi.advanceTimersByTimeAsync(150);

    const result = await promise;

    expect(result).toBe('success');
    expect(originalFn).toHaveBeenCalledTimes(2);
  });
});

describe('fhirRetryCondition', () => {
  it('retries on network errors', () => {
    const networkError = new Error('fetch failed');
    networkError.name = 'NetworkError';

    expect(fhirRetryCondition(networkError)).toBe(true);
  });

  it('retries on timeout errors', () => {
    const timeoutError = new Error('Request timeout');
    timeoutError.name = 'AbortError';

    expect(fhirRetryCondition(timeoutError)).toBe(true);
  });

  it('retries on 5xx server errors', () => {
    const serverError = { status: 500 };

    expect(fhirRetryCondition(serverError)).toBe(true);
  });

  it('retries on rate limiting (429)', () => {
    const rateLimitError = { status: 429 };

    expect(fhirRetryCondition(rateLimitError)).toBe(true);
  });

  it('retries on service unavailable (503)', () => {
    const serviceUnavailableError = { status: 503 };

    expect(fhirRetryCondition(serviceUnavailableError)).toBe(true);
  });

  it('does not retry on 4xx client errors (except 429)', () => {
    const clientError = { status: 400 };

    expect(fhirRetryCondition(clientError)).toBe(false);
  });

  it('does not retry on validation errors', () => {
    const validationError = new Error('Validation failed');

    expect(fhirRetryCondition(validationError)).toBe(false);
  });
});

describe('CircuitBreaker', () => {
  it('allows execution when closed', async () => {
    const circuitBreaker = new CircuitBreaker(3, 1000);
    const successFn = vi.fn().mockResolvedValue('success');

    const result = await circuitBreaker.execute(successFn);

    expect(result).toBe('success');
    expect(circuitBreaker.getState()).toBe('closed');
  });

  it('opens after failure threshold', async () => {
    const circuitBreaker = new CircuitBreaker(2, 1000);
    const failFn = vi.fn().mockRejectedValue(new Error('Service error'));

    // First failure
    await expect(circuitBreaker.execute(failFn)).rejects.toThrow();
    expect(circuitBreaker.getState()).toBe('closed');

    // Second failure - should open circuit
    await expect(circuitBreaker.execute(failFn)).rejects.toThrow();
    expect(circuitBreaker.getState()).toBe('open');
  });

  it('rejects immediately when open', async () => {
    const circuitBreaker = new CircuitBreaker(1, 1000);
    const failFn = vi.fn().mockRejectedValue(new Error('Service error'));

    // Trigger circuit to open
    await expect(circuitBreaker.execute(failFn)).rejects.toThrow();
    expect(circuitBreaker.getState()).toBe('open');

    // Should reject immediately without calling function
    const successFn = vi.fn().mockResolvedValue('success');
    await expect(circuitBreaker.execute(successFn)).rejects.toThrow('Circuit breaker is open');
    expect(successFn).not.toHaveBeenCalled();
  });

  it('transitions to half-open after recovery timeout', async () => {
    const circuitBreaker = new CircuitBreaker(1, 1000);
    const failFn = vi.fn().mockRejectedValue(new Error('Service error'));

    // Open circuit
    await expect(circuitBreaker.execute(failFn)).rejects.toThrow();
    expect(circuitBreaker.getState()).toBe('open');

    // Fast-forward past recovery timeout
    await vi.advanceTimersByTimeAsync(1100);

    // Next execution should transition to half-open
    const successFn = vi.fn().mockResolvedValue('success');
    const result = await circuitBreaker.execute(successFn);

    expect(result).toBe('success');
    expect(circuitBreaker.getState()).toBe('closed');
  });

  it('resets failure count on success', async () => {
    const circuitBreaker = new CircuitBreaker(2, 1000);
    const failFn = vi.fn().mockRejectedValue(new Error('Service error'));
    const successFn = vi.fn().mockResolvedValue('success');

    // One failure
    await expect(circuitBreaker.execute(failFn)).rejects.toThrow();
    expect(circuitBreaker.getState()).toBe('closed');

    // Success should reset failure count
    await circuitBreaker.execute(successFn);
    expect(circuitBreaker.getState()).toBe('closed');

    // Should take 2 more failures to open
    await expect(circuitBreaker.execute(failFn)).rejects.toThrow();
    expect(circuitBreaker.getState()).toBe('closed');

    await expect(circuitBreaker.execute(failFn)).rejects.toThrow();
    expect(circuitBreaker.getState()).toBe('open');
  });

  it('can be manually reset', async () => {
    const circuitBreaker = new CircuitBreaker(1, 1000);
    const failFn = vi.fn().mockRejectedValue(new Error('Service error'));

    // Open circuit
    await expect(circuitBreaker.execute(failFn)).rejects.toThrow();
    expect(circuitBreaker.getState()).toBe('open');

    // Manual reset
    circuitBreaker.reset();
    expect(circuitBreaker.getState()).toBe('closed');

    // Should work normally now
    const successFn = vi.fn().mockResolvedValue('success');
    const result = await circuitBreaker.execute(successFn);
    expect(result).toBe('success');
  });
});

describe('retryConfigs', () => {
  it('has predefined configurations', () => {
    expect(retryConfigs.critical).toEqual({
      maxAttempts: 5,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
    });

    expect(retryConfigs.standard).toEqual({
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
    });

    expect(retryConfigs.quick).toEqual({
      maxAttempts: 2,
      baseDelay: 500,
      maxDelay: 2000,
      backoffFactor: 2,
    });

    expect(retryConfigs.background).toEqual({
      maxAttempts: 5,
      baseDelay: 2000,
      maxDelay: 60000,
      backoffFactor: 1.5,
    });
  });
});
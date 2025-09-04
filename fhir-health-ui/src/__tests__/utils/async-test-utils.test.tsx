/**
 * Tests for async testing utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  waitForDataLoading,
  waitForNetworkResponse,
  waitForElementWithRetry,
  waitForStateUpdate,
  batchAsyncOperations,
  debugAsyncOperation,
  createOptimizedAsyncTest,
  handleFlakyNetworkOperation,
  setAsyncDebugMode,
  getAsyncDebugOperations,
  clearAsyncDebugOperations
} from './async-test-utils';
import {
  setGlobalAsyncConfig,
  resetGlobalAsyncConfig,
  FAST_TEST_CONFIG
} from './async-test-config';

describe('Async Test Utils', () => {
  beforeEach(() => {
    // Use fast config for tests
    setGlobalAsyncConfig(FAST_TEST_CONFIG);
    setAsyncDebugMode(true);
    clearAsyncDebugOperations();
  });

  afterEach(() => {
    resetGlobalAsyncConfig();
    setAsyncDebugMode(false);
    clearAsyncDebugOperations();
  });

  describe('waitForDataLoading', () => {
    it('should wait for loading indicator to disappear', async () => {
      // Create a component that shows loading initially
      const TestComponent = () => {
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
          setTimeout(() => setLoading(false), 100);
        }, []);

        return loading ? <div>Loading...</div> : <div>Content loaded</div>;
      };

      render(<TestComponent />);

      // Should initially show loading
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for loading to complete
      await waitForDataLoading();

      // Should now show content
      expect(screen.getByText('Content loaded')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should wait for loading indicator by test ID', async () => {
      const TestComponent = () => {
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
          setTimeout(() => setLoading(false), 100);
        }, []);

        return loading ?
          <div data-testid="loading-spinner">Loading...</div> :
          <div>Content loaded</div>;
      };

      render(<TestComponent />);

      await waitForDataLoading({ loadingTestId: 'loading-spinner' });

      expect(screen.getByText('Content loaded')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    it('should timeout if loading never completes', async () => {
      const TestComponent = () => <div>Loading...</div>;

      render(<TestComponent />);

      await expect(
        waitForDataLoading({ timeout: 100 })
      ).rejects.toThrow();
    });
  });

  describe('waitForNetworkResponse', () => {
    it('should wait for mock function to be called', async () => {
      const mockFn = vi.fn();

      // Simulate async call
      setTimeout(() => mockFn(), 50);

      await waitForNetworkResponse({ mockFunction: mockFn });

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should wait for expected number of calls', async () => {
      const mockFn = vi.fn();

      // Simulate multiple async calls
      setTimeout(() => {
        mockFn();
        mockFn();
        mockFn();
      }, 50);

      await waitForNetworkResponse({
        mockFunction: mockFn,
        expectedCalls: 3
      });

      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should timeout if expected calls not reached', async () => {
      const mockFn = vi.fn();

      await expect(
        waitForNetworkResponse({
          mockFunction: mockFn,
          expectedCalls: 1,
          timeout: 100
        })
      ).rejects.toThrow();
    });
  });

  describe('waitForElementWithRetry', () => {
    it('should find element with retry mechanism', async () => {
      const TestComponent = () => {
        const [showElement, setShowElement] = React.useState(false);

        React.useEffect(() => {
          setTimeout(() => setShowElement(true), 100);
        }, []);

        return showElement ? <button>Click me</button> : null;
      };

      render(<TestComponent />);

      const element = await waitForElementWithRetry(
        () => screen.queryByRole('button', { name: 'Click me' })
      );

      expect(element).toBeInTheDocument();
    });

    it('should retry on element not found', async () => {
      let attempts = 0;

      const element = await waitForElementWithRetry(
        () => {
          attempts++;
          if (attempts < 3) return null;

          // Create and return a mock element after 3 attempts
          const mockElement = document.createElement('div');
          document.body.appendChild(mockElement);
          return mockElement;
        },
        { retries: 5 }
      );

      expect(element).toBeTruthy();
      expect(attempts).toBe(3);
    });
  });

  describe('waitForStateUpdate', () => {
    it('should wait for state condition to be met', async () => {
      let counter = 0;

      // Simulate state update
      setTimeout(() => {
        counter = 5;
      }, 50);

      await waitForStateUpdate(() => counter === 5);

      expect(counter).toBe(5);
    });

    it('should timeout if condition never met', async () => {
      await expect(
        waitForStateUpdate(() => false, { timeout: 100 })
      ).rejects.toThrow();
    });
  });

  describe('batchAsyncOperations', () => {
    it('should execute operations in batches', async () => {
      const operations = [
        () => Promise.resolve(1),
        () => Promise.resolve(2),
        () => Promise.resolve(3),
        () => Promise.resolve(4),
        () => Promise.resolve(5)
      ];

      const results = await batchAsyncOperations(operations, { concurrency: 2 });

      expect(results).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle operation failures', async () => {
      const operations = [
        () => Promise.resolve(1),
        () => Promise.reject(new Error('Test error')),
        () => Promise.resolve(3)
      ];

      await expect(
        batchAsyncOperations(operations)
      ).rejects.toThrow('Test error');
    });

    it('should timeout slow operations', async () => {
      const operations = [
        () => new Promise(resolve => setTimeout(() => resolve(1), 200))
      ];

      await expect(
        batchAsyncOperations(operations, { timeout: 100 })
      ).rejects.toThrow('timed out');
    });
  });

  describe('debugAsyncOperation', () => {
    it('should track successful operations', async () => {
      const result = await debugAsyncOperation(
        'test-operation',
        () => Promise.resolve('success')
      );

      expect(result).toBe('success');

      const operations = getAsyncDebugOperations();
      expect(operations).toHaveLength(1);
      expect(operations[0].operation).toBe('test-operation');
      expect(operations[0].success).toBe(true);
    });

    it('should track failed operations', async () => {
      await expect(
        debugAsyncOperation(
          'failing-operation',
          () => Promise.reject(new Error('Test error'))
        )
      ).rejects.toThrow('Test error');

      const operations = getAsyncDebugOperations();
      expect(operations).toHaveLength(1);
      expect(operations[0].operation).toBe('failing-operation');
      expect(operations[0].success).toBe(false);
      expect(operations[0].error?.message).toBe('Test error');
    });
  });

  describe('createOptimizedAsyncTest', () => {
    it('should track test performance', async () => {
      const testWrapper = createOptimizedAsyncTest('performance-test');

      await testWrapper.wrapOperation('operation1', () => Promise.resolve('result1'));
      await testWrapper.wrapOperation('operation2', () => Promise.resolve('result2'));

      const summary = testWrapper.getPerformanceSummary();

      expect(summary.testName).toBe('performance-test');
      expect(summary.operationCount).toBe(2);
      expect(summary.operations).toHaveLength(2);
    });
  });

  describe('handleFlakyNetworkOperation', () => {
    it('should retry flaky operations', async () => {
      let attempts = 0;

      const flakyOperation = () => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('NetworkError: Connection failed'));
        }
        return Promise.resolve('success');
      };

      const result = await handleFlakyNetworkOperation(flakyOperation);

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should not retry non-network errors', async () => {
      let attempts = 0;

      const operation = () => {
        attempts++;
        return Promise.reject(new Error('ValidationError: Invalid data'));
      };

      await expect(
        handleFlakyNetworkOperation(operation)
      ).rejects.toThrow('ValidationError');

      expect(attempts).toBe(1); // Should not retry validation errors
    });
  });

  describe('debug mode', () => {
    it('should record operations when debug mode is enabled', async () => {
      setAsyncDebugMode(true);

      await debugAsyncOperation('debug-test', () => Promise.resolve('test'));

      const operations = getAsyncDebugOperations();
      expect(operations).toHaveLength(1);
    });

    it('should not record operations when debug mode is disabled', async () => {
      setAsyncDebugMode(false);

      await debugAsyncOperation('debug-test', () => Promise.resolve('test'));

      const operations = getAsyncDebugOperations();
      expect(operations).toHaveLength(0);
    });
  });
});
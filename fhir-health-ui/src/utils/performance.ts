// Performance optimization utilities

/**
 * Debounce function to limit the rate of function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle function to limit function calls to once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoization utility for expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Virtual scrolling utility for large lists
 */
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function calculateVirtualScrollItems(
  scrollTop: number,
  totalItems: number,
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  
  const visibleItemsCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    startIndex + visibleItemsCount + overscan * 2
  );
  
  return {
    startIndex,
    endIndex,
    visibleItemsCount,
    totalHeight: totalItems * itemHeight,
    offsetY: startIndex * itemHeight
  };
}

/**
 * Image lazy loading utility
 */
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };
  
  return new IntersectionObserver(callback, defaultOptions);
}

/**
 * Bundle size optimization - dynamic imports helper
 */
export async function loadComponent<T>(
  importFn: () => Promise<{ default: T }>
): Promise<T> {
  try {
    const module = await importFn();
    return module.default;
  } catch (error) {
    console.error('Failed to load component:', error);
    throw error;
  }
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): any | null {
  if ('memory' in performance) {
    return (performance as any).memory;
  }
  return null;
}

/**
 * Performance timing utilities
 */
export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number> = new Map();
  
  constructor(private name: string) {
    this.startTime = performance.now();
    performance.mark(`${name}-start`);
  }
  
  mark(label: string): void {
    const time = performance.now();
    this.marks.set(label, time - this.startTime);
    performance.mark(`${this.name}-${label}`);
  }
  
  measure(from?: string, to?: string): number {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    
    const measureName = `${this.name}-duration`;
    const startMark = from ? `${this.name}-${from}` : `${this.name}-start`;
    const endMark = to ? `${this.name}-${to}` : undefined;
    
    if (endMark) {
      performance.measure(measureName, startMark, endMark);
    } else {
      performance.measure(measureName, startMark);
    }
    
    return duration;
  }
  
  getMarks(): Map<string, number> {
    return new Map(this.marks);
  }
  
  log(): void {
    console.group(`Performance: ${this.name}`);
    console.log(`Total duration: ${this.measure().toFixed(2)}ms`);
    
    for (const [label, time] of this.marks) {
      console.log(`${label}: ${time.toFixed(2)}ms`);
    }
    
    console.groupEnd();
  }
}

/**
 * React performance hooks
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRan = React.useRef<number>(Date.now());
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);
  
  return throttledValue;
}

// Import React for hooks
import React from 'react';
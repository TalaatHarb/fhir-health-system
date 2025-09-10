import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.matchMedia for tests
const mockMatchMedia = vi.fn().mockImplementation((query: string) => {
  const mediaQueryList = {
    matches: query.includes('prefers-color-scheme: dark') ? false : true, // Default to light theme
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  return mediaQueryList;
});

// Mock window object for tests
Object.defineProperty(globalThis, 'window', {
  value: {
    matchMedia: mockMatchMedia,
    location: { 
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      protocol: 'http:',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
    navigator: { 
      userAgent: 'test',
      onLine: true,
    },
    document: globalThis.document,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Ensure window.matchMedia is available globally
(globalThis as any).matchMedia = mockMatchMedia;

// Mock ResizeObserver for tests
(globalThis as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for tests
(globalThis as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock AbortController and AbortSignal for tests
class MockAbortSignal extends EventTarget {
  aborted: boolean = false;
  reason?: any;
  
  constructor() {
    super();
  }
  
  throwIfAborted() {
    if (this.aborted) {
      throw this.reason || new Error('AbortError');
    }
  }
  
  static abort(reason?: any) {
    const signal = new MockAbortSignal();
    signal.aborted = true;
    signal.reason = reason;
    return signal;
  }
  
  static timeout(delay: number) {
    const signal = new MockAbortSignal();
    setTimeout(() => {
      signal.aborted = true;
      signal.reason = new Error('TimeoutError');
      signal.dispatchEvent(new Event('abort'));
    }, delay);
    return signal;
  }
}

class MockAbortController {
  signal: MockAbortSignal;
  
  constructor() {
    this.signal = new MockAbortSignal();
  }
  
  abort(reason?: any) {
    if (!this.signal.aborted) {
      this.signal.aborted = true;
      this.signal.reason = reason;
      this.signal.dispatchEvent(new Event('abort'));
    }
  }
}

(globalThis as any).AbortController = MockAbortController;
(globalThis as any).AbortSignal = MockAbortSignal;

// Mock fetch for tests to avoid AbortSignal issues
(globalThis as any).fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      resourceType: 'Bundle',
      type: 'searchset',
      total: 2,
      entry: [
        {
          resource: {
            resourceType: 'Organization',
            id: 'org-1',
            name: 'General Hospital',
            active: true
          }
        },
        {
          resource: {
            resourceType: 'Organization',
            id: 'org-2',
            name: 'Community Clinic',
            active: true
          }
        }
      ]
    }),
    text: () => Promise.resolve(''),
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic',
    url: '',
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
  })
);

// Mock localStorage for tests
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    },
  };
};

const localStorageMock = createLocalStorageMock();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Make localStorage mock available globally for tests
(globalThis as any).localStorageMock = localStorageMock;

// Setup global test utilities
(globalThis as any).console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(), // Also suppress warnings in tests
  error: console.error,
};
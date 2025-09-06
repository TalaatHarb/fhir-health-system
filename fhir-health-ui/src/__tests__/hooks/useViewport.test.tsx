import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useViewport, getCurrentBreakpoint, matchesBreakpoint } from '../../hooks/useViewport';

// Mock window.innerWidth and window.innerHeight
const mockWindowSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
};

// Mock window.addEventListener and removeEventListener
const mockEventListeners: { [key: string]: EventListener[] } = {};
const mockAddEventListener = vi.fn((event: string, listener: EventListener) => {
  if (!mockEventListeners[event]) {
    mockEventListeners[event] = [];
  }
  mockEventListeners[event].push(listener);
});
const mockRemoveEventListener = vi.fn((event: string, listener: EventListener) => {
  if (mockEventListeners[event]) {
    const index = mockEventListeners[event].indexOf(listener);
    if (index > -1) {
      mockEventListeners[event].splice(index, 1);
    }
  }
});

// Helper to trigger resize event
const triggerResize = () => {
  if (mockEventListeners.resize) {
    mockEventListeners.resize.forEach(listener => {
      listener(new Event('resize'));
    });
  }
};

describe('useViewport', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    Object.keys(mockEventListeners).forEach(key => {
      mockEventListeners[key] = [];
    });
    
    // Mock window methods
    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should return correct viewport info for desktop', () => {
      mockWindowSize(1200, 800);
      
      const { result } = renderHook(() => useViewport());
      
      expect(result.current).toEqual({
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      });
    });

    it('should return correct viewport info for tablet', () => {
      mockWindowSize(768, 1024);
      
      const { result } = renderHook(() => useViewport());
      
      expect(result.current).toEqual({
        width: 768,
        height: 1024,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
      });
    });

    it('should return correct viewport info for mobile', () => {
      mockWindowSize(375, 667);
      
      const { result } = renderHook(() => useViewport());
      
      expect(result.current).toEqual({
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });
    });
  });

  describe('resize handling', () => {
    it('should update viewport info when window is resized', () => {
      mockWindowSize(1200, 800);
      
      const { result } = renderHook(() => useViewport());
      
      // Initial state should be desktop
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isMobile).toBe(false);
      
      // Resize to mobile
      act(() => {
        mockWindowSize(375, 667);
        triggerResize();
      });
      
      expect(result.current).toEqual({
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });
    });

    it('should handle multiple resize events', () => {
      mockWindowSize(1200, 800);
      
      const { result } = renderHook(() => useViewport());
      
      // Desktop -> Tablet
      act(() => {
        mockWindowSize(768, 1024);
        triggerResize();
      });
      
      expect(result.current.isTablet).toBe(true);
      
      // Tablet -> Mobile
      act(() => {
        mockWindowSize(320, 568);
        triggerResize();
      });
      
      expect(result.current.isMobile).toBe(true);
      
      // Mobile -> Desktop
      act(() => {
        mockWindowSize(1440, 900);
        triggerResize();
      });
      
      expect(result.current.isDesktop).toBe(true);
    });
  });

  describe('event listener management', () => {
    it('should add resize event listener on mount', () => {
      mockWindowSize(1200, 800);
      
      renderHook(() => useViewport());
      
      expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should remove resize event listener on unmount', () => {
      mockWindowSize(1200, 800);
      
      const { unmount } = renderHook(() => useViewport());
      
      const addedListener = mockAddEventListener.mock.calls[0][1];
      
      unmount();
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', addedListener);
    });
  });

  describe('breakpoint edge cases', () => {
    it('should handle exact breakpoint values correctly', () => {
      // Test mobile/tablet boundary (640px)
      mockWindowSize(640, 800);
      const { result: result640 } = renderHook(() => useViewport());
      expect(result640.current.isTablet).toBe(true);
      expect(result640.current.isMobile).toBe(false);
      
      // Test tablet/desktop boundary (1024px)
      mockWindowSize(1024, 800);
      const { result: result1024 } = renderHook(() => useViewport());
      expect(result1024.current.isDesktop).toBe(true);
      expect(result1024.current.isTablet).toBe(false);
    });

    it('should handle very small viewports', () => {
      mockWindowSize(200, 300);
      
      const { result } = renderHook(() => useViewport());
      
      expect(result.current.isMobile).toBe(true);
      expect(result.current.width).toBe(200);
      expect(result.current.height).toBe(300);
    });

    it('should handle very large viewports', () => {
      mockWindowSize(2560, 1440);
      
      const { result } = renderHook(() => useViewport());
      
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.width).toBe(2560);
      expect(result.current.height).toBe(1440);
    });
  });
});

describe('getCurrentBreakpoint', () => {
  it('should return correct breakpoint for mobile widths', () => {
    expect(getCurrentBreakpoint(320)).toBe('mobile');
    expect(getCurrentBreakpoint(639)).toBe('mobile');
  });

  it('should return correct breakpoint for tablet widths', () => {
    expect(getCurrentBreakpoint(640)).toBe('tablet');
    expect(getCurrentBreakpoint(768)).toBe('tablet');
    expect(getCurrentBreakpoint(1023)).toBe('tablet');
  });

  it('should return correct breakpoint for desktop widths', () => {
    expect(getCurrentBreakpoint(1024)).toBe('desktop');
    expect(getCurrentBreakpoint(1920)).toBe('desktop');
    expect(getCurrentBreakpoint(2560)).toBe('desktop');
  });
});

describe('matchesBreakpoint', () => {
  it('should correctly match mobile breakpoint', () => {
    expect(matchesBreakpoint(320, 'mobile')).toBe(true);
    expect(matchesBreakpoint(639, 'mobile')).toBe(true);
    expect(matchesBreakpoint(640, 'mobile')).toBe(false);
    expect(matchesBreakpoint(1024, 'mobile')).toBe(false);
  });

  it('should correctly match tablet breakpoint', () => {
    expect(matchesBreakpoint(320, 'tablet')).toBe(false);
    expect(matchesBreakpoint(640, 'tablet')).toBe(true);
    expect(matchesBreakpoint(768, 'tablet')).toBe(true);
    expect(matchesBreakpoint(1023, 'tablet')).toBe(true);
    expect(matchesBreakpoint(1024, 'tablet')).toBe(false);
  });

  it('should correctly match desktop breakpoint', () => {
    expect(matchesBreakpoint(320, 'desktop')).toBe(false);
    expect(matchesBreakpoint(640, 'desktop')).toBe(false);
    expect(matchesBreakpoint(1023, 'desktop')).toBe(false);
    expect(matchesBreakpoint(1024, 'desktop')).toBe(true);
    expect(matchesBreakpoint(1920, 'desktop')).toBe(true);
  });

  it('should handle invalid breakpoint names', () => {
    // @ts-expect-error Testing invalid input
    expect(matchesBreakpoint(1024, 'invalid')).toBe(false);
  });
});
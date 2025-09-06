import { useState, useEffect } from 'react';

export interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

// Breakpoint constants
const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
} as const;

/**
 * Custom hook for viewport detection and responsive breakpoints
 * Provides real-time viewport information and device type detection
 */
export function useViewport(): ViewportInfo {
  const [viewport, setViewport] = useState<ViewportInfo>(() => {
    // Initialize with current viewport if available (SSR safe)
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      return {
        width,
        height,
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
        isDesktop: width >= BREAKPOINTS.tablet,
      };
    }
    
    // Default values for SSR
    return {
      width: 1024,
      height: 768,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setViewport({
        width,
        height,
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
        isDesktop: width >= BREAKPOINTS.tablet,
      });
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
}

/**
 * Utility function to get current breakpoint name
 */
export function getCurrentBreakpoint(width: number): 'mobile' | 'tablet' | 'desktop' {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}

/**
 * Utility function to check if viewport matches a specific breakpoint
 */
export function matchesBreakpoint(
  width: number, 
  breakpoint: 'mobile' | 'tablet' | 'desktop'
): boolean {
  switch (breakpoint) {
    case 'mobile':
      return width < BREAKPOINTS.mobile;
    case 'tablet':
      return width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
    case 'desktop':
      return width >= BREAKPOINTS.tablet;
    default:
      return false;
  }
}
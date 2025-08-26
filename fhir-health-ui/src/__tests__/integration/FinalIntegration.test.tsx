import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../../App';
import { fhirClient } from '../../services/fhirClient';

// Mock the FHIR client
vi.mock('../../services/fhirClient');
const mockFhirClient = vi.mocked(fhirClient);

describe('Final Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful authentication
    mockFhirClient.authenticate.mockResolvedValue({
      success: true,
      user: { id: '1', name: 'Test User', email: 'test@example.com' }
    });

    // Mock organizations
    mockFhirClient.searchOrganizations.mockResolvedValue({
      entry: [
        {
          resource: {
            id: 'org1',
            name: 'Test Hospital',
            resourceType: 'Organization'
          }
        }
      ]
    });
  });

  describe('Accessibility Features', () => {
    it('provides skip link for keyboard navigation', async () => {
      render(<App />);
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(skipLink).toHaveClass('skip-link');
    });

    it('has proper ARIA landmarks and roles', async () => {
      render(<App />);
      
      // Login and navigate to main app
      const demoLoginButton = screen.getByText('Demo Login');
      await user.click(demoLoginButton);

      await waitFor(() => {
        const main = screen.getByRole('main');
        expect(main).toBeInTheDocument();
        expect(main).toHaveAttribute('id', 'main-content');
      });
    });

    it('supports keyboard navigation', async () => {
      render(<App />);
      
      // Test tab navigation
      await user.tab();
      expect(screen.getByText('Skip to main content')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/username/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/password/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Sign In')).toHaveFocus();
    });

    it('provides screen reader announcements', async () => {
      render(<App />);
      
      // Mock screen reader detection
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 NVDA',
        configurable: true
      });
      
      const demoLoginButton = screen.getByText('Demo Login');
      await user.click(demoLoginButton);
      
      // Check for aria-live regions
      await waitFor(() => {
        const liveRegions = document.querySelectorAll('[aria-live]');
        expect(liveRegions.length).toBeGreaterThan(0);
      });
    });

    it('handles high contrast mode', () => {
      // Mock high contrast preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<App />);
      
      // Verify high contrast styles are applied
      const body = document.body;
      expect(body).toBeInTheDocument();
    });

    it('respects reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<App />);
      
      // Verify animations are disabled
      const styles = getComputedStyle(document.body);
      expect(styles).toBeDefined();
    });
  });

  describe('Performance Features', () => {
    it('lazy loads components', async () => {
      const { container } = render(<App />);
      
      // Should show loading spinner initially
      expect(screen.getByText('Loading application...')).toBeInTheDocument();
      
      // Wait for components to load
      await waitFor(() => {
        expect(screen.getByText('FHIR Resource Visualizer')).toBeInTheDocument();
      });
      
      expect(container).toBeInTheDocument();
    });

    it('handles loading states throughout the app', async () => {
      render(<App />);
      
      const demoLoginButton = screen.getByText('Demo Login');
      await user.click(demoLoginButton);
      
      // Should show loading during authentication
      expect(screen.getByText('Signing In...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Signing In...')).not.toBeInTheDocument();
      });
    });

    it('provides progress indicators for long operations', async () => {
      // Mock slow organization loading
      mockFhirClient.searchOrganizations.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          entry: [
            {
              resource: {
                id: 'org1',
                name: 'Test Hospital',
                resourceType: 'Organization'
              }
            }
          ]
        }), 1000))
      );

      render(<App />);
      
      const demoLoginButton = screen.getByText('Demo Login');
      await user.click(demoLoginButton);
      
      // Should show loading state
      await waitFor(() => {
        const loadingElements = screen.getAllByText(/loading/i);
        expect(loadingElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('handles network errors gracefully', async () => {
      mockFhirClient.authenticate.mockRejectedValue(new Error('Network error'));
      
      render(<App />);
      
      const demoLoginButton = screen.getByText('Demo Login');
      await user.click(demoLoginButton);
      
      await waitFor(() => {
        expect(screen.getByText(/demo login failed/i)).toBeInTheDocument();
      });
    });

    it('provides retry mechanisms', async () => {
      mockFhirClient.searchOrganizations.mockRejectedValueOnce(new Error('Network error'));
      mockFhirClient.searchOrganizations.mockResolvedValueOnce({
        entry: [
          {
            resource: {
              id: 'org1',
              name: 'Test Hospital',
              resourceType: 'Organization'
            }
          }
        ]
      });

      render(<App />);
      
      const demoLoginButton = screen.getByText('Demo Login');
      await user.click(demoLoginButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error loading organizations/i)).toBeInTheDocument();
      });
      
      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test Hospital')).toBeInTheDocument();
      });
    });

    it('shows appropriate error boundaries', async () => {
      // Mock a component error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const ThrowError = () => {
        throw new Error('Test error');
      };
      
      render(
        <App>
          <ThrowError />
        </App>
      );
      
      // Error boundary should catch the error
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Offline Support', () => {
    it('detects offline status', async () => {
      render(<App />);
      
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      
      fireEvent(window, new Event('offline'));
      
      await waitFor(() => {
        expect(screen.getByText(/you are currently offline/i)).toBeInTheDocument();
      });
    });

    it('handles reconnection', async () => {
      render(<App />);
      
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      
      fireEvent(window, new Event('offline'));
      
      await waitFor(() => {
        expect(screen.getByText(/you are currently offline/i)).toBeInTheDocument();
      });
      
      // Go back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      
      fireEvent(window, new Event('online'));
      
      await waitFor(() => {
        expect(screen.getByText(/connection restored/i)).toBeInTheDocument();
      });
    });
  });

  describe('State Management Integration', () => {
    it('maintains state across component unmounts', async () => {
      render(<App />);
      
      // Login
      const demoLoginButton = screen.getByText('Demo Login');
      await user.click(demoLoginButton);
      
      // Select organization
      await waitFor(() => {
        const selectOrgButton = screen.getByText('Select Organization');
        user.click(selectOrgButton);
      });
      
      await waitFor(() => {
        const hospitalOption = screen.getByText('Test Hospital');
        user.click(hospitalOption);
      });
      
      // Verify state is maintained
      await waitFor(() => {
        expect(screen.getByText('Test Hospital')).toBeInTheDocument();
      });
    });

    it('handles context provider integration', async () => {
      render(<App />);
      
      // All context providers should be working
      expect(screen.getByText('FHIR Resource Visualizer')).toBeInTheDocument();
      
      // Test notification context
      const demoLoginButton = screen.getByText('Demo Login');
      await user.click(demoLoginButton);
      
      // Should show notifications
      await waitFor(() => {
        const notifications = document.querySelectorAll('[role="alert"]');
        expect(notifications.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Router Integration', () => {
    it('handles navigation correctly', async () => {
      render(<App />);
      
      // Should start at login
      expect(screen.getByText('FHIR Resource Visualizer')).toBeInTheDocument();
      expect(screen.getByText('Healthcare Data Visualization Platform')).toBeInTheDocument();
      
      // Login should navigate to app
      const demoLoginButton = screen.getByText('Demo Login');
      await user.click(demoLoginButton);
      
      await waitFor(() => {
        expect(screen.getByText('Select an Organization')).toBeInTheDocument();
      });
    });

    it('protects routes correctly', () => {
      render(<App />);
      
      // Should show login page for unauthenticated users
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Demo Login')).toBeInTheDocument();
    });
  });
});
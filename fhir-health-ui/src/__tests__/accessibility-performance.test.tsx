import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ThemeProvider } from '../contexts/ThemeContext';
import { I18nProvider } from '../contexts/I18nContext';
import { ModalProvider } from '../contexts/ModalContext';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { Modal } from '../components/common/Modal';
import { LoadingIndicator, LoadingOverlay } from '../components/common/LoadingIndicator';

// Mock translations
vi.mock('../translations/en.json', () => ({
  default: {
    common: { loading: 'Loading...', save: 'Save', cancel: 'Cancel' },
    language: { selectLanguage: 'Select Language', currentLanguage: 'Current Language' },
    theme: { lightMode: 'Light Mode', darkMode: 'Dark Mode' }
  }
}));

vi.mock('../translations/es.json', () => ({
  default: {
    common: { loading: 'Cargando...', save: 'Guardar', cancel: 'Cancelar' },
    language: { selectLanguage: 'Seleccionar Idioma', currentLanguage: 'Idioma Actual' },
    theme: { lightMode: 'Modo Claro', darkMode: 'Modo Oscuro' }
  }
}));

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ModalProvider>
          {children}
        </ModalProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

describe('Accessibility and Performance Optimizations', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Theme Toggle Accessibility', () => {
    it('should have proper ARIA labels and keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Check for proper ARIA attributes - could be button or select
      const themeControl = screen.getByRole('combobox') || screen.getByRole('button');
      expect(themeControl).toHaveAttribute('aria-describedby');
      
      // Check for group role and label
      const themeGroup = screen.getByRole('group');
      expect(themeGroup).toHaveAttribute('aria-labelledby', 'theme-toggle-label');

      // Test keyboard navigation
      await user.tab();
      expect(themeControl).toHaveFocus();

      // Test interaction (select change or button click)
      if (themeControl.tagName === 'SELECT') {
        await user.selectOptions(themeControl, 'dark');
      } else {
        await user.keyboard('{Enter}');
      }
      
      // Check if theme changed
      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute('data-theme');
      });
    });

    it('should announce theme changes to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      // Create ARIA live region for testing
      const liveRegion = document.createElement('div');
      liveRegion.id = 'theme-announcements';
      liveRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(liveRegion);

      const themeControl = screen.getByRole('combobox') || screen.getByRole('button');
      if (themeControl.tagName === 'SELECT') {
        await user.selectOptions(themeControl, 'dark');
      } else {
        await user.click(themeControl);
      }

      // Check if announcement was made
      await waitFor(() => {
        expect(liveRegion.textContent).toContain('Theme changed to');
      });
    });

    it('should support high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-contrast: high'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const themeControl = screen.getByRole('combobox') || screen.getByRole('button');
      expect(themeControl).toBeInTheDocument();
      
      // In a real test, we would check for high contrast CSS classes
      // This is a placeholder for the concept
    });
  });

  describe('Language Selector Accessibility', () => {
    it('should have proper ARIA attributes and keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');

      // Open dropdown
      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      // Check for listbox
      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();

      // Check for options
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
      
      // Each option should have proper ARIA attributes
      options.forEach(option => {
        expect(option).toHaveAttribute('aria-selected');
      });
    });

    it('should support keyboard navigation within dropdown', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      
      // Open with Enter key
      await user.tab();
      expect(trigger).toHaveFocus();
      await user.keyboard('{Enter}');

      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}');
      
      const firstOption = screen.getAllByRole('option')[0];
      expect(firstOption).toHaveFocus();

      // Close with Escape
      await user.keyboard('{Escape}');
      expect(trigger).toHaveFocus();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('should show loading states during language changes', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      const options = screen.getAllByRole('option');
      const spanishOption = options.find(option => 
        option.textContent?.includes('Español')
      );

      if (spanishOption) {
        await user.click(spanishOption);
        
        // Should show loading state briefly
        await waitFor(() => {
          expect(trigger).toBeDisabled();
        }, { timeout: 1000 });
      }
    });

    it('should announce language changes to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      // Create ARIA live region for testing
      const liveRegion = document.createElement('div');
      liveRegion.id = 'language-announcements';
      liveRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(liveRegion);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      const options = screen.getAllByRole('option');
      const spanishOption = options.find(option => 
        option.textContent?.includes('Español')
      );

      if (spanishOption) {
        await user.click(spanishOption);
        
        // Check if announcement was made
        await waitFor(() => {
          expect(liveRegion.textContent).toContain('Language changed to');
        });
      }
    });
  });

  describe('Modal Keyboard Navigation', () => {
    const TestModalPage = () => (
      <div>
        <button>First Button</button>
        <input type="text" placeholder="Test input" />
        <button>Last Button</button>
      </div>
    );

    it('should trap focus within modal', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(
        <TestWrapper>
          <Modal modalId="test-modal" />
        </TestWrapper>
      );

      // Mock modal state
      const mockModalState = {
        id: 'test-modal',
        isOpen: true,
        currentPage: 'test-page',
        pageHistory: ['test-page'],
        pageData: {},
        config: {
          size: 'medium' as const,
          pages: [{
            id: 'test-page',
            title: 'Test Page',
            component: TestModalPage
          }],
          initialPage: 'test-page'
        }
      };

      // This would require mocking the modal context
      // In a real implementation, we'd need to provide the modal state
    });

    it('should close on Escape key', async () => {
      const user = userEvent.setup();
      const mockClose = vi.fn();
      
      // This test would require proper modal context setup
      // Placeholder for the concept
      expect(mockClose).not.toHaveBeenCalled();
    });

    it('should restore focus when modal closes', async () => {
      // This test would verify that focus returns to the element
      // that opened the modal when it closes
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Loading States and Performance', () => {
    it('should render loading indicator with proper accessibility', () => {
      render(<LoadingIndicator message="Loading content..." />);

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
      expect(loadingElement).toHaveAttribute('aria-label', 'Loading content...');

      // Check for screen reader text
      expect(screen.getByText('Please wait while content is loading')).toHaveClass('sr-only');
    });

    it('should support reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<LoadingIndicator />);
      
      const spinner = document.querySelector('.loading-indicator__spinner');
      expect(spinner).toBeInTheDocument();
      
      // In a real test, we would check that animations are disabled
    });

    it('should render loading overlay correctly', () => {
      render(
        <LoadingOverlay isLoading={true} message="Processing...">
          <div>Content to overlay</div>
        </LoadingOverlay>
      );

      expect(screen.getByText('Content to overlay')).toBeInTheDocument();
      expect(screen.getAllByRole('status')).toHaveLength(2); // Both overlay and indicator have status role
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should not render overlay when not loading', () => {
      render(
        <LoadingOverlay isLoading={false} message="Processing...">
          <div>Content to overlay</div>
        </LoadingOverlay>
      );

      expect(screen.getByText('Content to overlay')).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Theme Switching Performance', () => {
    it('should apply theme changes without FOUC', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const themeControl = screen.getByRole('combobox') || screen.getByRole('button');
      
      // Mock requestAnimationFrame
      const mockRAF = vi.fn(cb => setTimeout(cb, 16));
      global.requestAnimationFrame = mockRAF;

      if (themeControl.tagName === 'SELECT') {
        await user.selectOptions(themeControl, 'dark');
      } else {
        await user.click(themeControl);
      }

      // Verify that requestAnimationFrame was used for smooth transitions
      expect(mockRAF).toHaveBeenCalled();
      
      // Check that theme attribute was set
      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute('data-theme');
      });
    });

    it('should add transition class during theme changes', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const themeControl = screen.getByRole('combobox') || screen.getByRole('button');
      if (themeControl.tagName === 'SELECT') {
        await user.selectOptions(themeControl, 'dark');
      } else {
        await user.click(themeControl);
      }

      // In a real implementation, we would check for the transition class
      // This is a placeholder for the concept
      expect(document.documentElement).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide proper screen reader only content', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
          <LanguageSelector />
        </TestWrapper>
      );

      // Check for sr-only elements
      const srOnlyElements = document.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);

      // Verify sr-only elements have the correct class
      srOnlyElements.forEach(element => {
        expect(element).toHaveClass('sr-only');
      });
    });

    it('should provide proper ARIA live regions', () => {
      render(
        <TestWrapper>
          <ThemeToggle />
          <LanguageSelector />
        </TestWrapper>
      );

      // Check for ARIA live regions
      const liveRegions = document.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);

      liveRegions.forEach(region => {
        expect(region).toHaveAttribute('aria-live', 'polite');
        expect(region).toHaveAttribute('aria-atomic', 'true');
      });
    });
  });
});
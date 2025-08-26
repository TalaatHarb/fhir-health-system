import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../../App';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should show login page when not authenticated', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /fhir resource visualizer/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });
  });

  it('should authenticate and show main application', async () => {
    render(<App />);

    // Wait for login page to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /demo login/i })).toBeInTheDocument();
    });

    // Click demo login
    const demoButton = screen.getByRole('button', { name: /demo login/i });
    fireEvent.click(demoButton);

    // Wait for authentication and main app to load
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
      expect(screen.getByText(/you are successfully authenticated/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should persist authentication state', async () => {
    // Mock existing authentication
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      isAuthenticated: true,
      user: {
        id: 'user-123',
        username: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        roles: ['healthcare-professional'],
      },
    }));

    render(<App />);

    // Should show main application directly
    await waitFor(() => {
      expect(screen.getByText(/welcome, demo user/i)).toBeInTheDocument();
    });
  });

  it('should handle logout', async () => {
    // Start with authenticated state
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      isAuthenticated: true,
      user: {
        id: 'user-123',
        username: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        roles: ['healthcare-professional'],
      },
    }));

    render(<App />);

    // Wait for main app to load
    await waitFor(() => {
      expect(screen.getByText(/welcome, demo user/i)).toBeInTheDocument();
    });

    // Click logout
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    // Should return to login page
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /fhir resource visualizer/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });
  });
});
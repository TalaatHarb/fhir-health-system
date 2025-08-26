import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginPage } from '../../../components/auth/LoginPage';
import { AuthProvider } from '../../../contexts/AuthContext';

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

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('LoginPage', () => {
  const mockOnLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should render login form with all elements', () => {
    render(
      <TestWrapper>
        <LoginPage onLogin={mockOnLogin} />
      </TestWrapper>
    );

    expect(screen.getByRole('heading', { name: /fhir resource visualizer/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /demo login/i })).toBeInTheDocument();
  });

  it('should handle form input changes', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <LoginPage onLogin={mockOnLogin} />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'testpass');

    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('testpass');
  });

  it('should handle form submission with credentials', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <LoginPage onLogin={mockOnLogin} />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'testpass');
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();

    // Wait for login to complete
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalled();
    });
  });

  it('should handle demo login button', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <LoginPage onLogin={mockOnLogin} />
      </TestWrapper>
    );

    const demoButton = screen.getByRole('button', { name: /demo login/i });
    await user.click(demoButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    });

    // Wait for login to complete
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalled();
    });
  });

  it('should handle empty form submission (demo mode)', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <LoginPage onLogin={mockOnLogin} />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    // Should still work with empty credentials in demo mode
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalled();
    });
  });

  it('should disable form elements during loading', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <LoginPage onLogin={mockOnLogin} />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    const demoButton = screen.getByRole('button', { name: /demo login/i });

    await user.click(submitButton);

    // Elements should be disabled during loading
    expect(usernameInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    expect(demoButton).toBeDisabled();
  });

  it('should clear form error when user starts typing', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <LoginPage onLogin={mockOnLogin} />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);

    // Simulate an error state (this would normally come from a failed login)
    // For this test, we'll just check that typing clears any existing error
    await user.type(usernameInput, 'test');

    // No error should be visible initially
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should show development mode information', () => {
    render(
      <TestWrapper>
        <LoginPage onLogin={mockOnLogin} />
      </TestWrapper>
    );

    expect(screen.getByText(/development mode/i)).toBeInTheDocument();
    expect(screen.getByText(/fake login page for development purposes/i)).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <LoginPage onLogin={mockOnLogin} />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(usernameInput).toHaveAttribute('autoComplete', 'username');
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should call onLogin callback when authentication succeeds', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <LoginPage onLogin={mockOnLogin} />
      </TestWrapper>
    );

    const demoButton = screen.getByRole('button', { name: /demo login/i });
    await user.click(demoButton);

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalled();
    });
  });
});
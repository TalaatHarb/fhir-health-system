import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { 
  renderWithProviders, 
  renderWithAuth, 
  renderWithoutAuth,
  mockUser,
  mockOrganization,
  cleanupMocks 
} from './test-utils';
import { MainApplication } from '../components/MainApplication';
import { LoginPage } from '../components/auth/LoginPage';

describe('Test Utils Example', () => {
  beforeEach(() => {
    cleanupMocks();
  });

  it('should render with all providers', async () => {
    renderWithProviders(<div>Test Content</div>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render with authenticated user', async () => {
    renderWithAuth(<MainApplication />);
    
    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });

  it('should render without authentication', async () => {
    renderWithoutAuth(<LoginPage />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /fhir resource visualizer/i })).toBeInTheDocument();
    });
  });

  it('should provide mock data in context', async () => {
    const TestComponent = () => {
      return (
        <div>
          <span data-testid="user-name">{mockUser.name}</span>
          <span data-testid="org-name">{mockOrganization.name}</span>
        </div>
      );
    };

    renderWithAuth(<TestComponent />);
    
    expect(screen.getByTestId('user-name')).toHaveTextContent('Demo User');
    expect(screen.getByTestId('org-name')).toHaveTextContent('Test Healthcare Organization');
  });
});
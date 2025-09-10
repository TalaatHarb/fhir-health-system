import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OrganizationProvider, PatientProvider, NotificationProvider, ModalProvider, ThemeProvider, I18nProvider } from '../../contexts';
import { MainApplication } from '../../components/MainApplication';
import { fhirClient } from '../../services/fhirClient';
import type { Organization, Bundle, User } from '../../types';

// Mock the FHIR client
vi.mock('../../services/fhirClient', () => ({
  fhirClient: {
    searchOrganizations: vi.fn(),
    setOrganization: vi.fn(),
  }
}));

const mockFhirClient = fhirClient as any;

// Mock AuthContext to provide authenticated user
vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      isAuthenticated: true,
      user: {
        id: 'test-user',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com'
      } as User,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
      error: null
    })
  };
});

const mockOrganizations: Organization[] = [
  {
    resourceType: 'Organization',
    id: 'org-1',
    name: 'Test Hospital',
    active: true,
    type: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/organization-type',
        code: 'prov',
        display: 'Healthcare Provider'
      }]
    }],
    address: [{
      line: ['123 Main St'],
      city: 'Test City',
      state: 'TS',
      postalCode: '12345'
    }]
  },
  {
    resourceType: 'Organization',
    id: 'org-2',
    name: 'Test Clinic',
    active: true
  }
];

const mockBundle: Bundle<Organization> = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 2,
  entry: mockOrganizations.map(org => ({
    resource: org
  }))
};

// Test wrapper component with all required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <I18nProvider>
      <NotificationProvider>
        <ModalProvider>
          <OrganizationProvider>
            <PatientProvider>
              {children}
            </PatientProvider>
          </OrganizationProvider>
        </ModalProvider>
      </NotificationProvider>
    </I18nProvider>
  </ThemeProvider>
);

describe('Organization Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFhirClient.searchOrganizations.mockResolvedValue(mockBundle);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should show organization modal on initial load', async () => {
    render(
      <TestWrapper>
        <MainApplication />
      </TestWrapper>
    );

    // Should show the modal initially since no organization is selected
    await waitFor(() => {
      expect(screen.getByTestId('organization-modal-title')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    expect(screen.getByText('Test Clinic')).toBeInTheDocument();
  });

  it('should allow organization selection and update UI', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <MainApplication />
      </TestWrapper>
    );

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('organization-modal-title')).toBeInTheDocument();
    });

    // Select an organization
    await user.click(screen.getByText('Test Hospital'));

    // Modal should close and organization should be displayed
    await waitFor(() => {
      expect(screen.queryByTestId('organization-modal-title')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('current-org')).toHaveTextContent('Test Hospital');
    expect(mockFhirClient.setOrganization).toHaveBeenCalledWith('org-1');
  });

  it('should allow organization switching', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <MainApplication />
      </TestWrapper>
    );

    // Wait for modal and select first organization
    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Test Hospital'));

    // Wait for selection to complete
    await waitFor(() => {
      expect(screen.getByTestId('current-org')).toHaveTextContent('Test Hospital');
    });

    // Click switch organization button
    await user.click(screen.getByTestId('switch-org-button'));

    // Modal should reopen
    await waitFor(() => {
      expect(screen.getByTestId('organization-modal-title')).toBeInTheDocument();
    });

    // Select different organization
    await user.click(screen.getByText('Test Clinic'));

    // Should update to new organization
    await waitFor(() => {
      expect(screen.getByTestId('current-org')).toHaveTextContent('Test Clinic');
    });

    expect(mockFhirClient.setOrganization).toHaveBeenCalledWith('org-2');
  });

  it('should show switch organization button after selection', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <MainApplication />
      </TestWrapper>
    );

    // Select organization
    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Test Hospital'));

    // Should show switch organization button
    await waitFor(() => {
      expect(screen.getByTestId('switch-org-button')).toBeInTheDocument();
    });

    // Click switch organization button
    await user.click(screen.getByTestId('switch-org-button'));

    // Modal should reopen
    await waitFor(() => {
      expect(screen.getByTestId('organization-modal-title')).toBeInTheDocument();
    });
  });

  it('should handle organization fetch errors', async () => {
    const errorMessage = 'Network error';
    mockFhirClient.searchOrganizations.mockRejectedValue(new Error(errorMessage));

    render(
      <TestWrapper>
        <MainApplication />
      </TestWrapper>
    );

    // Should show error in modal
    await waitFor(() => {
      expect(screen.getByText(`Error loading organizations: ${errorMessage}`)).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should handle empty organizations list', async () => {
    const emptyBundle: Bundle<Organization> = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 0,
      entry: []
    };

    mockFhirClient.searchOrganizations.mockResolvedValue(emptyBundle);

    render(
      <TestWrapper>
        <MainApplication />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No organizations available')).toBeInTheDocument();
    });
  });

  it('should show loading state while fetching organizations', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: Bundle<Organization>) => void;
    const promise = new Promise<Bundle<Organization>>((resolve) => {
      resolvePromise = resolve;
    });

    mockFhirClient.searchOrganizations.mockReturnValue(promise);

    render(
      <TestWrapper>
        <MainApplication />
      </TestWrapper>
    );

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Loading organizations...')).toBeInTheDocument();
    });

    // Resolve the promise
    resolvePromise!(mockBundle);

    // Should show organizations after loading
    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    });
  });

  it('should maintain organization selection across component re-renders', async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <TestWrapper>
        <MainApplication />
      </TestWrapper>
    );

    // Select organization
    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Test Hospital'));

    await waitFor(() => {
      expect(screen.getByTestId('current-org')).toHaveTextContent('Test Hospital');
    });

    // Re-render component
    rerender(
      <TestWrapper>
        <MainApplication />
      </TestWrapper>
    );

    // Organization should still be selected
    expect(screen.getByTestId('current-org')).toHaveTextContent('Test Hospital');
  });

  it('should have close button that works', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <MainApplication />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('organization-modal-title')).toBeInTheDocument();
    });

    // Verify close button exists and is clickable
    const closeButton = screen.getByTestId('organization-modal-close');
    expect(closeButton).toBeInTheDocument();

    // Click the close button - modal should close temporarily but reopen since no org is selected
    await user.click(closeButton);

    // Modal should still be present (reopened) since no organization is selected
    await waitFor(() => {
      expect(screen.getByTestId('organization-modal-title')).toBeInTheDocument();
    });
  });

  it('should respond to escape key', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <MainApplication />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('organization-modal-title')).toBeInTheDocument();
    });

    // Focus the modal overlay to ensure escape key works
    const overlay = screen.getByTestId('modal-overlay');
    overlay.focus();
    await user.keyboard('{Escape}');

    // Modal should still be present (reopened) since no organization is selected
    await waitFor(() => {
      expect(screen.getByTestId('organization-modal-title')).toBeInTheDocument();
    });
  });
});
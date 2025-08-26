import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OrganizationProvider } from '../../contexts';
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
      <OrganizationProvider>
        <MainApplication />
      </OrganizationProvider>
    );

    // Should show the modal initially since no organization is selected
    await waitFor(() => {
      expect(screen.getByText('Select Organization')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    expect(screen.getByText('Test Clinic')).toBeInTheDocument();
  });

  it('should allow organization selection and update UI', async () => {
    const user = userEvent.setup();

    render(
      <OrganizationProvider>
        <MainApplication />
      </OrganizationProvider>
    );

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Select Organization')).toBeInTheDocument();
    });

    // Select an organization
    await user.click(screen.getByText('Test Hospital'));

    // Modal should close and organization should be displayed
    await waitFor(() => {
      expect(screen.queryByText('Select Organization')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Current Organization: Test Hospital')).toBeInTheDocument();
    expect(screen.getByText('Organization ID: org-1')).toBeInTheDocument();
    expect(mockFhirClient.setOrganization).toHaveBeenCalledWith('org-1');
  });

  it('should allow organization switching', async () => {
    const user = userEvent.setup();

    render(
      <OrganizationProvider>
        <MainApplication />
      </OrganizationProvider>
    );

    // Wait for modal and select first organization
    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Test Hospital'));

    // Wait for selection to complete
    await waitFor(() => {
      expect(screen.getByText('Current Organization: Test Hospital')).toBeInTheDocument();
    });

    // Click switch organization button
    await user.click(screen.getByText('Switch Organization'));

    // Modal should reopen
    await waitFor(() => {
      expect(screen.getByText('Select Organization')).toBeInTheDocument();
    });

    // Select different organization
    await user.click(screen.getByText('Test Clinic'));

    // Should update to new organization
    await waitFor(() => {
      expect(screen.getByText('Current Organization: Test Clinic')).toBeInTheDocument();
    });

    expect(mockFhirClient.setOrganization).toHaveBeenCalledWith('org-2');
  });

  it('should show change organization button after selection', async () => {
    const user = userEvent.setup();

    render(
      <OrganizationProvider>
        <MainApplication />
      </OrganizationProvider>
    );

    // Select organization
    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Test Hospital'));

    // Should show change organization button
    await waitFor(() => {
      expect(screen.getByText('Change Organization')).toBeInTheDocument();
    });

    // Click change organization button
    await user.click(screen.getByText('Change Organization'));

    // Modal should reopen
    await waitFor(() => {
      expect(screen.getByText('Select Organization')).toBeInTheDocument();
    });
  });

  it('should handle organization fetch errors', async () => {
    const errorMessage = 'Network error';
    mockFhirClient.searchOrganizations.mockRejectedValue(new Error(errorMessage));

    render(
      <OrganizationProvider>
        <MainApplication />
      </OrganizationProvider>
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
      <OrganizationProvider>
        <MainApplication />
      </OrganizationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No organizations available.')).toBeInTheDocument();
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
      <OrganizationProvider>
        <MainApplication />
      </OrganizationProvider>
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
      <OrganizationProvider>
        <MainApplication />
      </OrganizationProvider>
    );

    // Select organization
    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Test Hospital'));

    await waitFor(() => {
      expect(screen.getByText('Current Organization: Test Hospital')).toBeInTheDocument();
    });

    // Re-render component
    rerender(
      <OrganizationProvider>
        <MainApplication />
      </OrganizationProvider>
    );

    // Organization should still be selected
    expect(screen.getByText('Current Organization: Test Hospital')).toBeInTheDocument();
  });

  it('should close modal when clicking outside', async () => {
    const user = userEvent.setup();

    render(
      <OrganizationProvider>
        <MainApplication />
      </OrganizationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Select Organization')).toBeInTheDocument();
    });

    // Click on the overlay (outside the modal content)
    const overlay = screen.getByRole('dialog');
    await user.click(overlay);

    await waitFor(() => {
      expect(screen.queryByText('Select Organization')).not.toBeInTheDocument();
    });
  });

  it('should close modal with escape key', async () => {
    const user = userEvent.setup();

    render(
      <OrganizationProvider>
        <MainApplication />
      </OrganizationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Select Organization')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText('Select Organization')).not.toBeInTheDocument();
    });
  });
});
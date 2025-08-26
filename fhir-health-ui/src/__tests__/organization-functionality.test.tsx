import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrganizationProvider, useOrganization } from '../contexts/OrganizationContext';
import { fhirClient } from '../services/fhirClient';
import type { Organization, Bundle } from '../types/fhir';

// Mock the FHIR client
vi.mock('../services/fhirClient', () => ({
  fhirClient: {
    searchOrganizations: vi.fn(),
    setOrganization: vi.fn(),
  }
}));

const mockFhirClient = fhirClient as any;

// Simple test component
function TestOrganizationComponent() {
  const { currentOrganization, organizations, selectOrganization, loading } = useOrganization();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="current-org">
        {currentOrganization?.name || 'No organization selected'}
      </div>
      <div data-testid="org-count">{organizations.length}</div>
      {organizations.map((org) => (
        <button
          key={org.id}
          onClick={() => selectOrganization(org)}
          data-testid={`select-${org.id}`}
        >
          {org.name}
        </button>
      ))}
    </div>
  );
}

const mockOrganizations: Organization[] = [
  {
    resourceType: 'Organization',
    id: 'org-1',
    name: 'Test Hospital',
    active: true
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
  entry: mockOrganizations.map(org => ({ resource: org }))
};

describe('Organization Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFhirClient.searchOrganizations.mockResolvedValue(mockBundle);
  });

  it('should load and display organizations', async () => {
    render(
      <OrganizationProvider>
        <TestOrganizationComponent />
      </OrganizationProvider>
    );

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for organizations to load
    await waitFor(() => {
      expect(screen.getByTestId('org-count')).toHaveTextContent('2');
    });

    expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    expect(screen.getByText('Test Clinic')).toBeInTheDocument();
    expect(screen.getByTestId('current-org')).toHaveTextContent('No organization selected');
  });

  it('should allow organization selection', async () => {
    const user = userEvent.setup();

    render(
      <OrganizationProvider>
        <TestOrganizationComponent />
      </OrganizationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('org-count')).toHaveTextContent('2');
    });

    // Select an organization
    await user.click(screen.getByTestId('select-org-1'));

    expect(screen.getByTestId('current-org')).toHaveTextContent('Test Hospital');
    expect(mockFhirClient.setOrganization).toHaveBeenCalledWith('org-1');
  });

  it('should call FHIR client to fetch organizations', async () => {
    render(
      <OrganizationProvider>
        <TestOrganizationComponent />
      </OrganizationProvider>
    );

    await waitFor(() => {
      expect(mockFhirClient.searchOrganizations).toHaveBeenCalledWith({});
    });
  });
});
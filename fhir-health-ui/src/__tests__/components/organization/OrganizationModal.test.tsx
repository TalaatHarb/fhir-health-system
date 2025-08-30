import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationModal } from '../../../components/organization/OrganizationModal';
import { renderWithProviders } from '../../test-utils';
import type { Organization } from '../../../types/fhir';

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
      }],
      text: 'Healthcare Provider'
    }],
    address: [{
      line: ['123 Main St'],
      city: 'Test City',
      state: 'TS',
      postalCode: '12345'
    }],
    telecom: [{
      system: 'phone',
      value: '555-0123'
    }, {
      system: 'email',
      value: 'contact@testhospital.com'
    }]
  },
  {
    resourceType: 'Organization',
    id: 'org-2',
    name: 'Test Clinic',
    active: true,
    type: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/organization-type',
        code: 'prov',
        display: 'Healthcare Provider'
      }]
    }]
  },
  {
    resourceType: 'Organization',
    id: 'org-3',
    // Organization without name to test fallback
    active: true
  }
];

describe('OrganizationModal', () => {
  const defaultProps = {
    isOpen: true,
    organizations: mockOrganizations,
    currentOrg: null,
    onSelect: vi.fn(),
    onClose: vi.fn(),
    loading: false,
    error: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when closed', () => {
    renderWithProviders(
      <OrganizationModal
        {...defaultProps}
        isOpen={false}
      />
    );

    expect(screen.queryByText('Select Organization')).not.toBeInTheDocument();
  });

  it('should render modal when open', () => {
    renderWithProviders(<OrganizationModal {...defaultProps} />);

    expect(screen.getByText('Select Organization')).toBeInTheDocument();
    expect(screen.getByText('Please select an organization to continue', {exact: false})).toBeInTheDocument();
  });

  it('should display organizations list', () => {
    renderWithProviders(<OrganizationModal {...defaultProps} />);

    expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    expect(screen.getByText('Test Clinic')).toBeInTheDocument();
    expect(screen.getByText('Unnamed Organization')).toBeInTheDocument();
  });

  it('should display organization details', () => {
    renderWithProviders(<OrganizationModal {...defaultProps} />);

    // Check for organization details
    expect(screen.getByText('ID: org-1')).toBeInTheDocument();
    expect(screen.getAllByText('Type: Healthcare Provider')[0]).toBeInTheDocument();
    expect(screen.getByText('123 Main St, Test City, TS 12345')).toBeInTheDocument();
    expect(screen.getByText('📞 555-0123')).toBeInTheDocument();
    expect(screen.getByText('📧 contact@testhospital.com')).toBeInTheDocument();
  });

  it('should handle organization selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    renderWithProviders(
      <OrganizationModal
        {...defaultProps}
        onSelect={onSelect}
      />
    );

    await user.click(screen.getByText('Test Hospital'));

    expect(onSelect).toHaveBeenCalledWith(mockOrganizations[0]);
  });

  it('should handle keyboard selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    renderWithProviders(
      <OrganizationModal
        {...defaultProps}
        onSelect={onSelect}
      />
    );

    const hospitalItem = screen.getByText('Test Hospital').closest('[role="button"]') as HTMLElement;
    expect(hospitalItem).toBeInTheDocument();

    if (hospitalItem) {
      hospitalItem.focus();
      await user.keyboard('{Enter}');
      expect(onSelect).toHaveBeenCalledWith(mockOrganizations[0]);

      onSelect.mockClear();
      await user.keyboard(' ');
      expect(onSelect).toHaveBeenCalledWith(mockOrganizations[0]);
    }
  });

  it('should show selected organization', () => {
    renderWithProviders(
      <OrganizationModal
        {...defaultProps}
        currentOrg={mockOrganizations[0]}
      />
    );

    expect(screen.getByText('✓ Selected')).toBeInTheDocument();
    
    const selectedItem = screen.getByText('Test Hospital').closest('.organization-item');
    expect(selectedItem).toHaveClass('selected');
  });

  it('should handle close button click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <OrganizationModal
        {...defaultProps}
        onClose={onClose}
      />
    );

    await user.click(screen.getByLabelText('Close organization selection'));

    expect(onClose).toHaveBeenCalled();
  });

  it('should handle overlay click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <OrganizationModal
        {...defaultProps}
        onClose={onClose}
      />
    );

    const overlay = screen.getByRole('dialog');
    await user.click(overlay);

    expect(onClose).toHaveBeenCalled();
  });

  it.skip('should handle escape key', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <OrganizationModal
        {...defaultProps}
        onClose={onClose}
      />
    );

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('should not close on modal content click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <OrganizationModal
        {...defaultProps}
        onClose={onClose}
      />
    );

    const modalContent = screen.getByText('Select Organization');
    await user.click(modalContent);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should show loading state', () => {
    renderWithProviders(
      <OrganizationModal
        {...defaultProps}
        loading={true}
      />
    );

    expect(screen.getByText('Loading organizations...')).toBeInTheDocument();
    expect(screen.queryByText('Test Hospital')).not.toBeInTheDocument();
  });

  it('should show error state', () => {
    const errorMessage = 'Failed to load organizations';

    renderWithProviders(
      <OrganizationModal
        {...defaultProps}
        error={errorMessage}
        loading={false}
      />
    );

    expect(screen.getByText(`Error loading organizations: ${errorMessage}`)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.queryByText('Test Hospital')).not.toBeInTheDocument();
  });

  it('should handle retry button click', async () => {
    const user = userEvent.setup();
    
    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });

    renderWithProviders(
      <OrganizationModal
        {...defaultProps}
        error="Failed to load"
        loading={false}
      />
    );

    await user.click(screen.getByText('Retry'));

    expect(mockReload).toHaveBeenCalled();
  });

  it('should show empty state', () => {
    renderWithProviders(
      <OrganizationModal
        {...defaultProps}
        organizations={[]}
        loading={false}
      />
    );

    expect(screen.getByText('No organizations available.')).toBeInTheDocument();
  });

  it('should handle organizations without complete data', () => {
    const incompleteOrg: Organization = {
      resourceType: 'Organization',
      id: 'incomplete-org'
      // Missing name, type, address, telecom
    };

    renderWithProviders(
      <OrganizationModal
        {...defaultProps}
        organizations={[incompleteOrg]}
      />
    );

    expect(screen.getByText('Unnamed Organization')).toBeInTheDocument();
    expect(screen.getByText('ID: incomplete-org')).toBeInTheDocument();
  });

  it('should handle organizations with complex type structures', () => {
    const complexOrg: Organization = {
      resourceType: 'Organization',
      id: 'complex-org',
      name: 'Complex Organization',
      type: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/organization-type',
          code: 'prov',
          display: 'Healthcare Provider'
        }, {
          system: 'http://terminology.hl7.org/CodeSystem/organization-type',
          code: 'dept',
          display: 'Hospital Department'
        }]
      }, {
        text: 'Custom Type'
      }]
    };

    renderWithProviders(
      <OrganizationModal
        {...defaultProps}
        organizations={[complexOrg]}
      />
    );

    expect(screen.getByText('Complex Organization')).toBeInTheDocument();
    expect(screen.getByText('Type: Healthcare Provider, Custom Type')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    renderWithProviders(<OrganizationModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'organization-modal-title');

    const closeButton = screen.getByLabelText('Close organization selection');
    expect(closeButton).toBeInTheDocument();

    const organizationButtons = screen.getAllByRole('button');
    const orgButtons = organizationButtons.filter(btn => 
      btn.getAttribute('aria-pressed') !== null
    );
    
    expect(orgButtons.length).toBeGreaterThan(0);
    orgButtons.forEach(button => {
      expect(button).toHaveAttribute('tabIndex', '0');
      expect(button).toHaveAttribute('aria-pressed');
    });
  });
});
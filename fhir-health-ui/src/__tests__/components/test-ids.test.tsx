import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../../components/auth/LoginPage';
import { OrganizationModal } from '../../components/organization/OrganizationModal';
import { PatientSearch } from '../../components/patient/PatientSearch';
import { PatientCreateModal } from '../../components/patient/PatientCreateModal';
import { MainApplication } from '../../components/MainApplication';
import { TestIds } from '../../types/testable';
import { renderWithProviders } from '../test-utils';

// Create mock functions that can be overridden in tests
const mockUseAuth = vi.fn();
const mockUseOrganization = vi.fn();
const mockUsePatient = vi.fn();

// Mock contexts with default values
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('../../contexts/OrganizationContext', () => ({
  useOrganization: () => mockUseOrganization(),
  OrganizationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('../../contexts/PatientContext', () => ({
  usePatient: () => mockUsePatient(),
  PatientProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('../../contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    removeNotification: vi.fn()
  }),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('Component Test IDs', () => {
  beforeEach(() => {
    // Set default mock implementations
    mockUseAuth.mockReturnValue({
      user: { name: 'Test User' },
      logout: vi.fn(),
      login: vi.fn(),
      loading: false,
      error: null,
      isAuthenticated: true
    });

    mockUseOrganization.mockReturnValue({
      currentOrganization: { id: 'org-1', name: 'Test Organization' },
      organizations: [{ id: 'org-1', name: 'Test Organization' }],
      selectOrganization: vi.fn(),
      showOrganizationModal: vi.fn(),
      hideOrganizationModal: vi.fn(),
      loading: false,
      error: null
    });

    mockUsePatient.mockReturnValue({
      state: {
        searchResults: [],
        searchLoading: false,
        searchError: null,
        searchQuery: '',
        createModalOpen: false,
        createLoading: false,
        openPatients: new Map()
      },
      searchPatients: vi.fn(),
      clearSearchResults: vi.fn(),
      openCreateModal: vi.fn(),
      closeCreateModal: vi.fn(),
      openPatient: vi.fn(),
      createPatient: vi.fn()
    });
  });

  describe('LoginPage', () => {
    it('should have all required test-id attributes', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId(TestIds.LOGIN_FORM)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.USERNAME_INPUT)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.PASSWORD_INPUT)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.LOGIN_BUTTON)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.DEMO_LOGIN_BUTTON)).toBeInTheDocument();
    });

    it('should show error message with test-id when there is an error', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        logout: vi.fn(),
        login: vi.fn(),
        loading: false,
        error: 'Login failed',
        isAuthenticated: false
      });

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId(TestIds.LOGIN_ERROR)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.LOGIN_ERROR)).toHaveTextContent('Login failed');
    });
  });

  describe('MainApplication', () => {
    it('should have all required test-id attributes in header', () => {
      renderWithProviders(<MainApplication />);

      expect(screen.getByTestId(TestIds.MAIN_HEADER)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.APP_TITLE)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.USER_WELCOME)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.LOGOUT_BUTTON)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.SWITCH_ORG_BUTTON)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.CURRENT_ORG)).toBeInTheDocument();
    });
  });

  describe('OrganizationModal', () => {
    const mockOrganizations = [
      { id: 'org-1', name: 'Test Hospital' },
      { id: 'org-2', name: 'Test Clinic' }
    ];

    it('should have all required test-id attributes', () => {
      render(
        <OrganizationModal
          isOpen={true}
          organizations={mockOrganizations}
          currentOrg={null}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId(TestIds.MODAL_OVERLAY)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.ORG_MODAL)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.ORG_MODAL_TITLE)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.ORG_MODAL_CLOSE)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.ORG_LIST)).toBeInTheDocument();
      expect(screen.getByTestId(`${TestIds.ORG_ITEM}-org-1`)).toBeInTheDocument();
      expect(screen.getByTestId(`${TestIds.ORG_ITEM}-org-2`)).toBeInTheDocument();
    });

    it('should show loading state with test-id', () => {
      render(
        <OrganizationModal
          isOpen={true}
          organizations={[]}
          currentOrg={null}
          onSelect={vi.fn()}
          onClose={vi.fn()}
          loading={true}
        />
      );

      expect(screen.getByTestId(TestIds.ORG_LOADING)).toBeInTheDocument();
    });

    it('should show error state with test-id', () => {
      render(
        <OrganizationModal
          isOpen={true}
          organizations={[]}
          currentOrg={null}
          onSelect={vi.fn()}
          onClose={vi.fn()}
          error="Failed to load organizations"
        />
      );

      expect(screen.getByTestId(TestIds.ORG_ERROR)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.RETRY_BUTTON)).toBeInTheDocument();
    });

    it('should show selected indicator with test-id', () => {
      render(
        <OrganizationModal
          isOpen={true}
          organizations={mockOrganizations}
          currentOrg={mockOrganizations[0]}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId(TestIds.SELECTED_INDICATOR)).toBeInTheDocument();
    });
  });

  describe('PatientSearch', () => {
    it('should have all required test-id attributes', () => {
      renderWithProviders(<PatientSearch />);

      expect(screen.getByTestId(TestIds.PATIENT_SEARCH)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.PATIENT_SEARCH_INPUT)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.PATIENT_SEARCH_BUTTON)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.PATIENT_CREATE_BUTTON)).toBeInTheDocument();
    });

    it('should show search results with test-ids when results are available', () => {
      mockUsePatient.mockReturnValue({
        state: {
          searchResults: [
            { id: 'patient-1', name: [{ given: ['John'], family: 'Doe' }] },
            { id: 'patient-2', name: [{ given: ['Jane'], family: 'Smith' }] }
          ],
          searchLoading: false,
          searchError: null,
          searchQuery: 'test',
          createModalOpen: false,
          createLoading: false,
          openPatients: new Map()
        },
        searchPatients: vi.fn(),
        clearSearchResults: vi.fn(),
        openCreateModal: vi.fn(),
        closeCreateModal: vi.fn(),
        openPatient: vi.fn(),
        createPatient: vi.fn()
      });

      renderWithProviders(<PatientSearch />);

      expect(screen.getByTestId(TestIds.PATIENT_RESULTS)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.RESULTS_COUNT)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.RESULTS_LIST)).toBeInTheDocument();
      expect(screen.getByTestId(`${TestIds.PATIENT_RESULT_ITEM}-patient-1`)).toBeInTheDocument();
      expect(screen.getByTestId(`${TestIds.PATIENT_RESULT_ITEM}-patient-2`)).toBeInTheDocument();
    });

    it('should show loading state with test-id', () => {
      mockUsePatient.mockReturnValue({
        state: {
          searchResults: [],
          searchLoading: true,
          searchError: null,
          searchQuery: 'test',
          createModalOpen: false,
          createLoading: false,
          openPatients: new Map()
        },
        searchPatients: vi.fn(),
        clearSearchResults: vi.fn(),
        openCreateModal: vi.fn(),
        closeCreateModal: vi.fn(),
        openPatient: vi.fn(),
        createPatient: vi.fn()
      });

      renderWithProviders(<PatientSearch />);

      expect(screen.getByTestId(TestIds.PATIENT_SEARCH_LOADING)).toBeInTheDocument();
    });

    it('should show error state with test-id', () => {
      mockUsePatient.mockReturnValue({
        state: {
          searchResults: [],
          searchLoading: false,
          searchError: 'Search failed',
          searchQuery: 'test',
          createModalOpen: false,
          createLoading: false,
          openPatients: new Map()
        },
        searchPatients: vi.fn(),
        clearSearchResults: vi.fn(),
        openCreateModal: vi.fn(),
        closeCreateModal: vi.fn(),
        openPatient: vi.fn(),
        createPatient: vi.fn()
      });

      renderWithProviders(<PatientSearch />);

      expect(screen.getByTestId(TestIds.PATIENT_SEARCH_ERROR)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.RETRY_BUTTON)).toBeInTheDocument();
    });

    it('should show no results message with test-id', () => {
      mockUsePatient.mockReturnValue({
        state: {
          searchResults: [],
          searchLoading: false,
          searchError: null,
          searchQuery: 'nonexistent',
          createModalOpen: false,
          createLoading: false,
          openPatients: new Map()
        },
        searchPatients: vi.fn(),
        clearSearchResults: vi.fn(),
        openCreateModal: vi.fn(),
        closeCreateModal: vi.fn(),
        openPatient: vi.fn(),
        createPatient: vi.fn()
      });

      renderWithProviders(<PatientSearch />);

      expect(screen.getByTestId(TestIds.PATIENT_NO_RESULTS)).toBeInTheDocument();
    });
  });

  describe('PatientCreateModal', () => {
    it('should have all required test-id attributes', () => {
      renderWithProviders(
        <PatientCreateModal
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId(TestIds.MODAL_OVERLAY)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.PATIENT_CREATE_MODAL)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.MODAL_CLOSE)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.PATIENT_FORM)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.GIVEN_NAME_INPUT)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.FAMILY_NAME_INPUT)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.GENDER_SELECT)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.BIRTH_DATE_INPUT)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.EMAIL_INPUT)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.PHONE_INPUT)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.PATIENT_FORM_CANCEL)).toBeInTheDocument();
      expect(screen.getByTestId(TestIds.PATIENT_FORM_SUBMIT)).toBeInTheDocument();
    });
  });
});
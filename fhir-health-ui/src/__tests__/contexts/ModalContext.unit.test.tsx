import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { 
  ModalProvider, 
  useModal, 
  useModalInstance,
  type ModalConfig 
} from '../../contexts/ModalContext';

// Mock page components for testing
const MockPage1: React.FC<{ data?: any }> = ({ data }) => (
  <div data-testid="page-1">
    Page 1 Content
    {data && <div data-testid="page-1-data">{JSON.stringify(data)}</div>}
  </div>
);

const MockPage2: React.FC<{ data?: any }> = ({ data }) => (
  <div data-testid="page-2">
    Page 2 Content
    {data && <div data-testid="page-2-data">{JSON.stringify(data)}</div>}
  </div>
);

// Test component that uses the modal context
const TestModalComponent: React.FC = () => {
  const { 
    openModal, 
    closeModal, 
    navigateToPage, 
    goBack, 
    getModalState, 
    activeModals 
  } = useModal();

  const handleOpenModal = () => {
    const config: ModalConfig = {
      size: 'medium',
      pages: [
        { id: 'page1', title: 'Page 1', component: MockPage1 },
        { id: 'page2', title: 'Page 2', component: MockPage2 },
      ],
      initialPage: 'page1',
    };
    openModal('test-modal', config);
  };

  const modalState = getModalState('test-modal');
  const activeModalCount = activeModals.size;

  return (
    <div>
      <div data-testid="active-modal-count">{activeModalCount}</div>
      <div data-testid="modal-state">
        {modalState ? `${modalState.id}-${modalState.currentPage}-${modalState.isOpen}` : 'no-modal'}
      </div>
      
      <button data-testid="open-modal" onClick={handleOpenModal}>
        Open Modal
      </button>
      <button data-testid="close-modal" onClick={() => closeModal('test-modal')}>
        Close Modal
      </button>
      <button data-testid="navigate-to-page2" onClick={() => navigateToPage('test-modal', 'page2')}>
        Navigate to Page 2
      </button>
      <button data-testid="go-back" onClick={() => goBack('test-modal')}>
        Go Back
      </button>
    </div>
  );
};

// Test component for useModalInstance hook
const TestModalInstanceComponent: React.FC<{ modalId: string }> = ({ modalId }) => {
  const {
    isOpen,
    currentPage,
    canGoBack,
    navigate,
    back,
    close,
  } = useModalInstance(modalId);

  return (
    <div>
      <div data-testid="instance-is-open">{isOpen.toString()}</div>
      <div data-testid="instance-current-page">{currentPage || 'no-page'}</div>
      <div data-testid="instance-can-go-back">{canGoBack.toString()}</div>
      
      <button data-testid="instance-navigate-page2" onClick={() => navigate('page2')}>
        Navigate to Page 2
      </button>
      <button data-testid="instance-go-back" onClick={back}>
        Go Back
      </button>
      <button data-testid="instance-close" onClick={close}>
        Close
      </button>
    </div>
  );
};

describe('ModalContext Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Modal Operations', () => {
    it('should open a modal with correct initial state', async () => {
      const user = userEvent.setup();

      render(
        <ModalProvider>
          <TestModalComponent />
        </ModalProvider>
      );

      expect(screen.getByTestId('active-modal-count')).toHaveTextContent('0');
      expect(screen.getByTestId('modal-state')).toHaveTextContent('no-modal');

      await user.click(screen.getByTestId('open-modal'));

      expect(screen.getByTestId('active-modal-count')).toHaveTextContent('1');
      expect(screen.getByTestId('modal-state')).toHaveTextContent('test-modal-page1-true');
    });

    it('should close a modal and clean up state', async () => {
      const user = userEvent.setup();

      render(
        <ModalProvider>
          <TestModalComponent />
        </ModalProvider>
      );

      await user.click(screen.getByTestId('open-modal'));
      expect(screen.getByTestId('active-modal-count')).toHaveTextContent('1');

      await user.click(screen.getByTestId('close-modal'));
      expect(screen.getByTestId('active-modal-count')).toHaveTextContent('0');
      expect(screen.getByTestId('modal-state')).toHaveTextContent('no-modal');
    });

    it('should navigate between pages within a modal', async () => {
      const user = userEvent.setup();

      render(
        <ModalProvider>
          <TestModalComponent />
        </ModalProvider>
      );

      await user.click(screen.getByTestId('open-modal'));
      expect(screen.getByTestId('modal-state')).toHaveTextContent('test-modal-page1-true');

      await user.click(screen.getByTestId('navigate-to-page2'));
      expect(screen.getByTestId('modal-state')).toHaveTextContent('test-modal-page2-true');
    });

    it('should navigate back to previous page', async () => {
      const user = userEvent.setup();

      render(
        <ModalProvider>
          <TestModalComponent />
        </ModalProvider>
      );

      await user.click(screen.getByTestId('open-modal'));
      await user.click(screen.getByTestId('navigate-to-page2'));
      expect(screen.getByTestId('modal-state')).toHaveTextContent('test-modal-page2-true');

      await user.click(screen.getByTestId('go-back'));
      expect(screen.getByTestId('modal-state')).toHaveTextContent('test-modal-page1-true');
    });

    it('should close modal when going back from initial page', async () => {
      const user = userEvent.setup();

      render(
        <ModalProvider>
          <TestModalComponent />
        </ModalProvider>
      );

      await user.click(screen.getByTestId('open-modal'));
      expect(screen.getByTestId('active-modal-count')).toHaveTextContent('1');

      await user.click(screen.getByTestId('go-back'));
      expect(screen.getByTestId('active-modal-count')).toHaveTextContent('0');
    });
  });

  describe('useModalInstance Hook', () => {
    it('should provide modal instance functionality', async () => {
      const user = userEvent.setup();

      const TestWithInstance: React.FC = () => {
        const { openModal } = useModal();

        const handleOpen = () => {
          const config: ModalConfig = {
            size: 'medium',
            pages: [
              { id: 'page1', title: 'Page 1', component: MockPage1 },
              { id: 'page2', title: 'Page 2', component: MockPage2 },
            ],
            initialPage: 'page1',
          };
          openModal('instance-modal', config);
        };

        return (
          <div>
            <button data-testid="open-instance-modal" onClick={handleOpen}>Open</button>
            <TestModalInstanceComponent modalId="instance-modal" />
          </div>
        );
      };

      render(
        <ModalProvider>
          <TestWithInstance />
        </ModalProvider>
      );

      // Initially no modal
      expect(screen.getByTestId('instance-is-open')).toHaveTextContent('false');
      expect(screen.getByTestId('instance-current-page')).toHaveTextContent('no-page');
      expect(screen.getByTestId('instance-can-go-back')).toHaveTextContent('false');

      await user.click(screen.getByTestId('open-instance-modal'));

      expect(screen.getByTestId('instance-is-open')).toHaveTextContent('true');
      expect(screen.getByTestId('instance-current-page')).toHaveTextContent('page1');
      expect(screen.getByTestId('instance-can-go-back')).toHaveTextContent('false');

      await user.click(screen.getByTestId('instance-navigate-page2'));

      expect(screen.getByTestId('instance-current-page')).toHaveTextContent('page2');
      expect(screen.getByTestId('instance-can-go-back')).toHaveTextContent('true');

      await user.click(screen.getByTestId('instance-go-back'));

      expect(screen.getByTestId('instance-current-page')).toHaveTextContent('page1');

      await user.click(screen.getByTestId('instance-close'));

      expect(screen.getByTestId('instance-is-open')).toHaveTextContent('false');
    });

    it('should handle non-existent modal gracefully', () => {
      render(
        <ModalProvider>
          <TestModalInstanceComponent modalId="non-existent" />
        </ModalProvider>
      );

      expect(screen.getByTestId('instance-is-open')).toHaveTextContent('false');
      expect(screen.getByTestId('instance-current-page')).toHaveTextContent('no-page');
      expect(screen.getByTestId('instance-can-go-back')).toHaveTextContent('false');
    });
  });

  describe('Error Handling', () => {
    it('should handle useModal hook outside provider', () => {
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        render(<TestModalComponent />);
      }).toThrow('useModal must be used within a ModalProvider');

      console.error = originalError;
    });

    it('should handle modal with no pages', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const TestNoPages: React.FC = () => {
        const { openModal } = useModal();

        const handleOpen = () => {
          const config: ModalConfig = {
            size: 'medium',
            pages: [],
            initialPage: 'page1',
          };
          openModal('no-pages-modal', config);
        };

        return <button data-testid="open-no-pages" onClick={handleOpen}>Open</button>;
      };

      render(
        <ModalProvider>
          <TestNoPages />
        </ModalProvider>
      );

      await user.click(screen.getByTestId('open-no-pages'));

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No pages provided'));
      consoleSpy.mockRestore();
    });

    it('should handle navigation to non-existent page', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const TestInvalidNav: React.FC = () => {
        const { openModal, navigateToPage } = useModal();

        const handleOpen = () => {
          const config: ModalConfig = {
            size: 'medium',
            pages: [{ id: 'page1', title: 'Page 1', component: MockPage1 }],
            initialPage: 'page1',
          };
          openModal('invalid-nav-modal', config);
        };

        return (
          <div>
            <button data-testid="open-invalid-nav" onClick={handleOpen}>Open</button>
            <button data-testid="navigate-invalid" onClick={() => navigateToPage('invalid-nav-modal', 'non-existent')}>
              Navigate Invalid
            </button>
          </div>
        );
      };

      render(
        <ModalProvider>
          <TestInvalidNav />
        </ModalProvider>
      );

      await user.click(screen.getByTestId('open-invalid-nav'));
      await user.click(screen.getByTestId('navigate-invalid'));

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Page "non-existent" not found'));
      consoleSpy.mockRestore();
    });
  });

  describe('Modal Configuration', () => {
    it('should handle different modal sizes', async () => {
      const user = userEvent.setup();

      const TestSizes: React.FC = () => {
        const { openModal, getModalState } = useModal();

        const openSmall = () => {
          const config: ModalConfig = {
            size: 'small',
            pages: [{ id: 'page1', title: 'Small Modal', component: MockPage1 }],
            initialPage: 'page1',
          };
          openModal('small-modal', config);
        };

        const openLarge = () => {
          const config: ModalConfig = {
            size: 'large',
            pages: [{ id: 'page1', title: 'Large Modal', component: MockPage1 }],
            initialPage: 'page1',
          };
          openModal('large-modal', config);
        };

        const smallModal = getModalState('small-modal');
        const largeModal = getModalState('large-modal');

        return (
          <div>
            <button data-testid="open-small" onClick={openSmall}>Small</button>
            <button data-testid="open-large" onClick={openLarge}>Large</button>
            <div data-testid="small-modal-size">{smallModal?.config.size || 'none'}</div>
            <div data-testid="large-modal-size">{largeModal?.config.size || 'none'}</div>
          </div>
        );
      };

      render(
        <ModalProvider>
          <TestSizes />
        </ModalProvider>
      );

      await user.click(screen.getByTestId('open-small'));
      expect(screen.getByTestId('small-modal-size')).toHaveTextContent('small');

      await user.click(screen.getByTestId('open-large'));
      expect(screen.getByTestId('large-modal-size')).toHaveTextContent('large');
    });

    it('should call onClose callback when modal is closed', async () => {
      const onCloseMock = vi.fn();
      const user = userEvent.setup();

      const TestComponentWithCallback: React.FC = () => {
        const { openModal, closeModal } = useModal();

        const handleOpen = () => {
          const config: ModalConfig = {
            size: 'medium',
            pages: [{ id: 'page1', title: 'Page 1', component: MockPage1 }],
            initialPage: 'page1',
            onClose: onCloseMock,
          };
          openModal('callback-modal', config);
        };

        return (
          <div>
            <button data-testid="open-with-callback" onClick={handleOpen}>Open</button>
            <button data-testid="close-with-callback" onClick={() => closeModal('callback-modal')}>Close</button>
          </div>
        );
      };

      render(
        <ModalProvider>
          <TestComponentWithCallback />
        </ModalProvider>
      );

      await user.click(screen.getByTestId('open-with-callback'));
      await user.click(screen.getByTestId('close-with-callback'));

      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });
});
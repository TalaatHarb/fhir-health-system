import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModalProvider, useModal, ModalConfig } from '../../contexts/ModalContext';
import { Modal, ModalManager } from '../../components/common/Modal';

// Test component that uses modal context
function TestModalComponent() {
  const { openModal, closeModal, navigateToPage, goBack, activeModals } = useModal();

  const testConfig: ModalConfig = {
    size: 'medium',
    pages: [
      {
        id: 'page1',
        title: 'Page 1',
        component: ({ modalId, pageId, pageData }) => (
          <div data-testid="page1">
            <p>Page 1 Content</p>
            <button onClick={() => navigateToPage(modalId, 'page2')}>Go to Page 2</button>
          </div>
        ),
      },
      {
        id: 'page2',
        title: 'Page 2',
        component: ({ modalId, pageId, pageData }) => (
          <div data-testid="page2">
            <p>Page 2 Content</p>
            <button onClick={() => goBack(modalId)}>Go Back</button>
          </div>
        ),
      },
    ],
    initialPage: 'page1',
  };

  return (
    <div>
      <button onClick={() => openModal('test-modal', testConfig)}>
        Open Modal
      </button>
      <button onClick={() => closeModal('test-modal')}>
        Close Modal
      </button>
      <div data-testid="active-modals-count">
        {activeModals.size}
      </div>
      <ModalManager />
    </div>
  );
}

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <ModalProvider>{children}</ModalProvider>;
}

describe('ModalContext', () => {
  beforeEach(() => {
    // Clear any existing modals
    document.body.innerHTML = '';
  });

  it('should provide modal context', () => {
    render(
      <TestWrapper>
        <TestModalComponent />
      </TestWrapper>
    );

    expect(screen.getByText('Open Modal')).toBeInTheDocument();
    expect(screen.getByTestId('active-modals-count')).toHaveTextContent('0');
  });

  it('should open and close modals', async () => {
    render(
      <TestWrapper>
        <TestModalComponent />
      </TestWrapper>
    );

    // Initially no modals
    expect(screen.getByTestId('active-modals-count')).toHaveTextContent('0');

    // Open modal
    fireEvent.click(screen.getByText('Open Modal'));

    await waitFor(() => {
      expect(screen.getByTestId('active-modals-count')).toHaveTextContent('1');
      expect(screen.getByText('Page 1')).toBeInTheDocument();
      expect(screen.getByTestId('page1')).toBeInTheDocument();
    });

    // Close modal
    fireEvent.click(screen.getByText('Close Modal'));

    await waitFor(() => {
      expect(screen.getByTestId('active-modals-count')).toHaveTextContent('0');
      expect(screen.queryByText('Page 1')).not.toBeInTheDocument();
    });
  });

  it('should navigate between pages', async () => {
    render(
      <TestWrapper>
        <TestModalComponent />
      </TestWrapper>
    );

    // Open modal
    fireEvent.click(screen.getByText('Open Modal'));

    await waitFor(() => {
      expect(screen.getByTestId('page1')).toBeInTheDocument();
    });

    // Navigate to page 2
    fireEvent.click(screen.getByText('Go to Page 2'));

    await waitFor(() => {
      expect(screen.getByText('Page 2')).toBeInTheDocument();
      expect(screen.getByTestId('page2')).toBeInTheDocument();
      expect(screen.queryByTestId('page1')).not.toBeInTheDocument();
    });

    // Go back to page 1
    fireEvent.click(screen.getByText('Go Back'));

    await waitFor(() => {
      expect(screen.getByTestId('page1')).toBeInTheDocument();
      expect(screen.queryByTestId('page2')).not.toBeInTheDocument();
    });
  });

  it('should handle modal close via overlay click', async () => {
    render(
      <TestWrapper>
        <TestModalComponent />
      </TestWrapper>
    );

    // Open modal
    fireEvent.click(screen.getByText('Open Modal'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Click overlay to close
    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(screen.getByTestId('active-modals-count')).toHaveTextContent('0');
    });
  });

  it('should handle modal close via escape key', async () => {
    render(
      <TestWrapper>
        <TestModalComponent />
      </TestWrapper>
    );

    // Open modal
    fireEvent.click(screen.getByText('Open Modal'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Press escape to close
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.getByTestId('active-modals-count')).toHaveTextContent('0');
    });
  });

  it('should handle modal close via close button', async () => {
    render(
      <TestWrapper>
        <TestModalComponent />
      </TestWrapper>
    );

    // Open modal
    fireEvent.click(screen.getByText('Open Modal'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Click close button
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.getByTestId('active-modals-count')).toHaveTextContent('0');
    });
  });

  it('should prevent body scroll when modal is open', async () => {
    render(
      <TestWrapper>
        <TestModalComponent />
      </TestWrapper>
    );

    // Initially body should not have overflow hidden
    expect(document.body.style.overflow).toBe('');

    // Open modal
    fireEvent.click(screen.getByText('Open Modal'));

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });

    // Close modal
    fireEvent.click(screen.getByText('Close Modal'));

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('');
    });
  });

  it('should handle multiple modals', async () => {
    function MultiModalComponent() {
      const { openModal, activeModals } = useModal();

      const config1: ModalConfig = {
        size: 'small',
        pages: [{ id: 'modal1-page1', title: 'Modal 1', component: () => <div>Modal 1 Content</div> }],
        initialPage: 'modal1-page1',
      };

      const config2: ModalConfig = {
        size: 'large',
        pages: [{ id: 'modal2-page1', title: 'Modal 2', component: () => <div>Modal 2 Content</div> }],
        initialPage: 'modal2-page1',
      };

      return (
        <div>
          <button onClick={() => openModal('modal1', config1)}>Open Modal 1</button>
          <button onClick={() => openModal('modal2', config2)}>Open Modal 2</button>
          <div data-testid="modal-count">{activeModals.size}</div>
          <ModalManager />
        </div>
      );
    }

    render(
      <TestWrapper>
        <MultiModalComponent />
      </TestWrapper>
    );

    // Open first modal
    fireEvent.click(screen.getByText('Open Modal 1'));
    await waitFor(() => {
      expect(screen.getByTestId('modal-count')).toHaveTextContent('1');
      expect(screen.getByText('Modal 1')).toBeInTheDocument();
    });

    // Open second modal
    fireEvent.click(screen.getByText('Open Modal 2'));
    await waitFor(() => {
      expect(screen.getByTestId('modal-count')).toHaveTextContent('2');
      expect(screen.getByText('Modal 2')).toBeInTheDocument();
    });
  });

  it('should handle invalid page navigation gracefully', async () => {
    function InvalidNavigationComponent() {
      const { openModal, navigateToPage } = useModal();

      const config: ModalConfig = {
        size: 'medium',
        pages: [{ id: 'valid-page', title: 'Valid Page', component: () => <div>Valid Content</div> }],
        initialPage: 'valid-page',
      };

      return (
        <div>
          <button onClick={() => openModal('test-modal', config)}>Open Modal</button>
          <button onClick={() => navigateToPage('test-modal', 'invalid-page')}>
            Navigate to Invalid Page
          </button>
          <ModalManager />
        </div>
      );
    }

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestWrapper>
        <InvalidNavigationComponent />
      </TestWrapper>
    );

    // Open modal
    fireEvent.click(screen.getByText('Open Modal'));
    await waitFor(() => {
      expect(screen.getByText('Valid Page')).toBeInTheDocument();
    });

    // Try to navigate to invalid page
    fireEvent.click(screen.getByText('Navigate to Invalid Page'));

    // Should log error and stay on current page
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Page "invalid-page" not found')
    );
    expect(screen.getByText('Valid Page')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should call onClose callback when modal is closed', async () => {
    const onCloseMock = vi.fn();

    function CallbackTestComponent() {
      const { openModal } = useModal();

      const config: ModalConfig = {
        size: 'medium',
        pages: [{ id: 'test-page', title: 'Test Page', component: () => <div>Test Content</div> }],
        initialPage: 'test-page',
        onClose: onCloseMock,
      };

      return (
        <div>
          <button onClick={() => openModal('callback-modal', config)}>Open Modal</button>
          <ModalManager />
        </div>
      );
    }

    render(
      <TestWrapper>
        <CallbackTestComponent />
      </TestWrapper>
    );

    // Open modal
    fireEvent.click(screen.getByText('Open Modal'));
    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });

    // Close modal via escape
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useModal hook', () => {
  it('should throw error when used outside ModalProvider', () => {
    function TestComponent() {
      useModal();
      return <div>Test</div>;
    }

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useModal must be used within a ModalProvider'
    );

    consoleSpy.mockRestore();
  });
});
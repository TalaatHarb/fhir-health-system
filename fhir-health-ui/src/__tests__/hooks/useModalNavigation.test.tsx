import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModalProvider } from '../../contexts/ModalContext';
import { useModalNavigation, useModalConfig, useModalPage } from '../../hooks/useModalNavigation';
import { ModalManager } from '../../components/common/Modal';

// Test component using useModalNavigation
function NavigationTestComponent() {
  const { openModal } = useModalNavigation('test-modal');
  const { createSinglePageModal, createMultiPageModal, createWizardModal } = useModalConfig();

  const handleOpenSingle = () => {
    const config = createSinglePageModal(
      'single-page',
      'Single Page Modal',
      () => <div data-testid="single-page">Single Page Content</div>,
      'medium'
    );
    openModal('single-modal', config);
  };

  const handleOpenMulti = () => {
    const config = createMultiPageModal(
      [
        {
          id: 'page1',
          title: 'Page 1',
          component: ({ modalId }) => {
            const { navigate } = useModalNavigation(modalId);
            return (
              <div data-testid="multi-page1">
                <p>Multi Page 1</p>
                <button onClick={() => navigate('page2')}>Next</button>
              </div>
            );
          },
        },
        {
          id: 'page2',
          title: 'Page 2',
          component: ({ modalId }) => {
            const { back } = useModalNavigation(modalId);
            return (
              <div data-testid="multi-page2">
                <p>Multi Page 2</p>
                <button onClick={back}>Back</button>
              </div>
            );
          },
        },
      ],
      'page1',
      'large'
    );
    openModal('multi-modal', config);
  };

  const handleOpenWizard = () => {
    const config = createWizardModal(
      [
        {
          id: 'step1',
          title: 'Step 1',
          component: ({ modalId }) => {
            const { navigate } = useModalNavigation(modalId);
            return (
              <div data-testid="wizard-step1">
                <p>Wizard Step 1</p>
                <button onClick={() => navigate('step2')}>Next Step</button>
              </div>
            );
          },
        },
        {
          id: 'step2',
          title: 'Step 2',
          component: ({ modalId }) => {
            const { back, close } = useModalNavigation(modalId);
            return (
              <div data-testid="wizard-step2">
                <p>Wizard Step 2</p>
                <button onClick={back}>Previous</button>
                <button onClick={close}>Finish</button>
              </div>
            );
          },
        },
      ],
      'small'
    );
    openModal('wizard-modal', config);
  };

  return (
    <div>
      <button onClick={handleOpenSingle}>Open Single Page Modal</button>
      <button onClick={handleOpenMulti}>Open Multi Page Modal</button>
      <button onClick={handleOpenWizard}>Open Wizard Modal</button>
      <ModalManager />
    </div>
  );
}

// Test component using useModalPage
function ModalPageTestComponent({ modalId, pageId }: { modalId: string; pageId: string }) {
  const {
    isCurrentPage,
    pageData,
    updatePageData,
    navigate,
    close,
    canGoBack,
  } = useModalPage(modalId, pageId);

  const handleUpdateData = () => {
    updatePageData({ testData: 'updated' });
  };

  return (
    <div data-testid={`page-${pageId}`}>
      <p>Page ID: {pageId}</p>
      <p>Is Current: {isCurrentPage ? 'Yes' : 'No'}</p>
      <p>Can Go Back: {canGoBack ? 'Yes' : 'No'}</p>
      <p>Page Data: {JSON.stringify(pageData)}</p>
      <button onClick={handleUpdateData}>Update Data</button>
      <button onClick={() => navigate('other-page')}>Navigate</button>
      <button onClick={close}>Close</button>
    </div>
  );
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <ModalProvider>{children}</ModalProvider>;
}

describe('useModalNavigation', () => {
  it('should create and open single page modal', async () => {
    render(
      <TestWrapper>
        <NavigationTestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Open Single Page Modal'));

    await waitFor(() => {
      expect(screen.getByText('Single Page Modal')).toBeInTheDocument();
      expect(screen.getByTestId('single-page')).toBeInTheDocument();
    });
  });

  it('should create and navigate multi page modal', async () => {
    render(
      <TestWrapper>
        <NavigationTestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Open Multi Page Modal'));

    await waitFor(() => {
      expect(screen.getByText('Page 1')).toBeInTheDocument();
      expect(screen.getByTestId('multi-page1')).toBeInTheDocument();
    });

    // Navigate to page 2
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Page 2')).toBeInTheDocument();
      expect(screen.getByTestId('multi-page2')).toBeInTheDocument();
    });

    // Go back to page 1
    fireEvent.click(screen.getByText('Back'));

    await waitFor(() => {
      expect(screen.getByText('Page 1')).toBeInTheDocument();
      expect(screen.getByTestId('multi-page1')).toBeInTheDocument();
    });
  });

  it('should create wizard modal with proper navigation', async () => {
    render(
      <TestWrapper>
        <NavigationTestComponent />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Open Wizard Modal'));

    await waitFor(() => {
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-step1')).toBeInTheDocument();
    });

    // Navigate to step 2
    fireEvent.click(screen.getByText('Next Step'));

    await waitFor(() => {
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-step2')).toBeInTheDocument();
    });

    // Go back to step 1
    fireEvent.click(screen.getByText('Previous'));

    await waitFor(() => {
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-step1')).toBeInTheDocument();
    });
  });
});

describe('useModalPage', () => {
  it('should provide page-specific functionality', async () => {
    function PageTestWrapper() {
      const { openModal } = useModalNavigation('test-modal');
      const { createMultiPageModal } = useModalConfig();

      const handleOpen = () => {
        const config = createMultiPageModal(
          [
            {
              id: 'test-page',
              title: 'Test Page',
              component: (props) => <ModalPageTestComponent {...props} />,
            },
            {
              id: 'other-page',
              title: 'Other Page',
              component: () => <div data-testid="other-page">Other Page</div>,
            },
          ],
          'test-page'
        );
        openModal('page-test-modal', config);
      };

      return (
        <div>
          <button onClick={handleOpen}>Open Modal</button>
          <ModalManager />
        </div>
      );
    }

    render(
      <TestWrapper>
        <PageTestWrapper />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Open Modal'));

    await waitFor(() => {
      expect(screen.getByTestId('page-test-page')).toBeInTheDocument();
      expect(screen.getByText('Is Current: Yes')).toBeInTheDocument();
      expect(screen.getByText('Can Go Back: No')).toBeInTheDocument();
    });

    // Update page data
    fireEvent.click(screen.getByText('Update Data'));

    await waitFor(() => {
      expect(screen.getByText('Page Data: {"testData":"updated"}')).toBeInTheDocument();
    });

    // Navigate to other page
    fireEvent.click(screen.getByText('Navigate'));

    await waitFor(() => {
      expect(screen.getByTestId('other-page')).toBeInTheDocument();
    });
  });
});

describe('useModalConfig', () => {
  it('should create proper single page modal config', () => {
    function ConfigTestComponent() {
      const { createSinglePageModal } = useModalConfig();
      
      const config = createSinglePageModal(
        'test-page',
        'Test Title',
        () => <div>Test Component</div>,
        'large',
        {
          onClose: () => console.log('closed'),
          closeOnOverlayClick: false,
          props: { testProp: 'value' },
        }
      );

      return (
        <div data-testid="config-test">
          <pre>{JSON.stringify(config, null, 2)}</pre>
        </div>
      );
    }

    render(<ConfigTestComponent />);
    
    const configElement = screen.getByTestId('config-test');
    const configText = configElement.textContent;
    
    expect(configText).toContain('"size": "large"');
    expect(configText).toContain('"id": "test-page"');
    expect(configText).toContain('"title": "Test Title"');
    expect(configText).toContain('"initialPage": "test-page"');
    expect(configText).toContain('"closeOnOverlayClick": false');
  });

  it('should create proper multi page modal config', () => {
    function MultiConfigTestComponent() {
      const { createMultiPageModal } = useModalConfig();
      
      const config = createMultiPageModal(
        [
          { id: 'page1', title: 'Page 1', component: () => <div>Page 1</div> },
          { id: 'page2', title: 'Page 2', component: () => <div>Page 2</div>, canGoBack: false },
        ],
        'page1',
        'medium'
      );

      return (
        <div data-testid="multi-config-test">
          <pre>{JSON.stringify(config, null, 2)}</pre>
        </div>
      );
    }

    render(<MultiConfigTestComponent />);
    
    const configElement = screen.getByTestId('multi-config-test');
    const configText = configElement.textContent;
    
    expect(configText).toContain('"size": "medium"');
    expect(configText).toContain('"initialPage": "page1"');
    expect(configText).toContain('"canGoBack": false');
  });

  it('should create proper wizard modal config', () => {
    function WizardConfigTestComponent() {
      const { createWizardModal } = useModalConfig();
      
      const config = createWizardModal(
        [
          { id: 'step1', title: 'Step 1', component: () => <div>Step 1</div> },
          { id: 'step2', title: 'Step 2', component: () => <div>Step 2</div> },
          { id: 'step3', title: 'Step 3', component: () => <div>Step 3</div> },
        ],
        'fullscreen',
        {
          closeOnOverlayClick: false,
          closeOnEscape: false,
        }
      );

      return (
        <div data-testid="wizard-config-test">
          <pre>{JSON.stringify(config, null, 2)}</pre>
        </div>
      );
    }

    render(<WizardConfigTestComponent />);
    
    const configElement = screen.getByTestId('wizard-config-test');
    const configText = configElement.textContent;
    
    expect(configText).toContain('"size": "fullscreen"');
    expect(configText).toContain('"closeOnOverlayClick": false');
    expect(configText).toContain('"closeOnEscape": false');
    expect(configText).toContain('"initialPage": "step1"');
    
    // First step should not have canGoBack, others should
    const config = JSON.parse(configText || '{}');
    expect(config.pages[0].canGoBack).toBe(false);
    expect(config.pages[1].canGoBack).toBe(true);
    expect(config.pages[2].canGoBack).toBe(true);
  });
});
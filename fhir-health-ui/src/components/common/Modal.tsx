import React, { useEffect, useCallback, ReactNode, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModal, ModalState } from '../../contexts/ModalContext';
import './Modal.css';

export interface ModalProps {
  modalId: string;
  className?: string;
}

export function Modal({ modalId, className }: ModalProps) {
  const { getModalState, closeModal, goBack } = useModal();
  const modalState = getModalState(modalId);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key and other keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!modalState?.isOpen) return;

    if (event.key === 'Escape' && modalState?.config.closeOnEscape !== false) {
      event.preventDefault();
      closeModal(modalId);
    } else if (event.key === 'Tab') {
      // Trap focus within modal
      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }
  }, [modalId, closeModal, modalState?.config.closeOnEscape, modalState?.isOpen]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && modalState?.config.closeOnOverlayClick !== false) {
      closeModal(modalId);
    }
  }, [modalId, closeModal, modalState?.config.closeOnOverlayClick]);

  // Handle back button click
  const handleBackClick = useCallback(() => {
    goBack(modalId);
  }, [modalId, goBack]);

  // Handle close button click
  const handleCloseClick = useCallback(() => {
    closeModal(modalId);
  }, [modalId, closeModal]);

  // Set up keyboard event listener and focus management
  useEffect(() => {
    if (modalState?.isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Focus the modal container after a brief delay to ensure it's rendered
      setTimeout(() => {
        const modal = modalRef.current;
        if (modal) {
          // Try to focus the first focusable element, fallback to modal container
          const firstFocusable = modal.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            modal.focus();
          }
        }
      }, 100);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        // Restore body scroll when modal closes
        document.body.style.overflow = '';
        
        // Restore focus to the previously focused element
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [modalState?.isOpen, handleKeyDown]);

  if (!modalState?.isOpen) {
    return null;
  }

  const currentPageConfig = modalState.config.pages.find(
    page => page.id === modalState.currentPage
  );

  if (!currentPageConfig) {
    console.error(`Modal ${modalId}: Current page "${modalState.currentPage}" not found`);
    return null;
  }

  const PageComponent = currentPageConfig.component;
  const canGoBack = modalState.pageHistory.length > 1 && currentPageConfig.canGoBack !== false;

  const modalContent = (
    <div 
      className={`modal-overlay modal-overlay--${modalState.config.size} ${className || ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`modal-title-${modalId}`}
      aria-describedby={`modal-description-${modalId}`}
    >
      <div 
        ref={modalRef}
        className={`modal-container modal-container--${modalState.config.size}`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            {canGoBack && (
              <button
                type="button"
                className="modal-back-button"
                onClick={handleBackClick}
                aria-label="Go back to previous page"
                title="Go back to previous page"
              >
                <span aria-hidden="true">←</span>
                <span className="sr-only">Back</span>
              </button>
            )}
            <h2 id={`modal-title-${modalId}`} className="modal-title">
              {currentPageConfig.title}
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-button"
            onClick={handleCloseClick}
            aria-label="Close modal"
            title="Close modal"
          >
            <span aria-hidden="true">×</span>
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          {/* Hidden description for screen readers */}
          <div id={`modal-description-${modalId}`} className="sr-only">
            Modal dialog containing {currentPageConfig.title}. Use Tab to navigate, Escape to close.
          </div>
          
          <PageComponent
            modalId={modalId}
            pageId={modalState.currentPage}
            pageData={modalState.pageData[modalState.currentPage] || {}}
            {...(currentPageConfig.props || {})}
          />
        </div>
      </div>
    </div>
  );

  // Render modal in a portal to ensure it's rendered at the top level
  return createPortal(modalContent, document.body);
}

// Modal Manager component that renders all active modals
export function ModalManager() {
  const { activeModals } = useModal();

  return (
    <>
      {Array.from(activeModals.keys()).map(modalId => (
        <Modal key={modalId} modalId={modalId} />
      ))}
    </>
  );
}

// Higher-order component for modal pages
export interface ModalPageProps {
  modalId: string;
  pageId: string;
  pageData: any;
}

export function withModalPage<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P & ModalPageProps> {
  return function ModalPageWrapper(props: P & ModalPageProps) {
    const { modalId, pageId, pageData, ...componentProps } = props;
    
    return (
      <Component 
        {...(componentProps as P)}
        modalId={modalId}
        pageId={pageId}
        pageData={pageData}
      />
    );
  };
}

// Utility component for modal navigation
export interface ModalNavigationProps {
  modalId: string;
  children: ReactNode;
}

export function ModalNavigation({ modalId, children }: ModalNavigationProps) {
  const { getModalState, navigateToPage, goBack } = useModal();
  const modalState = getModalState(modalId);

  const navigate = useCallback((pageId: string, data?: any) => {
    navigateToPage(modalId, pageId, data);
  }, [modalId, navigateToPage]);

  const back = useCallback(() => {
    goBack(modalId);
  }, [modalId, goBack]);

  if (!modalState) {
    return null;
  }

  return (
    <div className="modal-navigation">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            navigate,
            back,
            canGoBack: modalState.pageHistory.length > 1,
            currentPage: modalState.currentPage,
            pageData: modalState.pageData,
          } as any);
        }
        return child;
      })}
    </div>
  );
}
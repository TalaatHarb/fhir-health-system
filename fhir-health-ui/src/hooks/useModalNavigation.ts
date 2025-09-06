import { useCallback } from 'react';
import { useModal } from '../contexts/ModalContext';

/**
 * Hook for modal navigation utilities
 * Provides convenient methods for common modal navigation patterns
 */
export function useModalNavigation(modalId: string) {
  const { openModal, navigateToPage, goBack, closeModal, getModalState, updatePageData } = useModal();
  
  const modalState = getModalState(modalId);
  
  // Navigate to a specific page with optional data
  const navigate = useCallback((pageId: string, data?: any) => {
    navigateToPage(modalId, pageId, data);
  }, [modalId, navigateToPage]);
  
  // Go back to the previous page
  const back = useCallback(() => {
    goBack(modalId);
  }, [modalId, goBack]);
  
  // Close the modal
  const close = useCallback(() => {
    closeModal(modalId);
  }, [modalId, closeModal]);
  
  // Update data for the current page
  const updateCurrentPageData = useCallback((data: any) => {
    if (modalState?.currentPage) {
      updatePageData(modalId, modalState.currentPage, data);
    }
  }, [modalId, modalState?.currentPage, updatePageData]);
  
  // Update data for a specific page
  const updateData = useCallback((pageId: string, data: any) => {
    updatePageData(modalId, pageId, data);
  }, [modalId, updatePageData]);
  
  // Get data for the current page
  const getCurrentPageData = useCallback(() => {
    if (!modalState?.currentPage) return {};
    return modalState.pageData[modalState.currentPage] || {};
  }, [modalState?.currentPage, modalState?.pageData]);
  
  // Get data for a specific page
  const getPageData = useCallback((pageId: string) => {
    return modalState?.pageData[pageId] || {};
  }, [modalState?.pageData]);
  
  // Check if we can go back
  const canGoBack = modalState ? modalState.pageHistory.length > 1 : false;
  
  // Get current page info
  const currentPage = modalState?.currentPage;
  const currentPageConfig = modalState?.config.pages.find(page => page.id === currentPage);
  
  // Get page history
  const pageHistory = modalState?.pageHistory || [];
  
  return {
    // Modal management
    openModal,
    
    // Navigation methods
    navigate,
    back,
    close,
    
    // Data methods
    updateCurrentPageData,
    updateData,
    getCurrentPageData,
    getPageData,
    
    // State information
    isOpen: modalState?.isOpen ?? false,
    currentPage,
    currentPageConfig,
    canGoBack,
    pageHistory,
    
    // Raw modal state (for advanced usage)
    modalState,
  };
}

/**
 * Hook for creating modal configurations
 * Provides utilities for building modal configs with common patterns
 */
export function useModalConfig() {
  // Create a simple single-page modal config
  const createSinglePageModal = useCallback((
    pageId: string,
    title: string,
    component: React.ComponentType<any>,
    size: 'small' | 'medium' | 'large' | 'fullscreen' = 'medium',
    options?: {
      onClose?: () => void;
      closeOnOverlayClick?: boolean;
      closeOnEscape?: boolean;
      props?: Record<string, any>;
    }
  ) => {
    return {
      size,
      pages: [{
        id: pageId,
        title,
        component,
        props: options?.props,
      }],
      initialPage: pageId,
      onClose: options?.onClose,
      closeOnOverlayClick: options?.closeOnOverlayClick,
      closeOnEscape: options?.closeOnEscape,
    };
  }, []);
  
  // Create a multi-page modal config
  const createMultiPageModal = useCallback((
    pages: Array<{
      id: string;
      title: string;
      component: React.ComponentType<any>;
      canGoBack?: boolean;
      props?: Record<string, any>;
    }>,
    initialPageId: string,
    size: 'small' | 'medium' | 'large' | 'fullscreen' = 'medium',
    options?: {
      onClose?: () => void;
      closeOnOverlayClick?: boolean;
      closeOnEscape?: boolean;
    }
  ) => {
    return {
      size,
      pages,
      initialPage: initialPageId,
      onClose: options?.onClose,
      closeOnOverlayClick: options?.closeOnOverlayClick,
      closeOnEscape: options?.closeOnEscape,
    };
  }, []);
  
  // Create a wizard-style modal config (pages with forward/back navigation)
  const createWizardModal = useCallback((
    steps: Array<{
      id: string;
      title: string;
      component: React.ComponentType<any>;
      props?: Record<string, any>;
    }>,
    size: 'small' | 'medium' | 'large' | 'fullscreen' = 'large',
    options?: {
      onClose?: () => void;
      closeOnOverlayClick?: boolean;
      closeOnEscape?: boolean;
    }
  ) => {
    const pages = steps.map((step, index) => ({
      ...step,
      canGoBack: index > 0, // First step can't go back
    }));
    
    return {
      size,
      pages,
      initialPage: steps[0]?.id || '',
      onClose: options?.onClose,
      closeOnOverlayClick: options?.closeOnOverlayClick ?? false, // Wizards typically don't close on overlay click
      closeOnEscape: options?.closeOnEscape ?? false, // Wizards typically don't close on escape
    };
  }, []);
  
  return {
    createSinglePageModal,
    createMultiPageModal,
    createWizardModal,
  };
}

/**
 * Hook for modal page components
 * Provides utilities for components that are used as modal pages
 */
export function useModalPage(modalId: string, pageId: string) {
  const navigation = useModalNavigation(modalId);
  
  // Check if this is the current page
  const isCurrentPage = navigation.currentPage === pageId;
  
  // Get data for this specific page
  const pageData = navigation.getPageData(pageId);
  
  // Update data for this page
  const updatePageData = useCallback((data: any) => {
    navigation.updateData(pageId, data);
  }, [navigation, pageId]);
  
  return {
    ...navigation,
    isCurrentPage,
    pageData,
    updatePageData,
  };
}
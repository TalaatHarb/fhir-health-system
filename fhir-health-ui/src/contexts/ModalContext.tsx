import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// Modal configuration interfaces
export interface ModalPage {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  canGoBack?: boolean;
  props?: Record<string, any>;
}

export interface ModalConfig {
  size: 'small' | 'medium' | 'large' | 'fullscreen';
  pages: ModalPage[];
  initialPage: string;
  onClose?: () => void;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export interface ModalState {
  id: string;
  isOpen: boolean;
  currentPage: string;
  pageHistory: string[];
  pageData: Record<string, any>;
  config: ModalConfig;
}

// Context interface
export interface ModalContextType {
  openModal: (modalId: string, config: ModalConfig) => void;
  closeModal: (modalId: string) => void;
  navigateToPage: (modalId: string, pageId: string, data?: any) => void;
  goBack: (modalId: string) => void;
  updatePageData: (modalId: string, pageId: string, data: any) => void;
  getModalState: (modalId: string) => ModalState | undefined;
  activeModals: Map<string, ModalState>;
}

// Action types
type ModalAction =
  | { type: 'OPEN_MODAL'; payload: { modalId: string; config: ModalConfig } }
  | { type: 'CLOSE_MODAL'; payload: { modalId: string } }
  | { type: 'NAVIGATE_TO_PAGE'; payload: { modalId: string; pageId: string; data?: any } }
  | { type: 'GO_BACK'; payload: { modalId: string } }
  | { type: 'UPDATE_PAGE_DATA'; payload: { modalId: string; pageId: string; data: any } };

// Initial state
interface ModalReducerState {
  modals: Map<string, ModalState>;
}

const initialState: ModalReducerState = {
  modals: new Map(),
};

// Reducer
function modalReducer(state: ModalReducerState, action: ModalAction): ModalReducerState {
  const newModals = new Map(state.modals);

  switch (action.type) {
    case 'OPEN_MODAL': {
      const { modalId, config } = action.payload;
      
      // Validate config
      if (!config.pages.length) {
        console.error(`Modal ${modalId}: No pages provided in config`);
        return state;
      }

      const initialPage = config.pages.find(page => page.id === config.initialPage);
      if (!initialPage) {
        console.error(`Modal ${modalId}: Initial page "${config.initialPage}" not found in pages`);
        return state;
      }

      const modalState: ModalState = {
        id: modalId,
        isOpen: true,
        currentPage: config.initialPage,
        pageHistory: [config.initialPage],
        pageData: {},
        config,
      };

      newModals.set(modalId, modalState);
      return { modals: newModals };
    }

    case 'CLOSE_MODAL': {
      const { modalId } = action.payload;
      const modal = newModals.get(modalId);
      
      if (modal) {
        // Call onClose callback if provided
        if (modal.config.onClose) {
          modal.config.onClose();
        }
        newModals.delete(modalId);
      }
      
      return { modals: newModals };
    }

    case 'NAVIGATE_TO_PAGE': {
      const { modalId, pageId, data } = action.payload;
      const modal = newModals.get(modalId);
      
      if (!modal) {
        console.error(`Modal ${modalId}: Modal not found`);
        return state;
      }

      const targetPage = modal.config.pages.find(page => page.id === pageId);
      if (!targetPage) {
        console.error(`Modal ${modalId}: Page "${pageId}" not found`);
        return state;
      }

      const updatedModal: ModalState = {
        ...modal,
        currentPage: pageId,
        pageHistory: [...modal.pageHistory, pageId],
        pageData: data ? { ...modal.pageData, [pageId]: data } : modal.pageData,
      };

      newModals.set(modalId, updatedModal);
      return { modals: newModals };
    }

    case 'GO_BACK': {
      const { modalId } = action.payload;
      const modal = newModals.get(modalId);
      
      if (!modal) {
        console.error(`Modal ${modalId}: Modal not found`);
        return state;
      }

      if (modal.pageHistory.length <= 1) {
        // Can't go back further, close modal instead
        newModals.delete(modalId);
        if (modal.config.onClose) {
          modal.config.onClose();
        }
        return { modals: newModals };
      }

      const newHistory = [...modal.pageHistory];
      newHistory.pop(); // Remove current page
      const previousPage = newHistory[newHistory.length - 1];

      const updatedModal: ModalState = {
        ...modal,
        currentPage: previousPage,
        pageHistory: newHistory,
      };

      newModals.set(modalId, updatedModal);
      return { modals: newModals };
    }

    case 'UPDATE_PAGE_DATA': {
      const { modalId, pageId, data } = action.payload;
      const modal = newModals.get(modalId);
      
      if (!modal) {
        console.error(`Modal ${modalId}: Modal not found`);
        return state;
      }

      const updatedModal: ModalState = {
        ...modal,
        pageData: {
          ...modal.pageData,
          [pageId]: { ...modal.pageData[pageId], ...data },
        },
      };

      newModals.set(modalId, updatedModal);
      return { modals: newModals };
    }

    default:
      return state;
  }
}

// Create context
const ModalContext = createContext<ModalContextType | undefined>(undefined);

// Provider component
export interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  const openModal = useCallback((modalId: string, config: ModalConfig) => {
    dispatch({ type: 'OPEN_MODAL', payload: { modalId, config } });
  }, []);

  const closeModal = useCallback((modalId: string) => {
    dispatch({ type: 'CLOSE_MODAL', payload: { modalId } });
  }, []);

  const navigateToPage = useCallback((modalId: string, pageId: string, data?: any) => {
    dispatch({ type: 'NAVIGATE_TO_PAGE', payload: { modalId, pageId, data } });
  }, []);

  const goBack = useCallback((modalId: string) => {
    dispatch({ type: 'GO_BACK', payload: { modalId } });
  }, []);

  const updatePageData = useCallback((modalId: string, pageId: string, data: any) => {
    dispatch({ type: 'UPDATE_PAGE_DATA', payload: { modalId, pageId, data } });
  }, []);

  const getModalState = useCallback((modalId: string): ModalState | undefined => {
    return state.modals.get(modalId);
  }, [state.modals]);

  const contextValue: ModalContextType = {
    openModal,
    closeModal,
    navigateToPage,
    goBack,
    updatePageData,
    getModalState,
    activeModals: state.modals,
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
}

// Hook to use modal context
export function useModal(): ModalContextType {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// Hook to use a specific modal
export function useModalInstance(modalId: string) {
  const { getModalState, navigateToPage, goBack, updatePageData, closeModal } = useModal();
  
  const modalState = getModalState(modalId);
  
  const navigate = useCallback((pageId: string, data?: any) => {
    navigateToPage(modalId, pageId, data);
  }, [modalId, navigateToPage]);
  
  const back = useCallback(() => {
    goBack(modalId);
  }, [modalId, goBack]);
  
  const updateData = useCallback((pageId: string, data: any) => {
    updatePageData(modalId, pageId, data);
  }, [modalId, updatePageData]);
  
  const close = useCallback(() => {
    closeModal(modalId);
  }, [modalId, closeModal]);
  
  return {
    modalState,
    navigate,
    back,
    updateData,
    close,
    isOpen: modalState?.isOpen ?? false,
    currentPage: modalState?.currentPage,
    canGoBack: modalState ? modalState.pageHistory.length > 1 : false,
    pageData: modalState?.pageData ?? {},
  };
}
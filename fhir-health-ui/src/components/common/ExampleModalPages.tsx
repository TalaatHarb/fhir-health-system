import React, { useState } from 'react';
import { useModalNavigation } from '../../hooks/useModalNavigation';
import './ExampleModalPages.css';

// Example modal page props interface
export interface ModalPageProps {
  modalId: string;
  pageId: string;
  pageData: any;
}

// Example: Simple confirmation page
export function ConfirmationPage({ modalId, pageId, pageData }: ModalPageProps) {
  const { close, back, canGoBack } = useModalNavigation(modalId);
  
  const handleConfirm = () => {
    if (pageData.onConfirm) {
      pageData.onConfirm();
    }
    close();
  };
  
  const handleCancel = () => {
    if (canGoBack) {
      back();
    } else {
      close();
    }
  };
  
  return (
    <div className="confirmation-page">
      <div className="confirmation-content">
        <h3>{pageData.title || 'Confirm Action'}</h3>
        <p>{pageData.message || 'Are you sure you want to proceed?'}</p>
        
        {pageData.details && (
          <div className="confirmation-details">
            <pre>{JSON.stringify(pageData.details, null, 2)}</pre>
          </div>
        )}
      </div>
      
      <div className="confirmation-actions">
        <button 
          type="button" 
          className="cancel-button"
          onClick={handleCancel}
        >
          {canGoBack ? 'Back' : 'Cancel'}
        </button>
        <button 
          type="button" 
          className="confirm-button"
          onClick={handleConfirm}
        >
          {pageData.confirmText || 'Confirm'}
        </button>
      </div>
    </div>
  );
}

// Example: Form page with navigation
export function FormPage({ modalId, pageId, pageData }: ModalPageProps) {
  const { navigate, close, updateCurrentPageData, getCurrentPageData } = useModalNavigation(modalId);
  const [formData, setFormData] = useState(getCurrentPageData().formData || {});
  
  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    updateCurrentPageData({ formData: newFormData });
  };
  
  const handleNext = () => {
    if (pageData.nextPage) {
      navigate(pageData.nextPage, { previousFormData: formData });
    }
  };
  
  const handleSubmit = () => {
    if (pageData.onSubmit) {
      pageData.onSubmit(formData);
    }
    close();
  };
  
  return (
    <div className="form-page">
      <div className="form-content">
        <form onSubmit={(e) => e.preventDefault()}>
          {pageData.fields?.map((field: any) => (
            <div key={field.name} className="form-group">
              <label htmlFor={field.name}>{field.label}</label>
              <input
                type={field.type || 'text'}
                id={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                required={field.required}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </form>
      </div>
      
      <div className="form-actions">
        <button type="button" onClick={close}>
          Cancel
        </button>
        {pageData.nextPage && (
          <button type="button" onClick={handleNext}>
            Next
          </button>
        )}
        {pageData.showSubmit && (
          <button type="button" onClick={handleSubmit}>
            Submit
          </button>
        )}
      </div>
    </div>
  );
}

// Example: List selection page
export function ListSelectionPage({ modalId, pageId, pageData }: ModalPageProps) {
  const { navigate, close, updateCurrentPageData } = useModalNavigation(modalId);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
    updateCurrentPageData({ selectedItem: item });
  };
  
  const handleContinue = () => {
    if (pageData.nextPage && selectedItem) {
      navigate(pageData.nextPage, { selectedItem });
    } else if (pageData.onSelect && selectedItem) {
      pageData.onSelect(selectedItem);
      close();
    }
  };
  
  return (
    <div className="list-selection-page">
      <div className="list-content">
        {pageData.description && (
          <p className="list-description">{pageData.description}</p>
        )}
        
        <div className="item-list">
          {pageData.items?.map((item: any, index: number) => (
            <div
              key={item.id || index}
              className={`item ${selectedItem === item ? 'selected' : ''}`}
              onClick={() => handleItemSelect(item)}
            >
              <div className="item-content">
                <h4>{item.title || item.name}</h4>
                {item.description && <p>{item.description}</p>}
              </div>
              {selectedItem === item && (
                <div className="item-selected-indicator">✓</div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="list-actions">
        <button type="button" onClick={close}>
          Cancel
        </button>
        <button 
          type="button" 
          onClick={handleContinue}
          disabled={!selectedItem}
        >
          {pageData.nextPage ? 'Continue' : 'Select'}
        </button>
      </div>
    </div>
  );
}

// Example: Loading page
export function LoadingPage({ modalId, pageId, pageData }: ModalPageProps) {
  const { close } = useModalNavigation(modalId);
  
  return (
    <div className="loading-page">
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <h3>{pageData.title || 'Loading...'}</h3>
        <p>{pageData.message || 'Please wait while we process your request.'}</p>
        
        {pageData.allowCancel && (
          <button type="button" onClick={close}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// Example: Success page
export function SuccessPage({ modalId, pageId, pageData }: ModalPageProps) {
  const { close, navigate } = useModalNavigation(modalId);
  
  const handleAction = () => {
    if (pageData.nextPage) {
      navigate(pageData.nextPage);
    } else {
      close();
    }
  };
  
  return (
    <div className="success-page">
      <div className="success-content">
        <div className="success-icon">✓</div>
        <h3>{pageData.title || 'Success!'}</h3>
        <p>{pageData.message || 'Your action was completed successfully.'}</p>
        
        {pageData.details && (
          <div className="success-details">
            {Object.entries(pageData.details).map(([key, value]) => (
              <div key={key} className="detail-item">
                <strong>{key}:</strong> {String(value)}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="success-actions">
        <button type="button" onClick={handleAction}>
          {pageData.actionText || (pageData.nextPage ? 'Continue' : 'Close')}
        </button>
      </div>
    </div>
  );
}

// Example: Error page
export function ErrorPage({ modalId, pageId, pageData }: ModalPageProps) {
  const { close, back, canGoBack } = useModalNavigation(modalId);
  
  const handleRetry = () => {
    if (pageData.onRetry) {
      pageData.onRetry();
    } else if (canGoBack) {
      back();
    }
  };
  
  return (
    <div className="error-page">
      <div className="error-content">
        <div className="error-icon">⚠</div>
        <h3>{pageData.title || 'Error'}</h3>
        <p>{pageData.message || 'An error occurred while processing your request.'}</p>
        
        {pageData.error && (
          <div className="error-details">
            <details>
              <summary>Error Details</summary>
              <pre>{pageData.error}</pre>
            </details>
          </div>
        )}
      </div>
      
      <div className="error-actions">
        <button type="button" onClick={close}>
          Close
        </button>
        {(pageData.onRetry || canGoBack) && (
          <button type="button" onClick={handleRetry}>
            {pageData.retryText || 'Retry'}
          </button>
        )}
      </div>
    </div>
  );
}
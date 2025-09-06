import React, { useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useModalConfig } from '../../hooks/useModalNavigation';
import { ModalManager } from './Modal';
import { 
  ConfirmationPage, 
  FormPage, 
  ListSelectionPage, 
  LoadingPage, 
  SuccessPage, 
  ErrorPage 
} from './ExampleModalPages';

/**
 * Demo component showcasing the new modal system architecture
 * This demonstrates the key features:
 * - Fixed-size modal containers with stable dimensions
 * - Page-based navigation within modals
 * - Modal history and back navigation functionality
 * - Centralized modal management
 */
export function ModalSystemDemo() {
  const { openModal } = useModal();
  const { createSinglePageModal, createMultiPageModal, createWizardModal } = useModalConfig();
  const [demoResults, setDemoResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setDemoResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // Demo 1: Simple confirmation modal
  const openConfirmationModal = () => {
    const config = createSinglePageModal(
      'confirmation',
      'Confirm Action',
      ConfirmationPage,
      'small',
      {
        onClose: () => addResult('Confirmation modal closed'),
        props: {
          title: 'Delete Patient Record',
          message: 'Are you sure you want to delete this patient record? This action cannot be undone.',
          confirmText: 'Delete',
          onConfirm: () => addResult('Patient record deleted'),
          details: {
            patientId: 'PAT-12345',
            patientName: 'John Doe',
            recordCount: 15
          }
        }
      }
    );
    openModal('confirmation-demo', config);
  };

  // Demo 2: Multi-step form wizard
  const openFormWizard = () => {
    const config = createWizardModal([
      {
        id: 'personal-info',
        title: 'Personal Information',
        component: FormPage,
        props: {
          fields: [
            { name: 'firstName', label: 'First Name', required: true },
            { name: 'lastName', label: 'Last Name', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true }
          ],
          nextPage: 'contact-info'
        }
      },
      {
        id: 'contact-info',
        title: 'Contact Information',
        component: FormPage,
        props: {
          fields: [
            { name: 'phone', label: 'Phone Number', type: 'tel' },
            { name: 'address', label: 'Address' },
            { name: 'city', label: 'City' }
          ],
          nextPage: 'review'
        }
      },
      {
        id: 'review',
        title: 'Review & Submit',
        component: FormPage,
        props: {
          showSubmit: true,
          onSubmit: (data: any) => {
            addResult(`Form submitted: ${JSON.stringify(data)}`);
          }
        }
      }
    ], 'large');
    
    openModal('form-wizard-demo', config);
  };

  // Demo 3: Selection modal with navigation
  const openSelectionModal = () => {
    const config = createMultiPageModal([
      {
        id: 'category-selection',
        title: 'Select Category',
        component: ListSelectionPage,
        props: {
          description: 'Choose a category to continue:',
          items: [
            { id: 'patients', title: 'Patients', description: 'Manage patient records' },
            { id: 'encounters', title: 'Encounters', description: 'View medical encounters' },
            { id: 'reports', title: 'Reports', description: 'Generate and view reports' }
          ],
          nextPage: 'item-selection'
        }
      },
      {
        id: 'item-selection',
        title: 'Select Item',
        component: ListSelectionPage,
        props: {
          description: 'Choose a specific item:',
          items: [
            { id: 'item1', title: 'Item 1', description: 'First item description' },
            { id: 'item2', title: 'Item 2', description: 'Second item description' },
            { id: 'item3', title: 'Item 3', description: 'Third item description' }
          ],
          onSelect: (item: any) => {
            addResult(`Selected item: ${item.title}`);
          }
        }
      }
    ], 'category-selection', 'medium');
    
    openModal('selection-demo', config);
  };

  // Demo 4: Loading and success flow
  const openLoadingFlow = () => {
    const config = createMultiPageModal([
      {
        id: 'loading',
        title: 'Processing',
        component: LoadingPage,
        canGoBack: false,
        props: {
          title: 'Creating Patient Record',
          message: 'Please wait while we create the patient record...',
          allowCancel: true
        }
      },
      {
        id: 'success',
        title: 'Success',
        component: SuccessPage,
        canGoBack: false,
        props: {
          title: 'Patient Created Successfully',
          message: 'The patient record has been created and is now available in the system.',
          details: {
            'Patient ID': 'PAT-67890',
            'Created At': new Date().toLocaleString(),
            'Status': 'Active'
          }
        }
      }
    ], 'loading', 'medium');
    
    openModal('loading-demo', config);
    
    // Simulate async operation
    setTimeout(() => {
      const { navigateToPage } = useModal();
      navigateToPage('loading-demo', 'success');
      addResult('Patient creation completed');
    }, 2000);
  };

  // Demo 5: Error handling
  const openErrorModal = () => {
    const config = createSinglePageModal(
      'error',
      'Error Occurred',
      ErrorPage,
      'medium',
      {
        props: {
          title: 'Failed to Save Patient',
          message: 'An error occurred while saving the patient record. Please try again.',
          error: 'Network timeout: Unable to connect to FHIR server after 30 seconds',
          onRetry: () => {
            addResult('Retry attempted');
          },
          retryText: 'Try Again'
        }
      }
    );
    openModal('error-demo', config);
  };

  // Demo 6: Different modal sizes
  const openSizeDemo = (size: 'small' | 'medium' | 'large' | 'fullscreen') => {
    const config = createSinglePageModal(
      'size-demo',
      `${size.charAt(0).toUpperCase() + size.slice(1)} Modal`,
      ({ modalId }) => (
        <div style={{ padding: '20px' }}>
          <h3>This is a {size} modal</h3>
          <p>Modal dimensions are fixed and stable, preventing layout shifts.</p>
          <p>Content can scroll if it exceeds the modal height.</p>
          <div style={{ height: '200px', background: '#f0f0f0', margin: '20px 0', padding: '20px' }}>
            <p>This is some content to demonstrate scrolling behavior.</p>
            <p>The modal container maintains its size regardless of content changes.</p>
            <p>This ensures a stable, predictable user experience.</p>
          </div>
        </div>
      ),
      size
    );
    openModal(`size-demo-${size}`, config);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Modal System Architecture Demo</h2>
      <p>
        This demo showcases the new modal system with fixed-size containers, 
        page-based navigation, and centralized management.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', margin: '20px 0' }}>
        <button onClick={openConfirmationModal}>
          Confirmation Modal
        </button>
        <button onClick={openFormWizard}>
          Form Wizard
        </button>
        <button onClick={openSelectionModal}>
          Selection Flow
        </button>
        <button onClick={openLoadingFlow}>
          Loading & Success
        </button>
        <button onClick={openErrorModal}>
          Error Handling
        </button>
      </div>

      <h3>Modal Sizes</h3>
      <div style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
        <button onClick={() => openSizeDemo('small')}>Small</button>
        <button onClick={() => openSizeDemo('medium')}>Medium</button>
        <button onClick={() => openSizeDemo('large')}>Large</button>
        <button onClick={() => openSizeDemo('fullscreen')}>Fullscreen</button>
      </div>

      <h3>Demo Results</h3>
      <div style={{ 
        background: '#f5f5f5', 
        padding: '10px', 
        borderRadius: '4px', 
        maxHeight: '200px', 
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        {demoResults.length === 0 ? (
          <p>No actions performed yet. Try opening some modals!</p>
        ) : (
          demoResults.map((result, index) => (
            <div key={index}>{result}</div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e8f4fd', borderRadius: '4px' }}>
        <h4>Key Features Demonstrated:</h4>
        <ul>
          <li><strong>Fixed-size containers:</strong> Modals maintain stable dimensions</li>
          <li><strong>Page-based navigation:</strong> Navigate between modal pages instead of nested modals</li>
          <li><strong>Back navigation:</strong> Built-in history and back button support</li>
          <li><strong>Centralized management:</strong> Single context manages all modal state</li>
          <li><strong>Flexible configuration:</strong> Easy setup for different modal patterns</li>
          <li><strong>Accessibility:</strong> Proper ARIA labels, keyboard navigation, focus management</li>
        </ul>
      </div>

      <ModalManager />
    </div>
  );
}
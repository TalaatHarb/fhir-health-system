# Modal System Migration Guide

This guide explains how to migrate existing modals to the new modal system architecture.

## Overview

The new modal system provides:
- **Fixed-size modal containers** with stable dimensions
- **Page-based navigation** within modals instead of nested modals
- **Modal history and back navigation** functionality
- **Centralized modal management** through ModalContext

## Key Changes

### Before (Old System)
```tsx
// Individual modal components with their own state
function MyModal({ isOpen, onClose }) {
  return isOpen ? (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content">
        {/* Modal content */}
      </div>
    </div>
  ) : null;
}
```

### After (New System)
```tsx
// Modal pages as components
function MyModalPage({ modalId, pageId, pageData }) {
  const { close, navigate } = useModalNavigation(modalId);
  
  return (
    <div>
      {/* Page content */}
      <button onClick={() => navigate('next-page')}>Next</button>
      <button onClick={close}>Close</button>
    </div>
  );
}

// Usage
function MyComponent() {
  const { openModal } = useModal();
  const { createSinglePageModal } = useModalConfig();
  
  const handleOpenModal = () => {
    const config = createSinglePageModal(
      'my-page',
      'My Modal Title',
      MyModalPage,
      'medium'
    );
    openModal('my-modal', config);
  };
  
  return <button onClick={handleOpenModal}>Open Modal</button>;
}
```

## Migration Steps

### Step 1: Setup Modal Provider

Ensure your app is wrapped with the ModalProvider:

```tsx
import { ModalProvider, ModalManager } from './contexts/ModalContext';

function App() {
  return (
    <ModalProvider>
      {/* Your app content */}
      <ModalManager /> {/* Renders all active modals */}
    </ModalProvider>
  );
}
```

### Step 2: Convert Modal Components to Pages

Transform your existing modal components into modal page components:

```tsx
// Old modal component
function PatientCreateModal({ isOpen, onClose, onPatientCreated }) {
  // ... modal logic
}

// New modal page component
function PatientCreatePage({ modalId, pageId, pageData }) {
  const { close } = useModalNavigation(modalId);
  
  const handlePatientCreated = (patient) => {
    if (pageData.onPatientCreated) {
      pageData.onPatientCreated(patient);
    }
    close();
  };
  
  // ... page logic
}
```

### Step 3: Update Modal Usage

Replace direct modal rendering with modal opening:

```tsx
// Old usage
function MyComponent() {
  const [modalOpen, setModalOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setModalOpen(true)}>Open Modal</button>
      <PatientCreateModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onPatientCreated={handlePatientCreated}
      />
    </>
  );
}

// New usage
function MyComponent() {
  const { openModal } = useModal();
  const { createSinglePageModal } = useModalConfig();
  
  const handleOpenModal = () => {
    const config = createSinglePageModal(
      'patient-create',
      'Create Patient',
      PatientCreatePage,
      'large',
      {
        props: {
          onPatientCreated: handlePatientCreated
        }
      }
    );
    openModal('patient-create-modal', config);
  };
  
  return <button onClick={handleOpenModal}>Open Modal</button>;
}
```

### Step 4: Add Page Navigation (Optional)

For complex modals, break them into multiple pages:

```tsx
function PatientWizard() {
  const { openModal } = useModal();
  const { createWizardModal } = useModalConfig();
  
  const handleOpenWizard = () => {
    const config = createWizardModal([
      {
        id: 'basic-info',
        title: 'Basic Information',
        component: PatientBasicInfoPage
      },
      {
        id: 'contact-info',
        title: 'Contact Information',
        component: PatientContactInfoPage
      },
      {
        id: 'review',
        title: 'Review & Submit',
        component: PatientReviewPage
      }
    ], 'large');
    
    openModal('patient-wizard', config);
  };
  
  return <button onClick={handleOpenWizard}>Create Patient</button>;
}
```

## Migration Examples

### Example 1: Simple Confirmation Modal

```tsx
// Before
function DeleteConfirmModal({ isOpen, onClose, onConfirm, patientName }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete {patientName}?</p>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>Delete</button>
      </div>
    </div>
  );
}

// After
function DeleteConfirmPage({ modalId, pageData }) {
  const { close } = useModalNavigation(modalId);
  
  const handleConfirm = () => {
    if (pageData.onConfirm) {
      pageData.onConfirm();
    }
    close();
  };
  
  return (
    <div>
      <h3>Confirm Delete</h3>
      <p>Are you sure you want to delete {pageData.patientName}?</p>
      <button onClick={close}>Cancel</button>
      <button onClick={handleConfirm}>Delete</button>
    </div>
  );
}

// Usage
function PatientList() {
  const { openModal } = useModal();
  const { createSinglePageModal } = useModalConfig();
  
  const handleDeletePatient = (patient) => {
    const config = createSinglePageModal(
      'delete-confirm',
      'Confirm Delete',
      DeleteConfirmPage,
      'small',
      {
        props: {
          patientName: patient.name,
          onConfirm: () => deletePatient(patient.id)
        }
      }
    );
    openModal('delete-confirm-modal', config);
  };
  
  // ... component logic
}
```

### Example 2: Multi-step Form Modal

```tsx
// Before - Single large modal with tabs
function PatientFormModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('basic');
  // ... complex tab logic
}

// After - Multiple pages with navigation
function PatientBasicInfoPage({ modalId }) {
  const { navigate, updateCurrentPageData } = useModalNavigation(modalId);
  
  const handleNext = (formData) => {
    updateCurrentPageData(formData);
    navigate('contact-info');
  };
  
  // ... form logic
}

function PatientContactInfoPage({ modalId }) {
  const { navigate, back, getCurrentPageData } = useModalNavigation(modalId);
  const basicInfo = getCurrentPageData();
  
  // ... form logic
}

// Usage
function CreatePatientButton() {
  const { openModal } = useModal();
  const { createWizardModal } = useModalConfig();
  
  const handleCreatePatient = () => {
    const config = createWizardModal([
      { id: 'basic-info', title: 'Basic Information', component: PatientBasicInfoPage },
      { id: 'contact-info', title: 'Contact Information', component: PatientContactInfoPage },
      { id: 'review', title: 'Review & Submit', component: PatientReviewPage }
    ]);
    
    openModal('patient-form', config);
  };
  
  return <button onClick={handleCreatePatient}>Create Patient</button>;
}
```

## Best Practices

### 1. Modal Sizing
- Use appropriate sizes: `small` (400px), `medium` (600px), `large` (800px), `fullscreen`
- Choose sizes based on content, not dynamic content changes
- Prefer consistent sizing across similar modals

### 2. Page Navigation
- Use page navigation for multi-step processes
- Keep individual pages focused on single tasks
- Provide clear navigation cues (back buttons, progress indicators)

### 3. Data Flow
- Pass initial data through modal config props
- Use `updatePageData` for inter-page communication
- Handle final submission in the last page or through callbacks

### 4. Error Handling
- Create dedicated error pages for complex flows
- Use inline errors for form validation
- Provide retry mechanisms where appropriate

### 5. Accessibility
- Ensure proper ARIA labels are maintained
- Test keyboard navigation between pages
- Verify screen reader compatibility

## Common Patterns

### Confirmation Dialogs
```tsx
const openConfirmation = (title, message, onConfirm) => {
  const config = createSinglePageModal(
    'confirmation',
    title,
    ConfirmationPage,
    'small',
    { props: { message, onConfirm } }
  );
  openModal('confirmation', config);
};
```

### Loading States
```tsx
const showLoading = (message) => {
  const config = createSinglePageModal(
    'loading',
    'Processing',
    LoadingPage,
    'medium',
    { 
      props: { message },
      closeOnOverlayClick: false,
      closeOnEscape: false
    }
  );
  openModal('loading', config);
};
```

### Form Wizards
```tsx
const openWizard = (steps) => {
  const config = createWizardModal(steps, 'large');
  openModal('wizard', config);
};
```

## Troubleshooting

### Modal Not Appearing
- Ensure ModalProvider wraps your app
- Check that ModalManager is rendered
- Verify modal ID is unique

### Navigation Not Working
- Ensure page IDs match in config and navigation calls
- Check that pages are properly defined in config
- Verify useModalNavigation is called with correct modal ID

### Data Not Persisting
- Use updatePageData to store data between pages
- Check that data is being passed correctly in navigation calls
- Verify pageData is being accessed correctly in components

### Styling Issues
- Import Modal.css in your app
- Check that CSS custom properties are supported
- Verify z-index conflicts with other components
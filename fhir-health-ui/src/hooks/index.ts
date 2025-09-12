// Hook exports will be added as hooks are created
// This file serves as the main entry point for all custom hooks

export { useOfflineDetection, useOfflineAwareFetch, offlineUtils } from './useOfflineDetection';
export { useViewport, getCurrentBreakpoint, matchesBreakpoint } from './useViewport';
export { useModalNavigation, useModalConfig, useModalPage } from './useModalNavigation';
export { useLoadingState } from './useLoadingState';

// export { useAuth } from './useAuth';
// export { usePatient } from './usePatient';
// export { useOrganization } from './useOrganization';
// export { useFHIRClient } from './useFHIRClient';
// export { useForm } from './useForm';
// export { useLocalStorage } from './useLocalStorage';
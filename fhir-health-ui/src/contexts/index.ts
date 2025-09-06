// Context exports will be added as contexts are created
// This file serves as the main entry point for all contexts

export { AuthProvider, useAuth } from './AuthContext';
export { OrganizationProvider, useOrganization } from './OrganizationContext';
export { PatientProvider, usePatient } from './PatientContext';
export { NotificationProvider, useNotifications } from './NotificationContext';
export { ThemeProvider, useTheme } from './ThemeContext';
export { I18nProvider, useI18n } from './I18nContext';
export { ModalProvider, useModal, useModalInstance } from './ModalContext';
// export { UIProvider, useUI } from './UIContext';
/**
 * @fileoverview Context Providers Index
 * Central export point for all React context providers.
 *
 * Architecture:
 * - AuthContext: Firebase authentication and RBAC
 * - DashboardContext: UI state management (tabs, pages, legacy filters)
 * - OrdersContext: Unified order data management (NEW - single source of truth)
 * - GoogleDriveContext: Data fetching from Google Drive
 * - ThemeContext: Dark/light mode management
 * - ToastContext: Global toast notifications
 *
 * @module contexts
 */

// Authentication
export { AuthProvider, useAuth } from './AuthContext';

// Dashboard UI State (legacy - being phased out for OrdersContext)
export { DashboardProvider, useDashboard } from './DashboardContext';

// Orders Data Management (NEW - unified data management)
export { OrdersProvider, useOrdersContext } from './OrdersContext';

// Data Source
export {
  GoogleDriveProvider,
  useGoogleDriveContext,
  DRIVE_SYNC_EVENT,
  DRIVE_ERROR_EVENT
} from './GoogleDriveContext';

// Theme
export { ThemeProvider, useTheme } from './ThemeContext';

// Notifications
export { ToastProvider, useToast } from './ToastContext';

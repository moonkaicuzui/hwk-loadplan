/**
 * @fileoverview Main Application Component
 * Sets up routing and global providers for the Rachgia Dashboard.
 *
 * @module App
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { OrdersProvider } from './contexts/OrdersContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { GoogleDriveProvider } from './contexts/GoogleDriveContext';
import { ToastProvider } from './contexts/ToastContext';
import { I18nProvider } from './i18n/index.jsx';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import { ToastContainer } from './components/common/ToastContainer';

// Lazy-loaded pages for code splitting
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MonthlyOverview = lazy(() => import('./pages/MonthlyOverview'));
const DestinationAnalysis = lazy(() => import('./pages/DestinationAnalysis'));
const FactoryComparison = lazy(() => import('./pages/FactoryComparison'));
const ModelAnalysis = lazy(() => import('./pages/ModelAnalysis'));
const VendorAnalysis = lazy(() => import('./pages/VendorAnalysis'));
const ProcessHeatmap = lazy(() => import('./pages/ProcessHeatmap'));
const DataExplorer = lazy(() => import('./pages/DataExplorer'));
const DataUpload = lazy(() => import('./pages/DataUpload'));
const OrderSearch = lazy(() => import('./pages/OrderSearch'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const TaskManagement = lazy(() => import('./pages/TaskManagement'));
const Settings = lazy(() => import('./pages/Settings'));

// Layout component
const Layout = lazy(() => import('./components/layout/Layout'));

/**
 * Protected Route wrapper
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="인증 확인 중..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * Public Route wrapper
 * Redirects to dashboard if user is already authenticated
 */
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="인증 확인 중..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * Application Routes
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Suspense fallback={<LoadingSpinner fullScreen />}>
              <Login />
            </Suspense>
          </PublicRoute>
        }
      />

      {/* Protected routes with Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingSpinner fullScreen />}>
              <Layout />
            </Suspense>
          </ProtectedRoute>
        }
      >
        {/* Dashboard Home */}
        <Route index element={<Dashboard />} />

        {/* Analysis Pages */}
        <Route path="monthly" element={<MonthlyOverview />} />
        <Route path="destination" element={<DestinationAnalysis />} />
        <Route path="factory" element={<FactoryComparison />} />
        <Route path="model" element={<ModelAnalysis />} />
        <Route path="vendor" element={<VendorAnalysis />} />
        <Route path="heatmap" element={<ProcessHeatmap />} />

        {/* Data Pages */}
        <Route path="data" element={<DataExplorer />} />
        <Route path="upload" element={<DataUpload />} />
        <Route path="search" element={<OrderSearch />} />

        {/* Management Pages */}
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="tasks" element={<TaskManagement />} />

        {/* Settings */}
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * Main App Component
 */
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider position="bottom-right" maxToasts={5}>
            <AuthProvider>
              <DashboardProvider>
                <OrdersProvider>
                  <GoogleDriveProvider>
                    <BrowserRouter>
                      <AppRoutes />
                      <ToastContainer />
                    </BrowserRouter>
                  </GoogleDriveProvider>
                </OrdersProvider>
              </DashboardProvider>
            </AuthProvider>
            {/* Toast portal target */}
            <div id="toast-portal" />
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

/**
 * @fileoverview Constants Index
 * Exports all constants from a single entry point.
 *
 * @module constants
 */

export * from './factories';
export * from './processes';
export * from './destinations';

// Status constants
export const ORDER_STATUS = {
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  PENDING: 'pending',
  SHIPPED: 'shipped',
  DELAYED: 'delayed',
  WARNING: 'warning',
  CRITICAL: 'critical'
};

// Date modes
export const DATE_MODES = {
  SDD: 'SDD', // Scheduled Delivery Date
  CRD: 'CRD'  // Customer Required Date
};

// Base color styles for UI components (used by KPICard, badges, etc.)
export const UI_COLORS = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-500' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-500' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500' },
  gray: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500' }
};

// Status colors for UI (maps status to UI_COLORS)
export const STATUS_COLORS = {
  completed: UI_COLORS.green,
  partial: UI_COLORS.blue,
  pending: UI_COLORS.gray,
  shipped: UI_COLORS.green,
  delayed: UI_COLORS.red,
  warning: UI_COLORS.yellow,
  critical: UI_COLORS.orange
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  PAGE_SIZE_OPTIONS: [20, 50, 100, 200]
};

// Chart colors
export const CHART_COLORS = {
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  purple: '#8B5CF6',
  pink: '#EC4899',
  gray: '#6B7280'
};

// Refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  FAST: 15000,   // 15 seconds
  NORMAL: 30000, // 30 seconds
  SLOW: 60000,   // 1 minute
  LAZY: 300000   // 5 minutes
};

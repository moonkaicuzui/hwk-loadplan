/**
 * @fileoverview Loading Spinner Component
 * Displays a loading indicator with optional message.
 *
 * @module components/common/LoadingSpinner
 */

import { useTranslation } from 'react-i18next';

/**
 * LoadingSpinner Component
 * @param {Object} props
 * @param {boolean} props.fullScreen - Whether to display as full screen overlay
 * @param {string} props.message - Optional loading message
 * @param {string} props.size - Spinner size: 'sm', 'md', 'lg'
 */
export default function LoadingSpinner({
  fullScreen = false,
  message = '',
  size = 'md'
}) {
  const { t } = useTranslation();

  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  const spinner = (
    <div
      className="flex flex-col items-center justify-center gap-3"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className={`${sizeClasses[size]} border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin`}
        aria-hidden="true"
      />
      {message && (
        <p className="text-sm text-secondary animate-pulse">{message}</p>
      )}
      {!message && (
        <span className="sr-only">{t('common.loading', 'Loading...')}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-primary flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Page Loading Component
 * Used for lazy-loaded pages
 */
export function PageLoading() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" message={t('common.loading', 'Loading...')} />
    </div>
  );
}

/**
 * Skeleton Loading Component
 * Shows placeholder content while loading
 */
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      {...props}
    />
  );
}

/**
 * Card Skeleton for dashboard cards
 */
export function CardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * Table Skeleton for data tables
 */
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex gap-4 p-4 bg-secondary border-b border-theme">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-theme">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Chart Skeleton for charts
 */
export function ChartSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm">
      <Skeleton className="h-5 w-32 mb-4" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

/**
 * Dashboard Section Skeleton for urgency/delay sections
 */
export function DashboardSectionSkeleton({ title = '', itemCount = 4 }) {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24 rounded" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-lg p-3 bg-gray-100 dark:bg-gray-800">
            <Skeleton className="h-6 w-6 mx-auto mb-2" />
            <Skeleton className="h-6 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-10 mx-auto" />
          </div>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-2">
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Bar Chart Skeleton for backlog/comparison charts
 */
export function BarChartSkeleton({ barCount = 8 }) {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: barCount }).map((_, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-6 rounded-full" style={{ width: `${Math.random() * 60 + 20}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

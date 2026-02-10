/**
 * @fileoverview useOrdersData Hook
 * Bridge hook that provides unified access to order data.
 * This hook wraps OrdersContext and provides a simpler interface
 * for components that need order data with filtering support.
 *
 * Migration Path:
 * 1. Components currently using useOrders + useFilters can switch to useOrdersData
 * 2. useOrdersData provides the same interface but uses OrdersContext internally
 * 3. This eliminates duplicate state and computation
 *
 * @module hooks/useOrdersData
 */

import { useMemo, useCallback } from 'react';
import { useOrdersContext } from '../contexts/OrdersContext';
import { useGoogleDriveContext } from '../contexts/GoogleDriveContext';

/**
 * Unified hook for accessing order data with filtering
 * Replaces the combination of useOrders + useFilters
 *
 * @param {Object} options - Configuration options
 * @param {string} options.factory - Factory filter override (defaults to context value)
 * @returns {Object} Order data, statistics, and management functions
 *
 * @example
 * const {
 *   orders,           // Raw orders (factory-filtered)
 *   filteredOrders,   // Filtered orders (all filters applied)
 *   statistics,       // Stats for factory-filtered orders
 *   filteredStats,    // Stats for filtered orders
 *   isLoading,
 *   setFilter,
 *   resetFilters,
 *   refresh
 * } = useOrdersData({ factory: 'A' });
 */
export function useOrdersData(options = {}) {
  const ordersContext = useOrdersContext();
  const { manualSync, isLoading: driveLoading, lastSync } = useGoogleDriveContext();

  const {
    // Data
    orders,
    filteredOrders,
    statistics,
    filteredStatistics,
    ordersByMonth,
    ordersByDestination,
    ordersByFactory,
    delayedOrders,
    warningOrders,
    criticalOrders,

    // State
    isLoading: contextLoading,
    error,
    lastFetched,
    dataSource,

    // Filter state
    filters,
    hasActiveFilters,
    activeFilterCount,
    dateMode,
    selectedFactory,

    // Actions
    setFilters,
    resetFilters,
    setDateMode,
    setSelectedFactory,

    // Grouping functions
    groupByMonth,
    groupByDestination,
    groupByFactory
  } = ordersContext;

  // Override factory if provided in options
  const effectiveFactory = options.factory || selectedFactory;

  // Combined loading state
  const isLoading = contextLoading || driveLoading;
  const isRefreshing = driveLoading;

  // Single filter setter (for backward compatibility)
  const setFilter = useCallback((key, value) => {
    setFilters({ [key]: value });
  }, [setFilters]);

  // Clear all filters (alias)
  const clearFilters = resetFilters;

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (manualSync) {
      await manualSync();
    }
  }, [manualSync]);

  // Recent orders (last 10, sorted by CRD)
  const recentOrders = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) return [];
    return [...filteredOrders]
      .sort((a, b) => new Date(b.crd || 0) - new Date(a.crd || 0))
      .slice(0, 10);
  }, [filteredOrders]);

  // Active filters array for display
  const activeFiltersArray = useMemo(() => {
    const active = [];

    if (filters.search) {
      active.push({ key: 'search', label: '검색', value: filters.search });
    }
    if (filters.month) {
      active.push({ key: 'month', label: '월', value: filters.month });
    }
    if (filters.destination) {
      active.push({ key: 'destination', label: '행선지', value: filters.destination });
    }
    if (filters.vendor) {
      active.push({ key: 'vendor', label: '벤더', value: filters.vendor });
    }
    if (filters.factory) {
      active.push({ key: 'factory', label: '공장', value: filters.factory });
    }
    if (filters.status) {
      active.push({ key: 'status', label: '상태', value: filters.status });
    }
    if (filters.quickFilter) {
      active.push({ key: 'quickFilter', label: '빠른필터', value: filters.quickFilter });
    }
    if (filters.dateRange?.start || filters.dateRange?.end) {
      active.push({
        key: 'dateRange',
        label: '날짜',
        value: `${filters.dateRange?.start || '~'} ~ ${filters.dateRange?.end || '~'}`
      });
    }
    if (filters.quantityRange?.min || filters.quantityRange?.max) {
      active.push({
        key: 'quantityRange',
        label: '수량',
        value: `${filters.quantityRange?.min || '0'} ~ ${filters.quantityRange?.max || '∞'}`
      });
    }

    return active;
  }, [filters]);

  return {
    // Data (using context's memoized values)
    orders,
    filteredOrders,
    allOrders: orders,

    // Statistics (pre-computed in context)
    statistics,
    filteredStats: filteredStatistics,

    // Grouped data (pre-computed in context)
    ordersByMonth,
    ordersByDestination,
    ordersByFactory,

    // Status-based subsets
    delayedOrders,
    warningOrders,
    criticalOrders,
    recentOrders,

    // Loading/Error state
    loading: isLoading,
    isLoading,
    isRefreshing,
    error,

    // Timestamps
    lastUpdated: lastFetched ? new Date(lastFetched) : lastSync,
    lastFetched,
    dataSource,

    // Filter state
    filters,
    hasActiveFilters,
    activeFilterCount,
    activeFiltersArray,
    dateMode,
    selectedFactory: effectiveFactory,

    // Filter actions
    setFilter,
    setFilters,
    clearFilters,
    resetFilters,
    setDateMode,
    setSelectedFactory,

    // Refresh
    refresh,
    refetch: refresh,

    // Grouping functions for custom use
    groupByMonth,
    groupByDestination,
    groupByFactory
  };
}

export default useOrdersData;

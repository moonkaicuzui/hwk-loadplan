/**
 * @fileoverview Orders Hook
 * Provides order data fetching and management.
 *
 * @module hooks/useOrders
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { isDelayed, isWarning, isCritical, isShipped, getOrderStatus } from '../utils/orderUtils';
import { groupOrdersByMonth, groupOrdersByDestination, groupOrdersByFactory } from '../utils/groupingUtils';
import { getCachedData } from '../services/firestoreCache';

/**
 * Hook for managing order data
 * @param {Object} options - Hook options
 * @param {string} options.factory - Factory filter
 * @param {string} options.dateMode - Date mode (SDD/CRD)
 * @returns {Object} Orders data and methods
 */
export function useOrders(options = {}) {
  const { state } = useDashboard();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const factory = options.factory || state.selectedFactory || 'ALL';
  const dateMode = options.dateMode || state.dateMode || 'SDD';

  // Fetch orders from Firestore cache or local state
  const fetchOrders = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // First check if we have data in dashboard context
      if (state.allData && state.allData.length > 0) {
        setOrders(state.allData);
        setLastUpdated(new Date());
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Try to fetch from Firestore cache
      const factoryKey = !factory || factory === 'ALL' ? 'ALL_FACTORIES' : `FACTORY_${factory}`;
      const cachedData = await getCachedData(factoryKey);

      // Check again if context data arrived while we were fetching cache
      // This prevents overwriting data that arrived during async fetch
      if (state.allData && state.allData.length > 0) {
        console.log('[useOrders] Context data arrived during cache fetch, using context data');
        setOrders(state.allData);
        setLoading(false);
        return;
      }

      if (cachedData?.orders && cachedData.orders.length > 0) {
        console.log('[useOrders] Loaded from cache:', cachedData.orders.length, 'orders');
        setOrders(cachedData.orders);
        setLastUpdated(cachedData.timestamp ? new Date(cachedData.timestamp) : new Date());
      } else {
        // No cache and no context data - just log, don't overwrite
        console.log('[useOrders] No cached data found, waiting for data source');
        // Don't call setOrders([]) - let context effect handle data when it arrives
      }
    } catch (err) {
      console.error('[useOrders] Fetch error:', err);
      setError(err.message);
      // Don't overwrite orders on error - context may have data
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [factory, dateMode, state.allData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchOrders(true);
  }, [fetchOrders]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Also update when context data changes
  useEffect(() => {
    if (state.allData && state.allData.length > 0) {
      console.log('[useOrders] Context data updated:', state.allData.length, 'orders');
      setOrders(state.allData);
      setLastUpdated(new Date());
      setLoading(false);
    }
  }, [state.allData]);

  // Filter orders by factory
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    if (factory === 'ALL') return orders;
    return orders.filter(order => order.factory === factory);
  }, [orders, factory]);

  // Compute statistics
  const statistics = useMemo(() => {
    const stats = {
      total: filteredOrders.length,
      totalQuantity: 0,
      completed: 0,
      completedQuantity: 0,
      partial: 0,
      pending: 0,
      shipped: 0,
      shippedQuantity: 0,
      delayed: 0,
      delayedQuantity: 0,
      warning: 0,
      warningQuantity: 0,
      critical: 0,
      criticalQuantity: 0
    };

    filteredOrders.forEach(order => {
      const qty = order.quantity || 0;
      stats.totalQuantity += qty;

      // Status counts
      const status = getOrderStatus(order);
      if (status === 'completed') {
        stats.completed++;
        stats.completedQuantity += qty;
      } else if (status === 'partial') {
        stats.partial++;
      } else {
        stats.pending++;
      }

      // Special status counts
      if (isShipped(order)) {
        stats.shipped++;
        stats.shippedQuantity += qty;
      }
      if (isDelayed(order)) {
        stats.delayed++;
        stats.delayedQuantity += qty;
      }
      if (isWarning(order)) {
        stats.warning++;
        stats.warningQuantity += qty;
      }
      if (isCritical(order)) {
        stats.critical++;
        stats.criticalQuantity += qty;
      }
    });

    // Calculate rates
    stats.completionRate = stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;
    stats.delayRate = stats.total > 0
      ? Math.round((stats.delayed / stats.total) * 100)
      : 0;
    stats.shippedRate = stats.total > 0
      ? Math.round((stats.shipped / stats.total) * 100)
      : 0;

    return stats;
  }, [filteredOrders]);

  // Group orders by month - reuse centralized utility
  const ordersByMonth = useMemo(() => {
    return groupOrdersByMonth(filteredOrders, dateMode);
  }, [filteredOrders, dateMode]);

  // Group orders by destination - reuse centralized utility
  const ordersByDestination = useMemo(() => {
    return groupOrdersByDestination(filteredOrders);
  }, [filteredOrders]);

  // Group orders by factory - reuse centralized utility
  const ordersByFactory = useMemo(() => {
    return groupOrdersByFactory(orders);
  }, [orders]);

  // Get delayed, warning, and critical orders in a single pass
  // This is more efficient than three separate filter operations for 3700+ orders
  const { delayedOrders, warningOrders, criticalOrders } = useMemo(() => {
    const delayed = [];
    const warning = [];
    const critical = [];

    for (const order of filteredOrders) {
      if (isDelayed(order)) delayed.push(order);
      if (isWarning(order)) warning.push(order);
      if (isCritical(order)) critical.push(order);
    }

    return { delayedOrders: delayed, warningOrders: warning, criticalOrders: critical };
  }, [filteredOrders]);

  // Grouping functions for external use - wrapper around centralized utilities
  const groupByMonth = useCallback((ordersToGroup) => {
    return groupOrdersByMonth(ordersToGroup, dateMode);
  }, [dateMode]);

  const groupByDestination = useCallback((ordersToGroup) => {
    return groupOrdersByDestination(ordersToGroup);
  }, []);

  const groupByFactory = useCallback((ordersToGroup) => {
    return groupOrdersByFactory(ordersToGroup);
  }, []);

  return {
    // Data
    orders: filteredOrders,
    allOrders: orders,
    statistics,
    ordersByMonth,
    ordersByDestination,
    ordersByFactory,
    delayedOrders,
    warningOrders,
    criticalOrders,

    // State
    loading,
    error,
    lastUpdated,
    isRefreshing,

    // Methods
    refetch: fetchOrders,
    refresh,

    // Grouping functions (for filtering and re-grouping)
    groupByMonth,
    groupByDestination,
    groupByFactory
  };
}

export default useOrders;

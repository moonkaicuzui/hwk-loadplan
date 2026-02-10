/**
 * @fileoverview Orders Context - Unified Order Data Management
 * Consolidates order data, statistics, and filtering into a single source of truth.
 *
 * Architecture improvements:
 * 1. Single source of truth for order data
 * 2. Memoized statistics calculation
 * 3. Integrated filter application
 * 4. Pre-computed grouped data
 *
 * @module contexts/OrdersContext
 */

import { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { isDelayed, isWarning, isCritical, isShipped, getOrderStatus, getProductionData } from '../utils/orderUtils';
import { getYearMonth, isWithinRange, isToday, isWithinWeek, isCurrentMonth } from '../utils/dateUtils';
import { ASIAN_DESTINATIONS_SET } from '../constants/destinations';

// ========================================
// Constants
// ========================================

const CACHE_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes

// Default filter state
const DEFAULT_FILTERS = {
  search: '',
  month: '',
  destination: '',
  vendor: '',
  factory: '',
  status: '',
  quickFilter: '',
  dateRange: {
    start: '',
    end: ''
  },
  quantityRange: {
    min: '',
    max: ''
  },
  filterLogic: 'AND'
};

// ========================================
// Initial State
// ========================================

const initialState = {
  // Core data
  orders: [],           // Raw order data from data source

  // Data source tracking
  dataSource: null,     // 'googleDrive' | 'fileUpload' | 'cache'
  lastFetched: null,
  isLoading: false,
  error: null,

  // Filter state (consolidated)
  filters: DEFAULT_FILTERS,
  dateMode: 'SDD',
  selectedFactory: 'ALL',

  // Cache metadata
  cacheValidUntil: null
};

// ========================================
// Action Types
// ========================================

const ActionTypes = {
  SET_ORDERS: 'SET_ORDERS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_FILTERS: 'SET_FILTERS',
  RESET_FILTERS: 'RESET_FILTERS',
  SET_DATE_MODE: 'SET_DATE_MODE',
  SET_FACTORY: 'SET_FACTORY',
  CLEAR_DATA: 'CLEAR_DATA'
};

// ========================================
// Reducer
// ========================================

function ordersReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_ORDERS:
      return {
        ...state,
        orders: action.payload.orders,
        dataSource: action.payload.dataSource || 'unknown',
        lastFetched: Date.now(),
        cacheValidUntil: Date.now() + CACHE_VALIDITY_MS,
        isLoading: false,
        error: null
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case ActionTypes.SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };

    case ActionTypes.RESET_FILTERS:
      return {
        ...state,
        filters: DEFAULT_FILTERS
      };

    case ActionTypes.SET_DATE_MODE:
      return {
        ...state,
        dateMode: action.payload
      };

    case ActionTypes.SET_FACTORY:
      return {
        ...state,
        selectedFactory: action.payload
      };

    case ActionTypes.CLEAR_DATA:
      return initialState;

    default:
      return state;
  }
}

// ========================================
// Status Filter Handlers
// ========================================

const STATUS_HANDLERS = {
  shipped: isShipped,
  completed: (order) => getOrderStatus(order) === 'completed',
  partial: (order) => getOrderStatus(order) === 'partial',
  pending: (order) => getOrderStatus(order) === 'pending',
  delayed: isDelayed,
  warning: isWarning,
  critical: isCritical
};

// ========================================
// Context Creation
// ========================================

const OrdersContext = createContext(null);

// ========================================
// Provider Component
// ========================================

export function OrdersProvider({ children }) {
  const [state, dispatch] = useReducer(ordersReducer, initialState);

  // ========================================
  // Action Creators
  // ========================================

  const setOrders = useCallback((orders, dataSource = 'unknown') => {
    dispatch({
      type: ActionTypes.SET_ORDERS,
      payload: { orders, dataSource }
    });
  }, []);

  const setLoading = useCallback((loading) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: error });
  }, []);

  const setFilters = useCallback((filters) => {
    dispatch({ type: ActionTypes.SET_FILTERS, payload: filters });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_FILTERS });
  }, []);

  const setDateMode = useCallback((mode) => {
    dispatch({ type: ActionTypes.SET_DATE_MODE, payload: mode });
  }, []);

  const setSelectedFactory = useCallback((factory) => {
    dispatch({ type: ActionTypes.SET_FACTORY, payload: factory });
  }, []);

  const clearData = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_DATA });
  }, []);

  // ========================================
  // Filter Application Logic
  // ========================================

  const compileFilters = useCallback((filters, dateMode) => {
    const compiled = [];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      compiled.push((order) => {
        if (order.model?.toLowerCase().includes(searchLower)) return true;
        if (order.destination?.toLowerCase().includes(searchLower)) return true;
        if (order.outsoleVendor?.toLowerCase().includes(searchLower)) return true;
        if (order.poNumber?.toLowerCase().includes(searchLower)) return true;
        if (order.factory?.toLowerCase().includes(searchLower)) return true;
        if (order.article?.toLowerCase().includes(searchLower)) return true;
        if (order.buyer?.toLowerCase().includes(searchLower)) return true;
        return false;
      });
    }

    // Month filter
    if (filters.month) {
      const month = filters.month;
      compiled.push((order) => {
        const dateField = dateMode === 'SDD' ? order.sddValue : order.crd;
        return dateField?.startsWith(month) ?? false;
      });
    }

    // Destination filter
    if (filters.destination) {
      if (filters.destination === 'asia') {
        compiled.push((order) => {
          const destUpper = order.destination?.toUpperCase();
          return destUpper ? ASIAN_DESTINATIONS_SET.has(destUpper) : false;
        });
      } else {
        const dest = filters.destination;
        compiled.push((order) => order.destination === dest);
      }
    }

    // Vendor filter
    if (filters.vendor) {
      const vendor = filters.vendor;
      compiled.push((order) => order.outsoleVendor === vendor);
    }

    // Factory filter
    if (filters.factory) {
      const factory = filters.factory;
      compiled.push((order) => order.factory === factory);
    }

    // Status filter
    if (filters.status) {
      const handler = STATUS_HANDLERS[filters.status];
      if (handler) {
        compiled.push(handler);
      }
    }

    // Quick filter
    if (filters.quickFilter) {
      const quickFilter = filters.quickFilter;
      compiled.push((order) => {
        const dateField = dateMode === 'SDD' ? order.sddValue : order.crd;

        switch (quickFilter) {
          case 'delayed':
            return isDelayed(order);
          case 'warning':
            return isWarning(order);
          case 'critical':
            return isCritical(order);
          case 'today':
            return isToday(dateField);
          case 'week':
            return isWithinWeek(dateField);
          case 'month':
            return isCurrentMonth(dateField);
          case 'urgency_critical': {
            const crdDate = order.crd ? new Date(order.crd) : null;
            if (!crdDate) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diff = Math.ceil((crdDate - today) / (1000 * 60 * 60 * 24));
            return diff <= 0 && !isShipped(order);
          }
          case 'urgency_high': {
            const crdDate = order.crd ? new Date(order.crd) : null;
            if (!crdDate) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diff = Math.ceil((crdDate - today) / (1000 * 60 * 60 * 24));
            return diff > 0 && diff <= 3 && !isShipped(order);
          }
          case 'urgency_medium': {
            const crdDate = order.crd ? new Date(order.crd) : null;
            if (!crdDate) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diff = Math.ceil((crdDate - today) / (1000 * 60 * 60 * 24));
            return diff > 3 && diff <= 7 && !isShipped(order);
          }
          case 'status_overdue':
            return isDelayed(order);
          case 'status_at_risk':
            return isWarning(order) && !isDelayed(order);
          case 'status_on_track':
            return !isDelayed(order) && !isWarning(order) && !isShipped(order);
          case 'status_completed':
            return isShipped(order);
          default:
            return true;
        }
      });
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      const { start, end } = filters.dateRange;
      compiled.push((order) => {
        const dateField = dateMode === 'SDD' ? order.sddValue : order.crd;
        return isWithinRange(dateField, start, end);
      });
    }

    // Quantity range filter
    if (filters.quantityRange.min || filters.quantityRange.max) {
      const min = filters.quantityRange.min ? parseInt(filters.quantityRange.min) : 0;
      const max = filters.quantityRange.max ? parseInt(filters.quantityRange.max) : Infinity;
      compiled.push((order) => {
        const qty = order.quantity || 0;
        return qty >= min && qty <= max;
      });
    }

    return compiled;
  }, []);

  // ========================================
  // Computed Values with Memoization
  // ========================================

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    const { filters } = state;
    return (
      filters.search !== '' ||
      filters.month !== '' ||
      filters.destination !== '' ||
      filters.vendor !== '' ||
      filters.factory !== '' ||
      filters.status !== '' ||
      filters.quickFilter !== '' ||
      filters.dateRange.start !== '' ||
      filters.dateRange.end !== '' ||
      filters.quantityRange.min !== '' ||
      filters.quantityRange.max !== ''
    );
  }, [state.filters]);

  // Filter orders by selected factory first
  const factoryFilteredOrders = useMemo(() => {
    if (!state.orders || state.orders.length === 0) return [];
    if (state.selectedFactory === 'ALL') return state.orders;
    return state.orders.filter(order => order.factory === state.selectedFactory);
  }, [state.orders, state.selectedFactory]);

  // Apply all filters to get final filtered orders
  const filteredOrders = useMemo(() => {
    if (!factoryFilteredOrders || factoryFilteredOrders.length === 0) return [];
    if (!hasActiveFilters) return factoryFilteredOrders;

    const filterFunctions = compileFilters(state.filters, state.dateMode);

    if (filterFunctions.length === 0) return factoryFilteredOrders;

    if (state.filters.filterLogic === 'OR') {
      return factoryFilteredOrders.filter(order => {
        for (const fn of filterFunctions) {
          if (fn(order)) return true;
        }
        return false;
      });
    } else {
      return factoryFilteredOrders.filter(order => {
        for (const fn of filterFunctions) {
          if (!fn(order)) return false;
        }
        return true;
      });
    }
  }, [factoryFilteredOrders, state.filters, state.dateMode, hasActiveFilters, compileFilters]);

  // Calculate statistics for all orders (after factory filter)
  const statistics = useMemo(() => {
    return calculateStatistics(factoryFilteredOrders);
  }, [factoryFilteredOrders]);

  // Calculate statistics for filtered orders
  const filteredStatistics = useMemo(() => {
    return calculateStatistics(filteredOrders);
  }, [filteredOrders]);

  // Group orders by month
  const ordersByMonth = useMemo(() => {
    return groupOrdersByMonth(filteredOrders, state.dateMode);
  }, [filteredOrders, state.dateMode]);

  // Group orders by destination
  const ordersByDestination = useMemo(() => {
    return groupOrdersByDestination(filteredOrders);
  }, [filteredOrders]);

  // Group orders by factory (use all orders for comparison)
  const ordersByFactory = useMemo(() => {
    return groupOrdersByFactory(state.orders);
  }, [state.orders]);

  // Delayed, warning, critical orders
  const delayedOrders = useMemo(() => {
    return filteredOrders.filter(order => isDelayed(order));
  }, [filteredOrders]);

  const warningOrders = useMemo(() => {
    return filteredOrders.filter(order => isWarning(order));
  }, [filteredOrders]);

  const criticalOrders = useMemo(() => {
    return filteredOrders.filter(order => isCritical(order));
  }, [filteredOrders]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    const { filters } = state;
    let count = 0;
    if (filters.search) count++;
    if (filters.month) count++;
    if (filters.destination) count++;
    if (filters.vendor) count++;
    if (filters.factory) count++;
    if (filters.status) count++;
    if (filters.quickFilter) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.quantityRange.min || filters.quantityRange.max) count++;
    return count;
  }, [state.filters]);

  // Cache validity check
  const isCacheValid = useMemo(() => {
    return state.cacheValidUntil && Date.now() < state.cacheValidUntil;
  }, [state.cacheValidUntil]);

  // ========================================
  // Context Value
  // ========================================

  const value = useMemo(() => ({
    // Raw state
    state,
    dispatch,

    // Core data
    orders: state.orders,
    filteredOrders,
    isLoading: state.isLoading,
    error: state.error,
    lastFetched: state.lastFetched,
    dataSource: state.dataSource,

    // Statistics (memoized)
    statistics,
    filteredStatistics,

    // Grouped data (memoized)
    ordersByMonth,
    ordersByDestination,
    ordersByFactory,

    // Status-based subsets
    delayedOrders,
    warningOrders,
    criticalOrders,

    // Filter state
    filters: state.filters,
    hasActiveFilters,
    activeFilterCount,
    dateMode: state.dateMode,
    selectedFactory: state.selectedFactory,

    // Cache status
    isCacheValid,

    // Actions
    setOrders,
    setLoading,
    setError,
    setFilters,
    resetFilters,
    setDateMode,
    setSelectedFactory,
    clearData,

    // Grouping functions for custom use
    groupByMonth: (orders) => groupOrdersByMonth(orders, state.dateMode),
    groupByDestination: groupOrdersByDestination,
    groupByFactory: groupOrdersByFactory
  }), [
    state,
    filteredOrders,
    statistics,
    filteredStatistics,
    ordersByMonth,
    ordersByDestination,
    ordersByFactory,
    delayedOrders,
    warningOrders,
    criticalOrders,
    hasActiveFilters,
    activeFilterCount,
    isCacheValid,
    setOrders,
    setLoading,
    setError,
    setFilters,
    resetFilters,
    setDateMode,
    setSelectedFactory,
    clearData
  ]);

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
}

// ========================================
// Custom Hook
// ========================================

export function useOrdersContext() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrdersContext must be used within an OrdersProvider');
  }
  return context;
}

// ========================================
// Helper Functions
// ========================================

/**
 * Calculate statistics for a set of orders
 * @param {Array} orders - Array of order objects
 * @returns {Object} Statistics object
 */
function calculateStatistics(orders) {
  if (!orders || orders.length === 0) {
    return {
      total: 0,
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
      criticalQuantity: 0,
      completionRate: 0,
      shippedRate: 0,
      delayRate: 0
    };
  }

  const stats = {
    total: orders.length,
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

  orders.forEach(order => {
    const qty = order.quantity || order.ttl_qty || 0;
    const whOutCompleted = getProductionData(order, 'wh_out', 'completed', 0);
    const whInCompleted = getProductionData(order, 'wh_in', 'completed', 0);

    stats.totalQuantity += qty;
    stats.completedQuantity += whInCompleted;

    // Shipped: WH_OUT >= quantity
    if (whOutCompleted >= qty && qty > 0) {
      stats.shipped++;
      stats.shippedQuantity += qty;
    }

    // Status by WH_IN
    const orderStatus = getOrderStatus(order, 'wh_in');
    if (orderStatus === 'completed') {
      stats.completed++;
    } else if (orderStatus === 'partial') {
      stats.partial++;
      stats.pending++;
    } else {
      stats.pending++;
    }

    // Delay/Warning status
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
  stats.shippedRate = stats.total > 0
    ? Math.round((stats.shipped / stats.total) * 100)
    : 0;
  stats.delayRate = stats.total > 0
    ? Math.round((stats.delayed / stats.total) * 100)
    : 0;

  return stats;
}

/**
 * Group orders by month
 * @param {Array} orders - Array of orders
 * @param {string} dateMode - 'SDD' or 'CRD'
 * @returns {Array} Grouped data sorted by month
 */
function groupOrdersByMonth(orders, dateMode = 'SDD') {
  if (!orders || orders.length === 0) return [];

  const grouped = {};

  orders.forEach(order => {
    const dateField = dateMode === 'SDD' ? order.sddValue : order.crd;
    const month = getYearMonth(dateField);

    if (!month) return;

    if (!grouped[month]) {
      grouped[month] = {
        month,
        orders: [],
        totalQuantity: 0,
        completedQuantity: 0,
        delayedCount: 0
      };
    }

    grouped[month].orders.push(order);
    grouped[month].totalQuantity += order.quantity || 0;

    if (getOrderStatus(order) === 'completed') {
      grouped[month].completedQuantity += order.quantity || 0;
    }

    if (isDelayed(order)) {
      grouped[month].delayedCount++;
    }
  });

  return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Group orders by destination
 * @param {Array} orders - Array of orders
 * @returns {Array} Grouped data sorted by quantity
 */
function groupOrdersByDestination(orders) {
  if (!orders || orders.length === 0) return [];

  const grouped = {};

  orders.forEach(order => {
    const dest = order.destination || 'Unknown';

    if (!grouped[dest]) {
      grouped[dest] = {
        destination: dest,
        orders: [],
        totalQuantity: 0,
        orderCount: 0
      };
    }

    grouped[dest].orders.push(order);
    grouped[dest].totalQuantity += order.quantity || 0;
    grouped[dest].orderCount++;
  });

  return Object.values(grouped).sort((a, b) => b.totalQuantity - a.totalQuantity);
}

/**
 * Group orders by factory
 * @param {Array} orders - Array of orders
 * @returns {Object} Grouped data by factory ID
 */
function groupOrdersByFactory(orders) {
  if (!orders || orders.length === 0) return {};

  const grouped = {};

  orders.forEach(order => {
    const factory = order.factory || 'Unknown';

    if (!grouped[factory]) {
      grouped[factory] = {
        factory,
        orders: [],
        totalQuantity: 0,
        completedQuantity: 0,
        delayedCount: 0
      };
    }

    grouped[factory].orders.push(order);
    grouped[factory].totalQuantity += order.quantity || 0;

    if (getOrderStatus(order) === 'completed') {
      grouped[factory].completedQuantity += order.quantity || 0;
    }

    if (isDelayed(order)) {
      grouped[factory].delayedCount++;
    }
  });

  return grouped;
}

export default OrdersContext;

/**
 * @fileoverview Filters Hook
 * Provides filter state management for order data.
 * Optimized with caching, pre-compiled filters, and short-circuit evaluation.
 *
 * @module hooks/useFilters
 */

import { useState, useCallback, useMemo } from 'react';
import { isDelayed, isWarning, isCritical, isShipped, getOrderStatus } from '../utils/orderUtils';
import { isWithinRange, isToday, isWithinWeek, isCurrentMonth } from '../utils/dateUtils';
import { ASIAN_DESTINATIONS_SET } from '../constants/destinations';

// ============================================================================
// FILTER RESULT CACHING
// ============================================================================

/**
 * Simple LRU cache for filter results
 * Avoids recomputation when filters haven't changed
 */
const filterCache = new Map();
const CACHE_MAX_SIZE = 10;

/**
 * Create a cache key from orders and filters
 * @param {Object[]} orders - Orders array
 * @param {Object} filters - Filter state
 * @param {string} dateMode - Date mode (SDD/CRD)
 * @returns {string} Cache key
 */
function getCacheKey(orders, filters, dateMode) {
  // Use orders length + first/last order IDs for array identity
  const ordersHash = orders.length > 0
    ? `${orders.length}_${orders[0]?.poNumber || ''}_${orders[orders.length - 1]?.poNumber || ''}`
    : '0';
  const filterHash = JSON.stringify(filters);
  return `${ordersHash}_${filterHash}_${dateMode}`;
}

/**
 * Add entry to cache with LRU eviction
 * @param {string} key - Cache key
 * @param {Object[]} value - Filtered results
 */
function setCacheEntry(key, value) {
  // Evict oldest entries if cache is full
  if (filterCache.size >= CACHE_MAX_SIZE) {
    const firstKey = filterCache.keys().next().value;
    filterCache.delete(firstKey);
  }
  filterCache.set(key, value);
}

// ============================================================================
// DEFAULT FILTER STATE
// ============================================================================

/**
 * Default filter state
 */
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
  filterLogic: 'AND' // 'AND' | 'OR'
};

// ============================================================================
// STATUS FILTER HANDLERS (Pre-defined for reuse)
// ============================================================================

const STATUS_HANDLERS = {
  shipped: isShipped,
  completed: (order) => getOrderStatus(order) === 'completed',
  partial: (order) => getOrderStatus(order) === 'partial',
  pending: (order) => getOrderStatus(order) === 'pending',
  delayed: isDelayed,
  warning: isWarning,
  critical: isCritical
};

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook for managing filter state
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Filter state and methods
 */
export function useFilters(initialFilters = {}) {
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    ...initialFilters
  });

  // Update single filter
  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Update multiple filters
  const setMultipleFilters = useCallback((updates) => {
    setFilters(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Reset specific filter
  const resetFilter = useCallback((key) => {
    setFilters(prev => ({
      ...prev,
      [key]: DEFAULT_FILTERS[key]
    }));
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
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
  }, [filters]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
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
  }, [filters]);

  // Get active filters as array (for display)
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
    if (filters.dateRange.start || filters.dateRange.end) {
      active.push({
        key: 'dateRange',
        label: '날짜',
        value: `${filters.dateRange.start || '~'} ~ ${filters.dateRange.end || '~'}`
      });
    }
    if (filters.quantityRange.min || filters.quantityRange.max) {
      active.push({
        key: 'quantityRange',
        label: '수량',
        value: `${filters.quantityRange.min || '0'} ~ ${filters.quantityRange.max || '∞'}`
      });
    }

    return active;
  }, [filters]);

  /**
   * Compile filters into an array of filter functions
   * Pre-compiles once per filter change, reused for all orders
   * @param {Object} filters - Current filter state
   * @param {string} dateMode - Date mode (SDD/CRD)
   * @returns {Function[]} Array of compiled filter functions
   */
  const compileFilters = useCallback((filters, dateMode) => {
    const compiled = [];

    // Search filter - cache lowercase search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      compiled.push((order) => {
        // Check each field individually for early termination
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

    // Destination filter - use imported constant with Set lookup
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

    // Status filter - use pre-defined handlers
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
          // Urgency-based filters (days until CRD)
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
          // Delay status filters
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

  /**
   * Filter orders based on current filter state
   * Uses caching, compiled filters, and short-circuit evaluation
   * @param {Object[]} orders - Orders to filter
   * @param {string} dateMode - Date mode (SDD/CRD)
   * @returns {Object[]} Filtered orders
   */
  const applyFilters = useCallback((orders, dateMode = 'SDD') => {
    if (!orders || orders.length === 0) return [];
    if (!hasActiveFilters) return orders;

    // Check cache first
    const cacheKey = getCacheKey(orders, filters, dateMode);
    const cached = filterCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Compile filters once
    const filterFunctions = compileFilters(filters, dateMode);

    let result;

    // Apply filters with AND/OR logic
    if (filters.filterLogic === 'OR' && filterFunctions.length > 0) {
      // OR logic with short-circuit evaluation
      result = orders.filter(order => {
        for (const fn of filterFunctions) {
          if (fn(order)) return true; // Short-circuit: return true as soon as one matches
        }
        return false;
      });
    } else {
      // AND logic with short-circuit evaluation
      result = orders.filter(order => {
        for (const fn of filterFunctions) {
          if (!fn(order)) return false; // Short-circuit: return false as soon as one fails
        }
        return true;
      });
    }

    // Cache the result
    setCacheEntry(cacheKey, result);

    return result;
  }, [filters, hasActiveFilters, compileFilters]);

  /**
   * Clear the filter cache
   * Call when orders data changes externally
   */
  const clearFilterCache = useCallback(() => {
    filterCache.clear();
  }, []);

  return {
    // State
    filters,
    hasActiveFilters,
    activeFilterCount,
    activeFiltersArray,

    // Methods
    setFilter,
    setMultipleFilters,
    resetFilters,
    resetFilter,
    applyFilters,
    clearFilterCache
  };
}

export default useFilters;

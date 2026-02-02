/**
 * FilterModel.js - Filter Business Logic Layer
 * ==============================================
 *
 * Pure business logic for filtering order data.
 * NO DOM dependencies - fully unit testable.
 *
 * @module FilterModel
 * @agent A07 (MVC Architect)
 * @phase H06 - MVC 구조 리팩토링 Phase 1
 * @version 19.0.0
 */

import { isDelayed, isWarning, isShipped } from './OrderModel.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Important Asian destination countries
 * Used for 'asia' filter aggregation
 * @type {Object<string, string>}
 */
export const IMPORTANT_DESTINATIONS = Object.freeze({
  Japan: '🇯🇵',
  'South Korea': '🇰🇷',
  China: '🇨🇳',
  Taiwan: '🇹🇼',
  India: '🇮🇳',
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get date value based on mode
 *
 * @param {Object} d - Order record
 * @param {string} mode - 'sdd' or 'crd'
 * @returns {string|null} Date value
 *
 * @example
 * getDateValue(order, 'sdd') // => '2026-01-15'
 * getDateValue(order, 'crd') // => '2026-01-10'
 */
function getDateValue(d, mode) {
  return mode === 'sdd' ? d.sddValue : d.crd || d.sddValue;
}

/**
 * Get year-month value based on mode
 *
 * @param {Object} d - Order record
 * @param {string} mode - 'sdd' or 'crd'
 * @returns {string|null} Year-month string (YYYY-MM)
 *
 * @example
 * getYearMonth(order, 'sdd') // => '2026-01'
 * getYearMonth(order, 'crd') // => '2026-01'
 */
function getYearMonth(d, mode) {
  return mode === 'sdd' ? d.sddYearMonth : d.crdYearMonth || d.sddYearMonth;
}

/**
 * Check if order date is today
 *
 * @param {Object} d - Order record
 * @param {string} mode - 'sdd' or 'crd'
 * @returns {boolean} True if date is today
 *
 * @example
 * isToday(order, 'sdd') // => true if SDD is today
 * isToday(order, 'crd') // => true if CRD is today
 */
function isToday(d, mode) {
  const dateVal = getDateValue(d, mode);
  if (!dateVal || dateVal === '00:00:00') return false;

  try {
    const targetDate = new Date(dateVal.replace(/\./g, '-'));
    const today = new Date();
    return targetDate.toDateString() === today.toDateString();
  } catch {
    // Invalid date format, return false for safety
    return false;
  }
}

/**
 * Check if order date is within next 7 days
 *
 * @param {Object} d - Order record
 * @param {string} mode - 'sdd' or 'crd'
 * @returns {boolean} True if date is within next week
 *
 * @example
 * isWithinWeek(order, 'sdd') // => true if SDD is within 7 days
 */
function isWithinWeek(d, mode) {
  const dateVal = getDateValue(d, mode);
  if (!dateVal || dateVal === '00:00:00') return false;

  try {
    const targetDate = new Date(dateVal.replace(/\./g, '-'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);

    return targetDate >= today && targetDate <= weekLater;
  } catch {
    // Invalid date format, return false for safety
    return false;
  }
}

/**
 * Check if order date is in current month
 *
 * @param {Object} d - Order record
 * @param {string} mode - 'sdd' or 'crd'
 * @returns {boolean} True if date is in current month
 *
 * @example
 * isCurrentMonth(order, 'sdd') // => true if SDD is this month
 */
function isCurrentMonth(d, mode) {
  const dateVal = getDateValue(d, mode);
  if (!dateVal || dateVal === '00:00:00') return false;

  try {
    const targetDate = new Date(dateVal.replace(/\./g, '-'));
    const today = new Date();

    return (
      targetDate.getFullYear() === today.getFullYear() && targetDate.getMonth() === today.getMonth()
    );
  } catch {
    // Invalid date format, return false for safety
    return false;
  }
}

// ============================================================================
// Filter Predicate Functions
// ============================================================================

/**
 * Check if order matches date range filter
 *
 * Logic:
 * - 'all': All dates pass
 * - 'week': Date <= today + 7 days
 * - 'month': Date <= today + 1 month
 *
 * @param {Object} d - Order record
 * @param {string} rangeFilter - 'all' | 'week' | 'month'
 * @param {string} mode - 'sdd' or 'crd'
 * @returns {boolean} True if matches date range
 *
 * @example
 * matchesDateRange(order, 'week', 'sdd') // => true if SDD within 7 days
 */
export function matchesDateRange(d, rangeFilter, mode) {
  if (rangeFilter === 'all') return true;

  const dateField = mode === 'sdd' ? d.sddValue : d.crd;
  if (!dateField || dateField === '00:00:00') return true;

  const targetDate = new Date(dateField.replace(/\./g, '-'));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  if (rangeFilter === 'week') {
    maxDate.setDate(maxDate.getDate() + 7);
  } else if (rangeFilter === 'month') {
    maxDate.setMonth(maxDate.getMonth() + 1);
  }

  return targetDate <= maxDate;
}

/**
 * Check if order matches custom date range
 *
 * Logic:
 * - If no range specified, all pass
 * - Inclusive range: startDate <= targetDate <= endDate
 * - Start time: 00:00:00, End time: 23:59:59
 *
 * @param {Object} d - Order record
 * @param {string} startDate - Start date (YYYY-MM-DD) or null
 * @param {string} endDate - End date (YYYY-MM-DD) or null
 * @param {string} mode - 'sdd' or 'crd'
 * @returns {boolean} True if within custom range
 *
 * @example
 * matchesCustomDateRange(order, '2026-01-01', '2026-01-31', 'sdd')
 * // => true if SDD is in January 2026
 */
export function matchesCustomDateRange(d, startDate, endDate, mode) {
  if (!startDate && !endDate) return true;

  const dateField = mode === 'sdd' ? d.sddValue : d.crd;
  if (!dateField || dateField === '00:00:00') return false;

  try {
    const targetDate = new Date(dateField.replace(/\./g, '-'));
    targetDate.setHours(0, 0, 0, 0);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (targetDate < start) return false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (targetDate > end) return false;
    }

    return true;
  } catch {
    // Invalid date range format, return false for safety
    return false;
  }
}

/**
 * Check if order matches basic filters
 *
 * Logic:
 * - Month: Matches year-month (YYYY-MM)
 * - Destination:
 *   - 'asia': Must be in IMPORTANT_DESTINATIONS
 *   - Other: Exact match
 * - Vendor: Exact outsole vendor match
 * - Factory: Exact factory match
 *
 * @param {Object} d - Order record
 * @param {string} month - Year-month filter (YYYY-MM) or empty
 * @param {string} dest - Destination filter or empty
 * @param {string} vendor - Vendor filter or empty
 * @param {string} factory - Factory filter or empty
 * @param {string} mode - 'sdd' or 'crd' (for month filtering)
 * @returns {boolean} True if matches all basic filters
 *
 * @example
 * matchesBasicFilters(order, '2026-01', 'Japan', 'VendorA', 'A', 'sdd')
 * // => true if all conditions match
 */
export function matchesBasicFilters(d, month, dest, vendor, factory, mode) {
  const yearMonth = getYearMonth(d, mode);

  // Month filter
  if (month && yearMonth !== month) return false;

  // Destination filter
  if (dest === 'asia' && !IMPORTANT_DESTINATIONS[d.destination]) return false;
  if (dest && dest !== 'asia' && d.destination !== dest) return false;

  // Vendor filter
  if (vendor && d.outsoleVendor !== vendor) return false;

  // Factory filter
  if (factory && d.factory !== factory) return false;

  return true;
}

/**
 * Check if order matches status filter
 *
 * Logic:
 * - 'shipped': WH_OUT completed >= quantity (calls isShipped from OrderModel)
 * - 'completed': WH_IN status === 'completed'
 * - 'partial': WH_IN status === 'partial'
 * - 'pending': WH_IN status === 'pending'
 *
 * @param {Object} d - Order record
 * @param {string} status - Status filter or empty
 * @returns {boolean} True if matches status
 *
 * @example
 * matchesStatusFilter(order, 'shipped') // => true if fully shipped
 */
export function matchesStatusFilter(d, status) {
  if (!status) return true;

  // Shipped check uses OrderModel
  if (status === 'shipped' && !isShipped(d)) return false;

  // Other statuses check WH_IN
  const s = d.production?.wh_in?.status;
  if (status === 'completed' && s !== 'completed') return false;
  if (status === 'partial' && s !== 'partial') return false;
  if (status === 'pending' && s !== 'pending') return false;

  return true;
}

/**
 * Check if order matches quick filter
 *
 * Logic:
 * - 'delayed': SDD > CRD (calls isDelayed from OrderModel)
 * - 'warning': CRD - SDD within 0-3 days (calls isWarning from OrderModel)
 * - 'today': Date is today
 * - 'week': Date is within next 7 days
 * - 'month': Date is in current month
 *
 * @param {Object} d - Order record
 * @param {string} quick - Quick filter or empty
 * @param {string} mode - 'sdd' or 'crd'
 * @returns {boolean} True if matches quick filter
 *
 * @example
 * matchesQuickFilter(order, 'delayed', 'sdd') // => true if delayed
 */
export function matchesQuickFilter(d, quick, mode) {
  if (!quick) return true;

  // Use OrderModel functions for delay/warning
  if (quick === 'delayed' && !isDelayed(d)) return false;
  if (quick === 'warning' && !isWarning(d)) return false;

  // Use local date helper functions
  if (quick === 'today' && !isToday(d, mode)) return false;
  if (quick === 'week' && !isWithinWeek(d, mode)) return false;
  if (quick === 'month' && !isCurrentMonth(d, mode)) return false;

  return true;
}

/**
 * Check if order matches search query
 *
 * Logic:
 * - Case-insensitive search across multiple fields
 * - Fields: model, destination, outsoleVendor, poNumber, factory, article
 *
 * @param {Object} d - Order record
 * @param {string} search - Search query (lowercase)
 * @returns {boolean} True if matches search
 *
 * @example
 * matchesSearch(order, 'nike') // => true if any field contains 'nike'
 */
export function matchesSearch(d, search) {
  if (!search) return true;

  const searchFields = [d.model, d.destination, d.outsoleVendor, d.poNumber, d.factory, d.article]
    .join(' ')
    .toLowerCase();

  // Convert search to lowercase for case-insensitive matching
  return searchFields.includes(search.toLowerCase());
}

/**
 * Check if order quantity is within range
 *
 * Logic:
 * - If no range specified, all pass
 * - minQty: quantity >= minQty
 * - maxQty: quantity <= maxQty
 *
 * @param {Object} d - Order record
 * @param {number} minQty - Minimum quantity or null
 * @param {number} maxQty - Maximum quantity or null
 * @returns {boolean} True if within quantity range
 *
 * @example
 * matchesQuantityRange(order, 1000, 5000) // => true if 1000 <= qty <= 5000
 */
export function matchesQuantityRange(d, minQty, maxQty) {
  const qty = d.quantity || 0;

  if (minQty && qty < minQty) return false;
  if (maxQty && qty > maxQty) return false;

  return true;
}

// ============================================================================
// Exports Summary
// ============================================================================

/**
 * Exported constants:
 * - IMPORTANT_DESTINATIONS
 *
 * Exported filter predicates:
 * - matchesDateRange(d, rangeFilter, mode)
 * - matchesCustomDateRange(d, startDate, endDate, mode)
 * - matchesBasicFilters(d, month, dest, vendor, factory, mode)
 * - matchesStatusFilter(d, status)
 * - matchesQuickFilter(d, quick, mode)
 * - matchesSearch(d, search)
 * - matchesQuantityRange(d, minQty, maxQty)
 */

/**
 * @fileoverview Order Utility Functions
 * Business logic for order status determination.
 *
 * @module utils/orderUtils
 */

import { parseDate, getDaysDifference } from './dateUtils';

/**
 * Get production data for a specific process
 * @param {Object} order - Order data object
 * @param {string} process - Process ID (e.g., 'wh_out', 'wh_in')
 * @param {string} field - Field to retrieve ('completed', 'status', etc.)
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Field value or default
 */
export function getProductionData(order, process, field, defaultValue = 0) {
  if (!order) return defaultValue;

  // Direct uppercase field access (dataParser.js format: order.WH_OUT)
  // When field is 'completed', the uppercase process key contains the quantity directly
  const upperKey = process.toUpperCase();
  if (field === 'completed' && order[upperKey] !== undefined) {
    return order[upperKey];
  }

  // Direct lowercase field access (order.wh_out)
  if (field === 'completed' && order[process] !== undefined && typeof order[process] === 'number') {
    return order[process];
  }

  // Direct field access (flattened structure: order.wh_out_completed)
  const directKey = `${process}_${field}`;
  if (order[directKey] !== undefined) {
    return order[directKey];
  }

  // Nested structure access (order.production.wh_out.completed)
  if (order.production && order.production[process]) {
    const value = order.production[process][field];
    return value !== undefined ? value : defaultValue;
  }

  // Legacy structure (order.wh_out.completed)
  if (order[process] && typeof order[process] === 'object') {
    const value = order[process][field];
    return value !== undefined ? value : defaultValue;
  }

  return defaultValue;
}

/**
 * Delay severity levels
 */
export const DELAY_SEVERITY = {
  NONE: { level: 0, label: 'none', color: 'gray' },
  MINOR: { level: 1, label: 'minor', color: 'yellow', minDays: 1, maxDays: 3 },    // 1-3일 지연
  MODERATE: { level: 2, label: 'moderate', color: 'orange', minDays: 4, maxDays: 7 }, // 4-7일 지연
  SEVERE: { level: 3, label: 'severe', color: 'red', minDays: 8 }                   // 8일+ 지연
};

/**
 * Get delay days (SDD - CRD)
 * @param {Object} order - Order data
 * @returns {number} Number of delay days (0 if not delayed)
 */
export function getDelayDays(order) {
  if (!order) return 0;

  const sdd = order.sddValue || order.sdd;
  const crd = order.crd;

  if (!sdd || !crd || sdd === '00:00:00' || crd === '00:00:00') {
    return 0;
  }

  if (isShipped(order) || order.code04) {
    return 0;
  }

  const sddDate = parseDate(sdd);
  const crdDate = parseDate(crd);

  if (!sddDate || !crdDate) {
    return 0;
  }

  const diffDays = getDaysDifference(crdDate, sddDate);
  return Math.max(0, diffDays);
}

/**
 * Get delay severity level
 * @param {Object} order - Order data
 * @returns {Object} Severity object with level, label, color
 */
export function getDelaySeverity(order) {
  const delayDays = getDelayDays(order);

  if (delayDays === 0) return DELAY_SEVERITY.NONE;
  if (delayDays <= 3) return DELAY_SEVERITY.MINOR;
  if (delayDays <= 7) return DELAY_SEVERITY.MODERATE;
  return DELAY_SEVERITY.SEVERE;
}

/**
 * Check if order is delayed
 * Ground Truth: SDD > CRD (출고예정일이 고객요구일보다 늦음)
 * Exceptions: Already shipped or Code04 approved
 * @param {Object} order - Order data
 * @returns {boolean} True if delayed
 */
export function isDelayed(order) {
  return getDelayDays(order) > 0;
}

/**
 * Check if order has warning status
 * Warning: Not delayed yet, but SDD is close to CRD (within 3 days)
 * @param {Object} order - Order data
 * @returns {boolean} True if warning
 */
export function isWarning(order) {
  if (!order) return false;

  const sdd = order.sddValue || order.sdd;
  const crd = order.crd;

  // Invalid dates
  if (!sdd || !crd || sdd === '00:00:00' || crd === '00:00:00') {
    return false;
  }

  // Already shipped - no warning
  if (isShipped(order)) {
    return false;
  }

  // Already delayed - no warning (delayed is more severe)
  if (isDelayed(order)) {
    return false;
  }

  const sddDate = parseDate(sdd);
  const crdDate = parseDate(crd);

  if (!sddDate || !crdDate) {
    return false;
  }

  // Check if difference is within 3 days
  const diffDays = getDaysDifference(sddDate, crdDate);
  return diffDays >= 0 && diffDays <= 3;
}

/**
 * Check if order is critical (urgent)
 * Critical: CRD is within 3 days from today
 * @param {Object} order - Order data
 * @returns {boolean} True if critical
 */
export function isCritical(order) {
  if (!order) return false;

  const crd = order.crd;

  // Invalid date
  if (!crd || crd === '00:00:00') {
    return false;
  }

  // Already shipped - not critical
  if (isShipped(order)) {
    return false;
  }

  // Already delayed - not critical (delayed is more severe)
  if (isDelayed(order)) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const crdDate = parseDate(crd);
  if (!crdDate) {
    return false;
  }

  const diffDays = getDaysDifference(today, crdDate);
  return diffDays >= 0 && diffDays <= 3;
}

/**
 * Check if order is shipped (warehouse out completed)
 * @param {Object} order - Order data
 * @returns {boolean} True if shipped
 */
export function isShipped(order) {
  if (!order) return false;

  const whOutCompleted = getProductionData(order, 'wh_out', 'completed', 0);
  const qty = order.quantity || 0;

  return qty > 0 && whOutCompleted >= qty;
}

/**
 * Get order status
 * @param {Object} order - Order data
 * @param {string} process - Process to check (default: 'wh_in')
 * @returns {string} Status: 'completed', 'partial', 'pending'
 */
export function getOrderStatus(order, process = 'wh_in') {
  if (!order) return 'pending';

  const completed = getProductionData(order, process, 'completed', 0);
  const qty = order.quantity || 0;

  if (qty <= 0) return 'pending';
  if (completed >= qty) return 'completed';
  if (completed > 0) return 'partial';
  return 'pending';
}

/**
 * Get completion rate for a process
 * @param {Object} order - Order data
 * @param {string} process - Process ID
 * @returns {number} Completion percentage (0-100)
 */
export function getCompletionRate(order, process = 'wh_out') {
  if (!order) return 0;

  const completed = getProductionData(order, process, 'completed', 0);
  const qty = order.quantity || 0;

  if (qty <= 0) return 0;
  return Math.min(100, Math.round((completed / qty) * 100));
}

/**
 * Get remaining quantity for a process
 * @param {Object} order - Order data
 * @param {string} process - Process ID
 * @returns {number} Remaining quantity
 */
export function getRemainingQuantity(order, process = 'wh_out') {
  if (!order) return 0;

  const completed = getProductionData(order, process, 'completed', 0);
  const qty = order.quantity || 0;

  return Math.max(0, qty - completed);
}

/**
 * Determine order highlight class based on status
 * @param {Object} order - Order data
 * @returns {string} CSS class name
 */
export function getOrderHighlightClass(order) {
  if (isShipped(order)) return 'shipped-highlight';
  if (isDelayed(order)) return 'delay-highlight';
  if (isWarning(order)) return 'warning-highlight';
  if (isCritical(order)) return 'critical-highlight';
  return '';
}

/**
 * Get order priority for sorting (enhanced version)
 * Higher number = higher priority
 * Factors: delay severity, delay days, order quantity, completion rate
 * @param {Object} order - Order data
 * @returns {number} Priority score (0-200+)
 */
export function getOrderPriority(order) {
  if (!order) return 0;
  if (isShipped(order)) return 0;

  let score = 0;
  const qty = order.quantity || 0;

  // Delay severity scoring (highest priority)
  if (isDelayed(order)) {
    const severity = getDelaySeverity(order);
    const delayDays = getDelayDays(order);

    // Base score by severity level
    score += 100 + (severity.level * 20); // 120, 140, or 160

    // Additional points per delay day (max +50)
    score += Math.min(50, delayDays * 5);
  }

  // Critical (approaching deadline) scoring
  if (isCritical(order)) {
    score += 80;
  }

  // Warning scoring
  if (isWarning(order)) {
    score += 60;
  }

  // Pending (not started) scoring
  if (score === 0) {
    score = 40;
  }

  // Quantity weight: larger orders get slightly higher priority
  if (qty > 10000) score += 15;
  else if (qty > 5000) score += 10;
  else if (qty > 1000) score += 5;

  // Completion rate inverse weight: less complete = higher priority
  const completionRate = getCompletionRate(order);
  score -= Math.floor(completionRate * 0.1); // Max -10 points for 100% complete

  return score;
}

/**
 * Sort orders by priority (delayed first)
 * @param {Object[]} orders - Array of orders
 * @returns {Object[]} Sorted orders
 */
export function sortByPriority(orders) {
  return [...orders].sort((a, b) => getOrderPriority(b) - getOrderPriority(a));
}

export default {
  getProductionData,
  isDelayed,
  isWarning,
  isCritical,
  isShipped,
  getOrderStatus,
  getCompletionRate,
  getRemainingQuantity,
  getOrderHighlightClass,
  getOrderPriority,
  sortByPriority,
  // New exports
  DELAY_SEVERITY,
  getDelayDays,
  getDelaySeverity
};

/**
 * @fileoverview Cloud Functions Client
 * Provides interface to Firebase Cloud Functions for data sync and settings.
 *
 * @module services/cloudFunctions
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './firebase';

// Initialize Functions with region (with error handling)
let functions = null;
try {
  if (app) {
    functions = getFunctions(app, 'asia-northeast3');
  }
} catch (error) {
  console.warn('[CloudFunctions] Firebase Functions not available:', error.message);
}

// ========================================
// Historical Comparison
// ========================================

/**
 * Get historical comparison data (current vs previous month)
 * @param {string} factoryId - Factory ID
 * @returns {Promise<Object>} Comparison data
 */
export async function getHistoricalComparison(factoryId = 'ALL_FACTORIES') {
  if (!functions) {
    console.warn('[CloudFunctions] Functions not initialized');
    return getMockHistoricalData(factoryId);
  }

  try {
    const getComparison = httpsCallable(functions, 'getHistoricalComparison');
    const result = await getComparison({ factoryId });
    return result.data;
  } catch (error) {
    console.error('[CloudFunctions] Error getting historical comparison:', error);
    return getMockHistoricalData(factoryId);
  }
}

/**
 * Mock historical data for development/fallback
 */
function getMockHistoricalData(factoryId) {
  return {
    factoryId,
    currentMonth: new Date().toISOString().slice(0, 7),
    previousMonth: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().slice(0, 7);
    })(),
    comparison: {
      totalOrders: { current: 1234, previous: 1097, change: '12.5', trend: 'improved' },
      delayedOrders: { current: 23, previous: 27, change: '-14.8', trend: 'improved' },
      completionRate: { current: 78.5, previous: 74.5, change: '5.4', trend: 'improved' },
      warningOrders: { current: 89, previous: 61, change: '45.9', trend: 'declined' },
      totalQuantity: { current: 45678, previous: 47187, change: '-3.2', trend: 'declined' }
    }
  };
}

// ========================================
// Alert Thresholds
// ========================================

/**
 * Default alert thresholds
 */
export const DEFAULT_THRESHOLDS = {
  delayed: {
    orderCount: 1,
    quantity: 0,
    enabled: true
  },
  warning: {
    orderCount: 10,
    daysBeforeCrd: 3,
    enabled: true
  },
  completion: {
    minRate: 80,
    enabled: true
  },
  notifications: {
    dashboardBanner: true,
    browserNotification: true,
    email: false
  }
};

/**
 * Get user's alert thresholds
 * @returns {Promise<Object>} Alert thresholds
 */
export async function getAlertThresholds() {
  if (!functions) {
    // Return from localStorage or defaults
    const stored = localStorage.getItem('alertThresholds');
    return stored ? JSON.parse(stored) : DEFAULT_THRESHOLDS;
  }

  try {
    const getThresholds = httpsCallable(functions, 'getAlertThresholds');
    const result = await getThresholds();
    return result.data;
  } catch (error) {
    console.error('[CloudFunctions] Error getting alert thresholds:', error);
    const stored = localStorage.getItem('alertThresholds');
    return stored ? JSON.parse(stored) : DEFAULT_THRESHOLDS;
  }
}

/**
 * Set user's alert thresholds
 * @param {Object} thresholds - Alert thresholds to save
 * @returns {Promise<Object>} Result
 */
export async function setAlertThresholds(thresholds) {
  // Always save to localStorage for offline access
  localStorage.setItem('alertThresholds', JSON.stringify(thresholds));

  if (!functions) {
    return { success: true, offline: true };
  }

  try {
    const setThresholds = httpsCallable(functions, 'setAlertThresholds');
    await setThresholds(thresholds);
    return { success: true };
  } catch (error) {
    console.error('[CloudFunctions] Error setting alert thresholds:', error);
    return { success: true, offline: true };
  }
}

/**
 * Check if statistics exceed alert thresholds
 * @param {Object} stats - Current statistics
 * @param {Object} thresholds - Alert thresholds
 * @returns {Object} Alert status
 */
export function checkAlertThresholds(stats, thresholds = DEFAULT_THRESHOLDS) {
  const alerts = {
    hasDelayAlert: false,
    hasWarningAlert: false,
    hasCompletionAlert: false,
    messages: []
  };

  // Check delayed orders
  if (thresholds.delayed?.enabled) {
    if (stats.delayed >= thresholds.delayed.orderCount) {
      alerts.hasDelayAlert = true;
      alerts.messages.push({
        type: 'delayed',
        severity: 'error',
        message: `지연 주문 ${stats.delayed}건 (임계값: ${thresholds.delayed.orderCount}건)`
      });
    }
    if (thresholds.delayed.quantity > 0 && stats.delayedQuantity >= thresholds.delayed.quantity) {
      alerts.hasDelayAlert = true;
      alerts.messages.push({
        type: 'delayed',
        severity: 'error',
        message: `지연 수량 ${stats.delayedQuantity.toLocaleString()}pcs (임계값: ${thresholds.delayed.quantity.toLocaleString()}pcs)`
      });
    }
  }

  // Check warning orders
  if (thresholds.warning?.enabled) {
    if (stats.warning >= thresholds.warning.orderCount) {
      alerts.hasWarningAlert = true;
      alerts.messages.push({
        type: 'warning',
        severity: 'warning',
        message: `경고 주문 ${stats.warning}건 (임계값: ${thresholds.warning.orderCount}건)`
      });
    }
  }

  // Check completion rate
  if (thresholds.completion?.enabled) {
    if (stats.completionRate < thresholds.completion.minRate) {
      alerts.hasCompletionAlert = true;
      alerts.messages.push({
        type: 'completion',
        severity: 'warning',
        message: `완료율 ${stats.completionRate}% (목표: ${thresholds.completion.minRate}%)`
      });
    }
  }

  return alerts;
}

// ========================================
// Manual Sync
// ========================================

/**
 * Trigger manual data sync
 * @returns {Promise<Object>} Sync result
 */
export async function triggerManualSync() {
  if (!functions) {
    return { success: false, error: 'Functions not available' };
  }

  try {
    const manualSync = httpsCallable(functions, 'manualSyncProductionData');
    const result = await manualSync();
    return result.data;
  } catch (error) {
    console.error('[CloudFunctions] Error triggering manual sync:', error);
    throw error;
  }
}

/**
 * Get sync status
 * @returns {Promise<Object>} Sync status
 */
export async function getSyncStatus() {
  try {
    const response = await fetch(
      `https://asia-northeast3-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/getSyncStatus`
    );
    return await response.json();
  } catch (error) {
    console.error('[CloudFunctions] Error getting sync status:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// Check Alerts
// ========================================

/**
 * Check alerts against current statistics
 * @param {string} factoryId - Factory ID
 * @returns {Promise<Object>} Alert check result
 */
export async function checkAlerts(factoryId = 'ALL_FACTORIES') {
  if (!functions) {
    console.warn('[CloudFunctions] Functions not initialized, using local check');
    return { success: false, alerts: [], alertCount: 0 };
  }

  try {
    const checkAlertsFunc = httpsCallable(functions, 'checkAlerts');
    const result = await checkAlertsFunc({ factoryId });
    return result.data;
  } catch (error) {
    console.error('[CloudFunctions] Error checking alerts:', error);
    return { success: false, error: error.message, alerts: [] };
  }
}

// ========================================
// Historical Trend (Chart Data)
// ========================================

/**
 * Get historical trend data for charts
 * @param {string} factoryId - Factory ID
 * @param {number} months - Number of months to retrieve
 * @returns {Promise<Object>} Historical trend data
 */
export async function getHistoricalTrend(factoryId = 'ALL_FACTORIES', months = 6) {
  if (!functions) {
    console.warn('[CloudFunctions] Functions not initialized');
    return getMockHistoricalTrend(factoryId, months);
  }

  try {
    const getTrend = httpsCallable(functions, 'getHistoricalTrend');
    const result = await getTrend({ factoryId, months });
    return result.data;
  } catch (error) {
    console.error('[CloudFunctions] Error getting historical trend:', error);
    return getMockHistoricalTrend(factoryId, months);
  }
}

/**
 * Mock historical trend for development/fallback
 */
function getMockHistoricalTrend(factoryId, months) {
  const history = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    history.push({
      monthKey,
      totalOrders: 1000 + Math.floor(Math.random() * 500),
      completionRate: (70 + Math.random() * 20).toFixed(2),
      delayedOrders: Math.floor(Math.random() * 50),
      warningOrders: Math.floor(Math.random() * 100)
    });
  }

  return {
    success: true,
    factoryId,
    months: history.length,
    history
  };
}

export default {
  getHistoricalComparison,
  getAlertThresholds,
  setAlertThresholds,
  checkAlertThresholds,
  checkAlerts,
  getHistoricalTrend,
  triggerManualSync,
  getSyncStatus,
  DEFAULT_THRESHOLDS
};

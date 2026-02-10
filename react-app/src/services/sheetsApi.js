/**
 * @fileoverview Google Sheets API Client for Rachgia Dashboard
 * Fetches production data from Google Sheets with caching support.
 *
 * Features:
 * - Multi-factory support (A, B, C, D)
 * - Firestore cache integration
 * - Fallback to direct Sheets API
 * - 30-min auto-refresh via Cloud Functions
 * - Request timeout and retry logic with exponential backoff
 *
 * @module services/sheetsApi
 */

import {
  getCachedStatistics,
  getCachedDailyData,
  getCachedModelData,
  getCachedFactoryData,
  getCachedProcessData,
  getCachedData,
} from './firestoreCache';
import { CACHE_CONFIG, calculateBackoff } from '../config/caching';

// ========================================
// Error Event System
// ========================================

/**
 * Custom event for API errors
 * @type {string}
 */
export const SHEETS_API_ERROR_EVENT = 'sheetsapi:error';

/**
 * Emit an error event for failed requests
 * @param {string} operation - The operation that failed
 * @param {Error} error - The error object
 * @param {Object} context - Additional context
 */
function emitErrorEvent(operation, error, context = {}) {
  const event = new CustomEvent(SHEETS_API_ERROR_EVENT, {
    detail: {
      operation,
      error: error.message,
      timestamp: Date.now(),
      ...context
    }
  });
  window.dispatchEvent(event);
  console.error(`[SheetsAPI] Error in ${operation}:`, error.message, context);
}

// ========================================
// Request Utilities
// ========================================

/**
 * Fetch with timeout support
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeout = CACHE_CONFIG.TIMEOUTS.NETWORK) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch with retry logic and exponential backoff
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, options = {}, maxRetries = CACHE_CONFIG.RETRY.MAX_ATTEMPTS) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);

      // Don't retry on client errors (4xx), only on server errors (5xx) or network issues
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Server error - will retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      console.warn(`[SheetsAPI] Attempt ${attempt + 1}/${maxRetries} failed:`, lastError.message);

    } catch (error) {
      lastError = error;
      const isAbortError = error.name === 'AbortError';
      console.warn(
        `[SheetsAPI] Attempt ${attempt + 1}/${maxRetries} failed:`,
        isAbortError ? 'Request timeout' : error.message
      );
    }

    // Wait before retrying (except on last attempt)
    if (attempt < maxRetries - 1) {
      const delay = calculateBackoff(attempt);
      console.log(`[SheetsAPI] Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Request failed after all retries');
}

// ========================================
// Factory Configuration
// ========================================

const DEFAULT_SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

/**
 * Factory configuration for Rachgia (A, B, C, D factories)
 * Each factory maps to a specific sheet or filter in the spreadsheet
 */
export const FACTORY_CONFIG = {
  FACTORY_A: {
    id: 'FACTORY_A',
    name: 'Factory A',
    shortName: 'A',
    icon: 'A',
    spreadsheetId: DEFAULT_SPREADSHEET_ID,
    sheetName: 'Factory A Data',
    filterColumn: 'Factory',
    filterValue: 'A',
    active: true
  },
  FACTORY_B: {
    id: 'FACTORY_B',
    name: 'Factory B',
    shortName: 'B',
    icon: 'B',
    spreadsheetId: DEFAULT_SPREADSHEET_ID,
    sheetName: 'Factory B Data',
    filterColumn: 'Factory',
    filterValue: 'B',
    active: true
  },
  FACTORY_C: {
    id: 'FACTORY_C',
    name: 'Factory C',
    shortName: 'C',
    icon: 'C',
    spreadsheetId: DEFAULT_SPREADSHEET_ID,
    sheetName: 'Factory C Data',
    filterColumn: 'Factory',
    filterValue: 'C',
    active: true
  },
  FACTORY_D: {
    id: 'FACTORY_D',
    name: 'Factory D',
    shortName: 'D',
    icon: 'D',
    spreadsheetId: DEFAULT_SPREADSHEET_ID,
    sheetName: 'Factory D Data',
    filterColumn: 'Factory',
    filterValue: 'D',
    active: true
  },
  ALL_FACTORIES: {
    id: 'ALL_FACTORIES',
    name: 'All Factories',
    shortName: 'ALL',
    icon: '*',
    isAggregate: true,
    active: true
  }
};

/**
 * Factory groups for UI organization
 */
export const FACTORY_GROUPS = {
  RACHGIA: {
    name: 'Rachgia Production',
    factories: ['FACTORY_A', 'FACTORY_B', 'FACTORY_C', 'FACTORY_D']
  }
};

export const DEFAULT_FACTORY = 'ALL_FACTORIES';

// ========================================
// Sheets API Class
// ========================================

/**
 * Google Sheets API client with caching
 */
class SheetsAPI {
  constructor() {
    this.apiKey = GOOGLE_API_KEY;
    this.currentFactory = DEFAULT_FACTORY;
    this.config = FACTORY_CONFIG[DEFAULT_FACTORY];
  }

  /**
   * Set current factory
   * @param {string} factoryId - Factory ID from FACTORY_CONFIG
   */
  setFactory(factoryId) {
    if (FACTORY_CONFIG[factoryId]) {
      this.currentFactory = factoryId;
      this.config = FACTORY_CONFIG[factoryId];
      console.log('[SheetsAPI] Factory set to:', factoryId);
    } else {
      console.warn('[SheetsAPI] Unknown factory:', factoryId);
    }
  }

  /**
   * Get current factory configuration
   * @returns {Object} Current factory config
   */
  getFactoryConfig() {
    return this.config;
  }

  /**
   * Fetch statistics (from cache first)
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    try {
      const cached = await getCachedStatistics(this.currentFactory);
      if (cached) {
        console.log('[SheetsAPI] Statistics loaded from cache');
        return cached;
      }
      console.log('[SheetsAPI] Fetching statistics from Sheets API');
      return await this._fetchStatisticsFromSheets();
    } catch (error) {
      emitErrorEvent('getStatistics', error, { factory: this.currentFactory });
      return null;
    }
  }

  /**
   * Fetch daily data (from cache first)
   * @returns {Promise<Array>} Daily data array
   */
  async getDailyData() {
    try {
      const cached = await getCachedDailyData(this.currentFactory);
      if (cached) return cached;
      return await this._fetchDailyDataFromSheets();
    } catch (error) {
      emitErrorEvent('getDailyData', error, { factory: this.currentFactory });
      return [];
    }
  }

  /**
   * Fetch model data (from cache first)
   * @returns {Promise<Array>} Model data array
   */
  async getModelData() {
    try {
      const cached = await getCachedModelData(this.currentFactory);
      if (cached) return cached;
      return await this._fetchModelDataFromSheets();
    } catch (error) {
      emitErrorEvent('getModelData', error, { factory: this.currentFactory });
      return [];
    }
  }

  /**
   * Fetch factory comparison data
   * @returns {Promise<Array>} Factory comparison data
   */
  async getFactoryComparisonData() {
    try {
      const cached = await getCachedFactoryData();
      if (cached) return cached;
      return await this._fetchFactoryComparisonFromSheets();
    } catch (error) {
      emitErrorEvent('getFactoryComparisonData', error, {});
      return [];
    }
  }

  /**
   * Fetch process data (production pipeline status)
   * @returns {Promise<Object>} Process data object
   */
  async getProcessData() {
    try {
      const cached = await getCachedProcessData(this.currentFactory);
      if (cached) return cached;
      return await this._fetchProcessDataFromSheets();
    } catch (error) {
      emitErrorEvent('getProcessData', error, { factory: this.currentFactory });
      return null;
    }
  }

  /**
   * Fetch all data (combines multiple data sources)
   * @returns {Promise<Object>} Combined data object
   */
  async getAllData() {
    try {
      const cached = await getCachedData(this.currentFactory);
      if (cached) return cached;

      const [statistics, dailyData, modelData, processData] = await Promise.all([
        this.getStatistics(),
        this.getDailyData(),
        this.getModelData(),
        this.getProcessData()
      ]);

      return {
        statistics,
        dailyData,
        modelData,
        processData,
        factoryId: this.currentFactory,
        timestamp: Date.now()
      };
    } catch (error) {
      emitErrorEvent('getAllData', error, { factory: this.currentFactory });
      return null;
    }
  }

  // Private methods - Direct Sheets API (to be implemented)
  async _fetchStatisticsFromSheets() {
    console.warn('[SheetsAPI] Direct Sheets API not implemented yet');
    return null;
  }

  async _fetchDailyDataFromSheets() {
    console.warn('[SheetsAPI] Direct Sheets API not implemented yet');
    return [];
  }

  async _fetchModelDataFromSheets() {
    console.warn('[SheetsAPI] Direct Sheets API not implemented yet');
    return [];
  }

  async _fetchFactoryComparisonFromSheets() {
    console.warn('[SheetsAPI] Direct Sheets API not implemented yet');
    return [];
  }

  async _fetchProcessDataFromSheets() {
    console.warn('[SheetsAPI] Direct Sheets API not implemented yet');
    return null;
  }
}

// ========================================
// Singleton Export
// ========================================

export const sheetsAPI = new SheetsAPI();

/**
 * Get factory-specific API instance
 */
export function getFactoryAPI(factoryId) {
  const api = new SheetsAPI();
  api.setFactory(factoryId);
  return api;
}

/**
 * Get extended factory API with aggregate support
 */
export function getFactoryAPIExtended(factoryId) {
  const config = FACTORY_CONFIG[factoryId];
  if (config?.isAggregate) {
    return new AggregateAPI(factoryId);
  }
  return getFactoryAPI(factoryId);
}

/**
 * Aggregate API for ALL_FACTORIES view
 */
class AggregateAPI {
  constructor(factoryId) {
    this.factoryId = factoryId;
    this.factories = FACTORY_GROUPS.RACHGIA.factories;
  }

  async getStatistics() {
    const results = await Promise.all(
      this.factories.map(f => getFactoryAPI(f).getStatistics())
    );
    return results.reduce((acc, stats) => {
      if (!stats) return acc;
      return {
        totalOrders: (acc.totalOrders || 0) + (stats.totalOrders || 0),
        totalQuantity: (acc.totalQuantity || 0) + (stats.totalQuantity || 0),
        completedQuantity: (acc.completedQuantity || 0) + (stats.completedQuantity || 0),
        delayedOrders: (acc.delayedOrders || 0) + (stats.delayedOrders || 0),
        warningOrders: (acc.warningOrders || 0) + (stats.warningOrders || 0)
      };
    }, {});
  }

  async getDailyData() {
    const results = await Promise.all(
      this.factories.map(f => getFactoryAPI(f).getDailyData())
    );
    const dateMap = new Map();
    results.flat().forEach(item => {
      if (!item?.date) return;
      const existing = dateMap.get(item.date) || { date: item.date, orders: 0, quantity: 0, completed: 0 };
      existing.orders += item.orders || 0;
      existing.quantity += item.quantity || 0;
      existing.completed += item.completed || 0;
      dateMap.set(item.date, existing);
    });
    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getModelData() {
    const results = await Promise.all(
      this.factories.map(f => getFactoryAPI(f).getModelData())
    );
    const modelMap = new Map();
    results.flat().forEach(item => {
      if (!item?.model) return;
      const existing = modelMap.get(item.model) || { model: item.model, orders: 0, quantity: 0, delayedQuantity: 0 };
      existing.orders += item.orders || 0;
      existing.quantity += item.quantity || 0;
      existing.delayedQuantity += item.delayedQuantity || 0;
      modelMap.set(item.model, existing);
    });
    return Array.from(modelMap.values()).sort((a, b) => b.quantity - a.quantity);
  }
}

export default sheetsAPI;

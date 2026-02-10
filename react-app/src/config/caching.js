/**
 * @fileoverview Centralized Cache Configuration
 * All cache-related constants and settings in one place.
 *
 * @module config/caching
 */

/**
 * Cache configuration for the application
 * @constant {Object}
 */
export const CACHE_CONFIG = {
  // Time-to-Live settings (in milliseconds)
  MEMORY_TTL: 5 * 60 * 1000,        // 5 min - in-memory cache
  LOCAL_TTL: 60 * 60 * 1000,        // 60 min - localStorage cache
  FIRESTORE_TTL: 35 * 60 * 1000,    // 35 min - Firestore cache

  // Polling intervals
  POLLING_INTERVAL: {
    DEV: 60 * 1000,      // 1 min for development
    PROD: 5 * 60 * 1000  // 5 min for production
  },

  // Request timeouts
  TIMEOUTS: {
    FIRESTORE: 5000,     // 5 seconds for Firestore operations
    NETWORK: 10000       // 10 seconds for network requests
  },

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    BACKOFF_MS: 1000     // Base backoff (doubles each retry)
  },

  // Window focus auto-refresh threshold
  FOCUS_REFRESH_THRESHOLD: 5 * 60 * 1000  // 5 min
};

/**
 * Get the appropriate polling interval based on environment
 * @returns {number} Polling interval in milliseconds
 */
export function getPollingInterval() {
  return import.meta.env.DEV
    ? CACHE_CONFIG.POLLING_INTERVAL.DEV
    : CACHE_CONFIG.POLLING_INTERVAL.PROD;
}

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (0-indexed)
 * @returns {number} Delay in milliseconds
 */
export function calculateBackoff(attempt) {
  const { BACKOFF_MS } = CACHE_CONFIG.RETRY;
  // Exponential backoff with jitter
  const exponentialDelay = BACKOFF_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return exponentialDelay + jitter;
}

/**
 * Check if cache entry is expired
 * @param {number} timestamp - Cache entry timestamp
 * @param {number} ttl - Time-to-live in milliseconds
 * @returns {boolean} True if expired
 */
export function isCacheExpired(timestamp, ttl) {
  return Date.now() - timestamp > ttl;
}

export default CACHE_CONFIG;

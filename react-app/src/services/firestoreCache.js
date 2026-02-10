/**
 * @fileoverview Firestore Cache Service (3-Tier Caching)
 *
 * Caching Strategy:
 * 1. Memory Cache (fastest) - 5 min TTL
 * 2. localStorage (offline support) - 60 min TTL
 * 3. Firestore (cloud persistence) - 35 min TTL
 *
 * Data is refreshed every 30 minutes by Firebase Cloud Functions.
 *
 * @module services/firestoreCache
 */

import { db } from './firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getFactoryAPI } from './sheetsApi';
import { cacheEvents, CACHE_EVENTS } from './cacheEvents';

// ========================================
// Cache Configuration
// ========================================

const MEMORY_CACHE_TTL = 5 * 60 * 1000;      // 5 minutes
const LOCAL_CACHE_TTL = 60 * 60 * 1000;      // 60 minutes
const FIRESTORE_CACHE_TTL = 35 * 60 * 1000;  // 35 minutes
const LOCAL_CACHE_PREFIX = 'rachgia_cache_';
const CACHE_DATA_VERSION = 1;
const FIRESTORE_TIMEOUT = 5000;               // 5 seconds timeout

// Memory cache
const memoryCache = new Map();

// ========================================
// Factory ID Mapping
// ========================================

const FACTORY_ID_MAP = {
  'FACTORY_A': 'FACTORY_A',
  'FACTORY_B': 'FACTORY_B',
  'FACTORY_C': 'FACTORY_C',
  'FACTORY_D': 'FACTORY_D',
  'ALL_FACTORIES': 'ALL_FACTORIES'
};

// ========================================
// localStorage Cache Functions
// ========================================

/**
 * Get data from localStorage cache
 * @param {string} factoryId - Factory ID
 * @returns {Object|null} Cached data or null
 */
function getLocalStorageCache(factoryId) {
  try {
    const key = LOCAL_CACHE_PREFIX + factoryId;
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const { data, timestamp, version } = JSON.parse(stored);
    const age = Date.now() - timestamp;

    // Version check
    if (!version || version < CACHE_DATA_VERSION) {
      console.log('[LocalCache] Outdated version for', factoryId);
      localStorage.removeItem(key);
      return null;
    }

    if (age > LOCAL_CACHE_TTL) {
      console.log('[LocalCache] Expired for', factoryId, '(age:', Math.round(age / 60000), 'min)');
      return { data, expired: true };
    }

    console.log('[LocalCache] Hit for', factoryId, '(age:', Math.round(age / 60000), 'min)');
    return { data, expired: false };
  } catch (error) {
    console.warn('[LocalCache] Error reading:', error.message);
    return null;
  }
}

/**
 * Save data to localStorage cache
 * @param {string} factoryId - Factory ID
 * @param {Object} data - Data to cache
 */
function setLocalStorageCache(factoryId, data) {
  try {
    const key = LOCAL_CACHE_PREFIX + factoryId;
    const payload = JSON.stringify({
      data,
      timestamp: Date.now(),
      version: CACHE_DATA_VERSION
    });
    localStorage.setItem(key, payload);
    console.log('[LocalCache] Saved for', factoryId);
  } catch (error) {
    console.warn('[LocalCache] Error saving:', error.message);
    clearOldLocalCache();
  }
}

/**
 * Clear old localStorage cache entries
 */
function clearOldLocalCache() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(LOCAL_CACHE_PREFIX));
  keys.forEach(key => {
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      if (stored?.timestamp && (Date.now() - stored.timestamp > LOCAL_CACHE_TTL * 2)) {
        localStorage.removeItem(key);
      }
    } catch (e) { /* ignore */ }
  });
}

// ========================================
// Timeout Wrapper
// ========================================

/**
 * Wrap a promise with a timeout
 * @param {Promise} promise - The promise to wrap
 * @param {number} ms - Timeout in milliseconds
 * @param {string} operation - Operation name for error message
 * @returns {Promise} Promise that rejects on timeout
 */
function withTimeout(promise, ms, operation = 'Operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${ms}ms`)), ms)
    )
  ]);
}

// ========================================
// Main Cache Function (3-Tier)
// ========================================

/**
 * Get cached data with 3-tier fallback
 * Priority: Memory -> localStorage -> Firestore
 *
 * @param {string} factoryId - Factory ID
 * @returns {Promise<Object|null>} Cached data or null
 */
export async function getCachedData(factoryId) {
  const firestoreFactoryId = FACTORY_ID_MAP[factoryId] || factoryId;
  const cacheKey = 'cache_' + firestoreFactoryId;
  const startTime = performance.now();

  // 1. Memory cache (fastest)
  const memoryCached = memoryCache.get(cacheKey);
  if (memoryCached && (Date.now() - memoryCached.timestamp < MEMORY_CACHE_TTL)) {
    console.log('[Cache] Memory hit for', factoryId, '(' + Math.round(performance.now() - startTime) + 'ms)');
    return memoryCached.data;
  }

  // 2. localStorage (offline support)
  const localCached = getLocalStorageCache(firestoreFactoryId);
  if (localCached && !localCached.expired) {
    memoryCache.set(cacheKey, { data: localCached.data, timestamp: Date.now() });
    console.log('[Cache] LocalStorage hit for', factoryId, '(' + Math.round(performance.now() - startTime) + 'ms)');

    // Background refresh from Firestore
    refreshFromFirestoreBackground(factoryId, firestoreFactoryId, cacheKey);

    return localCached.data;
  }

  // If localStorage data is expired, emit stale event but still use it as fallback
  if (localCached?.expired) {
    cacheEvents.emit(CACHE_EVENTS.STALE, {
      factoryId,
      reason: 'localStorage cache expired',
      timestamp: new Date()
    });
  }

  // 3. Firestore (network required)
  try {
    console.log('[Cache] Fetching from Firestore for', factoryId);
    const docRef = doc(db, 'productionCache', firestoreFactoryId);
    const docSnap = await withTimeout(
      getDoc(docRef),
      FIRESTORE_TIMEOUT,
      `Firestore fetch for ${factoryId}`
    );

    if (!docSnap.exists()) {
      console.log('[Cache] No Firestore cache for', factoryId);
      if (localCached?.data) {
        console.log('[Cache] Using expired localStorage as fallback');
        cacheEvents.emit(CACHE_EVENTS.STALE, {
          factoryId,
          reason: 'No Firestore cache, using expired localStorage',
          timestamp: new Date()
        });
        return localCached.data;
      }
      return null;
    }

    const data = docSnap.data();
    const loadTime = Math.round(performance.now() - startTime);

    // Update caches
    memoryCache.set(cacheKey, { data, timestamp: Date.now() });
    setLocalStorageCache(firestoreFactoryId, data);

    // Emit refresh event
    cacheEvents.emit(CACHE_EVENTS.REFRESH, {
      factoryId,
      source: 'firestore',
      loadTime,
      timestamp: new Date()
    });

    console.log('[Cache] Firestore loaded for', factoryId, '(' + loadTime + 'ms)');
    return data;

  } catch (error) {
    console.error('[Cache] Firestore error for', factoryId, ':', error.message);

    // Emit error event
    cacheEvents.emit(CACHE_EVENTS.ERROR, {
      factoryId,
      error: error.message,
      timestamp: new Date()
    });

    if (localCached?.data) {
      console.log('[Cache] Using expired localStorage as fallback after Firestore error');
      cacheEvents.emit(CACHE_EVENTS.STALE, {
        factoryId,
        reason: 'Firestore error, using expired localStorage',
        timestamp: new Date()
      });
      return localCached.data;
    }
    return null;
  }
}

/**
 * Background refresh from Firestore
 */
async function refreshFromFirestoreBackground(factoryId, firestoreFactoryId, cacheKey) {
  try {
    const docRef = doc(db, 'productionCache', firestoreFactoryId);
    const docSnap = await withTimeout(
      getDoc(docRef),
      FIRESTORE_TIMEOUT,
      `Background refresh for ${factoryId}`
    );

    if (docSnap.exists()) {
      const data = docSnap.data();
      memoryCache.set(cacheKey, { data, timestamp: Date.now() });
      setLocalStorageCache(firestoreFactoryId, data);

      // Emit refresh event
      cacheEvents.emit(CACHE_EVENTS.REFRESH, {
        factoryId,
        source: 'background',
        timestamp: new Date()
      });

      console.log('[Cache] Background refresh completed for', factoryId);
    }
  } catch (error) {
    console.warn('[Cache] Background refresh failed for', factoryId, ':', error.message);

    // Emit error event for background refresh failure
    cacheEvents.emit(CACHE_EVENTS.ERROR, {
      factoryId,
      error: error.message,
      source: 'background',
      timestamp: new Date()
    });
  }
}

// ========================================
// Specific Data Accessors
// ========================================

/**
 * Get cached statistics
 * @param {string} factoryId - Factory ID
 * @returns {Promise<Object|null>} Statistics or null
 */
export async function getCachedStatistics(factoryId) {
  const data = await getCachedData(factoryId);
  if (!data?.statistics) return null;
  return {
    totalOrders: data.statistics.totalOrders || 0,
    totalQuantity: data.statistics.totalQuantity || 0,
    completedQuantity: data.statistics.completedQuantity || 0,
    delayedOrders: data.statistics.delayedOrders || 0,
    warningOrders: data.statistics.warningOrders || 0,
    delayRate: data.statistics.delayRate || '0.00',
    completionRate: data.statistics.completionRate || '0.00'
  };
}

/**
 * Get cached daily data
 * @param {string} factoryId - Factory ID
 * @returns {Promise<Array|null>} Daily data array or null
 */
export async function getCachedDailyData(factoryId) {
  const data = await getCachedData(factoryId);
  if (!data?.dailyData) return null;
  return data.dailyData.map(d => ({
    date: d.date,
    orders: d.orders || 0,
    quantity: d.quantity || 0,
    completed: d.completed || 0
  }));
}

/**
 * Get cached model data
 * @param {string} factoryId - Factory ID
 * @returns {Promise<Array|null>} Model data array or null
 */
export async function getCachedModelData(factoryId) {
  const data = await getCachedData(factoryId);
  if (!data?.modelData) return null;
  return data.modelData.map(m => ({
    model: m.model,
    orders: m.orders || 0,
    quantity: m.quantity || 0,
    delayedQuantity: m.delayedQuantity || 0,
    delayRate: parseFloat(m.delayRate) || 0
  }));
}

/**
 * Get cached factory comparison data
 * @returns {Promise<Array|null>} Factory comparison data or null
 */
export async function getCachedFactoryData() {
  try {
    const factories = ['FACTORY_A', 'FACTORY_B', 'FACTORY_C', 'FACTORY_D'];
    const results = await Promise.all(
      factories.map(async (factoryId) => {
        const data = await getCachedData(factoryId);
        if (!data) return null;
        return {
          factoryId,
          factoryName: data.factoryName || factoryId,
          ...data.statistics
        };
      })
    );
    return results.filter(r => r !== null);
  } catch (error) {
    console.error('[Cache] Error getting factory data:', error);
    return null;
  }
}

/**
 * Get cached process data
 * @param {string} factoryId - Factory ID
 * @returns {Promise<Object|null>} Process data or null
 */
export async function getCachedProcessData(factoryId) {
  const data = await getCachedData(factoryId);
  if (!data?.processData) return null;
  return data.processData;
}

/**
 * Get cache status for all factories
 * @returns {Promise<Object>} Cache status
 */
export async function getCacheStatus() {
  try {
    const querySnapshot = await getDocs(collection(db, 'productionCache'));
    const status = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      status[doc.id] = {
        factoryName: data.factoryName,
        totalOrders: data.statistics?.totalOrders || 0,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    return { success: true, factories: status, count: querySnapshot.size };
  } catch (error) {
    console.error('[Cache] Error getting cache status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear memory cache
 */
export function clearMemoryCache() {
  memoryCache.clear();
  console.log('[Cache] Memory cache cleared');
}

/**
 * Invalidate cache for a specific factory
 * Clears both memory and localStorage cache and emits invalidation event
 * @param {string} factoryId - Factory ID to invalidate
 */
export function invalidateCache(factoryId) {
  const firestoreFactoryId = FACTORY_ID_MAP[factoryId] || factoryId;
  const cacheKey = 'cache_' + firestoreFactoryId;
  const localKey = LOCAL_CACHE_PREFIX + firestoreFactoryId;

  // Clear memory cache
  memoryCache.delete(cacheKey);

  // Clear localStorage cache
  try {
    localStorage.removeItem(localKey);
  } catch (error) {
    console.warn('[Cache] Error removing localStorage:', error.message);
  }

  // Emit invalidation event
  cacheEvents.emit(CACHE_EVENTS.INVALIDATE, {
    factoryId,
    timestamp: new Date()
  });

  console.log('[Cache] Invalidated cache for', factoryId);
}

/**
 * Invalidate cache for all factories
 */
export function invalidateAllCaches() {
  const factories = Object.keys(FACTORY_ID_MAP);
  factories.forEach(factoryId => invalidateCache(factoryId));
  console.log('[Cache] Invalidated all factory caches');
}

export default {
  getCachedData,
  getCacheStatus,
  getCachedStatistics,
  getCachedDailyData,
  getCachedModelData,
  getCachedFactoryData,
  getCachedProcessData,
  clearMemoryCache,
  invalidateCache,
  invalidateAllCaches
};

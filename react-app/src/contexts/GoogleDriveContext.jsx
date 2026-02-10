/**
 * @fileoverview Google Drive Context
 * Provides automatic Google Drive data fetching across the app.
 * Supports public folder access via API key (no OAuth needed).
 *
 * Features:
 * - Automatic sync on window focus (if > 5 min since last fetch)
 * - Error state tracking with user-visible messages
 * - Cache event emission on sync completion
 *
 * @module contexts/GoogleDriveContext
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useOrdersContext } from './OrdersContext';
import { syncToProductionCache } from '../services/googleDrive';
import { parseFile } from '../services/dataParser';
import { CACHE_CONFIG, getPollingInterval, calculateBackoff } from '../config/caching';

// Configuration
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const DRIVE_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || '';

// Polling interval from centralized config
const POLL_INTERVAL = getPollingInterval();

// Google Drive API base URL
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

// Custom events
export const DRIVE_SYNC_EVENT = 'googledrive:sync';
export const DRIVE_ERROR_EVENT = 'googledrive:error';

/**
 * Emit cache sync event
 * @param {Object} data - Sync data
 */
function emitSyncEvent(data) {
  window.dispatchEvent(new CustomEvent(DRIVE_SYNC_EVENT, { detail: data }));
}

/**
 * Emit error event
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
function emitErrorEvent(error, context = {}) {
  window.dispatchEvent(new CustomEvent(DRIVE_ERROR_EVENT, {
    detail: { error: error.message, timestamp: Date.now(), ...context }
  }));
}

const GoogleDriveContext = createContext(null);

/**
 * Google Drive Provider Component
 * Automatically fetches data from a public Google Drive folder
 */
export function GoogleDriveProvider({ children }) {
  const { setOrders } = useOrdersContext();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null); // User-visible error message
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, watching, error
  const [files, setFiles] = useState([]);

  const watchIntervalRef = useRef(null);
  const lastModifiedRef = useRef(null);
  const lastFetchTimeRef = useRef(null);

  /**
   * Fetch with timeout support
   * @param {string} url - The URL to fetch
   * @param {Object} options - Fetch options
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Response>}
   */
  const fetchWithTimeout = useCallback(async (url, options = {}, timeout = CACHE_CONFIG.TIMEOUTS.NETWORK) => {
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
  }, []);

  /**
   * Fetch with retry logic and exponential backoff
   * @param {string} url - The URL to fetch
   * @param {Object} options - Fetch options
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<Response>}
   */
  const fetchWithRetry = useCallback(async (url, options = {}, maxRetries = CACHE_CONFIG.RETRY.MAX_ATTEMPTS) => {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetchWithTimeout(url, options);

        // Don't retry on client errors (4xx), only on server errors (5xx) or network issues
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }

        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        console.warn(`[GoogleDrive] Attempt ${attempt + 1}/${maxRetries} failed:`, lastError.message);

      } catch (error) {
        lastError = error;
        const isAbortError = error.name === 'AbortError';
        console.warn(
          `[GoogleDrive] Attempt ${attempt + 1}/${maxRetries} failed:`,
          isAbortError ? 'Request timeout' : error.message
        );
      }

      // Wait before retrying (except on last attempt)
      if (attempt < maxRetries - 1) {
        const delay = calculateBackoff(attempt);
        console.log(`[GoogleDrive] Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }, [fetchWithTimeout]);

  /**
   * List files in public Google Drive folder
   */
  const listFiles = useCallback(async () => {
    if (!GOOGLE_API_KEY || !DRIVE_FOLDER_ID) {
      console.warn('[GoogleDrive] Missing API key or folder ID');
      return [];
    }

    try {
      const query = encodeURIComponent(`'${DRIVE_FOLDER_ID}' in parents and trashed = false`);
      const fields = encodeURIComponent('files(id,name,mimeType,modifiedTime,size)');

      const url = `${DRIVE_API_BASE}/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc&key=${GOOGLE_API_KEY}`;

      const response = await fetchWithRetry(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const allFiles = data.files || [];

      // Filter to Excel files only
      const excelFiles = allFiles.filter(f =>
        f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv')
      );

      console.log('[GoogleDrive] Found', excelFiles.length, 'Excel files');
      return excelFiles;

    } catch (err) {
      console.error('[GoogleDrive] List files error:', err);
      emitErrorEvent(err, { operation: 'listFiles' });
      throw err;
    }
  }, [fetchWithRetry]);

  /**
   * Download file from Google Drive (public access)
   */
  const downloadFile = useCallback(async (fileId) => {
    const url = `${DRIVE_API_BASE}/files/${fileId}?alt=media&key=${GOOGLE_API_KEY}`;

    const response = await fetchWithRetry(url);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    return response.arrayBuffer();
  }, [fetchWithRetry]);

  /**
   * Extract factory code from filename
   * Example: "B- LOADPLAN ASSEMBLY OF RACHGIA FACTORY B" -> "B"
   */
  const extractFactoryFromFilename = useCallback((fileName) => {
    // Try to match "FACTORY X" pattern
    const factoryMatch = fileName.match(/FACTORY\s+([A-D])/i);
    if (factoryMatch) {
      return factoryMatch[1].toUpperCase();
    }
    // Try to match leading letter like "B- LOADPLAN..."
    const leadingMatch = fileName.match(/^([A-D])\s*-/i);
    if (leadingMatch) {
      return leadingMatch[1].toUpperCase();
    }
    return null;
  }, []);

  /**
   * Parse Excel file and extract orders using dataParser
   */
  const parseExcelFile = useCallback(async (arrayBuffer, fileName) => {
    try {
      // Extract factory from filename
      const factoryFromFilename = extractFactoryFromFilename(fileName);
      console.log('[GoogleDrive] Factory from filename:', factoryFromFilename);

      // Use parseFile from dataParser which handles column mapping
      const result = parseFile(arrayBuffer, fileName);

      // Override factory for all orders if extracted from filename
      if (factoryFromFilename) {
        result.orders.forEach(order => {
          if (!order.factory || !['A', 'B', 'C', 'D'].includes(order.factory)) {
            order.factory = factoryFromFilename;
          }
        });
      }

      console.log('[GoogleDrive] Parsed', result.orders.length, 'orders from', fileName);
      console.log('[GoogleDrive] Statistics:', result.statistics);

      return result.orders;
    } catch (err) {
      console.error('[GoogleDrive] Parse error:', err);
      throw err;
    }
  }, [extractFactoryFromFilename]);

  /**
   * Sync data from Google Drive - reads ALL Excel files and merges orders
   */
  const syncFromDrive = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      setError(null);
      setErrorMessage(null);

      console.log('[GoogleDrive] Starting sync...');

      // Get file list
      const fileList = await listFiles();
      setFiles(fileList);

      if (!fileList || fileList.length === 0) {
        console.log('[GoogleDrive] No Excel files found in folder');
        const errMsg = '폴더에 Excel 파일이 없습니다';
        setError(errMsg);
        setErrorMessage(errMsg);
        setSyncStatus('error');
        setIsLoading(false);
        emitErrorEvent(new Error(errMsg), { operation: 'syncFromDrive' });
        return false;
      }

      console.log('[GoogleDrive] Found', fileList.length, 'Excel files to process');

      // Calculate combined modified time hash to detect changes
      const combinedModifiedTime = fileList
        .map(f => f.modifiedTime)
        .sort()
        .join('|');

      // Check if any file has changed since last sync
      if (lastModifiedRef.current === combinedModifiedTime) {
        console.log('[GoogleDrive] No changes detected');
        setSyncStatus('watching');
        return true;
      }

      // Download and parse ALL Excel files
      const allOrders = [];
      const fileStats = [];

      for (const file of fileList) {
        try {
          console.log('[GoogleDrive] Downloading:', file.name);
          const arrayBuffer = await downloadFile(file.id);
          const orders = await parseExcelFile(arrayBuffer, file.name);

          if (orders && orders.length > 0) {
            allOrders.push(...orders);
            fileStats.push({ name: file.name, orderCount: orders.length });
            console.log('[GoogleDrive] Parsed', orders.length, 'orders from', file.name);
          }
        } catch (fileErr) {
          console.error('[GoogleDrive] Error processing file:', file.name, fileErr.message);
          // Continue with other files even if one fails
        }
      }

      console.log('[GoogleDrive] File statistics:', fileStats);
      console.log('[GoogleDrive] Total orders from all files:', allOrders.length);

      if (allOrders.length > 0) {
        // Update orders context with merged orders (unified data management)
        setOrders(allOrders, 'googleDrive');

        // Cache to Firestore (optional - may fail due to permissions)
        try {
          await syncToProductionCache(null, { orders: allOrders }, 'ALL_FACTORIES');
          console.log('[GoogleDrive] Cached to Firestore');
        } catch (cacheErr) {
          console.warn('[GoogleDrive] Firestore cache failed (this is OK):', cacheErr.message);
        }

        lastModifiedRef.current = combinedModifiedTime;
        lastFetchTimeRef.current = Date.now();
        setLastSync(new Date());
        setSyncStatus('watching');
        console.log('[GoogleDrive] Sync complete:', allOrders.length, 'total orders loaded from', fileList.length, 'files');

        // Emit cache sync event
        emitSyncEvent({
          orderCount: allOrders.length,
          fileCount: fileList.length,
          timestamp: Date.now()
        });

        return true;
      }

      return false;

    } catch (err) {
      console.error('[GoogleDrive] Sync error:', err);
      const errMsg = '동기화 실패: ' + err.message;
      setError(errMsg);
      setErrorMessage(errMsg);
      setSyncStatus('error');
      emitErrorEvent(err, { operation: 'syncFromDrive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [listFiles, downloadFile, parseExcelFile, setOrders]);

  /**
   * Start watching for file changes
   */
  const startWatching = useCallback(() => {
    if (watchIntervalRef.current) {
      return;
    }

    console.log('[GoogleDrive] Starting watch interval:', POLL_INTERVAL / 1000, 'seconds');

    watchIntervalRef.current = setInterval(() => {
      syncFromDrive();
    }, POLL_INTERVAL);

    setSyncStatus('watching');
  }, [syncFromDrive]);

  /**
   * Stop watching
   */
  const stopWatching = useCallback(() => {
    if (watchIntervalRef.current) {
      clearInterval(watchIntervalRef.current);
      watchIntervalRef.current = null;
    }
    setSyncStatus('idle');
  }, []);

  /**
   * Manual sync trigger
   */
  const manualSync = useCallback(async () => {
    lastModifiedRef.current = null; // Force refresh
    return syncFromDrive();
  }, [syncFromDrive]);

  /**
   * Handle window focus - refresh if stale
   */
  const handleWindowFocus = useCallback(() => {
    const lastFetch = lastFetchTimeRef.current;
    const now = Date.now();

    // If more than 5 minutes since last fetch, trigger refresh
    if (lastFetch && (now - lastFetch) > CACHE_CONFIG.FOCUS_REFRESH_THRESHOLD) {
      console.log('[GoogleDrive] Window focused, data is stale, refreshing...');
      syncFromDrive();
    }
  }, [syncFromDrive]);

  // Auto-initialize and sync on mount
  useEffect(() => {
    if (!GOOGLE_API_KEY || !DRIVE_FOLDER_ID) {
      console.warn('[GoogleDrive] Missing configuration');
      const errMsg = 'Google Drive 설정이 필요합니다';
      setError(errMsg);
      setErrorMessage(errMsg);
      setIsLoading(false);
      return;
    }

    console.log('[GoogleDrive] Initializing with folder:', DRIVE_FOLDER_ID);

    // Initial sync
    syncFromDrive().then((success) => {
      if (success) {
        // Start watching for changes
        startWatching();
      }
    });

    // Add window focus listener for auto-refresh
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      stopWatching();
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [handleWindowFocus]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setErrorMessage(null);
    if (syncStatus === 'error') {
      setSyncStatus('idle');
    }
  }, [syncStatus]);

  const value = {
    isAuthenticated: true, // Always true for public folder access
    isLoading,
    error,
    errorMessage, // User-visible error message
    lastSync,
    syncStatus,
    files,
    manualSync,
    startWatching,
    stopWatching,
    clearError
  };

  return (
    <GoogleDriveContext.Provider value={value}>
      {children}
    </GoogleDriveContext.Provider>
  );
}

/**
 * Hook to use Google Drive context
 */
export function useGoogleDriveContext() {
  const context = useContext(GoogleDriveContext);
  if (!context) {
    throw new Error('useGoogleDriveContext must be used within GoogleDriveProvider');
  }
  return context;
}

export default GoogleDriveContext;

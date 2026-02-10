/**
 * @fileoverview Google Drive Integration Service
 * Handles file uploads, downloads, and monitoring from Google Drive.
 *
 * Features:
 * - File upload to Google Drive
 * - File download and parsing
 * - Watch for file changes
 * - Sync with Firestore cache
 *
 * @module services/googleDrive
 */

import { db, storage } from './firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';

// ========================================
// Configuration
// ========================================

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_DRIVE_OAUTH_CLIENT_ID || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const DRIVE_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || '';
const DRIVE_FILE_ID = import.meta.env.VITE_GOOGLE_DRIVE_FILE_ID || '';

// Supported file types
const SUPPORTED_MIME_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv'
];

const SUPPORTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

// ========================================
// Google Drive API Client
// ========================================

class GoogleDriveService {
  constructor() {
    this.isInitialized = false;
    this.gapiLoaded = false;
    this.accessToken = null;
    this.folderId = DRIVE_FOLDER_ID;
    this.listeners = new Set();
    this.pollInterval = null;
    this.lastChecked = null;
  }

  /**
   * Initialize Google API client
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Load Google API script if not loaded
      if (!window.gapi) {
        await this._loadGapiScript();
      }

      // Initialize gapi client
      await new Promise((resolve, reject) => {
        window.gapi.load('client', { callback: resolve, onerror: reject });
      });

      await window.gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
      });

      this.gapiLoaded = true;
      this.isInitialized = true;
      console.log('[GoogleDrive] Initialized successfully');
      return true;

    } catch (error) {
      console.error('[GoogleDrive] Initialization error:', error);
      return false;
    }
  }

  /**
   * Load Google API script dynamically
   * @private
   */
  _loadGapiScript() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Set access token from Firebase Auth
   * @param {string} token - OAuth access token
   */
  setAccessToken(token) {
    this.accessToken = token;
    if (window.gapi?.client) {
      window.gapi.client.setToken({ access_token: token });
    }
    console.log('[GoogleDrive] Access token set');
  }

  /**
   * List files in the configured Drive folder
   * @param {Object} options - List options
   * @returns {Promise<Array>} Array of file objects
   */
  async listFiles(options = {}) {
    if (!this.accessToken) {
      console.warn('[GoogleDrive] No access token available');
      return [];
    }

    try {
      const query = options.folderId
        ? `'${options.folderId}' in parents and trashed = false`
        : this.folderId
          ? `'${this.folderId}' in parents and trashed = false`
          : 'trashed = false';

      const response = await window.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, modifiedTime, size, webViewLink, webContentLink)',
        orderBy: 'modifiedTime desc',
        pageSize: options.limit || 50
      });

      const files = response.result.files || [];

      // Filter to supported file types
      const supportedFiles = files.filter(file =>
        SUPPORTED_MIME_TYPES.includes(file.mimeType) ||
        SUPPORTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
      );

      console.log('[GoogleDrive] Listed', supportedFiles.length, 'files');
      return supportedFiles;

    } catch (error) {
      console.error('[GoogleDrive] Error listing files:', error);
      return [];
    }
  }

  /**
   * Download file content from Google Drive
   * @param {string} fileId - Google Drive file ID
   * @returns {Promise<ArrayBuffer>} File content as ArrayBuffer
   */
  async downloadFile(fileId) {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log('[GoogleDrive] Downloaded file:', fileId);
      return arrayBuffer;

    } catch (error) {
      console.error('[GoogleDrive] Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Upload file to Google Drive
   * @param {File} file - File object to upload
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Uploaded file metadata
   */
  async uploadFile(file, options = {}) {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    // Validate file type
    const isSupported = SUPPORTED_MIME_TYPES.includes(file.type) ||
      SUPPORTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isSupported) {
      throw new Error(`Unsupported file type: ${file.type || file.name}`);
    }

    try {
      const metadata = {
        name: file.name,
        mimeType: file.type || 'application/octet-stream'
      };

      // Set parent folder if specified
      if (options.folderId || this.folderId) {
        metadata.parents = [options.folderId || this.folderId];
      }

      // Create multipart upload
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,webViewLink',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          },
          body: form
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[GoogleDrive] Uploaded file:', result.name);

      // Notify listeners
      this._notifyListeners({ type: 'upload', file: result });

      return result;

    } catch (error) {
      console.error('[GoogleDrive] Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Watch for file changes in Drive folder
   * @param {Function} callback - Callback for file changes
   * @param {number} interval - Poll interval in ms (default: 30 seconds)
   */
  startWatching(callback, interval = 30000) {
    if (this.pollInterval) {
      console.log('[GoogleDrive] Already watching');
      return;
    }

    this.listeners.add(callback);
    this.lastChecked = new Date().toISOString();

    this.pollInterval = setInterval(async () => {
      await this._checkForChanges();
    }, interval);

    console.log('[GoogleDrive] Started watching for changes');
  }

  /**
   * Stop watching for file changes
   */
  stopWatching() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.listeners.clear();
    console.log('[GoogleDrive] Stopped watching');
  }

  /**
   * Check for file changes since last check
   * @private
   */
  async _checkForChanges() {
    if (!this.accessToken || !this.lastChecked) return;

    try {
      const files = await this.listFiles();
      const newFiles = files.filter(file =>
        new Date(file.modifiedTime) > new Date(this.lastChecked)
      );

      if (newFiles.length > 0) {
        console.log('[GoogleDrive] Found', newFiles.length, 'new/modified files');
        this._notifyListeners({ type: 'change', files: newFiles });
      }

      this.lastChecked = new Date().toISOString();

    } catch (error) {
      console.error('[GoogleDrive] Error checking for changes:', error);
    }
  }

  /**
   * Notify all listeners of changes
   * @private
   */
  _notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[GoogleDrive] Listener error:', error);
      }
    });
  }

  /**
   * Add change listener
   * @param {Function} callback - Callback function
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove change listener
   * @param {Function} callback - Callback function
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }
}

// ========================================
// Firebase Storage Alternative
// ========================================

/**
 * Upload file to Firebase Storage as alternative to Google Drive
 * @param {File} file - File to upload
 * @param {string} path - Storage path
 * @returns {Promise<Object>} Upload result
 */
export async function uploadToFirebaseStorage(file, path = 'uploads') {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const storagePath = `${path}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Save metadata to Firestore
    const metadataRef = await addDoc(collection(db, 'uploadedFiles'), {
      fileName: file.name,
      storagePath,
      downloadURL,
      mimeType: file.type,
      size: file.size,
      uploadedAt: serverTimestamp(),
      status: 'pending' // pending, processing, completed, error
    });

    console.log('[Storage] File uploaded:', fileName);
    return {
      id: metadataRef.id,
      fileName: file.name,
      storagePath,
      downloadURL
    };

  } catch (error) {
    console.error('[Storage] Upload error:', error);
    throw error;
  }
}

/**
 * List files from Firebase Storage
 * @param {string} path - Storage path
 * @returns {Promise<Array>} Array of file objects
 */
export async function listFirebaseStorageFiles(path = 'uploads') {
  try {
    const listRef = ref(storage, path);
    const result = await listAll(listRef);

    const files = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          downloadURL: url
        };
      })
    );

    return files;

  } catch (error) {
    console.error('[Storage] List error:', error);
    return [];
  }
}

// ========================================
// Sync Service
// ========================================

/**
 * Calculate statistics from orders
 * @param {Array} orders - Array of order objects
 * @returns {Object} Statistics object
 */
function calculateStatistics(orders) {
  const stats = {
    totalOrders: orders.length,
    totalQuantity: 0,
    completedQuantity: 0,
    shippedQuantity: 0,
    delayedOrders: 0,
    delayedQuantity: 0,
    warningOrders: 0,
    warningQuantity: 0,
    pendingOrders: 0,
    partialOrders: 0,
    completedOrders: 0
  };

  orders.forEach(order => {
    const qty = order.quantity || order.ttl_qty || 0;

    // Get production data safely
    const whIn = order.production?.wh_in?.completed || order.wh_in || order.WH_IN || 0;
    const whOut = order.production?.wh_out?.completed || order.wh_out || order.WH_OUT || 0;

    stats.totalQuantity += qty;
    stats.completedQuantity += whIn;
    stats.shippedQuantity += whOut;

    // Status counting
    if (qty > 0 && whIn >= qty) {
      stats.completedOrders++;
    } else if (whIn > 0) {
      stats.partialOrders++;
    } else {
      stats.pendingOrders++;
    }

    // Check delayed (SDD > CRD)
    if (order.sddValue && order.crd) {
      const sdd = new Date(order.sddValue);
      const crd = new Date(order.crd);
      if (sdd > crd && whOut < qty) {
        stats.delayedOrders++;
        stats.delayedQuantity += qty;
      }
    }

    // Check warning (CRD within 3 days)
    if (order.crd) {
      const crd = new Date(order.crd);
      const today = new Date();
      const daysUntil = Math.ceil((crd - today) / (1000 * 60 * 60 * 24));
      if (daysUntil >= 0 && daysUntil <= 3 && whOut < qty) {
        stats.warningOrders++;
        stats.warningQuantity += qty;
      }
    }
  });

  // Calculate rates
  stats.completionRate = stats.totalQuantity > 0
    ? ((stats.completedQuantity / stats.totalQuantity) * 100).toFixed(2)
    : '0.00';
  stats.delayRate = stats.totalOrders > 0
    ? ((stats.delayedOrders / stats.totalOrders) * 100).toFixed(2)
    : '0.00';
  stats.shippedRate = stats.totalQuantity > 0
    ? ((stats.shippedQuantity / stats.totalQuantity) * 100).toFixed(2)
    : '0.00';

  return stats;
}

/**
 * Sync uploaded file data to Firestore production cache
 * @param {string} fileId - File document ID
 * @param {Object} parsedData - Parsed data from file
 * @param {string} factoryId - Factory ID
 */
export async function syncToProductionCache(fileId, parsedData, factoryId = 'ALL_FACTORIES') {
  try {
    const cacheRef = doc(db, 'productionCache', factoryId);
    const orders = parsedData.orders || [];

    // Calculate statistics from orders
    const statistics = orders.length > 0 ? calculateStatistics(orders) : parsedData.statistics || {};

    // Prepare cache data (without orders to reduce size - orders are in context)
    const cacheData = {
      statistics,
      dailyData: parsedData.dailyData || [],
      modelData: parsedData.modelData || [],
      processData: parsedData.processData || {},
      orderCount: orders.length,
      sourceFileId: fileId,
      updatedAt: serverTimestamp(),
      lastSyncAt: serverTimestamp()
    };

    await setDoc(cacheRef, cacheData, { merge: true });
    console.log('[Sync] Production cache updated for', factoryId, '- Stats:', statistics);

    // Also save to monthly history for historical comparison
    await saveMonthlySnapshot(factoryId, statistics);

    // Update file status
    if (fileId) {
      const fileRef = doc(db, 'uploadedFiles', fileId);
      await updateDoc(fileRef, {
        status: 'completed',
        processedAt: serverTimestamp()
      });
    }

    return true;

  } catch (error) {
    console.error('[Sync] Error syncing to cache:', error);
    throw error;
  }
}

/**
 * Save monthly snapshot for historical comparison
 * @param {string} factoryId - Factory ID
 * @param {Object} statistics - Current statistics
 */
export async function saveMonthlySnapshot(factoryId, statistics) {
  try {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const historyRef = doc(db, 'productionHistory', factoryId, 'monthly', monthKey);

    await setDoc(historyRef, {
      ...statistics,
      monthKey,
      factoryId,
      snapshotDate: serverTimestamp()
    }, { merge: true });

    console.log('[Sync] Monthly snapshot saved for', factoryId, ':', monthKey);
    return true;
  } catch (error) {
    console.warn('[Sync] Could not save monthly snapshot:', error.message);
    return false;
  }
}

/**
 * Get sync status
 * @param {string} factoryId - Factory ID
 * @returns {Promise<Object>} Sync status
 */
export async function getSyncStatus(factoryId = 'ALL_FACTORIES') {
  try {
    const cacheRef = doc(db, 'productionCache', factoryId);
    const docSnap = await getDoc(cacheRef);

    if (!docSnap.exists()) {
      return { synced: false, lastSync: null };
    }

    const data = docSnap.data();
    return {
      synced: true,
      lastSync: data.lastSyncAt?.toDate?.() || null,
      sourceFileId: data.sourceFileId || null,
      orderCount: data.orders?.length || 0
    };

  } catch (error) {
    console.error('[Sync] Error getting status:', error);
    return { synced: false, error: error.message };
  }
}

// ========================================
// Exports
// ========================================

export const googleDrive = new GoogleDriveService();

export default googleDrive;

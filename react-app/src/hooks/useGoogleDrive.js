/**
 * @fileoverview Google Drive Integration Hook
 * Handles OAuth authentication and automatic file monitoring for Google Drive.
 *
 * @module hooks/useGoogleDrive
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { googleDrive, syncToProductionCache } from '../services/googleDrive';
import * as XLSX from 'xlsx';

// Configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_DRIVE_OAUTH_CLIENT_ID || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

// Polling interval (5 minutes for production, 30 seconds for development)
const POLL_INTERVAL = import.meta.env.DEV ? 30000 : 300000;

/**
 * Custom hook for Google Drive integration
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoWatch - Enable auto-watching for file changes
 * @param {Function} options.onDataUpdate - Callback when new data is loaded
 * @returns {Object} Google Drive state and methods
 */
export function useGoogleDrive({ autoWatch = false, onDataUpdate } = {}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [watchStatus, setWatchStatus] = useState('idle'); // idle, watching, error

  const tokenClientRef = useRef(null);
  const watchingRef = useRef(false);

  /**
   * Load Google Identity Services script
   */
  const loadGoogleScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }, []);

  /**
   * Initialize Google Drive service
   */
  const initialize = useCallback(async () => {
    if (isInitialized) return true;

    try {
      setIsLoading(true);
      setError(null);

      // Check if required env vars are set
      if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
        console.warn('[useGoogleDrive] Missing Google API credentials');
        setError('Google Drive 설정이 필요합니다.');
        return false;
      }

      // Load Google Identity Services
      await loadGoogleScript();

      // Initialize Google Drive service
      await googleDrive.initialize();

      // Initialize token client for OAuth
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            console.error('[useGoogleDrive] Token error:', response.error);
            setError('인증 실패: ' + response.error);
            setIsAuthenticated(false);
            return;
          }

          // Set access token
          googleDrive.setAccessToken(response.access_token);
          setIsAuthenticated(true);
          setError(null);
          console.log('[useGoogleDrive] Authenticated successfully');

          // Refresh files list
          refreshFiles();

          // Start watching if autoWatch is enabled
          if (autoWatch && !watchingRef.current) {
            startWatching();
          }
        }
      });

      setIsInitialized(true);
      console.log('[useGoogleDrive] Initialized');
      return true;

    } catch (err) {
      console.error('[useGoogleDrive] Init error:', err);
      setError('초기화 실패: ' + err.message);
      return false;

    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, loadGoogleScript, autoWatch]);

  /**
   * Request Google Drive authentication
   */
  const authenticate = useCallback(async () => {
    if (!isInitialized) {
      const success = await initialize();
      if (!success) return;
    }

    if (!tokenClientRef.current) {
      setError('인증 클라이언트가 초기화되지 않았습니다.');
      return;
    }

    try {
      setIsLoading(true);
      // Request access token
      tokenClientRef.current.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      console.error('[useGoogleDrive] Auth error:', err);
      setError('인증 요청 실패: ' + err.message);
      setIsLoading(false);
    }
  }, [isInitialized, initialize]);

  /**
   * Refresh files list from Google Drive
   */
  const refreshFiles = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const driveFiles = await googleDrive.listFiles();
      setFiles(driveFiles);
      setLastSync(new Date());
      console.log('[useGoogleDrive] Files refreshed:', driveFiles.length);
    } catch (err) {
      console.error('[useGoogleDrive] Refresh error:', err);
      setError('파일 목록 새로고침 실패');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Download and parse Excel file from Google Drive
   */
  const downloadAndParseFile = useCallback(async (fileId, fileName) => {
    if (!isAuthenticated) {
      throw new Error('인증이 필요합니다');
    }

    try {
      setIsLoading(true);
      console.log('[useGoogleDrive] Downloading file:', fileName);

      // Download file
      const arrayBuffer = await googleDrive.downloadFile(fileId);

      // Parse Excel file
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('[useGoogleDrive] Parsed', jsonData.length, 'rows');

      return {
        fileName,
        sheetName,
        data: jsonData,
        rowCount: jsonData.length
      };

    } catch (err) {
      console.error('[useGoogleDrive] Parse error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Handle file changes detected
   */
  const handleFileChanges = useCallback(async (event) => {
    if (event.type !== 'change' || !event.files?.length) return;

    console.log('[useGoogleDrive] File changes detected:', event.files.length);

    try {
      // Get the most recently modified Excel file
      const excelFile = event.files.find(f =>
        f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
      );

      if (!excelFile) {
        console.log('[useGoogleDrive] No Excel files in changes');
        return;
      }

      // Download and parse the file
      const parsed = await downloadAndParseFile(excelFile.id, excelFile.name);

      // Sync to Firestore cache
      await syncToProductionCache(null, { orders: parsed.data });

      // Notify callback
      if (onDataUpdate) {
        onDataUpdate(parsed);
      }

      setLastSync(new Date());
      console.log('[useGoogleDrive] Data synced successfully');

    } catch (err) {
      console.error('[useGoogleDrive] Sync error:', err);
      setError('데이터 동기화 실패: ' + err.message);
    }
  }, [downloadAndParseFile, onDataUpdate]);

  /**
   * Start watching for file changes
   */
  const startWatching = useCallback(() => {
    if (!isAuthenticated || watchingRef.current) return;

    googleDrive.startWatching(handleFileChanges, POLL_INTERVAL);
    watchingRef.current = true;
    setWatchStatus('watching');
    console.log('[useGoogleDrive] Started watching, interval:', POLL_INTERVAL);
  }, [isAuthenticated, handleFileChanges]);

  /**
   * Stop watching for file changes
   */
  const stopWatching = useCallback(() => {
    googleDrive.stopWatching();
    watchingRef.current = false;
    setWatchStatus('idle');
    console.log('[useGoogleDrive] Stopped watching');
  }, []);

  /**
   * Manually sync data from Google Drive
   */
  const syncNow = useCallback(async () => {
    if (!isAuthenticated) {
      setError('먼저 Google Drive에 로그인하세요');
      return;
    }

    try {
      setIsLoading(true);
      const driveFiles = await googleDrive.listFiles();

      if (driveFiles.length === 0) {
        setError('폴더에 파일이 없습니다');
        return;
      }

      // Get the most recent Excel file
      const excelFile = driveFiles.find(f =>
        f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
      );

      if (!excelFile) {
        setError('Excel 파일을 찾을 수 없습니다');
        return;
      }

      // Download and parse
      const parsed = await downloadAndParseFile(excelFile.id, excelFile.name);

      // Sync to cache
      await syncToProductionCache(null, { orders: parsed.data });

      // Notify callback
      if (onDataUpdate) {
        onDataUpdate(parsed);
      }

      setLastSync(new Date());
      setError(null);
      console.log('[useGoogleDrive] Manual sync completed');

    } catch (err) {
      console.error('[useGoogleDrive] Sync error:', err);
      setError('동기화 실패: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, downloadAndParseFile, onDataUpdate]);

  // Auto-initialize on mount
  useEffect(() => {
    if (GOOGLE_CLIENT_ID && GOOGLE_API_KEY) {
      initialize();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchingRef.current) {
        googleDrive.stopWatching();
      }
    };
  }, []);

  return {
    // State
    isInitialized,
    isAuthenticated,
    isLoading,
    error,
    files,
    lastSync,
    watchStatus,

    // Methods
    initialize,
    authenticate,
    refreshFiles,
    downloadAndParseFile,
    startWatching,
    stopWatching,
    syncNow,

    // Service instance
    service: googleDrive
  };
}

export default useGoogleDrive;

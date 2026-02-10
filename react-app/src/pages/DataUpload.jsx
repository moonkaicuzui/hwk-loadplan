/**
 * @fileoverview Data Upload Page
 * Allows users to upload Excel/CSV files to sync with the dashboard.
 *
 * @module pages/DataUpload
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  FileSpreadsheet,
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  CloudUpload,
  Table,
  Settings,
  Cloud,
  Play,
  Pause,
  LogIn,
  FolderOpen
} from 'lucide-react';
import FileUploader from '../components/common/FileUploader';
import { parseFile, previewFile, getExcelSheets } from '../services/dataParser';
import { uploadToFirebaseStorage, syncToProductionCache, getSyncStatus } from '../services/googleDrive';
import { useOrdersContext } from '../contexts/OrdersContext';
import { useGoogleDrive } from '../hooks/useGoogleDrive';

/**
 * DataUpload Page Component
 */
export default function DataUpload() {
  const { t } = useTranslation();
  const { setOrders } = useOrdersContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [preview, setPreview] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [sheets, setSheets] = useState([]);
  const [uploadMode, setUploadMode] = useState('local'); // local, firebase, drive
  const [syncStatus, setSyncStatus] = useState(null);

  // Google Drive integration
  const handleDriveDataUpdate = useCallback((parsed) => {
    console.log('[DataUpload] Google Drive data received:', parsed);
    // Update dashboard with new data
    if (parsed.data && setOrders) {
      setOrders(parsed.data);
      setSuccess({
        orderCount: parsed.data.length,
        source: 'Google Drive',
        fileName: parsed.fileName
      });
    }
  }, [setOrders]);

  const {
    isInitialized: driveInitialized,
    isAuthenticated: driveAuthenticated,
    isLoading: driveLoading,
    error: driveError,
    files: driveFiles,
    lastSync: driveLastSync,
    watchStatus,
    authenticate: driveAuthenticate,
    refreshFiles: driveRefreshFiles,
    startWatching: driveStartWatching,
    stopWatching: driveStopWatching,
    syncNow: driveSyncNow
  } = useGoogleDrive({
    autoWatch: false,
    onDataUpdate: handleDriveDataUpdate
  });

  /**
   * Handle file selection for preview
   */
  const handleFileSelect = useCallback(async (file) => {
    setError(null);
    setSuccess(null);
    setParsedData(null);
    setPreview(null);

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Get sheet names for Excel files
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const sheetNames = getExcelSheets(arrayBuffer);
        setSheets(sheetNames);
        if (sheetNames.length > 0) {
          setSelectedSheet(sheetNames[0]);
        }
      } else {
        setSheets([]);
        setSelectedSheet('');
      }

      // Generate preview
      const previewData = previewFile(arrayBuffer, file.name, 5);
      setPreview(previewData);

    } catch (err) {
      console.error('[DataUpload] Preview error:', err);
      setError('파일 미리보기 중 오류가 발생했습니다: ' + err.message);
    }
  }, []);

  /**
   * Handle file upload and parsing
   */
  const handleUpload = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Parse file
      const data = parseFile(arrayBuffer, file.name, {
        sheetName: selectedSheet || undefined
      });

      setParsedData(data);

      // Update dashboard context with new orders
      setOrders(data.orders);

      // Sync to Firebase if enabled
      if (uploadMode === 'firebase') {
        // Upload to Firebase Storage
        const uploadResult = await uploadToFirebaseStorage(file, 'production-data');

        // Sync parsed data to Firestore cache
        await syncToProductionCache(uploadResult.id, data, 'ALL_FACTORIES');
      }

      setSuccess({
        orderCount: data.orders.length,
        statistics: data.statistics,
        metadata: data.metadata
      });

      // Refresh sync status
      const status = await getSyncStatus();
      setSyncStatus(status);

    } catch (err) {
      console.error('[DataUpload] Upload error:', err);
      setError('파일 처리 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedSheet, uploadMode, setOrders]);

  /**
   * Handle factory-specific upload
   */
  const handleFactoryUpload = useCallback(async (file, factoryId) => {
    setLoading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Parse with factory filter
      const data = parseFile(arrayBuffer, file.name, {
        sheetName: selectedSheet || undefined,
        factory: factoryId
      });

      // Sync to specific factory cache
      await syncToProductionCache(null, data, `FACTORY_${factoryId}`);

      setSuccess({
        orderCount: data.orders.length,
        factoryId
      });

    } catch (err) {
      setError('공장별 업로드 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedSheet]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-500" />
            {t('upload.title', '데이터 업로드')}
          </h1>
          <p className="text-secondary mt-1">
            {t('upload.description', 'Excel 또는 CSV 파일을 업로드하여 대시보드 데이터를 업데이트합니다.')}
          </p>
        </div>
      </div>

      {/* Google Drive Auto-Sync Panel */}
      <div className="bg-card rounded-xl shadow-sm p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-500" />
          {t('upload.googleDrive', 'Google Drive 자동 동기화')}
        </h3>

        {!driveAuthenticated ? (
          <div className="text-center py-6">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-secondary mb-4">
              {t('upload.driveConnectDesc', 'Google Drive에 연결하여 자동으로 파일을 동기화합니다.')}
            </p>
            <button
              onClick={driveAuthenticate}
              disabled={driveLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {driveLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {t('upload.connectDrive', 'Google Drive 연결')}
            </button>
            {driveError && (
              <p className="mt-3 text-sm text-red-500">{driveError}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-700 dark:text-green-300">
                  {t('upload.driveConnected', 'Google Drive 연결됨')}
                </span>
              </div>
              <span className="text-sm text-secondary">
                {driveFiles.length}개 파일
              </span>
            </div>

            {/* Watch Status & Controls */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {t('upload.autoSync', '자동 동기화')}
                </p>
                <p className="text-sm text-secondary">
                  {watchStatus === 'watching'
                    ? t('upload.watchingActive', '파일 변경 감시 중 (30초 간격)')
                    : t('upload.watchingInactive', '파일 변경 감시 비활성화')}
                </p>
              </div>
              <div className="flex gap-2">
                {watchStatus === 'watching' ? (
                  <button
                    onClick={driveStopWatching}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    {t('upload.stopWatch', '중지')}
                  </button>
                ) : (
                  <button
                    onClick={driveStartWatching}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    {t('upload.startWatch', '시작')}
                  </button>
                )}
                <button
                  onClick={driveSyncNow}
                  disabled={driveLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${driveLoading ? 'animate-spin' : ''}`} />
                  {t('upload.syncNow', '지금 동기화')}
                </button>
              </div>
            </div>

            {/* Last Sync Info */}
            {driveLastSync && (
              <div className="text-sm text-secondary">
                {t('upload.lastSync', '마지막 동기화')}: {driveLastSync.toLocaleString()}
              </div>
            )}

            {/* Drive Files List */}
            {driveFiles.length > 0 && (
              <div className="border border-theme rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-theme">
                  <p className="text-sm font-medium">
                    {t('upload.driveFiles', 'Google Drive 파일 목록')}
                  </p>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {driveFiles.slice(0, 10).map(file => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between px-4 py-2 border-b border-theme last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-green-500" />
                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                      </div>
                      <span className="text-xs text-secondary">
                        {new Date(file.modifiedTime).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {driveError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400">
                {driveError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Mode Selection */}
      <div className="bg-card rounded-xl shadow-sm p-4">
        <h3 className="font-medium mb-3">{t('upload.mode', '업로드 모드')}</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setUploadMode('local')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              uploadMode === 'local'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-theme hover:border-blue-300'
            }`}
          >
            <FileSpreadsheet className={`w-6 h-6 mx-auto mb-2 ${
              uploadMode === 'local' ? 'text-blue-500' : 'text-secondary'
            }`} />
            <p className="font-medium text-sm">{t('upload.localMode', '로컬 미리보기')}</p>
            <p className="text-xs text-secondary mt-1">{t('upload.localDesc', '브라우저에서만 처리')}</p>
          </button>

          <button
            onClick={() => setUploadMode('firebase')}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              uploadMode === 'firebase'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-theme hover:border-blue-300'
            }`}
          >
            <CloudUpload className={`w-6 h-6 mx-auto mb-2 ${
              uploadMode === 'firebase' ? 'text-blue-500' : 'text-secondary'
            }`} />
            <p className="font-medium text-sm">{t('upload.firebaseMode', 'Firebase 동기화')}</p>
            <p className="text-xs text-secondary mt-1">{t('upload.firebaseDesc', '클라우드에 저장 및 동기화')}</p>
          </button>
        </div>
      </div>

      {/* File Uploader */}
      <div className="bg-card rounded-xl shadow-sm p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-blue-500" />
          {t('upload.selectFile', '파일 선택')}
        </h3>

        <FileUploader
          onFileSelect={handleFileSelect}
          onUpload={handleUpload}
          loading={loading}
          error={error}
          success={success}
          acceptedTypes={['.xlsx', '.xls', '.csv']}
        />
      </div>

      {/* Sheet Selection (for Excel files) */}
      {sheets.length > 1 && (
        <div className="bg-card rounded-xl shadow-sm p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            {t('upload.sheetSelect', '시트 선택')}
          </h3>
          <select
            value={selectedSheet}
            onChange={(e) => setSelectedSheet(e.target.value)}
            className="w-full p-2 border border-theme rounded-lg bg-primary"
          >
            {sheets.map(sheet => (
              <option key={sheet} value={sheet}>{sheet}</option>
            ))}
          </select>
        </div>
      )}

      {/* Preview Table */}
      {preview && (
        <div className="bg-card rounded-xl shadow-sm p-4 overflow-hidden">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Table className="w-5 h-5 text-green-500" />
            {t('upload.preview', '데이터 미리보기')}
            <span className="text-sm text-secondary">
              ({preview.totalRows.toLocaleString()} {t('upload.rows', '행')})
            </span>
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-theme">
                  {preview.columns.slice(0, 8).map(col => (
                    <th key={col} className="px-3 py-2 text-left font-medium">
                      <div>{col}</div>
                      {preview.mappedColumns[col] && (
                        <div className="text-xs text-blue-500 font-normal">
                          → {preview.mappedColumns[col]}
                        </div>
                      )}
                    </th>
                  ))}
                  {preview.columns.length > 8 && (
                    <th className="px-3 py-2 text-secondary">
                      +{preview.columns.length - 8} more
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className="border-b border-theme last:border-0">
                    {preview.columns.slice(0, 8).map(col => (
                      <td key={col} className="px-3 py-2 truncate max-w-[150px]">
                        {row[col] || '-'}
                      </td>
                    ))}
                    {preview.columns.length > 8 && (
                      <td className="px-3 py-2 text-secondary">...</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Parsed Data Statistics */}
      {parsedData && (
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-500" />
            {t('upload.parsedStats', '파싱 결과')}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-secondary">{t('upload.totalOrders', '총 주문')}</p>
              <p className="text-2xl font-bold text-blue-600">
                {parsedData.statistics.totalOrders.toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-secondary">{t('upload.totalQuantity', '총 수량')}</p>
              <p className="text-2xl font-bold text-green-600">
                {parsedData.statistics.totalQuantity.toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-secondary">{t('upload.delayedOrders', '지연 주문')}</p>
              <p className="text-2xl font-bold text-red-600">
                {parsedData.statistics.delayedOrders.toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-secondary">{t('upload.completionRate', '완료율')}</p>
              <p className="text-2xl font-bold text-yellow-600">
                {parsedData.statistics.completionRate}%
              </p>
            </div>
          </div>

          {/* Validation Errors/Warnings */}
          {parsedData.metadata.validationErrors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h4 className="font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {t('upload.errors', '오류')} ({parsedData.metadata.validationErrors.length})
              </h4>
              <ul className="mt-2 text-sm text-red-600 dark:text-red-400 space-y-1">
                {parsedData.metadata.validationErrors.slice(0, 5).map((err, i) => (
                  <li key={i}>행 {err.row}: {err.error}</li>
                ))}
                {parsedData.metadata.validationErrors.length > 5 && (
                  <li>... +{parsedData.metadata.validationErrors.length - 5}개 더</li>
                )}
              </ul>
            </div>
          )}

          {parsedData.metadata.warnings.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h4 className="font-medium text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                <Info className="w-4 h-4" />
                {t('upload.warnings', '경고')} ({parsedData.metadata.warnings.length})
              </h4>
              <ul className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                {parsedData.metadata.warnings.slice(0, 5).map((warn, i) => (
                  <li key={i}>행 {warn.row}: {warn.warning}</li>
                ))}
                {parsedData.metadata.warnings.length > 5 && (
                  <li>... +{parsedData.metadata.warnings.length - 5}개 더</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Sync Status */}
      {syncStatus && (
        <div className="bg-card rounded-xl shadow-sm p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-500" />
            {t('upload.syncStatus', '동기화 상태')}
          </h3>

          <div className="flex items-center gap-4">
            {syncStatus.synced ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-600">{t('upload.synced', '동기화됨')}</p>
                  <p className="text-sm text-secondary">
                    {syncStatus.lastSync && `마지막 동기화: ${new Date(syncStatus.lastSync).toLocaleString()}`}
                  </p>
                  <p className="text-sm text-secondary">
                    {syncStatus.orderCount && `${syncStatus.orderCount.toLocaleString()}개 주문`}
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-yellow-600">{t('upload.notSynced', '동기화 필요')}</p>
                  <p className="text-sm text-secondary">
                    {t('upload.uploadToSync', '파일을 업로드하여 동기화하세요.')}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
        <h4 className="font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <Info className="w-4 h-4" />
          {t('upload.instructions', '사용 안내')}
        </h4>
        <ul className="mt-2 text-sm text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>{t('upload.instruction1', 'Excel(.xlsx, .xls) 또는 CSV 파일을 업로드할 수 있습니다.')}</li>
          <li>{t('upload.instruction2', '파일의 첫 번째 행은 컬럼 헤더여야 합니다.')}</li>
          <li>{t('upload.instruction3', 'PO#, Qty, CRD, SDD 등의 컬럼이 자동으로 매핑됩니다.')}</li>
          <li>{t('upload.instruction4', 'Firebase 모드에서는 데이터가 클라우드에 저장되어 다른 기기에서도 접근 가능합니다.')}</li>
          <li>{t('upload.instruction5', 'Google Drive에 파일을 업로드하면 자동으로 시스템에 반영됩니다.')}</li>
        </ul>
      </div>
    </div>
  );
}

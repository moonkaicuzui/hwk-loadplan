/**
 * @fileoverview File Uploader Component
 * Handles file upload with drag-and-drop support for Excel/CSV files.
 *
 * @module components/common/FileUploader
 */

import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';

/**
 * FileUploader Component
 * @param {Object} props
 * @param {Function} props.onFileSelect - Callback when file is selected
 * @param {Function} props.onUpload - Callback to upload file
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {Object} props.success - Success state
 * @param {string[]} props.acceptedTypes - Accepted file types
 */
export default function FileUploader({
  onFileSelect,
  onUpload,
  loading = false,
  error = null,
  success = null,
  acceptedTypes = ['.xlsx', '.xls', '.csv'],
  maxSize = 10 * 1024 * 1024 // 10MB
}) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = useCallback((file) => {
    setValidationError(null);

    // Check file size
    if (file.size > maxSize) {
      setValidationError(`파일 크기가 너무 큽니다. 최대 ${Math.round(maxSize / 1024 / 1024)}MB까지 가능합니다.`);
      return false;
    }

    // Check file type
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    const isValidType = acceptedTypes.some(type =>
      type.toLowerCase() === extension ||
      file.type.includes(type.replace('.', ''))
    );

    if (!isValidType) {
      setValidationError(`지원하지 않는 파일 형식입니다. ${acceptedTypes.join(', ')} 파일만 가능합니다.`);
      return false;
    }

    return true;
  }, [acceptedTypes, maxSize]);

  const handleFileSelect = useCallback((file) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);
    setValidationError(null);

    if (onFileSelect) {
      onFileSelect(file);
    }
  }, [validateFile, onFileSelect]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleUploadClick = useCallback(() => {
    if (selectedFile && onUpload) {
      onUpload(selectedFile);
    }
  }, [selectedFile, onUpload]);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }
          ${loading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={loading}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-lg font-medium">{t('upload.processing', '파일 처리 중...')}</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            <FileSpreadsheet className="w-12 h-12 text-green-500" />
            <div className="flex items-center gap-2">
              <p className="text-lg font-medium">{selectedFile.name}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearFile();
                }}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-secondary">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-12 h-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium">
                {t('upload.dragDrop', '파일을 드래그하거나 클릭하여 선택')}
              </p>
              <p className="text-sm text-secondary mt-1">
                {t('upload.supportedFormats', '지원 형식')}: {acceptedTypes.join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{validationError}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div className="text-sm text-green-700 dark:text-green-300">
            <p className="font-medium">{t('upload.success', '업로드 성공!')}</p>
            {success.orderCount && (
              <p>{t('upload.ordersLoaded', '{{count}}개의 주문이 로드되었습니다.', { count: success.orderCount })}</p>
            )}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !loading && !success && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleUploadClick}
            className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {t('upload.uploadButton', '데이터 업로드')}
          </button>
        </div>
      )}
    </div>
  );
}

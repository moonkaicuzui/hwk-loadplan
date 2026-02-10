/**
 * @fileoverview Validation Banner Component
 * Displays data validation status with severity-based styling.
 *
 * @module components/validation/ValidationBanner
 */

import React, { useState } from 'react';
import { SEVERITY, SEVERITY_LABELS } from '../../services/dataValidator';

/**
 * ValidationBanner - Shows validation status summary
 */
export function ValidationBanner({ validationResult, onShowDetails, onDownloadCSV }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!validationResult) return null;

  const { stats, summary, isValid } = validationResult;
  const { critical, warning, info } = stats;

  // Don't show banner if everything is valid
  if (isValid && warning === 0 && info === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-green-600 dark:text-green-400 text-lg">&#10003;</span>
          <span className="text-green-800 dark:text-green-200 font-medium">
            데이터 검증 완료: 모든 {stats.total}개 레코드 정상
          </span>
        </div>
      </div>
    );
  }

  // Determine banner color based on severity
  const getBannerStyle = () => {
    if (critical > 0) {
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    }
    if (warning > 0) {
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    }
    return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
  };

  const getHeaderStyle = () => {
    if (critical > 0) return 'text-red-800 dark:text-red-200';
    if (warning > 0) return 'text-yellow-800 dark:text-yellow-200';
    return 'text-blue-800 dark:text-blue-200';
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${getBannerStyle()}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {critical > 0 && (
            <span className="text-red-600 dark:text-red-400 text-xl">&#9888;</span>
          )}
          {critical === 0 && warning > 0 && (
            <span className="text-yellow-600 dark:text-yellow-400 text-xl">&#9888;</span>
          )}
          {critical === 0 && warning === 0 && (
            <span className="text-blue-600 dark:text-blue-400 text-xl">&#9432;</span>
          )}

          <div>
            <h3 className={`font-semibold ${getHeaderStyle()}`}>
              {critical > 0 && '데이터 검증 실패'}
              {critical === 0 && warning > 0 && '데이터 검증 경고'}
              {critical === 0 && warning === 0 && '데이터 검증 정보'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              총 {stats.total}개 레코드 중 {stats.total - stats.valid}개 이슈 발견
              ({summary.errorRate})
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {isExpanded ? '접기' : '상세보기'}
          </button>
          {onDownloadCSV && (
            <button
              onClick={onDownloadCSV}
              className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              CSV 다운로드
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex gap-4 mt-3">
        {critical > 0 && (
          <div className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: SEVERITY_LABELS[SEVERITY.CRITICAL].color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              심각: {critical}
            </span>
          </div>
        )}
        {warning > 0 && (
          <div className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: SEVERITY_LABELS[SEVERITY.WARNING].color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              경고: {warning}
            </span>
          </div>
        )}
        {info > 0 && (
          <div className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: SEVERITY_LABELS[SEVERITY.INFO].color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              정보: {info}
            </span>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <ValidationErrorSummary validationResult={validationResult} />
        </div>
      )}
    </div>
  );
}

/**
 * ValidationErrorSummary - Shows error details grouped by type
 */
function ValidationErrorSummary({ validationResult }) {
  const { errors } = validationResult;

  // Group errors by code
  const groupedErrors = errors.reduce((acc, error) => {
    if (!acc[error.code]) {
      acc[error.code] = {
        code: error.code,
        message: error.message.split(':')[0],
        severity: error.severity,
        count: 0,
        examples: []
      };
    }
    acc[error.code].count++;
    if (acc[error.code].examples.length < 3) {
      acc[error.code].examples.push({
        row: error.row,
        field: error.field,
        value: error.value
      });
    }
    return acc;
  }, {});

  const sortedGroups = Object.values(groupedErrors).sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <div className="space-y-3">
      {sortedGroups.map(group => (
        <div
          key={group.code}
          className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: SEVERITY_LABELS[group.severity].color }}
              />
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {group.message}
              </span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {group.count}건
            </span>
          </div>

          {/* Example rows */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            {group.examples.map((ex, i) => (
              <div key={i} className="flex gap-2">
                <span className="font-mono">Row {ex.row}:</span>
                <span>{ex.field} = "{ex.value}"</span>
              </div>
            ))}
            {group.count > 3 && (
              <div className="text-gray-400">... 외 {group.count - 3}건</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ValidationBanner;

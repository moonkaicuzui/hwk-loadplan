/**
 * @fileoverview Stage Backlog Chart Component
 * Visualizes backlog (remaining quantity) for each production stage.
 *
 * @module components/charts/StageBacklogChart
 */

import React, { useMemo, memo } from 'react';

/**
 * Stage configuration with colors and Korean labels
 */
const STAGE_CONFIG = [
  { key: 'S_CUT', label: '재단', color: '#3B82F6', fields: ['S_CUT', 'S.Cut Bal', '__EMPTY_40', '__EMPTY_38', '__EMPTY_53', '__EMPTY_52'] },
  { key: 'PRE_SEW', label: '선봉', color: '#8B5CF6', fields: ['PRE_SEW', 'Pre-Sew Bal', 'Pre-Sew Bal.', '__EMPTY_41', '__EMPTY_39', '__EMPTY_54', '__EMPTY_53'] },
  { key: 'SEW_INPUT', label: '재봉투입', color: '#EC4899', fields: ['SEW_INPUT', 'Sew input Bal', '__EMPTY_42', '__EMPTY_40', '__EMPTY_55', '__EMPTY_54'] },
  { key: 'SEW_BAL', label: '재봉', color: '#F59E0B', fields: ['SEW_BAL', 'Sew Bal', 'PRODUCTION STATUS', '__EMPTY_43', '__EMPTY_42', '__EMPTY_56', '__EMPTY_55'] },
  { key: 'S_FIT', label: '핏팅', color: '#10B981', fields: ['S_FIT', 'S/Fit Bal', '__EMPTY_50', '__EMPTY_49', '__EMPTY_64', '__EMPTY_62'] },
  { key: 'ASS_BAL', label: '제화', color: '#06B6D4', fields: ['ASS_BAL', 'Ass Bal', '__EMPTY_51', '__EMPTY_50', '__EMPTY_65', '__EMPTY_63'] },
  { key: 'WH_IN', label: '제품창고 입고', color: '#6366F1', fields: ['WH_IN', 'W.H IN BAL', '__EMPTY_54', '__EMPTY_53', '__EMPTY_68', '__EMPTY_66'] },
  { key: 'WH_OUT', label: '제품창고 출고', color: '#EF4444', fields: ['WH_OUT', 'W.H OUT BAL', '__EMPTY_55', '__EMPTY_54', '__EMPTY_69', '__EMPTY_67'] }
];

/**
 * Parse number from various formats
 */
function parseNumber(value) {
  if (value === undefined || value === null || value === '') return 0;
  const cleaned = String(value).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Get stage value from order using multiple possible field names
 */
function getStageValue(order, fields) {
  for (const field of fields) {
    if (order[field] !== undefined && order[field] !== '') {
      const val = parseNumber(order[field]);
      if (val > 0) return val;
    }
  }
  return 0;
}

/**
 * Calculate stage backlog from orders
 */
function calculateStageBacklog(orders, dynamicColumnMap = {}) {
  const backlog = {};

  STAGE_CONFIG.forEach(stage => {
    let total = 0;

    orders.forEach(order => {
      // Try dynamic column map first
      const dynamicField = dynamicColumnMap[stage.key.toLowerCase() + 'Column'];
      if (dynamicField && order[dynamicField] !== undefined) {
        total += parseNumber(order[dynamicField]);
      } else {
        // Fall back to standard field names
        total += getStageValue(order, stage.fields);
      }
    });

    backlog[stage.key] = {
      ...stage,
      total,
      formattedTotal: total.toLocaleString()
    };
  });

  return backlog;
}

/**
 * StageBacklogChart - Horizontal bar chart showing backlog per stage
 */
export const StageBacklogChart = memo(function StageBacklogChart({ orders = [], dynamicColumnMap = {}, title = '공정별 적체량', showLegend = true }) {
  const backlog = useMemo(
    () => calculateStageBacklog(orders, dynamicColumnMap),
    [orders, dynamicColumnMap]
  );

  const maxValue = useMemo(
    () => Math.max(...Object.values(backlog).map(b => b.total), 1),
    [backlog]
  );

  const totalBacklog = useMemo(
    () => Object.values(backlog).reduce((sum, b) => sum + b.total, 0),
    [backlog]
  );

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{title}</h3>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          데이터가 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          총 적체량: <span className="font-semibold text-gray-700 dark:text-gray-300">{totalBacklog.toLocaleString()}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-3">
        {STAGE_CONFIG.map(stage => {
          const data = backlog[stage.key];
          const percentage = maxValue > 0 ? (data.total / maxValue * 100) : 0;
          const isHighest = data.total === maxValue && data.total > 0;

          return (
            <div key={stage.key} className="group">
              {/* Label and Value */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stage.label}
                  </span>
                  {isHighest && (
                    <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">
                      병목
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {data.formattedTotal}
                </span>
              </div>

              {/* Bar */}
              <div className="relative h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: stage.color,
                    minWidth: data.total > 0 ? '8px' : '0'
                  }}
                />
                {/* Percentage label inside bar */}
                {percentage > 15 && (
                  <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs text-white font-medium">
                    {percentage.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottleneck Alert */}
      {(() => {
        const sortedStages = Object.values(backlog).sort((a, b) => b.total - a.total);
        const bottleneck = sortedStages[0];
        const secondHighest = sortedStages[1];

        if (bottleneck && bottleneck.total > 0 && secondHighest) {
          const ratio = secondHighest.total > 0
            ? ((bottleneck.total / secondHighest.total - 1) * 100).toFixed(0)
            : 100;

          if (parseFloat(ratio) > 20) {
            return (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 dark:text-yellow-400">&#9888;</span>
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      병목 감지: {bottleneck.label} 공정
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      다음 공정 대비 {ratio}% 더 많은 적체량
                      ({bottleneck.formattedTotal} vs {secondHighest.formattedTotal})
                    </p>
                  </div>
                </div>
              </div>
            );
          }
        }
        return null;
      })()}

      {/* Legend */}
      {showLegend && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            * 적체량 = 해당 공정 이후 미처리 수량 (Balance)
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            * 병목 = 가장 높은 적체량을 가진 공정 (다음 공정 대비 20% 이상 차이 시 경고)
          </p>
        </div>
      )}
    </div>
  );
});

/**
 * StageBacklogMini - Compact version for dashboard cards
 */
export const StageBacklogMini = memo(function StageBacklogMini({ orders = [], dynamicColumnMap = {} }) {
  const backlog = useMemo(
    () => calculateStageBacklog(orders, dynamicColumnMap),
    [orders, dynamicColumnMap]
  );

  const maxValue = useMemo(
    () => Math.max(...Object.values(backlog).map(b => b.total), 1),
    [backlog]
  );

  return (
    <div className="flex items-end gap-1 h-12">
      {STAGE_CONFIG.map(stage => {
        const data = backlog[stage.key];
        const heightPercent = maxValue > 0 ? (data.total / maxValue * 100) : 0;

        return (
          <div
            key={stage.key}
            className="flex-1 rounded-t transition-all duration-300 hover:opacity-80"
            style={{
              height: `${Math.max(heightPercent, 4)}%`,
              backgroundColor: stage.color
            }}
            title={`${stage.label}: ${data.formattedTotal}`}
          />
        );
      })}
    </div>
  );
});

export default StageBacklogChart;

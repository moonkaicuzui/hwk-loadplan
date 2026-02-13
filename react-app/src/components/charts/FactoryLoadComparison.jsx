/**
 * @fileoverview Factory Load Comparison Component
 * Compares workload distribution across factories (A, B, C, D).
 *
 * @module components/charts/FactoryLoadComparison
 */

import React, { useMemo } from 'react';

/**
 * Factory configuration with colors
 */
const FACTORY_CONFIG = {
  A: { label: 'Factory A', color: '#3B82F6', bgColor: 'bg-blue-500' },
  B: { label: 'Factory B', color: '#10B981', bgColor: 'bg-emerald-500' },
  C: { label: 'Factory C', color: '#F59E0B', bgColor: 'bg-amber-500' },
  D: { label: 'Factory D', color: '#8B5CF6', bgColor: 'bg-violet-500' }
};

/**
 * Stage fields for backlog calculation
 */
const BACKLOG_FIELDS = [
  'S_CUT', 'PRE_SEW', 'SEW_INPUT', 'SEW_BAL',
  'S_FIT', 'ASS_BAL', 'WH_IN', 'WH_OUT',
  'S.Cut Bal', 'Pre-Sew Bal', 'Sew input Bal', 'Sew Bal',
  'S/Fit Bal', 'Ass Bal', 'W.H IN BAL', 'W.H OUT BAL'
];

/**
 * Parse numeric value from various formats
 */
function parseNumber(value) {
  if (value === undefined || value === null || value === '') return 0;
  const cleaned = String(value).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Extract factory code from Unit field or filename
 * Unit format: "RAF.01-SEW RA.01" → A
 */
function extractFactory(order) {
  // Try factory field first (set by parser from filename)
  if (order.factory) {
    const match = order.factory.match(/[ABCD]/i);
    if (match) return match[0].toUpperCase();
  }

  // Try Unit field
  const unit = order['Unit'] || order['Factory'] || '';
  const unitMatch = unit.match(/R([ABCD])/i);
  if (unitMatch) return unitMatch[1].toUpperCase();

  return null;
}

/**
 * Calculate total backlog for an order
 */
function calculateBacklog(order, dynamicColumnMap = {}) {
  let totalBacklog = 0;

  // Try standard field names first
  for (const field of BACKLOG_FIELDS) {
    if (order[field] !== undefined) {
      totalBacklog += parseNumber(order[field]);
    }
  }

  // If no backlog found, try dynamic columns
  if (totalBacklog === 0) {
    for (const key of Object.keys(order)) {
      if (key.startsWith('__EMPTY_')) {
        const val = parseNumber(order[key]);
        if (val > 0) {
          // Check if this looks like a balance column (usually larger numbers)
          totalBacklog += val;
        }
      }
    }
  }

  return totalBacklog;
}

/**
 * Calculate factory statistics from orders
 */
function calculateFactoryStats(orders, dynamicColumnMap = {}) {
  const stats = {
    A: { orderCount: 0, totalQty: 0, totalBacklog: 0 },
    B: { orderCount: 0, totalQty: 0, totalBacklog: 0 },
    C: { orderCount: 0, totalQty: 0, totalBacklog: 0 },
    D: { orderCount: 0, totalQty: 0, totalBacklog: 0 }
  };

  orders.forEach(order => {
    const factory = extractFactory(order);
    if (!factory || !stats[factory]) return;

    const qty = parseNumber(order.quantity || order.ttl_qty || order['Q.ty'] || order['Qty']);
    const backlog = calculateBacklog(order, dynamicColumnMap);

    stats[factory].orderCount += 1;
    stats[factory].totalQty += qty;
    stats[factory].totalBacklog += backlog;
  });

  return stats;
}

/**
 * FactoryLoadComparison - Main comparison component
 */
export function FactoryLoadComparison({ orders = [], dynamicColumnMap = {}, title = '공장별 부하 비교' }) {
  const stats = useMemo(
    () => calculateFactoryStats(orders, dynamicColumnMap),
    [orders, dynamicColumnMap]
  );

  const maxValues = useMemo(() => ({
    orderCount: Math.max(...Object.values(stats).map(s => s.orderCount), 1),
    totalQty: Math.max(...Object.values(stats).map(s => s.totalQty), 1),
    totalBacklog: Math.max(...Object.values(stats).map(s => s.totalBacklog), 1)
  }), [stats]);

  const totalOrders = useMemo(
    () => Object.values(stats).reduce((sum, s) => sum + s.orderCount, 0),
    [stats]
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
          총 오더: <span className="font-semibold text-gray-700 dark:text-gray-300">{totalOrders.toLocaleString()}</span>
        </div>
      </div>

      {/* Factory Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(FACTORY_CONFIG).map(([key, config]) => {
          const factoryStats = stats[key];
          const loadPercent = maxValues.totalQty > 0
            ? (factoryStats.totalQty / maxValues.totalQty * 100)
            : 0;

          return (
            <div
              key={key}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border-l-4"
              style={{ borderLeftColor: config.color }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {config.label}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: config.color }}
                >
                  {loadPercent.toFixed(0)}%
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">오더</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {factoryStats.orderCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">수량</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {factoryStats.totalQty.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">적체량</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {factoryStats.totalBacklog.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Bars */}
      <div className="space-y-6">
        {/* Order Count Comparison */}
        <MetricComparison
          label="오더 수"
          stats={stats}
          metric="orderCount"
          maxValue={maxValues.orderCount}
        />

        {/* Quantity Comparison */}
        <MetricComparison
          label="총 수량"
          stats={stats}
          metric="totalQty"
          maxValue={maxValues.totalQty}
        />

        {/* Backlog Comparison */}
        <MetricComparison
          label="적체량"
          stats={stats}
          metric="totalBacklog"
          maxValue={maxValues.totalBacklog}
        />
      </div>

      {/* Load Balance Indicator */}
      <LoadBalanceIndicator stats={stats} />
    </div>
  );
}

/**
 * MetricComparison - Horizontal bar comparison for a single metric
 */
function MetricComparison({ label, stats, metric, maxValue }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <div className="space-y-2">
        {Object.entries(FACTORY_CONFIG).map(([key, config]) => {
          const value = stats[key][metric];
          const percent = maxValue > 0 ? (value / maxValue * 100) : 0;

          return (
            <div key={key} className="flex items-center gap-2">
              <span className="w-16 text-xs text-gray-500 dark:text-gray-400">{config.label}</span>
              <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: config.color,
                    minWidth: value > 0 ? '4px' : '0'
                  }}
                />
              </div>
              <span className="w-20 text-xs text-right font-medium text-gray-700 dark:text-gray-300">
                {value.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * LoadBalanceIndicator - Shows overall load balance status
 */
function LoadBalanceIndicator({ stats }) {
  const values = Object.values(stats).map(s => s.totalQty);
  const nonZeroValues = values.filter(v => v > 0);

  if (nonZeroValues.length < 2) {
    return null;
  }

  const max = Math.max(...nonZeroValues);
  const min = Math.min(...nonZeroValues);
  const avg = nonZeroValues.reduce((a, b) => a + b, 0) / nonZeroValues.length;

  // Calculate coefficient of variation (CV) for balance assessment
  const variance = nonZeroValues.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / nonZeroValues.length;
  const stdDev = Math.sqrt(variance);
  const cv = avg > 0 ? (stdDev / avg * 100) : 0;

  // Determine balance status
  let status, statusColor, statusBg;
  if (cv < 20) {
    status = '균형';
    statusColor = 'text-green-700 dark:text-green-400';
    statusBg = 'bg-green-100 dark:bg-green-900/30';
  } else if (cv < 40) {
    status = '약간 불균형';
    statusColor = 'text-yellow-700 dark:text-yellow-400';
    statusBg = 'bg-yellow-100 dark:bg-yellow-900/30';
  } else {
    status = '불균형';
    statusColor = 'text-red-700 dark:text-red-400';
    statusBg = 'bg-red-100 dark:bg-red-900/30';
  }

  const imbalanceRatio = min > 0 ? ((max / min - 1) * 100).toFixed(0) : '-';

  return (
    <div className={`mt-6 p-4 rounded-lg ${statusBg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${statusColor}`}>
            부하 분산: {status}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            (CV: {cv.toFixed(1)}%)
          </span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          최대/최소 차이: {imbalanceRatio}%
        </div>
      </div>
      {cv >= 40 && (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          * 공장 간 부하 불균형이 감지되었습니다. 작업 재분배를 검토하세요.
        </p>
      )}
    </div>
  );
}

/**
 * FactoryLoadMini - Compact version for dashboard summary
 */
export function FactoryLoadMini({ orders = [], dynamicColumnMap = {} }) {
  const stats = useMemo(
    () => calculateFactoryStats(orders, dynamicColumnMap),
    [orders, dynamicColumnMap]
  );

  const total = Object.values(stats).reduce((sum, s) => sum + s.totalQty, 0);

  return (
    <div className="flex items-center gap-1 h-6">
      {Object.entries(FACTORY_CONFIG).map(([key, config]) => {
        const percent = total > 0 ? (stats[key].totalQty / total * 100) : 0;

        return (
          <div
            key={key}
            className="h-full rounded transition-all duration-300 hover:opacity-80"
            style={{
              width: `${Math.max(percent, 2)}%`,
              backgroundColor: config.color,
              minWidth: stats[key].totalQty > 0 ? '4px' : '0'
            }}
            title={`${config.label}: ${stats[key].totalQty.toLocaleString()} (${percent.toFixed(1)}%)`}
          />
        );
      })}
    </div>
  );
}

export default FactoryLoadComparison;

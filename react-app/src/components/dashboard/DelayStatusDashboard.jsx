/**
 * @fileoverview Delay Status Dashboard Component
 * Displays order delay status with configurable thresholds.
 *
 * Status Categories:
 * - OVERDUE: CRD has passed and order not complete
 * - AT_RISK: Approaching CRD with low completion
 * - ON_TRACK: Expected to complete on time
 * - COMPLETED: Order fully shipped
 *
 * @module components/dashboard/DelayStatusDashboard
 */

import React, { useMemo, useState, memo, useCallback } from 'react';

/**
 * Default thresholds (configurable)
 */
const DEFAULT_THRESHOLDS = {
  // Days before CRD to consider "at risk"
  atRiskDays: 7,
  // Minimum completion % to be "on track" when within atRiskDays
  minCompletionForOnTrack: 50
};

/**
 * Status definitions
 */
const STATUS = {
  OVERDUE: {
    key: 'OVERDUE',
    label: '지연',
    labelKo: '지연',
    color: '#DC2626',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-800 dark:text-red-200'
  },
  AT_RISK: {
    key: 'AT_RISK',
    label: '위험',
    labelKo: '위험',
    color: '#F59E0B',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-800 dark:text-yellow-200'
  },
  ON_TRACK: {
    key: 'ON_TRACK',
    label: '정상',
    labelKo: '정상',
    color: '#10B981',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-800 dark:text-green-200'
  },
  COMPLETED: {
    key: 'COMPLETED',
    label: '완료',
    labelKo: '완료',
    color: '#6B7280',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-600 dark:text-gray-400'
  }
};

/**
 * Parse date from various formats
 */
function parseDate(value) {
  if (!value) return null;
  const str = String(value).trim();

  // Skip invalid values
  if (/^(1\/0|#|N\/A|-|0)$/i.test(str)) return null;

  // MM/DD format - assume current year
  if (/^\d{1,2}\/\d{1,2}$/.test(str)) {
    const [month, day] = str.split('/').map(Number);
    const year = new Date().getFullYear();
    const date = new Date(year, month - 1, day);

    // If date is more than 6 months in the past, assume next year
    const today = new Date();
    if ((today - date) > 180 * 24 * 60 * 60 * 1000) {
      date.setFullYear(year + 1);
    }

    return date;
  }

  // Try standard date parsing
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Parse number
 */
function parseNumber(value) {
  if (value === undefined || value === null || value === '') return 0;
  const cleaned = String(value).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Calculate days difference
 */
function daysDiff(date1, date2) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((date1 - date2) / msPerDay);
}

/**
 * Determine delay status for an order
 */
function getDelayStatus(order, thresholds = DEFAULT_THRESHOLDS) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const crd = parseDate(order.crd || order['CRD']);
  const qty = parseNumber(order.quantity || order.ttl_qty || order['Q.ty'] || order['Qty']);
  const whOutBal = parseNumber(order.WH_OUT || order['W.H OUT BAL']);

  // If no CRD or no quantity, can't determine status
  if (!crd || qty === 0) {
    return { status: null, daysToDeadline: null, completionRate: 0 };
  }

  const completionRate = ((qty - whOutBal) / qty) * 100;
  const daysToDeadline = daysDiff(crd, today);

  // Completed: WH_OUT balance is 0 (all shipped)
  if (whOutBal === 0 || completionRate >= 100) {
    return {
      status: STATUS.COMPLETED,
      daysToDeadline,
      completionRate: 100
    };
  }

  // Overdue: CRD has passed
  if (daysToDeadline < 0) {
    return {
      status: STATUS.OVERDUE,
      daysToDeadline,
      completionRate,
      daysOverdue: Math.abs(daysToDeadline)
    };
  }

  // At Risk: Within threshold days and completion below threshold
  if (daysToDeadline <= thresholds.atRiskDays &&
    completionRate < thresholds.minCompletionForOnTrack) {
    return {
      status: STATUS.AT_RISK,
      daysToDeadline,
      completionRate
    };
  }

  // On Track: Everything else
  return {
    status: STATUS.ON_TRACK,
    daysToDeadline,
    completionRate
  };
}

/**
 * DelayStatusDashboard - Main component
 */
export function DelayStatusDashboard({
  orders = [],
  thresholds = DEFAULT_THRESHOLDS,
  onThresholdsChange,
  onFilterChange,
  maxDisplay = 20
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [localThresholds, setLocalThresholds] = useState(thresholds);

  // Calculate status for all orders
  const orderStatuses = useMemo(() => {
    return orders
      .map((order, index) => ({
        ...order,
        index,
        delayInfo: getDelayStatus(order, localThresholds)
      }))
      .filter(o => o.delayInfo.status !== null);
  }, [orders, localThresholds]);

  // Summary statistics
  const summary = useMemo(() => {
    const counts = {
      [STATUS.OVERDUE.key]: 0,
      [STATUS.AT_RISK.key]: 0,
      [STATUS.ON_TRACK.key]: 0,
      [STATUS.COMPLETED.key]: 0
    };

    let totalOverdueQty = 0;
    let totalAtRiskQty = 0;

    orderStatuses.forEach(o => {
      if (o.delayInfo.status) {
        counts[o.delayInfo.status.key]++;

        const qty = parseNumber(o.quantity || o.ttl_qty || o['Q.ty'] || o['Qty']);
        if (o.delayInfo.status.key === 'OVERDUE') {
          totalOverdueQty += qty;
        } else if (o.delayInfo.status.key === 'AT_RISK') {
          totalAtRiskQty += qty;
        }
      }
    });

    return {
      ...counts,
      total: orderStatuses.length,
      totalOverdueQty,
      totalAtRiskQty,
      overdueRate: orderStatuses.length > 0
        ? (counts.OVERDUE / orderStatuses.length * 100).toFixed(1)
        : 0
    };
  }, [orderStatuses]);

  // Filtered and sorted orders
  const displayOrders = useMemo(() => {
    let filtered = orderStatuses;

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(o => o.delayInfo.status?.key === filterStatus);
    }

    // Sort: Overdue first, then by days to deadline
    return filtered
      .sort((a, b) => {
        const statusOrder = { OVERDUE: 0, AT_RISK: 1, ON_TRACK: 2, COMPLETED: 3 };
        const aOrder = statusOrder[a.delayInfo.status?.key] ?? 4;
        const bOrder = statusOrder[b.delayInfo.status?.key] ?? 4;

        if (aOrder !== bOrder) return aOrder - bOrder;
        return (a.delayInfo.daysToDeadline || 0) - (b.delayInfo.daysToDeadline || 0);
      })
      .slice(0, maxDisplay);
  }, [orderStatuses, filterStatus, maxDisplay]);

  const handleThresholdSave = () => {
    if (onThresholdsChange) {
      onThresholdsChange(localThresholds);
    }
    setShowSettings(false);
  };

  if (orders.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">지연 현황</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">지연 현황</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            총 {summary.total}건 중 {summary.OVERDUE}건 지연
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
          >
            <option value="ALL">전체</option>
            <option value="OVERDUE">지연</option>
            <option value="AT_RISK">위험</option>
            <option value="ON_TRACK">정상</option>
            <option value="COMPLETED">완료</option>
          </select>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            설정
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">임계값 설정</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                위험 판정 기준 (CRD까지 남은 일수)
              </label>
              <input
                type="number"
                value={localThresholds.atRiskDays}
                onChange={(e) => setLocalThresholds(prev => ({
                  ...prev,
                  atRiskDays: parseInt(e.target.value) || 7
                }))}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
                min="1"
                max="30"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                정상 판정 최소 완료율 (%)
              </label>
              <input
                type="number"
                value={localThresholds.minCompletionForOnTrack}
                onChange={(e) => setLocalThresholds(prev => ({
                  ...prev,
                  minCompletionForOnTrack: parseInt(e.target.value) || 50
                }))}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
                min="0"
                max="100"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setShowSettings(false)}
              className="text-sm px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              취소
            </button>
            <button
              onClick={handleThresholdSave}
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              적용
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        {Object.values(STATUS).map(status => (
          <button
            key={status.key}
            className={`rounded-lg p-3 ${status.bgColor} cursor-pointer transition-transform hover:scale-105 text-left ${
              filterStatus === status.key ? 'ring-2 ring-offset-2 ring-gray-400' : ''
            }`}
            onClick={() => {
              const newStatus = filterStatus === status.key ? 'ALL' : status.key;
              setFilterStatus(newStatus);
              // 대시보드 전체 필터 연동
              if (onFilterChange) {
                onFilterChange(newStatus === 'ALL' ? null : status.key);
              }
            }}
          >
            <div className={`text-2xl font-bold ${status.textColor}`}>
              {summary[status.key]}
            </div>
            <div className={`text-xs ${status.textColor} opacity-75`}>
              {status.labelKo}
            </div>
          </button>
        ))}
      </div>

      {/* Alert for high overdue */}
      {summary.OVERDUE > 0 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400 text-lg">&#9888;</span>
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {summary.OVERDUE}건 지연 발생 (지연율: {summary.overdueRate}%)
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                지연 수량: {summary.totalOverdueQty.toLocaleString()}개
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order List */}
      <div className="space-y-2">
        {displayOrders.map((order) => (
          <DelayStatusCard
            key={order.index}
            order={order}
            delayInfo={order.delayInfo}
          />
        ))}
      </div>

      {orderStatuses.length > maxDisplay && filterStatus === 'ALL' && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
          외 {orderStatuses.length - maxDisplay}건
        </p>
      )}
    </div>
  );
}

/**
 * DelayStatusCard - Individual order status card
 * Memoized to prevent unnecessary re-renders in the list
 */
const DelayStatusCard = memo(function DelayStatusCard({ order, delayInfo }) {
  const po = order.poNumber || order['Sales Order and Item'] || order['PO#'] || order['PO'] || '-';
  const style = order.article || order.model || order['Art'] || order['Style'] || '-';
  const crd = order.crd || order['CRD'] || '-';
  const qty = parseNumber(order.quantity || order.ttl_qty || order['Q.ty'] || order['Qty']);
  const status = delayInfo.status;

  return (
    <div className={`rounded-lg p-3 border ${status.bgColor} border-opacity-50`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: status.color }}
            />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {po}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {style} | CRD: {crd} | {qty.toLocaleString()}개
          </p>
        </div>

        <div className="text-right ml-4">
          <span className={`text-sm font-semibold ${status.textColor}`}>
            {status.labelKo}
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {delayInfo.daysToDeadline !== null && (
              delayInfo.daysToDeadline < 0
                ? `${Math.abs(delayInfo.daysToDeadline)}일 지연`
                : delayInfo.daysToDeadline === 0
                  ? '오늘 마감'
                  : `${delayInfo.daysToDeadline}일 남음`
            )}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${delayInfo.completionRate}%`,
            backgroundColor: status.color
          }}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
        완료율: {delayInfo.completionRate.toFixed(0)}%
      </p>
    </div>
  );
});

/**
 * DelayStatusSummary - Compact summary for dashboard header
 * Memoized to prevent unnecessary recalculations
 */
export const DelayStatusSummary = memo(function DelayStatusSummary({ orders = [], thresholds = DEFAULT_THRESHOLDS }) {
  const summary = useMemo(() => {
    let overdue = 0;
    let atRisk = 0;

    orders.forEach(order => {
      const { status } = getDelayStatus(order, thresholds);
      if (status?.key === 'OVERDUE') overdue++;
      else if (status?.key === 'AT_RISK') atRisk++;
    });

    return { overdue, atRisk };
  }, [orders, thresholds]);

  if (summary.overdue === 0 && summary.atRisk === 0) {
    return (
      <span className="text-green-600 dark:text-green-400 text-sm">
        &#10003; 지연 없음
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      {summary.overdue > 0 && (
        <span className="text-red-600 dark:text-red-400">
          &#9888; 지연 {summary.overdue}건
        </span>
      )}
      {summary.atRisk > 0 && (
        <span className="text-yellow-600 dark:text-yellow-400">
          &#9888; 위험 {summary.atRisk}건
        </span>
      )}
    </div>
  );
});

export default DelayStatusDashboard;

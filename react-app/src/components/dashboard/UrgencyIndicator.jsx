/**
 * @fileoverview Urgency Indicator Component
 * Identifies and displays urgent/rush orders based on CRD proximity and completion status.
 *
 * @module components/dashboard/UrgencyIndicator
 */

import React, { useMemo, useState, memo, useCallback } from 'react';

/**
 * Urgency levels with configuration
 */
const URGENCY_LEVELS = {
  CRITICAL: {
    key: 'CRITICAL',
    label: '긴급',
    labelEn: 'Critical',
    color: '#DC2626',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-500',
    icon: '🚨',
    description: 'CRD 초과 또는 D-day'
  },
  HIGH: {
    key: 'HIGH',
    label: '높음',
    labelEn: 'High',
    color: '#F59E0B',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-500',
    icon: '⚠️',
    description: 'CRD 3일 이내'
  },
  MEDIUM: {
    key: 'MEDIUM',
    label: '보통',
    labelEn: 'Medium',
    color: '#3B82F6',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-500',
    icon: '📋',
    description: 'CRD 7일 이내'
  },
  LOW: {
    key: 'LOW',
    label: '낮음',
    labelEn: 'Low',
    color: '#10B981',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-500',
    icon: '✓',
    description: 'CRD 7일 초과'
  }
};

/**
 * Default thresholds for urgency calculation
 */
const DEFAULT_THRESHOLDS = {
  criticalDays: 0,    // D-day or overdue
  highDays: 3,        // Within 3 days
  mediumDays: 7,      // Within 7 days
  minCompletionForLow: 90  // Consider low urgency if >90% complete
};

/**
 * Parse date from various formats
 */
function parseDate(value) {
  if (!value || value === '1/0' || value === '-') return null;

  // If already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  const str = String(value).trim();

  // Handle MM/DD format (assume current year)
  const mmddMatch = str.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (mmddMatch) {
    const month = parseInt(mmddMatch[1], 10) - 1;
    const day = parseInt(mmddMatch[2], 10);
    const year = new Date().getFullYear();
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  }

  // Handle YYYY-MM-DD or other standard formats
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Parse numeric value
 */
function parseNumber(value) {
  if (value === undefined || value === null || value === '') return 0;
  const cleaned = String(value).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Calculate days until CRD (negative = overdue)
 */
function getDaysUntilCRD(crdDate) {
  if (!crdDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const crd = new Date(crdDate);
  crd.setHours(0, 0, 0, 0);

  const diffTime = crd.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Calculate completion rate for an order
 */
function getCompletionRate(order) {
  const totalQty = parseNumber(order.quantity || order.ttl_qty || order['Q.ty'] || order['Qty']);
  if (totalQty === 0) return 100;

  const whOutBal = parseNumber(order.WH_OUT || order['W.H OUT BAL'] || order['__EMPTY_55'] || order['__EMPTY_54']);
  const completed = totalQty - whOutBal;

  return Math.min(100, Math.max(0, (completed / totalQty) * 100));
}

/**
 * Determine urgency level for an order
 */
function calculateUrgency(order, thresholds = DEFAULT_THRESHOLDS) {
  const crdValue = order.crd || order['CRD'] || order['Customer Required Date'];
  const crdDate = parseDate(crdValue);
  const daysUntilCRD = getDaysUntilCRD(crdDate);
  const completionRate = getCompletionRate(order);

  // If fully completed, no urgency
  if (completionRate >= 100) {
    return { level: null, daysUntilCRD, completionRate, reason: 'completed' };
  }

  // Check Code04 approval (approved orders might have extended deadline)
  const code04 = order.code04 || order['Code 04'] || order['Code04'] || '';
  const isApproved = String(code04).toLowerCase() === 'yes';

  // If no CRD, can't determine urgency
  if (daysUntilCRD === null) {
    return { level: null, daysUntilCRD: null, completionRate, reason: 'no_crd' };
  }

  // High completion rate lowers urgency
  if (completionRate >= thresholds.minCompletionForLow && daysUntilCRD > 0) {
    return {
      level: URGENCY_LEVELS.LOW,
      daysUntilCRD,
      completionRate,
      reason: 'high_completion'
    };
  }

  // Determine level based on days until CRD
  let level;
  if (daysUntilCRD <= thresholds.criticalDays) {
    level = URGENCY_LEVELS.CRITICAL;
  } else if (daysUntilCRD <= thresholds.highDays) {
    level = URGENCY_LEVELS.HIGH;
  } else if (daysUntilCRD <= thresholds.mediumDays) {
    level = URGENCY_LEVELS.MEDIUM;
  } else {
    level = URGENCY_LEVELS.LOW;
  }

  // Approved orders with extended deadline can be downgraded
  if (isApproved && level.key !== 'LOW') {
    // Downgrade by one level
    const levels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const currentIndex = levels.indexOf(level.key);
    if (currentIndex < levels.length - 1) {
      level = URGENCY_LEVELS[levels[currentIndex + 1]];
    }
  }

  return { level, daysUntilCRD, completionRate, reason: 'crd_based' };
}

/**
 * UrgencyIndicator - Main urgency display component
 */
export function UrgencyIndicator({
  orders = [],
  thresholds = DEFAULT_THRESHOLDS,
  maxDisplay = 10,
  title = '긴급 오더 현황',
  onFilterChange
}) {
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [sortBy, setSortBy] = useState('urgency'); // urgency, crd, completion

  // Calculate urgency for all orders
  const ordersWithUrgency = useMemo(() => {
    return orders
      .map((order, index) => ({
        ...order,
        index,
        urgency: calculateUrgency(order, thresholds)
      }))
      .filter(o => o.urgency.level !== null);
  }, [orders, thresholds]);

  // Group by urgency level
  const urgencyGroups = useMemo(() => {
    const groups = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: []
    };

    ordersWithUrgency.forEach(order => {
      if (order.urgency.level) {
        groups[order.urgency.level.key].push(order);
      }
    });

    return groups;
  }, [ordersWithUrgency]);

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let filtered = [...ordersWithUrgency];

    // Filter by selected level
    if (selectedLevel !== 'ALL') {
      filtered = filtered.filter(o => o.urgency.level?.key === selectedLevel);
    } else {
      // Exclude LOW when showing ALL
      filtered = filtered.filter(o => o.urgency.level?.key !== 'LOW');
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'urgency': {
          const levelOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          const levelDiff = (levelOrder[a.urgency.level?.key] || 4) - (levelOrder[b.urgency.level?.key] || 4);
          if (levelDiff !== 0) return levelDiff;
          return (a.urgency.daysUntilCRD || 999) - (b.urgency.daysUntilCRD || 999);
        }
        case 'crd':
          return (a.urgency.daysUntilCRD || 999) - (b.urgency.daysUntilCRD || 999);
        case 'completion':
          return a.urgency.completionRate - b.urgency.completionRate;
        default:
          return 0;
      }
    });

    return filtered.slice(0, maxDisplay);
  }, [ordersWithUrgency, selectedLevel, sortBy, maxDisplay]);

  // Summary counts
  const summary = useMemo(() => ({
    critical: urgencyGroups.CRITICAL.length,
    high: urgencyGroups.HIGH.length,
    medium: urgencyGroups.MEDIUM.length,
    low: urgencyGroups.LOW.length,
    total: ordersWithUrgency.length
  }), [urgencyGroups, ordersWithUrgency]);

  if (orders.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
        >
          <option value="urgency">긴급도순</option>
          <option value="crd">CRD순</option>
          <option value="completion">완료율순</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        {Object.entries(URGENCY_LEVELS).map(([key, config]) => (
          <button
            key={key}
            onClick={() => {
              const newLevel = selectedLevel === key ? 'ALL' : key;
              setSelectedLevel(newLevel);
              // 대시보드 전체 필터 연동
              if (onFilterChange) {
                onFilterChange(newLevel === 'ALL' ? null : key);
              }
            }}
            className={`rounded-lg p-3 text-center transition-all ${config.bgColor} ${
              selectedLevel === key ? 'ring-2 ring-offset-2 ring-gray-400' : ''
            }`}
          >
            <div className="text-lg mb-1">{config.icon}</div>
            <div className={`text-xl font-bold ${config.textColor}`}>
              {urgencyGroups[key].length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{config.label}</div>
          </button>
        ))}
      </div>

      {/* Alert for critical orders */}
      {summary.critical > 0 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-600 dark:text-red-400">🚨</span>
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              {summary.critical}건의 긴급 오더가 CRD를 초과했거나 D-day입니다
            </span>
          </div>
        </div>
      )}

      {/* Urgent Orders List */}
      <div className="space-y-2">
        {filteredOrders.map((order) => (
          <UrgentOrderCard key={order.index} order={order} />
        ))}
      </div>

      {ordersWithUrgency.length > maxDisplay && selectedLevel === 'ALL' && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
          외 {ordersWithUrgency.filter(o => o.urgency.level?.key !== 'LOW').length - maxDisplay}건
        </p>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
          {Object.entries(URGENCY_LEVELS).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <span>{config.icon}</span>
              <span>{config.label}: {config.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * UrgentOrderCard - Individual urgent order display
 * Memoized to prevent unnecessary re-renders in the list
 */
const UrgentOrderCard = memo(function UrgentOrderCard({ order }) {
  const { urgency } = order;
  const level = urgency.level;

  const po = order.poNumber || order['Sales Order and Item'] || order['PO#'] || order['PO'] || '-';
  const style = order.article || order.model || order['Art'] || order['Style'] || '-';
  const qty = parseNumber(order.quantity || order.ttl_qty || order['Q.ty'] || order['Qty']);
  const dest = order.destination || order['Dest'] || order['Destination'] || '-';

  // Format days until CRD
  let crdText;
  if (urgency.daysUntilCRD === null) {
    crdText = 'CRD 미정';
  } else if (urgency.daysUntilCRD < 0) {
    crdText = `D+${Math.abs(urgency.daysUntilCRD)}`;
  } else if (urgency.daysUntilCRD === 0) {
    crdText = 'D-day';
  } else {
    crdText = `D-${urgency.daysUntilCRD}`;
  }

  return (
    <div className={`rounded-lg p-3 border-l-4 ${level.bgColor} ${level.borderColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{level.icon}</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {po}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>{style}</span>
            <span>•</span>
            <span>{qty.toLocaleString()}pcs</span>
            <span>•</span>
            <span>{dest}</span>
          </div>
        </div>

        <div className="text-right ml-4">
          <div className={`text-sm font-bold ${level.textColor}`}>
            {crdText}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            완료 {urgency.completionRate.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${urgency.completionRate}%`,
            backgroundColor: level.color
          }}
        />
      </div>
    </div>
  );
});

/**
 * UrgencyBadge - Small badge for use in tables/lists
 * Memoized to prevent unnecessary recalculations
 */
export const UrgencyBadge = memo(function UrgencyBadge({ order, thresholds = DEFAULT_THRESHOLDS }) {
  const urgency = useMemo(
    () => calculateUrgency(order, thresholds),
    [order, thresholds]
  );

  if (!urgency.level) return null;

  const level = urgency.level;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${level.bgColor} ${level.textColor}`}
    >
      <span>{level.icon}</span>
      <span>{level.label}</span>
    </span>
  );
});

/**
 * UrgencySummaryMini - Compact summary for dashboard cards
 * Memoized to prevent unnecessary recalculations
 */
export const UrgencySummaryMini = memo(function UrgencySummaryMini({ orders = [], thresholds = DEFAULT_THRESHOLDS }) {
  const summary = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

    orders.forEach(order => {
      const urgency = calculateUrgency(order, thresholds);
      if (urgency.level) {
        counts[urgency.level.key]++;
      }
    });

    return counts;
  }, [orders, thresholds]);

  const urgentCount = summary.CRITICAL + summary.HIGH;

  if (urgentCount === 0) {
    return (
      <span className="text-green-600 dark:text-green-400 text-sm font-medium">
        긴급 오더 없음
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {summary.CRITICAL > 0 && (
        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-sm font-medium">
          🚨 {summary.CRITICAL}
        </span>
      )}
      {summary.HIGH > 0 && (
        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm font-medium">
          ⚠️ {summary.HIGH}
        </span>
      )}
    </div>
  );
});

export default UrgencyIndicator;

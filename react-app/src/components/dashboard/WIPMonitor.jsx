/**
 * @fileoverview WIP (Work-in-Progress) Monitor Component
 * Displays order progress and WIP distribution across production stages.
 *
 * @module components/dashboard/WIPMonitor
 */

import React, { useMemo, useState } from 'react';

/**
 * Stage order for WIP calculation
 */
const STAGES = [
  { key: 'S_CUT', label: '재단', fields: ['S.Cut Bal'] },
  { key: 'PRE_SEW', label: '선봉', fields: ['Pre-Sew Bal', 'Pre-Sew Bal.'] },
  { key: 'SEW_INPUT', label: '봉제투입', fields: ['Sew input Bal'] },
  { key: 'SEW_BAL', label: '봉제', fields: ['Sew Bal', 'PRODUCTION STATUS'] },
  { key: 'S_FIT', label: '핏팅', fields: ['S/Fit Bal'] },
  { key: 'ASS_BAL', label: '조립', fields: ['Ass Bal'] },
  { key: 'WH_IN', label: '입고', fields: ['W.H IN BAL'] },
  { key: 'WH_OUT', label: '출고', fields: ['W.H OUT BAL'] }
];

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
 * Get balance value for a stage
 */
function getStageBalance(order, fields, dynamicColumnMap) {
  // Try dynamic column first
  for (const field of fields) {
    const dynamicKey = Object.keys(dynamicColumnMap || {}).find(k =>
      k.toLowerCase().includes(field.toLowerCase().replace(/[.\s]/g, ''))
    );
    if (dynamicKey && order[dynamicColumnMap[dynamicKey]] !== undefined) {
      return parseNumber(order[dynamicColumnMap[dynamicKey]]);
    }
  }

  // Try direct field names
  for (const field of fields) {
    if (order[field] !== undefined) {
      return parseNumber(order[field]);
    }
  }

  // Try __EMPTY_* pattern matching
  for (const key of Object.keys(order)) {
    if (key.startsWith('__EMPTY_')) {
      const val = String(order[key] || '').toLowerCase();
      if (fields.some(f => val.includes(f.toLowerCase().split(' ')[0]))) {
        return parseNumber(order[key]);
      }
    }
  }

  return 0;
}

/**
 * Calculate WIP status for an order
 */
function calculateOrderWIP(order, dynamicColumnMap) {
  const totalQty = parseNumber(order['Q.ty'] || order['Qty']);
  if (totalQty === 0) return null;

  const whOutBal = getStageBalance(order, ['W.H OUT BAL'], dynamicColumnMap);
  const sCutBal = getStageBalance(order, ['S.Cut Bal'], dynamicColumnMap);

  const completed = totalQty - whOutBal;
  const notStarted = sCutBal;
  const inProgress = Math.max(0, totalQty - completed - notStarted);

  const completionRate = (completed / totalQty * 100);

  // Determine current stage (first stage with balance > 0)
  let currentStage = 'COMPLETED';
  for (const stage of STAGES) {
    const balance = getStageBalance(order, stage.fields, dynamicColumnMap);
    if (balance > 0) {
      currentStage = stage.key;
      break;
    }
  }

  return {
    totalQty,
    completed,
    inProgress,
    notStarted,
    completionRate,
    currentStage,
    whOutBal
  };
}

/**
 * WIPMonitor - Main WIP monitoring component
 */
export function WIPMonitor({ orders = [], dynamicColumnMap = {}, maxDisplay = 10 }) {
  const [sortBy, setSortBy] = useState('completionRate'); // completionRate, quantity, stage
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterStage, setFilterStage] = useState('ALL');

  const orderWIPs = useMemo(() => {
    return orders
      .map((order, index) => ({
        ...order,
        index,
        wip: calculateOrderWIP(order, dynamicColumnMap)
      }))
      .filter(o => o.wip !== null);
  }, [orders, dynamicColumnMap]);

  const filteredOrders = useMemo(() => {
    let filtered = [...orderWIPs];

    // Filter by stage
    if (filterStage !== 'ALL') {
      filtered = filtered.filter(o => o.wip.currentStage === filterStage);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'completionRate':
          comparison = a.wip.completionRate - b.wip.completionRate;
          break;
        case 'quantity':
          comparison = a.wip.totalQty - b.wip.totalQty;
          break;
        case 'stage':
          comparison = STAGES.findIndex(s => s.key === a.wip.currentStage) -
            STAGES.findIndex(s => s.key === b.wip.currentStage);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered.slice(0, maxDisplay);
  }, [orderWIPs, filterStage, sortBy, sortOrder, maxDisplay]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const total = orderWIPs.length;
    const completed = orderWIPs.filter(o => o.wip.completionRate >= 100).length;
    const inProgress = orderWIPs.filter(o => o.wip.completionRate > 0 && o.wip.completionRate < 100).length;
    const notStarted = orderWIPs.filter(o => o.wip.completionRate === 0).length;

    const avgCompletion = total > 0
      ? orderWIPs.reduce((sum, o) => sum + o.wip.completionRate, 0) / total
      : 0;

    // Stage distribution
    const stageDistribution = {};
    STAGES.forEach(s => { stageDistribution[s.key] = 0; });
    stageDistribution['COMPLETED'] = 0;

    orderWIPs.forEach(o => {
      stageDistribution[o.wip.currentStage] = (stageDistribution[o.wip.currentStage] || 0) + 1;
    });

    return { total, completed, inProgress, notStarted, avgCompletion, stageDistribution };
  }, [orderWIPs]);

  if (orders.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">WIP 현황</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">WIP 현황</h3>
        <div className="flex items-center gap-2">
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
          >
            <option value="ALL">전체 공정</option>
            {STAGES.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
          >
            <option value="completionRate">완료율순</option>
            <option value="quantity">수량순</option>
            <option value="stage">공정순</option>
          </select>
          <button
            onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
            className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
        <SummaryCard label="전체 오더" value={summary.total} />
        <SummaryCard label="완료" value={summary.completed} color="green" />
        <SummaryCard label="진행 중" value={summary.inProgress} color="blue" />
        <SummaryCard label="미착수" value={summary.notStarted} color="gray" />
      </div>

      {/* Average Completion */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">전체 평균 완료율</span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {summary.avgCompletion.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${summary.avgCompletion}%` }}
          />
        </div>
      </div>

      {/* Order List */}
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <OrderWIPCard
            key={order.index}
            order={order}
            wip={order.wip}
          />
        ))}
      </div>

      {orderWIPs.length > maxDisplay && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
          외 {orderWIPs.length - maxDisplay}건
        </p>
      )}
    </div>
  );
}

/**
 * SummaryCard - Small stat card
 */
function SummaryCard({ label, value, color = 'default' }) {
  const colorClasses = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
  };

  return (
    <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
      <div className="text-xs opacity-75">{label}</div>
      <div className="text-xl font-bold">{value.toLocaleString()}</div>
    </div>
  );
}

/**
 * OrderWIPCard - Individual order WIP display
 */
function OrderWIPCard({ order, wip }) {
  const po = order['Sales Order and Item'] || order['PO#'] || order['PO'] || '-';
  const style = order['Art'] || order['Style'] || '-';
  const currentStageLabel = STAGES.find(s => s.key === wip.currentStage)?.label || '완료';

  // Progress bar segments
  const completedPercent = (wip.completed / wip.totalQty * 100);
  const inProgressPercent = (wip.inProgress / wip.totalQty * 100);

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
            {po}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {style}
          </p>
        </div>
        <div className="text-right ml-4">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {wip.completionRate.toFixed(0)}%
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            현재: {currentStageLabel}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-green-500"
          style={{ width: `${completedPercent}%` }}
          title={`완료: ${wip.completed.toLocaleString()}`}
        />
        <div
          className="h-full bg-blue-500"
          style={{ width: `${inProgressPercent}%` }}
          title={`진행 중: ${wip.inProgress.toLocaleString()}`}
        />
      </div>

      {/* Quantity Details */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>총: {wip.totalQty.toLocaleString()}</span>
        <span className="text-green-600 dark:text-green-400">완료: {wip.completed.toLocaleString()}</span>
        <span className="text-blue-600 dark:text-blue-400">진행: {wip.inProgress.toLocaleString()}</span>
        <span>미착수: {wip.notStarted.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default WIPMonitor;

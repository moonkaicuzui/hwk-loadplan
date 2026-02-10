/**
 * @fileoverview Process Heatmap Page
 * Heatmap visualization of production process stages.
 *
 * @module pages/ProcessHeatmap
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../contexts/DashboardContext';
import { useOrders } from '../hooks/useOrders';
import { ChartSkeleton } from '../components/common/LoadingSpinner';
import { PROCESS_STAGES, getProcessName } from '../constants/processes';
import { formatNumber, formatPercent } from '../utils/formatters';
import { getYearMonth } from '../utils/dateUtils';

/**
 * Get heatmap color based on completion percentage
 */
function getHeatmapColor(percent) {
  if (percent >= 90) return 'bg-green-500';
  if (percent >= 70) return 'bg-green-400';
  if (percent >= 50) return 'bg-yellow-400';
  if (percent >= 30) return 'bg-orange-400';
  if (percent > 0) return 'bg-red-400';
  return 'bg-gray-200 dark:bg-gray-700';
}

/**
 * Process Heatmap Page Component
 * Full heatmap with actual data
 */
export default function ProcessHeatmap() {
  const { t, i18n } = useTranslation();
  const { state } = useDashboard();
  const [viewMode, setViewMode] = useState('monthly'); // monthly | factory | model

  // Get orders data
  const { orders, loading } = useOrders({
    factory: state.selectedFactory,
    dateMode: state.dateMode
  });

  // Process stages - use PROCESS_STAGES array directly
  // Each stage has: id, code, name, nameEn, nameVi, order, color, description

  // Monthly heatmap data
  const monthlyData = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const groupedByMonth = {};

    orders.forEach(order => {
      const month = getYearMonth(order.crd);
      if (!month) return;

      if (!groupedByMonth[month]) {
        groupedByMonth[month] = {
          month,
          totalOrders: 0,
          stages: {}
        };
        PROCESS_STAGES.forEach(stage => {
          const stageKey = stage.id; // Use stage.id (e.g., 's_cut', 'wh_out')
          groupedByMonth[month].stages[stageKey] = { total: 0, count: 0 };
        });
      }

      const group = groupedByMonth[month];
      group.totalOrders++;

      PROCESS_STAGES.forEach(stage => {
        const stageKey = stage.id;
        const qty = order.quantity || order.ttl_qty || 0;
        // Try both lowercase id and original Excel column name patterns
        const stageQty = order[stageKey] || order[stage.code.toLowerCase()] || 0;

        group.stages[stageKey].total += qty;
        group.stages[stageKey].count += stageQty;
      });
    });

    return Object.values(groupedByMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }, [orders]);

  // Factory heatmap data
  const factoryData = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const groupedByFactory = {};

    orders.forEach(order => {
      const factory = order.factory || 'Unknown';

      if (!groupedByFactory[factory]) {
        groupedByFactory[factory] = {
          factory: `Factory ${factory}`,
          factoryId: factory,
          totalOrders: 0,
          stages: {}
        };
        PROCESS_STAGES.forEach(stage => {
          const stageKey = stage.id;
          groupedByFactory[factory].stages[stageKey] = { total: 0, count: 0 };
        });
      }

      const group = groupedByFactory[factory];
      group.totalOrders++;

      PROCESS_STAGES.forEach(stage => {
        const stageKey = stage.id;
        const qty = order.quantity || order.ttl_qty || 0;
        const stageQty = order[stageKey] || order[stage.code.toLowerCase()] || 0;

        group.stages[stageKey].total += qty;
        group.stages[stageKey].count += stageQty;
      });
    });

    return Object.values(groupedByFactory).sort((a, b) => a.factoryId.localeCompare(b.factoryId));
  }, [orders]);

  // Process statistics
  const processStats = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    return PROCESS_STAGES.map(stage => {
      const stageKey = stage.id;
      let totalQty = 0;
      let completedQty = 0;

      orders.forEach(order => {
        const qty = order.quantity || order.ttl_qty || 0;
        const stageQty = order[stageKey] || order[stage.code.toLowerCase()] || 0;
        totalQty += qty;
        completedQty += stageQty;
      });

      return {
        stage: stage.id,
        key: stage.code,
        name: getProcessName(stage.id, i18n.language),
        totalQty,
        completedQty,
        completionRate: totalQty > 0 ? Math.round((completedQty / totalQty) * 100) : 0
      };
    });
  }, [orders, i18n.language]);

  // Get display data based on view mode
  const displayData = viewMode === 'factory' ? factoryData : monthlyData;
  const rowKey = viewMode === 'factory' ? 'factory' : 'month';

  if (loading) {
    return (
      <div className="space-y-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {t('heatmap.title', '공정 히트맵')}
          </h1>
          <p className="text-sm text-secondary mt-1">
            {t('heatmap.subtitle', '8단계 공정별 진행 현황 시각화')}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          {[
            { value: 'monthly', label: t('heatmap.byMonth', '월별') },
            { value: 'factory', label: t('heatmap.byFactory', '공장별') }
          ].map(mode => (
            <button
              key={mode.value}
              onClick={() => setViewMode(mode.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                viewMode === mode.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-secondary hover:bg-hover'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Process Flow Legend */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">
          {t('heatmap.processFlow', '공정 흐름')}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {PROCESS_STAGES.map((stage, index) => (
            <div key={stage.id} className="flex items-center">
              <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-center">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {stage.code}
                </p>
                <p className="text-xs text-secondary">
                  {getProcessName(stage.id, i18n.language)}
                </p>
              </div>
              {index < PROCESS_STAGES.length - 1 && (
                <span className="mx-2 text-secondary">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">
          {t('heatmap.gridTitle', '공정별 히트맵')}
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header Row */}
            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `120px repeat(${PROCESS_STAGES.length}, 1fr)` }}>
              <div className="text-sm font-medium text-secondary p-2">
                {viewMode === 'factory' ? t('heatmap.factory', '공장') : t('heatmap.month', '월')}
              </div>
              {PROCESS_STAGES.map((stage) => (
                <div
                  key={stage.id}
                  className="text-xs font-medium text-center p-2 bg-gray-100 dark:bg-gray-800 rounded"
                >
                  {stage.code}
                </div>
              ))}
            </div>

            {/* Data Rows */}
            {displayData.length > 0 ? (
              displayData.map((row) => (
                <div
                  key={row[rowKey]}
                  className="grid gap-1 mb-1"
                  style={{ gridTemplateColumns: `120px repeat(${PROCESS_STAGES.length}, 1fr)` }}
                >
                  <div className="text-sm text-secondary p-2 flex items-center">
                    {row[rowKey]}
                    <span className="ml-auto text-xs">({row.totalOrders})</span>
                  </div>
                  {PROCESS_STAGES.map((stage) => {
                    const stageKey = stage.id;
                    const stageData = row.stages[stageKey] || { total: 0, count: 0 };
                    const percent = stageData.total > 0
                      ? Math.round((stageData.count / stageData.total) * 100)
                      : 0;

                    return (
                      <div
                        key={stage.id}
                        className={`h-10 ${getHeatmapColor(percent)} rounded flex items-center justify-center cursor-default transition-all hover:ring-2 hover:ring-blue-500`}
                        title={`${row[rowKey]} - ${stage.code}: ${formatNumber(stageData.count)}/${formatNumber(stageData.total)} (${percent}%)`}
                      >
                        <span className="text-xs font-medium text-white drop-shadow">
                          {percent > 0 ? `${percent}%` : '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-secondary">
                {t('heatmap.noData', '데이터가 없습니다')}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          <span className="text-secondary">{t('heatmap.legend', '범례')}:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>90%+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 rounded" />
            <span>70-90%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded" />
            <span>50-70%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-400 rounded" />
            <span>30-50%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-400 rounded" />
            <span>0-30%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <span>{t('heatmap.noProgress', '없음')}</span>
          </div>
        </div>
      </div>

      {/* Process Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {processStats.map((stat) => (
          <div key={stat.stage} className="bg-card rounded-xl p-4 shadow-sm">
            <h4 className="text-xs font-medium text-secondary mb-1 uppercase">{stat.key}</h4>
            <p className={`text-xl font-bold ${
              stat.completionRate >= 80 ? 'text-green-500' :
              stat.completionRate >= 50 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {formatPercent(stat.completionRate)}
            </p>
            <p className="text-xs text-secondary mt-1">{stat.name}</p>
            <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  stat.completionRate >= 80 ? 'bg-green-500' :
                  stat.completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${stat.completionRate}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Process Flow Funnel */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">
          {t('heatmap.processFunnel', '공정 퍼널')}
        </h3>
        <div className="space-y-3">
          {processStats.map((stat, index) => {
            const maxWidth = 100;
            const width = stat.completionRate || 5;

            return (
              <div key={stat.stage} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium">{stat.key.toUpperCase()}</div>
                <div className="flex-1 relative">
                  <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <div
                      className={`h-full rounded-lg flex items-center justify-end pr-2 transition-all ${
                        stat.completionRate >= 80 ? 'bg-green-500' :
                        stat.completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-xs font-medium text-white">
                        {formatNumber(stat.completedQty)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-16 text-right text-sm">
                  {formatPercent(stat.completionRate)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

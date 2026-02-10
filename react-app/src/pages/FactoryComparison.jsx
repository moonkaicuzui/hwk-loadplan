/**
 * @fileoverview Factory Comparison Page
 * Compare performance across factories A, B, C, D.
 *
 * @module pages/FactoryComparison
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../contexts/DashboardContext';
import { useOrders } from '../hooks/useOrders';
import { ChartSkeleton, CardSkeleton } from '../components/common/LoadingSpinner';
import { FactoryComparisonChart, FactoryStackedChart } from '../components/charts';
import { formatNumber, formatPercent } from '../utils/formatters';
import { FACTORY_CONFIG, getFactoryColor } from '../constants/factories';
import { PROCESS_STAGES, getProcessName } from '../constants/processes';

/**
 * Factory Comparison Page Component
 * Full factory comparison with charts and metrics
 */
export default function FactoryComparison() {
  const { t } = useTranslation();
  const { state } = useDashboard();

  // Get orders data
  const { orders, loading, groupByFactory } = useOrders({
    factory: 'ALL', // Always get all factories for comparison
    dateMode: state.dateMode
  });

  // Factory data
  const factoryData = useMemo(() => {
    if (!orders || orders.length === 0) return {};
    return groupByFactory(orders);
  }, [orders, groupByFactory]);

  // Factory stats array for cards
  const factoryStats = useMemo(() => {
    return Object.keys(FACTORY_CONFIG).map(factoryId => {
      const data = factoryData[factoryId] || {};
      const orders = data.orders || [];
      const totalQty = data.totalQuantity || 0;
      const completedQty = data.completedQuantity || 0;
      const delayedCount = data.delayedCount || 0;

      return {
        id: factoryId,
        name: FACTORY_CONFIG[factoryId].name,
        color: getFactoryColor(factoryId),
        orderCount: orders.length,
        totalQuantity: totalQty,
        completedQuantity: completedQty,
        completionRate: totalQty > 0 ? Math.round((completedQty / totalQty) * 100) : 0,
        delayedCount: delayedCount,
        delayRate: orders.length > 0 ? Math.round((delayedCount / orders.length) * 100) : 0,
        capacity: FACTORY_CONFIG[factoryId].capacity
      };
    });
  }, [factoryData]);

  // Process progress by factory
  const processProgress = useMemo(() => {
    return factoryStats.map(factory => {
      const data = factoryData[factory.id] || {};
      const orders = data.orders || [];

      // Calculate average progress across all orders
      const processStages = Object.keys(PROCESS_STAGES);
      let totalProgress = 0;
      let ordersWithProgress = 0;

      orders.forEach(order => {
        let completedStages = 0;
        processStages.forEach(stage => {
          const stageKey = PROCESS_STAGES[stage].key;
          if (order[stageKey] && order[stageKey] > 0) {
            completedStages++;
          }
        });
        if (completedStages > 0) {
          totalProgress += completedStages;
          ordersWithProgress++;
        }
      });

      const avgProgress = ordersWithProgress > 0
        ? Math.round(totalProgress / ordersWithProgress)
        : 0;

      return {
        ...factory,
        avgProgress,
        totalStages: processStages.length,
        progressPercent: Math.round((avgProgress / processStages.length) * 100)
      };
    });
  }, [factoryStats, factoryData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {t('factory.title', '공장 비교')}
        </h1>
        <p className="text-sm text-secondary mt-1">
          {t('factory.subtitle', 'Factory A, B, C, D 성과 비교 분석')}
        </p>
      </div>

      {/* Factory Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {factoryStats.map((factory) => (
          <div
            key={factory.id}
            className="bg-card rounded-xl p-6 shadow-sm border-l-4"
            style={{ borderLeftColor: factory.color }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{factory.name}</h3>
              <span
                className="px-2 py-1 text-xs font-medium rounded"
                style={{
                  backgroundColor: `${factory.color}20`,
                  color: factory.color
                }}
              >
                {formatNumber(factory.orderCount)}건
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-secondary">{t('factory.quantity', '수량')}</span>
                <span className="font-medium">{formatNumber(factory.totalQuantity)}족</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">{t('factory.completion', '완료율')}</span>
                <span className={`font-medium ${
                  factory.completionRate >= 80 ? 'text-green-500' :
                  factory.completionRate >= 50 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {formatPercent(factory.completionRate)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">{t('factory.delay', '지연율')}</span>
                <span className={`font-medium ${
                  factory.delayRate <= 5 ? 'text-green-500' :
                  factory.delayRate <= 15 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {formatPercent(factory.delayRate)}
                </span>
              </div>
              {/* Progress bar */}
              <div className="pt-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${factory.completionRate}%`,
                      backgroundColor: factory.color
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FactoryComparisonChart
          data={factoryData}
          title={t('factory.quantityComparison', '공장별 수량 비교')}
          metric="quantity"
          height={300}
        />
        <FactoryComparisonChart
          data={factoryData}
          title={t('factory.completionComparison', '공장별 완료율 비교')}
          metric="completion"
          height={300}
        />
      </div>

      {/* Stacked Chart */}
      <FactoryStackedChart
        data={factoryData}
        title={t('factory.progressComparison', '공장별 완료/잔량 비교')}
        height={350}
      />

      {/* Process Progress by Factory */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">
          {t('factory.processProgress', '공장별 공정 진행률')}
        </h3>
        <div className="space-y-4">
          {processProgress.map((factory) => (
            <div key={factory.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: factory.color }}
                  />
                  <span className="font-medium">{factory.name}</span>
                </div>
                <span className="text-secondary">
                  {t('factory.avgProgress', '평균 {{progress}}/{{total}} 공정', {
                    progress: factory.avgProgress,
                    total: factory.totalStages
                  })}
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${factory.progressPercent}%`,
                    backgroundColor: factory.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Factory Detail Table */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-theme">
          <h3 className="text-lg font-semibold">
            {t('factory.detailTable', '공장별 상세 현황')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('factory.name', '공장')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{t('factory.orders', '주문수')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{t('factory.totalQty', '총 수량')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{t('factory.completedQty', '완료')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{t('factory.remaining', '잔량')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{t('factory.completion', '완료율')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{t('factory.delayed', '지연')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{t('factory.delay', '지연율')}</th>
              </tr>
            </thead>
            <tbody>
              {factoryStats.map((factory, index) => (
                <tr key={factory.id} className={`border-b border-theme ${index % 2 === 0 ? '' : 'bg-secondary/30'}`}>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: factory.color }}
                      />
                      <span className="font-medium">{factory.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">{formatNumber(factory.orderCount)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatNumber(factory.totalQuantity)}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-500">{formatNumber(factory.completedQuantity)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatNumber(factory.totalQuantity - factory.completedQuantity)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={
                      factory.completionRate >= 80 ? 'text-green-500' :
                      factory.completionRate >= 50 ? 'text-yellow-500' : 'text-red-500'
                    }>
                      {formatPercent(factory.completionRate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-red-500">{formatNumber(factory.delayedCount)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={
                      factory.delayRate <= 5 ? 'text-green-500' :
                      factory.delayRate <= 15 ? 'text-yellow-500' : 'text-red-500'
                    }>
                      {formatPercent(factory.delayRate)}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="bg-secondary font-medium">
                <td className="px-4 py-3 text-sm">{t('common.total', '합계')}</td>
                <td className="px-4 py-3 text-sm text-right">
                  {formatNumber(factoryStats.reduce((sum, f) => sum + f.orderCount, 0))}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {formatNumber(factoryStats.reduce((sum, f) => sum + f.totalQuantity, 0))}
                </td>
                <td className="px-4 py-3 text-sm text-right text-green-500">
                  {formatNumber(factoryStats.reduce((sum, f) => sum + f.completedQuantity, 0))}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {formatNumber(factoryStats.reduce((sum, f) => sum + (f.totalQuantity - f.completedQuantity), 0))}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {(() => {
                    const totalQty = factoryStats.reduce((sum, f) => sum + f.totalQuantity, 0);
                    const completedQty = factoryStats.reduce((sum, f) => sum + f.completedQuantity, 0);
                    return formatPercent(totalQty > 0 ? Math.round((completedQty / totalQty) * 100) : 0);
                  })()}
                </td>
                <td className="px-4 py-3 text-sm text-right text-red-500">
                  {formatNumber(factoryStats.reduce((sum, f) => sum + f.delayedCount, 0))}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {(() => {
                    const totalOrders = factoryStats.reduce((sum, f) => sum + f.orderCount, 0);
                    const totalDelayed = factoryStats.reduce((sum, f) => sum + f.delayedCount, 0);
                    return formatPercent(totalOrders > 0 ? Math.round((totalDelayed / totalOrders) * 100) : 0);
                  })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

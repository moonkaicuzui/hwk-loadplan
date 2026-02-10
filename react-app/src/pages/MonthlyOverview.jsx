/**
 * @fileoverview Monthly Overview Page
 * Monthly statistics and trend analysis.
 *
 * @module pages/MonthlyOverview
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../contexts/DashboardContext';
import { useOrders } from '../hooks/useOrders';
import { ChartSkeleton, TableSkeleton } from '../components/common/LoadingSpinner';
import { MonthlyTrendChart } from '../components/charts';
import { DataTable } from '../components/tables';
import { formatNumber, formatPercent } from '../utils/formatters';

/**
 * Monthly Overview Page Component
 * Monthly analysis with charts and tables
 */
export default function MonthlyOverview() {
  const { t } = useTranslation();
  const { state } = useDashboard();

  // Get orders data
  const { orders, loading, groupByMonth } = useOrders({
    factory: state.selectedFactory,
    dateMode: state.dateMode
  });

  // Monthly data for chart and table
  const monthlyData = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return groupByMonth(orders);
  }, [orders, groupByMonth]);

  // Table data with calculated metrics
  const tableData = useMemo(() => {
    return monthlyData.map(item => ({
      month: item.month,
      totalQuantity: item.totalQuantity,
      completedQuantity: item.completedQuantity,
      completionRate: item.completionRate,
      delayedCount: item.delayedCount,
      delayRate: item.orderCount > 0
        ? Math.round((item.delayedCount / item.orderCount) * 100)
        : 0,
      orderCount: item.orderCount
    }));
  }, [monthlyData]);

  // Table columns
  const columns = [
    {
      key: 'month',
      label: t('monthly.month', '월'),
      sortable: true,
      align: 'left'
    },
    {
      key: 'orderCount',
      label: t('monthly.orderCount', '주문수'),
      sortable: true,
      align: 'right',
      format: 'number'
    },
    {
      key: 'totalQuantity',
      label: t('monthly.totalQty', '총 수량'),
      sortable: true,
      align: 'right',
      format: 'number'
    },
    {
      key: 'completedQuantity',
      label: t('monthly.completedQty', '완료'),
      sortable: true,
      align: 'right',
      format: 'number'
    },
    {
      key: 'completionRate',
      label: t('monthly.completionRate', '완료율'),
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className={value >= 80 ? 'text-green-500' : value >= 50 ? 'text-yellow-500' : 'text-red-500'}>
          {formatPercent(value)}
        </span>
      )
    },
    {
      key: 'delayedCount',
      label: t('monthly.delayedCount', '지연'),
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className={value > 0 ? 'text-red-500 font-medium' : ''}>
          {formatNumber(value)}
        </span>
      )
    },
    {
      key: 'delayRate',
      label: t('monthly.delayRate', '지연율'),
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className={value > 10 ? 'text-red-500' : value > 5 ? 'text-yellow-500' : 'text-green-500'}>
          {formatPercent(value)}
        </span>
      )
    }
  ];

  // Summary stats
  const summary = useMemo(() => {
    return monthlyData.reduce((acc, item) => ({
      totalOrders: acc.totalOrders + item.orderCount,
      totalQuantity: acc.totalQuantity + item.totalQuantity,
      completedQuantity: acc.completedQuantity + item.completedQuantity,
      delayedCount: acc.delayedCount + item.delayedCount
    }), { totalOrders: 0, totalQuantity: 0, completedQuantity: 0, delayedCount: 0 });
  }, [monthlyData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <ChartSkeleton />
        <TableSkeleton rows={10} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {t('monthly.title', '월별 현황')}
        </h1>
        <p className="text-sm text-secondary mt-1">
          {t('monthly.subtitle', '월별 주문량, 완료율, 지연율 추이 분석')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-sm">
          <p className="text-sm text-secondary">{t('monthly.totalOrders', '총 주문')}</p>
          <p className="text-2xl font-bold">{formatNumber(summary.totalOrders)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm">
          <p className="text-sm text-secondary">{t('monthly.totalQuantity', '총 수량')}</p>
          <p className="text-2xl font-bold">{formatNumber(summary.totalQuantity)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm">
          <p className="text-sm text-secondary">{t('monthly.completed', '완료 수량')}</p>
          <p className="text-2xl font-bold text-green-500">{formatNumber(summary.completedQuantity)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm">
          <p className="text-sm text-secondary">{t('monthly.delayed', '지연 건수')}</p>
          <p className="text-2xl font-bold text-red-500">{formatNumber(summary.delayedCount)}</p>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <MonthlyTrendChart
        data={monthlyData}
        title={t('monthly.trendChart', '월별 추이 차트')}
        height={350}
      />

      {/* Monthly Summary Table */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-theme">
          <h3 className="text-lg font-semibold">
            {t('monthly.summaryTable', '월별 집계표')}
          </h3>
        </div>
        <DataTable
          data={tableData}
          columns={columns}
          showPagination={false}
          loading={loading}
        />
      </div>
    </div>
  );
}

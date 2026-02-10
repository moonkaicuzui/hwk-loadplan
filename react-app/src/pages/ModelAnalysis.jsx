/**
 * @fileoverview Model Analysis Page
 * Analysis by product model/style.
 *
 * @module pages/ModelAnalysis
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../contexts/DashboardContext';
import { useOrders } from '../hooks/useOrders';
import { ChartSkeleton, TableSkeleton } from '../components/common/LoadingSpinner';
import { DataTable } from '../components/tables';
import { formatNumber, formatPercent } from '../utils/formatters';
import { getProductionData, isDelayed, isWarning } from '../utils/orderUtils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#14B8A6'];

/**
 * Model Analysis Page Component
 * Full model analysis with charts and breakdown
 */
export default function ModelAnalysis() {
  const { t } = useTranslation();
  const { state } = useDashboard();
  const [viewMode, setViewMode] = useState('quantity'); // quantity | orders | completion

  // Get orders data
  const { orders, loading } = useOrders({
    factory: state.selectedFactory,
    dateMode: state.dateMode
  });

  // Group by model/article
  const modelData = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const groupedData = {};

    orders.forEach(order => {
      const model = order.article || 'Unknown';
      if (!groupedData[model]) {
        groupedData[model] = {
          model,
          orderCount: 0,
          totalQuantity: 0,
          completedQuantity: 0,
          delayedCount: 0,
          warningCount: 0,
          factories: new Set()
        };
      }

      const group = groupedData[model];
      const qty = order.quantity || order.ttl_qty || 0;
      const completed = getProductionData(order, 'wh_out', 'completed', 0);

      group.orderCount++;
      group.totalQuantity += qty;
      group.completedQuantity += completed;
      if (isDelayed(order)) group.delayedCount++;
      if (isWarning(order)) group.warningCount++;
      if (order.factory) group.factories.add(order.factory);
    });

    return Object.values(groupedData)
      .map(item => ({
        ...item,
        completionRate: item.totalQuantity > 0
          ? Math.round((item.completedQuantity / item.totalQuantity) * 100)
          : 0,
        delayRate: item.orderCount > 0
          ? Math.round((item.delayedCount / item.orderCount) * 100)
          : 0,
        factoryList: Array.from(item.factories).join(', ')
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [orders]);

  // Top 10 models for chart
  const top10Models = useMemo(() => {
    return modelData.slice(0, 10);
  }, [modelData]);

  // Pie data
  const pieData = useMemo(() => {
    const top8 = modelData.slice(0, 8);
    const others = modelData.slice(8);
    const othersTotal = others.reduce((sum, m) => sum + m.totalQuantity, 0);

    const result = top8.map((m, i) => ({
      name: m.model,
      value: m.totalQuantity,
      color: COLORS[i % COLORS.length]
    }));

    if (othersTotal > 0) {
      result.push({
        name: t('model.others', '기타'),
        value: othersTotal,
        color: '#94A3B8'
      });
    }

    return result;
  }, [modelData, t]);

  // Table columns
  const columns = [
    {
      key: 'model',
      label: t('model.name', '모델명'),
      sortable: true,
      align: 'left'
    },
    {
      key: 'orderCount',
      label: t('model.orderCount', '주문 수'),
      sortable: true,
      align: 'right',
      format: 'number'
    },
    {
      key: 'totalQuantity',
      label: t('model.totalQty', '총 수량'),
      sortable: true,
      align: 'right',
      format: 'number'
    },
    {
      key: 'completedQuantity',
      label: t('model.completedQty', '완료'),
      sortable: true,
      align: 'right',
      format: 'number'
    },
    {
      key: 'completionRate',
      label: t('model.completionRate', '완료율'),
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
      label: t('model.delayedCount', '지연'),
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className={value > 0 ? 'text-red-500' : ''}>
          {formatNumber(value)}
        </span>
      )
    },
    {
      key: 'factoryList',
      label: t('model.factories', '공장'),
      sortable: false,
      align: 'center'
    }
  ];

  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-card border border-theme rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <p>{t('model.quantity', '수량')}: {formatNumber(data.totalQuantity)}족</p>
          <p>{t('model.orders', '주문')}: {formatNumber(data.orderCount)}건</p>
          <p className="text-green-500">{t('model.completion', '완료율')}: {data.completionRate}%</p>
        </div>
      </div>
    );
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {t('model.title', '모델 분석')}
          </h1>
          <p className="text-sm text-secondary mt-1">
            {t('model.subtitle', '제품 모델/스타일별 주문 현황 분석')} ({formatNumber(modelData.length)} {t('model.models', '모델')})
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          {[
            { value: 'quantity', label: t('model.byQuantity', '수량순') },
            { value: 'orders', label: t('model.byOrders', '주문수순') },
            { value: 'completion', label: t('model.byCompletion', '완료율순') }
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-card rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            {t('model.distributionChart', '모델별 수량 (Top 10)')}
          </h3>
          {top10Models.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={top10Models}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  type="number"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  tickFormatter={(value) => formatNumber(value)}
                />
                <YAxis
                  type="category"
                  dataKey="model"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  width={75}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalQuantity" radius={[0, 4, 4, 0]}>
                  {top10Models.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-secondary">{t('chart.noData', '데이터가 없습니다')}</p>
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-card rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            {t('model.shareChart', '모델별 비율')}
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatNumber(value) + '족'}
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-secondary">{t('chart.noData', '데이터가 없습니다')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Model Summary Table */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-theme">
          <h3 className="text-lg font-semibold">
            {t('model.summaryTable', '모델별 집계표')}
          </h3>
        </div>
        <DataTable
          data={modelData}
          columns={columns}
          showPagination={true}
          pageSize={20}
          loading={loading}
        />
      </div>
    </div>
  );
}

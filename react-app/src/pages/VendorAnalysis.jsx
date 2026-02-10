/**
 * @fileoverview Vendor Analysis Page
 * Analysis by vendor/supplier (buyer).
 *
 * @module pages/VendorAnalysis
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

/**
 * Vendor Analysis Page Component
 * Full vendor analysis with charts and metrics
 */
export default function VendorAnalysis() {
  const { t } = useTranslation();
  const { state } = useDashboard();
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Get orders data
  const { orders, loading } = useOrders({
    factory: state.selectedFactory,
    dateMode: state.dateMode
  });

  // Group by vendor (buyer)
  const vendorData = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const groupedData = {};

    orders.forEach(order => {
      const vendor = order.buyer || order.destination || 'Unknown';
      if (!groupedData[vendor]) {
        groupedData[vendor] = {
          vendor,
          orderCount: 0,
          totalQuantity: 0,
          completedQuantity: 0,
          delayedCount: 0,
          warningCount: 0,
          onTimeCount: 0,
          factories: new Set(),
          models: new Set()
        };
      }

      const group = groupedData[vendor];
      const qty = order.quantity || order.ttl_qty || 0;
      const completed = getProductionData(order, 'wh_out', 'completed', 0);

      group.orderCount++;
      group.totalQuantity += qty;
      group.completedQuantity += completed;
      if (isDelayed(order)) {
        group.delayedCount++;
      } else {
        group.onTimeCount++;
      }
      if (isWarning(order)) group.warningCount++;
      if (order.factory) group.factories.add(order.factory);
      if (order.article) group.models.add(order.article);
    });

    return Object.values(groupedData)
      .map(item => ({
        ...item,
        completionRate: item.totalQuantity > 0
          ? Math.round((item.completedQuantity / item.totalQuantity) * 100)
          : 0,
        onTimeRate: item.orderCount > 0
          ? Math.round((item.onTimeCount / item.orderCount) * 100)
          : 0,
        delayRate: item.orderCount > 0
          ? Math.round((item.delayedCount / item.orderCount) * 100)
          : 0,
        // Quality score (higher completion + on-time = better score)
        qualityScore: Math.round(
          ((item.completionRate || 0) * 0.5) +
          ((item.onTimeRate || 0) * 0.5)
        ),
        factoryList: Array.from(item.factories).join(', '),
        modelCount: item.models.size
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [orders]);

  // Top 10 vendors for chart
  const top10Vendors = useMemo(() => {
    return vendorData.slice(0, 10);
  }, [vendorData]);

  // Radar data for selected vendor
  const radarData = useMemo(() => {
    if (!selectedVendor) {
      // Use aggregate
      const totalOrders = vendorData.reduce((sum, v) => sum + v.orderCount, 0);
      const avgCompletion = vendorData.length > 0
        ? Math.round(vendorData.reduce((sum, v) => sum + v.completionRate, 0) / vendorData.length)
        : 0;
      const avgOnTime = vendorData.length > 0
        ? Math.round(vendorData.reduce((sum, v) => sum + v.onTimeRate, 0) / vendorData.length)
        : 0;
      const avgQuality = vendorData.length > 0
        ? Math.round(vendorData.reduce((sum, v) => sum + v.qualityScore, 0) / vendorData.length)
        : 0;

      return [
        { metric: t('vendor.completion', '완료율'), value: avgCompletion },
        { metric: t('vendor.onTime', '정시율'), value: avgOnTime },
        { metric: t('vendor.quality', '품질'), value: avgQuality },
        { metric: t('vendor.volume', '물량'), value: Math.min(100, totalOrders > 0 ? 100 : 0) },
        { metric: t('vendor.diversity', '다양성'), value: Math.min(100, vendorData.length * 10) }
      ];
    }

    const vendor = vendorData.find(v => v.vendor === selectedVendor);
    if (!vendor) return [];

    const maxQuantity = Math.max(...vendorData.map(v => v.totalQuantity));
    const volumeScore = maxQuantity > 0 ? Math.round((vendor.totalQuantity / maxQuantity) * 100) : 0;

    return [
      { metric: t('vendor.completion', '완료율'), value: vendor.completionRate },
      { metric: t('vendor.onTime', '정시율'), value: vendor.onTimeRate },
      { metric: t('vendor.quality', '품질'), value: vendor.qualityScore },
      { metric: t('vendor.volume', '물량'), value: volumeScore },
      { metric: t('vendor.diversity', '모델 다양성'), value: Math.min(100, vendor.modelCount * 5) }
    ];
  }, [selectedVendor, vendorData, t]);

  // Table columns
  const columns = [
    {
      key: 'vendor',
      label: t('vendor.name', '벤더명'),
      sortable: true,
      align: 'left',
      render: (value) => (
        <button
          onClick={() => setSelectedVendor(value)}
          className="text-blue-500 hover:underline"
        >
          {value}
        </button>
      )
    },
    {
      key: 'orderCount',
      label: t('vendor.orderCount', '주문 수'),
      sortable: true,
      align: 'right',
      format: 'number'
    },
    {
      key: 'totalQuantity',
      label: t('vendor.totalQty', '총 수량'),
      sortable: true,
      align: 'right',
      format: 'number'
    },
    {
      key: 'completedQuantity',
      label: t('vendor.completedQty', '완료'),
      sortable: true,
      align: 'right',
      format: 'number'
    },
    {
      key: 'onTimeRate',
      label: t('vendor.onTimeRate', '정시율'),
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className={value >= 90 ? 'text-green-500' : value >= 70 ? 'text-yellow-500' : 'text-red-500'}>
          {formatPercent(value)}
        </span>
      )
    },
    {
      key: 'qualityScore',
      label: t('vendor.qualityScore', '품질 점수'),
      sortable: true,
      align: 'right',
      render: (value) => (
        <div className="flex items-center gap-2 justify-end">
          <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${value}%` }}
            />
          </div>
          <span className={value >= 80 ? 'text-green-500' : value >= 60 ? 'text-yellow-500' : 'text-red-500'}>
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'factoryList',
      label: t('vendor.factories', '공장'),
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
          <p>{t('vendor.quantity', '수량')}: {formatNumber(data.totalQuantity)}족</p>
          <p>{t('vendor.orders', '주문')}: {formatNumber(data.orderCount)}건</p>
          <p className="text-green-500">{t('vendor.onTime', '정시율')}: {data.onTimeRate}%</p>
          <p>{t('vendor.quality', '품질')}: {data.qualityScore}점</p>
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
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {t('vendor.title', '벤더 분석')}
        </h1>
        <p className="text-sm text-secondary mt-1">
          {t('vendor.subtitle', '벤더/공급업체별 성과 분석')} ({formatNumber(vendorData.length)} {t('vendor.vendors', '벤더')})
        </p>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-card rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            {t('vendor.performanceChart', '벤더별 수량 (Top 10)')}
          </h3>
          {top10Vendors.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={top10Vendors}
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
                  dataKey="vendor"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  width={75}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalQuantity" radius={[0, 4, 4, 0]}>
                  {top10Vendors.map((entry, index) => (
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

        {/* Radar Chart */}
        <div className="bg-card rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {selectedVendor
                ? t('vendor.vendorMetrics', '{{vendor}} 성과 지표', { vendor: selectedVendor })
                : t('vendor.overallMetrics', '전체 성과 지표')
              }
            </h3>
            {selectedVendor && (
              <button
                onClick={() => setSelectedVendor(null)}
                className="text-sm text-blue-500 hover:underline"
              >
                {t('vendor.showAll', '전체 보기')}
              </button>
            )}
          </div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-secondary">{t('chart.noData', '데이터가 없습니다')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Vendor Summary Table */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-theme">
          <h3 className="text-lg font-semibold">
            {t('vendor.summaryTable', '벤더별 집계표')}
          </h3>
        </div>
        <DataTable
          data={vendorData}
          columns={columns}
          showPagination={true}
          pageSize={20}
          loading={loading}
        />
      </div>
    </div>
  );
}

/**
 * @fileoverview Destination Analysis Page
 * Analysis by shipping destination/country.
 *
 * @module pages/DestinationAnalysis
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../contexts/DashboardContext';
import { useOrders } from '../hooks/useOrders';
import { ChartSkeleton, TableSkeleton } from '../components/common/LoadingSpinner';
import { DestinationPieChart } from '../components/charts';
import { DataTable } from '../components/tables';
import { formatNumber, formatPercent } from '../utils/formatters';
import { IMPORTANT_DESTINATIONS, DESTINATION_REGIONS } from '../constants/destinations';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

// Colors for bar chart
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

/**
 * Destination Analysis Page Component
 * Full destination analysis with pie chart and breakdown
 */
export default function DestinationAnalysis() {
  const { t } = useTranslation();
  const { state } = useDashboard();
  const [selectedRegion, setSelectedRegion] = useState('ALL');

  // Get orders data
  const { orders, loading, groupByDestination } = useOrders({
    factory: state.selectedFactory,
    dateMode: state.dateMode
  });

  // Destination data
  const destinationData = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return groupByDestination(orders);
  }, [orders, groupByDestination]);

  // Filtered by region
  const filteredData = useMemo(() => {
    if (selectedRegion === 'ALL') return destinationData;

    const regionDestinations = Object.entries(DESTINATION_REGIONS)
      .filter(([_, region]) => region === selectedRegion)
      .map(([dest]) => dest);

    return destinationData.filter(item =>
      regionDestinations.some(dest =>
        item.destination?.toUpperCase().includes(dest.toUpperCase())
      )
    );
  }, [destinationData, selectedRegion]);

  // Top 10 for bar chart
  const top10Data = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);
  }, [filteredData]);

  // Table columns
  const columns = [
    {
      key: 'destination',
      label: t('destination.country', '행선지'),
      sortable: true,
      align: 'left',
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className={IMPORTANT_DESTINATIONS[value] ? 'font-medium text-blue-600' : ''}>
            {value}
          </span>
          {IMPORTANT_DESTINATIONS[value] && (
            <span className="text-xs text-secondary">({IMPORTANT_DESTINATIONS[value]})</span>
          )}
        </div>
      )
    },
    {
      key: 'orderCount',
      label: t('destination.orderCount', '주문 수'),
      sortable: true,
      align: 'right',
      format: 'number'
    },
    {
      key: 'totalQuantity',
      label: t('destination.totalQty', '총 수량'),
      sortable: true,
      align: 'right',
      format: 'number'
    },
    {
      key: 'completedQuantity',
      label: t('destination.completedQty', '완료'),
      sortable: true,
      align: 'right',
      format: 'number'
    },
    {
      key: 'completionRate',
      label: t('destination.completionRate', '완료율'),
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
      label: t('destination.delayedCount', '지연'),
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className={value > 0 ? 'text-red-500' : ''}>
          {formatNumber(value)}
        </span>
      )
    },
    {
      key: 'share',
      label: t('destination.share', '비율'),
      sortable: true,
      align: 'right',
      render: (_, row) => {
        const total = filteredData.reduce((sum, d) => sum + d.totalQuantity, 0);
        const share = total > 0 ? ((row.totalQuantity / total) * 100).toFixed(1) : 0;
        return `${share}%`;
      }
    }
  ];

  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-card border border-theme rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-sm text-secondary">
          {t('destination.quantity', '수량')}: {formatNumber(payload[0].value)}족
        </p>
      </div>
    );
  };

  // Get unique regions
  const regions = useMemo(() => {
    const uniqueRegions = new Set(Object.values(DESTINATION_REGIONS));
    return ['ALL', ...Array.from(uniqueRegions)];
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
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
            {t('destination.title', '행선지 분석')}
          </h1>
          <p className="text-sm text-secondary mt-1">
            {t('destination.subtitle', '국가/지역별 주문 분포 및 현황 분석')}
          </p>
        </div>

        {/* Region Filter */}
        <div className="flex gap-2 flex-wrap">
          {regions.map(region => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                selectedRegion === region
                  ? 'bg-blue-500 text-white'
                  : 'bg-secondary hover:bg-hover'
              }`}
            >
              {region === 'ALL' ? t('common.all', '전체') : region}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <DestinationPieChart
          data={filteredData}
          title={t('destination.distributionChart', '행선지별 분포')}
          height={300}
          maxSlices={8}
        />

        {/* Bar Chart */}
        <div className="bg-card rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            {t('destination.quantityChart', '행선지별 수량 (Top 10)')}
          </h3>
          {top10Data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={top10Data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  type="number"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  tickFormatter={(value) => formatNumber(value)}
                />
                <YAxis
                  type="category"
                  dataKey="destination"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalQuantity" radius={[0, 4, 4, 0]}>
                  {top10Data.map((entry, index) => (
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
      </div>

      {/* Destination Summary Table */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-theme flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {t('destination.summaryTable', '행선지별 집계표')}
          </h3>
          <span className="text-sm text-secondary">
            {t('destination.totalDestinations', '총 {{count}}개 행선지', { count: filteredData.length })}
          </span>
        </div>
        <DataTable
          data={filteredData}
          columns={columns}
          showPagination={true}
          pageSize={20}
          loading={loading}
        />
      </div>
    </div>
  );
}

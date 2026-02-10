/**
 * @fileoverview Factory Comparison Chart Component
 * Bar chart comparing metrics across factories.
 *
 * @module components/charts/FactoryComparisonChart
 */

import { useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { formatNumber, formatPercent } from '../../utils/formatters';
import { getFactoryColor } from '../../constants/factories';

/**
 * FactoryComparisonChart Component
 * @param {Object} props
 * @param {Object} props.data - Factory data (keyed by factory ID)
 * @param {string} props.title - Chart title
 * @param {number} props.height - Chart height
 * @param {string} props.metric - Metric to display (quantity, completion, delay)
 */
const FactoryComparisonChart = memo(function FactoryComparisonChart({
  data = {},
  title,
  height = 300,
  metric = 'quantity'
}) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    const factories = ['A', 'B', 'C', 'D'];

    return factories.map(factory => {
      const factoryData = data[factory] || {};
      const total = factoryData.totalQuantity || 0;
      const completed = factoryData.completedQuantity || 0;
      const delayed = factoryData.delayedCount || 0;
      const orders = factoryData.orders?.length || 0;

      return {
        factory: `Factory ${factory}`,
        factoryId: factory,
        총수량: total,
        완료수량: completed,
        지연건수: delayed,
        주문수: orders,
        완료율: total > 0 ? Math.round((completed / total) * 100) : 0,
        지연율: orders > 0 ? Math.round((delayed / orders) * 100) : 0,
        color: getFactoryColor(factory)
      };
    });
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const item = payload[0]?.payload;

    return (
      <div className="bg-card border border-theme rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <p>
            {t('chart.totalQty', '총 수량')}: {formatNumber(item.총수량)}족
          </p>
          <p className="text-green-500">
            {t('chart.completedQty', '완료')}: {formatNumber(item.완료수량)}족 ({item.완료율}%)
          </p>
          <p className="text-red-500">
            {t('chart.delayed', '지연')}: {item.지연건수}건 ({item.지연율}%)
          </p>
          <p className="text-secondary">
            {t('chart.orders', '주문')}: {item.주문수}건
          </p>
        </div>
      </div>
    );
  };

  if (Object.keys(data).length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm">
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        <div
          className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg"
          style={{ height }}
        >
          <p className="text-secondary">{t('chart.noData', '데이터가 없습니다')}</p>
        </div>
      </div>
    );
  }

  const getDataKey = () => {
    switch (metric) {
      case 'completion':
        return '완료율';
      case 'delay':
        return '지연율';
      case 'orders':
        return '주문수';
      default:
        return '총수량';
    }
  };

  const getYAxisDomain = () => {
    if (metric === 'completion' || metric === 'delay') {
      return [0, 100];
    }
    return [0, 'auto'];
  };

  const formatYAxisTick = (value) => {
    if (metric === 'completion' || metric === 'delay') {
      return `${value}%`;
    }
    return formatNumber(value);
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="factory"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border-color)' }}
          />
          <YAxis
            domain={getYAxisDomain()}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border-color)' }}
            tickFormatter={formatYAxisTick}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={getDataKey()} radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default FactoryComparisonChart;

/**
 * FactoryStackedChart - Stacked bar chart comparing multiple metrics
 */
export function FactoryStackedChart({
  data = {},
  title,
  height = 300
}) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    const factories = ['A', 'B', 'C', 'D'];

    return factories.map(factory => {
      const factoryData = data[factory] || {};
      const total = factoryData.totalQuantity || 0;
      const completed = factoryData.completedQuantity || 0;

      return {
        factory: `Factory ${factory}`,
        완료: completed,
        잔량: Math.max(0, total - completed)
      };
    });
  }, [data]);

  if (Object.keys(data).length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm">
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        <div
          className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg"
          style={{ height }}
        >
          <p className="text-secondary">{t('chart.noData', '데이터가 없습니다')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="factory"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border-color)' }}
          />
          <YAxis
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border-color)' }}
            tickFormatter={(value) => formatNumber(value)}
          />
          <Tooltip
            formatter={(value, name) => [formatNumber(value) + '족', name]}
            contentStyle={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar dataKey="완료" stackId="a" fill="#22C55E" radius={[0, 0, 0, 0]} />
          <Bar dataKey="잔량" stackId="a" fill="#94A3B8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

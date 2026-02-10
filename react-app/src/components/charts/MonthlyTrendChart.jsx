/**
 * @fileoverview Monthly Trend Chart Component
 * Line/Bar chart showing monthly order trends.
 *
 * @module components/charts/MonthlyTrendChart
 */

import { useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { formatNumber, formatPercent } from '../../utils/formatters';

/**
 * MonthlyTrendChart Component
 * @param {Object} props
 * @param {Object[]} props.data - Monthly data array
 * @param {string} props.title - Chart title
 * @param {string} props.height - Chart height (default: 300)
 * @param {boolean} props.showLegend - Show legend
 */
const MonthlyTrendChart = memo(function MonthlyTrendChart({
  data = [],
  title,
  height = 300,
  showLegend = true
}) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(item => ({
      month: item.month?.replace(/^\d{4}\./, '') || item.month, // Show only MM
      fullMonth: item.month,
      총수량: item.totalQuantity || 0,
      완료수량: item.completedQuantity || 0,
      지연건수: item.delayedCount || 0,
      완료율: item.totalQuantity > 0
        ? Math.round((item.completedQuantity / item.totalQuantity) * 100)
        : 0
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const item = payload[0]?.payload;

    return (
      <div className="bg-card border border-theme rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-2">{item.fullMonth}</p>
        <div className="space-y-1 text-sm">
          <p className="text-blue-500">
            {t('chart.totalQty', '총 수량')}: {formatNumber(item.총수량)}
          </p>
          <p className="text-green-500">
            {t('chart.completedQty', '완료')}: {formatNumber(item.완료수량)}
          </p>
          <p className="text-red-500">
            {t('chart.delayed', '지연')}: {formatNumber(item.지연건수)}건
          </p>
          <p className="text-purple-500">
            {t('chart.completionRate', '완료율')}: {item.완료율}%
          </p>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
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
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border-color)' }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border-color)' }}
            tickFormatter={(value) => formatNumber(value)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border-color)' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => <span className="text-sm">{value}</span>}
            />
          )}
          <Bar
            yAxisId="left"
            dataKey="총수량"
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
            name={t('chart.totalQty', '총 수량')}
          />
          <Bar
            yAxisId="left"
            dataKey="완료수량"
            fill="#22C55E"
            radius={[4, 4, 0, 0]}
            name={t('chart.completedQty', '완료')}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="완료율"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
            name={t('chart.completionRate', '완료율')}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});

export default MonthlyTrendChart;

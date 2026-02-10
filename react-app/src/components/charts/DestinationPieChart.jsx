/**
 * @fileoverview Destination Pie Chart Component
 * Pie/Donut chart showing destination distribution.
 *
 * @module components/charts/DestinationPieChart
 */

import { useMemo, useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { formatNumber, formatPercent } from '../../utils/formatters';

/**
 * Color palette for pie slices
 */
const COLORS = [
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16'  // Lime
];

/**
 * DestinationPieChart Component
 * @param {Object} props
 * @param {Object[]} props.data - Destination data array
 * @param {string} props.title - Chart title
 * @param {number} props.height - Chart height
 * @param {boolean} props.showLegend - Show legend
 * @param {boolean} props.donut - Use donut style
 * @param {number} props.maxSlices - Maximum slices to show
 */
const DestinationPieChart = memo(function DestinationPieChart({
  data = [],
  title,
  height = 300,
  showLegend = true,
  donut = true,
  maxSlices = 8
}) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(-1);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Sort by quantity and limit slices
    const sorted = [...data].sort((a, b) => b.totalQuantity - a.totalQuantity);
    const top = sorted.slice(0, maxSlices);
    const others = sorted.slice(maxSlices);

    // Calculate total for percentages
    const total = data.reduce((sum, d) => sum + (d.totalQuantity || 0), 0);

    const result = top.map(item => ({
      name: item.destination || 'Unknown',
      value: item.totalQuantity || 0,
      orderCount: item.orderCount || 0,
      sharePercent: total > 0 ? (item.totalQuantity / total) * 100 : 0
    }));

    // Add "Others" if needed
    if (others.length > 0) {
      const othersTotal = others.reduce((sum, d) => sum + (d.totalQuantity || 0), 0);
      const othersCount = others.reduce((sum, d) => sum + (d.orderCount || 0), 0);
      result.push({
        name: t('chart.others', '기타'),
        value: othersTotal,
        orderCount: othersCount,
        sharePercent: total > 0 ? (othersTotal / total) * 100 : 0
      });
    }

    return result;
  }, [data, maxSlices, t]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;

    const item = payload[0].payload;

    return (
      <div className="bg-card border border-theme rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-1">{item.name}</p>
        <div className="space-y-1 text-sm">
          <p>
            {t('chart.quantity', '수량')}: {formatNumber(item.value)}족
          </p>
          <p>
            {t('chart.orders', '주문')}: {formatNumber(item.orderCount)}건
          </p>
          <p className="text-blue-500">
            {t('chart.share', '비율')}: {formatPercent(item.sharePercent)}
          </p>
        </div>
      </div>
    );
  };

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name
  }) => {
    if (percent < 0.05) return null; // Don't show labels for small slices

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
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
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={donut ? height / 3 : height / 2.5}
            innerRadius={donut ? height / 5 : 0}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke={activeIndex === index ? '#fff' : 'transparent'}
                strokeWidth={activeIndex === index ? 2 : 0}
                style={{
                  filter: activeIndex === index ? 'brightness(1.1)' : 'none',
                  cursor: 'pointer'
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value, entry) => (
                <span className="text-sm">{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

export default DestinationPieChart;

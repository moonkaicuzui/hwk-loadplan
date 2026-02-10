/**
 * @fileoverview Historical Comparison Component
 * Shows current vs previous month statistics with trend indicators.
 *
 * @module components/dashboard/HistoricalComparison
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Minus, Calendar, RefreshCw } from 'lucide-react';
import { getHistoricalComparison } from '../../services/cloudFunctions';
import { formatNumber, formatPercent } from '../../utils/formatters';

/**
 * Metric configuration with display settings
 */
const METRICS_CONFIG = {
  totalOrders: {
    labelKey: 'kpi.total',
    defaultLabel: '총 주문',
    icon: '📦',
    format: 'number',
    lowerIsBetter: false
  },
  delayedOrders: {
    labelKey: 'kpi.delayed',
    defaultLabel: '지연',
    icon: '🔴',
    format: 'number',
    lowerIsBetter: true
  },
  completionRate: {
    labelKey: 'kpi.completionRate',
    defaultLabel: '완료율',
    icon: '✅',
    format: 'percent',
    lowerIsBetter: false
  },
  warningOrders: {
    labelKey: 'kpi.warning',
    defaultLabel: '경고',
    icon: '⚠️',
    format: 'number',
    lowerIsBetter: true
  },
  totalQuantity: {
    labelKey: 'kpi.quantity',
    defaultLabel: '출고 수량',
    icon: '🚚',
    format: 'number',
    lowerIsBetter: false
  }
};

/**
 * Get trend icon and color
 */
function getTrendDisplay(trend, change) {
  if (trend === 'improved') {
    return {
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      label: '개선'
    };
  }
  if (trend === 'declined') {
    return {
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      label: '악화'
    };
  }
  return {
    icon: Minus,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    label: '유지'
  };
}

/**
 * Format value based on type
 */
function formatValue(value, format) {
  if (format === 'percent') {
    return formatPercent(value);
  }
  return formatNumber(value);
}

/**
 * Historical Comparison Component
 */
export default function HistoricalComparison({ factoryId = 'ALL_FACTORIES', className = '' }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch comparison data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const result = await getHistoricalComparison(factoryId);
        setData(result);
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [factoryId]);

  // Prepare metrics for display
  const metrics = useMemo(() => {
    if (!data?.comparison) return [];

    return Object.entries(METRICS_CONFIG).map(([key, config]) => {
      const comparison = data.comparison[key];
      if (!comparison) return null;

      const trend = getTrendDisplay(comparison.trend, comparison.change);

      return {
        key,
        label: t(config.labelKey, config.defaultLabel),
        icon: config.icon,
        current: formatValue(comparison.current, config.format),
        previous: formatValue(comparison.previous, config.format),
        change: comparison.change,
        trend,
        rawChange: parseFloat(comparison.change)
      };
    }).filter(Boolean);
  }, [data, t]);

  // Refresh handler
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const result = await getHistoricalComparison(factoryId);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-card rounded-xl p-6 shadow-sm ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-card rounded-xl p-6 shadow-sm ${className}`}>
        <p className="text-red-500">{t('common.error', '오류')}: {error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-xl p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">
            {t('dashboard.historicalComparison', '전월 대비')}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-secondary">
            {data?.currentMonth} vs {data?.previousMonth}
          </span>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg hover:bg-hover transition-colors"
            title={t('common.refresh', '새로고침')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metrics.map(metric => {
          const TrendIcon = metric.trend.icon;

          return (
            <div
              key={metric.key}
              className={`rounded-xl p-4 ${metric.trend.bgColor} transition-all hover:scale-105`}
            >
              {/* Label */}
              <div className="flex items-center gap-1.5 mb-2">
                <span>{metric.icon}</span>
                <span className="text-xs font-medium text-secondary">{metric.label}</span>
              </div>

              {/* Current Value */}
              <div className="text-xl font-bold text-primary mb-2">
                {metric.current}
              </div>

              {/* Change Indicator */}
              <div className="flex items-center gap-1.5">
                <TrendIcon className={`w-4 h-4 ${metric.trend.color}`} />
                <span className={`text-sm font-medium ${metric.trend.color}`}>
                  {metric.rawChange > 0 ? '+' : ''}{metric.change}%
                </span>
              </div>

              {/* Previous Value */}
              <div className="text-xs text-secondary mt-1">
                {t('dashboard.previousMonth', '전월')}: {metric.previous}
              </div>

              {/* Trend Label */}
              <div className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${metric.trend.color} ${metric.trend.bgColor}`}>
                {metric.trend.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {metrics.length > 0 && (
        <div className="mt-4 pt-4 border-t border-theme">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-secondary">
              {t('dashboard.summary', '요약')}:
            </span>
            <span className="text-green-500">
              🟢 {metrics.filter(m => m.trend.label === '개선').length}개 개선
            </span>
            <span className="text-red-500">
              🔴 {metrics.filter(m => m.trend.label === '악화').length}개 악화
            </span>
            <span className="text-gray-500">
              ⚪ {metrics.filter(m => m.trend.label === '유지').length}개 유지
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

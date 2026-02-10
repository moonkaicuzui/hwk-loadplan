/**
 * @fileoverview KPI Card Component
 * Displays a single KPI metric with trend indicator.
 *
 * @module components/dashboard/KPICard
 */

import { useState, memo } from 'react';
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';
import { UI_COLORS } from '../../constants';

/**
 * KPICard Component
 * @param {Object} props
 * @param {string} props.title - KPI title
 * @param {string|number} props.value - Main value
 * @param {string} props.subtitle - Additional context
 * @param {string} props.description - Tooltip description explaining the metric
 * @param {number} props.trend - Trend percentage
 * @param {string} props.trendLabel - Trend description
 * @param {React.ReactNode} props.icon - Icon component
 * @param {string} props.color - Color variant (blue, green, yellow, red)
 * @param {Function} props.onClick - Click handler
 */
const KPICard = memo(function KPICard({
  title,
  value,
  subtitle,
  description,
  trend,
  trendLabel,
  icon,
  color = 'blue',
  onClick
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Use centralized UI_COLORS from constants
  const styles = UI_COLORS[color] || UI_COLORS.blue;

  const getTrendIcon = () => {
    if (trend === undefined || trend === null) return null;
    if (trend > 0) return <TrendingUp className="w-4 h-4" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === null) return 'text-secondary';
    if (trend > 0) return 'text-green-500';
    if (trend < 0) return 'text-red-500';
    return 'text-secondary';
  };

  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div
      className={`
        bg-card rounded-xl p-6 shadow-sm
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 focus:ring-2 focus:ring-blue-500 focus:outline-none' : ''}
      `}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `${title}: ${value}` : undefined}
    >
      <div className="flex items-start justify-between">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-sm font-medium text-secondary truncate">
              {title}
            </p>
            {description && (
              <div className="relative">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTooltip(!showTooltip);
                  }}
                  aria-label={`${title} 설명`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
                {showTooltip && (
                  <div className="absolute z-50 left-0 top-full mt-1 w-48 p-2 text-xs bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-lg">
                    {description}
                    <div className="absolute -top-1 left-2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
                  </div>
                )}
              </div>
            )}
          </div>
          <p className={`text-2xl font-bold mt-1 ${styles.text}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-secondary mt-1 truncate">
              {subtitle}
            </p>
          )}

          {/* Trend */}
          {(trend !== undefined || trendLabel) && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${getTrendColor()}`}>
              {getTrendIcon()}
              {trend !== undefined && (
                <span>{trend > 0 ? '+' : ''}{trend}%</span>
              )}
              {trendLabel && (
                <span className="text-secondary">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className={`w-12 h-12 rounded-full ${styles.bg} flex items-center justify-center flex-shrink-0`}>
            <div className={styles.text}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * KPICardSkeleton - Loading state
 */
export function KPICardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
        </div>
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    </div>
  );
}

export default KPICard;

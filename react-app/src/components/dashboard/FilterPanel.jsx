/**
 * @fileoverview Filter Panel Component
 * Provides filtering controls for order data.
 *
 * @module components/dashboard/FilterPanel
 */

import { useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import FilterChip, { ActiveFilters } from '../common/FilterChip';
import { sanitizeSearchQuery } from '../../utils/security';

/**
 * FilterPanel Component
 * Memoized to prevent unnecessary re-renders
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Filter change handler
 * @param {Function} props.onReset - Reset handler
 * @param {Object} props.options - Filter options (months, destinations, vendors)
 * @param {boolean} props.loading - Loading state
 */
const FilterPanel = memo(function FilterPanel({
  filters,
  onFilterChange,
  onReset,
  options = {},
  loading = false
}) {
  const { t } = useTranslation();
  const { state } = useDashboard();
  const [expanded, setExpanded] = useState(false);

  const {
    months = [],
    destinations = [],
    vendors = [],
    factories = ['A', 'B', 'C', 'D']
  } = options;

  const statusOptions = [
    { value: '', label: t('filter.all', '전체') },
    { value: 'completed', label: t('filter.completed', '완료') },
    { value: 'partial', label: t('filter.partial', '진행중') },
    { value: 'pending', label: t('filter.pending', '대기') },
    { value: 'shipped', label: t('filter.shipped', '선적완료') },
    { value: 'delayed', label: t('filter.delayed', '지연') },
    { value: 'warning', label: t('filter.warning', '경고') }
  ];

  // Calculate date ranges for quick filters with dynamic labels
  const quickFilters = useMemo(() => {
    const today = new Date();
    const dateMode = state.dateMode || 'SDD';

    // Format date as MM/DD
    const formatShort = (date) => {
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${mm}/${dd}`;
    };

    // Get week range (Sunday to Saturday)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Get month range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return [
      {
        value: 'delayed',
        label: `${t('quick.delayed', '지연')} (${dateMode})`,
        color: 'red'
      },
      {
        value: 'warning',
        label: `${t('quick.warning', '경고')} (${dateMode})`,
        color: 'yellow'
      },
      {
        value: 'today',
        label: `${t('quick.today', '오늘')} (${formatShort(today)})`,
        color: 'blue'
      },
      {
        value: 'week',
        label: `${t('quick.week', '이번 주')} (${formatShort(weekStart)}~${formatShort(weekEnd)})`,
        color: 'blue'
      },
      {
        value: 'month',
        label: `${t('quick.month', '이번 달')} (${formatShort(monthStart)}~${formatShort(monthEnd)})`,
        color: 'blue'
      }
    ];
  }, [t, state.dateMode]);

  const handleFilterChange = useCallback((key, value) => {
    if (onFilterChange) {
      // Sanitize search input to prevent XSS
      if (key === 'search' && typeof value === 'string') {
        value = sanitizeSearchQuery(value, 200);
      }
      onFilterChange(key, value);
    }
  }, [onFilterChange]);

  const handleQuickFilter = useCallback((value) => {
    const newValue = filters.quickFilter === value ? '' : value;
    handleFilterChange('quickFilter', newValue);
  }, [filters.quickFilter, handleFilterChange]);

  // Memoize activeFiltersArray to prevent recreation on every render
  const activeFiltersArray = useMemo(() => {
    const result = [];
    if (filters.search) {
      result.push({ key: 'search', label: '검색', value: filters.search });
    }
    if (filters.month) {
      result.push({ key: 'month', label: '월', value: filters.month });
    }
    if (filters.destination) {
      result.push({ key: 'destination', label: '행선지', value: filters.destination });
    }
    if (filters.vendor) {
      result.push({ key: 'vendor', label: '벤더', value: filters.vendor });
    }
    if (filters.status) {
      result.push({ key: 'status', label: '상태', value: filters.status });
    }
    return result;
  }, [filters.search, filters.month, filters.destination, filters.vendor, filters.status]);

  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-hover transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-500" />
          <span className="font-medium">{t('filter.title', '필터')}</span>
          {activeFiltersArray.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
              {activeFiltersArray.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersArray.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReset && onReset();
              }}
              className="p-1.5 text-secondary hover:text-primary hover:bg-hover rounded transition-colors"
              title={t('filter.reset', '초기화')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-secondary" />
          )}
        </div>
      </div>

      {/* Quick Filters (always visible) */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((qf) => (
            <FilterChip
              key={qf.value}
              label={qf.label}
              color={qf.color}
              active={filters.quickFilter === qf.value}
              onClick={() => handleQuickFilter(qf.value)}
            />
          ))}
        </div>
      </div>

      {/* Expanded Filters */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-theme pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('filter.search', '검색')}
              </label>
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder={t('filter.searchPlaceholder', 'PO#, 스타일...')}
                className="w-full px-3 py-2 bg-primary border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                data-filter-input
                disabled={loading}
              />
            </div>

            {/* Month */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('filter.month', '월')}
              </label>
              <select
                value={filters.month || ''}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="w-full px-3 py-2 bg-primary border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              >
                <option value="">{t('filter.all', '전체')}</option>
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('filter.destination', '행선지')}
              </label>
              <select
                value={filters.destination || ''}
                onChange={(e) => handleFilterChange('destination', e.target.value)}
                className="w-full px-3 py-2 bg-primary border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              >
                <option value="">{t('filter.all', '전체')}</option>
                <option value="asia">{t('filter.asia', '아시아 (주요)')}</option>
                {destinations.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('filter.status', '상태')}
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-primary border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('filter.vendor', '벤더')}
              </label>
              <select
                value={filters.vendor || ''}
                onChange={(e) => handleFilterChange('vendor', e.target.value)}
                className="w-full px-3 py-2 bg-primary border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              >
                <option value="">{t('filter.all', '전체')}</option>
                {vendors.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Date Range Start */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('filter.dateStart', '시작일')}
              </label>
              <input
                type="date"
                value={filters.dateRange?.start || ''}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  start: e.target.value
                })}
                className="w-full px-3 py-2 bg-primary border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            {/* Date Range End */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('filter.dateEnd', '종료일')}
              </label>
              <input
                type="date"
                value={filters.dateRange?.end || ''}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  end: e.target.value
                })}
                className="w-full px-3 py-2 bg-primary border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            {/* Filter Logic */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('filter.logic', '필터 조합')}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFilterChange('filterLogic', 'AND')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.filterLogic === 'AND'
                      ? 'bg-blue-500 text-white'
                      : 'bg-primary border border-theme hover:bg-hover'
                  }`}
                  disabled={loading}
                >
                  AND
                </button>
                <button
                  onClick={() => handleFilterChange('filterLogic', 'OR')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.filterLogic === 'OR'
                      ? 'bg-blue-500 text-white'
                      : 'bg-primary border border-theme hover:bg-hover'
                  }`}
                  disabled={loading}
                >
                  OR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {activeFiltersArray.length > 0 && (
        <div className="px-4 pb-4">
          <ActiveFilters
            filters={activeFiltersArray}
            onRemove={(key) => handleFilterChange(key, key === 'dateRange' ? { start: '', end: '' } : '')}
            onClearAll={onReset}
          />
        </div>
      )}
    </div>
  );
});

export default FilterPanel;

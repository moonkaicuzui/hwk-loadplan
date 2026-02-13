/**
 * @fileoverview Virtualized Table Component
 * Renders only visible rows for performance with large datasets (10,000+ rows).
 * Uses windowing technique to minimize DOM nodes and improve scroll performance.
 *
 * @module components/tables/VirtualizedTable
 */

import { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronUp, ChevronDown, ChevronsUpDown, HelpCircle } from 'lucide-react';

const ROW_HEIGHT = 48; // pixels per row
const BUFFER_SIZE = 5; // extra rows to render above/below viewport

/**
 * Column abbreviation descriptions for tooltips
 */
const COLUMN_DESCRIPTIONS = {
  'poNumber': 'Purchase Order Number - 구매 주문 번호',
  'crd': 'Customer Required Date - 고객 요청 납기일. 이 날짜까지 고객에게 도착해야 함',
  'crdDate': 'Customer Required Date - 고객 요청 납기일. 이 날짜까지 고객에게 도착해야 함',
  'sdd': 'Scheduled Delivery Date - 공장 출고 예정일',
  'sddValue': 'Scheduled Delivery Date - 공장 출고 예정일',
  'wh_in': 'Warehouse In - 제품창고 입고 완료 수량',
  'wh_out': 'Warehouse Out - 제품창고 출고 완료 수량'
};

/**
 * Sortable Header Component with tooltip support
 * Memoized to prevent unnecessary re-renders
 */
const SortableHeader = memo(function SortableHeader({ column, label, sortKey, sortOrder, onSort, width, flex }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isSorted = sortKey === column;
  const description = COLUMN_DESCRIPTIONS[column];

  return (
    <div
      className="px-4 py-3 text-sm font-medium cursor-pointer hover:bg-hover transition-colors flex items-center gap-1"
      style={{ width: width || 'auto', flex: flex || 1 }}
      onClick={() => onSort(column)}
      role="columnheader"
      aria-sort={isSorted ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span>{label}</span>
      {description && (
        <div className="relative">
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(!showTooltip);
            }}
            aria-label={`${label} 설명`}
          >
            <HelpCircle className="w-3 h-3" />
          </button>
          {showTooltip && (
            <div className="absolute z-50 left-0 top-full mt-1 w-48 p-2 text-xs bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-lg font-normal">
              {description}
              <div className="absolute -top-1 left-2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
            </div>
          )}
        </div>
      )}
      {isSorted ? (
        sortOrder === 'asc' ? (
          <ChevronUp className="w-4 h-4 text-blue-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-blue-500" />
        )
      ) : (
        <ChevronsUpDown className="w-4 h-4 text-secondary opacity-50" />
      )}
    </div>
  );
});

/**
 * VirtualizedTable Component
 * High-performance table that only renders visible rows.
 *
 * @param {Object} props
 * @param {Object[]} props.data - Array of data rows
 * @param {Object[]} props.columns - Column definitions with key, header, width, flex, render, sortable
 * @param {number} props.rowHeight - Height of each row in pixels (default: 48)
 * @param {number} props.maxHeight - Maximum height of the table body (default: 600)
 * @param {Function} props.onRowClick - Callback when a row is clicked
 * @param {Function} props.getRowClass - Function to get additional CSS classes for a row
 * @param {string} props.emptyMessage - Message to show when data is empty
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.showLegend - Show status legend (default: true)
 */
function VirtualizedTable({
  data = [],
  columns = [],
  rowHeight = ROW_HEIGHT,
  maxHeight = 600,
  onRowClick,
  getRowClass,
  emptyMessage,
  loading = false,
  showLegend = true
}) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [sortKey, setSortKey] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  // Handle sorting
  const handleSort = useCallback((key) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
    // Reset scroll position on sort
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [sortKey]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      // Handle nulls
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle strings
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortOrder]);

  // Calculate total height for scroll container
  const totalHeight = sortedData.length * rowHeight;

  // Calculate visible rows based on scroll position
  const { startIndex, endIndex, visibleData } = useMemo(() => {
    const containerHeight = maxHeight;
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - BUFFER_SIZE);
    const visibleCount = Math.ceil(containerHeight / rowHeight) + (BUFFER_SIZE * 2);
    const end = Math.min(sortedData.length, start + visibleCount);

    return {
      startIndex: start,
      endIndex: end,
      visibleData: sortedData.slice(start, end)
    };
  }, [sortedData, scrollTop, rowHeight, maxHeight]);

  // Handle scroll event
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Reset scroll when data changes significantly
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [data.length]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-secondary" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 p-4 border-b border-theme">
              {columns.map((col, j) => (
                <div key={j} className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (sortedData.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="text-center py-8 text-secondary">
          {emptyMessage || t('common.noData', '데이터가 없습니다')}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden">
      {/* Row Status Legend */}
      {showLegend && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-theme flex flex-wrap items-center gap-4 text-xs">
          <span className="text-secondary font-medium">{t('table.legend', '상태 범례')}:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700" />
            <span>{t('table.legendDelayed', '지연 (SDD > CRD)')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700" />
            <span>{t('table.legendWarning', '경고 (납기 3일 이내)')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700" />
            <span>{t('table.legendShipped', '출고 완료')}</span>
          </div>
          <div className="ml-auto text-secondary">
            {t('table.virtualizedInfo', '{{count}}개 항목 (가상 스크롤)', { count: sortedData.length.toLocaleString() })}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-secondary border-b border-theme" role="row">
        <div className="flex">
          {columns.map((col, idx) => (
            col.sortable !== false ? (
              <SortableHeader
                key={col.key || idx}
                column={col.key}
                label={col.header}
                sortKey={sortKey}
                sortOrder={sortOrder}
                onSort={handleSort}
                width={col.width}
                flex={col.flex}
              />
            ) : (
              <div
                key={col.key || idx}
                className="px-4 py-3 text-sm font-medium text-secondary"
                style={{ width: col.width || 'auto', flex: col.flex || 1 }}
                role="columnheader"
              >
                {col.header}
              </div>
            )
          ))}
        </div>
      </div>

      {/* Virtualized Body */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ maxHeight }}
        onScroll={handleScroll}
        role="rowgroup"
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleData.map((row, idx) => {
            const actualIndex = startIndex + idx;
            const rowClasses = getRowClass ? getRowClass(row) : '';

            return (
              <div
                key={row.id || row.poNumber || actualIndex}
                className={`flex border-b border-theme hover:bg-hover transition-colors ${rowClasses} ${onRowClick ? 'cursor-pointer' : ''}`}
                style={{
                  position: 'absolute',
                  top: actualIndex * rowHeight,
                  height: rowHeight,
                  width: '100%'
                }}
                onClick={() => onRowClick?.(row)}
                role="row"
                aria-rowindex={actualIndex + 1}
              >
                {columns.map((col, colIdx) => (
                  <div
                    key={col.key || colIdx}
                    className={`px-4 flex items-center text-sm ${
                      col.align === 'right' ? 'justify-end' :
                      col.align === 'center' ? 'justify-center' : 'justify-start'
                    }`}
                    style={{ width: col.width || 'auto', flex: col.flex || 1 }}
                    role="cell"
                  >
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer with stats */}
      <div className="px-4 py-2 border-t border-theme bg-gray-50 dark:bg-gray-800/50 text-xs text-secondary">
        <div className="flex justify-between items-center">
          <span>
            {t('table.renderingInfo', '현재 {{visible}}개 렌더링 중 (전체 {{total}}개)', {
              visible: visibleData.length,
              total: sortedData.length.toLocaleString()
            })}
          </span>
          <span>
            {t('table.scrollPosition', '스크롤 위치: {{start}} - {{end}}', {
              start: startIndex + 1,
              end: Math.min(endIndex, sortedData.length)
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(VirtualizedTable);

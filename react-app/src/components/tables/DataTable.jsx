/**
 * @fileoverview Data Table Component
 * Sortable, paginated data table for order data.
 * Automatically switches to virtualized rendering for large datasets.
 *
 * @module components/tables/DataTable
 */

import { useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronUp, ChevronDown, ChevronsUpDown, HelpCircle } from 'lucide-react';
import Pagination from '../common/Pagination';
import VirtualizedTable from './VirtualizedTable';
import { formatNumber, formatDate } from '../../utils/formatters';
import { isDelayed, isWarning, isShipped, getOrderHighlightClass } from '../../utils/orderUtils';

// Threshold for switching to virtualized rendering
const VIRTUALIZATION_THRESHOLD = 100;

/**
 * Column abbreviation descriptions
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
 * SortableHeader Component with tooltip support
 * Memoized to prevent unnecessary re-renders
 */
const SortableHeader = memo(function SortableHeader({ column, label, sortKey, sortOrder, onSort, className = '' }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isSorted = sortKey === column;
  const description = COLUMN_DESCRIPTIONS[column];

  return (
    <th
      className={`px-4 py-3 text-sm font-medium cursor-pointer hover:bg-hover transition-colors ${className}`}
      onClick={() => onSort(column)}
      aria-sort={isSorted ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <div className="flex items-center gap-1">
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
    </th>
  );
});

/**
 * Format cell value helper - moved outside component for memoization
 */
const formatValue = (value, format) => {
  if (value == null) return '-';

  switch (format) {
    case 'number':
      return formatNumber(value);
    case 'date':
      return formatDate(value);
    case 'percent':
      return `${value}%`;
    default:
      return value;
  }
};

/**
 * DataTable Component
 * @param {Object} props
 * @param {Object[]} props.data - Array of order data
 * @param {Object[]} props.columns - Column definitions
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.showPagination - Show pagination controls
 * @param {number} props.pageSize - Items per page
 * @param {Function} props.onRowClick - Row click handler
 * @param {boolean} props.virtualize - Force virtualization (auto-detected if not specified)
 * @param {number} props.virtualizationThreshold - Row count threshold for auto-virtualization (default: 100)
 * @param {number} props.maxHeight - Max height for virtualized table (default: 600)
 */
export default function DataTable({
  data = [],
  columns,
  loading = false,
  showPagination = true,
  pageSize: initialPageSize = 50,
  onRowClick,
  virtualize,
  virtualizationThreshold = VIRTUALIZATION_THRESHOLD,
  maxHeight = 600
}) {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Default columns if not provided
  const defaultColumns = [
    { key: 'poNumber', label: 'PO#', sortable: true, align: 'left' },
    { key: 'article', label: t('table.style', '스타일'), sortable: true, align: 'left' },
    { key: 'destination', label: t('table.destination', '행선지'), sortable: true, align: 'left' },
    { key: 'quantity', label: t('table.quantity', '수량'), sortable: true, align: 'right', format: 'number' },
    { key: 'crd', label: 'CRD', sortable: true, align: 'center', format: 'date' },
    { key: 'sddValue', label: 'SDD', sortable: true, align: 'center', format: 'date' },
    { key: 'factory', label: t('table.factory', '공장'), sortable: true, align: 'center' }
  ];

  const tableColumns = columns || defaultColumns;

  // Determine if virtualization should be used
  const shouldVirtualize = virtualize !== undefined
    ? virtualize
    : data.length > virtualizationThreshold;

  // Handle sorting
  const handleSort = useCallback((key) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortOrder('asc');
      return key;
    });
    setCurrentPage(1);
  }, []);

  // Convert columns format for VirtualizedTable
  const virtualizedColumns = useMemo(() => {
    return tableColumns.map(col => ({
      key: col.key,
      header: col.label,
      width: col.width,
      flex: col.flex || 1,
      align: col.align,
      sortable: col.sortable !== false,
      render: col.render || ((value) => formatValue(value, col.format))
    }));
  }, [tableColumns]);

  // Sort and paginate data (must be before conditional return to satisfy React hooks rules)
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let result = [...data];

    if (sortKey) {
      result.sort((a, b) => {
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
    }

    return result;
  }, [data, sortKey, sortOrder]);

  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;

    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, showPagination]);

  // If virtualization is enabled, delegate to VirtualizedTable
  if (shouldVirtualize) {
    return (
      <VirtualizedTable
        data={data}
        columns={virtualizedColumns}
        maxHeight={maxHeight}
        onRowClick={onRowClick}
        getRowClass={getOrderHighlightClass}
        loading={loading}
        emptyMessage={t('table.noData', '데이터가 없습니다')}
      />
    );
  }

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Get row class for highlighting
  const getRowClass = (order) => {
    const highlightClass = getOrderHighlightClass(order);
    return `
      border-b border-theme transition-colors
      ${onRowClick ? 'cursor-pointer hover:bg-hover' : ''}
      ${highlightClass}
    `;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-secondary" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 p-4 border-b border-theme">
              {tableColumns.map((col, j) => (
                <div key={j} className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-8 text-center">
        <p className="text-secondary">{t('table.noData', '데이터가 없습니다')}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden">
      {/* Row Status Legend */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-theme flex items-center gap-4 text-xs">
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
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              {tableColumns.map((col) => (
                col.sortable ? (
                  <SortableHeader
                    key={col.key}
                    column={col.key}
                    label={col.label}
                    sortKey={sortKey}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    className={col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                  />
                ) : (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-sm font-medium ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    {col.label}
                  </th>
                )
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr
                key={row.id || row.poNumber || index}
                className={getRowClass(row)}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {tableColumns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-sm ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : formatValue(row[col.key], col.format)
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}

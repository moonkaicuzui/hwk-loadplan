/**
 * @fileoverview Data Explorer Page
 * Interactive data table with filtering and sorting.
 *
 * @module pages/DataExplorer
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Filter, RefreshCw, X, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';
import { useOrders } from '../hooks/useOrders';
import { useFilters } from '../hooks/useFilters';
import { TableSkeleton } from '../components/common/LoadingSpinner';
import { DataTable } from '../components/tables';
import { FilterPanel } from '../components/dashboard';
import { formatNumber, formatDate, formatPercent } from '../utils/formatters';
import { getOrderStatus, getProductionData } from '../utils/orderUtils';
import { exportToExcel, exportToCSV } from '../services/exportService';

/**
 * Data Explorer Page Component
 * Full data explorer with filtering and export
 */
export default function DataExplorer() {
  const { t } = useTranslation();
  const { state, dispatch } = useDashboard();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // Close export menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get orders data
  const { orders, loading, refresh } = useOrders({
    factory: state.selectedFactory,
    dateMode: state.dateMode
  });

  // Filter management
  const { filters, setFilter, resetFilters, activeFilterCount, applyFilters } = useFilters();

  // Apply filters to orders
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return applyFilters(orders);
  }, [orders, applyFilters]);

  // Export to Excel
  const handleExportExcel = useCallback((includeStages = false) => {
    if (filteredOrders.length === 0) return;

    try {
      exportToExcel(filteredOrders, 'orders', {
        useKoreanHeaders: true,
        includeProductionStages: includeStages,
        sheetName: t('data.title', '주문 데이터')
      });
      setShowExportMenu(false);
    } catch (error) {
      console.error('[DataExplorer] Excel export failed:', error);
    }
  }, [filteredOrders, t]);

  // Export to CSV
  const handleExportCSV = useCallback((includeStages = false) => {
    if (filteredOrders.length === 0) return;

    try {
      exportToCSV(filteredOrders, 'orders', {
        useKoreanHeaders: true,
        includeProductionStages: includeStages
      });
      setShowExportMenu(false);
    } catch (error) {
      console.error('[DataExplorer] CSV export failed:', error);
    }
  }, [filteredOrders]);

  // Table columns with full details
  const columns = [
    {
      key: 'poNumber',
      label: t('table.po', 'PO#'),
      sortable: true,
      align: 'left'
    },
    {
      key: 'style',
      label: t('table.style', '스타일'),
      sortable: true,
      align: 'left'
    },
    {
      key: 'destination',
      label: t('table.destination', '행선지'),
      sortable: true,
      align: 'left'
    },
    {
      key: 'quantity',
      label: t('table.quantity', '수량'),
      sortable: true,
      align: 'right',
      format: 'number'
    },
    {
      key: 'crd',
      label: 'CRD',
      sortable: true,
      align: 'center',
      format: 'date'
    },
    {
      key: 'sddValue',
      label: 'SDD',
      sortable: true,
      align: 'center',
      format: 'date'
    },
    {
      key: 'factory',
      label: t('table.factory', '공장'),
      sortable: true,
      align: 'center'
    },
    {
      key: 'status',
      label: t('table.status', '상태'),
      sortable: false,
      align: 'center',
      render: (_, order) => {
        const status = getOrderStatus(order);
        const statusColors = {
          completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          partial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
          delayed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[status] || statusColors.pending}`}>
            {t(`status.${status}`, status)}
          </span>
        );
      }
    },
    {
      key: 'progress',
      label: t('table.progress', '진행률'),
      sortable: false,
      align: 'center',
      render: (_, order) => {
        const qty = order.quantity || order.ttl_qty || 0;
        const completed = getProductionData(order, 'wh_out', 'completed', 0);
        const progress = qty > 0 ? Math.round((completed / qty) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : progress > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className="text-xs text-secondary">{progress}%</span>
          </div>
        );
      }
    }
  ];

  // Handle row click for details
  const handleRowClick = (order) => {
    setSelectedOrder(order);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={15} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {t('data.title', '데이터 탐색')}
          </h1>
          <p className="text-sm text-secondary mt-1">
            {t('data.subtitle', '전체 주문 데이터 조회 및 필터링')} ({formatNumber(filteredOrders.length)}건)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
              ${showFilters || activeFilterCount > 0 ? 'bg-blue-500 text-white' : 'bg-card hover:bg-hover border border-theme'}
            `}
          >
            <Filter className="w-4 h-4" />
            <span>{t('data.filter', '필터')}</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-theme rounded-lg hover:bg-hover transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">{t('data.refresh', '새로고침')}</span>
          </button>
          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={filteredOrders.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('data.export', '내보내기')}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Export Menu */}
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-theme rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <p className="px-3 py-1 text-xs text-secondary font-medium uppercase">
                    {t('data.exportFormat', '내보내기 형식')}
                  </p>

                  {/* Excel Export */}
                  <button
                    onClick={() => handleExportExcel(false)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-hover rounded-lg transition-colors"
                  >
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Excel (.xlsx)</p>
                      <p className="text-xs text-secondary">{t('data.basicColumns', '기본 컬럼')}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExportExcel(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-hover rounded-lg transition-colors"
                  >
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Excel (.xlsx)</p>
                      <p className="text-xs text-secondary">{t('data.allColumns', '전체 컬럼 (공정 포함)')}</p>
                    </div>
                  </button>

                  <hr className="my-2 border-theme" />

                  {/* CSV Export */}
                  <button
                    onClick={() => handleExportCSV(false)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-hover rounded-lg transition-colors"
                  >
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">CSV (.csv)</p>
                      <p className="text-xs text-secondary">{t('data.basicColumns', '기본 컬럼')}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExportCSV(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-hover rounded-lg transition-colors"
                  >
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">CSV (.csv)</p>
                      <p className="text-xs text-secondary">{t('data.allColumns', '전체 컬럼 (공정 포함)')}</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onFilterChange={setFilter}
          onReset={resetFilters}
          orders={orders}
        />
      )}

      {/* Data Table */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <DataTable
          data={filteredOrders}
          columns={columns}
          showPagination={true}
          pageSize={50}
          loading={loading}
          onRowClick={handleRowClick}
        />
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-theme flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {t('data.orderDetail', '주문 상세')} - {selectedOrder.poNumber}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-hover rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-secondary">PO#</p>
                  <p className="font-medium">{selectedOrder.poNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">{t('table.style', '스타일')}</p>
                  <p className="font-medium">{selectedOrder.style}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">{t('table.destination', '행선지')}</p>
                  <p className="font-medium">{selectedOrder.destination}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">{t('table.factory', '공장')}</p>
                  <p className="font-medium">Factory {selectedOrder.factory}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">{t('table.quantity', '수량')}</p>
                  <p className="font-medium">{formatNumber(selectedOrder.quantity || selectedOrder.ttl_qty)}족</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">{t('data.completed', '완료')}</p>
                  <p className="font-medium text-green-500">{formatNumber(getProductionData(selectedOrder, 'wh_out', 'completed', 0))}족</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">CRD</p>
                  <p className="font-medium">{formatDate(selectedOrder.crd)}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary">SDD</p>
                  <p className="font-medium">{formatDate(selectedOrder.sddValue)}</p>
                </div>
              </div>

              {/* Process Progress */}
              <div className="pt-4 border-t border-theme">
                <h4 className="text-sm font-medium mb-3">{t('data.processProgress', '공정 진행 현황')}</h4>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {['s_cut', 'pre_sew', 'sew_input', 'sew_bal', 's_fit', 'ass_bal', 'wh_in', 'wh_out'].map(stage => (
                    <div key={stage} className="p-2 bg-secondary rounded text-center">
                      <p className="text-secondary uppercase">{stage.replace('_', ' ')}</p>
                      <p className="font-medium">{formatNumber(getProductionData(selectedOrder, stage, 'completed', 0))}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

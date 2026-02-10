/**
 * @fileoverview Order Search Page
 * Quick search functionality for finding specific orders.
 *
 * @module pages/OrderSearch
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Package, Calendar, MapPin, X, AlertTriangle, Clock } from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';
import { useOrders } from '../hooks/useOrders';
import { formatNumber, formatDate } from '../utils/formatters';
import { getOrderStatus, isDelayed, isWarning, getProductionData } from '../utils/orderUtils';
import { isWithinWeek } from '../utils/dateUtils';

/**
 * Order Search Page Component
 * Full search with actual data
 */
export default function OrderSearch() {
  const { t } = useTranslation();
  const { state } = useDashboard();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Get all orders
  const { orders, loading } = useOrders({
    factory: state.selectedFactory,
    dateMode: state.dateMode
  });

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !orders) return [];

    const query = searchQuery.toLowerCase().trim();

    return orders.filter(order => {
      const po = (order.poNumber || '').toLowerCase();
      const style = (order.article || '').toLowerCase();
      const dest = (order.destination || '').toLowerCase();
      const buyer = (order.buyer || '').toLowerCase();

      return po.includes(query) ||
             style.includes(query) ||
             dest.includes(query) ||
             buyer.includes(query);
    }).slice(0, 100); // Limit to 100 results
  }, [searchQuery, orders]);

  // Quick access stats
  const quickStats = useMemo(() => {
    if (!orders || orders.length === 0) {
      return { delayed: 0, warning: 0, thisWeek: 0, completed: 0 };
    }

    const today = new Date();
    let delayed = 0;
    let warning = 0;
    let thisWeek = 0;
    let completed = 0;

    orders.forEach(order => {
      if (isDelayed(order)) delayed++;
      if (isWarning(order)) warning++;
      if (order.sddValue && isWithinWeek(order.sddValue)) thisWeek++;
      const qty = order.quantity || order.ttl_qty || 0;
      const whOut = getProductionData(order, 'wh_out', 'completed', 0);
      if (whOut >= qty && qty > 0) completed++;
    });

    return { delayed, warning, thisWeek, completed };
  }, [orders]);

  // Handle search
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setIsSearching(true);
    // Simulate search delay
    setTimeout(() => setIsSearching(false), 200);
  }, []);

  // Quick filter
  const handleQuickFilter = useCallback((filterType) => {
    switch (filterType) {
      case 'delayed':
        setSearchQuery('');
        break;
      case 'warning':
        setSearchQuery('');
        break;
      case 'thisWeek':
        setSearchQuery('');
        break;
      case 'completed':
        setSearchQuery('');
        break;
    }
  }, []);

  // Get filtered orders by type
  const getFilteredOrders = useCallback((filterType) => {
    if (!orders) return [];

    switch (filterType) {
      case 'delayed':
        return orders.filter(o => isDelayed(o)).slice(0, 50);
      case 'warning':
        return orders.filter(o => isWarning(o)).slice(0, 50);
      case 'thisWeek':
        return orders.filter(o => o.sddValue && isWithinWeek(o.sddValue)).slice(0, 50);
      case 'completed':
        return orders.filter(o => {
          const qty = o.quantity || o.ttl_qty || 0;
          const whOut = getProductionData(o, 'wh_out', 'completed', 0);
          return whOut >= qty && qty > 0;
        }).slice(0, 50);
      default:
        return [];
    }
  }, [orders]);

  // Render order card
  const OrderCard = ({ order }) => {
    const status = getOrderStatus(order);
    const qty = order.quantity || order.ttl_qty || 0;
    const completed = getProductionData(order, 'wh_out', 'completed', 0);
    const progress = qty > 0 ? Math.round((completed / qty) * 100) : 0;

    const statusColors = {
      completed: 'border-green-500',
      partial: 'border-blue-500',
      pending: 'border-gray-300 dark:border-gray-600',
      delayed: 'border-red-500',
      warning: 'border-yellow-500'
    };

    return (
      <div
        onClick={() => setSelectedOrder(order)}
        className={`p-4 bg-primary rounded-lg border-l-4 ${statusColors[status]} cursor-pointer hover:bg-hover transition-colors`}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-medium">{order.poNumber}</p>
            <p className="text-sm text-secondary">{order.article}</p>
          </div>
          <span className={`px-2 py-1 text-xs rounded ${
            status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            status === 'delayed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            status === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {t(`status.${status}`, status)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-secondary">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {order.destination}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(order.crd)}
            </span>
          </div>
          <span className="font-medium">{progress}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {t('search.title', '주문 검색')}
        </h1>
        <p className="text-sm text-secondary mt-1">
          {t('search.subtitle', 'PO#, 스타일, 바이어 등으로 주문 검색')}
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.placeholder', 'PO#, 스타일, 바이어 입력...')}
              className="w-full pl-10 pr-4 py-3 bg-primary border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-hover rounded"
              >
                <X className="w-4 h-4 text-secondary" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? t('search.searching', '검색 중...') : t('search.search', '검색')}
          </button>
        </form>

        {/* Search Tips */}
        <div className="mt-4 text-sm text-secondary">
          <p className="font-medium mb-2">{t('search.tips', '검색 팁')}:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>{t('search.tip1', 'PO 번호로 정확히 검색: "PO-12345"')}</li>
            <li>{t('search.tip2', '스타일 코드로 검색: "ABC-001"')}</li>
            <li>{t('search.tip3', '바이어명으로 검색: "Nike"')}</li>
            <li>{t('search.tip4', '부분 검색 지원: "123" → PO-123, STYLE-123 등')}</li>
          </ul>
        </div>
      </div>

      {/* Search Results */}
      {searchQuery.trim() && searchResults.length > 0 ? (
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-theme">
            <h3 className="text-lg font-semibold">
              {t('search.results', '검색 결과')} ({searchResults.length}건)
            </h3>
          </div>
          <div className="p-4 space-y-2 max-h-[60vh] overflow-auto">
            {searchResults.map((order, index) => (
              <OrderCard key={order.id || order.poNumber || index} order={order} />
            ))}
          </div>
        </div>
      ) : searchQuery.trim() && !isSearching ? (
        <div className="bg-card rounded-xl p-12 shadow-sm text-center">
          <Package className="w-16 h-16 mx-auto text-secondary mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {t('search.noResults', '검색 결과가 없습니다')}
          </h3>
          <p className="text-sm text-secondary">
            {t('search.noResultsDesc', '검색어를 확인하고 다시 시도해 주세요.')}
          </p>
        </div>
      ) : (
        /* Quick Access */
        <div className="bg-card rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            {t('search.quickAccess', '빠른 접근')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => handleQuickFilter('delayed')}
              className="flex items-center gap-3 p-4 bg-primary rounded-lg hover:bg-hover transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium">{t('search.delayedOrders', '지연 주문')}</p>
                <p className="text-xs text-secondary">{formatNumber(quickStats.delayed)} {t('search.count', '건')}</p>
              </div>
            </button>

            <button
              onClick={() => handleQuickFilter('warning')}
              className="flex items-center gap-3 p-4 bg-primary rounded-lg hover:bg-hover transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="font-medium">{t('search.warningOrders', '경고 주문')}</p>
                <p className="text-xs text-secondary">{formatNumber(quickStats.warning)} {t('search.count', '건')}</p>
              </div>
            </button>

            <button
              onClick={() => handleQuickFilter('thisWeek')}
              className="flex items-center gap-3 p-4 bg-primary rounded-lg hover:bg-hover transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">{t('search.thisWeek', '이번 주 출고')}</p>
                <p className="text-xs text-secondary">{formatNumber(quickStats.thisWeek)} {t('search.count', '건')}</p>
              </div>
            </button>

            <button
              onClick={() => handleQuickFilter('completed')}
              className="flex items-center gap-3 p-4 bg-primary rounded-lg hover:bg-hover transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Package className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">{t('search.recentCompleted', '최근 완료')}</p>
                <p className="text-xs text-secondary">{formatNumber(quickStats.completed)} {t('search.count', '건')}</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-theme flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {t('search.orderDetail', '주문 상세')} - {selectedOrder.poNumber}
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
                  <p className="font-medium">{selectedOrder.article}</p>
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
                  <p className="text-sm text-secondary">{t('search.completed', '완료')}</p>
                  <p className="font-medium text-green-500">{formatNumber(selectedOrder.wh_out || 0)}족</p>
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
                <h4 className="text-sm font-medium mb-3">{t('search.processProgress', '공정 진행 현황')}</h4>
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

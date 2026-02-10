/**
 * @fileoverview AQL Event Form Component
 * 기존 오더 데이터와 연결되는 AQL Reject 이벤트 입력 폼
 *
 * @module components/quality/AQLEventForm
 */

import { useState, useMemo } from 'react';
import { X, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * 불량 유형 정의 (label은 i18n key로 대체)
 */
const DEFECT_TYPES = [
  { value: 'critical', labelKey: 'aql.defect.critical', color: 'red' },
  { value: 'major', labelKey: 'aql.defect.major', color: 'orange' },
  { value: 'minor', labelKey: 'aql.defect.minor', color: 'yellow' }
];

/**
 * AQL 검사 결과 상태
 */
const AQL_STATUS = {
  REJECT: 'reject',
  REPACKING: 'repacking',
  REINSPECTION: 'reinspection',
  PASS: 'pass'
};

/**
 * AQLEventForm - AQL Reject 이벤트 등록 폼
 */
export default function AQLEventForm({
  orders = [],
  onSubmit,
  onClose,
  existingEvent = null // 수정 모드용
}) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(existingEvent?.order || null);
  const [formData, setFormData] = useState({
    rejectQty: existingEvent?.rejectQty || '',
    defectType: existingEvent?.defectType || 'major',
    defectDescription: existingEvent?.defectDescription || '',
    expectedRepackDate: existingEvent?.expectedRepackDate || '',
    status: existingEvent?.status || AQL_STATUS.REJECT,
    notes: existingEvent?.notes || ''
  });
  const [showOrderList, setShowOrderList] = useState(false);

  // 오더 검색 필터링
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders.slice(0, 20);

    const query = searchQuery.toLowerCase();
    return orders
      .filter(order => {
        const po = (order['Sales Order and Item'] || order['PO#'] || '').toLowerCase();
        const article = (order['Art'] || order['Article'] || '').toLowerCase();
        const style = (order['Style'] || '').toLowerCase();
        return po.includes(query) || article.includes(query) || style.includes(query);
      })
      .slice(0, 20);
  }, [orders, searchQuery]);

  // 오더 선택 시 자동 정보 표시
  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setShowOrderList(false);
    setSearchQuery('');
  };

  // 폼 제출
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedOrder) {
      alert(t('aql.selectPOAlert'));
      return;
    }

    const event = {
      id: existingEvent?.id || `aql_${Date.now()}`,
      orderId: selectedOrder['Sales Order and Item'] || selectedOrder['PO#'],
      order: selectedOrder,
      ...formData,
      rejectQty: parseInt(formData.rejectQty) || 0,
      createdAt: existingEvent?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSubmit(event);
  };

  // 선택된 오더 정보 추출
  const getOrderInfo = (order) => {
    if (!order) return null;
    return {
      po: order['Sales Order and Item'] || order['PO#'] || '-',
      article: order['Art'] || order['Article'] || '-',
      qty: order['Q.ty'] || order['Qty'] || 0,
      crd: order['CRD'] || '-',
      factory: order['Unit'] || order['Factory'] || '-',
      destination: order['Dest'] || order['Destination'] || '-'
    };
  };

  const orderInfo = getOrderInfo(selectedOrder);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-primary">
              {existingEvent ? t('aql.editEvent') : t('aql.addEvent')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-hover transition-colors"
          >
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* PO 검색/선택 */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              {t('aql.selectPO')} *
            </label>
            <div className="relative">
              <div className="flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowOrderList(true);
                  }}
                  onFocus={() => setShowOrderList(true)}
                  placeholder={t('aql.searchPO')}
                  className="w-full pl-10 pr-4 py-2 border border-theme rounded-lg bg-card focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 오더 드롭다운 */}
              {showOrderList && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-theme rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredOrders.length === 0 ? (
                    <div className="p-3 text-sm text-secondary text-center">
                      {t('aql.noResults')}
                    </div>
                  ) : (
                    filteredOrders.map((order, idx) => {
                      const info = getOrderInfo(order);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleOrderSelect(order)}
                          className="w-full p-3 text-left hover:bg-hover border-b border-theme last:border-0"
                        >
                          <div className="text-sm font-medium text-primary">{info.po}</div>
                          <div className="text-xs text-secondary">
                            {info.article} | {info.qty}{t('aql.pairs')} | CRD: {info.crd}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 선택된 오더 정보 */}
          {orderInfo && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                {t('aql.selectedOrder')}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
                <div>PO#: <span className="font-medium">{orderInfo.po}</span></div>
                <div>Article: <span className="font-medium">{orderInfo.article}</span></div>
                <div>{t('aql.quantity')}: <span className="font-medium">{Number(orderInfo.qty).toLocaleString()}{t('aql.pairs')}</span></div>
                <div>CRD: <span className="font-medium">{orderInfo.crd}</span></div>
                <div>{t('aql.factory')}: <span className="font-medium">{orderInfo.factory}</span></div>
                <div>{t('aql.destination')}: <span className="font-medium">{orderInfo.destination}</span></div>
              </div>
            </div>
          )}

          {/* Reject 수량 */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              {t('aql.rejectQty')} *
            </label>
            <input
              type="number"
              value={formData.rejectQty}
              onChange={(e) => setFormData(prev => ({ ...prev, rejectQty: e.target.value }))}
              placeholder={t('aql.rejectQty')}
              min="0"
              required
              className="w-full px-4 py-2 border border-theme rounded-lg bg-card focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 불량 유형 */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              {t('aql.defectType')}
            </label>
            <select
              value={formData.defectType}
              onChange={(e) => setFormData(prev => ({ ...prev, defectType: e.target.value }))}
              className="w-full px-4 py-2 border border-theme rounded-lg bg-card focus:ring-2 focus:ring-blue-500"
            >
              {DEFECT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {t(type.labelKey)}
                </option>
              ))}
            </select>
          </div>

          {/* 불량 내용 */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              {t('aql.defectDescription')}
            </label>
            <input
              type="text"
              value={formData.defectDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, defectDescription: e.target.value }))}
              placeholder={t('aql.defectPlaceholder')}
              className="w-full px-4 py-2 border border-theme rounded-lg bg-card focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 상태 */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              {t('aql.currentStatus')}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-2 border border-theme rounded-lg bg-card focus:ring-2 focus:ring-blue-500"
            >
              <option value={AQL_STATUS.REJECT}>{t('aql.status.reject')}</option>
              <option value={AQL_STATUS.REPACKING}>{t('aql.status.repacking')}</option>
              <option value={AQL_STATUS.REINSPECTION}>{t('aql.status.reinspection')}</option>
              <option value={AQL_STATUS.PASS}>{t('aql.status.pass')}</option>
            </select>
          </div>

          {/* 예상 리패킹 완료일 */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              {t('aql.expectedRepackDate')}
            </label>
            <input
              type="date"
              value={formData.expectedRepackDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedRepackDate: e.target.value }))}
              className="w-full px-4 py-2 border border-theme rounded-lg bg-card focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 비고 */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              {t('aql.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={t('aql.notesPlaceholder')}
              rows={2}
              className="w-full px-4 py-2 border border-theme rounded-lg bg-card focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-theme rounded-lg hover:bg-hover transition-colors"
            >
              {t('aql.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {existingEvent ? t('aql.update') : t('aql.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { AQL_STATUS, DEFECT_TYPES };

/**
 * @fileoverview AQL Risk Dashboard Component
 * AQL reject 이벤트와 연관된 리스크 시각화 대시보드
 *
 * @module components/quality/AQLRiskDashboard
 */

import { useMemo, useState } from 'react';
import { AlertTriangle, Clock, CheckCircle, Package, RefreshCw, Plus, Trash2, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AQL_STATUS, DEFECT_TYPES } from './AQLEventForm';

/**
 * 상태별 스타일 정의 (labelKey로 i18n 지원)
 */
const STATUS_CONFIG = {
  [AQL_STATUS.REJECT]: {
    labelKey: 'aql.status.reject',
    icon: AlertTriangle,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-red-500'
  },
  [AQL_STATUS.REPACKING]: {
    labelKey: 'aql.status.repacking',
    icon: Package,
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-700 dark:text-orange-300',
    borderColor: 'border-orange-500'
  },
  [AQL_STATUS.REINSPECTION]: {
    labelKey: 'aql.status.reinspection',
    icon: RefreshCw,
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    borderColor: 'border-yellow-500'
  },
  [AQL_STATUS.PASS]: {
    labelKey: 'aql.status.pass',
    icon: CheckCircle,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-300',
    borderColor: 'border-green-500'
  }
};

/**
 * CRD까지 남은 일수 계산
 */
function getDaysUntilCRD(crdValue) {
  if (!crdValue || crdValue === '-') return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let crdDate;
  const str = String(crdValue).trim();

  // MM/DD 형식
  if (/^\d{1,2}\/\d{1,2}$/.test(str)) {
    const [month, day] = str.split('/').map(Number);
    crdDate = new Date(today.getFullYear(), month - 1, day);
    // 6개월 이상 지났으면 다음 해로
    if ((today - crdDate) > 180 * 24 * 60 * 60 * 1000) {
      crdDate.setFullYear(today.getFullYear() + 1);
    }
  } else {
    crdDate = new Date(str);
  }

  if (isNaN(crdDate.getTime())) return null;

  const diffDays = Math.ceil((crdDate - today) / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * AQLRiskDashboard - AQL 리스크 현황 대시보드
 */
export default function AQLRiskDashboard({
  aqlEvents = [],
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onUpdateStatus
}) {
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showCompleted, setShowCompleted] = useState(false);

  // 요약 통계
  const summary = useMemo(() => {
    const counts = {
      reject: 0,
      repacking: 0,
      reinspection: 0,
      pass: 0,
      crdAtRisk: 0,
      totalRejectQty: 0
    };

    aqlEvents.forEach(event => {
      counts[event.status]++;
      if (event.status !== AQL_STATUS.PASS) {
        counts.totalRejectQty += event.rejectQty || 0;

        // CRD 위험 판정: 리패킹 예상 완료일이 CRD보다 늦거나, 남은 일수 3일 이내
        const daysUntilCRD = getDaysUntilCRD(event.order?.CRD);
        if (daysUntilCRD !== null && daysUntilCRD <= 3) {
          counts.crdAtRisk++;
        }
      }
    });

    return counts;
  }, [aqlEvents]);

  // 필터링된 이벤트
  const filteredEvents = useMemo(() => {
    let filtered = [...aqlEvents];

    // 완료된 항목 필터
    if (!showCompleted) {
      filtered = filtered.filter(e => e.status !== AQL_STATUS.PASS);
    }

    // 상태 필터
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(e => e.status === filterStatus);
    }

    // 정렬: CRD 임박순
    filtered.sort((a, b) => {
      const aDays = getDaysUntilCRD(a.order?.CRD) ?? 999;
      const bDays = getDaysUntilCRD(b.order?.CRD) ?? 999;
      return aDays - bDays;
    });

    return filtered;
  }, [aqlEvents, filterStatus, showCompleted]);

  // Article별 반복 reject 분석
  const articleRiskAnalysis = useMemo(() => {
    const articleCounts = {};

    aqlEvents.forEach(event => {
      const article = event.order?.Art || event.order?.Article;
      if (!article) return;

      if (!articleCounts[article]) {
        articleCounts[article] = { count: 0, totalQty: 0, defectTypes: [] };
      }
      articleCounts[article].count++;
      articleCounts[article].totalQty += event.rejectQty || 0;
      if (!articleCounts[article].defectTypes.includes(event.defectType)) {
        articleCounts[article].defectTypes.push(event.defectType);
      }
    });

    // 2회 이상 reject된 Article만 반환
    return Object.entries(articleCounts)
      .filter(([, data]) => data.count >= 2)
      .sort((a, b) => b[1].count - a[1].count);
  }, [aqlEvents]);

  if (aqlEvents.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary">{t('aql.dashboard.title')}</h3>
          <button
            onClick={onAddEvent}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            {t('aql.dashboard.registerReject')}
          </button>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-secondary">{t('aql.dashboard.noEvents')}</p>
          <p className="text-sm text-muted mt-1">{t('aql.dashboard.noEventsSubtitle')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-primary">{t('aql.dashboard.title')}</h3>
        <button
          onClick={onAddEvent}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          {t('aql.dashboard.registerReject')}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard
          icon={AlertTriangle}
          label={t('aql.dashboard.reinspectionPending')}
          value={summary.reinspection}
          color="yellow"
          onClick={() => setFilterStatus(AQL_STATUS.REINSPECTION)}
          active={filterStatus === AQL_STATUS.REINSPECTION}
        />
        <SummaryCard
          icon={Package}
          label={t('aql.dashboard.repackingInProgressLabel')}
          value={summary.repacking}
          color="orange"
          onClick={() => setFilterStatus(AQL_STATUS.REPACKING)}
          active={filterStatus === AQL_STATUS.REPACKING}
        />
        <SummaryCard
          icon={Clock}
          label={t('aql.dashboard.crdAtRisk')}
          value={summary.crdAtRisk}
          color="red"
          subtitle={t('aql.dashboard.crdAtRiskSubtitle')}
        />
        <SummaryCard
          icon={Package}
          label={t('aql.dashboard.totalRejectQty')}
          value={summary.totalRejectQty.toLocaleString()}
          color="gray"
          subtitle={t('aql.dashboard.totalRejectQtySubtitle')}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-theme rounded-lg px-3 py-1.5 bg-card"
          >
            <option value="ALL">{t('aql.dashboard.allStatus')}</option>
            <option value={AQL_STATUS.REJECT}>Reject</option>
            <option value={AQL_STATUS.REPACKING}>Repacking</option>
            <option value={AQL_STATUS.REINSPECTION}>Re-inspection</option>
            <option value={AQL_STATUS.PASS}>Pass</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-secondary">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="rounded"
          />
          {t('aql.dashboard.includeCompleted')}
        </label>
      </div>

      {/* Event List */}
      <div className="space-y-3 mb-6">
        {filteredEvents.map(event => (
          <AQLEventCard
            key={event.id}
            event={event}
            onEdit={() => onEditEvent(event)}
            onDelete={() => onDeleteEvent(event.id)}
            onStatusChange={(newStatus) => onUpdateStatus(event.id, newStatus)}
            t={t}
          />
        ))}
      </div>

      {/* Article Risk Analysis */}
      {articleRiskAnalysis.length > 0 && (
        <div className="mt-6 pt-4 border-t border-theme">
          <h4 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            {t('aql.dashboard.articleRisk')}
          </h4>
          <div className="space-y-2">
            {articleRiskAnalysis.map(([article, data]) => (
              <div
                key={article}
                className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
              >
                <div>
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    {article}
                  </span>
                  <span className="text-xs text-orange-600 dark:text-orange-300 ml-2">
                    ({data.defectTypes.join(', ')})
                  </span>
                </div>
                <div className="text-sm font-bold text-orange-700 dark:text-orange-300">
                  {data.count}{t('aql.dashboard.repeatReject')} / {data.totalQty.toLocaleString()}{t('aql.pairs')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SummaryCard - 요약 카드
 */
function SummaryCard({ icon: Icon, label, value, color, subtitle, onClick, active }) {
  const colorClasses = {
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    gray: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
  };

  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg text-left transition-all ${colorClasses[color]} ${
        active ? 'ring-2 ring-offset-2 ring-gray-400' : ''
      } ${onClick ? 'hover:scale-105 cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs opacity-75 mt-1">{subtitle}</div>}
    </button>
  );
}

/**
 * AQLEventCard - 개별 AQL 이벤트 카드
 */
function AQLEventCard({ event, onEdit, onDelete, onStatusChange, t }) {
  const statusConfig = STATUS_CONFIG[event.status];
  const StatusIcon = statusConfig?.icon || AlertTriangle;

  const orderInfo = event.order || {};
  const po = orderInfo['Sales Order and Item'] || orderInfo['PO#'] || '-';
  const article = orderInfo['Art'] || orderInfo['Article'] || '-';
  const crd = orderInfo['CRD'] || '-';

  const daysUntilCRD = getDaysUntilCRD(crd);
  const isCrdAtRisk = daysUntilCRD !== null && daysUntilCRD <= 3 && event.status !== AQL_STATUS.PASS;

  const defectType = DEFECT_TYPES.find(dt => dt.value === event.defectType);

  return (
    <div className={`rounded-lg p-4 border-l-4 ${statusConfig?.bgColor} ${statusConfig?.borderColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <StatusIcon className={`w-4 h-4 ${statusConfig?.textColor}`} />
            <span className={`text-sm font-medium ${statusConfig?.textColor}`}>
              {t(statusConfig?.labelKey)}
            </span>
            {isCrdAtRisk && (
              <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {t('aql.dashboard.crdAtRisk')}
              </span>
            )}
          </div>

          {/* Order Info */}
          <div className="mb-2">
            <div className="text-sm font-medium text-primary">{po}</div>
            <div className="text-xs text-secondary">
              {article} | CRD: {crd}
              {daysUntilCRD !== null && (
                <span className={daysUntilCRD <= 0 ? 'text-red-500 font-medium' : ''}>
                  {' '}({daysUntilCRD <= 0 ? `D+${Math.abs(daysUntilCRD)}` : `D-${daysUntilCRD}`})
                </span>
              )}
            </div>
          </div>

          {/* Reject Info */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 bg-white/50 dark:bg-black/20 rounded">
              Reject: {event.rejectQty?.toLocaleString()}{t('aql.pairs')}
            </span>
            {defectType && (
              <span className="px-2 py-1 bg-white/50 dark:bg-black/20 rounded">
                {t(defectType.labelKey)}
              </span>
            )}
            {event.defectDescription && (
              <span className="px-2 py-1 bg-white/50 dark:bg-black/20 rounded">
                {event.defectDescription}
              </span>
            )}
          </div>

          {/* Expected Repack Date */}
          {event.expectedRepackDate && (
            <div className="text-xs text-secondary mt-2">
              {t('aql.dashboard.expectedRepack')}: {event.expectedRepackDate}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 ml-4">
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-white/50 dark:hover:bg-black/20 rounded transition-colors"
            title={t('aql.dashboard.edit')}
          >
            <Edit2 className="w-4 h-4 text-secondary" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-white/50 dark:hover:bg-black/20 rounded transition-colors"
            title={t('aql.dashboard.delete')}
          >
            <Trash2 className="w-4 h-4 text-secondary" />
          </button>
        </div>
      </div>

      {/* Quick Status Change */}
      {event.status !== AQL_STATUS.PASS && (
        <div className="mt-3 pt-3 border-t border-white/30 dark:border-black/20 flex gap-2">
          {event.status === AQL_STATUS.REJECT && (
            <button
              onClick={() => onStatusChange(AQL_STATUS.REPACKING)}
              className="text-xs px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              → {t('aql.dashboard.startRepacking')}
            </button>
          )}
          {event.status === AQL_STATUS.REPACKING && (
            <button
              onClick={() => onStatusChange(AQL_STATUS.REINSPECTION)}
              className="text-xs px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              → {t('aql.dashboard.waitReinspection')}
            </button>
          )}
          {event.status === AQL_STATUS.REINSPECTION && (
            <>
              <button
                onClick={() => onStatusChange(AQL_STATUS.PASS)}
                className="text-xs px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                ✓ {t('aql.dashboard.passLabel')}
              </button>
              <button
                onClick={() => onStatusChange(AQL_STATUS.REPACKING)}
                className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                ✗ {t('aql.dashboard.reReject')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * @fileoverview KPI Grid Component
 * Executive summary with key metrics.
 *
 * @module components/dashboard/KPIGrid
 */

import { memo, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, CheckCircle, AlertTriangle, Clock, Truck, XCircle } from 'lucide-react';
import KPICard, { KPICardSkeleton } from './KPICard';
import { formatNumber, formatPercent } from '../../utils/formatters';

// Pre-created icon elements to avoid re-creation on each render
const ICONS = {
  package: <Package className="w-6 h-6" />,
  checkCircle: <CheckCircle className="w-6 h-6" />,
  truck: <Truck className="w-6 h-6" />,
  clock: <Clock className="w-6 h-6" />,
  alertTriangle: <AlertTriangle className="w-6 h-6" />,
  xCircle: <XCircle className="w-6 h-6" />
};

/**
 * KPIGrid Component
 * @param {Object} props
 * @param {Object} props.statistics - Order statistics
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onCardClick - Card click handler
 */
const KPIGrid = memo(function KPIGrid({ statistics, loading, onCardClick }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const stats = statistics || {
    total: 0,
    totalQuantity: 0,
    completed: 0,
    completedQuantity: 0,
    shipped: 0,
    shippedQuantity: 0,
    delayed: 0,
    delayedQuantity: 0,
    warning: 0,
    warningQuantity: 0,
    pending: 0,
    completionRate: 0,
    delayRate: 0,
    shippedRate: 0
  };

  // Memoize kpiCards array to prevent recreation on every render
  const kpiCards = useMemo(() => [
    {
      id: 'total',
      title: t('kpi.totalOrders', '총 주문'),
      value: formatNumber(stats.total),
      subtitle: `${formatNumber(stats.totalQuantity)}족`,
      description: t('kpi.totalOrdersDesc', '현재 진행 중인 모든 주문 건수와 총 수량'),
      icon: ICONS.package,
      color: 'blue'
    },
    {
      id: 'completed',
      title: t('kpi.completed', '완료'),
      value: formatNumber(stats.completed),
      subtitle: formatPercent(stats.completionRate),
      description: t('kpi.completedDesc', '창고 입고(WH_IN) 수량 >= 주문 수량인 주문'),
      icon: ICONS.checkCircle,
      color: 'green'
    },
    {
      id: 'shipped',
      title: t('kpi.shipped', '선적 완료'),
      value: formatNumber(stats.shipped),
      subtitle: formatPercent(stats.shippedRate),
      description: t('kpi.shippedDesc', '창고 출고(WH_OUT) 수량 >= 주문 수량인 주문'),
      icon: ICONS.truck,
      color: 'green'
    },
    {
      id: 'pending',
      title: t('kpi.inProgress', '진행중'),
      value: formatNumber(stats.pending),
      subtitle: `${formatNumber(stats.totalQuantity - stats.completedQuantity)}족 잔량`,
      description: t('kpi.inProgressDesc', 'WH_IN 미완료 주문 (부분 완료 포함)'),
      icon: ICONS.clock,
      color: 'blue'
    },
    {
      id: 'warning',
      title: t('kpi.warning', '경고'),
      value: formatNumber(stats.warning),
      subtitle: `${formatNumber(stats.warningQuantity)}족`,
      description: t('kpi.warningDesc', 'CRD(고객납기)까지 3일 이내 남은 주문. 우선 처리 필요'),
      icon: ICONS.alertTriangle,
      color: 'yellow'
    },
    {
      id: 'delayed',
      title: t('kpi.delayed', '지연'),
      value: formatNumber(stats.delayed),
      subtitle: formatPercent(stats.delayRate),
      description: t('kpi.delayedDesc', 'SDD(출고예정일)가 CRD(고객납기)를 초과한 주문. 즉시 조치 필요'),
      icon: ICONS.xCircle,
      color: 'red'
    }
  ], [t, stats]);

  // Memoize click handlers to prevent prop changes
  const handleCardClick = useCallback((cardId) => {
    if (onCardClick) {
      onCardClick(cardId);
    }
  }, [onCardClick]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpiCards.map((card) => (
        <KPICard
          key={card.id}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          description={card.description}
          trend={card.trend}
          icon={card.icon}
          color={card.color}
          onClick={onCardClick ? handleCardClick.bind(null, card.id) : undefined}
        />
      ))}
    </div>
  );
});

export default KPIGrid;

/**
 * CompactKPIGrid - 4-column layout for smaller spaces
 */
export const CompactKPIGrid = memo(function CompactKPIGrid({ statistics, loading, onCardClick }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const stats = statistics || {
    total: 0,
    completed: 0,
    warning: 0,
    delayed: 0,
    completionRate: 0,
    delayRate: 0
  };

  const kpiCards = useMemo(() => [
    {
      id: 'total',
      title: t('kpi.totalOrders', '총 주문'),
      value: formatNumber(stats.total),
      icon: ICONS.package,
      color: 'blue'
    },
    {
      id: 'completed',
      title: t('kpi.completed', '완료'),
      value: formatNumber(stats.completed),
      subtitle: formatPercent(stats.completionRate),
      icon: ICONS.checkCircle,
      color: 'green'
    },
    {
      id: 'warning',
      title: t('kpi.warning', '경고'),
      value: formatNumber(stats.warning),
      icon: ICONS.alertTriangle,
      color: 'yellow'
    },
    {
      id: 'delayed',
      title: t('kpi.delayed', '지연'),
      value: formatNumber(stats.delayed),
      subtitle: formatPercent(stats.delayRate),
      icon: ICONS.xCircle,
      color: 'red'
    }
  ], [t, stats]);

  const handleCardClick = useCallback((cardId) => {
    if (onCardClick) {
      onCardClick(cardId);
    }
  }, [onCardClick]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiCards.map((card) => (
        <KPICard
          key={card.id}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
          color={card.color}
          onClick={onCardClick ? handleCardClick.bind(null, card.id) : undefined}
        />
      ))}
    </div>
  );
});

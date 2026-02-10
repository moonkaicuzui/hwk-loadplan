/**
 * @fileoverview Monitoring Page
 * Real-time monitoring of critical orders and alerts.
 *
 * @module pages/Monitoring
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, AlertTriangle, Clock, CheckCircle, XCircle, RefreshCw, MapPin, Calendar, Plus, ShieldAlert } from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';
import { useOrders } from '../hooks/useOrders';
import { useAQLEvents } from '../hooks/useAQLEvents';
import { CardSkeleton } from '../components/common/LoadingSpinner';
import ComponentErrorBoundary from '../components/common/ComponentErrorBoundary';
import { WIPMonitor } from '../components/dashboard';
import { AQLRiskDashboard, AQLEventForm } from '../components/quality';
import { formatNumber, formatDate } from '../utils/formatters';
import { isDelayed, isWarning, isCritical, getProductionData } from '../utils/orderUtils';
import { isWithinWeek, getDaysDifference } from '../utils/dateUtils';

/**
 * Monitoring Page Component
 * Full monitoring with real-time data
 */
export default function Monitoring() {
  const { t } = useTranslation();
  const { state } = useDashboard();
  const [activeTab, setActiveTab] = useState('critical');
  const [showAQLForm, setShowAQLForm] = useState(false);
  const [editingAQLEvent, setEditingAQLEvent] = useState(null);

  // AQL Events Hook
  const {
    events: aqlEvents,
    addEvent: addAQLEvent,
    updateEvent: updateAQLEvent,
    updateStatus: updateAQLStatus,
    deleteEvent: deleteAQLEvent
  } = useAQLEvents();

  // Get orders data
  const { orders, loading, refresh, lastUpdated } = useOrders({
    factory: state.selectedFactory,
    dateMode: state.dateMode
  });

  // Calculate status counts
  const statusCounts = useMemo(() => {
    if (!orders || orders.length === 0) {
      return { critical: 0, warning: 0, pending: 0, completed: 0 };
    }

    let critical = 0;
    let warning = 0;
    let pending = 0;
    let completed = 0;

    orders.forEach(order => {
      const qty = order.quantity || order.ttl_qty || 0;
      const whOut = getProductionData(order, 'wh_out', 'completed', 0);

      if (whOut >= qty && qty > 0) {
        completed++;
      } else if (isCritical(order)) {
        critical++;
      } else if (isDelayed(order)) {
        critical++;
      } else if (isWarning(order)) {
        warning++;
      } else {
        pending++;
      }
    });

    return { critical, warning, pending, completed };
  }, [orders]);

  // Filter orders by status
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    switch (activeTab) {
      case 'critical':
        return orders.filter(o => isCritical(o) || isDelayed(o)).slice(0, 50);
      case 'warning':
        return orders.filter(o => isWarning(o) && !isDelayed(o)).slice(0, 50);
      case 'pending':
        return orders.filter(o => {
          const qty = o.quantity || o.ttl_qty || 0;
          const whOut = getProductionData(o, 'wh_out', 'completed', 0);
          return whOut < qty && !isDelayed(o) && !isWarning(o) && !isCritical(o);
        }).slice(0, 50);
      case 'completed':
        return orders.filter(o => {
          const qty = o.quantity || o.ttl_qty || 0;
          const whOut = getProductionData(o, 'wh_out', 'completed', 0);
          return whOut >= qty && qty > 0;
        }).slice(0, 50);
      default:
        return [];
    }
  }, [orders, activeTab]);

  // Recent activities (simulated based on order status)
  const recentActivities = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const activities = [];

    // Get recently completed
    const completed = orders
      .filter(o => {
        const qty = o.quantity || o.ttl_qty || 0;
        const whOut = getProductionData(o, 'wh_out', 'completed', 0);
        return whOut >= qty && qty > 0;
      })
      .slice(0, 5)
      .map(o => ({
        type: 'completed',
        message: t('monitoring.activityCompleted', '{{po}} 주문 완료', { po: o.poNumber }),
        time: t('monitoring.recent', '최근'),
        icon: CheckCircle,
        color: 'text-green-500'
      }));

    // Get recently delayed
    const delayed = orders
      .filter(o => isDelayed(o))
      .slice(0, 3)
      .map(o => ({
        type: 'delayed',
        message: t('monitoring.activityDelayed', '{{po}} 지연 발생', { po: o.poNumber }),
        time: t('monitoring.recent', '최근'),
        icon: XCircle,
        color: 'text-red-500'
      }));

    // Get warnings
    const warnings = orders
      .filter(o => isWarning(o))
      .slice(0, 3)
      .map(o => ({
        type: 'warning',
        message: t('monitoring.activityWarning', '{{po}} 경고 상태', { po: o.poNumber }),
        time: t('monitoring.recent', '최근'),
        icon: AlertTriangle,
        color: 'text-yellow-500'
      }));

    return [...delayed, ...warnings, ...completed].slice(0, 10);
  }, [orders, t]);

  // Order card component
  const OrderAlert = ({ order }) => {
    const qty = order.quantity || order.ttl_qty || 0;
    const completed = getProductionData(order, 'wh_out', 'completed', 0);
    const progress = qty > 0 ? Math.round((completed / qty) * 100) : 0;
    const daysUntilCrd = getDaysDifference(new Date(), order.crd);

    let statusColor = 'border-gray-300';
    let statusBg = 'bg-gray-50 dark:bg-gray-800';
    let statusText = t('monitoring.pending', '진행중');

    if (isDelayed(order) || isCritical(order)) {
      statusColor = 'border-red-500';
      statusBg = 'bg-red-50 dark:bg-red-900/20';
      statusText = isCritical(order) ? t('monitoring.critical', '긴급') : t('monitoring.delayed', '지연');
    } else if (isWarning(order)) {
      statusColor = 'border-yellow-500';
      statusBg = 'bg-yellow-50 dark:bg-yellow-900/20';
      statusText = t('monitoring.warning', '경고');
    }

    return (
      <div className={`p-4 rounded-lg border-l-4 ${statusColor} ${statusBg}`}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-medium">{order.poNumber}</p>
            <p className="text-sm text-secondary">{order.article}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            isDelayed(order) || isCritical(order) ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            isWarning(order) ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {statusText}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div className="flex items-center gap-1 text-secondary">
            <MapPin className="w-3 h-3" />
            {order.destination}
          </div>
          <div className="flex items-center gap-1 text-secondary">
            <Calendar className="w-3 h-3" />
            CRD: {formatDate(order.crd)}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  progress >= 100 ? 'bg-green-500' : progress > 50 ? 'bg-blue-500' : 'bg-gray-400'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span>{progress}%</span>
          </div>
          <div className="text-secondary">
            {formatNumber(completed)} / {formatNumber(qty)} 족
          </div>
        </div>

        {daysUntilCrd !== null && daysUntilCrd <= 7 && (
          <div className={`mt-2 text-xs ${daysUntilCrd <= 0 ? 'text-red-500' : daysUntilCrd <= 3 ? 'text-yellow-500' : 'text-secondary'}`}>
            {daysUntilCrd <= 0
              ? t('monitoring.overdue', 'CRD {{days}}일 초과', { days: Math.abs(daysUntilCrd) })
              : t('monitoring.daysRemaining', 'CRD까지 {{days}}일', { days: daysUntilCrd })
            }
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {t('monitoring.title', '모니터링')}
          </h1>
          <p className="text-sm text-secondary mt-1">
            {t('monitoring.subtitle', '실시간 주문 현황 및 알림 모니터링')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-theme rounded-lg hover:bg-hover transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('monitoring.refresh', '새로고침')}</span>
          </button>
          <span className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {t('monitoring.live', '실시간')}
          </span>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('critical')}
          className={`bg-card rounded-xl p-6 shadow-sm border-l-4 border-red-500 text-left transition-all ${
            activeTab === 'critical' ? 'ring-2 ring-red-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">{t('monitoring.critical', '긴급/지연')}</p>
              <p className="text-3xl font-bold text-red-500">{formatNumber(statusCounts.critical)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('warning')}
          className={`bg-card rounded-xl p-6 shadow-sm border-l-4 border-yellow-500 text-left transition-all ${
            activeTab === 'warning' ? 'ring-2 ring-yellow-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">{t('monitoring.warning', '경고')}</p>
              <p className="text-3xl font-bold text-yellow-500">{formatNumber(statusCounts.warning)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`bg-card rounded-xl p-6 shadow-sm border-l-4 border-blue-500 text-left transition-all ${
            activeTab === 'pending' ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">{t('monitoring.pending', '진행중')}</p>
              <p className="text-3xl font-bold text-blue-500">{formatNumber(statusCounts.pending)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`bg-card rounded-xl p-6 shadow-sm border-l-4 border-green-500 text-left transition-all ${
            activeTab === 'completed' ? 'ring-2 ring-green-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary">{t('monitoring.completed', '완료')}</p>
              <p className="text-3xl font-bold text-green-500">{formatNumber(statusCounts.completed)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Alerts */}
        <div className="lg:col-span-2 bg-card rounded-xl shadow-sm overflow-hidden">
          <div className={`p-4 border-b border-theme ${
            activeTab === 'critical' ? 'bg-red-50 dark:bg-red-900/20' :
            activeTab === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
            activeTab === 'completed' ? 'bg-green-50 dark:bg-green-900/20' :
            'bg-blue-50 dark:bg-blue-900/20'
          }`}>
            <h3 className={`text-lg font-semibold flex items-center gap-2 ${
              activeTab === 'critical' ? 'text-red-600 dark:text-red-400' :
              activeTab === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
              activeTab === 'completed' ? 'text-green-600 dark:text-green-400' :
              'text-blue-600 dark:text-blue-400'
            }`}>
              {activeTab === 'critical' && <XCircle className="w-5 h-5" />}
              {activeTab === 'warning' && <AlertTriangle className="w-5 h-5" />}
              {activeTab === 'pending' && <Clock className="w-5 h-5" />}
              {activeTab === 'completed' && <CheckCircle className="w-5 h-5" />}
              {t(`monitoring.${activeTab}Orders`, `${activeTab} 주문`)} ({filteredOrders.length})
            </h3>
          </div>
          <div className="p-4 max-h-[600px] overflow-auto">
            {filteredOrders.length > 0 ? (
              <div className="space-y-3">
                {filteredOrders.map((order, index) => (
                  <OrderAlert key={order.id || order.poNumber || index} order={order} />
                ))}
              </div>
            ) : (
              <p className="text-center text-secondary py-8">
                {t('monitoring.noOrders', '해당 주문이 없습니다')}
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-theme">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t('monitoring.recentActivity', '최근 활동')}
            </h3>
          </div>
          <div className="p-4 max-h-[600px] overflow-auto">
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-primary rounded-lg">
                    <activity.icon className={`w-5 h-5 ${activity.color} flex-shrink-0 mt-0.5`} />
                    <div>
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-secondary">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-secondary py-8">
                {t('monitoring.noActivity', '최근 활동이 없습니다')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AQL Risk Management Section */}
      <ComponentErrorBoundary name="AQL 리스크 대시보드">
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-theme bg-orange-50 dark:bg-orange-900/20 flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <ShieldAlert className="w-5 h-5" />
              {t('monitoring.aqlRisk', 'AQL 리스크 관리')}
            </h3>
            <button
              onClick={() => {
                setEditingAQLEvent(null);
                setShowAQLForm(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              {t('monitoring.addAQLEvent', 'AQL Reject 등록')}
            </button>
          </div>
          <div className="p-4">
            <AQLRiskDashboard
              aqlEvents={aqlEvents}
              onAddEvent={() => {
                setEditingAQLEvent(null);
                setShowAQLForm(true);
              }}
              onEditEvent={(event) => {
                setEditingAQLEvent(event);
                setShowAQLForm(true);
              }}
              onDeleteEvent={deleteAQLEvent}
              onUpdateStatus={updateAQLStatus}
            />
          </div>
        </div>
      </ComponentErrorBoundary>

      {/* WIP Monitor - 개별 오더 진행률 */}
      <ComponentErrorBoundary name="WIP 모니터">
        <WIPMonitor
          orders={orders}
          maxDisplay={15}
        />
      </ComponentErrorBoundary>

      {/* AQL Event Form Modal */}
      {showAQLForm && (
        <AQLEventForm
          orders={orders}
          existingEvent={editingAQLEvent}
          onSubmit={(event) => {
            if (editingAQLEvent) {
              updateAQLEvent(event.id, event);
            } else {
              addAQLEvent(event);
            }
            setShowAQLForm(false);
            setEditingAQLEvent(null);
          }}
          onClose={() => {
            setShowAQLForm(false);
            setEditingAQLEvent(null);
          }}
        />
      )}
    </div>
  );
}

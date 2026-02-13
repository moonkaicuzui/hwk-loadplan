/**
 * @fileoverview Dashboard Page
 * Main dashboard with KPI summary and overview charts.
 *
 * @module pages/Dashboard
 */

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../contexts/DashboardContext';
import { useOrders } from '../hooks/useOrders';
import { useFilters } from '../hooks/useFilters';
import { CardSkeleton, ChartSkeleton, DashboardSectionSkeleton, BarChartSkeleton } from '../components/common/LoadingSpinner';
import ComponentErrorBoundary from '../components/common/ComponentErrorBoundary';
import { PrintHeader, CacheStatusIndicator, QuickActionFAB, DataFreshnessIndicator, ConnectionStatus, SwipeableOrderList } from '../components/common';
import { KPIGrid, FilterPanel, HistoricalComparison, AlertThresholdSettings, UrgencyIndicator, DelayStatusDashboard, WIPMonitor } from '../components/dashboard';
import { StageBacklogChart, FactoryLoadComparison } from '../components/charts';
import { ValidationBanner } from '../components/validation';
import { useDataValidation } from '../hooks/useDataValidation';
import { FilterChipGroup } from '../components/common/FilterChip';
import { AlertTriangle, ArrowRight, Settings, RefreshCw } from 'lucide-react';
import { getProductionData, isDelayed, isWarning, getOrderStatus } from '../utils/orderUtils';
import { MonthlyTrendChart, DestinationPieChart, FactoryComparisonChart } from '../components/charts';
import { DataTable } from '../components/tables';
import { formatDate } from '../utils/formatters';
import { getAlertThresholds, checkAlertThresholds } from '../services/cloudFunctions';

/**
 * Dashboard Page Component
 * Executive summary with KPIs, charts, and recent orders
 */
export default function Dashboard() {
  const { t } = useTranslation();
  const { state } = useDashboard();
  const [showFilters, setShowFilters] = useState(false);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [alertThresholds, setAlertThresholds] = useState(null);
  const [alertStatus, setAlertStatus] = useState({ hasDelayAlert: false, hasWarningAlert: false, messages: [] });

  // Get orders data
  const { orders, loading, statistics, groupByMonth, groupByDestination, groupByFactory, lastUpdated, isRefreshing, refresh } = useOrders({
    factory: state.selectedFactory,
    dateMode: state.dateMode
  });

  // Filter management
  const { filters, setFilter, resetFilters, activeFilterCount, applyFilters } = useFilters();

  // Data validation
  const { validationResult, validate, summary: validationSummary } = useDataValidation();

  // Run validation when orders change
  useEffect(() => {
    if (orders && orders.length > 0) {
      validate(orders);
    }
  }, [orders, validate]);

  // Load alert thresholds
  useEffect(() => {
    async function loadThresholds() {
      const thresholds = await getAlertThresholds();
      setAlertThresholds(thresholds);
    }
    loadThresholds();
  }, []);

  // Apply filters to orders (pass dateMode for date-based filtering)
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return applyFilters(orders, state.dateMode);
  }, [orders, applyFilters, state.dateMode]);

  // Calculate statistics for filtered data (property names match KPIGrid expectations)
  const filteredStats = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return {
        total: 0,
        totalQuantity: 0,
        completedQuantity: 0,
        completed: 0,
        shipped: 0,
        shippedQuantity: 0,
        pending: 0,
        partial: 0,
        warning: 0,
        warningQuantity: 0,
        delayed: 0,
        delayedQuantity: 0,
        completionRate: 0,
        shippedRate: 0,
        delayRate: 0
      };
    }

    const stats = {
      total: filteredOrders.length,
      totalQuantity: 0,
      completedQuantity: 0,
      completed: 0,
      shipped: 0,
      shippedQuantity: 0,
      pending: 0,
      partial: 0,
      warning: 0,
      warningQuantity: 0,
      delayed: 0,
      delayedQuantity: 0
    };

    filteredOrders.forEach(order => {
      const qty = order.quantity || order.ttl_qty || 0;
      // Use getProductionData for consistent data access across all formats
      const whOutCompleted = getProductionData(order, 'wh_out', 'completed', 0);
      const whInCompleted = getProductionData(order, 'wh_in', 'completed', 0);

      stats.totalQuantity += qty;
      stats.completedQuantity += whInCompleted;

      // 선적 완료: WH_OUT >= quantity (출고 완료)
      if (whOutCompleted >= qty && qty > 0) {
        stats.shipped++;
        stats.shippedQuantity += qty;
      }

      // 완료 상태 판정: WH_IN 기준
      const orderStatus = getOrderStatus(order, 'wh_in');
      if (orderStatus === 'completed') {
        stats.completed++;
      } else if (orderStatus === 'partial') {
        stats.partial++;
        stats.pending++; // partial도 아직 완료되지 않은 것으로 "진행중"에 포함
      } else {
        stats.pending++;
      }

      // isDelayed, isWarning 함수 사용 (order.isDelayed 속성이 아닌 함수 호출)
      if (isDelayed(order)) {
        stats.delayed++;
        stats.delayedQuantity += qty;
      }
      if (isWarning(order)) {
        stats.warning++;
        stats.warningQuantity += qty;
      }
    });

    // Note: completed는 위에서 이미 WH_IN 기준으로 계산됨
    stats.completionRate = stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;
    stats.shippedRate = stats.total > 0
      ? Math.round((stats.shipped / stats.total) * 100)
      : 0;
    stats.delayRate = stats.total > 0
      ? Math.round((stats.delayed / stats.total) * 100)
      : 0;

    return stats;
  }, [filteredOrders]);

  // Check alert thresholds when stats change
  useEffect(() => {
    if (filteredStats && alertThresholds) {
      const status = checkAlertThresholds(filteredStats, alertThresholds);
      setAlertStatus(status);
    }
  }, [filteredStats, alertThresholds]);

  // Monthly data for chart
  const monthlyData = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) return [];
    return groupByMonth(filteredOrders);
  }, [filteredOrders, groupByMonth]);

  // Destination data for chart
  const destinationData = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) return [];
    return groupByDestination(filteredOrders);
  }, [filteredOrders, groupByDestination]);

  // Factory data for chart
  const factoryData = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) return {};
    return groupByFactory(filteredOrders);
  }, [filteredOrders, groupByFactory]);

  // Recent orders (last 10)
  const recentOrders = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) return [];
    return [...filteredOrders]
      .sort((a, b) => new Date(b.crd || 0) - new Date(a.crd || 0))
      .slice(0, 10);
  }, [filteredOrders]);

  // Table columns
  const tableColumns = [
    { key: 'poNumber', label: 'PO#', sortable: true, align: 'left' },
    { key: 'style', label: t('table.style', '스타일'), sortable: true, align: 'left' },
    { key: 'destination', label: t('table.destination', '행선지'), sortable: true, align: 'left' },
    { key: 'quantity', label: t('table.quantity', '수량'), sortable: true, align: 'right', format: 'number' },
    { key: 'crdDate', label: 'CRD', sortable: true, align: 'center', format: 'date' },
    { key: 'factory', label: t('table.factory', '공장'), sortable: true, align: 'center' }
  ];

  // Show loading skeletons while data loads
  if (loading) {
    return (
      <div className="space-y-6">
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        {/* Urgency & Delay Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardSectionSkeleton itemCount={4} />
          <DashboardSectionSkeleton itemCount={4} />
        </div>
        {/* Production Status Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChartSkeleton barCount={8} />
          <BarChartSkeleton barCount={4} />
        </div>
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Print Header - 인쇄 시에만 표시 */}
      <PrintHeader
        title={t('dashboard.title', 'Executive Summary')}
        subtitle={`공장: ${!state.selectedFactory || state.selectedFactory === 'ALL' ? '전체' : `Factory ${state.selectedFactory}`} | 기준: ${state.dateMode || 'SDD'}`}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {t('dashboard.title', 'Executive Summary')}
          </h1>
          <p className="text-sm text-secondary mt-1">
            {t('dashboard.subtitle', '공장: {{factory}} | 기준: {{mode}}', {
              factory: !state.selectedFactory || state.selectedFactory === 'ALL' ? t('common.all', '전체') : `Factory ${state.selectedFactory}`,
              mode: state.dateMode || 'SDD'
            })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Data Freshness Indicator - Enhanced UX */}
          <DataFreshnessIndicator
            lastUpdated={lastUpdated}
            isRefreshing={isRefreshing}
            onRefresh={refresh}
            variant="compact"
          />

          {/* Cache Status Indicator - Desktop only */}
          <div className="hidden lg:block">
            <CacheStatusIndicator
              factoryId={!state.selectedFactory || state.selectedFactory === 'ALL' ? 'ALL_FACTORIES' : `FACTORY_${state.selectedFactory}`}
              showDetails
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              activeFilterCount > 0
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                : 'border-theme hover:bg-hover'
            }`}
          >
            {t('filter.title', '필터')}
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Panel - 인쇄 시 숨김 */}
      {showFilters && (
        <div className="no-print">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilter}
            onReset={resetFilters}
            orders={orders}
          />
        </div>
      )}

      {/* Data Validation Banner */}
      {validationResult && !validationResult.isValid && (
        <ValidationBanner
          validationResult={validationResult}
        />
      )}

      {/* Alert Banner for Critical Issues (Threshold-based) */}
      {(alertStatus.hasDelayAlert || alertStatus.hasWarningAlert) && (
        <div className={`rounded-xl p-4 ${
          alertStatus.hasDelayAlert
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                alertStatus.hasDelayAlert
                  ? 'bg-red-100 dark:bg-red-900/40 text-red-600'
                  : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className={`font-medium ${
                  alertStatus.hasDelayAlert ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'
                }`}>
                  {alertStatus.hasDelayAlert
                    ? t('alert.delayedTitle', '{{count}}건의 지연 주문 발생', { count: filteredStats.delayed })
                    : t('alert.warningTitle', '{{count}}건의 경고 주문 확인 필요', { count: filteredStats.warning })
                  }
                </p>
                {/* Show all alert messages */}
                <div className="mt-1 space-y-0.5">
                  {alertStatus.messages.map((msg, idx) => (
                    <p key={idx} className={`text-sm ${
                      msg.severity === 'error' ? 'text-red-600 dark:text-red-300' : 'text-yellow-600 dark:text-yellow-300'
                    }`}>
                      {msg.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAlertSettings(true)}
                className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
                title={t('settings.alertThresholds', '알림 설정')}
              >
                <Settings className="w-4 h-4" />
              </button>
              <a
                href="/data?status=delayed"
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  alertStatus.hasDelayAlert
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                {t('alert.viewDetails', '상세 보기')}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Quick Filter Chips - SDD/CRD 기반 빠른 필터 */}
      <div className="no-print bg-card rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-medium text-secondary">빠른 필터</span>
          {filters.quickFilter && (
            <button
              onClick={() => setFilter('quickFilter', '')}
              className="text-xs text-red-500 hover:text-red-600 underline"
            >
              해제
            </button>
          )}
        </div>
        <FilterChipGroup
          options={[
            { value: 'delayed', label: '지연 오더', color: 'red' },
            { value: 'warning', label: '경고 오더', color: 'yellow' },
            { value: 'sdd_week', label: '이번 주 출고', color: 'blue' },
            { value: 'sdd_month', label: '이번 달 출고', color: 'blue' },
            { value: 'crd_within_7', label: 'CRD 7일 이내', color: 'yellow' },
            { value: 'crd_within_3', label: 'CRD 3일 이내', color: 'red' },
          ]}
          value={filters.quickFilter}
          onChange={(val) => setFilter('quickFilter', val || '')}
        />
      </div>

      {/* KPI Summary Cards - uses filteredStats for filter-aware display */}
      <KPIGrid
        statistics={filteredStats}
        loading={loading}
      />

      {/* Urgency & Delay Status - 실무 핵심 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComponentErrorBoundary name="긴급 오더 현황">
          <UrgencyIndicator
            orders={filteredOrders}
            maxDisplay={8}
            title={t('dashboard.urgentOrders', '긴급 오더 현황')}
            onFilterChange={(urgencyLevel) => {
              if (urgencyLevel) {
                setFilter('quickFilter', `urgency_${urgencyLevel.toLowerCase()}`);
              } else {
                setFilter('quickFilter', '');
              }
            }}
          />
        </ComponentErrorBoundary>
        <ComponentErrorBoundary name="지연 현황">
          <DelayStatusDashboard
            orders={filteredOrders}
            maxDisplay={8}
            onFilterChange={(status) => {
              if (status) {
                setFilter('quickFilter', `status_${status.toLowerCase()}`);
              } else {
                setFilter('quickFilter', '');
              }
            }}
          />
        </ComponentErrorBoundary>
      </div>

      {/* Production Status - 공정별 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComponentErrorBoundary name="공정별 적체량">
          <StageBacklogChart
            orders={filteredOrders}
            title={t('dashboard.stageBacklog', '공정별 적체량')}
          />
        </ComponentErrorBoundary>
        <ComponentErrorBoundary name="공장별 부하">
          <FactoryLoadComparison
            orders={filteredOrders}
            title={t('dashboard.factoryLoad', '공장별 부하 비교')}
          />
        </ComponentErrorBoundary>
      </div>

      {/* Historical Comparison (vs Previous Month) */}
      <HistoricalComparison
        factoryId={state.selectedFactory || 'ALL_FACTORIES'}
      />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyTrendChart
          data={monthlyData}
          title={t('charts.monthlyTrend', '월별 추이')}
          height={300}
        />
        <DestinationPieChart
          data={destinationData}
          title={t('charts.destinationDistribution', '행선지 분포')}
          height={300}
          maxSlices={8}
        />
      </div>

      {/* Factory Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FactoryComparisonChart
          data={factoryData}
          title={t('charts.factoryComparison', '공장별 수량')}
          metric="quantity"
          height={280}
        />
        <FactoryComparisonChart
          data={factoryData}
          title={t('charts.completionRate', '공장별 완료율')}
          metric="completion"
          height={280}
        />
      </div>

      {/* Recent Orders - Desktop Table */}
      <div className="hidden md:block bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-theme flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {t('dashboard.recentOrders', '최근 주문')}
          </h3>
          <span className="text-sm text-secondary">
            {t('dashboard.showingRecent', '최근 {{count}}건', { count: recentOrders.length })}
          </span>
        </div>
        <DataTable
          data={recentOrders}
          columns={tableColumns}
          showPagination={false}
          loading={loading}
        />
      </div>

      {/* Recent Orders - Mobile Swipeable Cards */}
      <div className="md:hidden bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-theme flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {t('dashboard.recentOrders', '최근 주문')}
          </h3>
          <span className="text-sm text-secondary">
            {recentOrders.length}건
          </span>
        </div>
        <div className="p-4">
          <SwipeableOrderList
            orders={recentOrders}
            getOrderStatus={(order) => getOrderStatus(order, 'wh_in')}
            getCompletionRate={(order) => {
              const qty = order.quantity || order.ttl_qty || 0;
              if (qty === 0) return 100;
              const completed = getProductionData(order, 'wh_in', 'completed', 0);
              return Math.min(100, Math.max(0, (completed / qty) * 100));
            }}
            getDaysUntilDue={(order) => {
              const crd = order.crd || order.crdDate;
              if (!crd) return null;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const dueDate = new Date(crd);
              dueDate.setHours(0, 0, 0, 0);
              return Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            }}
            isDelayed={(order) => isDelayed(order)}
            isWarning={(order) => isWarning(order)}
            emptyMessage={t('dashboard.noRecentOrders', '최근 주문이 없습니다')}
          />
        </div>
      </div>

      {/* Alert Threshold Settings Modal */}
      <AlertThresholdSettings
        isOpen={showAlertSettings}
        onClose={() => {
          setShowAlertSettings(false);
          // Reload thresholds after closing
          getAlertThresholds().then(setAlertThresholds);
        }}
      />

      {/* Quick Action FAB - Mobile optimized */}
      <QuickActionFAB
        onRefresh={refresh}
        delayedCount={filteredStats.delayed}
        position="bottom-right"
        showOnMobile={true}
        showOnDesktop={true}
      />

      {/* Connection Status - Shows when offline */}
      <ConnectionStatus />
    </div>
  );
}

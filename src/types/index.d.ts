/**
 * TypeScript Type Definitions for Rachgia Dashboard
 * ==================================================
 *
 * JSDoc-compatible type definitions for IDE support
 * @module types
 * @version 19.0.0
 */

// ============================================================================
// Production Process Types
// ============================================================================

/**
 * Process step status
 */
export type ProcessStatus = 'pending' | 'partial' | 'completed';

/**
 * Process step data
 */
export interface ProcessStep {
  completed: number;
  pending: number;
  status: ProcessStatus;
}

/**
 * Production data for all processes
 */
export interface ProductionData {
  s_cut?: ProcessStep;
  pre_sew?: ProcessStep;
  sew_input?: ProcessStep;
  sew_bal?: ProcessStep;
  s_fit?: ProcessStep;
  ass_bal?: ProcessStep;
  wh_in?: ProcessStep;
  wh_out?: ProcessStep;
}

// ============================================================================
// Order Types
// ============================================================================

/**
 * Remaining quantities by process
 */
export interface RemainingData {
  osc: number;
  sew: number;
  ass: number;
  whIn: number;
  whOut: number;
}

/**
 * Order record
 */
export interface Order {
  factory: string;
  unit: string;
  season: string;
  model: string;
  article: string;
  color: string;
  destination: string;
  quantity: number;
  poNumber: string;
  crd: string;
  sddValue: string;
  code04?: string | null;
  outsoleVendor: string;
  production: ProductionData;
  remaining: RemainingData;

  // Computed fields
  sddYearMonth?: string;
  crdYearMonth?: string;
  isDelayed?: boolean;
  isWarning?: boolean;
  isCritical?: boolean;
  isShipped?: boolean;
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Date mode for filtering
 */
export type DateMode = 'sdd' | 'crd';

/**
 * Quick date filter options
 */
export type QuickDateFilter = 'all' | 'week' | 'month';

/**
 * Quick filter options
 */
export type QuickFilter = 'delayed' | 'warning' | 'today' | 'week' | 'month';

/**
 * Status filter options
 */
export type StatusFilter = 'shipped' | 'completed' | 'partial' | 'pending';

/**
 * Filter state
 */
export interface FilterState {
  month: string;
  destination: string;
  vendor: string;
  factory: string;
  status: StatusFilter | '';
  quick: QuickFilter | '';
  search: string;
  dateRange: QuickDateFilter;
  startDate: string;
  endDate: string;
  minQty: number | null;
  maxQty: number | null;
  dateMode: DateMode;
}

// ============================================================================
// Chart Types
// ============================================================================

/**
 * Chart data point
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

/**
 * Factory comparison data
 */
export interface FactoryComparisonData {
  factory: string;
  total: number;
  completed: number;
  delayed: number;
  delayRate: number;
}

/**
 * Monthly trend data
 */
export interface MonthlyTrendData {
  month: string;
  orders: number;
  quantity: number;
  completedQuantity: number;
}

// ============================================================================
// Anomaly Detection Types
// ============================================================================

/**
 * Anomaly severity levels
 */
export type AnomalySeverity = 'warning' | 'critical';

/**
 * Quantity outlier anomaly
 */
export interface QuantityOutlier {
  po: string;
  model: string;
  quantity: number;
  zScore: string;
  severity: AnomalySeverity;
}

/**
 * Process delay anomaly
 */
export interface ProcessDelay {
  po: string;
  model: string;
  crd: string;
  daysUntilCRD: string;
  completionRate: string;
  severity: AnomalySeverity;
}

/**
 * Date anomaly
 */
export interface DateAnomaly {
  po: string;
  model: string;
  crd: string;
  sdd: string;
  gapDays: string;
  severity: AnomalySeverity;
}

/**
 * Duplicate PO anomaly
 */
export interface DuplicatePO {
  po: string;
  count: number;
  models: string;
  severity: AnomalySeverity;
}

/**
 * Missing destination anomaly
 */
export interface MissingDestination {
  po: string;
  model: string;
  destination: string;
  severity: AnomalySeverity;
}

/**
 * Vendor issue anomaly
 */
export interface VendorIssue {
  vendor: string;
  total: number;
  delayed: number;
  delayRate: string;
  severity: AnomalySeverity;
}

/**
 * All anomaly detection results
 */
export interface AnomalyResults {
  quantityOutliers: QuantityOutlier[];
  processDelays: ProcessDelay[];
  dateAnomalies: DateAnomaly[];
  duplicatePO: DuplicatePO[];
  missingDestination: MissingDestination[];
  vendorIssues: VendorIssue[];
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Filter cache entry
 */
export interface FilterCacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Filter cache class interface
 */
export interface IFilterCache {
  get(key: string): any | null;
  set(key: string, value: any): void;
  clear(): void;
}

// ============================================================================
// Chart Manager Types
// ============================================================================

/**
 * Chart manager interface
 */
export interface IChartManager {
  get(id: string): Chart | null;
  set(id: string, chart: Chart): void;
  destroy(id: string): void;
  destroyAll(): void;
}

// ============================================================================
// i18n Types
// ============================================================================

/**
 * Supported languages
 */
export type Language = 'ko' | 'en' | 'vi';

/**
 * Translation keys (partial)
 */
export interface TranslationKeys {
  'dashboard.title': string;
  'tab.monthly': string;
  'tab.destination': string;
  'tab.model': string;
  'tab.factory': string;
  'tab.vendor': string;
  'tab.heatmap': string;
  'tab.data': string;
  'filter.all': string;
  'filter.delayed': string;
  'filter.warning': string;
  // ... additional keys
}

// ============================================================================
// Global Declarations
// ============================================================================

declare global {
  /**
   * Embedded order data from rachgia_data_v8.js
   */
  const EMBEDDED_DATA: Order[];

  /**
   * Filter cache instance from rachgia_v18_improvements.js
   */
  const filterCache: IFilterCache;

  /**
   * Chart manager instance from rachgia_v18_improvements.js
   */
  const chartManager: IChartManager;

  /**
   * HTML escape function
   */
  function escapeHtml(str: string): string;

  /**
   * i18n translation function
   */
  function i18n(key: string, params?: Record<string, any>): string;
}

export {};

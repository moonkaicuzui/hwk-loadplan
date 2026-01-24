/**
 * main.js - Model Layer Entry Point
 * ===================================
 *
 * Re-exports all model modules for easy importing.
 * This provides a single entry point for all business logic functions.
 *
 * Usage:
 * ```javascript
 * import { isDelayed, matchesDateRange, calculateVendorPerformance } from './src/main.js';
 * ```
 *
 * Or import all:
 * ```javascript
 * import * as Models from './src/main.js';
 * ```
 *
 * @module main
 * @agent A07 (MVC Architect)
 * @phase H06 - MVC 구조 리팩토링 Phase 1
 * @version 19.0.0
 */

// ============================================================================
// OrderModel Exports
// ============================================================================
// Core order business logic: state checking, date parsing, anomaly detection

export {
    // Date Utilities
    parseDate,

    // State Checking Functions
    isDelayed,
    isWarning,
    isCritical,
    isShipped,

    // Helper Functions
    parseProcessCell,
    calculateIsDelayed,
    calculateIsWarning,

    // Analytics
    detectAnomalies
} from './models/OrderModel.js';

// ============================================================================
// FilterModel Exports
// ============================================================================
// Filter predicate functions for order data filtering

export {
    // Constants
    IMPORTANT_DESTINATIONS,

    // Filter Predicates
    matchesDateRange,
    matchesCustomDateRange,
    matchesBasicFilters,
    matchesStatusFilter,
    matchesQuickFilter,
    matchesSearch,
    matchesQuantityRange
} from './models/FilterModel.js';

// ============================================================================
// ChartModel Exports
// ============================================================================
// Chart data preparation, vendor performance, bottleneck prediction, reports

export {
    // Constants
    PROCESS_ORDER,
    PROCESS_LABELS,
    PROCESS_KEY_MAP,

    // Analytics Functions
    calculateVendorPerformance,
    predictBottleneck,

    // Report Generators
    analyzeDailyReport,
    analyzeWeeklyReport,
    analyzeMonthlyReport
} from './models/ChartModel.js';

// ============================================================================
// Module Summary
// ============================================================================
/**
 * Total Exports: 25
 *
 * OrderModel (10 exports):
 * - parseDate(dateStr)
 * - isDelayed(d)
 * - isWarning(d)
 * - isCritical(d)
 * - isShipped(d)
 * - parseProcessCell(value, qty)
 * - calculateIsDelayed(record)
 * - calculateIsWarning(record)
 * - detectAnomalies(data)
 *
 * FilterModel (8 exports):
 * - IMPORTANT_DESTINATIONS
 * - matchesDateRange(d, rangeFilter, mode)
 * - matchesCustomDateRange(d, startDate, endDate, mode)
 * - matchesBasicFilters(d, month, dest, vendor, factory, mode)
 * - matchesStatusFilter(d, status)
 * - matchesQuickFilter(d, quick, mode)
 * - matchesSearch(d, search)
 * - matchesQuantityRange(d, minQty, maxQty)
 *
 * ChartModel (8 exports):
 * - PROCESS_ORDER
 * - PROCESS_LABELS
 * - PROCESS_KEY_MAP
 * - calculateVendorPerformance(data)
 * - predictBottleneck(data)
 * - analyzeDailyReport(data)
 * - analyzeWeeklyReport(data, weekStart, weekEnd)
 * - analyzeMonthlyReport(data, currentMonth)
 */

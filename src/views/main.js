/**
 * main.js - View Layer Entry Point
 * =================================
 *
 * Re-exports all view modules for easy importing.
 * This provides a single entry point for all UI rendering functions.
 *
 * Usage:
 * ```javascript
 * import { updateOrCreateChart, renderTableProgressively, showOrderListModal } from './src/views/main.js';
 * ```
 *
 * Or import all:
 * ```javascript
 * import * as Views from './src/views/main.js';
 * ```
 *
 * @module views/main
 * @agent A07 (MVC Architect)
 * @phase H06 - MVC 구조 리팩토링 Phase 2
 * @version 19.0.0
 */

// ============================================================================
// ChartView Exports
// ============================================================================
// Chart rendering, lazy loading, heatmaps, and chart instance management

export {
    // Initialization
    initChartView,

    // Chart Instance Management
    updateOrCreateChart,
    destroyAllCharts,
    getChart,

    // Lazy Loading
    LazyChartObserver,
    initLazyChartLoading,
    getLazyChartObserver,

    // Heatmap & Specialized Charts
    renderModelVendorHeatmap,
    updateHeatmapTab,
    updateDelaySeverityChart,
    updateRootCauseChart,
    updateVendorPerformanceList
} from './ChartView.js';

// ============================================================================
// TableView Exports
// ============================================================================
// Table rendering, sorting, pagination, and progressive/virtual rendering

export {
    // Initialization
    initTableView,

    // Row Rendering
    createTableRowHTML,
    createModalTableRowHTML,

    // Rendering Strategies
    renderTableProgressively,
    renderTableVirtually,
    renderDataCards,

    // Sorting
    sortData,
    handleSort,

    // Pagination
    prevPage,
    nextPage,
    changePageSize,

    // Tab Updates
    updateDataTab
} from './TableView.js';

// ============================================================================
// ModalView Exports
// ============================================================================
// Modal dialogs, detail views, help overlays, and keyboard shortcuts

export {
    // Initialization
    initModalView,

    // Row Rendering (for modals)
    createModalTableRowHTML as createModalRowHTML,

    // Notification
    showShortcutNotification,

    // Order List Modals
    showOrderListModal,
    closeOrderModal,
    showDelayedOrders,
    showWarningOrders,
    showInventoryOrders,
    showShippedOrders,

    // Detail Modals
    showVendorDetail,
    showFactoryDetail,
    showCountryDetail,
    showModelDetail,
    showOrderProcessDetail,

    // Help & Info Modals
    toggleHelpModal,
    toggleInsightsHelp,
    closeHelpModal,
    showInfoModal,
    closeInfoModal,

    // KPI Detail Modals
    showOTDDetail,
    showRevenueRiskDetail,
    showAQLDetail,
    showBottleneckDetail,

    // Keyboard Shortcuts Modal
    openKeyboardShortcutsModal,
    closeKeyboardShortcutsModal,

    // Close All
    closeAllModals
} from './ModalView.js';

// ============================================================================
// ExportView Exports
// ============================================================================
// Data export functionality: Excel, CSV, PDF, HTML reports

export {
    // Initialization
    initExportView,

    // HTML Report
    downloadReportHTML,

    // Excel Export
    exportToExcel,
    exportToExcelMultiSheet,

    // CSV Export
    exportToCSV,

    // PDF Export
    exportToPDF
} from './ExportView.js';

// ============================================================================
// KPIView Exports
// ============================================================================
// KPI dashboard, summary cards, alerts, process flow, and factory cards

export {
    // Initialization
    initKPIView,

    // KPI Updates
    updateKPIData,
    updateWeeklySummary,
    updateAllKPIs,

    // Analysis
    findBottleneck,

    // Section Updates
    updateSummary,
    updateAlerts,
    updateProcessFlow,
    updateVendorSection,
    updateFactoryCards,
    updateAsiaCards
} from './KPIView.js';

// ============================================================================
// Module Summary
// ============================================================================
/**
 * Total Exports: 65
 *
 * ChartView (11 exports):
 * - initChartView()
 * - updateOrCreateChart(chartId, config, options)
 * - destroyAllCharts()
 * - getChart(chartId)
 * - LazyChartObserver (class)
 * - initLazyChartLoading(containers, loadCallback)
 * - getLazyChartObserver()
 * - renderModelVendorHeatmap(data)
 * - updateHeatmapTab()
 * - updateDelaySeverityChart(data)
 * - updateRootCauseChart(data)
 * - updateVendorPerformanceList(data)
 *
 * TableView (12 exports):
 * - initTableView(deps)
 * - createTableRowHTML(d, index)
 * - createModalTableRowHTML(d, index)
 * - renderTableProgressively(data, container, batchSize)
 * - renderTableVirtually(data, container, rowHeight)
 * - renderDataCards(data, container)
 * - sortData(data, key, direction)
 * - handleSort(key)
 * - prevPage()
 * - nextPage()
 * - changePageSize(size)
 * - updateDataTab()
 *
 * ModalView (25 exports):
 * - initModalView(deps)
 * - createModalRowHTML(d, index)
 * - showShortcutNotification(message)
 * - showOrderListModal(title, orders, filterFn)
 * - closeOrderModal()
 * - showDelayedOrders()
 * - showWarningOrders()
 * - showInventoryOrders()
 * - showShippedOrders()
 * - showVendorDetail(vendor)
 * - showFactoryDetail(factory)
 * - showCountryDetail(country)
 * - showModelDetail(model)
 * - showOrderProcessDetail(order)
 * - toggleHelpModal()
 * - toggleInsightsHelp()
 * - closeHelpModal()
 * - showInfoModal(title, content)
 * - closeInfoModal()
 * - showOTDDetail()
 * - showRevenueRiskDetail()
 * - showAQLDetail()
 * - showBottleneckDetail()
 * - openKeyboardShortcutsModal()
 * - closeKeyboardShortcutsModal()
 * - closeAllModals()
 *
 * ExportView (6 exports):
 * - initExportView(deps)
 * - downloadReportHTML()
 * - exportToExcel()
 * - exportToExcelMultiSheet()
 * - exportToCSV()
 * - exportToPDF()
 *
 * KPIView (11 exports):
 * - initKPIView(deps)
 * - updateKPIData(data)
 * - updateWeeklySummary(data)
 * - updateAllKPIs(data)
 * - findBottleneck(data)
 * - updateSummary(data)
 * - updateAlerts(data)
 * - updateProcessFlow(data)
 * - updateVendorSection(data)
 * - updateFactoryCards(data)
 * - updateAsiaCards(data)
 */

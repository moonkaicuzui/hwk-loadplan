/**
 * ChartView.js - Chart View Layer Module
 * ======================================
 *
 * Handles all chart rendering, updates, and visualization logic.
 * This module provides:
 * - Chart instance management (create/update/destroy)
 * - Lazy loading with IntersectionObserver
 * - Heatmap rendering (Model×Vendor, Country×Month, Model×Destination)
 * - Insight charts (Delay Severity, Root Cause, Vendor Performance)
 *
 * @module views/ChartView
 * @agent A07 (MVC Architect)
 * @phase H06 - MVC 구조 리팩토링 Phase 2
 * @version 19.0.0
 */

import { IMPORTANT_DESTINATIONS } from '../models/FilterModel.js';

// ============================================================================
// Module State (will be injected from main dashboard)
// ============================================================================

let charts = {};
let chartManager = null;
let log = { info: console.log, debug: console.debug, warn: console.warn, error: console.error };
let delaySeverityChart = null;
let rootCauseChart = null;
let lazyChartObserver = null;

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize ChartView module with required dependencies
 * @param {Object} dependencies - External dependencies
 * @param {Object} dependencies.charts - Chart instances storage object
 * @param {Object} dependencies.chartManager - Chart management utility
 * @param {Object} dependencies.log - Logging utility
 */
export function initChartView(dependencies) {
    if (dependencies.charts) charts = dependencies.charts;
    if (dependencies.chartManager) chartManager = dependencies.chartManager;
    if (dependencies.log) log = dependencies.log;
}

// ============================================================================
// Chart Instance Management
// ============================================================================

/**
 * Update existing chart or create new one with memory-efficient reuse
 * @param {string} chartKey - Unique chart identifier
 * @param {HTMLCanvasElement} ctx - Canvas context
 * @param {Object} config - Chart.js configuration
 * @returns {Chart} Chart instance
 */
export function updateOrCreateChart(chartKey, ctx, config) {
    if (charts[chartKey]) {
        charts[chartKey].data = config.data;
        if (config.options) {
            charts[chartKey].options = config.options;
        }
        charts[chartKey].update('none');
        return charts[chartKey];
    } else {
        charts[chartKey] = chartManager.createOrUpdate(chartKey, ctx, config, true);
        return charts[chartKey];
    }
}

/**
 * Destroy all chart instances to free memory
 * Should be called on page unload or major data refresh
 */
export function destroyAllCharts() {
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });

    // Clear the charts object
    Object.keys(charts).forEach(key => delete charts[key]);

    if (delaySeverityChart) {
        delaySeverityChart.destroy();
        delaySeverityChart = null;
    }
    if (rootCauseChart) {
        rootCauseChart.destroy();
        rootCauseChart = null;
    }

    log.info('All chart instances destroyed');
}

/**
 * Get a chart instance by key
 * @param {string} chartKey - Chart identifier
 * @returns {Chart|null} Chart instance or null
 */
export function getChart(chartKey) {
    return charts[chartKey] || null;
}

// ============================================================================
// Lazy Loading System
// ============================================================================

/**
 * LazyChartObserver - Lazy loads charts when they come into view
 * Uses IntersectionObserver for efficient viewport detection
 */
export class LazyChartObserver {
    constructor() {
        this.observer = null;
        this.pendingCharts = new Map();
        this.init();
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            log.warn('IntersectionObserver not supported, charts will load immediately');
            return;
        }

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const chartKey = entry.target.dataset.lazyChart;
                    const renderFn = this.pendingCharts.get(chartKey);
                    if (renderFn) {
                        log.debug(`Lazy loading chart: ${chartKey}`);
                        renderFn();
                        this.pendingCharts.delete(chartKey);
                        this.observer.unobserve(entry.target);
                    }
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.1
        });

        log.info('LazyChartObserver initialized');
    }

    /**
     * Register element for lazy chart loading
     * @param {HTMLElement} element - Container element
     * @param {string} chartKey - Unique chart identifier
     * @param {Function} renderFunction - Function to render the chart
     */
    observe(element, chartKey, renderFunction) {
        if (!this.observer) {
            // Fallback: render immediately if observer not available
            renderFunction();
            return;
        }
        element.dataset.lazyChart = chartKey;
        this.pendingCharts.set(chartKey, renderFunction);
        this.observer.observe(element);
    }

    /**
     * Disconnect observer and clear pending charts
     */
    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
            this.pendingCharts.clear();
        }
    }
}

/**
 * Initialize lazy chart loading system
 * @returns {LazyChartObserver} Observer instance
 */
export function initLazyChartLoading() {
    if (!lazyChartObserver) {
        lazyChartObserver = new LazyChartObserver();
    }
    return lazyChartObserver;
}

/**
 * Get the lazy chart observer instance
 * @returns {LazyChartObserver|null}
 */
export function getLazyChartObserver() {
    return lazyChartObserver;
}

// ============================================================================
// Heatmap Rendering
// ============================================================================

/**
 * Render Model × Vendor heatmap
 * Shows quantity distribution across top models and vendors
 * Uses O(n) algorithm with Set for efficient lookup
 *
 * @param {Array} filteredData - Filtered data array
 * @param {Object} options - Rendering options
 * @param {Function} options.escapeHtml - HTML escape function
 * @param {Function} options.formatNumber - Number formatting function
 */
export function renderModelVendorHeatmap(filteredData, options = {}) {
    const { escapeHtml = (s) => s, formatNumber = (n) => n.toLocaleString() } = options;

    const container = document.getElementById('modelVendorHeatmap');
    if (!container) return;

    // Get top models and vendors by quantity
    const modelQty = {};
    const vendorQty = {};

    filteredData.forEach(d => {
        modelQty[d.model] = (modelQty[d.model] || 0) + (d.quantity || 0);
        const v = d.outsoleVendor || '(미지정)';
        vendorQty[v] = (vendorQty[v] || 0) + (d.quantity || 0);
    });

    const topModels = Object.entries(modelQty)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([m]) => m);

    const topVendors = Object.entries(vendorQty)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([v]) => v);

    // Build heatmap data with O(n) optimization using Sets
    const topModelsSet = new Set(topModels);
    const topVendorsSet = new Set(topVendors);
    const heatmapData = {};
    let maxVal = 0;

    filteredData.forEach(d => {
        const model = d.model;
        const vendor = d.outsoleVendor || '(미지정)';
        if (topModelsSet.has(model) && topVendorsSet.has(vendor)) {
            const key = `${model}|${vendor}`;
            heatmapData[key] = (heatmapData[key] || 0) + (d.quantity || 0);
            if (heatmapData[key] > maxVal) maxVal = heatmapData[key];
        }
    });

    // Generate HTML table with intensity-based coloring
    let html = '<table class="w-full text-xs"><thead><tr><th class="p-1 text-left"></th>';
    topVendors.forEach(v => {
        html += `<th class="p-1 text-center truncate max-w-[60px]" title="${escapeHtml(v)}">${escapeHtml(v.substring(0, 8))}</th>`;
    });
    html += '</tr></thead><tbody>';

    topModels.forEach(model => {
        html += `<tr><td class="p-1 font-medium truncate max-w-[80px]" title="${escapeHtml(model)}">${escapeHtml(model.substring(0, 10))}</td>`;
        topVendors.forEach(vendor => {
            const key = `${model}|${vendor}`;
            const val = heatmapData[key] || 0;
            const intensity = maxVal > 0 ? val / maxVal : 0;
            const bgColor = val > 0
                ? `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`
                : 'transparent';
            html += `<td class="p-1 text-center" style="background-color: ${bgColor}" title="${formatNumber(val)}">${val > 0 ? formatNumber(val) : '-'}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

/**
 * Render Country × Month and Model × Destination heatmaps
 * Uses O(n) algorithm optimization with Map for lookups
 *
 * @param {Array} filteredData - Filtered data array
 * @param {Object} options - Rendering options
 * @param {Function} options.escapeHtml - HTML escape function
 * @param {Function} options.formatNumber - Number formatting function
 * @param {Function} options.getYearMonth - Function to extract year-month from data
 */
export function updateHeatmapTab(filteredData, options = {}) {
    const {
        escapeHtml = (s) => s,
        formatNumber = (n) => n.toLocaleString(),
        getYearMonth = (d) => d.crd ? d.crd.substring(0, 7) : null
    } = options;

    // ========== Country × Month Heatmap ==========
    const countryMonthContainer = document.getElementById('countryMonthHeatmap');
    if (countryMonthContainer) {
        const countryMonthData = {};
        const months = [...new Set(filteredData.map(d => getYearMonth(d)).filter(Boolean))].sort();
        const countries = Object.keys(IMPORTANT_DESTINATIONS);

        // Country mapping with Map for O(1) lookup
        const countryMap = new Map();
        countries.forEach(c => {
            countryMap.set(c, c);
            if (c === 'South Korea') countryMap.set('Korea', c);
        });

        let maxVal1 = 0;
        filteredData.forEach(d => {
            const month = getYearMonth(d);
            if (!month) return;

            let country = d.destination;
            if (countryMap.has(country)) {
                country = countryMap.get(country);
            } else if (!countries.includes(country)) {
                return; // Skip non-important destinations
            }

            const key = `${country}|${month}`;
            countryMonthData[key] = (countryMonthData[key] || 0) + (d.quantity || 0);
            if (countryMonthData[key] > maxVal1) maxVal1 = countryMonthData[key];
        });

        let html1 = '<table class="w-full text-xs"><thead><tr><th class="p-1 text-left">국가</th>';
        months.forEach(m => {
            html1 += `<th class="p-1 text-center">${m.substring(5)}</th>`;
        });
        html1 += '</tr></thead><tbody>';

        countries.forEach(country => {
            html1 += `<tr><td class="p-1 font-medium">${escapeHtml(country)}</td>`;
            months.forEach(month => {
                const key = `${country}|${month}`;
                const val = countryMonthData[key] || 0;
                const intensity = maxVal1 > 0 ? val / maxVal1 : 0;
                const bgColor = val > 0
                    ? `rgba(34, 197, 94, ${0.2 + intensity * 0.8})`
                    : 'transparent';
                html1 += `<td class="p-1 text-center" style="background-color: ${bgColor}" title="${formatNumber(val)}">${val > 0 ? formatNumber(val) : '-'}</td>`;
            });
            html1 += '</tr>';
        });
        html1 += '</tbody></table>';
        countryMonthContainer.innerHTML = html1;
    }

    // ========== Model × Destination Heatmap ==========
    const modelDestContainer = document.getElementById('modelDestHeatmap');
    if (modelDestContainer) {
        // Get top models
        const modelQty = {};
        filteredData.forEach(d => {
            modelQty[d.model] = (modelQty[d.model] || 0) + (d.quantity || 0);
        });
        const topModels = Object.entries(modelQty)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([m]) => m);

        const topModelsSet = new Set(topModels);
        const destinations = Object.keys(IMPORTANT_DESTINATIONS);
        const modelDestData = {};
        let maxVal2 = 0;

        filteredData.forEach(d => {
            if (!topModelsSet.has(d.model)) return;
            if (!destinations.includes(d.destination)) return;

            const key = `${d.model}|${d.destination}`;
            modelDestData[key] = (modelDestData[key] || 0) + (d.quantity || 0);
            if (modelDestData[key] > maxVal2) maxVal2 = modelDestData[key];
        });

        let html2 = '<table class="w-full text-xs"><thead><tr><th class="p-1 text-left">모델</th>';
        destinations.forEach(dest => {
            html2 += `<th class="p-1 text-center truncate max-w-[50px]" title="${escapeHtml(dest)}">${escapeHtml(dest.substring(0, 6))}</th>`;
        });
        html2 += '</tr></thead><tbody>';

        topModels.forEach(model => {
            html2 += `<tr><td class="p-1 font-medium truncate max-w-[80px]" title="${escapeHtml(model)}">${escapeHtml(model.substring(0, 10))}</td>`;
            destinations.forEach(dest => {
                const key = `${model}|${dest}`;
                const val = modelDestData[key] || 0;
                const intensity = maxVal2 > 0 ? val / maxVal2 : 0;
                const bgColor = val > 0
                    ? `rgba(168, 85, 247, ${0.2 + intensity * 0.8})`
                    : 'transparent';
                html2 += `<td class="p-1 text-center" style="background-color: ${bgColor}" title="${formatNumber(val)}">${val > 0 ? formatNumber(val) : '-'}</td>`;
            });
            html2 += '</tr>';
        });
        html2 += '</tbody></table>';
        modelDestContainer.innerHTML = html2;
    }

    // Also render Model × Vendor heatmap
    renderModelVendorHeatmap(filteredData, { escapeHtml, formatNumber });
}

// ============================================================================
// Insight Charts
// ============================================================================

/**
 * Update Delay Severity doughnut chart
 * Shows distribution of delay severity levels
 *
 * @param {Object} severity - Severity counts
 * @param {number} severity.minor - Minor delays (1-3 days)
 * @param {number} severity.moderate - Moderate delays (4-7 days)
 * @param {number} severity.severe - Severe delays (7+ days)
 */
export function updateDelaySeverityChart(severity) {
    const ctx = document.getElementById('delaySeverityChart');
    if (!ctx) return;

    const data = {
        labels: ['경미 (1-3일)', '주의 (4-7일)', '심각 (7일+)'],
        datasets: [{
            data: [severity.minor, severity.moderate, severity.severe],
            backgroundColor: ['#4ade80', '#fbbf24', '#ef4444'],
            borderWidth: 0
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#fff',
                    font: { size: 10 }
                }
            }
        }
    };

    if (delaySeverityChart) {
        delaySeverityChart.data = data;
        delaySeverityChart.update();
    } else {
        delaySeverityChart = chartManager.createOrUpdate('delaySeverityChart', ctx, {
            type: 'doughnut',
            data: data,
            options: options
        });
    }
}

/**
 * Update Root Cause horizontal bar chart
 * Shows top delay causes
 *
 * @param {Array<[string, number]>} causes - Array of [cause, count] pairs
 */
export function updateRootCauseChart(causes) {
    const ctx = document.getElementById('rootCauseChart');
    if (!ctx) return;

    const data = {
        labels: causes.map(c => c[0]),
        datasets: [{
            label: '지연 건수',
            data: causes.map(c => c[1]),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderRadius: 4
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255,255,255,0.1)' }
            },
            y: {
                ticks: { color: '#fff' },
                grid: { display: false }
            }
        }
    };

    if (rootCauseChart) {
        rootCauseChart.data = data;
        rootCauseChart.update();
    } else {
        rootCauseChart = chartManager.createOrUpdate('rootCauseChart', ctx, {
            type: 'bar',
            data: data,
            options: options
        });
    }
}

/**
 * Update Vendor Performance ranking list
 * Renders HTML list with medals for top performers
 *
 * @param {Array<Object>} vendors - Array of vendor performance objects
 * @param {string} vendors[].vendor - Vendor name
 * @param {string} vendors[].score - Performance score
 * @param {Object} options - Rendering options
 * @param {Function} options.escapeHtml - HTML escape function
 */
export function updateVendorPerformanceList(vendors, options = {}) {
    const { escapeHtml = (s) => s } = options;

    const container = document.getElementById('vendorPerformanceList');
    if (!container) return;

    let html = '';
    vendors.forEach((v, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        const score = parseFloat(v.score);
        const scoreColor = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';

        html += `<div class="flex items-center justify-between py-1 border-b border-white/10 last:border-0">
            <span class="text-sm">${medal} ${escapeHtml(v.vendor)}</span>
            <span class="font-bold ${scoreColor}">${v.score}점</span>
        </div>`;
    });

    container.innerHTML = html;
}

// ============================================================================
// Module Summary
// ============================================================================
/**
 * ChartView Module Exports (14 exports):
 *
 * Initialization:
 * - initChartView(dependencies)
 *
 * Chart Instance Management:
 * - updateOrCreateChart(chartKey, ctx, config)
 * - destroyAllCharts()
 * - getChart(chartKey)
 *
 * Lazy Loading:
 * - LazyChartObserver (class)
 * - initLazyChartLoading()
 * - getLazyChartObserver()
 *
 * Heatmap Rendering:
 * - renderModelVendorHeatmap(filteredData, options)
 * - updateHeatmapTab(filteredData, options)
 *
 * Insight Charts:
 * - updateDelaySeverityChart(severity)
 * - updateRootCauseChart(causes)
 * - updateVendorPerformanceList(vendors, options)
 */

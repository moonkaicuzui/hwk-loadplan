/**
 * ChartModel.js - Chart Data & Analytics Business Logic Layer
 * =============================================================
 *
 * Pure business logic for chart data aggregation and analytics.
 * NO DOM dependencies - fully unit testable.
 *
 * @module ChartModel
 * @agent A07 (MVC Architect)
 * @phase H06 - MVC 구조 리팩토링 Phase 1
 * @version 19.0.0
 */

import { isDelayed, isWarning } from './OrderModel.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Process execution order (8 stages)
 * @type {Array<string>}
 */
export const PROCESS_ORDER = [
    's_cut',      // 재단
    'pre_sew',    // 선봉
    'sew_input',  // 재봉투입
    'sew_bal',    // 재봉
    'osc',        // 외주
    'ass',        // 조립
    'wh_in',      // 입고
    'wh_out'      // 출고
];

/**
 * Process key to label mappings
 * @type {Object<string, string>}
 */
export const PROCESS_LABELS = {
    's_cut': '재단(S_CUT)',
    'pre_sew': '선봉(PRE_SEW)',
    'sew_input': '재봉투입(SEW_INPUT)',
    'sew_bal': '재봉(SEW_BAL)',
    'osc': '외주(OSC)',
    'ass': '조립(ASS)',
    'wh_in': '입고(WH_IN)',
    'wh_out': '출고(WH_OUT)'
};

/**
 * Process name transformations for data access
 * Upper snake_case → lowercase no-underscore
 * @type {Object<string, string>}
 */
export const PROCESS_KEY_MAP = {
    'S_CUT': 'scut',
    'PRE_SEW': 'presew',
    'SEW_INPUT': 'sewinput',
    'SEW_BAL': 'sewbal',
    'OSC': 'osc',
    'ASS': 'ass',
    'WH_IN': 'whin',
    'WH_OUT': 'whout'
};

// ============================================================================
// Vendor Performance Analysis
// ============================================================================

/**
 * Calculate vendor performance scores
 *
 * Scoring Formula:
 *   score = (completionRate × 70) + (onTimeRate × 30)
 *   where:
 *     completionRate = completed / total
 *     onTimeRate = 1 - (delayed / total)
 *
 * @param {Array<Object>} data - Order data array
 * @returns {Array<Object>} Top 5 vendors sorted by score descending
 * @returns {string} returns[].vendor - Vendor name (outsoleVendor)
 * @returns {string} returns[].score - Performance score (0-100, fixed 1 decimal)
 * @returns {number} returns[].total - Total orders
 * @returns {number} returns[].completed - Completed orders (WH_OUT status === 'completed')
 * @returns {number} returns[].delayed - Delayed orders (isDelayed === true)
 *
 * @example
 * calculateVendorPerformance(orders)
 * // => [
 * //   { vendor: 'VendorA', score: '85.5', total: 100, completed: 90, delayed: 5 },
 * //   { vendor: 'VendorB', score: '78.2', total: 80, completed: 70, delayed: 8 },
 * //   ...
 * // ]
 *
 * @source rachgia_dashboard_v18.html:11004-11038
 * @refactoring-note Remove global filteredData dependency - accept data as parameter
 */
export function calculateVendorPerformance(data) {
    const vendorStats = {};

    data.forEach(d => {
        const vendor = d.outsoleVendor || 'Unknown';
        if (!vendorStats[vendor]) {
            vendorStats[vendor] = { total: 0, completed: 0, delayed: 0 };
        }

        vendorStats[vendor].total++;
        if (d.production?.wh_out?.status === 'completed') {
            vendorStats[vendor].completed++;
        }
        if (isDelayed(d)) {
            vendorStats[vendor].delayed++;
        }
    });

    const vendorScores = Object.entries(vendorStats).map(([vendor, stats]) => {
        const completionRate = stats.total > 0 ? stats.completed / stats.total : 0;
        const onTimeRate = stats.total > 0 ? 1 - (stats.delayed / stats.total) : 1;
        const score = (completionRate * 70) + (onTimeRate * 30);

        return {
            vendor,
            score: score.toFixed(1),
            total: stats.total,
            completed: stats.completed,
            delayed: stats.delayed
        };
    });

    return vendorScores
        .sort((a, b) => parseFloat(b.score) - parseFloat(a.score))
        .slice(0, 5);
}

// ============================================================================
// Bottleneck Prediction
// ============================================================================

/**
 * Predict production bottleneck process
 *
 * Logic:
 *   - Calculate completion rate for each process
 *   - Find process with lowest rate (excluding final WH_OUT stage)
 *   - Aggregate affected quantity and order count
 *
 * @param {Array<Object>} data - Order data array
 * @returns {Object|null} Bottleneck analysis result, or null if no bottleneck
 * @returns {string} returns.process - Bottleneck process name (label)
 * @returns {string} returns.rate - Completion rate (0-100, fixed 1 decimal)
 * @returns {number} returns.affectedQty - Total pending quantity at bottleneck
 * @returns {number} returns.affectedOrders - Number of orders affected by bottleneck
 *
 * @example
 * predictBottleneck(orders)
 * // => {
 * //   process: '재봉(SEW_BAL)',
 * //   rate: '65.5',
 * //   affectedQty: 5000,
 * //   affectedOrders: 25
 * // }
 *
 * @source rachgia_dashboard_v18.html:11042-11086
 * @refactoring-note Remove global dependencies (filteredData, PROCESS_ORDER, PROCESS_NAMES)
 */
export function predictBottleneck(data) {
    const processStats = {};

    // Initialize stats for all processes
    PROCESS_ORDER.forEach(key => {
        processStats[key] = { completed: 0, pending: 0, total: 0 };
    });

    // Aggregate process statistics
    data.forEach(d => {
        PROCESS_ORDER.forEach(key => {
            const processData = d.production?.[key];
            if (processData) {
                const completed = processData.completed || 0;
                const pending = processData.pending || 0;

                processStats[key].completed += completed;
                processStats[key].pending += pending;
                processStats[key].total += (completed + pending);
            }
        });
    });

    // Find bottleneck (lowest completion rate, excluding WH_OUT)
    let bottleneck = null;
    let lowestRate = 100;

    PROCESS_ORDER.forEach(key => {
        if (key === 'wh_out') return; // Skip final process

        const stats = processStats[key];
        if (stats.total > 0) {
            const rate = (stats.completed / stats.total) * 100;
            if (rate < lowestRate) {
                lowestRate = rate;
                bottleneck = key;
            }
        }
    });

    if (!bottleneck) return null;

    return {
        process: PROCESS_LABELS[bottleneck],
        rate: lowestRate.toFixed(1),
        affectedQty: processStats[bottleneck].pending,
        affectedOrders: data.filter(d => {
            const pending = d.production?.[bottleneck]?.pending || 0;
            return pending > 0;
        }).length
    };
}

// ============================================================================
// Daily Report Analytics
// ============================================================================

/**
 * Analyze daily report data
 *
 * Provides comprehensive daily operations overview:
 *   - Overall summary statistics
 *   - Process completion stats (8 stages)
 *   - Bottleneck processes (rate < 70%, max 3)
 *   - Urgent orders (delayed + CRD ≤ 7 days, max 10)
 *   - Top delayed destinations (max 5)
 *   - Factory-wise delayed counts
 *
 * @param {Array<Object>} data - Order data array
 * @returns {Object} Daily report analytics
 *
 * @returns {Object} returns.summary - Overall statistics
 * @returns {number} returns.summary.totalOrders - Total order count
 * @returns {number} returns.summary.delayedOrders - Delayed order count
 * @returns {number} returns.summary.warningOrders - Warning order count
 * @returns {number} returns.summary.completedOrders - Completed order count (WH_OUT completed)
 * @returns {string} returns.summary.delayedRate - Delay rate % (fixed 1 decimal)
 * @returns {string} returns.summary.completionRate - Completion rate % (fixed 1 decimal)
 *
 * @returns {Array<Object>} returns.processStats - Process completion stats (8 processes)
 * @returns {string} returns.processStats[].name - Process label
 * @returns {string} returns.processStats[].key - Process key
 * @returns {number} returns.processStats[].completed - Completed count
 * @returns {number} returns.processStats[].total - Total count
 * @returns {number} returns.processStats[].rate - Completion rate (0-100)
 *
 * @returns {Array<Object>} returns.bottlenecks - Bottleneck processes (rate < 70%, excludes WH_OUT, max 3)
 * @returns {string} returns.bottlenecks[].name - Process label
 * @returns {number} returns.bottlenecks[].rate - Completion rate
 *
 * @returns {Array<Object>} returns.urgentOrders - Urgent orders (delayed + CRD ≤ 7 days, max 10)
 * @returns {string} returns.urgentOrders[].poNumber - PO number
 * @returns {string} returns.urgentOrders[].model - Model name
 * @returns {string} returns.urgentOrders[].crd - Customer required date
 * @returns {number} returns.urgentOrders[].quantity - Order quantity
 *
 * @returns {Array<Object>} returns.topDelayedDest - Top 5 delayed destinations
 * @returns {string} returns.topDelayedDest[].dest - Destination name
 * @returns {number} returns.topDelayedDest[].count - Delayed order count
 *
 * @returns {Object<string, number>} returns.factoryDelayed - Factory → delayed count map
 *
 * @example
 * analyzeDailyReport(orders)
 * // => {
 * //   summary: { totalOrders: 1000, delayedOrders: 50, ... },
 * //   processStats: [{ name: '재단(S_CUT)', key: 's_cut', ... }, ...],
 * //   bottlenecks: [{ name: '재봉(SEW_BAL)', rate: 65 }, ...],
 * //   urgentOrders: [...],
 * //   topDelayedDest: [...],
 * //   factoryDelayed: { A: 10, B: 15, C: 12, D: 13 }
 * // }
 *
 * @source rachgia_dashboard_v18.html:4109-4192
 * @note Uses local process definitions (not global constants)
 */
export function analyzeDailyReport(data) {
    // Overall statistics
    const totalOrders = data.length;
    const delayedOrders = data.filter(d => isDelayed(d));
    const warningOrders = data.filter(d => isWarning(d));
    const completedOrders = data.filter(d => d.production?.wh_out?.status === 'completed');

    // Process definitions (local to this function)
    const processes = ['s_cut', 'pre_sew', 'sew_input', 'sew_bal', 'osc', 'ass', 'wh_in', 'wh_out'];
    const processLabels = {
        's_cut': '재단(S_CUT)',
        'pre_sew': '선봉(PRE_SEW)',
        'sew_input': '재봉투입(SEW_INPUT)',
        'sew_bal': '재봉(SEW_BAL)',
        'osc': '외주(OSC)',
        'ass': '조립(ASS)',
        'wh_in': '입고(WH_IN)',
        'wh_out': '출고(WH_OUT)'
    };

    // Process completion statistics
    const processStats = processes.map(proc => {
        const completed = data.filter(d => d.production?.[proc]?.status === 'completed').length;
        const total = data.length;
        const rate = total > 0 ? (completed / total * 100) : 0;

        return {
            name: processLabels[proc],
            key: proc,
            completed,
            total,
            rate
        };
    });

    // Bottleneck processes (rate < 70%, exclude WH_OUT)
    const bottlenecks = processStats
        .slice(0, -1) // Exclude last process (WH_OUT)
        .filter(p => p.rate < 70)
        .sort((a, b) => a.rate - b.rate)
        .slice(0, 3);

    // Urgent orders (delayed + CRD within 7 days)
    const today = new Date();
    const urgentOrders = delayedOrders.filter(d => {
        const crd = new Date(d.crd);
        const daysUntil = (crd - today) / (1000 * 60 * 60 * 24);
        return daysUntil <= 7;
    }).slice(0, 10);

    // Top delayed destinations
    const delayedByDest = {};
    delayedOrders.forEach(d => {
        const dest = d.destination || 'Unknown';
        delayedByDest[dest] = (delayedByDest[dest] || 0) + 1;
    });

    const topDelayedDest = Object.entries(delayedByDest)
        .map(([dest, count]) => ({ dest, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Factory-wise delayed counts
    const factoryDelayed = {};
    delayedOrders.forEach(d => {
        const factory = d.factory || 'Unknown';
        factoryDelayed[factory] = (factoryDelayed[factory] || 0) + 1;
    });

    return {
        summary: {
            totalOrders,
            delayedOrders: delayedOrders.length,
            warningOrders: warningOrders.length,
            completedOrders: completedOrders.length,
            delayedRate: totalOrders > 0 ? ((delayedOrders.length / totalOrders) * 100).toFixed(1) : '0.0',
            completionRate: totalOrders > 0 ? ((completedOrders.length / totalOrders) * 100).toFixed(1) : '0.0'
        },
        processStats,
        bottlenecks,
        urgentOrders,
        topDelayedDest,
        factoryDelayed
    };
}

// ============================================================================
// Weekly Report Analytics
// ============================================================================

/**
 * Analyze weekly report data
 *
 * Tracks 7-day trends and performance metrics:
 *   - Week summary statistics
 *   - Daily production breakdown (CRD-based, 7 days)
 *   - Top destinations by shipment volume (max 10)
 *   - Vendor quality issues (delay rate > 10%, max 10)
 *   - Completion trend (WH_OUT date-based, 7 days)
 *
 * @param {Array<Object>} data - Order data array
 * @param {Date} weekStart - Week start date
 * @param {Date} weekEnd - Week end date
 * @returns {Object} Weekly report analytics
 *
 * @returns {Object} returns.summary - Overall statistics
 * @returns {number} returns.summary.totalOrders - Total order count (all data)
 * @returns {number} returns.summary.weekOrders - Orders with CRD in week range
 * @returns {number} returns.summary.delayedOrders - Delayed order count (all data)
 * @returns {number} returns.summary.completedOrders - Completed order count (all data)
 * @returns {string} returns.summary.weekCompletionRate - Week completion rate % (fixed 1 decimal)
 *
 * @returns {Object<string, Object>} returns.dailyProduction - Date → daily stats map (7 days, CRD-based)
 * @returns {number} returns.dailyProduction[date].total - Orders with CRD on this date
 * @returns {number} returns.dailyProduction[date].completed - Completed orders
 * @returns {string} returns.dailyProduction[date].rate - Completion rate % (fixed 1 decimal)
 * @returns {string} returns.dailyProduction[date].dayName - Korean day name (일/월/화/수/목/금/토)
 *
 * @returns {Array<Object>} returns.topDest - Top 10 destinations by total orders
 * @returns {string} returns.topDest[].dest - Destination name
 * @returns {number} returns.topDest[].total - Total orders
 * @returns {number} returns.topDest[].completed - Completed orders
 * @returns {number} returns.topDest[].delayed - Delayed orders
 * @returns {number} returns.topDest[].quantity - Total quantity
 * @returns {string} returns.topDest[].completionRate - Completion rate % (fixed 1 decimal)
 *
 * @returns {Array<Object>} returns.vendorIssues - Vendors with delay rate > 10% (max 10)
 * @returns {string} returns.vendorIssues[].vendor - Vendor name
 * @returns {number} returns.vendorIssues[].total - Total orders
 * @returns {number} returns.vendorIssues[].delayed - Delayed orders
 * @returns {number} returns.vendorIssues[].completed - Completed orders
 * @returns {string} returns.vendorIssues[].delayRate - Delay rate % (fixed 1 decimal)
 * @returns {string} returns.vendorIssues[].completionRate - Completion rate % (fixed 1 decimal)
 *
 * @returns {Array<Object>} returns.completionTrend - Daily completion counts by WH_OUT date (7 days)
 * @returns {string} returns.completionTrend[].date - Date string (YYYY-MM-DD)
 * @returns {number} returns.completionTrend[].count - Orders completed on this date
 * @returns {string} returns.completionTrend[].dayName - Korean day name
 *
 * @example
 * analyzeWeeklyReport(orders, new Date('2026-01-13'), new Date('2026-01-19'))
 * // => {
 * //   summary: { totalOrders: 1000, weekOrders: 150, ... },
 * //   dailyProduction: { '2026-01-13': { total: 20, completed: 18, rate: '90.0', dayName: '월' }, ... },
 * //   topDest: [...],
 * //   vendorIssues: [...],
 * //   completionTrend: [...]
 * // }
 *
 * @source rachgia_dashboard_v18.html:4439-4569
 * @note dailyProduction uses CRD for filtering, completionTrend uses WH_OUT date
 */
export function analyzeWeeklyReport(data, weekStart, weekEnd) {
    // Filter data by CRD within week range
    const weekData = data.filter(d => {
        const crd = new Date(d.crd);
        return crd >= weekStart && crd <= weekEnd;
    });

    // Overall statistics
    const totalOrders = data.length;
    const weekOrders = weekData.length;
    const delayedOrders = data.filter(d => isDelayed(d));
    const completedOrders = data.filter(d => d.production?.wh_out?.status === 'completed');

    // Daily production trend (7 days, CRD-based)
    const dailyProduction = {};
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        const dateStr = day.toISOString().slice(0, 10);

        const dayData = data.filter(d => {
            const crd = new Date(d.crd);
            return crd.toISOString().slice(0, 10) === dateStr;
        });

        const dayCompleted = dayData.filter(d => d.production?.wh_out?.status === 'completed');

        dailyProduction[dateStr] = {
            total: dayData.length,
            completed: dayCompleted.length,
            rate: dayData.length > 0 ? (dayCompleted.length / dayData.length * 100).toFixed(1) : '0.0',
            dayName: ['일', '월', '화', '수', '목', '금', '토'][day.getDay()]
        };
    }

    // Destination shipment status
    const destShipment = {};
    data.forEach(d => {
        const dest = d.destination || 'Unknown';
        if (!destShipment[dest]) {
            destShipment[dest] = {
                total: 0,
                completed: 0,
                delayed: 0,
                quantity: 0
            };
        }
        destShipment[dest].total++;
        destShipment[dest].quantity += d.quantity || 0;
        if (d.production?.wh_out?.status === 'completed') {
            destShipment[dest].completed++;
        }
        if (isDelayed(d)) {
            destShipment[dest].delayed++;
        }
    });

    const topDest = Object.entries(destShipment)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10)
        .map(([dest, stats]) => ({
            dest,
            ...stats,
            completionRate: stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(1) : '0.0'
        }));

    // Vendor quality issues (delay rate > 10%)
    const vendorQuality = {};
    data.forEach(d => {
        const vendor = d.outsoleVendor || 'Unknown';
        if (!vendorQuality[vendor]) {
            vendorQuality[vendor] = {
                total: 0,
                delayed: 0,
                completed: 0
            };
        }
        vendorQuality[vendor].total++;
        if (isDelayed(d)) {
            vendorQuality[vendor].delayed++;
        }
        if (d.production?.wh_out?.status === 'completed') {
            vendorQuality[vendor].completed++;
        }
    });

    const vendorIssues = Object.entries(vendorQuality)
        .map(([vendor, stats]) => ({
            vendor,
            ...stats,
            delayRate: stats.total > 0 ? (stats.delayed / stats.total * 100).toFixed(1) : '0.0',
            completionRate: stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(1) : '0.0'
        }))
        .filter(v => parseFloat(v.delayRate) > 10)
        .sort((a, b) => parseFloat(b.delayRate) - parseFloat(a.delayRate))
        .slice(0, 10);

    // Completion trend (7 days, WH_OUT date-based)
    const completionTrend = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        const dateStr = day.toISOString().slice(0, 10);

        const dayCompleted = data.filter(d => {
            const whOutDate = d.production?.wh_out?.date;
            if (!whOutDate) return false;
            return whOutDate.slice(0, 10) === dateStr;
        }).length;

        completionTrend.push({
            date: dateStr,
            count: dayCompleted,
            dayName: ['일', '월', '화', '수', '목', '금', '토'][day.getDay()]
        });
    }

    return {
        summary: {
            totalOrders,
            weekOrders,
            delayedOrders: delayedOrders.length,
            completedOrders: completedOrders.length,
            weekCompletionRate: weekOrders > 0 ? ((completedOrders.length / totalOrders) * 100).toFixed(1) : '0.0'
        },
        dailyProduction,
        topDest,
        vendorIssues,
        completionTrend
    };
}

// ============================================================================
// Monthly Report Analytics
// ============================================================================

/**
 * Analyze monthly report data
 *
 * Most comprehensive report with multi-dimensional analytics:
 *   - Month summary statistics
 *   - 6-month historical trends
 *   - Factory performance comparison
 *   - Top models by quantity (max 10)
 *   - Top destinations by quantity (max 10)
 *   - Vendor quality analysis (delay rate > 10%)
 *   - Process completion rates (8 stages)
 *
 * @param {Array<Object>} data - Order data array
 * @param {Date} currentMonth - Current month date
 * @returns {Object} Monthly report analytics
 *
 * @returns {Object} returns.summary - Overall statistics
 * @returns {number} returns.summary.totalOrders - Total orders in current month
 * @returns {number} returns.summary.completedOrders - Completed orders
 * @returns {number} returns.summary.delayedOrders - Delayed orders
 * @returns {number} returns.summary.warningOrders - Warning orders
 * @returns {string} returns.summary.completionRate - Completion rate % (fixed 1 decimal)
 *
 * @returns {Array<Object>} returns.monthlyTrends - 6-month historical trends
 * @returns {string} returns.monthlyTrends[].month - Month string (YYYY-MM)
 * @returns {number} returns.monthlyTrends[].totalOrders - Total orders
 * @returns {number} returns.monthlyTrends[].completed - Completed orders
 * @returns {number} returns.monthlyTrends[].delayed - Delayed orders
 * @returns {string} returns.monthlyTrends[].completionRate - Completion rate % (fixed 1 decimal)
 *
 * @returns {Object<string, Object>} returns.factoryStats - Factory → stats map
 * @returns {number} returns.factoryStats[factory].total - Total orders
 * @returns {number} returns.factoryStats[factory].completed - Completed orders
 * @returns {number} returns.factoryStats[factory].delayed - Delayed orders
 * @returns {string} returns.factoryStats[factory].completionRate - Completion rate % (fixed 1 decimal)
 * @returns {string} returns.factoryStats[factory].delayRate - Delay rate % (fixed 1 decimal)
 *
 * @returns {Array<Object>} returns.topModels - Top 10 models by quantity
 * @returns {string} returns.topModels[].model - Model name
 * @returns {number} returns.topModels[].total - Total orders
 * @returns {number} returns.topModels[].completed - Completed orders
 * @returns {number} returns.topModels[].quantity - Total quantity
 * @returns {string} returns.topModels[].completionRate - Completion rate % (fixed 1 decimal)
 *
 * @returns {Array<Object>} returns.topDest - Top 10 destinations by quantity
 * @returns {string} returns.topDest[].destination - Destination name
 * @returns {number} returns.topDest[].total - Total orders
 * @returns {number} returns.topDest[].completed - Completed orders
 * @returns {number} returns.topDest[].quantity - Total quantity
 * @returns {number} returns.topDest[].delayed - Delayed orders
 * @returns {string} returns.topDest[].completionRate - Completion rate % (fixed 1 decimal)
 * @returns {string} returns.topDest[].delayRate - Delay rate % (fixed 1 decimal)
 *
 * @returns {Array<Object>} returns.vendorIssues - Vendors with delay rate > 10%
 * @returns {string} returns.vendorIssues[].vendor - Vendor name
 * @returns {number} returns.vendorIssues[].total - Total orders
 * @returns {number} returns.vendorIssues[].delayed - Delayed orders
 * @returns {string} returns.vendorIssues[].delayRate - Delay rate % (fixed 1 decimal)
 *
 * @returns {Array<Object>} returns.processStats - 8 process completion rates
 * @returns {string} returns.processStats[].process - Process label
 * @returns {string} returns.processStats[].completionRate - Completion rate % (fixed 1 decimal)
 *
 * @example
 * analyzeMonthlyReport(orders, new Date('2026-01-01'))
 * // => {
 * //   summary: { totalOrders: 500, completedOrders: 450, ... },
 * //   monthlyTrends: [...],
 * //   factoryStats: { A: {...}, B: {...}, C: {...}, D: {...} },
 * //   topModels: [...],
 * //   topDest: [...],
 * //   vendorIssues: [...],
 * //   processStats: [...]
 * // }
 *
 * @source rachgia_dashboard_v18.html:4765-4928
 * @refactoring-note Make factory list dynamic instead of hardcoded ['A', 'B', 'C', 'D']
 */
export function analyzeMonthlyReport(data, currentMonth) {
    // Filter data by CRD within current month
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthData = data.filter(d => {
        const crd = new Date(d.crd);
        return crd >= monthStart && crd <= monthEnd;
    });

    // 1. Monthly summary statistics
    const totalOrders = monthData.length;
    const delayedOrders = monthData.filter(d => isDelayed(d)).length;
    const warningOrders = monthData.filter(d => isWarning(d) && !isDelayed(d)).length;
    const completedOrders = monthData.filter(d => d.production?.wh_out?.status === 'completed').length;
    const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0.0';

    // 2. 6-month historical trends
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
        const trendMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - i, 1);
        const trendMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - i + 1, 0);

        const trendData = data.filter(d => {
            const crd = new Date(d.crd);
            return crd >= trendMonth && crd <= trendMonthEnd;
        });

        const trendCompleted = trendData.filter(d => d.production?.wh_out?.status === 'completed').length;
        const trendDelayed = trendData.filter(d => isDelayed(d)).length;

        monthlyTrends.push({
            month: trendMonth.toISOString().slice(0, 7),
            totalOrders: trendData.length,
            completed: trendCompleted,
            delayed: trendDelayed,
            completionRate: trendData.length > 0 ? ((trendCompleted / trendData.length) * 100).toFixed(1) : '0.0'
        });
    }

    // 3. Factory performance comparison (dynamic factory detection)
    const factories = [...new Set(monthData.map(d => d.factory).filter(Boolean))].sort();
    const factoryStats = {};

    factories.forEach(factory => {
        const factoryData = monthData.filter(d => d.factory === factory);
        const completed = factoryData.filter(d => d.production?.wh_out?.status === 'completed').length;
        const delayed = factoryData.filter(d => isDelayed(d)).length;

        factoryStats[factory] = {
            total: factoryData.length,
            completed: completed,
            delayed: delayed,
            completionRate: factoryData.length > 0 ? ((completed / factoryData.length) * 100).toFixed(1) : '0.0',
            delayRate: factoryData.length > 0 ? ((delayed / factoryData.length) * 100).toFixed(1) : '0.0'
        };
    });

    // 4. Top models by quantity (max 10)
    const modelStats = {};
    monthData.forEach(d => {
        if (!modelStats[d.model]) {
            modelStats[d.model] = { total: 0, completed: 0, quantity: 0 };
        }
        modelStats[d.model].total++;
        modelStats[d.model].quantity += parseInt(d.quantity) || 0;
        if (d.production?.wh_out?.status === 'completed') {
            modelStats[d.model].completed++;
        }
    });

    const topModels = Object.entries(modelStats)
        .map(([model, stats]) => ({
            model,
            ...stats,
            completionRate: stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0.0'
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

    // 5. Top destinations by quantity (max 10)
    const destStats = {};
    monthData.forEach(d => {
        const dest = d.destination || 'Unknown';
        if (!destStats[dest]) {
            destStats[dest] = { total: 0, completed: 0, quantity: 0, delayed: 0 };
        }
        destStats[dest].total++;
        destStats[dest].quantity += parseInt(d.quantity) || 0;
        if (d.production?.wh_out?.status === 'completed') {
            destStats[dest].completed++;
        }
        if (isDelayed(d)) {
            destStats[dest].delayed++;
        }
    });

    const topDest = Object.entries(destStats)
        .map(([dest, stats]) => ({
            destination: dest,
            ...stats,
            completionRate: stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0.0',
            delayRate: stats.total > 0 ? ((stats.delayed / stats.total) * 100).toFixed(1) : '0.0'
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

    // 6. Vendor quality analysis (delay rate > 10%)
    const vendorStats = {};
    monthData.forEach(d => {
        const vendor = d.outsoleVendor || 'Unknown';
        if (!vendorStats[vendor]) {
            vendorStats[vendor] = { total: 0, delayed: 0 };
        }
        vendorStats[vendor].total++;
        if (isDelayed(d)) {
            vendorStats[vendor].delayed++;
        }
    });

    const vendorIssues = Object.entries(vendorStats)
        .map(([vendor, stats]) => ({
            vendor,
            ...stats,
            delayRate: ((stats.delayed / stats.total) * 100).toFixed(1)
        }))
        .filter(v => parseFloat(v.delayRate) > 10)
        .sort((a, b) => parseFloat(b.delayRate) - parseFloat(a.delayRate));

    // 7. Process completion rates (8 stages)
    const processDefinitions = [
        { name: 'S_CUT', label: '재단' },
        { name: 'PRE_SEW', label: '선봉' },
        { name: 'SEW_INPUT', label: '재봉투입' },
        { name: 'SEW_BAL', label: '재봉' },
        { name: 'OSC', label: '외주' },
        { name: 'ASS', label: '조립' },
        { name: 'WH_IN', label: '입고' },
        { name: 'WH_OUT', label: '출고' }
    ];

    const processStats = processDefinitions.map(process => {
        const processKey = PROCESS_KEY_MAP[process.name];
        const completedCount = monthData.filter(d =>
            d.production?.[processKey]?.status === 'completed'
        ).length;

        return {
            process: process.label,
            completionRate: monthData.length > 0 ? ((completedCount / monthData.length) * 100).toFixed(1) : '0.0'
        };
    });

    return {
        summary: {
            totalOrders,
            completedOrders,
            delayedOrders,
            warningOrders,
            completionRate
        },
        monthlyTrends,
        factoryStats,
        topModels,
        topDest,
        vendorIssues,
        processStats
    };
}

// ============================================================================
// Exports Summary
// ============================================================================

/**
 * Exported constants:
 *   - PROCESS_ORDER: Array of process keys in execution order
 *   - PROCESS_LABELS: Process key → label mappings
 *   - PROCESS_KEY_MAP: Upper snake_case → lowercase no-underscore mappings
 *
 * Exported functions:
 *   - calculateVendorPerformance(data)
 *   - predictBottleneck(data)
 *   - analyzeDailyReport(data)
 *   - analyzeWeeklyReport(data, weekStart, weekEnd)
 *   - analyzeMonthlyReport(data, currentMonth)
 *
 * Dependencies:
 *   - OrderModel.js: isDelayed(), isWarning()
 *
 * Refactoring Notes:
 *   1. calculateVendorPerformance: ✅ Already refactored to accept data parameter
 *   2. predictBottleneck: ✅ Already refactored to accept data parameter
 *   3. analyzeDailyReport: ✅ Already uses data parameter
 *   4. analyzeWeeklyReport: ✅ Already uses data parameter
 *   5. analyzeMonthlyReport: ✅ Already uses data parameter, factory list made dynamic
 *
 * All functions are now pure and testable with no global dependencies.
 */

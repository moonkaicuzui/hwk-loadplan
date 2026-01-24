/**
 * OrderModel.js - Order Business Logic Layer
 * ===========================================
 *
 * Pure business logic for order state management and analytics.
 * NO DOM dependencies - fully unit testable.
 *
 * @module OrderModel
 * @agent A07 (MVC Architect)
 * @phase H06 - MVC 구조 리팩토링 Phase 1
 * @version 19.0.0
 */

// ============================================================================
// Module-Level Cache
// ============================================================================

/**
 * Date parsing cache for performance optimization
 * Max size: 1000 entries to prevent memory leak
 * @type {Map<string, Date>}
 */
const dateParseCache = new Map();

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Parse date string with caching for performance
 * Handles both YYYY.MM.DD and YYYY-MM-DD formats
 *
 * @param {string} dateStr - Date string to parse
 * @returns {Date|null} Parsed Date object or null if invalid
 *
 * @example
 * parseDate('2026.01.15') // => Date object
 * parseDate('2026-01-15') // => Date object
 * parseDate('00:00:00')   // => null
 * parseDate(null)         // => null
 */
export function parseDate(dateStr) {
    if (!dateStr || dateStr === '00:00:00') return null;

    // Check cache first
    if (dateParseCache.has(dateStr)) {
        return dateParseCache.get(dateStr);
    }

    try {
        const parsed = new Date(dateStr.replace(/\./g, '-'));

        // Prevent memory leak: clear cache if too large
        if (dateParseCache.size > 1000) {
            dateParseCache.clear();
        }

        dateParseCache.set(dateStr, parsed);
        return parsed;
    } catch (e) {
        return null;
    }
}

// ============================================================================
// State Checking Functions
// ============================================================================

/**
 * Check if order is delayed
 * Ground Truth: 지연 = SDD > CRD (출고예정일이 고객요구일보다 늦음)
 *
 * Logic:
 * 1. SDD (Scheduled Delivery Date) must be later than CRD (Customer Required Date)
 * 2. NOT delayed if already shipped (WH_OUT completed)
 * 3. NOT delayed if Code04 approved (official SDD change approval)
 *
 * @param {Object} d - Order record
 * @param {string} d.sddValue - Scheduled delivery date
 * @param {string} d.crd - Customer required date
 * @param {string} [d.code04] - Code04 approval status
 * @param {number} [d.quantity] - Order quantity
 * @param {Object} [d.production] - Production data
 * @param {Object} [d.production.wh_out] - Warehouse output data
 * @param {number} [d.production.wh_out.completed] - Completed quantity
 * @returns {boolean} True if order is delayed
 *
 * @example
 * isDelayed({ sddValue: '2026-02-01', crd: '2026-01-01', quantity: 1000 })
 * // => true (SDD > CRD)
 *
 * isDelayed({ sddValue: '2026-02-01', crd: '2026-01-01', code04: 'Approval' })
 * // => false (Code04 approved)
 */
export function isDelayed(d) {
    const sdd = d.sddValue;
    const crd = d.crd;

    // Invalid dates
    if (!sdd || !crd || sdd === '00:00:00' || crd === '00:00:00') {
        return false;
    }

    // Already shipped - not delayed
    const whOutCompleted = d.production?.wh_out?.completed || 0;
    const qty = d.quantity || 0;
    if (whOutCompleted >= qty) {
        return false;
    }

    // Code04 approval - officially approved SDD change
    if (d.code04) {
        return false;
    }

    // Compare dates
    const sddDate = parseDate(sdd);
    const crdDate = parseDate(crd);
    if (!sddDate || !crdDate) {
        return false;
    }

    return sddDate > crdDate;
}

/**
 * Check if order is in warning state
 * Warning: SDD가 CRD에 근접 (3일 이내 차이)
 *
 * Logic:
 * 1. NOT warning if already shipped
 * 2. NOT warning if already delayed (delayed takes priority)
 * 3. Warning if CRD - SDD between 0-3 days
 *
 * @param {Object} d - Order record
 * @returns {boolean} True if order is in warning state
 *
 * @example
 * isWarning({ sddValue: '2026-01-10', crd: '2026-01-12', quantity: 1000 })
 * // => true (2 days difference)
 */
export function isWarning(d) {
    const sdd = d.sddValue;
    const crd = d.crd;

    if (!sdd || !crd || sdd === '00:00:00' || crd === '00:00:00') {
        return false;
    }

    // Already shipped - not warning
    const whOutCompleted = d.production?.wh_out?.completed || 0;
    const qty = d.quantity || 0;
    if (whOutCompleted >= qty) {
        return false;
    }

    // Already delayed - delayed takes priority
    if (isDelayed(d)) {
        return false;
    }

    const sddDate = parseDate(sdd);
    const crdDate = parseDate(crd);
    if (!sddDate || !crdDate) {
        return false;
    }

    // CRD - SDD between 0-3 days
    const diffDays = (crdDate - sddDate) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
}

/**
 * Check if order is critical
 * Critical: CRD가 오늘로부터 3일 이내
 *
 * Logic:
 * 1. NOT critical if already shipped
 * 2. NOT critical if already delayed (delayed is more severe)
 * 3. Critical if CRD within 3 days from today
 *
 * @param {Object} d - Order record
 * @returns {boolean} True if order is critical
 *
 * @example
 * // Today is 2026-01-10
 * isCritical({ crd: '2026-01-12', quantity: 1000 })
 * // => true (2 days until CRD)
 */
export function isCritical(d) {
    const crd = d.crd;
    if (!crd || crd === '00:00:00') {
        return false;
    }

    // Already shipped - not critical
    const whOutCompleted = d.production?.wh_out?.completed || 0;
    const qty = d.quantity || 0;
    if (whOutCompleted >= qty) {
        return false;
    }

    // Already delayed - delayed is more severe
    if (isDelayed(d)) {
        return false;
    }

    const today = new Date();
    const crdDate = parseDate(crd);
    if (!crdDate) {
        return false;
    }

    // Days until CRD
    const diffDays = (crdDate - today) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
}

/**
 * Check if order is shipped
 * Shipped: WH_OUT completed >= order quantity
 *
 * @param {Object} d - Order record
 * @returns {boolean} True if order is shipped
 *
 * @example
 * isShipped({ quantity: 1000, production: { wh_out: { completed: 1000 } } })
 * // => true
 */
export function isShipped(d) {
    const whOutCompleted = d.production?.wh_out?.completed || 0;
    const qty = d.quantity || 0;
    return qty > 0 && whOutCompleted >= qty;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse process cell and calculate status
 *
 * @param {number|string} value - Completed quantity
 * @param {number} qty - Total order quantity
 * @returns {Object} Process status object
 * @returns {number} returns.completed - Completed quantity
 * @returns {number} returns.pending - Pending quantity
 * @returns {string} returns.status - Status: 'pending' | 'partial' | 'completed'
 *
 * @example
 * parseProcessCell(800, 1000)
 * // => { completed: 800, pending: 200, status: 'partial' }
 */
export function parseProcessCell(value, qty) {
    const completed = parseFloat(value) || 0;
    const pending = Math.max(0, qty - completed);

    let status = 'pending';
    if (completed >= qty) {
        status = 'completed';
    } else if (completed > 0) {
        status = 'partial';
    }

    return { completed, pending, status };
}

/**
 * Calculate if record is delayed (simplified version)
 * Used during data import/processing
 *
 * @param {Object} record - Order record
 * @returns {boolean} True if delayed
 */
export function calculateIsDelayed(record) {
    if (record.code04) return false;
    if (!record.sddValue || !record.crd) return false;

    const sdd = new Date(record.sddValue);
    const crd = new Date(record.crd);
    return sdd > crd;
}

/**
 * Calculate if record is in warning state (simplified version)
 * Used during data import/processing
 *
 * @param {Object} record - Order record
 * @returns {boolean} True if in warning state
 */
export function calculateIsWarning(record) {
    if (record.isDelayed) return false;
    if (!record.sddValue) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sdd = new Date(record.sddValue);
    const diffDays = (sdd - today) / (1000 * 60 * 60 * 24);

    return diffDays >= 0 && diffDays <= 3;
}

// ============================================================================
// Analytics Functions
// ============================================================================

/**
 * Detect anomalies in order data
 * Performs 6 types of anomaly detection
 *
 * @param {Array<Object>} data - Array of order records
 * @returns {Object} Anomaly detection results
 * @returns {Array} returns.quantityOutliers - Quantity outliers (Z-score > 3)
 * @returns {Array} returns.processDelays - Process delays (<50% complete + CRD within 7 days)
 * @returns {Array} returns.dateAnomalies - Date anomalies (SDD-CRD gap >180 or <-30 days)
 * @returns {Array} returns.duplicatePO - Duplicate PO numbers
 * @returns {Array} returns.missingDestination - Missing/unknown destinations
 * @returns {Array} returns.vendorIssues - Vendor quality issues (delay rate >30%)
 *
 * @example
 * const anomalies = detectAnomalies(orders);
 * console.log(anomalies.quantityOutliers); // High quantity outliers
 * console.log(anomalies.vendorIssues);     // Vendors with >30% delay rate
 */
export function detectAnomalies(data) {
    const anomalies = {
        quantityOutliers: [],
        processDelays: [],
        dateAnomalies: [],
        duplicatePO: [],
        missingDestination: [],
        vendorIssues: []
    };

    // 1. 수량 이상치 탐지 (Z-score > 3)
    const quantities = data.map(d => parseInt(d.quantity) || 0).filter(q => q > 0);
    if (quantities.length > 0) {
        const mean = quantities.reduce((a, b) => a + b, 0) / quantities.length;
        const stdDev = Math.sqrt(
            quantities.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / quantities.length
        );

        data.forEach(d => {
            const qty = parseInt(d.quantity) || 0;
            const zScore = Math.abs((qty - mean) / stdDev);
            if (zScore > 3) {
                anomalies.quantityOutliers.push({
                    po: d.poNumber,
                    model: d.model,
                    quantity: qty,
                    zScore: zScore.toFixed(2),
                    severity: zScore > 5 ? 'critical' : 'warning'
                });
            }
        });
    }

    // 2. 공정 지연 이상치 탐지
    data.forEach(d => {
        const crd = parseDate(d.crd);
        if (!crd) return;

        const today = new Date();
        const daysUntilCRD = (crd - today) / (1000 * 60 * 60 * 24);

        // CRD 7일 이내인데 완료율 50% 미만
        if (daysUntilCRD >= 0 && daysUntilCRD <= 7) {
            const whOutCompleted = d.production?.wh_out?.completed || 0;
            const qty = d.quantity || 0;
            const completionRate = qty > 0 ? (whOutCompleted / qty) * 100 : 0;

            if (completionRate < 50) {
                anomalies.processDelays.push({
                    po: d.poNumber,
                    model: d.model,
                    crd: d.crd,
                    daysUntilCRD: daysUntilCRD.toFixed(1),
                    completionRate: completionRate.toFixed(1),
                    severity: daysUntilCRD <= 3 ? 'critical' : 'warning'
                });
            }
        }
    });

    // 3. CRD/SDD 간격 이상치 탐지
    data.forEach(d => {
        const sdd = parseDate(d.sddValue);
        const crd = parseDate(d.crd);
        if (!sdd || !crd) return;

        const gapDays = (sdd - crd) / (1000 * 60 * 60 * 24);

        // 비정상적으로 긴 간격 (>180일) 또는 음수 간격 (<-30일)
        if (gapDays > 180 || gapDays < -30) {
            anomalies.dateAnomalies.push({
                po: d.poNumber,
                model: d.model,
                crd: d.crd,
                sdd: d.sddValue,
                gapDays: gapDays.toFixed(0),
                severity: Math.abs(gapDays) > 365 ? 'critical' : 'warning'
            });
        }
    });

    // 4. 중복 PO 번호 탐지
    const poMap = {};
    data.forEach(d => {
        const po = d.poNumber;
        if (!po) return;

        if (!poMap[po]) {
            poMap[po] = [];
        }
        poMap[po].push(d);
    });

    Object.entries(poMap).forEach(([po, records]) => {
        if (records.length > 1) {
            anomalies.duplicatePO.push({
                po,
                count: records.length,
                models: records.map(r => r.model).join(', '),
                severity: 'warning'
            });
        }
    });

    // 5. 행선지 이상 탐지
    data.forEach(d => {
        const dest = d.destination?.trim();
        if (!dest || dest === 'Unknown' || dest === 'N/A' || dest === '') {
            anomalies.missingDestination.push({
                po: d.poNumber,
                model: d.model,
                destination: dest || '(empty)',
                severity: 'warning'
            });
        }
    });

    // 6. 벤더 품질 이상 탐지 (지연율 >30%)
    const vendorStats = {};
    data.forEach(d => {
        const vendor = d.outsoleVendor || 'Unknown';
        if (!vendorStats[vendor]) {
            vendorStats[vendor] = { total: 0, delayed: 0 };
        }
        vendorStats[vendor].total++;
        if (isDelayed(d)) {
            vendorStats[vendor].delayed++;
        }
    });

    Object.entries(vendorStats).forEach(([vendor, stats]) => {
        const delayRate = (stats.delayed / stats.total) * 100;
        if (delayRate > 30 && stats.total >= 5) {
            anomalies.vendorIssues.push({
                vendor,
                total: stats.total,
                delayed: stats.delayed,
                delayRate: delayRate.toFixed(1),
                severity: delayRate > 50 ? 'critical' : 'warning'
            });
        }
    });

    return anomalies;
}

// ============================================================================
// Exports Summary
// ============================================================================

/**
 * Exported functions:
 *
 * Date Utilities:
 * - parseDate(dateStr)
 *
 * State Checking:
 * - isDelayed(d)
 * - isWarning(d)
 * - isCritical(d)
 * - isShipped(d)
 *
 * Helpers:
 * - parseProcessCell(value, qty)
 * - calculateIsDelayed(record)
 * - calculateIsWarning(record)
 *
 * Analytics:
 * - detectAnomalies(data)
 */

/**
 * OrderModel.test.js - Unit Tests for Order Business Logic
 * =========================================================
 *
 * Comprehensive unit tests for all OrderModel.js functions
 *
 * @module OrderModel.test
 * @agent A07 (MVC Architect)
 * @phase H06-9 - MVC 구조 리팩토링 Phase 1: 단위 테스트
 * @version 19.0.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    parseDate,
    isDelayed,
    isWarning,
    isCritical,
    isShipped,
    parseProcessCell,
    calculateIsDelayed,
    calculateIsWarning,
    detectAnomalies
} from '../../../src/models/OrderModel.js';

// ============================================================================
// parseDate() Tests
// ============================================================================

describe('parseDate', () => {
    it('should parse valid YYYY.MM.DD format', () => {
        const result = parseDate('2026.01.15');
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(0); // January is 0
        expect(result.getDate()).toBe(15);
    });

    it('should parse valid YYYY-MM-DD format', () => {
        const result = parseDate('2026-01-15');
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(0);
        expect(result.getDate()).toBe(15);
    });

    it('should return null for invalid date string "00:00:00"', () => {
        expect(parseDate('00:00:00')).toBeNull();
    });

    it('should return null for null input', () => {
        expect(parseDate(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
        expect(parseDate(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
        expect(parseDate('')).toBeNull();
    });

    it('should cache parsed dates (same input returns same cached result)', () => {
        const date1 = parseDate('2026.01.15');
        const date2 = parseDate('2026.01.15');
        // Both should be Date objects with same value
        expect(date1).toEqual(date2);
    });
});

// ============================================================================
// isDelayed() Tests
// ============================================================================

describe('isDelayed', () => {
    it('should return true when SDD > CRD', () => {
        const order = {
            sddValue: '2026-02-01',
            crd: '2026-01-01',
            quantity: 1000,
            production: {
                wh_out: { completed: 0 }
            }
        };
        expect(isDelayed(order)).toBe(true);
    });

    it('should return false when SDD <= CRD', () => {
        const order = {
            sddValue: '2026-01-01',
            crd: '2026-02-01',
            quantity: 1000,
            production: {
                wh_out: { completed: 0 }
            }
        };
        expect(isDelayed(order)).toBe(false);
    });

    it('should return false when already shipped (whOutCompleted >= quantity)', () => {
        const order = {
            sddValue: '2026-02-01',
            crd: '2026-01-01',
            quantity: 1000,
            production: {
                wh_out: { completed: 1000 }
            }
        };
        expect(isDelayed(order)).toBe(false);
    });

    it('should return false when Code04 approval exists', () => {
        const order = {
            sddValue: '2026-02-01',
            crd: '2026-01-01',
            code04: 'Approval',
            quantity: 1000,
            production: {
                wh_out: { completed: 0 }
            }
        };
        expect(isDelayed(order)).toBe(false);
    });

    it('should return false when sddValue is missing', () => {
        const order = {
            crd: '2026-01-01',
            quantity: 1000
        };
        expect(isDelayed(order)).toBe(false);
    });

    it('should return false when crd is missing', () => {
        const order = {
            sddValue: '2026-02-01',
            quantity: 1000
        };
        expect(isDelayed(order)).toBe(false);
    });

    it('should return false when sddValue is "00:00:00"', () => {
        const order = {
            sddValue: '00:00:00',
            crd: '2026-01-01',
            quantity: 1000
        };
        expect(isDelayed(order)).toBe(false);
    });

    it('should return false when crd is "00:00:00"', () => {
        const order = {
            sddValue: '2026-02-01',
            crd: '00:00:00',
            quantity: 1000
        };
        expect(isDelayed(order)).toBe(false);
    });

    it('should handle missing production.wh_out gracefully', () => {
        const order = {
            sddValue: '2026-02-01',
            crd: '2026-01-01',
            quantity: 1000
        };
        expect(isDelayed(order)).toBe(true);
    });
});

// ============================================================================
// isWarning() Tests
// ============================================================================

describe('isWarning', () => {
    it('should return true when CRD - SDD is 1 day (within 0-3 days)', () => {
        const order = {
            sddValue: '2026-01-10',
            crd: '2026-01-11',
            quantity: 1000,
            production: {
                wh_out: { completed: 0 }
            }
        };
        expect(isWarning(order)).toBe(true);
    });

    it('should return true when CRD - SDD is 3 days (boundary)', () => {
        const order = {
            sddValue: '2026-01-10',
            crd: '2026-01-13',
            quantity: 1000,
            production: {
                wh_out: { completed: 0 }
            }
        };
        expect(isWarning(order)).toBe(true);
    });

    it('should return false when CRD - SDD is 0 days (same date)', () => {
        const order = {
            sddValue: '2026-01-10',
            crd: '2026-01-10',
            quantity: 1000,
            production: {
                wh_out: { completed: 0 }
            }
        };
        expect(isWarning(order)).toBe(false);
    });

    it('should return false when CRD - SDD is 4 days (outside range)', () => {
        const order = {
            sddValue: '2026-01-10',
            crd: '2026-01-14',
            quantity: 1000,
            production: {
                wh_out: { completed: 0 }
            }
        };
        expect(isWarning(order)).toBe(false);
    });

    it('should return false when already shipped', () => {
        const order = {
            sddValue: '2026-01-10',
            crd: '2026-01-12',
            quantity: 1000,
            production: {
                wh_out: { completed: 1000 }
            }
        };
        expect(isWarning(order)).toBe(false);
    });

    it('should return false when already delayed (delayed takes priority)', () => {
        const order = {
            sddValue: '2026-01-15',
            crd: '2026-01-10',
            quantity: 1000,
            production: {
                wh_out: { completed: 0 }
            }
        };
        expect(isWarning(order)).toBe(false);
    });

    it('should return false when dates are invalid', () => {
        const order = {
            sddValue: '00:00:00',
            crd: '2026-01-10',
            quantity: 1000
        };
        expect(isWarning(order)).toBe(false);
    });
});

// ============================================================================
// isCritical() Tests
// ============================================================================

describe('isCritical', () => {
    it('should return true when CRD is 2 days from today', () => {
        const today = new Date();
        const crdDate = new Date(today);
        crdDate.setDate(crdDate.getDate() + 2);

        const order = {
            crd: crdDate.toISOString().slice(0, 10),
            sddValue: '2025-01-01', // Past date, not delayed
            quantity: 1000,
            production: {
                wh_out: { completed: 0 }
            }
        };
        expect(isCritical(order)).toBe(true);
    });

    it('should return false when CRD is 4 days from today (outside range)', () => {
        const today = new Date();
        const crdDate = new Date(today);
        crdDate.setDate(crdDate.getDate() + 4);

        const order = {
            crd: crdDate.toISOString().slice(0, 10),
            sddValue: '2025-01-01',
            quantity: 1000,
            production: {
                wh_out: { completed: 0 }
            }
        };
        expect(isCritical(order)).toBe(false);
    });

    it('should return false when already shipped', () => {
        const today = new Date();
        const crdDate = new Date(today);
        crdDate.setDate(crdDate.getDate() + 2);

        const order = {
            crd: crdDate.toISOString().slice(0, 10),
            quantity: 1000,
            production: {
                wh_out: { completed: 1000 }
            }
        };
        expect(isCritical(order)).toBe(false);
    });

    it('should return false when already delayed (delayed is more severe)', () => {
        const today = new Date();
        const crdDate = new Date(today);
        crdDate.setDate(crdDate.getDate() + 2);

        const sddDate = new Date(crdDate);
        sddDate.setDate(sddDate.getDate() + 5);

        const order = {
            crd: crdDate.toISOString().slice(0, 10),
            sddValue: sddDate.toISOString().slice(0, 10),
            quantity: 1000,
            production: {
                wh_out: { completed: 0 }
            }
        };
        expect(isCritical(order)).toBe(false);
    });

    it('should return false when crd is invalid', () => {
        const order = {
            crd: '00:00:00',
            quantity: 1000
        };
        expect(isCritical(order)).toBe(false);
    });

    it('should return false when crd is in the past', () => {
        const order = {
            crd: '2020-01-01',
            sddValue: '2019-12-01',
            quantity: 1000,
            production: {
                wh_out: { completed: 0 }
            }
        };
        expect(isCritical(order)).toBe(false);
    });
});

// ============================================================================
// isShipped() Tests
// ============================================================================

describe('isShipped', () => {
    it('should return true when whOutCompleted >= quantity', () => {
        const order = {
            quantity: 1000,
            production: {
                wh_out: { completed: 1000 }
            }
        };
        expect(isShipped(order)).toBe(true);
    });

    it('should return true when whOutCompleted > quantity', () => {
        const order = {
            quantity: 1000,
            production: {
                wh_out: { completed: 1200 }
            }
        };
        expect(isShipped(order)).toBe(true);
    });

    it('should return false when whOutCompleted < quantity', () => {
        const order = {
            quantity: 1000,
            production: {
                wh_out: { completed: 800 }
            }
        };
        expect(isShipped(order)).toBe(false);
    });

    it('should return false when quantity is 0', () => {
        const order = {
            quantity: 0,
            production: {
                wh_out: { completed: 0 }
            }
        };
        expect(isShipped(order)).toBe(false);
    });

    it('should handle missing production.wh_out gracefully', () => {
        const order = {
            quantity: 1000
        };
        expect(isShipped(order)).toBe(false);
    });
});

// ============================================================================
// parseProcessCell() Tests
// ============================================================================

describe('parseProcessCell', () => {
    it('should return completed status when completed >= quantity', () => {
        const result = parseProcessCell(1000, 1000);
        expect(result).toEqual({
            completed: 1000,
            pending: 0,
            status: 'completed'
        });
    });

    it('should return partial status when 0 < completed < quantity', () => {
        const result = parseProcessCell(500, 1000);
        expect(result).toEqual({
            completed: 500,
            pending: 500,
            status: 'partial'
        });
    });

    it('should return pending status when completed = 0', () => {
        const result = parseProcessCell(0, 1000);
        expect(result).toEqual({
            completed: 0,
            pending: 1000,
            status: 'pending'
        });
    });

    it('should handle string numbers correctly', () => {
        const result = parseProcessCell('800', 1000);
        expect(result).toEqual({
            completed: 800,
            pending: 200,
            status: 'partial'
        });
    });

    it('should handle completed > quantity (over-production)', () => {
        const result = parseProcessCell(1200, 1000);
        expect(result).toEqual({
            completed: 1200,
            pending: 0,
            status: 'completed'
        });
    });

    it('should handle invalid value gracefully', () => {
        const result = parseProcessCell(null, 1000);
        expect(result).toEqual({
            completed: 0,
            pending: 1000,
            status: 'pending'
        });
    });
});

// ============================================================================
// calculateIsDelayed() Tests
// ============================================================================

describe('calculateIsDelayed', () => {
    it('should return true when SDD > CRD', () => {
        const record = {
            sddValue: '2026-02-01',
            crd: '2026-01-01'
        };
        expect(calculateIsDelayed(record)).toBe(true);
    });

    it('should return false when SDD <= CRD', () => {
        const record = {
            sddValue: '2026-01-01',
            crd: '2026-02-01'
        };
        expect(calculateIsDelayed(record)).toBe(false);
    });

    it('should return false when code04 exists', () => {
        const record = {
            sddValue: '2026-02-01',
            crd: '2026-01-01',
            code04: 'Approval'
        };
        expect(calculateIsDelayed(record)).toBe(false);
    });

    it('should return false when sddValue is missing', () => {
        const record = {
            crd: '2026-01-01'
        };
        expect(calculateIsDelayed(record)).toBe(false);
    });

    it('should return false when crd is missing', () => {
        const record = {
            sddValue: '2026-02-01'
        };
        expect(calculateIsDelayed(record)).toBe(false);
    });
});

// ============================================================================
// calculateIsWarning() Tests
// ============================================================================

describe('calculateIsWarning', () => {
    it('should return true when SDD is 2 days from today', () => {
        const today = new Date();
        const sddDate = new Date(today);
        sddDate.setDate(sddDate.getDate() + 2);

        const record = {
            sddValue: sddDate.toISOString().slice(0, 10),
            isDelayed: false
        };
        expect(calculateIsWarning(record)).toBe(true);
    });

    it('should return false when isDelayed is true', () => {
        const today = new Date();
        const sddDate = new Date(today);
        sddDate.setDate(sddDate.getDate() + 2);

        const record = {
            sddValue: sddDate.toISOString().slice(0, 10),
            isDelayed: true
        };
        expect(calculateIsWarning(record)).toBe(false);
    });

    it('should return false when sddValue is missing', () => {
        const record = {
            isDelayed: false
        };
        expect(calculateIsWarning(record)).toBe(false);
    });

    it('should return false when SDD is 4 days from today (outside range)', () => {
        const today = new Date();
        const sddDate = new Date(today);
        sddDate.setDate(sddDate.getDate() + 4);

        const record = {
            sddValue: sddDate.toISOString().slice(0, 10),
            isDelayed: false
        };
        expect(calculateIsWarning(record)).toBe(false);
    });
});

// ============================================================================
// detectAnomalies() Tests
// ============================================================================

describe('detectAnomalies', () => {
    it('should detect quantity outliers (Z-score > 3)', () => {
        const data = [
            { poNumber: 'PO1', model: 'M1', quantity: 1000 },
            { poNumber: 'PO2', model: 'M2', quantity: 1000 },
            { poNumber: 'PO3', model: 'M3', quantity: 1000 },
            { poNumber: 'PO4', model: 'M4', quantity: 10000 } // Outlier
        ];

        const result = detectAnomalies(data);
        expect(result.quantityOutliers.length).toBeGreaterThan(0);
        expect(result.quantityOutliers[0].po).toBe('PO4');
    });

    it('should detect process delays (<50% complete + CRD within 7 days)', () => {
        const today = new Date();
        const crdDate = new Date(today);
        crdDate.setDate(crdDate.getDate() + 5);

        const data = [
            {
                poNumber: 'PO1',
                model: 'M1',
                quantity: 1000,
                crd: crdDate.toISOString().slice(0, 10),
                production: {
                    wh_out: { completed: 300 } // 30% complete
                }
            }
        ];

        const result = detectAnomalies(data);
        expect(result.processDelays.length).toBeGreaterThan(0);
    });

    it('should detect date anomalies (SDD-CRD gap >180 days)', () => {
        const data = [
            {
                poNumber: 'PO1',
                model: 'M1',
                quantity: 1000,
                sddValue: '2026-12-31',
                crd: '2026-01-01' // 364 days gap
            }
        ];

        const result = detectAnomalies(data);
        expect(result.dateAnomalies.length).toBeGreaterThan(0);
    });

    it('should detect duplicate PO numbers', () => {
        const data = [
            { poNumber: 'PO1', model: 'M1', quantity: 1000 },
            { poNumber: 'PO1', model: 'M2', quantity: 2000 } // Duplicate
        ];

        const result = detectAnomalies(data);
        expect(result.duplicatePO.length).toBeGreaterThan(0);
        expect(result.duplicatePO[0].po).toBe('PO1');
        expect(result.duplicatePO[0].count).toBe(2);
    });

    it('should detect missing destinations', () => {
        const data = [
            { poNumber: 'PO1', model: 'M1', quantity: 1000, destination: '' },
            { poNumber: 'PO2', model: 'M2', quantity: 1000, destination: 'Unknown' }
        ];

        const result = detectAnomalies(data);
        expect(result.missingDestination.length).toBe(2);
    });

    it('should detect vendor quality issues (delay rate >30%)', () => {
        const data = [
            {
                poNumber: 'PO1',
                model: 'M1',
                quantity: 1000,
                outsoleVendor: 'VendorA',
                sddValue: '2026-02-01',
                crd: '2026-01-01',
                production: { wh_out: { completed: 0 } }
            },
            {
                poNumber: 'PO2',
                model: 'M2',
                quantity: 1000,
                outsoleVendor: 'VendorA',
                sddValue: '2026-02-01',
                crd: '2026-01-01',
                production: { wh_out: { completed: 0 } }
            },
            {
                poNumber: 'PO3',
                model: 'M3',
                quantity: 1000,
                outsoleVendor: 'VendorA',
                sddValue: '2026-02-01',
                crd: '2026-01-01',
                production: { wh_out: { completed: 0 } }
            },
            {
                poNumber: 'PO4',
                model: 'M4',
                quantity: 1000,
                outsoleVendor: 'VendorA',
                sddValue: '2026-02-01',
                crd: '2026-01-01',
                production: { wh_out: { completed: 0 } }
            },
            {
                poNumber: 'PO5',
                model: 'M5',
                quantity: 1000,
                outsoleVendor: 'VendorA',
                sddValue: '2026-02-01',
                crd: '2026-01-01',
                production: { wh_out: { completed: 0 } }
            }
        ];

        const result = detectAnomalies(data);
        expect(result.vendorIssues.length).toBeGreaterThan(0);
    });

    it('should return empty arrays when no anomalies detected', () => {
        const data = [
            {
                poNumber: 'PO1',
                model: 'M1',
                quantity: 1000,
                destination: 'Japan',
                outsoleVendor: 'VendorA',
                sddValue: '2026-01-15',
                crd: '2026-01-20',
                production: {
                    wh_out: { completed: 0 }
                }
            }
        ];

        const result = detectAnomalies(data);
        expect(result.quantityOutliers).toEqual([]);
        expect(result.duplicatePO).toEqual([]);
    });

    it('should handle empty data array', () => {
        const result = detectAnomalies([]);
        expect(result).toEqual({
            quantityOutliers: [],
            processDelays: [],
            dateAnomalies: [],
            duplicatePO: [],
            missingDestination: [],
            vendorIssues: []
        });
    });
});

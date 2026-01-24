/**
 * ChartModel.test.js - Unit Tests for Chart & Analytics Business Logic
 * =====================================================================
 *
 * Comprehensive unit tests for all ChartModel.js functions
 *
 * @module ChartModel.test
 * @agent A07 (MVC Architect)
 * @phase H06-9 - MVC 구조 리팩토링 Phase 1: 단위 테스트
 * @version 19.0.0
 */

import { describe, it, expect } from 'vitest';
import {
    PROCESS_ORDER,
    PROCESS_LABELS,
    PROCESS_KEY_MAP,
    calculateVendorPerformance,
    predictBottleneck,
    analyzeDailyReport,
    analyzeWeeklyReport,
    analyzeMonthlyReport
} from '../../../src/models/ChartModel.js';

// ============================================================================
// PROCESS_ORDER Constant Tests - 3 test cases
// ============================================================================

describe('PROCESS_ORDER', () => {
    it('should contain 8 processes in correct order', () => {
        expect(PROCESS_ORDER).toEqual([
            's_cut',
            'pre_sew',
            'sew_input',
            'sew_bal',
            'osc',
            'ass',
            'wh_in',
            'wh_out'
        ]);
    });

    it('should be an array', () => {
        expect(Array.isArray(PROCESS_ORDER)).toBe(true);
        expect(PROCESS_ORDER.length).toBe(8);
    });

    it('should have unique process keys', () => {
        const uniqueKeys = new Set(PROCESS_ORDER);
        expect(uniqueKeys.size).toBe(8);
    });
});

// ============================================================================
// PROCESS_LABELS Constant Tests - 3 test cases
// ============================================================================

describe('PROCESS_LABELS', () => {
    it('should contain labels for all 8 processes', () => {
        expect(PROCESS_LABELS).toHaveProperty('s_cut');
        expect(PROCESS_LABELS).toHaveProperty('pre_sew');
        expect(PROCESS_LABELS).toHaveProperty('sew_input');
        expect(PROCESS_LABELS).toHaveProperty('sew_bal');
        expect(PROCESS_LABELS).toHaveProperty('osc');
        expect(PROCESS_LABELS).toHaveProperty('ass');
        expect(PROCESS_LABELS).toHaveProperty('wh_in');
        expect(PROCESS_LABELS).toHaveProperty('wh_out');
    });

    it('should have Korean labels with English process names', () => {
        expect(PROCESS_LABELS['s_cut']).toBe('재단(S_CUT)');
        expect(PROCESS_LABELS['pre_sew']).toBe('선봉(PRE_SEW)');
        expect(PROCESS_LABELS['sew_bal']).toBe('재봉(SEW_BAL)');
        expect(PROCESS_LABELS['wh_out']).toBe('출고(WH_OUT)');
    });

    it('should have all keys from PROCESS_ORDER', () => {
        PROCESS_ORDER.forEach(key => {
            expect(PROCESS_LABELS).toHaveProperty(key);
        });
    });
});

// ============================================================================
// PROCESS_KEY_MAP Constant Tests - 3 test cases
// ============================================================================

describe('PROCESS_KEY_MAP', () => {
    it('should contain mappings for all 8 processes', () => {
        expect(Object.keys(PROCESS_KEY_MAP).length).toBe(8);
        expect(PROCESS_KEY_MAP).toHaveProperty('S_CUT');
        expect(PROCESS_KEY_MAP).toHaveProperty('WH_OUT');
    });

    it('should map uppercase snake_case to lowercase no-underscore', () => {
        expect(PROCESS_KEY_MAP['S_CUT']).toBe('scut');
        expect(PROCESS_KEY_MAP['PRE_SEW']).toBe('presew');
        expect(PROCESS_KEY_MAP['SEW_INPUT']).toBe('sewinput');
        expect(PROCESS_KEY_MAP['SEW_BAL']).toBe('sewbal');
        expect(PROCESS_KEY_MAP['WH_IN']).toBe('whin');
        expect(PROCESS_KEY_MAP['WH_OUT']).toBe('whout');
    });

    it('should remove underscores from all values', () => {
        Object.values(PROCESS_KEY_MAP).forEach(value => {
            expect(value).not.toMatch(/_/);
            expect(value).toBe(value.toLowerCase());
        });
    });
});

// ============================================================================
// calculateVendorPerformance() Tests - 8 test cases
// ============================================================================

describe('calculateVendorPerformance', () => {
    it('should calculate vendor performance scores correctly', () => {
        const data = [
            {
                outsoleVendor: 'VendorA',
                sddValue: '2026-02-01',
                crd: '2026-01-01',
                quantity: 1000,
                production: { wh_out: { completed: 1000, status: 'completed' } }
            },
            {
                outsoleVendor: 'VendorA',
                sddValue: '2026-01-10',
                crd: '2026-01-15',
                quantity: 1000,
                production: { wh_out: { completed: 0, status: 'pending' } }
            }
        ];

        const result = calculateVendorPerformance(data);

        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('vendor');
        expect(result[0]).toHaveProperty('score');
        expect(result[0]).toHaveProperty('total');
        expect(result[0]).toHaveProperty('completed');
        expect(result[0]).toHaveProperty('delayed');
    });

    it('should return top 5 vendors sorted by score descending', () => {
        const data = Array.from({ length: 10 }, (_, i) => ({
            outsoleVendor: `Vendor${String.fromCharCode(65 + i)}`,
            sddValue: '2026-01-10',
            crd: '2026-01-15',
            quantity: 1000,
            production: { wh_out: { completed: i * 100, status: i >= 5 ? 'completed' : 'pending' } }
        }));

        const result = calculateVendorPerformance(data);

        expect(result.length).toBeLessThanOrEqual(5);

        // Verify descending score order
        for (let i = 0; i < result.length - 1; i++) {
            expect(parseFloat(result[i].score)).toBeGreaterThanOrEqual(parseFloat(result[i + 1].score));
        }
    });

    it('should handle empty data array', () => {
        const result = calculateVendorPerformance([]);
        expect(result).toEqual([]);
    });

    it('should handle Unknown vendor gracefully', () => {
        const data = [
            {
                outsoleVendor: null,
                sddValue: '2026-01-10',
                crd: '2026-01-15',
                quantity: 1000,
                production: { wh_out: { completed: 500, status: 'partial' } }
            }
        ];

        const result = calculateVendorPerformance(data);

        expect(result.length).toBe(1);
        expect(result[0].vendor).toBe('Unknown');
    });

    it('should calculate score using formula: completionRate × 70 + onTimeRate × 30', () => {
        const data = [
            {
                outsoleVendor: 'VendorA',
                sddValue: '2026-01-10',
                crd: '2026-01-15',
                quantity: 1000,
                production: { wh_out: { completed: 1000, status: 'completed' } }
            },
            {
                outsoleVendor: 'VendorA',
                sddValue: '2026-01-10',
                crd: '2026-01-15',
                quantity: 1000,
                production: { wh_out: { completed: 1000, status: 'completed' } }
            }
        ];

        const result = calculateVendorPerformance(data);

        // completionRate = 2/2 = 100%
        // onTimeRate = 1 - (0/2) = 100%
        // score = (1.0 × 70) + (1.0 × 30) = 100.0
        expect(result[0].score).toBe('100.0');
    });

    it('should handle 0% completion rate', () => {
        const data = [
            {
                outsoleVendor: 'VendorA',
                sddValue: '2026-01-10',
                crd: '2026-01-15',
                quantity: 1000,
                production: { wh_out: { completed: 0, status: 'pending' } }
            }
        ];

        const result = calculateVendorPerformance(data);

        expect(result[0].completed).toBe(0);
        expect(parseFloat(result[0].score)).toBeLessThan(100);
    });

    it('should handle 100% delay rate', () => {
        const data = [
            {
                outsoleVendor: 'VendorA',
                sddValue: '2026-02-01',
                crd: '2026-01-01',
                quantity: 1000,
                production: { wh_out: { completed: 0, status: 'pending' } }
            }
        ];

        const result = calculateVendorPerformance(data);

        expect(result[0].delayed).toBe(1);
        expect(parseFloat(result[0].score)).toBeLessThan(50); // Low score due to delay
    });

    it('should handle ties in score by maintaining stable order', () => {
        const data = [
            {
                outsoleVendor: 'VendorA',
                sddValue: '2026-01-10',
                crd: '2026-01-15',
                quantity: 1000,
                production: { wh_out: { completed: 500, status: 'partial' } }
            },
            {
                outsoleVendor: 'VendorB',
                sddValue: '2026-01-10',
                crd: '2026-01-15',
                quantity: 1000,
                production: { wh_out: { completed: 500, status: 'partial' } }
            }
        ];

        const result = calculateVendorPerformance(data);

        expect(result.length).toBe(2);
        // Both should have same score
        expect(result[0].score).toBe(result[1].score);
    });
});

// ============================================================================
// predictBottleneck() Tests - 7 test cases
// ============================================================================

describe('predictBottleneck', () => {
    it('should identify bottleneck process with lowest completion rate', () => {
        const data = [
            {
                quantity: 1000,
                production: {
                    's_cut': { completed: 1000, pending: 0 },
                    'pre_sew': { completed: 900, pending: 100 },
                    'sew_bal': { completed: 600, pending: 400 }, // Lowest rate
                    'wh_in': { completed: 800, pending: 200 }
                }
            }
        ];

        const result = predictBottleneck(data);

        expect(result).not.toBeNull();
        expect(result.process).toBe('재봉(SEW_BAL)');
        expect(parseFloat(result.rate)).toBe(60.0);
    });

    it('should exclude WH_OUT from bottleneck detection', () => {
        const data = [
            {
                quantity: 1000,
                production: {
                    's_cut': { completed: 1000, pending: 0 },
                    'sew_bal': { completed: 900, pending: 100 },
                    'wh_out': { completed: 100, pending: 900 } // Lowest but should be excluded
                }
            }
        ];

        const result = predictBottleneck(data);

        expect(result).not.toBeNull();
        expect(result.process).not.toBe('출고(WH_OUT)');
        expect(result.process).toBe('재봉(SEW_BAL)');
    });

    it('should return null when no bottleneck exists', () => {
        const result = predictBottleneck([]);
        expect(result).toBeNull();
    });

    it('should calculate affectedQty correctly', () => {
        const data = [
            {
                quantity: 1000,
                production: {
                    'sew_bal': { completed: 600, pending: 400 }
                }
            },
            {
                quantity: 2000,
                production: {
                    'sew_bal': { completed: 1200, pending: 800 }
                }
            }
        ];

        const result = predictBottleneck(data);

        expect(result).not.toBeNull();
        expect(result.affectedQty).toBe(1200); // 400 + 800
    });

    it('should calculate affectedOrders correctly', () => {
        const data = [
            {
                quantity: 1000,
                production: {
                    'sew_bal': { completed: 600, pending: 400 } // Has pending
                }
            },
            {
                quantity: 2000,
                production: {
                    'sew_bal': { completed: 2000, pending: 0 } // No pending
                }
            },
            {
                quantity: 1500,
                production: {
                    'sew_bal': { completed: 1000, pending: 500 } // Has pending
                }
            }
        ];

        const result = predictBottleneck(data);

        expect(result).not.toBeNull();
        expect(result.affectedOrders).toBe(2); // 2 orders with pending > 0
    });

    it('should select process with lowest rate among multiple processes', () => {
        const data = [
            {
                quantity: 1000,
                production: {
                    's_cut': { completed: 900, pending: 100 },    // 90%
                    'pre_sew': { completed: 850, pending: 150 },  // 85%
                    'sew_bal': { completed: 700, pending: 300 },  // 70% - Lowest
                    'osc': { completed: 800, pending: 200 }       // 80%
                }
            }
        ];

        const result = predictBottleneck(data);

        expect(result).not.toBeNull();
        expect(result.process).toBe('재봉(SEW_BAL)');
        expect(parseFloat(result.rate)).toBe(70.0);
    });

    it('should handle data with missing production fields gracefully', () => {
        const data = [
            {
                quantity: 1000,
                production: {
                    's_cut': { completed: 500, pending: 500 }
                    // Other processes missing
                }
            }
        ];

        const result = predictBottleneck(data);

        // Should still identify s_cut as bottleneck (only available process)
        expect(result).not.toBeNull();
        expect(result.process).toBe('재단(S_CUT)');
    });
});

// ============================================================================
// analyzeDailyReport() Tests - 10 test cases
// ============================================================================

describe('analyzeDailyReport', () => {
    it('should calculate summary statistics correctly', () => {
        const data = [
            {
                sddValue: '2026-02-01',
                crd: '2026-01-01',
                quantity: 1000,
                production: { wh_out: { status: 'completed' } }
            },
            {
                sddValue: '2026-01-10',
                crd: '2026-01-12',
                quantity: 1000,
                production: { wh_out: { status: 'pending' } }
            }
        ];

        const result = analyzeDailyReport(data);

        expect(result.summary).toHaveProperty('totalOrders');
        expect(result.summary).toHaveProperty('delayedOrders');
        expect(result.summary).toHaveProperty('warningOrders');
        expect(result.summary).toHaveProperty('completedOrders');
        expect(result.summary).toHaveProperty('delayedRate');
        expect(result.summary).toHaveProperty('completionRate');

        expect(result.summary.totalOrders).toBe(2);
        expect(result.summary.delayedOrders).toBe(1);
        expect(result.summary.completedOrders).toBe(1);
    });

    it('should include processStats for all 8 processes', () => {
        const data = [
            {
                quantity: 1000,
                production: {
                    's_cut': { status: 'completed' },
                    'pre_sew': { status: 'completed' },
                    'sew_input': { status: 'completed' },
                    'sew_bal': { status: 'completed' },
                    'osc': { status: 'completed' },
                    'ass': { status: 'completed' },
                    'wh_in': { status: 'completed' },
                    'wh_out': { status: 'completed' }
                }
            }
        ];

        const result = analyzeDailyReport(data);

        expect(result.processStats.length).toBe(8);
        expect(result.processStats[0]).toHaveProperty('name');
        expect(result.processStats[0]).toHaveProperty('key');
        expect(result.processStats[0]).toHaveProperty('completed');
        expect(result.processStats[0]).toHaveProperty('total');
        expect(result.processStats[0]).toHaveProperty('rate');
    });

    it('should calculate processStats completion rate correctly', () => {
        const data = [
            {
                quantity: 1000,
                production: {
                    's_cut': { status: 'completed' },
                    'wh_out': { status: 'pending' }
                }
            },
            {
                quantity: 1000,
                production: {
                    's_cut': { status: 'completed' },
                    'wh_out': { status: 'completed' }
                }
            }
        ];

        const result = analyzeDailyReport(data);

        const sCutStats = result.processStats.find(p => p.key === 's_cut');
        const whOutStats = result.processStats.find(p => p.key === 'wh_out');

        expect(sCutStats.rate).toBe(100); // 2/2
        expect(whOutStats.rate).toBe(50); // 1/2
    });

    it('should identify bottlenecks with rate < 70%', () => {
        const data = [
            {
                quantity: 1000,
                production: {
                    's_cut': { status: 'completed' },
                    'pre_sew': { status: 'pending' },
                    'sew_bal': { status: 'pending' },
                    'wh_out': { status: 'pending' }
                }
            },
            {
                quantity: 1000,
                production: {
                    's_cut': { status: 'completed' },
                    'pre_sew': { status: 'pending' },
                    'sew_bal': { status: 'pending' },
                    'wh_out': { status: 'pending' }
                }
            }
        ];

        const result = analyzeDailyReport(data);

        // pre_sew and sew_bal should be bottlenecks (0% completion rate)
        expect(result.bottlenecks.length).toBeGreaterThan(0);
        expect(result.bottlenecks.length).toBeLessThanOrEqual(3);
        result.bottlenecks.forEach(b => {
            expect(b.rate).toBeLessThan(70);
        });
    });

    it('should exclude WH_OUT from bottlenecks', () => {
        const data = [
            {
                quantity: 1000,
                production: {
                    's_cut': { status: 'completed' },
                    'wh_out': { status: 'pending' } // Low rate but should be excluded
                }
            }
        ];

        const result = analyzeDailyReport(data);

        const whOutBottleneck = result.bottlenecks.find(b => b.name === '출고(WH_OUT)');
        expect(whOutBottleneck).toBeUndefined();
    });

    it('should limit urgentOrders to max 10', () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const data = Array.from({ length: 20 }, (_, i) => ({
            sddValue: '2026-02-01',
            crd: tomorrow.toISOString().slice(0, 10),
            quantity: 1000,
            production: { wh_out: { status: 'pending' } }
        }));

        const result = analyzeDailyReport(data);

        expect(result.urgentOrders.length).toBeLessThanOrEqual(10);
    });

    it('should limit topDelayedDest to max 5', () => {
        const data = Array.from({ length: 10 }, (_, i) => ({
            sddValue: '2026-02-01',
            crd: '2026-01-01',
            destination: `Dest${i}`,
            quantity: 1000,
            production: { wh_out: { status: 'pending' } }
        }));

        const result = analyzeDailyReport(data);

        expect(result.topDelayedDest.length).toBeLessThanOrEqual(5);
    });

    it('should calculate factoryDelayed counts correctly', () => {
        const data = [
            {
                sddValue: '2026-02-01',
                crd: '2026-01-01',
                factory: 'A',
                quantity: 1000,
                production: { wh_out: { status: 'pending' } }
            },
            {
                sddValue: '2026-02-01',
                crd: '2026-01-01',
                factory: 'A',
                quantity: 1000,
                production: { wh_out: { status: 'pending' } }
            },
            {
                sddValue: '2026-02-01',
                crd: '2026-01-01',
                factory: 'B',
                quantity: 1000,
                production: { wh_out: { status: 'pending' } }
            }
        ];

        const result = analyzeDailyReport(data);

        expect(result.factoryDelayed['A']).toBe(2);
        expect(result.factoryDelayed['B']).toBe(1);
    });

    it('should handle empty data array', () => {
        const result = analyzeDailyReport([]);

        expect(result.summary.totalOrders).toBe(0);
        expect(result.summary.delayedOrders).toBe(0);
        expect(result.summary.delayedRate).toBe('0.0');
        expect(result.processStats.length).toBe(8);
        expect(result.bottlenecks.length).toBe(0);
        expect(result.urgentOrders.length).toBe(0);
    });

    it('should include all expected sections in report', () => {
        const data = [
            {
                sddValue: '2026-01-10',
                crd: '2026-01-15',
                factory: 'A',
                destination: 'Japan',
                quantity: 1000,
                production: { wh_out: { status: 'completed' } }
            }
        ];

        const result = analyzeDailyReport(data);

        expect(result).toHaveProperty('summary');
        expect(result).toHaveProperty('processStats');
        expect(result).toHaveProperty('bottlenecks');
        expect(result).toHaveProperty('urgentOrders');
        expect(result).toHaveProperty('topDelayedDest');
        expect(result).toHaveProperty('factoryDelayed');
    });
});

// ============================================================================
// analyzeWeeklyReport() Tests - 12 test cases
// ============================================================================

describe('analyzeWeeklyReport', () => {
    const weekStart = new Date('2026-01-13'); // Tuesday
    const weekEnd = new Date('2026-01-19');   // Monday

    it('should calculate summary statistics correctly', () => {
        const data = [
            {
                crd: '2026-01-15',
                quantity: 1000,
                production: { wh_out: { status: 'completed' } }
            },
            {
                crd: '2026-01-16',
                quantity: 1000,
                production: { wh_out: { status: 'pending' } }
            }
        ];

        const result = analyzeWeeklyReport(data, weekStart, weekEnd);

        expect(result.summary).toHaveProperty('totalOrders');
        expect(result.summary).toHaveProperty('weekOrders');
        expect(result.summary).toHaveProperty('delayedOrders');
        expect(result.summary).toHaveProperty('completedOrders');
        expect(result.summary).toHaveProperty('weekCompletionRate');

        expect(result.summary.totalOrders).toBe(2);
        expect(result.summary.weekOrders).toBe(2);
    });

    it('should filter weekOrders by CRD within date range', () => {
        const data = [
            { crd: '2026-01-14', quantity: 1000, production: { wh_out: { status: 'pending' } } }, // In range
            { crd: '2026-01-20', quantity: 1000, production: { wh_out: { status: 'pending' } } }, // Out of range
            { crd: '2026-01-12', quantity: 1000, production: { wh_out: { status: 'pending' } } }  // Out of range
        ];

        const result = analyzeWeeklyReport(data, weekStart, weekEnd);

        expect(result.summary.weekOrders).toBe(1); // Only first order in range
    });

    it('should generate dailyProduction for 7 days', () => {
        const data = [
            { crd: '2026-01-15', quantity: 1000, production: { wh_out: { status: 'completed' } } }
        ];

        const result = analyzeWeeklyReport(data, weekStart, weekEnd);

        expect(Object.keys(result.dailyProduction).length).toBe(7);
        expect(result.dailyProduction).toHaveProperty('2026-01-13');
        expect(result.dailyProduction).toHaveProperty('2026-01-19');
    });

    it('should include Korean day names in dailyProduction', () => {
        const data = [];
        const result = analyzeWeeklyReport(data, weekStart, weekEnd);

        const dayNames = Object.values(result.dailyProduction).map(d => d.dayName);
        expect(dayNames).toContain('일');
        expect(dayNames).toContain('월');
        expect(dayNames).toContain('화');
    });

    it('should limit topDest to max 10 destinations', () => {
        const data = Array.from({ length: 15 }, (_, i) => ({
            crd: '2026-01-15',
            destination: `Dest${i}`,
            quantity: (15 - i) * 100, // Descending quantity
            production: { wh_out: { status: 'completed' } }
        }));

        const result = analyzeWeeklyReport(data, weekStart, weekEnd);

        expect(result.topDest.length).toBeLessThanOrEqual(10);
    });

    it('should sort topDest by total orders descending', () => {
        const data = [
            { crd: '2026-01-15', destination: 'Japan', quantity: 500, production: { wh_out: { status: 'completed' } } },
            { crd: '2026-01-15', destination: 'Japan', quantity: 500, production: { wh_out: { status: 'completed' } } },
            { crd: '2026-01-15', destination: 'China', quantity: 1000, production: { wh_out: { status: 'completed' } } }
        ];

        const result = analyzeWeeklyReport(data, weekStart, weekEnd);

        expect(result.topDest[0].dest).toBe('Japan'); // 2 orders
        expect(result.topDest[1].dest).toBe('China'); // 1 order
    });

    it('should filter vendorIssues by delay rate > 10%', () => {
        const data = [
            {
                crd: '2026-01-15',
                outsoleVendor: 'VendorA',
                sddValue: '2026-02-01',
                quantity: 1000,
                production: { wh_out: { status: 'pending' } }
            },
            {
                crd: '2026-01-15',
                outsoleVendor: 'VendorB',
                sddValue: '2026-01-10',
                quantity: 1000,
                production: { wh_out: { status: 'completed' } }
            }
        ];

        const result = analyzeWeeklyReport(data, weekStart, weekEnd);

        // VendorA should appear (100% delay rate)
        // VendorB should not appear (0% delay rate)
        const vendorA = result.vendorIssues.find(v => v.vendor === 'VendorA');
        const vendorB = result.vendorIssues.find(v => v.vendor === 'VendorB');

        expect(vendorA).toBeDefined();
        expect(vendorB).toBeUndefined();
    });

    it('should limit vendorIssues to max 10 vendors', () => {
        const data = Array.from({ length: 20 }, (_, i) => ({
            crd: '2026-01-15',
            outsoleVendor: `Vendor${i}`,
            sddValue: '2026-02-01',
            quantity: 1000,
            production: { wh_out: { status: 'pending' } }
        }));

        const result = analyzeWeeklyReport(data, weekStart, weekEnd);

        expect(result.vendorIssues.length).toBeLessThanOrEqual(10);
    });

    it('should generate completionTrend for 7 days', () => {
        const data = [
            {
                crd: '2026-01-15',
                quantity: 1000,
                production: { wh_out: { status: 'completed', date: '2026-01-14' } }
            }
        ];

        const result = analyzeWeeklyReport(data, weekStart, weekEnd);

        expect(result.completionTrend.length).toBe(7);
        expect(result.completionTrend[0]).toHaveProperty('date');
        expect(result.completionTrend[0]).toHaveProperty('count');
        expect(result.completionTrend[0]).toHaveProperty('dayName');
    });

    it('should use WH_OUT date for completionTrend, not CRD', () => {
        const data = [
            {
                crd: '2026-01-15',
                quantity: 1000,
                production: { wh_out: { status: 'completed', date: '2026-01-14' } }
            }
        ];

        const result = analyzeWeeklyReport(data, weekStart, weekEnd);

        const day2026_01_14 = result.completionTrend.find(d => d.date === '2026-01-14');
        expect(day2026_01_14.count).toBe(1);
    });

    it('should handle empty data array', () => {
        const result = analyzeWeeklyReport([], weekStart, weekEnd);

        expect(result.summary.totalOrders).toBe(0);
        expect(result.summary.weekOrders).toBe(0);
        expect(Object.keys(result.dailyProduction).length).toBe(7);
        expect(result.topDest.length).toBe(0);
        expect(result.vendorIssues.length).toBe(0);
        expect(result.completionTrend.length).toBe(7);
    });

    it('should include all expected sections in report', () => {
        const data = [
            {
                crd: '2026-01-15',
                destination: 'Japan',
                outsoleVendor: 'VendorA',
                quantity: 1000,
                production: { wh_out: { status: 'completed', date: '2026-01-14' } }
            }
        ];

        const result = analyzeWeeklyReport(data, weekStart, weekEnd);

        expect(result).toHaveProperty('summary');
        expect(result).toHaveProperty('dailyProduction');
        expect(result).toHaveProperty('topDest');
        expect(result).toHaveProperty('vendorIssues');
        expect(result).toHaveProperty('completionTrend');
    });
});

// ============================================================================
// analyzeMonthlyReport() Tests - 14 test cases
// ============================================================================

describe('analyzeMonthlyReport', () => {
    const currentMonth = new Date('2026-01-15');

    it('should calculate summary statistics correctly', () => {
        const data = [
            {
                crd: '2026-01-15',
                sddValue: '2026-02-01',
                quantity: 1000,
                production: { wh_out: { status: 'completed' } }
            },
            {
                crd: '2026-01-20',
                sddValue: '2026-01-10',
                quantity: 1000,
                production: { wh_out: { status: 'pending' } }
            }
        ];

        const result = analyzeMonthlyReport(data, currentMonth);

        expect(result.summary).toHaveProperty('totalOrders');
        expect(result.summary).toHaveProperty('completedOrders');
        expect(result.summary).toHaveProperty('delayedOrders');
        expect(result.summary).toHaveProperty('warningOrders');
        expect(result.summary).toHaveProperty('completionRate');

        expect(result.summary.totalOrders).toBe(2);
    });

    it('should generate monthlyTrends for 6 months', () => {
        const data = [
            { crd: '2025-08-15', quantity: 1000, production: { wh_out: { status: 'completed' } } },
            { crd: '2025-12-15', quantity: 1000, production: { wh_out: { status: 'completed' } } },
            { crd: '2026-01-15', quantity: 1000, production: { wh_out: { status: 'completed' } } }
        ];

        const result = analyzeMonthlyReport(data, currentMonth);

        expect(result.monthlyTrends.length).toBe(6);
        expect(result.monthlyTrends[0]).toHaveProperty('month');
        expect(result.monthlyTrends[0]).toHaveProperty('totalOrders');
        expect(result.monthlyTrends[0]).toHaveProperty('completed');
        expect(result.monthlyTrends[0]).toHaveProperty('delayed');
        expect(result.monthlyTrends[0]).toHaveProperty('completionRate');
    });

    it('should order monthlyTrends chronologically (oldest to newest)', () => {
        const data = [];
        const result = analyzeMonthlyReport(data, currentMonth);

        // Should be: 2025-08, 2025-09, 2025-10, 2025-11, 2025-12, 2026-01
        expect(result.monthlyTrends[0].month).toBe('2025-08');
        expect(result.monthlyTrends[5].month).toBe('2026-01');
    });

    it('should dynamically detect factories from data', () => {
        const data = [
            { crd: '2026-01-15', factory: 'A', quantity: 1000, production: { wh_out: { status: 'completed' } } },
            { crd: '2026-01-15', factory: 'C', quantity: 1000, production: { wh_out: { status: 'completed' } } },
            { crd: '2026-01-15', factory: 'E', quantity: 1000, production: { wh_out: { status: 'completed' } } }
        ];

        const result = analyzeMonthlyReport(data, currentMonth);

        expect(result.factoryStats).toHaveProperty('A');
        expect(result.factoryStats).toHaveProperty('C');
        expect(result.factoryStats).toHaveProperty('E');
        expect(result.factoryStats).not.toHaveProperty('B');
        expect(result.factoryStats).not.toHaveProperty('D');
    });

    it('should calculate factoryStats completionRate and delayRate', () => {
        const data = [
            {
                crd: '2026-01-15',
                factory: 'A',
                sddValue: '2026-01-10',
                quantity: 1000,
                production: { wh_out: { status: 'completed' } }
            },
            {
                crd: '2026-01-15',
                factory: 'A',
                sddValue: '2026-02-01',
                quantity: 1000,
                production: { wh_out: { status: 'pending' } }
            }
        ];

        const result = analyzeMonthlyReport(data, currentMonth);

        expect(result.factoryStats['A'].total).toBe(2);
        expect(result.factoryStats['A'].completed).toBe(1);
        expect(result.factoryStats['A'].delayed).toBe(1);
        expect(result.factoryStats['A'].completionRate).toBe('50.0');
        expect(result.factoryStats['A'].delayRate).toBe('50.0');
    });

    it('should limit topModels to max 10 models', () => {
        const data = Array.from({ length: 15 }, (_, i) => ({
            crd: '2026-01-15',
            model: `Model${i}`,
            quantity: (15 - i) * 100, // Descending quantity
            production: { wh_out: { status: 'completed' } }
        }));

        const result = analyzeMonthlyReport(data, currentMonth);

        expect(result.topModels.length).toBeLessThanOrEqual(10);
    });

    it('should sort topModels by quantity descending', () => {
        const data = [
            { crd: '2026-01-15', model: 'ModelA', quantity: 500, production: { wh_out: { status: 'completed' } } },
            { crd: '2026-01-15', model: 'ModelB', quantity: 1500, production: { wh_out: { status: 'completed' } } },
            { crd: '2026-01-15', model: 'ModelC', quantity: 1000, production: { wh_out: { status: 'completed' } } }
        ];

        const result = analyzeMonthlyReport(data, currentMonth);

        expect(result.topModels[0].model).toBe('ModelB'); // 1500
        expect(result.topModels[1].model).toBe('ModelC'); // 1000
        expect(result.topModels[2].model).toBe('ModelA'); // 500
    });

    it('should limit topDest to max 10 destinations', () => {
        const data = Array.from({ length: 15 }, (_, i) => ({
            crd: '2026-01-15',
            destination: `Dest${i}`,
            quantity: (15 - i) * 100,
            production: { wh_out: { status: 'completed' } }
        }));

        const result = analyzeMonthlyReport(data, currentMonth);

        expect(result.topDest.length).toBeLessThanOrEqual(10);
    });

    it('should sort topDest by quantity descending', () => {
        const data = [
            { crd: '2026-01-15', destination: 'Japan', quantity: 500, production: { wh_out: { status: 'completed' } } },
            { crd: '2026-01-15', destination: 'China', quantity: 1500, production: { wh_out: { status: 'completed' } } },
            { crd: '2026-01-15', destination: 'Korea', quantity: 1000, production: { wh_out: { status: 'completed' } } }
        ];

        const result = analyzeMonthlyReport(data, currentMonth);

        expect(result.topDest[0].destination).toBe('China'); // 1500
        expect(result.topDest[1].destination).toBe('Korea'); // 1000
        expect(result.topDest[2].destination).toBe('Japan'); // 500
    });

    it('should filter vendorIssues by delay rate > 10%', () => {
        const data = [
            {
                crd: '2026-01-15',
                outsoleVendor: 'VendorA',
                sddValue: '2026-02-01',
                quantity: 1000,
                production: { wh_out: { status: 'pending' } }
            },
            {
                crd: '2026-01-15',
                outsoleVendor: 'VendorB',
                sddValue: '2026-01-10',
                quantity: 1000,
                production: { wh_out: { status: 'completed' } }
            }
        ];

        const result = analyzeMonthlyReport(data, currentMonth);

        const vendorA = result.vendorIssues.find(v => v.vendor === 'VendorA');
        const vendorB = result.vendorIssues.find(v => v.vendor === 'VendorB');

        expect(vendorA).toBeDefined(); // 100% delay rate
        expect(vendorB).toBeUndefined(); // 0% delay rate
    });

    it('should sort vendorIssues by delay rate descending', () => {
        const data = [
            {
                crd: '2026-01-15',
                outsoleVendor: 'VendorA',
                sddValue: '2026-02-01',
                quantity: 1000,
                production: { wh_out: { status: 'pending' } }
            },
            {
                crd: '2026-01-15',
                outsoleVendor: 'VendorA',
                sddValue: '2026-01-10',
                quantity: 1000,
                production: { wh_out: { status: 'completed' } }
            },
            {
                crd: '2026-01-15',
                outsoleVendor: 'VendorB',
                sddValue: '2026-02-01',
                quantity: 1000,
                production: { wh_out: { status: 'pending' } }
            }
        ];

        const result = analyzeMonthlyReport(data, currentMonth);

        // VendorB: 100% delay rate
        // VendorA: 50% delay rate
        expect(result.vendorIssues[0].vendor).toBe('VendorB');
        expect(result.vendorIssues[1].vendor).toBe('VendorA');
    });

    it('should include processStats for all 8 processes', () => {
        const data = [
            {
                crd: '2026-01-15',
                quantity: 1000,
                production: {
                    'scut': { status: 'completed' },
                    'presew': { status: 'completed' },
                    'sewinput': { status: 'completed' },
                    'sewbal': { status: 'completed' },
                    'osc': { status: 'completed' },
                    'ass': { status: 'completed' },
                    'whin': { status: 'completed' },
                    'whout': { status: 'completed' }
                }
            }
        ];

        const result = analyzeMonthlyReport(data, currentMonth);

        expect(result.processStats.length).toBe(8);
        expect(result.processStats[0]).toHaveProperty('process');
        expect(result.processStats[0]).toHaveProperty('completionRate');
    });

    it('should use PROCESS_KEY_MAP for processStats keys', () => {
        const data = [
            {
                crd: '2026-01-15',
                quantity: 1000,
                production: {
                    'scut': { status: 'completed' },      // S_CUT → scut
                    'presew': { status: 'completed' },    // PRE_SEW → presew
                    'whout': { status: 'completed' }      // WH_OUT → whout
                }
            }
        ];

        const result = analyzeMonthlyReport(data, currentMonth);

        const sCutStats = result.processStats.find(p => p.process === '재단');
        const preSewStats = result.processStats.find(p => p.process === '선봉');
        const whOutStats = result.processStats.find(p => p.process === '출고');

        expect(sCutStats.completionRate).toBe('100.0');
        expect(preSewStats.completionRate).toBe('100.0');
        expect(whOutStats.completionRate).toBe('100.0');
    });

    it('should handle empty data array', () => {
        const result = analyzeMonthlyReport([], currentMonth);

        expect(result.summary.totalOrders).toBe(0);
        expect(result.summary.completionRate).toBe('0.0');
        expect(result.monthlyTrends.length).toBe(6);
        expect(Object.keys(result.factoryStats).length).toBe(0);
        expect(result.topModels.length).toBe(0);
        expect(result.topDest.length).toBe(0);
        expect(result.vendorIssues.length).toBe(0);
        expect(result.processStats.length).toBe(8);
    });
});

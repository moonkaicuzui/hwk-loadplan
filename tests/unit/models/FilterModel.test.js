/**
 * FilterModel.test.js - Unit Tests for Filter Business Logic
 * ===========================================================
 *
 * Comprehensive unit tests for all FilterModel.js functions
 *
 * @module FilterModel.test
 * @agent A07 (MVC Architect)
 * @phase H06-9 - MVC 구조 리팩토링 Phase 1: 단위 테스트
 * @version 19.0.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  matchesDateRange,
  matchesCustomDateRange,
  matchesBasicFilters,
  matchesStatusFilter,
  matchesQuickFilter,
  matchesSearch,
  matchesQuantityRange,
  IMPORTANT_DESTINATIONS,
} from '../../../src/models/FilterModel.js';

// ============================================================================
// matchesDateRange() Tests - 12 test cases
// ============================================================================

describe('matchesDateRange', () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekLater = new Date(today);
  weekLater.setDate(weekLater.getDate() + 7);

  const monthLater = new Date(today);
  monthLater.setMonth(monthLater.getMonth() + 1);

  it('should return true for "all" range filter', () => {
    const order = {
      sddValue: '2026-12-31',
      crd: '2026-12-31',
    };
    expect(matchesDateRange(order, 'all', 'sdd')).toBe(true);
  });

  it('should return true when SDD is within week range (mode=sdd)', () => {
    const order = {
      sddValue: weekLater.toISOString().slice(0, 10),
      crd: null,
    };
    expect(matchesDateRange(order, 'week', 'sdd')).toBe(true);
  });

  it('should return false when SDD is beyond week range (mode=sdd)', () => {
    const beyondWeek = new Date(today);
    beyondWeek.setDate(beyondWeek.getDate() + 8);

    const order = {
      sddValue: beyondWeek.toISOString().slice(0, 10),
      crd: null,
    };
    expect(matchesDateRange(order, 'week', 'sdd')).toBe(false);
  });

  it('should return true when SDD is within month range (mode=sdd)', () => {
    const order = {
      sddValue: monthLater.toISOString().slice(0, 10),
      crd: null,
    };
    expect(matchesDateRange(order, 'month', 'sdd')).toBe(true);
  });

  it('should return false when SDD is beyond month range (mode=sdd)', () => {
    const beyondMonth = new Date(today);
    beyondMonth.setMonth(beyondMonth.getMonth() + 2);

    const order = {
      sddValue: beyondMonth.toISOString().slice(0, 10),
      crd: null,
    };
    expect(matchesDateRange(order, 'month', 'sdd')).toBe(false);
  });

  it('should return true when CRD is within week range (mode=crd)', () => {
    const order = {
      sddValue: null,
      crd: weekLater.toISOString().slice(0, 10),
    };
    expect(matchesDateRange(order, 'week', 'crd')).toBe(true);
  });

  it('should return true when date is exactly today (boundary)', () => {
    const order = {
      sddValue: today.toISOString().slice(0, 10),
      crd: null,
    };
    expect(matchesDateRange(order, 'week', 'sdd')).toBe(true);
  });

  it('should return true when date field is missing (00:00:00)', () => {
    const order = {
      sddValue: '00:00:00',
      crd: null,
    };
    expect(matchesDateRange(order, 'week', 'sdd')).toBe(true);
  });

  it('should return true when date field is null', () => {
    const order = {
      sddValue: null,
      crd: null,
    };
    expect(matchesDateRange(order, 'week', 'sdd')).toBe(true);
  });

  it('should use CRD when mode=crd and both dates exist', () => {
    const order = {
      sddValue: '2026-12-31', // Far future
      crd: weekLater.toISOString().slice(0, 10), // Within week
    };
    expect(matchesDateRange(order, 'week', 'crd')).toBe(true);
  });

  it('should fallback to SDD when mode=crd but CRD is missing', () => {
    const order = {
      sddValue: weekLater.toISOString().slice(0, 10),
      crd: null,
    };
    expect(matchesDateRange(order, 'week', 'crd')).toBe(true);
  });

  it('should handle date parsing with YYYY.MM.DD format', () => {
    const order = {
      sddValue: weekLater.toISOString().slice(0, 10).replace(/-/g, '.'),
      crd: null,
    };
    expect(matchesDateRange(order, 'week', 'sdd')).toBe(true);
  });
});

// ============================================================================
// matchesCustomDateRange() Tests - 10 test cases
// ============================================================================

describe('matchesCustomDateRange', () => {
  it('should return true when no date range specified', () => {
    const order = {
      sddValue: '2026-01-15',
      crd: null,
    };
    expect(matchesCustomDateRange(order, null, null, 'sdd')).toBe(true);
  });

  it('should return true when date is within range (inclusive)', () => {
    const order = {
      sddValue: '2026-01-15',
      crd: null,
    };
    expect(matchesCustomDateRange(order, '2026-01-01', '2026-01-31', 'sdd')).toBe(true);
  });

  it('should return true when date equals start date (boundary)', () => {
    const order = {
      sddValue: '2026-01-01',
      crd: null,
    };
    expect(matchesCustomDateRange(order, '2026-01-01', '2026-01-31', 'sdd')).toBe(true);
  });

  it('should return true when date equals end date (boundary)', () => {
    const order = {
      sddValue: '2026-01-31',
      crd: null,
    };
    expect(matchesCustomDateRange(order, '2026-01-01', '2026-01-31', 'sdd')).toBe(true);
  });

  it('should return false when date is before start date', () => {
    const order = {
      sddValue: '2025-12-31',
      crd: null,
    };
    expect(matchesCustomDateRange(order, '2026-01-01', '2026-01-31', 'sdd')).toBe(false);
  });

  it('should return false when date is after end date', () => {
    const order = {
      sddValue: '2026-02-01',
      crd: null,
    };
    expect(matchesCustomDateRange(order, '2026-01-01', '2026-01-31', 'sdd')).toBe(false);
  });

  it('should return true when only start date specified and date is after', () => {
    const order = {
      sddValue: '2026-01-15',
      crd: null,
    };
    expect(matchesCustomDateRange(order, '2026-01-01', null, 'sdd')).toBe(true);
  });

  it('should return true when only end date specified and date is before', () => {
    const order = {
      sddValue: '2026-01-15',
      crd: null,
    };
    expect(matchesCustomDateRange(order, null, '2026-01-31', 'sdd')).toBe(true);
  });

  it('should return false when date field is invalid (00:00:00)', () => {
    const order = {
      sddValue: '00:00:00',
      crd: null,
    };
    expect(matchesCustomDateRange(order, '2026-01-01', '2026-01-31', 'sdd')).toBe(false);
  });

  it('should use CRD when mode=crd', () => {
    const order = {
      sddValue: '2025-01-01', // Outside range
      crd: '2026-01-15', // Within range
    };
    expect(matchesCustomDateRange(order, '2026-01-01', '2026-01-31', 'crd')).toBe(true);
  });
});

// ============================================================================
// matchesBasicFilters() Tests - 15 test cases
// ============================================================================

describe('matchesBasicFilters', () => {
  it('should return true when all filters are empty', () => {
    const order = {
      sddYearMonth: '2026-01',
      crdYearMonth: '2026-01',
      destination: 'Netherlands',
      outsoleVendor: 'VendorA',
      factory: 'A',
    };
    expect(matchesBasicFilters(order, '', '', '', '', 'sdd')).toBe(true);
  });

  it('should match month filter (mode=sdd)', () => {
    const order = {
      sddYearMonth: '2026-01',
      crdYearMonth: '2025-12',
      destination: 'Netherlands',
      outsoleVendor: 'VendorA',
      factory: 'A',
    };
    expect(matchesBasicFilters(order, '2026-01', '', '', '', 'sdd')).toBe(true);
  });

  it('should match month filter (mode=crd)', () => {
    const order = {
      sddYearMonth: '2025-12',
      crdYearMonth: '2026-01',
      destination: 'Netherlands',
      outsoleVendor: 'VendorA',
      factory: 'A',
    };
    expect(matchesBasicFilters(order, '2026-01', '', '', '', 'crd')).toBe(true);
  });

  it('should reject when month does not match', () => {
    const order = {
      sddYearMonth: '2026-02',
      crdYearMonth: '2026-02',
      destination: 'Netherlands',
      outsoleVendor: 'VendorA',
      factory: 'A',
    };
    expect(matchesBasicFilters(order, '2026-01', '', '', '', 'sdd')).toBe(false);
  });

  it('should match destination exactly', () => {
    const order = {
      sddYearMonth: '2026-01',
      crdYearMonth: '2026-01',
      destination: 'Netherlands',
      outsoleVendor: 'VendorA',
      factory: 'A',
    };
    expect(matchesBasicFilters(order, '', 'Netherlands', '', '', 'sdd')).toBe(true);
  });

  it('should reject when destination does not match', () => {
    const order = {
      sddYearMonth: '2026-01',
      crdYearMonth: '2026-01',
      destination: 'Germany',
      outsoleVendor: 'VendorA',
      factory: 'A',
    };
    expect(matchesBasicFilters(order, '', 'Netherlands', '', '', 'sdd')).toBe(false);
  });

  it('should match "asia" filter for important Asian destinations', () => {
    const order = {
      sddYearMonth: '2026-01',
      crdYearMonth: '2026-01',
      destination: 'Japan', // In IMPORTANT_DESTINATIONS
      outsoleVendor: 'VendorA',
      factory: 'A',
    };
    expect(matchesBasicFilters(order, '', 'asia', '', '', 'sdd')).toBe(true);
  });

  it('should reject "asia" filter for non-Asian destinations', () => {
    const order = {
      sddYearMonth: '2026-01',
      crdYearMonth: '2026-01',
      destination: 'Netherlands', // Not in IMPORTANT_DESTINATIONS
      outsoleVendor: 'VendorA',
      factory: 'A',
    };
    expect(matchesBasicFilters(order, '', 'asia', '', '', 'sdd')).toBe(false);
  });

  it('should match vendor filter', () => {
    const order = {
      sddYearMonth: '2026-01',
      crdYearMonth: '2026-01',
      destination: 'Netherlands',
      outsoleVendor: 'VendorA',
      factory: 'A',
    };
    expect(matchesBasicFilters(order, '', '', 'VendorA', '', 'sdd')).toBe(true);
  });

  it('should reject when vendor does not match', () => {
    const order = {
      sddYearMonth: '2026-01',
      crdYearMonth: '2026-01',
      destination: 'Netherlands',
      outsoleVendor: 'VendorB',
      factory: 'A',
    };
    expect(matchesBasicFilters(order, '', '', 'VendorA', '', 'sdd')).toBe(false);
  });

  it('should match factory filter', () => {
    const order = {
      sddYearMonth: '2026-01',
      crdYearMonth: '2026-01',
      destination: 'Netherlands',
      outsoleVendor: 'VendorA',
      factory: 'A',
    };
    expect(matchesBasicFilters(order, '', '', '', 'A', 'sdd')).toBe(true);
  });

  it('should reject when factory does not match', () => {
    const order = {
      sddYearMonth: '2026-01',
      crdYearMonth: '2026-01',
      destination: 'Netherlands',
      outsoleVendor: 'VendorA',
      factory: 'B',
    };
    expect(matchesBasicFilters(order, '', '', '', 'A', 'sdd')).toBe(false);
  });

  it('should match all filters combined', () => {
    const order = {
      sddYearMonth: '2026-01',
      crdYearMonth: '2025-12',
      destination: 'Netherlands',
      outsoleVendor: 'VendorA',
      factory: 'A',
    };
    expect(matchesBasicFilters(order, '2026-01', 'Netherlands', 'VendorA', 'A', 'sdd')).toBe(true);
  });

  it('should reject when any filter does not match', () => {
    const order = {
      sddYearMonth: '2026-01',
      crdYearMonth: '2026-01',
      destination: 'Netherlands',
      outsoleVendor: 'VendorA',
      factory: 'B', // Factory does not match
    };
    expect(matchesBasicFilters(order, '2026-01', 'Netherlands', 'VendorA', 'A', 'sdd')).toBe(false);
  });

  it('should fallback to sddYearMonth when mode=crd but crdYearMonth is missing', () => {
    const order = {
      sddYearMonth: '2026-01',
      crdYearMonth: null,
      destination: 'Netherlands',
      outsoleVendor: 'VendorA',
      factory: 'A',
    };
    expect(matchesBasicFilters(order, '2026-01', '', '', '', 'crd')).toBe(true);
  });
});

// ============================================================================
// matchesStatusFilter() Tests - 9 test cases
// ============================================================================

describe('matchesStatusFilter', () => {
  it('should return true when no status filter specified', () => {
    const order = {
      quantity: 1000,
      production: {
        wh_in: { status: 'completed' },
        wh_out: { completed: 1000 },
      },
    };
    expect(matchesStatusFilter(order, '')).toBe(true);
  });

  it('should match "shipped" status when wh_out completed >= quantity', () => {
    const order = {
      quantity: 1000,
      production: {
        wh_in: { status: 'completed' },
        wh_out: { completed: 1000 },
      },
    };
    expect(matchesStatusFilter(order, 'shipped')).toBe(true);
  });

  it('should reject "shipped" when wh_out completed < quantity', () => {
    const order = {
      quantity: 1000,
      production: {
        wh_in: { status: 'partial' },
        wh_out: { completed: 500 },
      },
    };
    expect(matchesStatusFilter(order, 'shipped')).toBe(false);
  });

  it('should match "completed" status when wh_in status is completed', () => {
    const order = {
      quantity: 1000,
      production: {
        wh_in: { status: 'completed' },
        wh_out: { completed: 800 },
      },
    };
    expect(matchesStatusFilter(order, 'completed')).toBe(true);
  });

  it('should reject "completed" when wh_in status is not completed', () => {
    const order = {
      quantity: 1000,
      production: {
        wh_in: { status: 'partial' },
        wh_out: { completed: 800 },
      },
    };
    expect(matchesStatusFilter(order, 'completed')).toBe(false);
  });

  it('should match "partial" status when wh_in status is partial', () => {
    const order = {
      quantity: 1000,
      production: {
        wh_in: { status: 'partial' },
        wh_out: { completed: 500 },
      },
    };
    expect(matchesStatusFilter(order, 'partial')).toBe(true);
  });

  it('should match "pending" status when wh_in status is pending', () => {
    const order = {
      quantity: 1000,
      production: {
        wh_in: { status: 'pending' },
        wh_out: { completed: 0 },
      },
    };
    expect(matchesStatusFilter(order, 'pending')).toBe(true);
  });

  it('should handle missing production.wh_in gracefully', () => {
    const order = {
      quantity: 1000,
      production: {
        wh_out: { completed: 500 },
      },
    };
    // Should reject all status filters when wh_in is missing
    expect(matchesStatusFilter(order, 'completed')).toBe(false);
    expect(matchesStatusFilter(order, 'partial')).toBe(false);
    expect(matchesStatusFilter(order, 'pending')).toBe(false);
  });

  it('should handle missing production object gracefully', () => {
    const order = { quantity: 1000 };
    // Should reject "shipped" when production is missing
    expect(matchesStatusFilter(order, 'shipped')).toBe(false);
  });
});

// ============================================================================
// matchesQuickFilter() Tests - 12 test cases
// ============================================================================

describe('matchesQuickFilter', () => {
  it('should return true when no quick filter specified', () => {
    const order = {
      sddValue: '2026-01-15',
      crd: '2026-01-10',
      quantity: 1000,
      production: { wh_out: { completed: 0 } },
    };
    expect(matchesQuickFilter(order, '', 'sdd')).toBe(true);
  });

  it('should match "delayed" filter when order is delayed', () => {
    const order = {
      sddValue: '2026-02-01',
      crd: '2026-01-01',
      quantity: 1000,
      production: { wh_out: { completed: 0 } },
    };
    expect(matchesQuickFilter(order, 'delayed', 'sdd')).toBe(true);
  });

  it('should reject "delayed" filter when order is not delayed', () => {
    const order = {
      sddValue: '2026-01-01',
      crd: '2026-02-01',
      quantity: 1000,
      production: { wh_out: { completed: 0 } },
    };
    expect(matchesQuickFilter(order, 'delayed', 'sdd')).toBe(false);
  });

  it('should match "warning" filter when order is in warning state', () => {
    const order = {
      sddValue: '2026-01-10',
      crd: '2026-01-12', // 2 days gap
      quantity: 1000,
      production: { wh_out: { completed: 0 } },
    };
    expect(matchesQuickFilter(order, 'warning', 'sdd')).toBe(true);
  });

  it('should reject "warning" filter when order is not in warning state', () => {
    const order = {
      sddValue: '2026-01-10',
      crd: '2026-01-20', // 10 days gap
      quantity: 1000,
      production: { wh_out: { completed: 0 } },
    };
    expect(matchesQuickFilter(order, 'warning', 'sdd')).toBe(false);
  });

  it('should match "today" filter when date is today (mode=sdd)', () => {
    const today = new Date();
    const order = {
      sddValue: today.toISOString().slice(0, 10),
      crd: null,
      quantity: 1000,
    };
    expect(matchesQuickFilter(order, 'today', 'sdd')).toBe(true);
  });

  it('should reject "today" filter when date is not today', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const order = {
      sddValue: tomorrow.toISOString().slice(0, 10),
      crd: null,
      quantity: 1000,
    };
    expect(matchesQuickFilter(order, 'today', 'sdd')).toBe(false);
  });

  it('should match "week" filter when date is within next 7 days', () => {
    const today = new Date();
    const fiveDaysLater = new Date(today);
    fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);

    const order = {
      sddValue: fiveDaysLater.toISOString().slice(0, 10),
      crd: null,
      quantity: 1000,
    };
    expect(matchesQuickFilter(order, 'week', 'sdd')).toBe(true);
  });

  it('should reject "week" filter when date is beyond 7 days', () => {
    const today = new Date();
    const eightDaysLater = new Date(today);
    eightDaysLater.setDate(eightDaysLater.getDate() + 8);

    const order = {
      sddValue: eightDaysLater.toISOString().slice(0, 10),
      crd: null,
      quantity: 1000,
    };
    expect(matchesQuickFilter(order, 'week', 'sdd')).toBe(false);
  });

  it('should match "month" filter when date is in current month', () => {
    const today = new Date();
    const sameMonth = new Date(today.getFullYear(), today.getMonth(), 15);

    const order = {
      sddValue: sameMonth.toISOString().slice(0, 10),
      crd: null,
      quantity: 1000,
    };
    expect(matchesQuickFilter(order, 'month', 'sdd')).toBe(true);
  });

  it('should reject "month" filter when date is in different month', () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);

    const order = {
      sddValue: nextMonth.toISOString().slice(0, 10),
      crd: null,
      quantity: 1000,
    };
    expect(matchesQuickFilter(order, 'month', 'sdd')).toBe(false);
  });

  it('should use CRD when mode=crd for date filters', () => {
    const today = new Date();
    const order = {
      sddValue: '2025-01-01', // Not today
      crd: today.toISOString().slice(0, 10), // Today
      quantity: 1000,
    };
    expect(matchesQuickFilter(order, 'today', 'crd')).toBe(true);
  });
});

// ============================================================================
// matchesSearch() Tests - 8 test cases
// ============================================================================

describe('matchesSearch', () => {
  const order = {
    model: 'Nike Air Max',
    destination: 'Netherlands',
    outsoleVendor: 'VendorA',
    poNumber: 'PO12345',
    factory: 'A',
    article: 'ART001',
  };

  it('should return true when no search query specified', () => {
    expect(matchesSearch(order, '')).toBe(true);
  });

  it('should match model field (case-insensitive)', () => {
    expect(matchesSearch(order, 'nike')).toBe(true);
    expect(matchesSearch(order, 'nike')).toBe(true); // search parameter should be lowercase
    expect(matchesSearch(order, 'air max')).toBe(true);
  });

  it('should match destination field (case-insensitive)', () => {
    expect(matchesSearch(order, 'netherlands')).toBe(true);
    expect(matchesSearch(order, 'NETHER')).toBe(true);
  });

  it('should match outsoleVendor field (case-insensitive)', () => {
    expect(matchesSearch(order, 'vendora')).toBe(true);
    expect(matchesSearch(order, 'VENDOR')).toBe(true);
  });

  it('should match poNumber field (case-insensitive)', () => {
    expect(matchesSearch(order, 'po12345')).toBe(true);
    expect(matchesSearch(order, '12345')).toBe(true);
  });

  it('should match factory field (case-insensitive)', () => {
    expect(matchesSearch(order, 'a')).toBe(true);
  });

  it('should match article field (case-insensitive)', () => {
    expect(matchesSearch(order, 'art001')).toBe(true);
    expect(matchesSearch(order, 'ART')).toBe(true);
  });

  it('should reject when search query does not match any field', () => {
    expect(matchesSearch(order, 'xyz123notfound')).toBe(false);
  });
});

// ============================================================================
// matchesQuantityRange() Tests - 8 test cases
// ============================================================================

describe('matchesQuantityRange', () => {
  it('should return true when no quantity range specified', () => {
    const order = { quantity: 5000 };
    expect(matchesQuantityRange(order, null, null)).toBe(true);
  });

  it('should return true when quantity is within range (inclusive)', () => {
    const order = { quantity: 5000 };
    expect(matchesQuantityRange(order, 1000, 10000)).toBe(true);
  });

  it('should return true when quantity equals minQty (boundary)', () => {
    const order = { quantity: 1000 };
    expect(matchesQuantityRange(order, 1000, 10000)).toBe(true);
  });

  it('should return true when quantity equals maxQty (boundary)', () => {
    const order = { quantity: 10000 };
    expect(matchesQuantityRange(order, 1000, 10000)).toBe(true);
  });

  it('should return false when quantity is below minQty', () => {
    const order = { quantity: 500 };
    expect(matchesQuantityRange(order, 1000, 10000)).toBe(false);
  });

  it('should return false when quantity is above maxQty', () => {
    const order = { quantity: 15000 };
    expect(matchesQuantityRange(order, 1000, 10000)).toBe(false);
  });

  it('should return true when only minQty specified and quantity >= minQty', () => {
    const order = { quantity: 5000 };
    expect(matchesQuantityRange(order, 1000, null)).toBe(true);
  });

  it('should return true when only maxQty specified and quantity <= maxQty', () => {
    const order = { quantity: 5000 };
    expect(matchesQuantityRange(order, null, 10000)).toBe(true);
  });
});

// ============================================================================
// IMPORTANT_DESTINATIONS Constant Tests - 2 test cases
// ============================================================================

describe('IMPORTANT_DESTINATIONS', () => {
  it('should contain expected Asian countries', () => {
    expect(IMPORTANT_DESTINATIONS).toHaveProperty('Japan');
    expect(IMPORTANT_DESTINATIONS).toHaveProperty('South Korea');
    expect(IMPORTANT_DESTINATIONS).toHaveProperty('China');
    expect(IMPORTANT_DESTINATIONS).toHaveProperty('Taiwan');
    expect(IMPORTANT_DESTINATIONS).toHaveProperty('India');
  });

  it('should map countries to flag emojis', () => {
    expect(IMPORTANT_DESTINATIONS['Japan']).toBe('🇯🇵');
    expect(IMPORTANT_DESTINATIONS['South Korea']).toBe('🇰🇷');
    expect(IMPORTANT_DESTINATIONS['China']).toBe('🇨🇳');
    expect(IMPORTANT_DESTINATIONS['Taiwan']).toBe('🇹🇼');
    expect(IMPORTANT_DESTINATIONS['India']).toBe('🇮🇳');
  });
});

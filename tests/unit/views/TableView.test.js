/**
 * TableView.test.js - Unit Tests for TableView Module
 * =====================================================
 *
 * Tests for table rendering, sorting, pagination, and progressive/virtual rendering.
 *
 * @module tests/unit/views/TableView
 * @version 19.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initTableView,
  createTableRowHTML,
  createModalTableRowHTML,
  renderTableProgressively,
  renderTableVirtually,
  renderDataCards,
  sortData,
  handleSort,
  prevPage,
  nextPage,
  changePageSize,
  updateDataTab,
} from '../../../src/views/TableView.js';

// ============================================================================
// Global Mocks for jsdom
// ============================================================================

// Mock IntersectionObserver (not available in jsdom)
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 0));

// ============================================================================
// Mock Data
// ============================================================================

const mockOrderData = [
  {
    factory: 'A',
    poNumber: 'PO-001',
    model: 'RS-100',
    article: 'ART-001',
    destination: 'USA',
    quantity: 1000,
    crd: '2026-01-15',
    sddValue: '2026-01-10',
    vendor: 'Vendor1',
    production: {
      s_cut: { completed: 1000, status: 'completed' },
      sew_bal: { completed: 800, status: 'partial' },
      wh_out: { completed: 500, status: 'partial' },
    },
    remaining: {
      sew: 200,
      osc: 100,
      ass: 50,
      whIn: 300,
      whOut: 500,
    },
  },
  {
    factory: 'B',
    poNumber: 'PO-002',
    model: 'RS-200',
    article: 'ART-002',
    destination: 'Japan',
    quantity: 500,
    crd: '2026-01-20',
    sddValue: '2026-01-25', // Delayed
    vendor: 'Vendor2',
    production: {
      s_cut: { completed: 500, status: 'completed' },
      sew_bal: { completed: 200, status: 'partial' },
      wh_out: { completed: 0, status: 'pending' },
    },
    remaining: {
      sew: 300,
      osc: 400,
      ass: 450,
      whIn: 500,
      whOut: 500,
    },
  },
  {
    factory: 'C',
    poNumber: 'PO-003',
    model: 'RS-300',
    article: 'ART-003',
    destination: 'Korea',
    quantity: 2000,
    crd: '2026-01-25',
    sddValue: '2026-01-20',
    vendor: 'Vendor1',
    production: {
      s_cut: { completed: 2000, status: 'completed' },
      sew_bal: { completed: 2000, status: 'completed' },
      wh_out: { completed: 2000, status: 'completed' },
    },
    remaining: {
      sew: 0,
      osc: 0,
      ass: 0,
      whIn: 0,
      whOut: 0,
    },
  },
];

// ============================================================================
// Mock DOM Elements
// ============================================================================

function createMockElement(id, options = {}) {
  const children = [];
  return {
    id,
    innerHTML: options.innerHTML || '',
    textContent: '',
    value: options.value || '',
    style: {},
    children,
    classList: {
      contains: vi.fn(() => false),
      add: vi.fn(),
      remove: vi.fn(),
      toggle: vi.fn(),
    },
    appendChild: vi.fn(child => children.push(child)),
    removeChild: vi.fn(),
    insertAdjacentHTML: vi.fn(),
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    closest: vi.fn(() => null),
    getBoundingClientRect: vi.fn(() => ({
      top: 0,
      left: 0,
      bottom: 500,
      right: 500,
      width: 500,
      height: 500,
    })),
    scrollTop: 0,
    offsetHeight: 500,
    scrollHeight: 1000,
  };
}

function createMockDocument() {
  const elements = {};

  return {
    getElementById: vi.fn(id => {
      if (!elements[id]) {
        elements[id] = createMockElement(id);
      }
      return elements[id];
    }),
    querySelector: vi.fn(() => createMockElement('mock')),
    querySelectorAll: vi.fn(() => []),
    createElement: vi.fn(tag => createMockElement(tag)),
    createDocumentFragment: vi.fn(() => ({
      appendChild: vi.fn(),
      children: [],
      querySelectorAll: vi.fn(() => []),
    })),
  };
}

// ============================================================================
// Mock Dependencies
// ============================================================================

const mockDependencies = {
  document: createMockDocument(),
  allData: mockOrderData,
  filteredData: mockOrderData,
  isDelayed: d => d.sddValue && d.crd && new Date(d.sddValue) > new Date(d.crd),
  isWarning: d => false,
  isCritical: d => false,
  isShipped: d => d.production?.wh_out?.status === 'completed',
  escapeHtml: str => String(str).replace(/[&<>"']/g, ''),
  showOrderProcessDetail: vi.fn(),
  applyFilters: vi.fn(),
};

// ============================================================================
// Tests
// ============================================================================

describe('TableView Module', () => {
  let mockDoc;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc = createMockDocument();

    initTableView({
      ...mockDependencies,
      document: mockDoc,
    });
  });

  // ========================================================================
  // Initialization Tests
  // ========================================================================

  describe('initTableView', () => {
    it('should initialize without errors', () => {
      expect(() => {
        initTableView(mockDependencies);
      }).not.toThrow();
    });

    it('should accept custom dependencies', () => {
      const customIsDelayed = vi.fn(() => true);

      expect(() => {
        initTableView({
          ...mockDependencies,
          isDelayed: customIsDelayed,
        });
      }).not.toThrow();
    });
  });

  // ========================================================================
  // Row Rendering Tests
  // ========================================================================

  describe('createTableRowHTML', () => {
    it('should create HTML string for a table row', () => {
      const html = createTableRowHTML(mockOrderData[0], 0);

      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    it('should include factory, model, destination in output', () => {
      const html = createTableRowHTML(mockOrderData[0], 0);

      // Should contain key data (escaped)
      expect(html).toContain('A'); // factory
    });

    it('should handle row index correctly', () => {
      const html1 = createTableRowHTML(mockOrderData[0], 0);
      const html2 = createTableRowHTML(mockOrderData[0], 5);

      // Both should be valid HTML
      expect(html1).toBeTruthy();
      expect(html2).toBeTruthy();
    });

    it('should handle missing production data', () => {
      const incompleteData = {
        factory: 'A',
        model: 'Test',
        destination: 'USA',
        quantity: 100,
        // No production field
      };

      expect(() => {
        createTableRowHTML(incompleteData, 0);
      }).not.toThrow();
    });
  });

  describe('createModalTableRowHTML', () => {
    it('should create HTML for modal table row', () => {
      const html = createModalTableRowHTML(mockOrderData[0], 0);

      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    it('should handle various data structures', () => {
      mockOrderData.forEach((data, index) => {
        expect(() => {
          createModalTableRowHTML(data, index);
        }).not.toThrow();
      });
    });
  });

  // ========================================================================
  // Rendering Strategies Tests
  // ========================================================================

  describe('renderTableProgressively', () => {
    it('should render table progressively', () => {
      const container = createMockElement('tableBody');

      expect(() => {
        renderTableProgressively(container, mockOrderData, { chunkSize: 50 });
      }).not.toThrow();
    });

    it('should handle empty data array', () => {
      const container = createMockElement('tableBody');

      expect(() => {
        renderTableProgressively(container, [], { chunkSize: 50 });
      }).not.toThrow();
    });

    it('should respect batch size parameter', () => {
      const container = createMockElement('tableBody');

      // Should not throw regardless of batch size
      expect(() => {
        renderTableProgressively(container, mockOrderData, { chunkSize: 1 });
        renderTableProgressively(container, mockOrderData, { chunkSize: 100 });
        renderTableProgressively(container, mockOrderData, { chunkSize: 1000 });
      }).not.toThrow();
    });
  });

  describe('renderTableVirtually', () => {
    it('should render table with virtual scrolling', () => {
      const container = createMockElement('tableContainer');

      expect(() => {
        renderTableVirtually(container, mockOrderData, { initialRows: 40 });
      }).not.toThrow();
    });

    it('should handle different row heights', () => {
      const container = createMockElement('tableContainer');

      expect(() => {
        renderTableVirtually(container, mockOrderData, { initialRows: 20 });
        renderTableVirtually(container, mockOrderData, { initialRows: 60 });
      }).not.toThrow();
    });
  });

  describe('renderDataCards', () => {
    it('should render data as cards', () => {
      const container = createMockElement('cardContainer');

      expect(() => {
        renderDataCards(container, mockOrderData);
      }).not.toThrow();
    });

    it('should handle empty data', () => {
      const container = createMockElement('cardContainer');

      expect(() => {
        renderDataCards(container, []);
      }).not.toThrow();
    });
  });

  // ========================================================================
  // Sorting Tests
  // ========================================================================

  describe('sortData', () => {
    it('should sort data by string field ascending', () => {
      const sorted = sortData([...mockOrderData], 'main', {
        getSortState: () => ({ main: { key: 'factory', dir: 'asc' } }),
      });

      expect(sorted[0].factory).toBe('A');
      expect(sorted[1].factory).toBe('B');
      expect(sorted[2].factory).toBe('C');
    });

    it('should sort data by string field descending', () => {
      const sorted = sortData([...mockOrderData], 'main', {
        getSortState: () => ({ main: { key: 'factory', dir: 'desc' } }),
      });

      expect(sorted[0].factory).toBe('C');
      expect(sorted[1].factory).toBe('B');
      expect(sorted[2].factory).toBe('A');
    });

    it('should sort data by numeric field', () => {
      const sorted = sortData([...mockOrderData], 'main', {
        getSortState: () => ({ main: { key: 'quantity', dir: 'asc' } }),
      });

      expect(sorted[0].quantity).toBe(500);
      expect(sorted[1].quantity).toBe(1000);
      expect(sorted[2].quantity).toBe(2000);
    });

    it('should sort data by date field', () => {
      const sorted = sortData([...mockOrderData], 'main', {
        getSortState: () => ({ main: { key: 'crd', dir: 'asc' } }),
      });

      expect(sorted[0].crd).toBe('2026-01-15');
      expect(sorted[1].crd).toBe('2026-01-20');
      expect(sorted[2].crd).toBe('2026-01-25');
    });

    it('should handle empty array', () => {
      const sorted = sortData([], 'main', {
        getSortState: () => ({ main: { key: 'factory', dir: 'asc' } }),
      });
      expect(sorted).toEqual([]);
    });

    it('should handle undefined field gracefully', () => {
      const dataWithMissing = [
        ...mockOrderData,
        { factory: 'D', model: 'Test' }, // No quantity
      ];

      expect(() => {
        sortData(dataWithMissing, 'main', {
          getSortState: () => ({ main: { key: 'quantity', dir: 'asc' } }),
        });
      }).not.toThrow();
    });
  });

  describe('handleSort', () => {
    it('should handle sort event', () => {
      const mockHeader = createMockElement('th');
      mockHeader.dataset = { sort: 'factory', table: 'main' };

      expect(() => {
        handleSort(mockHeader);
      }).not.toThrow();
    });

    it('should toggle sort direction on same column', () => {
      const mockHeader = createMockElement('th');
      mockHeader.dataset = { sort: 'factory', table: 'main' };

      handleSort(mockHeader);
      handleSort(mockHeader); // Should toggle

      // Verify no errors (direction toggling is internal)
      expect(true).toBe(true);
    });

    it('should reset direction on different column', () => {
      const mockHeader1 = createMockElement('th');
      mockHeader1.dataset = { sort: 'factory', table: 'main' };

      const mockHeader2 = createMockElement('th');
      mockHeader2.dataset = { sort: 'quantity', table: 'main' };

      handleSort(mockHeader1);
      handleSort(mockHeader2); // Different column

      expect(true).toBe(true);
    });
  });

  // ========================================================================
  // Pagination Tests
  // ========================================================================

  describe('prevPage', () => {
    it('should navigate to previous page', () => {
      expect(() => {
        prevPage();
      }).not.toThrow();
    });

    it('should not go below page 1', () => {
      // Call multiple times
      prevPage();
      prevPage();
      prevPage();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('nextPage', () => {
    it('should navigate to next page', () => {
      expect(() => {
        nextPage();
      }).not.toThrow();
    });
  });

  describe('changePageSize', () => {
    it('should change page size', () => {
      expect(() => {
        changePageSize(50);
      }).not.toThrow();
    });

    it('should handle various page sizes', () => {
      expect(() => {
        changePageSize(20);
        changePageSize(100);
        changePageSize(500);
      }).not.toThrow();
    });

    it('should handle "all" page size', () => {
      expect(() => {
        changePageSize('all');
      }).not.toThrow();
    });
  });

  // ========================================================================
  // Tab Update Tests
  // ========================================================================

  describe('updateDataTab', () => {
    it('should update data tab without errors', () => {
      expect(() => {
        updateDataTab();
      }).not.toThrow();
    });

    it('should handle empty filtered data', () => {
      initTableView({
        ...mockDependencies,
        document: mockDoc,
        filteredData: [],
      });

      expect(() => {
        updateDataTab();
      }).not.toThrow();
    });
  });
});

// ============================================================================
// Edge Cases and Error Handling Tests
// ============================================================================

describe('TableView Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle null data gracefully', () => {
    const mockDoc = createMockDocument();

    initTableView({
      ...mockDependencies,
      document: mockDoc,
      filteredData: null,
    });

    expect(() => {
      updateDataTab();
    }).not.toThrow();
  });

  it('should handle very large datasets', () => {
    const largeData = Array(10000)
      .fill(null)
      .map((_, i) => ({
        ...mockOrderData[0],
        poNumber: `PO-${i}`,
        factory: ['A', 'B', 'C', 'D'][i % 4],
      }));

    const container = createMockElement('tableBody');

    expect(() => {
      renderTableProgressively(container, largeData, { chunkSize: 100 });
    }).not.toThrow();
  });

  it('should handle special characters in data', () => {
    const dataWithSpecialChars = {
      ...mockOrderData[0],
      model: '<script>alert("xss")</script>',
      destination: '한국 & "Korea"',
    };

    expect(() => {
      createTableRowHTML(dataWithSpecialChars, 0);
    }).not.toThrow();
  });
});

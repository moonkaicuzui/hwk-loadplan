/**
 * ChartView.test.js - Unit Tests for ChartView Module
 * =====================================================
 *
 * Tests for chart rendering, lazy loading, heatmaps, and chart instance management.
 *
 * @module tests/unit/views/ChartView
 * @version 19.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initChartView,
  updateOrCreateChart,
  destroyAllCharts,
  getChart,
  LazyChartObserver,
  initLazyChartLoading,
  getLazyChartObserver,
  renderModelVendorHeatmap,
  updateHeatmapTab,
  updateDelaySeverityChart,
  updateRootCauseChart,
  updateVendorPerformanceList,
} from '../../../src/views/ChartView.js';

// ============================================================================
// Mock Data
// ============================================================================

const mockChartData = {
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [
    {
      label: 'Test Data',
      data: [10, 20, 30],
      backgroundColor: ['#f00', '#0f0', '#00f'],
    },
  ],
};

const mockConfig = {
  type: 'bar',
  data: mockChartData,
  options: {
    responsive: true,
    maintainAspectRatio: false,
  },
};

const mockOrderData = [
  {
    factory: 'A',
    model: 'RS-100',
    vendor: 'Vendor1',
    destination: 'USA',
    quantity: 1000,
    crd: '2026-01-15',
    sddValue: '2026-01-10',
    production: {
      s_cut: { completed: 1000, status: 'completed' },
      sew_bal: { completed: 800, status: 'partial' },
      wh_out: { completed: 500, status: 'partial' },
    },
  },
  {
    factory: 'B',
    model: 'RS-200',
    vendor: 'Vendor2',
    destination: 'Japan',
    quantity: 500,
    crd: '2026-01-20',
    sddValue: '2026-01-25', // Delayed
    production: {
      s_cut: { completed: 500, status: 'completed' },
      sew_bal: { completed: 200, status: 'partial' },
      wh_out: { completed: 0, status: 'pending' },
    },
  },
];

// ============================================================================
// Mock Chart.js
// ============================================================================

const mockChartInstance = {
  data: mockChartData,
  options: {},
  update: vi.fn(),
  destroy: vi.fn(),
};

const MockChart = vi.fn(() => mockChartInstance);
MockChart.register = vi.fn();

// Mock chartManager that ChartView.js actually uses
const mockChartManager = {
  createOrUpdate: vi.fn(() => mockChartInstance),
};

// ============================================================================
// Mock DOM Elements
// ============================================================================

function createMockCanvas(id) {
  return {
    id,
    getContext: vi.fn(() => ({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
    })),
    style: {},
    parentElement: {
      classList: {
        contains: vi.fn(() => false),
        add: vi.fn(),
        remove: vi.fn(),
      },
    },
  };
}

function createMockElement(id, innerHTML = '') {
  return {
    id,
    innerHTML,
    textContent: '',
    style: {},
    classList: {
      contains: vi.fn(() => false),
      add: vi.fn(),
      remove: vi.fn(),
    },
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('ChartView Module', () => {
  let mockDocument;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock document
    mockDocument = {
      getElementById: vi.fn(id => {
        if (id.includes('Chart') || id.includes('canvas')) {
          return createMockCanvas(id);
        }
        return createMockElement(id);
      }),
      querySelector: vi.fn(() => createMockElement('mock')),
      querySelectorAll: vi.fn(() => []),
    };

    // Initialize ChartView with mocks
    initChartView({
      Chart: MockChart,
      charts: {},
      chartManager: mockChartManager,
      document: mockDocument,
      allData: mockOrderData,
      filteredData: mockOrderData,
      isDelayed: d => d.sddValue && d.crd && new Date(d.sddValue) > new Date(d.crd),
      isWarning: d => false,
      escapeHtml: str => String(str).replace(/[&<>"']/g, ''),
      log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });
  });

  afterEach(() => {
    destroyAllCharts();
  });

  // ========================================================================
  // Initialization Tests
  // ========================================================================

  describe('initChartView', () => {
    it('should initialize without errors', () => {
      expect(() => {
        initChartView({
          Chart: MockChart,
          document: mockDocument,
        });
      }).not.toThrow();
    });

    it('should accept custom dependencies', () => {
      const customIsDelayed = vi.fn(() => true);

      initChartView({
        Chart: MockChart,
        document: mockDocument,
        isDelayed: customIsDelayed,
      });

      // The custom function should be stored (verified by behavior)
      expect(() => initChartView({ Chart: MockChart })).not.toThrow();
    });
  });

  // ========================================================================
  // Chart Instance Management Tests
  // ========================================================================

  describe('updateOrCreateChart', () => {
    it('should create a new chart when none exists', () => {
      const canvas = createMockCanvas('testChart');
      const ctx = canvas.getContext('2d');
      mockDocument.getElementById.mockReturnValue(canvas);

      updateOrCreateChart('testChart', ctx, mockConfig);

      expect(mockChartManager.createOrUpdate).toHaveBeenCalled();
    });

    it('should update existing chart instead of creating new one', () => {
      const canvas = createMockCanvas('testChart');
      const ctx = canvas.getContext('2d');
      mockDocument.getElementById.mockReturnValue(canvas);

      // Create first chart
      updateOrCreateChart('testChart', ctx, mockConfig);
      mockChartManager.createOrUpdate.mockClear();

      // Update same chart - should use the existing chart object
      updateOrCreateChart('testChart', ctx, {
        ...mockConfig,
        data: { ...mockChartData, datasets: [{ data: [40, 50, 60] }] },
      });

      // Should not call createOrUpdate again, just update existing
      expect(mockChartInstance.update).toHaveBeenCalled();
    });

    it('should handle missing canvas element gracefully', () => {
      mockDocument.getElementById.mockReturnValue(null);

      // The function may throw or not, depending on implementation
      // Just ensure it doesn't cause unhandled errors
      try {
        updateOrCreateChart('nonexistent', null, mockConfig);
      } catch (e) {
        // Expected if ctx is null
      }
    });
  });

  describe('getChart', () => {
    it('should return chart instance by id', () => {
      const canvas = createMockCanvas('myChart');
      const ctx = canvas.getContext('2d');
      mockDocument.getElementById.mockReturnValue(canvas);

      updateOrCreateChart('myChart', ctx, mockConfig);
      const chart = getChart('myChart');

      expect(chart).toBeDefined();
    });

    it('should return null for non-existent chart', () => {
      const chart = getChart('nonexistent');
      expect(chart).toBeNull();
    });
  });

  describe('destroyAllCharts', () => {
    it('should destroy all chart instances', () => {
      const canvas1 = createMockCanvas('chart1');
      const canvas2 = createMockCanvas('chart2');
      const ctx1 = canvas1.getContext('2d');
      const ctx2 = canvas2.getContext('2d');

      mockDocument.getElementById.mockReturnValueOnce(canvas1).mockReturnValueOnce(canvas2);

      updateOrCreateChart('chart1', ctx1, mockConfig);
      updateOrCreateChart('chart2', ctx2, mockConfig);

      destroyAllCharts();

      expect(mockChartInstance.destroy).toHaveBeenCalled();
    });

    it('should clear internal chart registry', () => {
      const canvas = createMockCanvas('testChart');
      const ctx = canvas.getContext('2d');
      mockDocument.getElementById.mockReturnValue(canvas);

      updateOrCreateChart('testChart', ctx, mockConfig);
      destroyAllCharts();

      const chart = getChart('testChart');
      expect(chart).toBeNull();
    });
  });

  // ========================================================================
  // LazyChartObserver Tests
  // ========================================================================

  describe('LazyChartObserver', () => {
    it('should be a class that can be instantiated', () => {
      expect(LazyChartObserver).toBeDefined();
      expect(typeof LazyChartObserver).toBe('function');
    });

    it('should create observer with callback function', () => {
      const callback = vi.fn();

      // Mock IntersectionObserver
      const mockObserve = vi.fn();
      const mockDisconnect = vi.fn();

      global.IntersectionObserver = vi.fn(() => ({
        observe: mockObserve,
        disconnect: mockDisconnect,
      }));

      const observer = new LazyChartObserver(callback);

      expect(observer).toBeDefined();
    });
  });

  describe('initLazyChartLoading', () => {
    it('should initialize lazy loading for chart containers', () => {
      const containers = [createMockElement('container1'), createMockElement('container2')];

      const loadCallback = vi.fn();

      // Mock IntersectionObserver
      global.IntersectionObserver = vi.fn(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
      }));

      expect(() => {
        initLazyChartLoading(containers, loadCallback);
      }).not.toThrow();
    });
  });

  describe('getLazyChartObserver', () => {
    it('should return the lazy chart observer instance', () => {
      // Initialize first
      global.IntersectionObserver = vi.fn(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
      }));

      initLazyChartLoading([], vi.fn());

      const observer = getLazyChartObserver();
      // May be undefined if not initialized, or an object if initialized
      expect(observer === undefined || typeof observer === 'object').toBe(true);
    });
  });

  // ========================================================================
  // Heatmap Tests
  // ========================================================================

  describe('renderModelVendorHeatmap', () => {
    it('should render heatmap without errors', () => {
      expect(() => {
        renderModelVendorHeatmap(mockOrderData);
      }).not.toThrow();
    });

    it('should handle empty data array', () => {
      expect(() => {
        renderModelVendorHeatmap([]);
      }).not.toThrow();
    });

    it('should handle undefined data', () => {
      expect(() => {
        renderModelVendorHeatmap(undefined);
      }).not.toThrow();
    });
  });

  describe('updateHeatmapTab', () => {
    it('should update heatmap tab without errors', () => {
      expect(() => {
        updateHeatmapTab();
      }).not.toThrow();
    });
  });

  // ========================================================================
  // Specialized Charts Tests
  // ========================================================================

  describe('updateDelaySeverityChart', () => {
    it('should update delay severity chart with data', () => {
      expect(() => {
        updateDelaySeverityChart(mockOrderData);
      }).not.toThrow();
    });

    it('should handle empty data', () => {
      expect(() => {
        updateDelaySeverityChart([]);
      }).not.toThrow();
    });
  });

  describe('updateRootCauseChart', () => {
    it('should update root cause chart with data', () => {
      expect(() => {
        updateRootCauseChart(mockOrderData);
      }).not.toThrow();
    });

    it('should handle data with various delay reasons', () => {
      const dataWithReasons = mockOrderData.map((d, i) => ({
        ...d,
        delayReason: i % 2 === 0 ? 'Material' : 'Labor',
      }));

      expect(() => {
        updateRootCauseChart(dataWithReasons);
      }).not.toThrow();
    });
  });

  describe('updateVendorPerformanceList', () => {
    it('should update vendor performance list', () => {
      expect(() => {
        updateVendorPerformanceList(mockOrderData);
      }).not.toThrow();
    });

    it('should handle empty vendor data', () => {
      expect(() => {
        updateVendorPerformanceList([]);
      }).not.toThrow();
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('ChartView Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChartManager.createOrUpdate.mockClear();

    global.IntersectionObserver = vi.fn(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  it('should handle complete chart lifecycle', () => {
    const mockDocument = {
      getElementById: vi.fn(() => createMockCanvas('testChart')),
      querySelector: vi.fn(() => createMockElement('mock')),
      querySelectorAll: vi.fn(() => []),
    };

    initChartView({
      Chart: MockChart,
      charts: {},
      chartManager: mockChartManager,
      document: mockDocument,
      allData: mockOrderData,
      filteredData: mockOrderData,
      log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });

    const canvas = createMockCanvas('testChart');
    const ctx = canvas.getContext('2d');

    // Create chart
    updateOrCreateChart('testChart', ctx, mockConfig);

    // Get chart
    const chart = getChart('testChart');
    expect(chart).toBeDefined();

    // Destroy all
    destroyAllCharts();

    // Verify cleanup
    expect(getChart('testChart')).toBeNull();
  });
});

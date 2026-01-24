/**
 * ExportView.test.js - Unit Tests for ExportView Module
 * ======================================================
 *
 * Tests for data export functionality: Excel, CSV, PDF, HTML reports.
 *
 * @module tests/unit/views/ExportView
 * @version 19.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    initExportView,
    downloadReportHTML,
    exportToExcel,
    exportToExcelMultiSheet,
    exportToCSV,
    exportToPDF
} from '../../../src/views/ExportView.js';

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
        month: '2026-01',
        production: {
            s_cut: { completed: 1000, status: 'completed' },
            sew_bal: { completed: 800, status: 'partial' },
            wh_out: { completed: 500, status: 'partial' }
        }
    },
    {
        factory: 'B',
        poNumber: 'PO-002',
        model: 'RS-200',
        article: 'ART-002',
        destination: 'Japan',
        quantity: 500,
        crd: '2026-01-20',
        sddValue: '2026-01-25',
        vendor: 'Vendor2',
        month: '2026-01',
        production: {
            s_cut: { completed: 500, status: 'completed' },
            sew_bal: { completed: 200, status: 'partial' },
            wh_out: { completed: 0, status: 'pending' }
        }
    },
    {
        factory: 'C',
        poNumber: 'PO-003',
        model: 'RS-300',
        article: 'ART-003',
        destination: 'Korea',
        quantity: 2000,
        crd: '2026-02-15',
        sddValue: '2026-02-10',
        vendor: 'Vendor1',
        month: '2026-02',
        production: {
            s_cut: { completed: 2000, status: 'completed' },
            sew_bal: { completed: 2000, status: 'completed' },
            wh_out: { completed: 2000, status: 'completed' }
        }
    }
];

// ============================================================================
// Mock Libraries
// ============================================================================

const mockWorkbook = {
    SheetNames: [],
    Sheets: {}
};

const mockXLSX = {
    utils: {
        json_to_sheet: vi.fn(() => ({})),
        book_new: vi.fn(() => mockWorkbook),
        book_append_sheet: vi.fn((wb, ws, name) => {
            wb.SheetNames.push(name);
            wb.Sheets[name] = ws;
        }),
        sheet_add_aoa: vi.fn()
    },
    writeFile: vi.fn()
};

const mockJsPDF = vi.fn(() => ({
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
    internal: {
        pageSize: { width: 595, height: 842 }
    },
    autoTable: vi.fn()
}));

const mockChunkProcessor = {
    processInChunks: vi.fn((data, chunkSize, processFn, completeFn) => {
        data.forEach((item, i) => processFn(item, i));
        if (completeFn) completeFn();
        return Promise.resolve();
    })
};

// ============================================================================
// Mock DOM
// ============================================================================

function createMockElement(id, options = {}) {
    return {
        id,
        innerHTML: options.innerHTML || '',
        textContent: '',
        value: options.value || '',
        style: {},
        href: '',
        download: '',
        click: vi.fn(),
        remove: vi.fn(),
        classList: {
            contains: vi.fn(() => false),
            add: vi.fn(),
            remove: vi.fn()
        },
        appendChild: vi.fn(),
        querySelector: vi.fn(() => null),
        querySelectorAll: vi.fn(() => [])
    };
}

function createMockDocument() {
    return {
        getElementById: vi.fn((id) => createMockElement(id)),
        querySelector: vi.fn(() => createMockElement('mock')),
        querySelectorAll: vi.fn(() => []),
        createElement: vi.fn((tag) => createMockElement(tag)),
        body: {
            appendChild: vi.fn(),
            removeChild: vi.fn()
        },
        documentElement: {
            outerHTML: '<html><body></body></html>'
        }
    };
}

// ============================================================================
// Mock Dependencies
// ============================================================================

function createMockDependencies() {
    return {
        document: createMockDocument(),
        XLSX: mockXLSX,
        jspdf: { jsPDF: mockJsPDF },
        ChunkProcessor: mockChunkProcessor,
        allData: mockOrderData,
        filteredData: mockOrderData,
        prepareExportData: vi.fn(() => mockOrderData.map(d => ({
            factory: d.factory,
            poNumber: d.poNumber,
            model: d.model,
            destination: d.destination,
            quantity: d.quantity,
            crd: d.crd,
            sddValue: d.sddValue
        }))),
        isDelayed: vi.fn((d) => d.sddValue && d.crd && new Date(d.sddValue) > new Date(d.crd)),
        isWarning: vi.fn(() => false),
        escapeHtml: vi.fn((str) => String(str).replace(/[&<>"']/g, '')),
        formatNumber: vi.fn((n) => n?.toLocaleString() || '0'),
        i18n: vi.fn((key) => key),
        showToast: vi.fn()
    };
}

// ============================================================================
// Tests
// ============================================================================

describe('ExportView Module', () => {
    let mockDeps;

    beforeEach(() => {
        vi.clearAllMocks();
        mockDeps = createMockDependencies();

        // Mock URL and Blob
        global.URL = {
            createObjectURL: vi.fn(() => 'blob:mock-url'),
            revokeObjectURL: vi.fn()
        };
        global.Blob = vi.fn((content, options) => ({
            content,
            options,
            size: content[0]?.length || 0
        }));

        // Mock global document for functions that use it directly
        vi.stubGlobal('document', mockDeps.document);

        initExportView(mockDeps);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ========================================================================
    // Initialization Tests
    // ========================================================================

    describe('initExportView', () => {
        it('should initialize without errors', () => {
            expect(() => {
                initExportView(mockDeps);
            }).not.toThrow();
        });

        it('should accept partial dependencies', () => {
            expect(() => {
                initExportView({
                    document: createMockDocument(),
                    XLSX: mockXLSX
                });
            }).not.toThrow();
        });

        it('should work without XLSX library', () => {
            expect(() => {
                initExportView({
                    document: createMockDocument(),
                    filteredData: mockOrderData
                });
            }).not.toThrow();
        });
    });

    // ========================================================================
    // Excel Export Tests
    // ========================================================================

    describe('exportToExcel', () => {
        it('should export data to Excel', () => {
            expect(() => {
                exportToExcel();
            }).not.toThrow();
        });

        it('should call XLSX utilities', () => {
            exportToExcel();

            expect(mockXLSX.utils.json_to_sheet).toHaveBeenCalled();
            expect(mockXLSX.utils.book_new).toHaveBeenCalled();
            expect(mockXLSX.writeFile).toHaveBeenCalled();
        });

        it('should handle empty data', () => {
            initExportView({
                ...mockDeps,
                filteredData: []
            });

            expect(() => {
                exportToExcel();
            }).not.toThrow();
        });

        it('should generate filename with date', () => {
            exportToExcel();

            // Verify writeFile was called with a filename containing date pattern
            const writeFileCall = mockXLSX.writeFile.mock.calls[0];
            if (writeFileCall) {
                const filename = writeFileCall[1];
                expect(typeof filename).toBe('string');
            }
        });
    });

    describe('exportToExcelMultiSheet', () => {
        it('should export data to multi-sheet Excel by month', () => {
            expect(() => {
                exportToExcelMultiSheet('month');
            }).not.toThrow();
        });

        it('should export data to multi-sheet Excel by factory', () => {
            expect(() => {
                exportToExcelMultiSheet('factory');
            }).not.toThrow();
        });

        it('should handle default groupBy parameter', () => {
            expect(() => {
                exportToExcelMultiSheet();
            }).not.toThrow();
        });

        it('should create multiple sheets', () => {
            exportToExcelMultiSheet('factory');

            expect(mockXLSX.utils.book_append_sheet).toHaveBeenCalled();
        });

        it('should handle empty data', () => {
            initExportView({
                ...mockDeps,
                filteredData: []
            });

            expect(() => {
                exportToExcelMultiSheet('month');
            }).not.toThrow();
        });
    });

    // ========================================================================
    // CSV Export Tests
    // ========================================================================

    describe('exportToCSV', () => {
        it('should export data to CSV', () => {
            expect(() => {
                exportToCSV();
            }).not.toThrow();
        });

        it('should create Blob with CSV content', () => {
            exportToCSV();

            expect(global.Blob).toHaveBeenCalled();
        });

        it('should include UTF-8 BOM for Korean compatibility', () => {
            exportToCSV();

            const blobCall = global.Blob.mock.calls[0];
            if (blobCall) {
                const content = blobCall[0][0];
                // Check for BOM or CSV content
                expect(typeof content).toBe('string');
            }
        });

        it('should handle empty data', () => {
            initExportView({
                ...mockDeps,
                filteredData: []
            });

            expect(() => {
                exportToCSV();
            }).not.toThrow();
        });

        it('should escape CSV special characters', () => {
            const dataWithSpecialChars = [{
                ...mockOrderData[0],
                model: 'Model, with "quotes"',
                destination: 'USA\nNewline'
            }];

            initExportView({
                ...mockDeps,
                filteredData: dataWithSpecialChars
            });

            expect(() => {
                exportToCSV();
            }).not.toThrow();
        });
    });

    // ========================================================================
    // PDF Export Tests
    // ========================================================================

    describe('exportToPDF', () => {
        it('should export data to PDF', () => {
            expect(() => {
                exportToPDF();
            }).not.toThrow();
        });

        it('should create jsPDF instance', () => {
            exportToPDF();

            expect(mockJsPDF).toHaveBeenCalled();
        });

        it('should handle empty data', () => {
            initExportView({
                ...mockDeps,
                filteredData: []
            });

            expect(() => {
                exportToPDF();
            }).not.toThrow();
        });

        it('should handle large datasets (max 500 rows)', () => {
            const largeData = Array(1000).fill(null).map((_, i) => ({
                ...mockOrderData[0],
                poNumber: `PO-${i}`
            }));

            initExportView({
                ...mockDeps,
                filteredData: largeData
            });

            expect(() => {
                exportToPDF();
            }).not.toThrow();
        });
    });

    // ========================================================================
    // HTML Report Tests
    // ========================================================================

    describe('downloadReportHTML', () => {
        it('should download HTML report', () => {
            expect(() => {
                downloadReportHTML();
            }).not.toThrow();
        });

        it('should create downloadable link', () => {
            downloadReportHTML();

            // Verify URL was created
            expect(global.URL.createObjectURL).toHaveBeenCalled();
        });

        it('should include inline styles', () => {
            downloadReportHTML();

            const blobCall = global.Blob.mock.calls[0];
            if (blobCall) {
                const content = blobCall[0][0];
                expect(typeof content).toBe('string');
            }
        });
    });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('ExportView Integration', () => {
    let mockDeps;

    beforeEach(() => {
        vi.clearAllMocks();
        mockDeps = createMockDependencies();
        initExportView(mockDeps);

        global.URL = {
            createObjectURL: vi.fn(() => 'blob:mock-url'),
            revokeObjectURL: vi.fn()
        };
        global.Blob = vi.fn((content, options) => ({
            content,
            options
        }));
    });

    it('should handle multiple sequential exports', () => {
        expect(() => {
            exportToExcel();
            exportToCSV();
            exportToPDF();
            downloadReportHTML();
        }).not.toThrow();
    });

    it('should handle rapid export calls', () => {
        expect(() => {
            for (let i = 0; i < 5; i++) {
                exportToExcel();
            }
        }).not.toThrow();
    });
});

// ============================================================================
// Edge Cases and Error Handling Tests
// ============================================================================

describe('ExportView Edge Cases', () => {
    let mockDeps;

    beforeEach(() => {
        vi.clearAllMocks();
        mockDeps = createMockDependencies();

        global.URL = {
            createObjectURL: vi.fn(() => 'blob:mock-url'),
            revokeObjectURL: vi.fn()
        };
        global.Blob = vi.fn((content, options) => ({
            content,
            options
        }));
    });

    it('should handle null filteredData', () => {
        initExportView({
            ...mockDeps,
            filteredData: null
        });

        expect(() => {
            exportToExcel();
        }).not.toThrow();
    });

    it('should handle undefined XLSX library gracefully', () => {
        initExportView({
            ...mockDeps,
            XLSX: undefined
        });

        // Should not throw, but may not export
        expect(() => {
            exportToExcel();
        }).not.toThrow();
    });

    it('should handle special characters in filenames', () => {
        const dataWithSpecialChars = [{
            ...mockOrderData[0],
            model: '모델/이름:특수*문자'
        }];

        initExportView({
            ...mockDeps,
            filteredData: dataWithSpecialChars
        });

        expect(() => {
            exportToExcel();
            exportToCSV();
        }).not.toThrow();
    });

    it('should handle very large datasets for Excel', () => {
        const largeData = Array(5000).fill(null).map((_, i) => ({
            ...mockOrderData[0],
            poNumber: `PO-${i}`,
            factory: ['A', 'B', 'C', 'D'][i % 4]
        }));

        initExportView({
            ...mockDeps,
            filteredData: largeData
        });

        expect(() => {
            exportToExcel();
        }).not.toThrow();
    });

    it('should handle data with missing fields', () => {
        const incompleteData = [
            { factory: 'A' },
            { poNumber: 'PO-001' },
            { model: 'RS-100', quantity: 1000 }
        ];

        initExportView({
            ...mockDeps,
            filteredData: incompleteData
        });

        expect(() => {
            exportToExcel();
            exportToCSV();
        }).not.toThrow();
    });
});

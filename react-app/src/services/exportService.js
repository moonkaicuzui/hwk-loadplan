/**
 * @fileoverview Export Service
 * Handles exporting order data to Excel and CSV formats.
 *
 * Features:
 * - Excel (xlsx) export with Korean column headers
 * - CSV export with UTF-8 BOM for Excel compatibility
 * - Customizable column selection
 * - Proper date and number formatting
 *
 * @module services/exportService
 */

import * as XLSX from 'xlsx';
import { formatDate } from '../utils/formatters';
import { getOrderStatus, getProductionData } from '../utils/orderUtils';

// ========================================
// Column Configuration
// ========================================

/**
 * Column definitions for export
 * Maps internal field names to Korean headers
 */
const EXPORT_COLUMNS = {
  poNumber: {
    header: 'PO#',
    headerKo: 'PO번호',
    width: 25,
    getValue: (order) => order.poNumber || ''
  },
  article: {
    header: 'Style',
    headerKo: '스타일',
    width: 20,
    getValue: (order) => order.article || order.style || ''
  },
  model: {
    header: 'Model',
    headerKo: '모델',
    width: 15,
    getValue: (order) => order.model || ''
  },
  color: {
    header: 'Color',
    headerKo: '색상',
    width: 15,
    getValue: (order) => order.color || ''
  },
  destination: {
    header: 'Destination',
    headerKo: '행선지',
    width: 15,
    getValue: (order) => order.destination || ''
  },
  quantity: {
    header: 'Quantity',
    headerKo: '수량',
    width: 12,
    type: 'number',
    getValue: (order) => order.quantity || order.ttl_qty || 0
  },
  crd: {
    header: 'CRD',
    headerKo: 'CRD (고객요청일)',
    width: 15,
    type: 'date',
    getValue: (order) => formatDate(order.crd) || ''
  },
  sdd: {
    header: 'SDD',
    headerKo: 'SDD (출고예정일)',
    width: 15,
    type: 'date',
    getValue: (order) => formatDate(order.sddValue) || ''
  },
  factory: {
    header: 'Factory',
    headerKo: '공장',
    width: 10,
    getValue: (order) => order.factory || ''
  },
  vendor: {
    header: 'Vendor',
    headerKo: '협력사',
    width: 15,
    getValue: (order) => order.vendor || ''
  },
  buyer: {
    header: 'Buyer',
    headerKo: '바이어',
    width: 12,
    getValue: (order) => order.buyer || ''
  },
  status: {
    header: 'Status',
    headerKo: '상태',
    width: 12,
    getValue: (order) => getOrderStatus(order)
  },
  // Production stages
  s_cut: {
    header: 'S_CUT',
    headerKo: '재단',
    width: 10,
    type: 'number',
    getValue: (order) => getProductionData(order, 's_cut', 'completed', 0)
  },
  pre_sew: {
    header: 'PRE_SEW',
    headerKo: '선봉',
    width: 10,
    type: 'number',
    getValue: (order) => getProductionData(order, 'pre_sew', 'completed', 0)
  },
  sew_input: {
    header: 'SEW_INPUT',
    headerKo: '재봉투입',
    width: 12,
    type: 'number',
    getValue: (order) => getProductionData(order, 'sew_input', 'completed', 0)
  },
  sew_bal: {
    header: 'SEW_BAL',
    headerKo: '재봉',
    width: 10,
    type: 'number',
    getValue: (order) => getProductionData(order, 'sew_bal', 'completed', 0)
  },
  s_fit: {
    header: 'S_FIT',
    headerKo: '핏팅',
    width: 10,
    type: 'number',
    getValue: (order) => getProductionData(order, 's_fit', 'completed', 0)
  },
  ass_bal: {
    header: 'ASS_BAL',
    headerKo: '조립',
    width: 10,
    type: 'number',
    getValue: (order) => getProductionData(order, 'ass_bal', 'completed', 0)
  },
  wh_in: {
    header: 'WH_IN',
    headerKo: '입고',
    width: 10,
    type: 'number',
    getValue: (order) => getProductionData(order, 'wh_in', 'completed', 0)
  },
  wh_out: {
    header: 'WH_OUT',
    headerKo: '출고',
    width: 10,
    type: 'number',
    getValue: (order) => getProductionData(order, 'wh_out', 'completed', 0)
  }
};

/**
 * Default columns for export
 */
const DEFAULT_COLUMNS = [
  'poNumber', 'article', 'destination', 'quantity', 'crd', 'sdd',
  'factory', 'status', 'wh_in', 'wh_out'
];

/**
 * Full columns including production stages
 */
const FULL_COLUMNS = [
  'poNumber', 'article', 'model', 'color', 'destination', 'quantity',
  'crd', 'sdd', 'factory', 'vendor', 'buyer', 'status',
  's_cut', 'pre_sew', 'sew_input', 'sew_bal', 's_fit', 'ass_bal', 'wh_in', 'wh_out'
];

// ========================================
// Export Functions
// ========================================

/**
 * Export orders to Excel (.xlsx) format
 * @param {Array} data - Array of order objects
 * @param {string} filename - Output filename (without extension)
 * @param {Object} options - Export options
 * @param {Array<string>} options.columns - Column keys to include
 * @param {boolean} options.useKoreanHeaders - Use Korean headers (default: true)
 * @param {string} options.sheetName - Excel sheet name (default: 'Orders')
 * @param {boolean} options.includeProductionStages - Include all production stages (default: false)
 */
export function exportToExcel(data, filename, options = {}) {
  if (!data || data.length === 0) {
    console.warn('[ExportService] No data to export');
    return;
  }

  const {
    columns = options.includeProductionStages ? FULL_COLUMNS : DEFAULT_COLUMNS,
    useKoreanHeaders = true,
    sheetName = 'Orders'
  } = options;

  try {
    // Build header row
    const headers = columns.map(colKey => {
      const col = EXPORT_COLUMNS[colKey];
      if (!col) return colKey;
      return useKoreanHeaders ? col.headerKo : col.header;
    });

    // Build data rows
    const rows = data.map(order => {
      return columns.map(colKey => {
        const col = EXPORT_COLUMNS[colKey];
        if (!col) return '';
        return col.getValue(order);
      });
    });

    // Create worksheet data
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = columns.map(colKey => {
      const col = EXPORT_COLUMNS[colKey];
      return { wch: col ? col.width : 15 };
    });

    // Style header row (bold) - Note: xlsx-js-style required for full styling
    // Basic styling with cell format
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[cellAddress]) {
        ws[cellAddress].s = { font: { bold: true } };
      }
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate filename with date
    const dateStr = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${dateStr}.xlsx`;

    // Download file
    XLSX.writeFile(wb, fullFilename);

    console.log(`[ExportService] Exported ${data.length} orders to ${fullFilename}`);
    return fullFilename;

  } catch (error) {
    console.error('[ExportService] Excel export error:', error);
    throw error;
  }
}

/**
 * Export orders to CSV format
 * @param {Array} data - Array of order objects
 * @param {string} filename - Output filename (without extension)
 * @param {Object} options - Export options
 * @param {Array<string>} options.columns - Column keys to include
 * @param {boolean} options.useKoreanHeaders - Use Korean headers (default: true)
 * @param {boolean} options.includeProductionStages - Include all production stages (default: false)
 */
export function exportToCSV(data, filename, options = {}) {
  if (!data || data.length === 0) {
    console.warn('[ExportService] No data to export');
    return;
  }

  const {
    columns = options.includeProductionStages ? FULL_COLUMNS : DEFAULT_COLUMNS,
    useKoreanHeaders = true
  } = options;

  try {
    // Build header row
    const headers = columns.map(colKey => {
      const col = EXPORT_COLUMNS[colKey];
      if (!col) return colKey;
      return useKoreanHeaders ? col.headerKo : col.header;
    });

    // Build data rows
    const rows = data.map(order => {
      return columns.map(colKey => {
        const col = EXPORT_COLUMNS[colKey];
        if (!col) return '';
        const value = col.getValue(order);
        // Escape quotes and wrap in quotes if contains comma or quotes
        const strValue = String(value);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      });
    });

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob with BOM for Excel compatibility
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Generate filename with date
    const dateStr = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${dateStr}.csv`;

    // Download file
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fullFilename;
    link.click();
    URL.revokeObjectURL(link.href);

    console.log(`[ExportService] Exported ${data.length} orders to ${fullFilename}`);
    return fullFilename;

  } catch (error) {
    console.error('[ExportService] CSV export error:', error);
    throw error;
  }
}

/**
 * Export orders to Excel with multiple sheets
 * @param {Object} sheetsData - Object with sheet names as keys and data arrays as values
 * @param {string} filename - Output filename (without extension)
 * @param {Object} options - Export options
 */
export function exportToExcelMultiSheet(sheetsData, filename, options = {}) {
  if (!sheetsData || Object.keys(sheetsData).length === 0) {
    console.warn('[ExportService] No data to export');
    return;
  }

  const {
    columns = DEFAULT_COLUMNS,
    useKoreanHeaders = true
  } = options;

  try {
    const wb = XLSX.utils.book_new();

    Object.entries(sheetsData).forEach(([sheetName, data]) => {
      if (!data || data.length === 0) return;

      // Build header row
      const headers = columns.map(colKey => {
        const col = EXPORT_COLUMNS[colKey];
        if (!col) return colKey;
        return useKoreanHeaders ? col.headerKo : col.header;
      });

      // Build data rows
      const rows = data.map(order => {
        return columns.map(colKey => {
          const col = EXPORT_COLUMNS[colKey];
          if (!col) return '';
          return col.getValue(order);
        });
      });

      // Create worksheet
      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      ws['!cols'] = columns.map(colKey => {
        const col = EXPORT_COLUMNS[colKey];
        return { wch: col ? col.width : 15 };
      });

      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Excel limit: 31 chars
    });

    // Generate filename with date
    const dateStr = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${dateStr}.xlsx`;

    // Download file
    XLSX.writeFile(wb, fullFilename);

    console.log(`[ExportService] Exported multi-sheet workbook to ${fullFilename}`);
    return fullFilename;

  } catch (error) {
    console.error('[ExportService] Multi-sheet Excel export error:', error);
    throw error;
  }
}

/**
 * Get available export column configurations
 * @returns {Object} Column configurations
 */
export function getExportColumnConfigs() {
  return {
    default: DEFAULT_COLUMNS,
    full: FULL_COLUMNS,
    columns: EXPORT_COLUMNS
  };
}

// ========================================
// Default Export
// ========================================

export default {
  exportToExcel,
  exportToCSV,
  exportToExcelMultiSheet,
  getExportColumnConfigs
};

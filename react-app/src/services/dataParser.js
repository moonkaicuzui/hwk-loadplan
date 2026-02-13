/**
 * @fileoverview Data Parser Service
 * Parses Excel and CSV files for production data.
 *
 * Features:
 * - Excel (xlsx, xls) parsing with XLSX library
 * - CSV parsing
 * - Data validation and transformation
 * - Factory-specific data extraction
 *
 * @module services/dataParser
 */

import * as XLSX from 'xlsx';
import { PROCESS_STAGES } from '../constants/processes';
import { parseDate, getYearMonth } from '../utils/dateUtils';
import { isDelayed, isWarning, isShipped } from '../utils/orderUtils';

// ========================================
// Column Mapping Configuration
// ========================================

/**
 * Column name mappings for different data sources
 * Maps source column names to internal field names
 *
 * VERIFIED against actual Google Drive Excel files (2026-02-06)
 * See: docs/COLUMN_MAPPING_VERIFICATION.md for detailed analysis
 *
 * Key columns actually used in Excel files:
 * - Sales Order and Item (PO)
 * - Art (Style)
 * - Model, Color, CRD, SDD, Q.ty, Dest
 * - Unit (Factory), Co-op (Vendor), GD (Buyer)
 * - Code 04 (approval status)
 */
const COLUMN_MAPPINGS = {
  // Order identifiers - VERIFIED
  'Sales Order and Item': 'poNumber',  // PRIMARY: All factories use this
  'PO#': 'poNumber',                   // Legacy fallback
  'PO': 'poNumber',                    // Legacy fallback
  'Art': 'style',                      // PRIMARY: All factories use this
  'Style': 'style',                    // Legacy fallback
  'Color': 'color',                    // VERIFIED: All factories

  // Dates - VERIFIED
  'CRD': 'crd',                        // VERIFIED: All factories
  'SDD': 'sddValue',                   // VERIFIED: All factories (Original sub-column)
  'CNF.SDD': 'confirmedSdd',           // Factory C, D only (confirmed SDD)

  // Quantities - VERIFIED
  'Q.ty': 'quantity',                  // PRIMARY: All factories use this
  'Qty': 'quantity',                   // Legacy fallback
  'MRP.Qty': 'mrpQuantity',            // VERIFIED: All factories

  // Factory & Location - VERIFIED
  'Unit': 'factory',                   // PRIMARY: All factories use this
  'Dest': 'destination',               // PRIMARY: All factories use this

  // Vendor & Buyer - VERIFIED
  'Co-op': 'vendor',                   // PRIMARY: All factories use this
  'GD': 'buyer',                       // PRIMARY: All factories use this

  // Status - VERIFIED
  'Code 04': 'code04',                 // PRIMARY: All factories (with space)
  'Code04': 'code04',                  // Legacy fallback (no space)

  // Model - VERIFIED
  'Model': 'model',                    // PRIMARY: All factories
  'Model ': 'model',                   // Variant with trailing space

  // Season - VERIFIED
  'Season SPEC': 'season',             // Factory A, B
  'Season.SPEC': 'season',             // Factory C, D (with period)
  'Event': 'event',                    // VERIFIED: All factories

  // Additional columns - VERIFIED
  'Fac code': 'facCode',               // Factory A, C only
  'PD': 'pd',                          // Factory C, D only
  'Intertek': 'intertek',              // VERIFIED: All factories
  'Dummy': 'dummy',                    // VERIFIED: All factories

  // Process stages - DETECTED DYNAMICALLY from sub-header row
  // These are mapped via _detectDynamicColumns() from __EMPTY_* columns
  // Do not rely on these static mappings for production stage data
  'S_CUT': 'S_CUT',
  'PRE_SEW': 'PRE_SEW',
  'SEW_INPUT': 'SEW_INPUT',
  'SEW_BAL': 'SEW_BAL',
  'S_FIT': 'S_FIT',
  'ASS_BAL': 'ASS_BAL',
  'WH_IN': 'WH_IN',
  'WH_OUT': 'WH_OUT',
  'PRODUCTION STATUS': 'SEW_BAL'       // Header for SEW_BAL column
};

// ========================================
// Parser Class
// ========================================

class DataParser {
  constructor() {
    this.validationErrors = [];
    this.warnings = [];
  }

  /**
   * Parse file content based on type
   * @param {ArrayBuffer|string} content - File content
   * @param {string} fileName - File name for type detection
   * @param {Object} options - Parser options
   * @returns {Object} Parsed data
   */
  parse(content, fileName, options = {}) {
    this.validationErrors = [];
    this.warnings = [];

    const extension = fileName.toLowerCase().split('.').pop();

    // Extract factory code from filename (e.g., "factory_a.xlsx" → "A")
    this._filenameFactory = this._extractFactoryFromFilename(fileName);
    if (this._filenameFactory) {
      console.log('[DataParser] Factory from filename:', this._filenameFactory);
    }

    let rawData;
    if (extension === 'csv') {
      rawData = this._parseCSV(content, options);
    } else if (['xlsx', 'xls'].includes(extension)) {
      rawData = this._parseExcel(content, options);
    } else {
      throw new Error(`Unsupported file format: ${extension}`);
    }

    // Transform to internal format
    const orders = this._transformData(rawData, options);

    // Calculate statistics
    const statistics = this._calculateStatistics(orders);

    // Group data for charts
    const dailyData = this._groupByDate(orders);
    const modelData = this._groupByModel(orders);
    const processData = this._calculateProcessData(orders);

    return {
      orders,
      statistics,
      dailyData,
      modelData,
      processData,
      metadata: {
        fileName,
        rowCount: rawData.length,
        validOrderCount: orders.length,
        parseDate: new Date().toISOString(),
        validationErrors: this.validationErrors,
        warnings: this.warnings
      }
    };
  }

  /**
   * Parse Excel file
   * @private
   */
  _parseExcel(content, options = {}) {
    try {
      const workbook = XLSX.read(content, {
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false
      });

      // Get first sheet or specified sheet
      const sheetName = options.sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }

      // Find the header row by looking for known column names
      const headerRowIndex = this._findHeaderRow(worksheet);
      console.log('[DataParser] Found header at row:', headerRowIndex);

      // Convert to JSON starting from header row
      const data = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        dateNF: 'yyyy-mm-dd',
        defval: '',
        range: headerRowIndex // Start from header row
      });

      console.log('[DataParser] Parsed Excel:', data.length, 'rows from sheet', sheetName);
      if (data.length > 0) {
        console.log('[DataParser] Excel columns:', Object.keys(data[0]));
        console.log('[DataParser] First row sample:', JSON.stringify(data[0]).substring(0, 200));
      }

      // Detect warehouse column mappings from sub-header row
      this._dynamicColumnMap = this._detectDynamicColumns(data);
      console.log('[DataParser] Dynamic column map:', this._dynamicColumnMap);

      return data;

    } catch (error) {
      console.error('[DataParser] Excel parsing error:', error);
      throw error;
    }
  }

  /**
   * Detect dynamic columns (like __EMPTY_*) from sub-header row
   * Maps all 8 production stages: S_CUT, PRE_SEW, SEW_INPUT, SEW_BAL, S_FIT, ASS_BAL, WH_IN, WH_OUT
   * @private
   */
  _detectDynamicColumns(data) {
    const columnMap = {};
    if (!data || data.length === 0) return columnMap;

    // First row after header often contains sub-headers
    const subHeaderRow = data[0];

    // Find columns that contain production stage labels
    Object.entries(subHeaderRow).forEach(([colName, value]) => {
      if (!value) return;
      const val = String(value).toLowerCase().trim().replace(/\r\n/g, ' ').replace(/\s+/g, ' ');

      // S_CUT (재단) - "S.Cut Bal", "S Cut Bal"
      if ((val.includes('s.cut') || val.includes('s cut')) && val.includes('bal')) {
        columnMap.sCutColumn = colName;
        console.log('[DataParser] Found S_CUT column:', colName);
      }
      // PRE_SEW (선봉) - "Pre-Sew Bal", "Pre Sew Bal"
      if ((val.includes('pre-sew') || val.includes('pre sew')) && val.includes('bal')) {
        columnMap.preSewColumn = colName;
        console.log('[DataParser] Found PRE_SEW column:', colName);
      }
      // SEW_INPUT (재봉투입) - "Sew input Bal"
      if (val.includes('sew') && val.includes('input') && val.includes('bal')) {
        columnMap.sewInputColumn = colName;
        console.log('[DataParser] Found SEW_INPUT column:', colName);
      }
      // SEW_BAL (재봉) - "Sew Bal" (but NOT "Sew input Bal")
      if (val.includes('sew') && val.includes('bal') && !val.includes('input') && !val.includes('pre')) {
        columnMap.sewBalColumn = colName;
        console.log('[DataParser] Found SEW_BAL column:', colName);
      }
      // S_FIT (핏팅) - "S/Fit Bal", "S Fit Bal"
      if ((val.includes('s/fit') || val.includes('s fit') || val.includes('fit bal')) && !val.includes('ass')) {
        columnMap.sFitColumn = colName;
        console.log('[DataParser] Found S_FIT column:', colName);
      }
      // ASS_BAL (조립) - "Ass Bal", "Ass.Bal"
      if (val.includes('ass') && val.includes('bal') && !val.includes('stk')) {
        columnMap.assBalColumn = colName;
        console.log('[DataParser] Found ASS_BAL column:', colName);
      }
      // WH_IN (입고) - "W.H IN BAL"
      if (val.includes('w.h') && val.includes('in') && val.includes('bal') && !val.includes('out')) {
        columnMap.whInColumn = colName;
        console.log('[DataParser] Found WH_IN column:', colName);
      }
      // WH_OUT (출고) - "W.H OUT BAL"
      if (val.includes('w.h') && val.includes('out') && val.includes('bal')) {
        columnMap.whOutColumn = colName;
        console.log('[DataParser] Found WH_OUT column:', colName);
      }
    });

    return columnMap;
  }

  /**
   * Find the header row by looking for known column names
   * @private
   */
  _findHeaderRow(worksheet) {
    const knownHeaders = ['PO#', 'PO', 'Style', 'Qty', 'CRD', 'SDD', 'Factory', 'Destination', 'Color', 'Vendor'];
    const range = XLSX.utils.decode_range(worksheet['!ref']);

    // Search first 20 rows for header
    for (let row = range.s.r; row <= Math.min(range.e.r, 20); row++) {
      let matchCount = 0;
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        if (cell && cell.v) {
          const value = String(cell.v).trim();
          if (knownHeaders.some(h => value.toUpperCase().includes(h.toUpperCase()))) {
            matchCount++;
          }
        }
      }
      // If we found at least 3 matching headers, this is likely the header row
      if (matchCount >= 3) {
        console.log('[DataParser] Header row found with', matchCount, 'matches');
        return row;
      }
    }

    // Default to row 0 if not found
    console.log('[DataParser] No header row found, using row 0');
    return 0;
  }

  /**
   * Parse CSV file
   * @private
   */
  _parseCSV(content, options = {}) {
    try {
      // Convert ArrayBuffer to string if needed
      let csvString = content;
      if (content instanceof ArrayBuffer) {
        const decoder = new TextDecoder(options.encoding || 'utf-8');
        csvString = decoder.decode(content);
      }

      // Use XLSX to parse CSV for consistency
      const workbook = XLSX.read(csvString, {
        type: 'string',
        cellDates: true
      });

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: ''
      });

      console.log('[DataParser] Parsed CSV:', data.length, 'rows');
      return data;

    } catch (error) {
      console.error('[DataParser] CSV parsing error:', error);
      throw error;
    }
  }

  /**
   * Transform raw data to internal order format
   * @private
   */
  _transformData(rawData, options = {}) {
    const orders = [];

    rawData.forEach((row, index) => {
      try {
        const order = this._transformRow(row, index);
        if (order && this._validateOrder(order, index)) {
          orders.push(order);
        }
      } catch (error) {
        this.validationErrors.push({
          row: index + 2, // Excel row (1-indexed + header)
          error: error.message
        });
      }
    });

    // Apply factory filter if specified
    if (options.factory && options.factory !== 'ALL') {
      return orders.filter(o => o.factory === options.factory);
    }

    return orders;
  }

  /**
   * Transform a single row to order object
   * @private
   */
  _transformRow(row, index) {
    const order = {
      id: `order_${index}_${Date.now()}`,
      rowIndex: index
    };

    // Map columns
    Object.entries(row).forEach(([key, value]) => {
      const mappedKey = COLUMN_MAPPINGS[key] || this._normalizeColumnName(key);
      if (mappedKey) {
        order[mappedKey] = this._parseValue(mappedKey, value);
      }
    });

    // Ensure required fields
    if (!order.poNumber && row['PO#']) {
      order.poNumber = row['PO#'];
    }

    // Parse dates (validate first)
    if (order.crd && this._isValidDateString(order.crd)) {
      order.crdDate = parseDate(order.crd);
    }
    if (order.sddValue && this._isValidDateString(order.sddValue)) {
      order.sddDate = parseDate(order.sddValue);
    }

    // Extract all 8 production stage data from dynamic columns
    if (this._dynamicColumnMap) {
      // S_CUT (재단)
      if (this._dynamicColumnMap.sCutColumn) {
        order.S_CUT = this._parseProductionValue(row[this._dynamicColumnMap.sCutColumn]);
      }
      // PRE_SEW (선봉)
      if (this._dynamicColumnMap.preSewColumn) {
        order.PRE_SEW = this._parseProductionValue(row[this._dynamicColumnMap.preSewColumn]);
      }
      // SEW_INPUT (재봉투입)
      if (this._dynamicColumnMap.sewInputColumn) {
        order.SEW_INPUT = this._parseProductionValue(row[this._dynamicColumnMap.sewInputColumn]);
      }
      // SEW_BAL (재봉)
      if (this._dynamicColumnMap.sewBalColumn) {
        order.SEW_BAL = this._parseProductionValue(row[this._dynamicColumnMap.sewBalColumn]);
      }
      // S_FIT (핏팅)
      if (this._dynamicColumnMap.sFitColumn) {
        order.S_FIT = this._parseProductionValue(row[this._dynamicColumnMap.sFitColumn]);
      }
      // ASS_BAL (조립)
      if (this._dynamicColumnMap.assBalColumn) {
        order.ASS_BAL = this._parseProductionValue(row[this._dynamicColumnMap.assBalColumn]);
      }
      // WH_IN (입고)
      if (this._dynamicColumnMap.whInColumn) {
        order.WH_IN = this._parseProductionValue(row[this._dynamicColumnMap.whInColumn]);
      }
      // WH_OUT (출고)
      if (this._dynamicColumnMap.whOutColumn) {
        order.WH_OUT = this._parseProductionValue(row[this._dynamicColumnMap.whOutColumn]);
      }
    }

    // Field aliases for backward compatibility
    // Parser maps 'Art' → 'style', but many components use 'article'
    if (order.style && !order.article) {
      order.article = order.style;
    }

    // Calculate derived fields
    order.status = this._determineStatus(order);
    order.yearMonth = getYearMonth(order.sddDate || order.crdDate);

    // Factory normalization - prefer filename factory over Unit field
    if (this._filenameFactory) {
      // Use factory from filename (most reliable)
      order.factory = this._filenameFactory;
    } else if (order.factory) {
      // Fallback to parsing from Unit/Factory field
      order.factory = this._normalizeFactory(order.factory);
    }

    return order;
  }

  /**
   * Extract factory code from filename
   * Handles patterns like "factory_a.xlsx", "Factory-B.xlsx", "FACTORY_C_data.xlsx"
   * @private
   */
  _extractFactoryFromFilename(fileName) {
    if (!fileName) return null;
    const name = fileName.toLowerCase();

    // Pattern: factory_a, factory-b, factory_c, factory_d
    const factoryMatch = name.match(/factory[_\-\s]?([abcd])/i);
    if (factoryMatch) {
      return factoryMatch[1].toUpperCase();
    }

    // Pattern: rachgia_a, rachgia-b
    const rachgiaMatch = name.match(/rachgia[_\-\s]?([abcd])/i);
    if (rachgiaMatch) {
      return rachgiaMatch[1].toUpperCase();
    }

    // Pattern: just _a_ or _b_ in filename
    const simpleMatch = name.match(/[_\-]([abcd])[_\-\.]/i);
    if (simpleMatch) {
      return simpleMatch[1].toUpperCase();
    }

    return null;
  }

  /**
   * Validate date string before parsing
   * Filters out invalid values like "1/0", "0", Excel errors
   * @private
   */
  _isValidDateString(value) {
    if (!value) return false;
    const str = String(value).trim();

    // Invalid patterns
    const invalidPatterns = [
      /^1\/0$/,           // Excel error "1/0"
      /^0$/,              // Just "0"
      /^-$/,              // Just "-"
      /^#[A-Z]+!?$/i,     // Excel errors like #REF!, #VALUE!
      /^N\/A$/i,          // N/A
      /^null$/i,          // "null" string
      /^undefined$/i      // "undefined" string
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(str)) {
        return false;
      }
    }

    return str.length > 0;
  }

  /**
   * Parse production value - extract numeric quantity from cell
   * Values can be: numbers (completed qty), dates (planned date), or " - " (no data)
   * @private
   */
  _parseProductionValue(value) {
    if (!value) return 0;

    const strVal = String(value).trim();

    // Skip non-data values
    if (strVal === '-' || strVal === ' - ' || strVal === '' ||
        strVal.toLowerCase().includes('bal') ||
        strVal.toLowerCase().includes('w.h')) {
      return 0;
    }

    // Check if it's a pure number (completed quantity)
    const numMatch = strVal.match(/^[\s]*(\d+)[\s]*$/);
    if (numMatch) {
      return parseInt(numMatch[1], 10);
    }

    // Check for date format (MM/DD, YYYY.MM.DD, YYYY-MM-DD) - these are plan dates, not completed qty
    if (/^\s*\d{1,2}\/\d{1,2}\s*$/.test(strVal) ||
        /^\d{4}[\.\-]\d{2}[\.\-]\d{2}/.test(strVal)) {
      return 0; // Date = not yet completed
    }

    // Try to parse as number anyway
    const num = parseFloat(strVal.replace(/,/g, ''));
    return isNaN(num) ? 0 : Math.floor(num);
  }

  /**
   * Normalize column name to camelCase
   * @private
   */
  _normalizeColumnName(name) {
    // Remove special characters and convert to camelCase
    return name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^./, c => c.toLowerCase());
  }

  /**
   * Parse value based on field type
   * @private
   */
  _parseValue(field, value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Numeric fields
    if (['quantity', 'completedQuantity', 'balance'].includes(field)) {
      const num = parseFloat(String(value).replace(/,/g, ''));
      return isNaN(num) ? 0 : num;
    }

    // Process stage fields (quantities)
    if (PROCESS_STAGES.some(p => p.code === field)) {
      const num = parseFloat(String(value).replace(/,/g, ''));
      return isNaN(num) ? 0 : num;
    }

    // Date fields
    if (['crd', 'sddValue', 'exFty'].includes(field)) {
      return value; // Keep as string, will be parsed later
    }

    // Boolean-like fields
    if (field === 'code04') {
      const v = String(value).toLowerCase().trim();
      // Filter out Excel error values like "1/0"
      if (v === '1/0' || v === '#ref!' || v === '#value!' || v === 'n/a' || v === 'code 04') {
        return false;
      }
      return v === 'yes' || v === 'true' || v === '1' || v === 'y';
    }

    return String(value).trim();
  }

  /**
   * Normalize factory code
   * Handles various factory field formats:
   * - Simple: "A", "B", "C", "D"
   * - Named: "FACTORY A", "FACTORY_A"
   * - Unit field: "RBF.05-SEW RA.12" → B (prioritize first factory code)
   * @private
   */
  _normalizeFactory(factory) {
    const f = String(factory).toUpperCase().trim();

    // Direct factory codes
    if (f === 'A' || f === 'FACTORY A' || f === 'FACTORY_A') return 'A';
    if (f === 'B' || f === 'FACTORY B' || f === 'FACTORY_B') return 'B';
    if (f === 'C' || f === 'FACTORY C' || f === 'FACTORY_C') return 'C';
    if (f === 'D' || f === 'FACTORY D' || f === 'FACTORY_D') return 'D';

    // Extract from Unit field format like "RBF.05-SEW RA.12"
    // Prioritize the FIRST factory code found (most significant)
    // Pattern: R[ABCD]F? or R[ABCD]. at the beginning
    const unitMatch = f.match(/^R([ABCD])(?:F?\.|\s|-)/);
    if (unitMatch) {
      return unitMatch[1];
    }

    // Fallback: Look for R[ABCD] anywhere but prefer first occurrence
    const fallbackMatch = f.match(/R([ABCD])(?:F?\.|\s|-|$)/);
    if (fallbackMatch) {
      return fallbackMatch[1];
    }

    return f;
  }

  /**
   * Determine order status
   * @private
   */
  _determineStatus(order) {
    const qty = order.quantity || 0;
    // Use WH_IN as completed quantity if completedQuantity not available
    const completed = order.completedQuantity || order.WH_IN || 0;

    if (completed >= qty && qty > 0) return 'completed';
    if (completed > 0) return 'partial';
    return 'pending';
  }

  /**
   * Validate order data
   * @private
   */
  _validateOrder(order, index) {
    // Skip sub-header rows (contain "Original", "Current", "Plan", etc. in SDD/CRD)
    const subHeaderValues = ['original', 'current', 'plan', 'actual', 'target', 'balance'];
    if (order.sddValue && subHeaderValues.includes(String(order.sddValue).toLowerCase().trim())) {
      return false;
    }
    if (order.crd && subHeaderValues.includes(String(order.crd).toLowerCase().trim())) {
      return false;
    }

    // Skip header rows that appear as data (e.g., "Sales Order and Item", "PO#", "Style")
    const poStr = String(order.poNumber || '').toUpperCase().trim();
    const headerKeywords = ['SALES ORDER AND ITEM', 'PO#', 'STYLE', 'MODEL', 'UNIT'];
    if (headerKeywords.includes(poStr)) {
      return false;
    }

    // Skip TOTAL/summary rows (CRD or PO contains "TOTAL")
    const crdStr = String(order.crd || '').toUpperCase().trim();
    if (crdStr.includes('TOTAL') || poStr.includes('TOTAL') || crdStr === 'GRAND TOTAL') {
      console.log('[DataParser] Skipping TOTAL row:', crdStr || poStr);
      return false;
    }

    // Skip rows with PO = "-" and no meaningful date data (summary rows)
    if (poStr === '-' && !order.sddValue) {
      return false;
    }

    // Skip rows with empty key fields
    if (!order.poNumber && !order.style && !order.model) {
      // Check if any meaningful data exists in the row
      const hasAnyData = order.quantity > 0 || order.crd || order.sddValue;
      if (!hasAnyData) {
        return false;
      }
    }

    // Must have quantity for valid orders (but allow 0 for tracking)
    if (order.quantity === null || order.quantity === undefined) {
      this.warnings.push({
        row: index + 2,
        warning: 'Missing quantity'
      });
    }

    // Warn about suspicious destination codes (likely placeholder values)
    const suspiciousDestinations = ['W9997', 'W9998', 'W9999', 'UNKNOWN', 'TBD', 'N/A'];
    if (order.destination && suspiciousDestinations.includes(String(order.destination).toUpperCase())) {
      this.warnings.push({
        row: index + 2,
        warning: `Suspicious destination: ${order.destination}`
      });
    }

    return true;
  }

  /**
   * Calculate statistics from orders
   * @private
   */
  _calculateStatistics(orders) {
    const stats = {
      totalOrders: orders.length,
      totalQuantity: 0,
      completedQuantity: 0,
      delayedOrders: 0,
      delayedQuantity: 0,
      warningOrders: 0,
      warningQuantity: 0,
      shippedOrders: 0,
      shippedQuantity: 0,
      byStatus: {
        completed: 0,
        partial: 0,
        pending: 0
      },
      byFactory: {}
    };

    orders.forEach(order => {
      const qty = order.quantity || 0;
      stats.totalQuantity += qty;

      // Use WH_IN as completed quantity
      const whInCompleted = order.WH_IN || order.completedQuantity || 0;

      // Completed
      if (order.status === 'completed') {
        stats.byStatus.completed++;
        stats.completedQuantity += qty;
      } else if (order.status === 'partial') {
        stats.byStatus.partial++;
        stats.completedQuantity += whInCompleted;
      } else {
        stats.byStatus.pending++;
      }

      // Delayed check
      if (isDelayed(order)) {
        stats.delayedOrders++;
        stats.delayedQuantity += qty;
      }

      // Warning check
      if (isWarning(order)) {
        stats.warningOrders++;
        stats.warningQuantity += qty;
      }

      // Shipped check
      if (isShipped(order)) {
        stats.shippedOrders++;
        stats.shippedQuantity += qty;
      }

      // By factory
      const factory = order.factory || 'Unknown';
      if (!stats.byFactory[factory]) {
        stats.byFactory[factory] = {
          orders: 0,
          quantity: 0,
          completed: 0,
          delayed: 0
        };
      }
      stats.byFactory[factory].orders++;
      stats.byFactory[factory].quantity += qty;
      if (order.status === 'completed') {
        stats.byFactory[factory].completed++;
      }
      if (isDelayed(order)) {
        stats.byFactory[factory].delayed++;
      }
    });

    // Calculate rates
    stats.completionRate = stats.totalQuantity > 0
      ? ((stats.completedQuantity / stats.totalQuantity) * 100).toFixed(2)
      : '0.00';
    stats.delayRate = stats.totalOrders > 0
      ? ((stats.delayedOrders / stats.totalOrders) * 100).toFixed(2)
      : '0.00';

    return stats;
  }

  /**
   * Group orders by date
   * @private
   */
  _groupByDate(orders) {
    const grouped = {};

    orders.forEach(order => {
      const date = order.sddDate || order.crdDate;
      if (!date) return;

      const dateStr = date instanceof Date
        ? date.toISOString().split('T')[0]
        : String(date).split('T')[0];

      if (!grouped[dateStr]) {
        grouped[dateStr] = {
          date: dateStr,
          orders: 0,
          quantity: 0,
          completed: 0
        };
      }

      grouped[dateStr].orders++;
      grouped[dateStr].quantity += order.quantity || 0;
      if (order.status === 'completed') {
        grouped[dateStr].completed++;
      }
    });

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Group orders by model
   * @private
   */
  _groupByModel(orders) {
    const grouped = {};

    orders.forEach(order => {
      const model = order.model || order.style || 'Unknown';

      if (!grouped[model]) {
        grouped[model] = {
          model,
          orders: 0,
          quantity: 0,
          completedQuantity: 0,
          delayedQuantity: 0
        };
      }

      grouped[model].orders++;
      grouped[model].quantity += order.quantity || 0;
      grouped[model].completedQuantity += order.completedQuantity || 0;

      if (isDelayed(order)) {
        grouped[model].delayedQuantity += order.quantity || 0;
      }
    });

    // Calculate delay rate and sort by quantity
    return Object.values(grouped)
      .map(m => ({
        ...m,
        delayRate: m.quantity > 0 ? ((m.delayedQuantity / m.quantity) * 100).toFixed(2) : '0.00'
      }))
      .sort((a, b) => b.quantity - a.quantity);
  }

  /**
   * Calculate process stage data
   * @private
   */
  _calculateProcessData(orders) {
    const processData = {};

    PROCESS_STAGES.forEach(step => {
      processData[step.code] = {
        id: step.code,
        name: step.name,
        totalQuantity: 0,
        completedQuantity: 0,
        orderCount: 0
      };
    });

    orders.forEach(order => {
      const qty = order.quantity || 0;

      PROCESS_STAGES.forEach(step => {
        const stepQty = order[step.code] || 0;
        if (stepQty > 0) {
          processData[step.code].completedQuantity += stepQty;
          processData[step.code].orderCount++;
        }
        processData[step.code].totalQuantity += qty;
      });
    });

    // Calculate completion rates
    Object.values(processData).forEach(step => {
      step.completionRate = step.totalQuantity > 0
        ? ((step.completedQuantity / step.totalQuantity) * 100).toFixed(1)
        : '0.0';
    });

    return processData;
  }

  /**
   * Get available sheets from Excel file
   * @param {ArrayBuffer} content - File content
   * @returns {Array<string>} Sheet names
   */
  getSheetNames(content) {
    try {
      const workbook = XLSX.read(content, { type: 'array' });
      return workbook.SheetNames;
    } catch (error) {
      console.error('[DataParser] Error reading sheet names:', error);
      return [];
    }
  }

  /**
   * Preview first N rows of data
   * @param {ArrayBuffer|string} content - File content
   * @param {string} fileName - File name
   * @param {number} rows - Number of rows to preview
   * @returns {Object} Preview data
   */
  preview(content, fileName, rows = 10) {
    try {
      const extension = fileName.toLowerCase().split('.').pop();
      let rawData;

      if (extension === 'csv') {
        rawData = this._parseCSV(content);
      } else {
        rawData = this._parseExcel(content);
      }

      const previewData = rawData.slice(0, rows);
      const columns = previewData.length > 0 ? Object.keys(previewData[0]) : [];

      return {
        columns,
        rows: previewData,
        totalRows: rawData.length,
        mappedColumns: columns.reduce((acc, col) => {
          acc[col] = COLUMN_MAPPINGS[col] || null;
          return acc;
        }, {})
      };

    } catch (error) {
      console.error('[DataParser] Preview error:', error);
      throw error;
    }
  }
}

// ========================================
// Exports
// ========================================

export const dataParser = new DataParser();

export function parseFile(content, fileName, options) {
  return dataParser.parse(content, fileName, options);
}

export function previewFile(content, fileName, rows) {
  return dataParser.preview(content, fileName, rows);
}

export function getExcelSheets(content) {
  return dataParser.getSheetNames(content);
}

export default dataParser;

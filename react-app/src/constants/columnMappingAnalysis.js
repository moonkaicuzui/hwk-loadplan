/**
 * @fileoverview Column Mapping Analysis
 * Generated from actual Google Drive Excel files (2026-02-06)
 *
 * This file documents:
 * 1. Actual Excel column structures per factory
 * 2. System's expected column mappings
 * 3. Verification status for each mapping
 *
 * @module constants/columnMappingAnalysis
 */

// ========================================
// CRITICAL COLUMN LOCATIONS BY FACTORY
// ========================================

/**
 * Actual critical column locations discovered from Excel files
 * Key columns that the system MUST correctly map for accurate data
 */
export const VERIFIED_COLUMN_LOCATIONS = {
  'Factory A': {
    // Core identifiers
    poNumber: { excel: 'N', jsonKey: 'Sales Order and Item', verified: true },
    model: { excel: 'J', jsonKey: 'Model', verified: true },
    style: { excel: 'K', jsonKey: 'Art', verified: true },
    color: { excel: 'L', jsonKey: 'Color', verified: true },

    // Dates
    crd: { excel: 'F', jsonKey: 'CRD', verified: true },
    sdd: { excel: 'G', jsonKey: 'SDD', subHeader: 'Original', verified: true },
    sddCurrent: { excel: 'H', jsonKey: '__EMPTY_7', subHeader: 'Current', verified: true },

    // Factory & Location
    factory: { excel: 'A', jsonKey: 'Unit', verified: true },
    destination: { excel: 'O', jsonKey: 'Dest', verified: true },

    // Quantity
    quantity: { excel: 'R', jsonKey: 'Q.ty', verified: true },

    // Status
    code04: { excel: 'I', jsonKey: 'Code 04', verified: true },
    vendor: { excel: 'E', jsonKey: 'Co-op', verified: true },
    buyer: { excel: 'M', jsonKey: 'GD', verified: true },

    // Production stages (CRITICAL: all in __EMPTY_* columns)
    S_CUT: { excel: 'AO', jsonKey: '__EMPTY_40', subHeader: 'S.Cut Bal', verified: true },
    PRE_SEW: { excel: 'AP', jsonKey: '__EMPTY_41', subHeader: 'Pre-Sew Bal.', verified: true },
    SEW_INPUT: { excel: 'AQ', jsonKey: '__EMPTY_42', subHeader: 'Sew input Bal', verified: true },
    SEW_BAL: { excel: 'AS', jsonKey: 'PRODUCTION STATUS', subHeader: 'Sew\r\nBal', verified: true },
    S_FIT: { excel: 'AY', jsonKey: '__EMPTY_50', subHeader: 'S/Fit Bal', verified: true },
    ASS_BAL: { excel: 'AZ', jsonKey: '__EMPTY_51', subHeader: 'Ass Bal', verified: true },
    WH_IN: { excel: 'BC', jsonKey: '__EMPTY_54', subHeader: 'W.H IN BAL', verified: true },
    WH_OUT: { excel: 'BD', jsonKey: '__EMPTY_55', subHeader: 'W.H OUT BAL', verified: true }
  },

  'Factory B': {
    // Core identifiers - NOTE: No 'Fac code' column in Factory B
    poNumber: { excel: 'M', jsonKey: 'Sales Order and Item', verified: true },
    model: { excel: 'I', jsonKey: 'Model', verified: true },
    style: { excel: 'J', jsonKey: 'Art', verified: true },
    color: { excel: 'K', jsonKey: 'Color', verified: true },

    // Dates
    crd: { excel: 'E', jsonKey: 'CRD', verified: true },
    sdd: { excel: 'F', jsonKey: 'SDD', subHeader: 'Original', verified: true },
    sddCurrent: { excel: 'G', jsonKey: '__EMPTY_6', subHeader: 'Current', verified: true },

    // Factory & Location
    factory: { excel: 'A', jsonKey: 'Unit', verified: true },
    destination: { excel: 'N', jsonKey: 'Dest', verified: true },

    // Quantity
    quantity: { excel: 'Q', jsonKey: 'Q.ty', verified: true },

    // Status
    code04: { excel: 'H', jsonKey: 'Code 04', verified: true },
    vendor: { excel: 'D', jsonKey: 'Co-op', verified: true },
    buyer: { excel: 'L', jsonKey: 'GD', verified: true },

    // Production stages
    S_CUT: { excel: 'AM', jsonKey: '__EMPTY_38', subHeader: 'S.Cut Bal', verified: true },
    PRE_SEW: { excel: 'AN', jsonKey: '__EMPTY_39', subHeader: 'Pre-Sew Bal.', verified: true },
    SEW_INPUT: { excel: 'AO', jsonKey: '__EMPTY_40', subHeader: 'Sew input Bal', verified: true },
    SEW_BAL: { excel: 'AQ', jsonKey: 'PRODUCTION STATUS', subHeader: 'Sew\r\nBal', verified: true },
    S_FIT: { excel: 'AX', jsonKey: '__EMPTY_49', subHeader: 'S/Fit Bal', verified: true },
    ASS_BAL: { excel: 'AY', jsonKey: '__EMPTY_50', subHeader: 'Ass Bal', verified: true },
    WH_IN: { excel: 'BB', jsonKey: '__EMPTY_53', subHeader: 'W.H IN BAL', verified: true },
    WH_OUT: { excel: 'BC', jsonKey: '__EMPTY_54', subHeader: 'W.H OUT BAL', verified: true }
  },

  'Factory C': {
    // Core identifiers - Has 'PD' column, extra CNF.SDD column
    poNumber: { excel: 'Q', jsonKey: 'Sales Order and Item', verified: true },
    model: { excel: 'L', jsonKey: 'Model', verified: true },
    style: { excel: 'M', jsonKey: 'Art', verified: true },
    color: { excel: 'O', jsonKey: 'Color', verified: true },  // NOTE: Column N is skipped

    // Dates
    crd: { excel: 'G', jsonKey: 'CRD', verified: true },
    sdd: { excel: 'H', jsonKey: 'SDD', subHeader: 'Original', verified: true },
    sddCurrent: { excel: 'I', jsonKey: '__EMPTY_8', subHeader: 'Current', verified: true },

    // Factory & Location
    factory: { excel: 'A', jsonKey: 'Unit', verified: true },
    destination: { excel: 'R', jsonKey: 'Dest', verified: true },

    // Quantity
    quantity: { excel: 'V', jsonKey: 'Q.ty', verified: true },

    // Status
    code04: { excel: 'J', jsonKey: 'Code 04', verified: true },
    vendor: { excel: 'E', jsonKey: 'Co-op', verified: true },
    buyer: { excel: 'P', jsonKey: 'GD', verified: true },

    // Production stages
    S_CUT: { excel: 'BB', jsonKey: '__EMPTY_53', subHeader: 'S.Cut Bal', verified: true },
    PRE_SEW: { excel: 'BC', jsonKey: '__EMPTY_54', subHeader: 'Pre-Sew Bal', verified: true },  // NOTE: No period
    SEW_INPUT: { excel: 'BD', jsonKey: '__EMPTY_55', subHeader: 'Sew input Bal', verified: true },
    SEW_BAL: { excel: 'BF', jsonKey: 'PRODUCTION STATUS', subHeader: 'Sew\r\nBal', verified: true },
    S_FIT: { excel: 'BM', jsonKey: '__EMPTY_64', subHeader: 'S/Fit Bal', verified: true },
    ASS_BAL: { excel: 'BN', jsonKey: '__EMPTY_65', subHeader: 'Ass Bal', verified: true },
    WH_IN: { excel: 'BQ', jsonKey: '__EMPTY_68', subHeader: 'W.H IN BAL', verified: true },
    WH_OUT: { excel: 'BR', jsonKey: '__EMPTY_69', subHeader: 'W.H OUT BAL', verified: true }
  },

  'Factory D': {
    // Core identifiers - Similar to Factory C structure
    poNumber: { excel: 'P', jsonKey: 'Sales Order and Item', verified: true },
    model: { excel: 'K', jsonKey: 'Model', verified: true },
    style: { excel: 'L', jsonKey: 'Art', verified: true },
    color: { excel: 'N', jsonKey: 'Color', verified: true },  // NOTE: Column M is skipped

    // Dates
    crd: { excel: 'F', jsonKey: 'CRD', verified: true },
    sdd: { excel: 'G', jsonKey: 'SDD', subHeader: 'Original', verified: true },
    sddCurrent: { excel: 'H', jsonKey: '__EMPTY_7', subHeader: 'Current', verified: true },

    // Factory & Location
    factory: { excel: 'A', jsonKey: 'Unit', verified: true },
    destination: { excel: 'Q', jsonKey: 'Dest', verified: true },

    // Quantity
    quantity: { excel: 'U', jsonKey: 'Q.ty', verified: true },

    // Status
    code04: { excel: 'I', jsonKey: 'Code 04', verified: true },
    vendor: { excel: 'D', jsonKey: 'Co-op', verified: true },
    buyer: { excel: 'O', jsonKey: 'GD', verified: true },

    // Production stages
    S_CUT: { excel: 'BA', jsonKey: '__EMPTY_52', subHeader: 'S.Cut Bal', verified: true },
    PRE_SEW: { excel: 'BB', jsonKey: '__EMPTY_53', subHeader: 'Pre-sew Bal', verified: true },  // NOTE: lowercase 's'
    SEW_INPUT: { excel: 'BC', jsonKey: '__EMPTY_54', subHeader: 'Sew input Bal', verified: true },
    SEW_BAL: { excel: 'BE', jsonKey: 'PRODUCTION STATUS', subHeader: 'Sew\r\nBal', verified: true },
    S_FIT: { excel: 'BK', jsonKey: '__EMPTY_62', subHeader: 'S/Fit Bal', verified: true },
    ASS_BAL: { excel: 'BL', jsonKey: '__EMPTY_63', subHeader: 'Ass Bal', verified: true },
    WH_IN: { excel: 'BO', jsonKey: '__EMPTY_66', subHeader: 'W.H IN BAL', verified: true },
    WH_OUT: { excel: 'BP', jsonKey: '__EMPTY_67', subHeader: 'W.H OUT BAL', verified: true }
  }
};

// ========================================
// COLUMN MAPPING VALIDATION
// ========================================

/**
 * System's dataParser.js COLUMN_MAPPINGS validation status
 * Compares expected mappings with actual Excel column names
 */
export const COLUMN_MAPPING_VALIDATION = {
  // ✅ VERIFIED CORRECT
  verified: {
    'Sales Order and Item': { maps_to: 'poNumber', status: 'OK', note: 'Present in all factories' },
    'Model': { maps_to: 'model', status: 'OK', note: 'Present in all factories' },
    'Art': { maps_to: 'style', status: 'OK', note: 'Present in all factories' },
    'Color': { maps_to: 'color', status: 'OK', note: 'Present in all factories' },
    'CRD': { maps_to: 'crd', status: 'OK', note: 'Present in all factories' },
    'SDD': { maps_to: 'sddValue', status: 'OK', note: 'Present in all factories, uses Original sub-column' },
    'Unit': { maps_to: 'factory', status: 'OK', note: 'Present in all factories' },
    'Dest': { maps_to: 'destination', status: 'OK', note: 'Present in all factories' },
    'Q.ty': { maps_to: 'quantity', status: 'OK', note: 'Present in all factories' },
    'Code 04': { maps_to: 'code04', status: 'OK', note: 'Present in all factories' },
    'Co-op': { maps_to: 'vendor', status: 'OK', note: 'Present in all factories' },
    'GD': { maps_to: 'buyer', status: 'OK', note: 'Present in all factories' }
  },

  // ⚠️ DYNAMIC DETECTION REQUIRED
  dynamicDetection: {
    'S.Cut Bal': {
      maps_to: 'S_CUT',
      status: 'DYNAMIC',
      note: 'Varies by factory: __EMPTY_40 (A), __EMPTY_38 (B), __EMPTY_53 (C), __EMPTY_52 (D)',
      detectionPattern: "(val.includes('s.cut') || val.includes('s cut')) && val.includes('bal')"
    },
    'Pre-Sew Bal': {
      maps_to: 'PRE_SEW',
      status: 'DYNAMIC',
      note: 'Variations: Pre-Sew Bal., Pre-Sew Bal, Pre-sew Bal',
      detectionPattern: "(val.includes('pre-sew') || val.includes('pre sew')) && val.includes('bal')"
    },
    'Sew input Bal': {
      maps_to: 'SEW_INPUT',
      status: 'DYNAMIC',
      note: 'Consistent across factories',
      detectionPattern: "val.includes('sew') && val.includes('input') && val.includes('bal')"
    },
    'Sew Bal': {
      maps_to: 'SEW_BAL',
      status: 'DYNAMIC',
      note: 'Header: PRODUCTION STATUS, SubHeader: Sew\\r\\nBal',
      detectionPattern: "val.includes('sew') && val.includes('bal') && !val.includes('input') && !val.includes('pre')"
    },
    'S/Fit Bal': {
      maps_to: 'S_FIT',
      status: 'DYNAMIC',
      note: 'Consistent across factories',
      detectionPattern: "(val.includes('s/fit') || val.includes('s fit') || val.includes('fit bal')) && !val.includes('ass')"
    },
    'Ass Bal': {
      maps_to: 'ASS_BAL',
      status: 'DYNAMIC',
      note: 'Consistent across factories',
      detectionPattern: "val.includes('ass') && val.includes('bal') && !val.includes('stk')"
    },
    'W.H IN BAL': {
      maps_to: 'WH_IN',
      status: 'DYNAMIC',
      note: 'Consistent across factories',
      detectionPattern: "val.includes('w.h') && val.includes('in') && val.includes('bal') && !val.includes('out')"
    },
    'W.H OUT BAL': {
      maps_to: 'WH_OUT',
      status: 'DYNAMIC',
      note: 'Consistent across factories',
      detectionPattern: "val.includes('w.h') && val.includes('out') && val.includes('bal')"
    }
  },

  // ❌ NOT IN ACTUAL DATA (can be removed from COLUMN_MAPPINGS)
  notFound: [
    'PO#',           // Not used - 'Sales Order and Item' is used instead
    'PO',            // Not used
    'PO Number',     // Not used
    'Style#',        // Not used - 'Art' is used instead
    'Style Number',  // Not used
    'Color Code',    // Not used
    'Customer Required Date',  // 'CRD' is used
    'Scheduled Delivery Date', // 'SDD' is used
    'Ship Date',     // Not used
    'EX-FTY',        // Not used
    'Ex-Factory',    // Not used
    'Qty',           // Not used - 'Q.ty' is used
    'Quantity',      // Not used
    'Order Qty',     // Not used
    'Total Qty',     // Not used
    'Completed',     // Not used - calculated from stages
    'Completed Qty', // Not used
    'Balance',       // Not used
    'Remaining',     // Not used
    'Factory',       // Not used - 'Unit' is used
    'Factory Code',  // Not used
    'Destination',   // Not used - 'Dest' is used
    'Country',       // Not used
    'Ship To',       // Not used
    'Vendor',        // Not used - 'Co-op' is used
    'Vendor Code',   // Not used
    'Buyer',         // Not used - 'GD' is used
    'Customer',      // Not used
    'Status',        // Not used
    'Order Status',  // Not used
    'Code04',        // Note: 'Code 04' with space is used
    'Approval Code', // Not used
    'Model Name',    // Not used - 'Model' is used
    'Product',       // Not used
    'Item'           // Not used
  ]
};

// ========================================
// FACTORY STRUCTURE DIFFERENCES
// ========================================

/**
 * Key structural differences between factory files
 */
export const FACTORY_DIFFERENCES = {
  'Factory A': {
    totalColumns: 62,
    headerRow: 2,
    uniqueColumns: ['Fac code'],
    notes: 'Standard layout, most columns'
  },
  'Factory B': {
    totalColumns: 61,
    headerRow: 2,
    uniqueColumns: [],
    missingColumns: ['Fac code'],  // No Fac code column
    notes: 'Simplified layout, fewer columns'
  },
  'Factory C': {
    totalColumns: 76,
    headerRow: 2,
    uniqueColumns: ['PD', 'CNF.SDD', 'UPC', 'SPEC CHANGE', 'DAILYSHEET'],
    notes: 'Extended layout with additional QC columns'
  },
  'Factory D': {
    totalColumns: 74,
    headerRow: 2,
    uniqueColumns: ['PD', 'CNF.SDD', 'UPC', 'SPEC CHANGE', 'DAILYSHEET'],
    notes: 'Similar to Factory C structure'
  }
};

// ========================================
// KNOWN DATA QUALITY ISSUES
// ========================================

/**
 * Data quality issues identified and how they're handled
 */
export const DATA_QUALITY_HANDLING = {
  // SDD column issues
  sdd: {
    issue: 'Invalid SDD values: "1/0", "#REF!", "#VALUE!", "N/A"',
    solution: '_isValidDateString() filters these values, returns null',
    affectedCount: '~1,970 rows'
  },

  // Code04 column issues
  code04: {
    issue: 'Invalid Code04 values: "1/0", "#REF!", "#VALUE!", "N/A", "Code 04"',
    solution: '_parseValue() treats these as false',
    affectedCount: '~2,020 rows'
  },

  // TOTAL rows
  totalRows: {
    issue: 'TOTAL/GRAND TOTAL summary rows included as data',
    solution: '_validateOrder() filters rows where CRD or PO contains "TOTAL"',
    affectedCount: '~160 rows'
  },

  // Header rows
  headerRows: {
    issue: 'Sub-header row (Original/Current) parsed as data',
    solution: '_validateOrder() filters rows matching header keywords',
    affectedCount: '~44 rows'
  },

  // Factory extraction
  factory: {
    issue: 'Unit field may contain multiple factory codes (e.g., "RAF.01-SEW RA.02")',
    solution: '_normalizeFactory() extracts FIRST factory code, _extractFactoryFromFilename() for fallback',
    note: 'Filename-based extraction has priority when available'
  },

  // Suspicious destinations
  destinations: {
    issue: 'Some destinations appear invalid: W9997, W9998, W9999, UNKNOWN, TBD',
    solution: '_validateOrder() logs warning but does not filter',
    note: 'These may be valid internal codes'
  }
};

// ========================================
// PRODUCTION STAGE COLUMN INDEX MAP
// ========================================

/**
 * Quick reference for production stage JSON keys by factory
 * Use with _dynamicColumnMap in dataParser.js
 */
export const STAGE_COLUMN_QUICK_REF = {
  // Stage: [Factory A, Factory B, Factory C, Factory D]
  'S_CUT':     ['__EMPTY_40', '__EMPTY_38', '__EMPTY_53', '__EMPTY_52'],
  'PRE_SEW':   ['__EMPTY_41', '__EMPTY_39', '__EMPTY_54', '__EMPTY_53'],
  'SEW_INPUT': ['__EMPTY_42', '__EMPTY_40', '__EMPTY_55', '__EMPTY_54'],
  'SEW_BAL':   ['PRODUCTION STATUS', 'PRODUCTION STATUS', 'PRODUCTION STATUS', 'PRODUCTION STATUS'],
  'S_FIT':     ['__EMPTY_50', '__EMPTY_49', '__EMPTY_64', '__EMPTY_62'],
  'ASS_BAL':   ['__EMPTY_51', '__EMPTY_50', '__EMPTY_65', '__EMPTY_63'],
  'WH_IN':     ['__EMPTY_54', '__EMPTY_53', '__EMPTY_68', '__EMPTY_66'],
  'WH_OUT':    ['__EMPTY_55', '__EMPTY_54', '__EMPTY_69', '__EMPTY_67']
};

export default {
  VERIFIED_COLUMN_LOCATIONS,
  COLUMN_MAPPING_VALIDATION,
  FACTORY_DIFFERENCES,
  DATA_QUALITY_HANDLING,
  STAGE_COLUMN_QUICK_REF
};

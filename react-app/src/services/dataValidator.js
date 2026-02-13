/**
 * @fileoverview Data Validation Service
 * Validates production data from Excel files with severity classification.
 *
 * Validation Categories:
 * - CRITICAL: Data unusable without fix (missing required fields, invalid format)
 * - WARNING: Data usable but suspicious (sequence violations, outliers)
 * - INFO: Minor issues (formatting, standardization suggestions)
 *
 * @module services/dataValidator
 */

// ========================================
// Severity Levels
// ========================================

export const SEVERITY = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info'
};

export const SEVERITY_LABELS = {
  [SEVERITY.CRITICAL]: { ko: '심각', en: 'Critical', color: '#DC2626' },
  [SEVERITY.WARNING]: { ko: '경고', en: 'Warning', color: '#F59E0B' },
  [SEVERITY.INFO]: { ko: '정보', en: 'Info', color: '#3B82F6' }
};

// ========================================
// Validation Rules Configuration
// ========================================

const VALIDATION_RULES = {
  // Required fields - CRITICAL if missing
  required: {
    fields: ['Sales Order and Item', 'Q.ty', 'CRD'],
    alternates: {
      'Sales Order and Item': ['PO#', 'PO', 'poNumber'],
      'Q.ty': ['Qty', 'Quantity', 'quantity', 'ttl_qty'],
      'CRD': ['Customer Required Date', 'crd']
    }
  },

  // Numeric fields - WARNING if non-numeric
  numeric: {
    fields: [
      'Q.ty', 'Qty', 'quantity', 'ttl_qty',
      'S_CUT', 'PRE_SEW', 'SEW_INPUT', 'SEW_BAL',
      'S_FIT', 'ASS_BAL', 'WH_IN', 'WH_OUT',
      'S.Cut Bal', 'Pre-Sew Bal', 'Sew input Bal', 'Sew Bal',
      'S/Fit Bal', 'Ass Bal', 'W.H IN BAL', 'W.H OUT BAL'
    ],
    allowNegative: false,
    allowZero: true
  },

  // Date fields - WARNING if invalid format
  dateFormat: {
    fields: ['CRD', 'SDD', 'crd', 'sdd'],
    invalidPatterns: [/^1\/0$/, /^0$/, /^-$/, /^#[A-Z]+!?$/i, /^N\/A$/i]
  },

  // Process sequence - WARNING if violated
  // Expected: S.Cut >= Pre-Sew >= Sew input >= Sew >= S/Fit >= Ass >= WH_IN >= WH_OUT
  processSequence: {
    stages: [
      { field: 'S.Cut Bal', name: 'S_CUT', normalized: 'S_CUT' },
      { field: 'Pre-Sew Bal', name: 'PRE_SEW', normalized: 'PRE_SEW' },
      { field: 'Sew input Bal', name: 'SEW_INPUT', normalized: 'SEW_INPUT' },
      { field: 'Sew Bal', name: 'SEW_BAL', normalized: 'SEW_BAL' },
      { field: 'S/Fit Bal', name: 'S_FIT', normalized: 'S_FIT' },
      { field: 'Ass Bal', name: 'ASS_BAL', normalized: 'ASS_BAL' },
      { field: 'W.H IN BAL', name: 'WH_IN', normalized: 'WH_IN' },
      { field: 'W.H OUT BAL', name: 'WH_OUT', normalized: 'WH_OUT' }
    ]
  },

  // Logical checks - WARNING
  logical: {
    // Balance should not exceed total quantity
    balanceNotExceedQty: true,
    // CRD should be a reasonable date (not too far in past/future)
    crdReasonableRange: { pastDays: 365, futureDays: 730 }
  },

  // Factory code - INFO if non-standard
  factoryCode: {
    validCodes: ['A', 'B', 'C', 'D'],
    fieldNames: ['Unit', 'Factory']
  }
};

// ========================================
// Validator Class
// ========================================

class DataValidator {
  constructor(options = {}) {
    this.rules = { ...VALIDATION_RULES, ...options.rules };
    this.errors = [];
    this.stats = {
      total: 0,
      valid: 0,
      critical: 0,
      warning: 0,
      info: 0
    };
  }

  /**
   * Validate an array of orders
   * @param {Array} orders - Array of order objects
   * @param {Object} options - Validation options
   * @returns {Object} Validation result with errors and stats
   */
  validate(orders, options = {}) {
    this.errors = [];
    this.stats = {
      total: orders.length,
      valid: 0,
      critical: 0,
      warning: 0,
      info: 0
    };

    const dynamicColumnMap = options.dynamicColumnMap || {};

    orders.forEach((order, index) => {
      const rowNumber = index + 2; // Assuming header is row 1
      const rowErrors = [];

      // 1. Required field validation
      rowErrors.push(...this._validateRequired(order, rowNumber));

      // 2. Numeric field validation
      rowErrors.push(...this._validateNumeric(order, rowNumber, dynamicColumnMap));

      // 3. Date format validation
      rowErrors.push(...this._validateDateFormat(order, rowNumber));

      // 4. Process sequence validation
      rowErrors.push(...this._validateProcessSequence(order, rowNumber, dynamicColumnMap));

      // 5. Logical validation
      rowErrors.push(...this._validateLogical(order, rowNumber, dynamicColumnMap));

      // 6. Factory code validation
      rowErrors.push(...this._validateFactoryCode(order, rowNumber));

      // Update stats
      const hasCritical = rowErrors.some(e => e.severity === SEVERITY.CRITICAL);
      const hasWarning = rowErrors.some(e => e.severity === SEVERITY.WARNING);
      const hasInfo = rowErrors.some(e => e.severity === SEVERITY.INFO);

      if (hasCritical) this.stats.critical++;
      if (hasWarning && !hasCritical) this.stats.warning++;
      if (hasInfo && !hasCritical && !hasWarning) this.stats.info++;
      if (rowErrors.length === 0) this.stats.valid++;

      this.errors.push(...rowErrors);
    });

    return {
      isValid: this.stats.critical === 0,
      errors: this.errors,
      stats: this.stats,
      summary: this._generateSummary()
    };
  }

  // ========================================
  // Validation Methods
  // ========================================

  _validateRequired(order, rowNumber) {
    const errors = [];
    const { fields, alternates } = this.rules.required;

    fields.forEach(field => {
      let hasValue = this._hasValue(order[field]);

      // Check alternate field names
      if (!hasValue && alternates[field]) {
        hasValue = alternates[field].some(alt => this._hasValue(order[alt]));
      }

      if (!hasValue) {
        errors.push({
          row: rowNumber,
          field,
          severity: SEVERITY.CRITICAL,
          code: 'REQUIRED_MISSING',
          message: `필수 필드 누락: ${field}`,
          value: order[field] || '(empty)'
        });
      }
    });

    return errors;
  }

  _validateNumeric(order, rowNumber, dynamicColumnMap) {
    const errors = [];
    const { fields, allowNegative, allowZero } = this.rules.numeric;

    // Include dynamic stage columns
    const allNumericFields = [...fields];
    Object.values(dynamicColumnMap).forEach(colName => {
      if (!allNumericFields.includes(colName)) {
        allNumericFields.push(colName);
      }
    });

    allNumericFields.forEach(field => {
      const value = order[field];
      if (value === undefined || value === '' || value === null) return;

      const numValue = this._parseNumber(value);

      if (isNaN(numValue)) {
        errors.push({
          row: rowNumber,
          field,
          severity: SEVERITY.WARNING,
          code: 'INVALID_NUMBER',
          message: `숫자가 아닌 값: ${field}`,
          value: String(value)
        });
      } else if (!allowNegative && numValue < 0) {
        errors.push({
          row: rowNumber,
          field,
          severity: SEVERITY.WARNING,
          code: 'NEGATIVE_NUMBER',
          message: `음수 값: ${field}`,
          value: String(value)
        });
      } else if (!allowZero && numValue === 0) {
        errors.push({
          row: rowNumber,
          field,
          severity: SEVERITY.INFO,
          code: 'ZERO_VALUE',
          message: `0 값: ${field}`,
          value: String(value)
        });
      }
    });

    return errors;
  }

  _validateDateFormat(order, rowNumber) {
    const errors = [];
    const { fields, invalidPatterns } = this.rules.dateFormat;

    fields.forEach(field => {
      const value = order[field];
      if (value === undefined || value === '' || value === null) return;

      const strValue = String(value).trim();

      // Check for known invalid patterns
      const isInvalid = invalidPatterns.some(pattern => pattern.test(strValue));
      if (isInvalid) {
        errors.push({
          row: rowNumber,
          field,
          severity: SEVERITY.WARNING,
          code: 'INVALID_DATE',
          message: `잘못된 날짜 형식: ${field}`,
          value: strValue
        });
      }
    });

    return errors;
  }

  _validateProcessSequence(order, rowNumber, dynamicColumnMap) {
    const errors = [];
    const { stages } = this.rules.processSequence;

    // Get values for each stage
    const stageValues = stages.map(stage => {
      // Try normalized field name first
      let value = order[stage.normalized];

      // Try raw Excel field name
      if (value === undefined) {
        value = order[stage.field];
      }

      // Try dynamic column mapping
      if (value === undefined) {
        const dynamicKey = Object.keys(dynamicColumnMap).find(
          k => dynamicColumnMap[k] === stage.name || k.toLowerCase().includes(stage.name.toLowerCase())
        );
        if (dynamicKey) {
          value = order[dynamicKey];
        }
      }

      return {
        ...stage,
        value: this._parseNumber(value) || 0
      };
    });

    // Check sequence: each stage should have >= balance than the next
    for (let i = 0; i < stageValues.length - 1; i++) {
      const current = stageValues[i];
      const next = stageValues[i + 1];

      // Skip if values are 0 or undefined (no data)
      if (current.value === 0 && next.value === 0) continue;

      if (current.value < next.value) {
        errors.push({
          row: rowNumber,
          field: `${current.name} → ${next.name}`,
          severity: SEVERITY.WARNING,
          code: 'SEQUENCE_VIOLATION',
          message: `공정 순서 역전: ${current.name}(${current.value}) < ${next.name}(${next.value})`,
          value: `${current.value} < ${next.value}`
        });
      }
    }

    return errors;
  }

  _validateLogical(order, rowNumber, dynamicColumnMap) {
    const errors = [];
    const qty = this._parseNumber(order.quantity || order.ttl_qty || order['Q.ty'] || order['Qty']) || 0;

    // Check balance not exceeding quantity
    if (this.rules.logical.balanceNotExceedQty && qty > 0) {
      const balanceFields = [
        'S_CUT', 'PRE_SEW', 'SEW_INPUT', 'SEW_BAL',
        'S_FIT', 'ASS_BAL', 'WH_IN', 'WH_OUT',
        'S.Cut Bal', 'Pre-Sew Bal', 'Sew input Bal', 'Sew Bal',
        'S/Fit Bal', 'Ass Bal', 'W.H IN BAL', 'W.H OUT BAL',
        ...Object.values(dynamicColumnMap)
      ];

      balanceFields.forEach(field => {
        const balance = this._parseNumber(order[field]);
        if (balance > qty) {
          errors.push({
            row: rowNumber,
            field,
            severity: SEVERITY.WARNING,
            code: 'BALANCE_EXCEEDS_QTY',
            message: `잔량이 총수량 초과: ${field}(${balance}) > Qty(${qty})`,
            value: `${balance} > ${qty}`
          });
        }
      });
    }

    // Check CRD reasonable range
    const crd = order.crd || order['CRD'];
    if (crd && this.rules.logical.crdReasonableRange) {
      const crdDate = this._parseDate(crd);
      if (crdDate) {
        const today = new Date();
        const { pastDays, futureDays } = this.rules.logical.crdReasonableRange;

        const minDate = new Date(today);
        minDate.setDate(minDate.getDate() - pastDays);

        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + futureDays);

        if (crdDate < minDate || crdDate > maxDate) {
          errors.push({
            row: rowNumber,
            field: 'CRD',
            severity: SEVERITY.INFO,
            code: 'CRD_OUT_OF_RANGE',
            message: `CRD가 비정상 범위: ${crd}`,
            value: crd
          });
        }
      }
    }

    return errors;
  }

  _validateFactoryCode(order, rowNumber) {
    const errors = [];
    const { validCodes, fieldNames } = this.rules.factoryCode;

    fieldNames.forEach(field => {
      const value = order[field];
      if (!value) return;

      // Extract factory code from value like "RAF.01-SEW RA.01"
      const match = String(value).match(/R([ABCD])/i);
      const code = match ? match[1].toUpperCase() : null;

      if (code && !validCodes.includes(code)) {
        errors.push({
          row: rowNumber,
          field,
          severity: SEVERITY.INFO,
          code: 'UNKNOWN_FACTORY',
          message: `알 수 없는 공장 코드: ${code}`,
          value: String(value)
        });
      }
    });

    return errors;
  }

  // ========================================
  // Helper Methods
  // ========================================

  _hasValue(value) {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  }

  _parseNumber(value) {
    if (value === undefined || value === null || value === '') return NaN;
    const cleaned = String(value).replace(/,/g, '').trim();
    return parseFloat(cleaned);
  }

  _parseDate(value) {
    if (!value) return null;
    const str = String(value).trim();

    // Handle MM/DD format
    if (/^\d{1,2}\/\d{1,2}$/.test(str)) {
      const [month, day] = str.split('/').map(Number);
      const year = new Date().getFullYear();
      return new Date(year, month - 1, day);
    }

    // Handle YYYY.MM.DD or YYYY-MM-DD format
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  _generateSummary() {
    const { total, valid, critical, warning, info } = this.stats;
    const errorRate = total > 0 ? ((total - valid) / total * 100).toFixed(1) : 0;

    return {
      totalRows: total,
      validRows: valid,
      errorRows: total - valid,
      errorRate: `${errorRate}%`,
      bySeverity: {
        critical,
        warning,
        info
      },
      isAcceptable: critical === 0 && (warning / total) < 0.1
    };
  }

  // ========================================
  // Export Methods
  // ========================================

  /**
   * Export errors to CSV format
   * @returns {string} CSV content
   */
  toCSV() {
    const headers = ['Row', 'Field', 'Severity', 'Code', 'Message', 'Value'];
    const rows = this.errors.map(e => [
      e.row,
      e.field,
      e.severity,
      e.code,
      `"${e.message.replace(/"/g, '""')}"`,
      `"${String(e.value).replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Get errors grouped by severity
   * @returns {Object} Errors grouped by severity
   */
  getErrorsBySeverity() {
    return {
      critical: this.errors.filter(e => e.severity === SEVERITY.CRITICAL),
      warning: this.errors.filter(e => e.severity === SEVERITY.WARNING),
      info: this.errors.filter(e => e.severity === SEVERITY.INFO)
    };
  }

  /**
   * Get errors for a specific row
   * @param {number} rowNumber - Row number
   * @returns {Array} Errors for the row
   */
  getErrorsForRow(rowNumber) {
    return this.errors.filter(e => e.row === rowNumber);
  }
}

// ========================================
// Singleton Export
// ========================================

export const dataValidator = new DataValidator();

export default DataValidator;

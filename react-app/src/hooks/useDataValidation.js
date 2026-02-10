/**
 * @fileoverview Data Validation Hook
 * Provides validation state and actions for production data.
 *
 * @module hooks/useDataValidation
 */

import { useState, useCallback, useMemo } from 'react';
import DataValidator, { dataValidator } from '../services/dataValidator';

/**
 * useDataValidation - Hook for managing data validation state
 * @param {Object} options - Validation options
 * @returns {Object} Validation state and actions
 */
export function useDataValidation(options = {}) {
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Validate orders data
   * @param {Array} orders - Orders to validate
   * @param {Object} dynamicColumnMap - Dynamic column mapping
   */
  const validate = useCallback((orders, dynamicColumnMap = {}) => {
    if (!orders || orders.length === 0) {
      setValidationResult(null);
      return null;
    }

    setIsValidating(true);

    try {
      const validator = new DataValidator(options);
      const result = validator.validate(orders, { dynamicColumnMap });

      // Add CSV export function to result
      result.toCSV = () => validator.toCSV();
      result.getErrorsBySeverity = () => validator.getErrorsBySeverity();

      setValidationResult(result);
      return result;
    } catch (error) {
      console.error('[useDataValidation] Validation error:', error);
      setValidationResult({
        isValid: false,
        errors: [{
          row: 0,
          field: 'system',
          severity: 'critical',
          code: 'VALIDATION_ERROR',
          message: `검증 중 오류 발생: ${error.message}`,
          value: ''
        }],
        stats: { total: orders.length, valid: 0, critical: 1, warning: 0, info: 0 },
        summary: { errorRate: '100%', isAcceptable: false }
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [options]);

  /**
   * Download validation errors as CSV
   */
  const downloadCSV = useCallback(() => {
    if (!validationResult || !validationResult.toCSV) return;

    const csv = validationResult.toCSV();
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `validation_errors_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [validationResult]);

  /**
   * Clear validation result
   */
  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  /**
   * Get filtered orders (excluding critical errors)
   */
  const getValidOrders = useCallback((orders) => {
    if (!validationResult) return orders;

    const criticalRows = new Set(
      validationResult.errors
        .filter(e => e.severity === 'critical')
        .map(e => e.row)
    );

    return orders.filter((_, index) => !criticalRows.has(index + 2));
  }, [validationResult]);

  /**
   * Validation summary for display
   */
  const summary = useMemo(() => {
    if (!validationResult) return null;

    const { stats, isValid } = validationResult;
    return {
      isValid,
      totalRows: stats.total,
      validRows: stats.valid,
      criticalCount: stats.critical,
      warningCount: stats.warning,
      infoCount: stats.info,
      errorRate: stats.total > 0
        ? ((stats.total - stats.valid) / stats.total * 100).toFixed(1) + '%'
        : '0%'
    };
  }, [validationResult]);

  return {
    validationResult,
    isValidating,
    summary,
    validate,
    downloadCSV,
    clearValidation,
    getValidOrders
  };
}

export default useDataValidation;

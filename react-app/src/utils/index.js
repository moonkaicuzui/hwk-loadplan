/**
 * @fileoverview Utils Index
 * Exports all utility functions from a single entry point.
 *
 * @module utils
 */

export * from './dateUtils';
export * from './orderUtils';
// Export all from formatters except formatDate (to avoid conflict with dateUtils.formatDate)
export {
  formatNumber,
  formatDecimal,
  formatPercent,
  formatCurrency,
  formatCompact,
  formatQuantity,
  formatFileSize,
  formatDuration,
  truncateText,
  capitalize,
  formatStatus,
  escapeHtml,
  formatDisplayDate
} from './formatters';
export * from './groupingUtils';
export * from './security';

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, deepClone(value)])
  );
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;

  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generate unique ID
 * @param {string} prefix - Optional prefix
 * @returns {string} Unique ID
 */
export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Group array items by key
 * @param {Object[]} array - Array to group
 * @param {string|Function} key - Key to group by
 * @returns {Object} Grouped object
 */
export function groupBy(array, key) {
  if (!Array.isArray(array)) return {};

  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

/**
 * Sort array by multiple keys
 * @param {Object[]} array - Array to sort
 * @param {Object[]} keys - Sort keys [{key: 'name', order: 'asc'}, ...]
 * @returns {Object[]} Sorted array
 */
export function sortByMultiple(array, keys) {
  if (!Array.isArray(array) || !Array.isArray(keys)) return array;

  return [...array].sort((a, b) => {
    for (const { key, order = 'asc' } of keys) {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal === bVal) continue;

      const comparison = aVal < bVal ? -1 : 1;
      return order === 'asc' ? comparison : -comparison;
    }
    return 0;
  });
}

/**
 * Calculate sum of array values
 * @param {number[]} array - Array of numbers
 * @param {string} key - Optional key for object arrays
 * @returns {number} Sum
 */
export function sum(array, key) {
  if (!Array.isArray(array) || array.length === 0) return 0;

  return array.reduce((total, item) => {
    const value = key ? item[key] : item;
    return total + (typeof value === 'number' ? value : 0);
  }, 0);
}

/**
 * Calculate average of array values
 * @param {number[]} array - Array of numbers
 * @param {string} key - Optional key for object arrays
 * @returns {number} Average
 */
export function average(array, key) {
  if (!Array.isArray(array) || array.length === 0) return 0;

  return sum(array, key) / array.length;
}

/**
 * Get unique values from array
 * @param {*[]} array - Array with possible duplicates
 * @param {string} key - Optional key for object arrays
 * @returns {*[]} Array with unique values
 */
export function unique(array, key) {
  if (!Array.isArray(array)) return [];

  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  return [...new Set(array)];
}

/**
 * Safe JSON parse
 * @param {string} json - JSON string
 * @param {*} defaultValue - Default value on error
 * @returns {*} Parsed value or default
 */
export function safeJsonParse(json, defaultValue = null) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Local storage wrapper with JSON support
 */
export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      return false;
    }
  }
};

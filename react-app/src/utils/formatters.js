/**
 * @fileoverview Formatting Utility Functions
 * Number, percentage, and text formatting utilities.
 *
 * @module utils/formatters
 */

/**
 * Format number with locale-specific separators
 * @param {number} value - Number to format
 * @param {string} locale - Locale string (default: 'ko-KR')
 * @returns {string} Formatted number string
 */
export function formatNumber(value, locale = 'ko-KR') {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }

  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format number with fixed decimal places
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places
 * @param {string} locale - Locale string
 * @returns {string} Formatted number string
 */
export function formatDecimal(value, decimals = 2, locale = 'ko-KR') {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format percentage
 * @param {number} value - Value (0-100 or 0-1)
 * @param {number} decimals - Decimal places (default: 1)
 * @param {boolean} isRatio - True if value is 0-1 ratio
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, decimals = 1, isRatio = false) {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }

  const percent = isRatio ? value * 100 : value;
  return `${percent.toFixed(decimals)}%`;
}

/**
 * Format currency
 * @param {number} value - Currency value
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale string
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = 'USD', locale = 'en-US') {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(value);
}

/**
 * Format large numbers with abbreviation
 * @param {number} value - Number to format
 * @param {number} decimals - Decimal places
 * @returns {string} Abbreviated number (e.g., "1.2K", "3.4M")
 */
export function formatCompact(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }

  if (value < 1000) {
    return String(value);
  }

  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const tier = Math.floor(Math.log10(Math.abs(value)) / 3);

  if (tier >= suffixes.length) {
    return value.toExponential(decimals);
  }

  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = value / scale;

  return scaled.toFixed(decimals).replace(/\.0+$/, '') + suffix;
}

/**
 * Format quantity with unit
 * @param {number} value - Quantity value
 * @param {string} unit - Unit suffix (default: '족')
 * @returns {string} Formatted quantity
 */
export function formatQuantity(value, unit = '족') {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }

  return `${formatNumber(value)}${unit}`;
}

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  if (!bytes || isNaN(bytes)) return '-';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format duration in milliseconds to readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export function formatDuration(ms) {
  if (!ms || isNaN(ms)) return '-';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}일 ${hours % 24}시간`;
  }
  if (hours > 0) {
    return `${hours}시간 ${minutes % 60}분`;
  }
  if (minutes > 0) {
    return `${minutes}분 ${seconds % 60}초`;
  }
  return `${seconds}초`;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength, suffix = '...') {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalize first letter
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Format status text for display
 * @param {string} status - Status code
 * @param {string} lang - Language code
 * @returns {string} Formatted status text
 */
export function formatStatus(status, lang = 'ko') {
  const statusLabels = {
    completed: { ko: '완료', en: 'Completed', vi: 'Hoàn thành' },
    partial: { ko: '진행중', en: 'In Progress', vi: 'Đang tiến hành' },
    pending: { ko: '대기', en: 'Pending', vi: 'Chờ xử lý' },
    shipped: { ko: '선적완료', en: 'Shipped', vi: 'Đã giao' },
    delayed: { ko: '지연', en: 'Delayed', vi: 'Trễ hạn' },
    warning: { ko: '경고', en: 'Warning', vi: 'Cảnh báo' },
    critical: { ko: '긴급', en: 'Critical', vi: 'Khẩn cấp' }
  };

  const labels = statusLabels[status];
  if (!labels) return status;

  return labels[lang] || labels['ko'];
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  if (!text) return '';

  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return String(text).replace(/[&<>"']/g, char => htmlEntities[char]);
}

/**
 * Format date for display using locale-aware formatting
 * Note: For date parsing and custom format strings (YYYY.MM.DD), use dateUtils.formatDate
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'iso', 'datetime')
 * @param {string} locale - Locale string
 * @returns {string} Formatted date string
 */
export function formatDisplayDate(date, format = 'short', locale = 'ko-KR') {
  if (!date) return '-';

  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '-';

    switch (format) {
      case 'iso':
        return d.toISOString().split('T')[0];
      case 'long':
        return new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(d);
      case 'datetime':
        return new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).format(d);
      case 'short':
      default:
        return new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(d);
    }
  } catch (e) {
    return '-';
  }
}

// Backward compatibility: re-export formatDisplayDate as formatDate
// Note: When importing from utils/index.js, use formatDisplayDate to avoid conflict with dateUtils.formatDate
export { formatDisplayDate as formatDate };

export default {
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
};

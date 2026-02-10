/**
 * @fileoverview Date Utility Functions
 * Handles CRD/SDD date parsing and calculations.
 *
 * @module utils/dateUtils
 */

/**
 * Convert Excel serial date to JavaScript Date
 * Excel dates are days since Jan 1, 1900 (with Lotus 123 bug correction)
 * @param {number} serial - Excel serial date number
 * @returns {Date} Date object
 */
function excelSerialToDate(serial) {
  // Excel's epoch is Jan 1, 1900, but it incorrectly treats 1900 as a leap year
  // So we need to subtract 1 for dates after Feb 28, 1900
  const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
  const msPerDay = 24 * 60 * 60 * 1000;
  return new Date(excelEpoch.getTime() + serial * msPerDay);
}

/**
 * Parse date string to Date object
 * Supports formats: YYYY.MM.DD, YYYY-MM-DD, YYYY/MM/DD, MM/DD, Excel serial numbers
 * @param {string|number|Date} dateStr - Date string, number, or Date object
 * @returns {Date|null} Date object or null if invalid
 */
export function parseDate(dateStr) {
  if (!dateStr || dateStr === '00:00:00' || dateStr === '') {
    return null;
  }

  // Already a Date object
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? null : dateStr;
  }

  try {
    const strValue = String(dateStr).trim();

    // Skip sub-header values and invalid strings
    if (['original', 'current', 'plan', 'actual', 'total'].includes(strValue.toLowerCase()) ||
        strValue.toUpperCase().startsWith('TOTAL')) {
      return null;
    }

    // Handle Excel serial date (number)
    if (typeof dateStr === 'number') {
      // Excel serial dates are typically > 1 and < 100000
      if (dateStr > 1 && dateStr < 100000) {
        return excelSerialToDate(dateStr);
      }
      return null;
    }

    // Handle numeric string (Excel serial)
    const numValue = parseFloat(strValue);
    if (!isNaN(numValue) && numValue > 1 && numValue < 100000 && String(numValue) === strValue) {
      return excelSerialToDate(numValue);
    }

    // Handle MM/DD format (like "02/23", "03/15") - add current year
    const mmddMatch = strValue.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (mmddMatch) {
      const month = parseInt(mmddMatch[1], 10);
      const day = parseInt(mmddMatch[2], 10);
      const currentYear = new Date().getFullYear();
      // If month/day seems valid, create date with current year
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return new Date(currentYear, month - 1, day);
      }
      return null;
    }

    // Handle MM-DD format (like "02-23", "03-15") - add current year
    const mmddDashMatch = strValue.match(/^(\d{1,2})-(\d{1,2})$/);
    if (mmddDashMatch) {
      const month = parseInt(mmddDashMatch[1], 10);
      const day = parseInt(mmddDashMatch[2], 10);
      const currentYear = new Date().getFullYear();
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return new Date(currentYear, month - 1, day);
      }
      return null;
    }

    // Handle YYYY.MM.DD format explicitly
    const ymdDotMatch = strValue.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
    if (ymdDotMatch) {
      const year = parseInt(ymdDotMatch[1], 10);
      const month = parseInt(ymdDotMatch[2], 10);
      const day = parseInt(ymdDotMatch[3], 10);
      if (year >= 2020 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return new Date(year, month - 1, day);
      }
      return null;
    }

    // Normalize separators to dashes for standard parsing
    const normalized = strValue.replace(/\./g, '-').replace(/\//g, '-');

    // Skip dates that start with 1900 (Excel default for empty dates)
    if (normalized.startsWith('1900-')) {
      return null;
    }

    const date = new Date(normalized);

    // Validate the date
    if (isNaN(date.getTime())) {
      return null;
    }

    // Sanity check: dates should be reasonable (2020 - 2100 for production data)
    const year = date.getFullYear();
    if (year < 2020 || year > 2100) {
      return null;
    }

    return date;
  } catch (e) {
    console.warn('Date parsing error:', e);
    return null;
  }
}

/**
 * Format date to string
 * @param {Date|string} date - Date object or string
 * @param {string} format - Output format ('YYYY.MM.DD', 'YYYY-MM-DD', 'MM/DD', etc.)
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'YYYY.MM.DD') {
  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return '-';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`;
    case 'MM/DD':
      return `${month}/${day}`;
    case 'MM.DD':
      return `${month}.${day}`;
    case 'YYYY.MM':
      return `${year}.${month}`;
    case 'YYYY-MM':
      return `${year}-${month}`;
    default:
      return `${year}.${month}.${day}`;
  }
}

/**
 * Get year-month string from date
 * @param {Date|string} date - Date object or string
 * @returns {string} YYYY.MM format
 */
export function getYearMonth(date) {
  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}.${month}`;
}

/**
 * Calculate difference in days between two dates
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} Difference in days (positive if date2 > date1)
 */
export function getDaysDifference(date1, date2) {
  const d1 = date1 instanceof Date ? date1 : parseDate(date1);
  const d2 = date2 instanceof Date ? date2 : parseDate(date2);

  if (!d1 || !d2) return 0;

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((d2.getTime() - d1.getTime()) / msPerDay);
}

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 */
export function isToday(date) {
  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return false;

  const today = new Date();
  return d.toDateString() === today.toDateString();
}

/**
 * Check if date is within a week from today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if within a week
 */
export function isWithinWeek(date) {
  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekLater = new Date(today);
  weekLater.setDate(weekLater.getDate() + 7);

  return d >= today && d <= weekLater;
}

/**
 * Check if date is in current month
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if in current month
 */
export function isCurrentMonth(date) {
  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return false;

  const today = new Date();
  return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
}

/**
 * Check if date falls within a range
 * @param {Date|string} date - Date to check
 * @param {Date|string} startDate - Range start
 * @param {Date|string} endDate - Range end
 * @returns {boolean} True if within range
 */
export function isWithinRange(date, startDate, endDate) {
  const d = date instanceof Date ? date : parseDate(date);
  const start = startDate instanceof Date ? startDate : parseDate(startDate);
  const end = endDate instanceof Date ? endDate : parseDate(endDate);

  if (!d) return false;

  const afterStart = !start || d >= start;
  const beforeEnd = !end || d <= end;

  return afterStart && beforeEnd;
}

/**
 * Get relative time description
 * @param {Date|string} date - Date to describe
 * @returns {string} Relative time description (e.g., "3일 전", "내일")
 */
export function getRelativeTime(date) {
  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return '-';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(d);
  targetDate.setHours(0, 0, 0, 0);

  const diffDays = getDaysDifference(today, targetDate);

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '내일';
  if (diffDays === -1) return '어제';
  if (diffDays > 1 && diffDays <= 7) return `${diffDays}일 후`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)}일 전`;
  if (diffDays > 7) return `${Math.ceil(diffDays / 7)}주 후`;
  if (diffDays < -7) return `${Math.ceil(Math.abs(diffDays) / 7)}주 전`;

  return formatDate(d);
}

/**
 * Get list of months between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {string[]} Array of YYYY.MM strings
 */
export function getMonthsBetween(startDate, endDate) {
  const start = startDate instanceof Date ? startDate : parseDate(startDate);
  const end = endDate instanceof Date ? endDate : parseDate(endDate);

  if (!start || !end) return [];

  const months = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end) {
    months.push(getYearMonth(current));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

export default {
  parseDate,
  formatDate,
  getYearMonth,
  getDaysDifference,
  isToday,
  isWithinWeek,
  isCurrentMonth,
  isWithinRange,
  getRelativeTime,
  getMonthsBetween
};

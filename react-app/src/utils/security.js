/**
 * @fileoverview Security Utilities
 * Input sanitization, validation, and security helpers.
 *
 * @module utils/security
 */

// ========================================
// HTML Sanitization
// ========================================

/**
 * Escape HTML entities to prevent XSS attacks
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') str = String(str);

  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  return str.replace(/[&<>"'`=/]/g, char => htmlEscapes[char]);
}

/**
 * Sanitize user input by removing potentially dangerous content
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') return String(input);

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Remove control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize filename to prevent path traversal attacks
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return '';

  // Remove path traversal sequences
  let sanitized = filename.replace(/\.\./g, '');

  // Remove directory separators
  sanitized = sanitized.replace(/[/\\]/g, '');

  // Remove special characters that could be problematic
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1F]/g, '');

  // Trim whitespace and dots from start/end
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');

  return sanitized || 'unnamed';
}

// ========================================
// Input Validation
// ========================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate that a value is within expected bounds
 * @param {number} value - Value to check
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if value is within bounds
 */
export function isWithinBounds(value, min, max) {
  if (typeof value !== 'number' || isNaN(value)) return false;
  return value >= min && value <= max;
}

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} maxLength - Maximum allowed length
 * @param {number} minLength - Minimum allowed length
 * @returns {boolean} True if string length is valid
 */
export function isValidLength(str, maxLength = 1000, minLength = 0) {
  if (str === null || str === undefined) return minLength === 0;
  if (typeof str !== 'string') return false;
  return str.length >= minLength && str.length <= maxLength;
}

/**
 * Validate and sanitize search query
 * @param {string} query - Search query to validate
 * @param {number} maxLength - Maximum query length
 * @returns {string} Sanitized query
 */
export function sanitizeSearchQuery(query, maxLength = 200) {
  if (!query || typeof query !== 'string') return '';

  // Sanitize basic input
  let sanitized = sanitizeInput(query);

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

// ========================================
// localStorage Security
// ========================================

/**
 * Validate and safely get data from localStorage with schema validation
 * @param {string} key - Storage key
 * @param {Object} schema - Schema for validation { type, properties, default }
 * @returns {*} Validated data or default value
 */
export function safeStorageGet(key, schema = {}) {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return schema.default ?? null;

    const parsed = JSON.parse(stored);

    // Type validation
    if (schema.type) {
      if (schema.type === 'array' && !Array.isArray(parsed)) {
        console.warn(`[Security] Storage key "${key}" expected array, got ${typeof parsed}`);
        return schema.default ?? [];
      }
      if (schema.type === 'object' && (typeof parsed !== 'object' || Array.isArray(parsed))) {
        console.warn(`[Security] Storage key "${key}" expected object, got ${typeof parsed}`);
        return schema.default ?? {};
      }
    }

    // Property validation for objects
    if (schema.properties && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const validated = {};
      for (const [prop, propSchema] of Object.entries(schema.properties)) {
        if (parsed.hasOwnProperty(prop)) {
          const value = parsed[prop];
          const expectedType = propSchema.type;

          if (expectedType === 'number' && typeof value === 'number' && !isNaN(value)) {
            validated[prop] = value;
          } else if (expectedType === 'string' && typeof value === 'string') {
            validated[prop] = sanitizeInput(value);
          } else if (expectedType === 'boolean' && typeof value === 'boolean') {
            validated[prop] = value;
          } else {
            validated[prop] = propSchema.default;
          }
        } else {
          validated[prop] = propSchema.default;
        }
      }
      return validated;
    }

    return parsed;
  } catch (e) {
    console.error(`[Security] Failed to parse storage key "${key}":`, e.message);
    return schema.default ?? null;
  }
}

/**
 * Safely set data to localStorage with size limits
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @param {number} maxSize - Maximum size in bytes (default 100KB)
 * @returns {boolean} True if stored successfully
 */
export function safeStorageSet(key, value, maxSize = 100 * 1024) {
  try {
    const serialized = JSON.stringify(value);

    // Check size limit
    if (serialized.length > maxSize) {
      console.warn(`[Security] Storage value for "${key}" exceeds max size (${serialized.length} > ${maxSize})`);
      return false;
    }

    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    console.error(`[Security] Failed to store "${key}":`, e.message);
    return false;
  }
}

// ========================================
// URL Security
// ========================================

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate
 * @param {string[]} allowedProtocols - Allowed protocols
 * @returns {string|null} Sanitized URL or null if invalid
 */
export function sanitizeUrl(url, allowedProtocols = ['https:', 'http:']) {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url);

    // Check protocol
    if (!allowedProtocols.includes(parsed.protocol)) {
      console.warn(`[Security] URL protocol "${parsed.protocol}" not allowed`);
      return null;
    }

    // Remove potentially dangerous parts
    parsed.username = '';
    parsed.password = '';

    return parsed.toString();
  } catch (e) {
    // Not a valid URL
    return null;
  }
}

/**
 * Check if URL is from a trusted domain
 * @param {string} url - URL to check
 * @param {string[]} trustedDomains - List of trusted domains
 * @returns {boolean} True if URL is from a trusted domain
 */
export function isTrustedDomain(url, trustedDomains = []) {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);
    return trustedDomains.some(domain =>
      parsed.hostname === domain ||
      parsed.hostname.endsWith('.' + domain)
    );
  } catch (e) {
    return false;
  }
}

// ========================================
// Content Security
// ========================================

/**
 * Strip all HTML tags from a string
 * @param {string} html - HTML string to strip
 * @returns {string} Plain text without HTML tags
 */
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';

  // Use a temporary element to parse and extract text
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

/**
 * Validate that content does not contain script tags or event handlers
 * @param {string} content - Content to validate
 * @returns {boolean} True if content appears safe
 */
export function isContentSafe(content) {
  if (!content || typeof content !== 'string') return true;

  const dangerousPatterns = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i,  // Event handlers like onclick=
    /data:\s*text\/html/i,
    /<iframe\b/i,
    /<object\b/i,
    /<embed\b/i,
    /<form\b/i
  ];

  return !dangerousPatterns.some(pattern => pattern.test(content));
}

// ========================================
// Export default
// ========================================

export default {
  escapeHtml,
  sanitizeInput,
  sanitizeFilename,
  isValidEmail,
  isWithinBounds,
  isValidLength,
  sanitizeSearchQuery,
  safeStorageGet,
  safeStorageSet,
  sanitizeUrl,
  isTrustedDomain,
  stripHtml,
  isContentSafe
};

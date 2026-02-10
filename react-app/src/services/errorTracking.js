/**
 * @fileoverview Error Tracking Service
 * Centralized error tracking and logging
 */

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Error categories
export const ERROR_CATEGORY = {
  NETWORK: 'network',
  DATA: 'data',
  UI: 'ui',
  AUTH: 'auth',
  CACHE: 'cache',
  UNKNOWN: 'unknown'
};

class ErrorTrackingService {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.listeners = new Set();
  }

  /**
   * Track an error
   */
  track(error, context = {}) {
    const errorEntry = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message || String(error),
      stack: error.stack,
      category: context.category || ERROR_CATEGORY.UNKNOWN,
      severity: context.severity || ERROR_SEVERITY.MEDIUM,
      component: context.component,
      action: context.action,
      metadata: context.metadata || {},
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.errors.unshift(errorEntry);

    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(errorEntry));

    // Console log in development
    if (import.meta.env.DEV) {
      console.error('[ErrorTracking]', errorEntry);
    }

    return errorEntry.id;
  }

  /**
   * Subscribe to error events
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count = 10) {
    return this.errors.slice(0, count);
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category) {
    return this.errors.filter(e => e.category === category);
  }

  /**
   * Clear all errors
   */
  clear() {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  getStats() {
    const stats = {
      total: this.errors.length,
      byCategory: {},
      bySeverity: {}
    };

    this.errors.forEach(error => {
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }
}

export const errorTracking = new ErrorTrackingService();

// Global error handler
window.addEventListener('error', (event) => {
  errorTracking.track(event.error || new Error(event.message), {
    category: ERROR_CATEGORY.UNKNOWN,
    severity: ERROR_SEVERITY.HIGH,
    component: 'window',
    action: 'unhandled_error'
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  errorTracking.track(event.reason || new Error('Unhandled promise rejection'), {
    category: ERROR_CATEGORY.UNKNOWN,
    severity: ERROR_SEVERITY.HIGH,
    component: 'promise',
    action: 'unhandled_rejection'
  });
});

export default errorTracking;

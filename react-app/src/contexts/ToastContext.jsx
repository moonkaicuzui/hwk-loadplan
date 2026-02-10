/**
 * @fileoverview Toast Context
 * Global toast notification management with support for
 * multiple toast types, actions, stacking, and auto-dismiss.
 *
 * @module contexts/ToastContext
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react';

// ========================================
// Toast Context
// ========================================

const ToastContext = createContext(null);

// ========================================
// Toast Provider
// ========================================

/**
 * Toast Provider Component
 * Manages global toast state and provides toast methods to children.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {number} [props.maxToasts=5] - Maximum number of toasts to display
 * @param {string} [props.position='bottom-right'] - Toast container position
 */
export function ToastProvider({ children, maxToasts = 5, position = 'bottom-right' }) {
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0);
  const timeoutRefs = useRef({});

  /**
   * Add a new toast notification
   * @param {string} message - Toast message
   * @param {Object} options - Toast options
   * @param {string} [options.type='info'] - Toast type (success, error, warning, info)
   * @param {number} [options.duration=5000] - Auto-dismiss duration in ms (0 = no auto-dismiss)
   * @param {Object} [options.action] - Action button configuration
   * @param {string} options.action.label - Action button label
   * @param {Function} options.action.onClick - Action button click handler
   * @param {boolean} [options.dismissible=true] - Whether toast can be dismissed
   * @param {string} [options.title] - Optional toast title
   * @returns {string} Toast ID
   */
  const addToast = useCallback((message, options = {}) => {
    const id = `toast_${Date.now()}_${toastIdCounter.current++}`;
    const toast = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration ?? 5000,
      action: options.action || null,
      dismissible: options.dismissible !== false,
      title: options.title || null,
      createdAt: Date.now(),
    };

    setToasts(prev => {
      // Limit the number of toasts
      const newToasts = [...prev, toast];
      if (newToasts.length > maxToasts) {
        // Remove oldest toasts if we exceed the limit
        const toastsToRemove = newToasts.slice(0, newToasts.length - maxToasts);
        toastsToRemove.forEach(t => {
          if (timeoutRefs.current[t.id]) {
            clearTimeout(timeoutRefs.current[t.id]);
            delete timeoutRefs.current[t.id];
          }
        });
        return newToasts.slice(-maxToasts);
      }
      return newToasts;
    });

    // Auto remove after duration
    if (toast.duration > 0) {
      timeoutRefs.current[id] = setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, [maxToasts]);

  /**
   * Remove a toast by ID
   * @param {string} id - Toast ID to remove
   */
  const removeToast = useCallback((id) => {
    // Clear the timeout if it exists
    if (timeoutRefs.current[id]) {
      clearTimeout(timeoutRefs.current[id]);
      delete timeoutRefs.current[id];
    }
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * Remove all toasts
   */
  const clearAllToasts = useCallback(() => {
    // Clear all timeouts
    Object.keys(timeoutRefs.current).forEach(id => {
      clearTimeout(timeoutRefs.current[id]);
    });
    timeoutRefs.current = {};
    setToasts([]);
  }, []);

  /**
   * Update a toast by ID
   * @param {string} id - Toast ID to update
   * @param {Object} updates - Properties to update
   */
  const updateToast = useCallback((id, updates) => {
    setToasts(prev => prev.map(toast =>
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  }, []);

  // Convenience methods for different toast types
  const success = useCallback((message, options = {}) =>
    addToast(message, { ...options, type: 'success' }), [addToast]);

  const error = useCallback((message, options = {}) =>
    addToast(message, { ...options, type: 'error', duration: options.duration ?? 8000 }), [addToast]);

  const warning = useCallback((message, options = {}) =>
    addToast(message, { ...options, type: 'warning', duration: options.duration ?? 6000 }), [addToast]);

  const info = useCallback((message, options = {}) =>
    addToast(message, { ...options, type: 'info' }), [addToast]);

  /**
   * Show a promise-based toast that updates based on promise state
   * @param {Promise} promise - Promise to track
   * @param {Object} messages - Messages for different states
   * @param {string} messages.loading - Loading message
   * @param {string|Function} messages.success - Success message or function(data) => string
   * @param {string|Function} messages.error - Error message or function(error) => string
   * @param {Object} [options] - Additional toast options
   * @returns {Promise} The original promise
   */
  const promise = useCallback(async (promiseOrFn, messages, options = {}) => {
    const id = addToast(messages.loading || 'Loading...', {
      ...options,
      type: 'info',
      duration: 0, // Don't auto-dismiss while loading
      dismissible: false,
    });

    try {
      const result = typeof promiseOrFn === 'function' ? await promiseOrFn() : await promiseOrFn;
      const successMessage = typeof messages.success === 'function'
        ? messages.success(result)
        : messages.success || 'Success';

      updateToast(id, {
        message: successMessage,
        type: 'success',
        duration: options.duration ?? 5000,
        dismissible: true,
      });

      // Set up auto-dismiss for success
      if ((options.duration ?? 5000) > 0) {
        timeoutRefs.current[id] = setTimeout(() => {
          removeToast(id);
        }, options.duration ?? 5000);
      }

      return result;
    } catch (err) {
      const errorMessage = typeof messages.error === 'function'
        ? messages.error(err)
        : messages.error || err.message || 'An error occurred';

      updateToast(id, {
        message: errorMessage,
        type: 'error',
        duration: options.duration ?? 8000,
        dismissible: true,
      });

      // Set up auto-dismiss for error
      if ((options.duration ?? 8000) > 0) {
        timeoutRefs.current[id] = setTimeout(() => {
          removeToast(id);
        }, options.duration ?? 8000);
      }

      throw err;
    }
  }, [addToast, updateToast, removeToast]);

  const contextValue = {
    toasts,
    position,
    addToast,
    removeToast,
    clearAllToasts,
    updateToast,
    success,
    error,
    warning,
    info,
    promise,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}

// ========================================
// Toast Hook
// ========================================

/**
 * Hook to access toast functionality
 * @returns {Object} Toast context methods
 * @throws {Error} If used outside ToastProvider
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;

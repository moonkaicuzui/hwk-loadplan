/**
 * @fileoverview Toast Notification Component
 * Enhanced toast notification system with support for:
 * - Multiple toast types (success, error, warning, info)
 * - Auto-dismiss with configurable duration
 * - Action buttons in toasts
 * - Stacked multiple toasts
 * - Smooth enter/exit animations
 * - Promise-based toasts for async operations
 *
 * @module components/common/Toast
 */

// Re-export from context for convenience
export { ToastProvider, useToast } from '../../contexts/ToastContext';
export { ToastContainer } from './ToastContainer';

// ========================================
// Standalone Toast (without provider)
// For use outside React components or legacy code
// ========================================

let toastContainer = null;
let toastIdCounter = 0;

/**
 * Standalone toast function for use outside React context
 * Creates a DOM-based toast notification
 *
 * @param {string} message - Toast message
 * @param {string} [type='info'] - Toast type (success, error, warning, info)
 * @param {number} [duration=5000] - Auto-dismiss duration in ms
 * @param {Object} [options] - Additional options
 * @param {Object} [options.action] - Action button configuration
 * @param {string} [options.action.label] - Action button label
 * @param {Function} [options.action.onClick] - Action button callback
 * @returns {string} Toast ID
 */
export function showToast(message, type = 'info', duration = 5000, options = {}) {
  // Create container if it doesn't exist
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none';
    toastContainer.id = 'standalone-toast-container';
    document.body.appendChild(toastContainer);

    // Add styles for animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes toast-slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes toast-slide-out {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      @keyframes toast-progress-standalone {
        from { width: 100%; }
        to { width: 0%; }
      }
      .toast-standalone-enter {
        animation: toast-slide-in 0.3s ease-out forwards;
      }
      .toast-standalone-exit {
        animation: toast-slide-out 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
  }

  const id = `standalone-toast-${Date.now()}-${toastIdCounter++}`;

  // Type-based styling
  const typeStyles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: `<svg class="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>`,
      progress: 'bg-green-500',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: `<svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>`,
      progress: 'bg-red-500',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: `<svg class="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`,
      progress: 'bg-amber-500',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: `<svg class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>`,
      progress: 'bg-blue-500',
    },
  };

  const style = typeStyles[type] || typeStyles.info;

  const toastEl = document.createElement('div');
  toastEl.id = id;
  toastEl.className = `
    pointer-events-auto w-80 max-w-[calc(100vw-2rem)]
    rounded-lg border shadow-lg backdrop-blur-sm overflow-hidden
    ${style.bg} ${style.border}
    toast-standalone-enter
  `;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

  // Build action button HTML if provided (escape label to prevent XSS)
  const actionHtml = options.action
    ? `<button class="mt-2 text-sm font-medium underline-offset-2 hover:underline text-${type === 'success' ? 'green' : type === 'error' ? 'red' : type === 'warning' ? 'amber' : 'blue'}-600 dark:text-${type === 'success' ? 'green' : type === 'error' ? 'red' : type === 'warning' ? 'amber' : 'blue'}-400 toast-action-btn">${escapeHtml(options.action.label || '')}</button>`
    : '';

  // Build progress bar HTML if duration > 0
  const progressHtml = duration > 0
    ? `<div class="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5">
        <div class="h-full ${style.progress}" style="animation: toast-progress-standalone ${duration}ms linear forwards"></div>
      </div>`
    : '';

  toastEl.innerHTML = `
    <div class="p-4">
      <div class="flex items-start gap-3">
        <span class="flex-shrink-0 mt-0.5">${style.icon}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-700 dark:text-gray-300 break-words">${escapeHtml(message)}</p>
          ${actionHtml}
        </div>
        <button class="flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors toast-close-btn" aria-label="Close">
          <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
    ${progressHtml}
  `;

  // Remove function
  const removeToast = () => {
    toastEl.classList.remove('toast-standalone-enter');
    toastEl.classList.add('toast-standalone-exit');
    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.remove();
      }
    }, 300);
  };

  // Close button handler
  toastEl.querySelector('.toast-close-btn').onclick = removeToast;

  // Action button handler
  if (options.action) {
    toastEl.querySelector('.toast-action-btn').onclick = () => {
      options.action.onClick?.();
      removeToast();
    };
  }

  toastContainer.appendChild(toastEl);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (toastEl.parentNode) {
        removeToast();
      }
    }, duration);
  }

  return id;
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') str = String(str);

  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return str.replace(/[&<>"'/]/g, char => htmlEscapes[char]);
}

/**
 * Remove a standalone toast by ID
 * @param {string} id - Toast ID
 */
export function removeStandaloneToast(id) {
  const toast = document.getElementById(id);
  if (toast) {
    toast.classList.remove('toast-standalone-enter');
    toast.classList.add('toast-standalone-exit');
    setTimeout(() => toast.remove(), 300);
  }
}

/**
 * Clear all standalone toasts
 */
export function clearStandaloneToasts() {
  if (toastContainer) {
    toastContainer.innerHTML = '';
  }
}

// Convenience functions for standalone toasts
showToast.success = (message, duration, options) => showToast(message, 'success', duration, options);
showToast.error = (message, duration, options) => showToast(message, 'error', duration ?? 8000, options);
showToast.warning = (message, duration, options) => showToast(message, 'warning', duration ?? 6000, options);
showToast.info = (message, duration, options) => showToast(message, 'info', duration, options);

// Default export for compatibility
export { ToastProvider as default } from '../../contexts/ToastContext';

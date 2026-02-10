/**
 * @fileoverview Toast Container Component
 * Renders all active toasts with animations and positioning.
 *
 * @module components/common/ToastContainer
 */

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useTranslation } from '../../i18n/index.jsx';

// ========================================
// Position Classes
// ========================================

const positionClasses = {
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
};

// ========================================
// Toast Item Component
// ========================================

/**
 * Individual Toast Item with animations
 * @param {Object} props - Component props
 * @param {Object} props.toast - Toast data object
 * @param {Function} props.onRemove - Remove callback
 */
function ToastItem({ toast, onRemove }) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Animate in on mount
  useEffect(() => {
    // Small delay for mount animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation to complete
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  }, [onRemove, toast.id]);

  const handleActionClick = useCallback(() => {
    if (toast.action?.onClick) {
      toast.action.onClick();
    }
    handleRemove();
  }, [toast.action, handleRemove]);

  // Icon components for each type
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  // Background classes for each type
  const bgClasses = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  };

  // Progress bar color classes
  const progressClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  };

  return (
    <div
      className={`
        relative w-80 max-w-[calc(100vw-2rem)] overflow-hidden
        rounded-lg border shadow-lg backdrop-blur-sm
        transform transition-all duration-300 ease-out
        ${bgClasses[toast.type] || bgClasses.info}
        ${isVisible && !isExiting
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <span className="flex-shrink-0 mt-0.5">
            {icons[toast.type] || icons.info}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {toast.title}
              </h4>
            )}
            <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
              {toast.message}
            </p>

            {/* Action Button */}
            {toast.action && (
              <button
                onClick={handleActionClick}
                className={`
                  mt-2 text-sm font-medium underline-offset-2 hover:underline
                  transition-colors
                  ${toast.type === 'success' ? 'text-green-600 dark:text-green-400' : ''}
                  ${toast.type === 'error' ? 'text-red-600 dark:text-red-400' : ''}
                  ${toast.type === 'warning' ? 'text-amber-600 dark:text-amber-400' : ''}
                  ${toast.type === 'info' ? 'text-blue-600 dark:text-blue-400' : ''}
                `}
              >
                {toast.action.label}
              </button>
            )}
          </div>

          {/* Close Button */}
          {toast.dismissible && (
            <button
              onClick={handleRemove}
              className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label={t('common.close')}
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar for auto-dismiss */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5">
          <div
            className={`h-full ${progressClasses[toast.type] || progressClasses.info} transition-all ease-linear`}
            style={{
              animation: `toast-progress ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ========================================
// Toast Container Component
// ========================================

/**
 * Toast Container Component
 * Renders all active toasts in a portal.
 * Uses the ToastContext to get the list of toasts.
 */
export function ToastContainer() {
  const { toasts, removeToast, position } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server or before mount
  if (!mounted) return null;

  // Create portal target
  const portalTarget = document.getElementById('toast-portal') || document.body;

  return createPortal(
    <>
      {/* CSS for progress bar animation */}
      <style>
        {`
          @keyframes toast-progress {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}
      </style>

      {/* Toast Container */}
      <div
        className={`
          fixed z-[9999] flex flex-col gap-3
          pointer-events-none
          ${positionClasses[position] || positionClasses['bottom-right']}
        `}
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </>,
    portalTarget
  );
}

export default ToastContainer;

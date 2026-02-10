/**
 * @fileoverview Keyboard Shortcuts Hook
 * Provides keyboard navigation and shortcuts.
 *
 * @module hooks/useKeyboardShortcuts
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Default keyboard shortcuts
 */
const DEFAULT_SHORTCUTS = {
  'Alt+1': '/',           // Dashboard
  'Alt+2': '/monthly',    // Monthly Overview
  'Alt+3': '/destination',// Destination Analysis
  'Alt+4': '/factory',    // Factory Comparison
  'Alt+5': '/model',      // Model Analysis
  'Alt+6': '/vendor',     // Vendor Analysis
  'Alt+7': '/heatmap',    // Process Heatmap
  'Alt+8': '/data',       // Data Explorer
  'Alt+F': 'focus-filter',// Focus filter input
  'Alt+E': 'export',      // Export data
  'Alt+R': 'refresh',     // Refresh data
  'Escape': 'close-modal' // Close modal
};

/**
 * Hook for keyboard shortcuts
 * @param {Object} options - Hook options
 * @param {Object} options.shortcuts - Custom shortcut mappings
 * @param {Function} options.onAction - Action handler
 * @param {boolean} options.enabled - Whether shortcuts are enabled
 * @returns {Object} Shortcut methods
 */
export function useKeyboardShortcuts(options = {}) {
  const navigate = useNavigate();
  const {
    shortcuts = DEFAULT_SHORTCUTS,
    onAction,
    enabled = true
  } = options;

  /**
   * Get key combination string from event
   */
  const getKeyCombo = useCallback((event) => {
    const parts = [];

    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');

    // Get the key
    let key = event.key;
    if (key === ' ') key = 'Space';
    if (key.length === 1) key = key.toUpperCase();

    parts.push(key);

    return parts.join('+');
  }, []);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Skip if user is typing in an input
    const target = event.target;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      // Allow Escape in inputs
      if (event.key !== 'Escape') return;
    }

    const keyCombo = getKeyCombo(event);
    const action = shortcuts[keyCombo];

    if (!action) return;

    event.preventDefault();

    // Handle navigation shortcuts
    if (action.startsWith('/')) {
      navigate(action);
      return;
    }

    // Handle special actions
    switch (action) {
      case 'focus-filter':
        const filterInput = document.querySelector('[data-filter-input]');
        if (filterInput) filterInput.focus();
        break;

      case 'close-modal':
        const closeBtn = document.querySelector('[data-modal-close]');
        if (closeBtn) closeBtn.click();
        break;

      default:
        // Pass to custom handler
        if (onAction) {
          onAction(action, event);
        }
    }
  }, [enabled, shortcuts, navigate, getKeyCombo, onAction]);

  // Set up event listener
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  /**
   * Get shortcut for action
   */
  const getShortcut = useCallback((action) => {
    return Object.entries(shortcuts).find(([, act]) => act === action)?.[0] || null;
  }, [shortcuts]);

  /**
   * Format shortcut for display
   */
  const formatShortcut = useCallback((shortcut) => {
    if (!shortcut) return '';
    return shortcut
      .replace('Alt+', '⌥')
      .replace('Ctrl+', '⌃')
      .replace('Shift+', '⇧')
      .replace('Meta+', '⌘');
  }, []);

  return {
    getShortcut,
    formatShortcut,
    shortcuts: DEFAULT_SHORTCUTS
  };
}

export default useKeyboardShortcuts;

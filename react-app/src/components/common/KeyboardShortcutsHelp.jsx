/**
 * @fileoverview Keyboard Shortcuts Help Component
 * Displays available keyboard shortcuts in an accessible modal with search functionality.
 *
 * @module components/common/KeyboardShortcutsHelp
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Keyboard, Search, Monitor, Sliders, FileText, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Shortcut category icons mapping
 */
const CATEGORY_ICONS = {
  navigation: Monitor,
  actions: FileText,
  filters: Sliders,
  views: Monitor,
  help: HelpCircle,
};

/**
 * Get keyboard shortcuts with translation keys
 */
const getShortcuts = (t) => [
  {
    category: 'navigation',
    categoryKey: 'shortcuts.categories.navigation',
    items: [
      { keys: ['Alt', '1'], descriptionKey: 'shortcuts.keys.dashboard' },
      { keys: ['Alt', '2'], descriptionKey: 'shortcuts.keys.monthly' },
      { keys: ['Alt', '3'], descriptionKey: 'shortcuts.keys.destination' },
      { keys: ['Alt', '4'], descriptionKey: 'shortcuts.keys.model' },
      { keys: ['Alt', '5'], descriptionKey: 'shortcuts.keys.factory' },
      { keys: ['Alt', '6'], descriptionKey: 'shortcuts.keys.vendor' },
      { keys: ['Alt', '7'], descriptionKey: 'shortcuts.keys.heatmap' },
      { keys: ['Alt', '8'], descriptionKey: 'shortcuts.keys.dataExplorer' },
    ],
  },
  {
    category: 'filters',
    categoryKey: 'shortcuts.categories.filters',
    items: [
      { keys: ['Alt', 'F'], descriptionKey: 'shortcuts.keys.search' },
      { keys: ['/'], descriptionKey: 'shortcuts.keys.quickSearch' },
      { keys: ['Alt', 'R'], descriptionKey: 'shortcuts.keys.resetFilters' },
    ],
  },
  {
    category: 'actions',
    categoryKey: 'shortcuts.categories.actions',
    items: [
      { keys: ['Alt', 'E'], descriptionKey: 'shortcuts.keys.export' },
      { keys: ['Ctrl', 'P'], descriptionKey: 'shortcuts.keys.print' },
      { keys: ['Alt', 'D'], descriptionKey: 'shortcuts.keys.darkMode' },
      { keys: ['F5'], descriptionKey: 'shortcuts.keys.refresh' },
    ],
  },
  {
    category: 'help',
    categoryKey: 'shortcuts.categories.help',
    items: [
      { keys: ['Alt', '?'], descriptionKey: 'shortcuts.keys.help' },
      { keys: ['?'], descriptionKey: 'shortcuts.keys.help' },
      { keys: ['Esc'], descriptionKey: 'shortcuts.keys.escape' },
    ],
  },
];

/**
 * KeyboardShortcutsHelp - Modal showing keyboard shortcuts with search functionality
 */
export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);
  const closeButtonRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);

  // Get shortcuts with translations
  const shortcuts = useMemo(() => getShortcuts(t), [t]);

  // Filter shortcuts based on search query
  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return shortcuts;

    const query = searchQuery.toLowerCase();
    return shortcuts
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const description = t(item.descriptionKey, '').toLowerCase();
          const keys = item.keys.join(' ').toLowerCase();
          return description.includes(query) || keys.includes(query);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [shortcuts, searchQuery, t]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e) => {
      // Open modal with Alt+? or ?
      if (!isOpen && (e.altKey && (e.key === '?' || e.key === '/')) || (e.key === '?' && !e.altKey && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      // Close modal with Escape
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        return;
      }

      // Focus trap when modal is open
      if (isOpen && e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    },
    [isOpen]
  );

  // Set up keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
      setSearchQuery('');
    }
  }, []);

  // Handle close button click
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  if (!isOpen) return null;

  const modalTitleId = 'keyboard-shortcuts-title';
  const modalDescId = 'keyboard-shortcuts-description';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
      aria-describedby={modalDescId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-card rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden animate-slide-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Keyboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 id={modalTitleId} className="text-lg font-semibold text-primary">
                {t('shortcuts.title', '키보드 단축키')}
              </h2>
              <p id={modalDescId} className="text-xs text-secondary">
                {t('shortcuts.description', '빠른 작업을 위한 키보드 단축키입니다')}
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-hover transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={t('common.close', '닫기')}
          >
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-theme">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('shortcuts.search', '단축키 검색...')}
              className="w-full pl-10 pr-4 py-2.5 bg-hover rounded-lg border border-theme text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              aria-label={t('shortcuts.search', '단축키 검색...')}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                aria-label={t('common.clear', '지우기')}
              >
                <X className="w-3 h-3 text-secondary" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-secondary mx-auto mb-3 opacity-50" />
              <p className="text-secondary">
                {t('shortcuts.noResults', '검색 결과가 없습니다')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredShortcuts.map((group, groupIndex) => {
                const CategoryIcon = CATEGORY_ICONS[group.category] || Monitor;
                return (
                  <div key={groupIndex} className="group">
                    <div className="flex items-center gap-2 mb-3">
                      <CategoryIcon className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-semibold text-secondary uppercase tracking-wide">
                        {t(group.categoryKey, group.category)}
                      </h3>
                      <div className="flex-1 h-px bg-theme" />
                    </div>
                    <div className="grid gap-2">
                      {group.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-hover/50 hover:bg-hover transition-colors"
                        >
                          <span className="text-sm text-primary">
                            {t(item.descriptionKey, item.descriptionKey)}
                          </span>
                          <div className="flex items-center gap-1">
                            {item.keys.map((key, keyIndex) => (
                              <span key={keyIndex} className="flex items-center">
                                <kbd className="min-w-[28px] px-2 py-1.5 text-xs font-mono font-medium text-center bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md border border-gray-200 dark:border-gray-600 shadow-sm">
                                  {key}
                                </kbd>
                                {keyIndex < item.keys.length - 1 && (
                                  <span className="mx-1.5 text-xs text-secondary font-medium">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-theme bg-hover/30">
          <div className="flex items-center justify-between">
            <p className="text-xs text-secondary">
              {t('shortcuts.hint', 'Alt + ? 또는 ? 를 눌러 언제든지 이 도움말을 볼 수 있습니다')}
            </p>
            <div className="flex items-center gap-1 text-xs text-secondary">
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-mono">
                Esc
              </kbd>
              <span>{t('shortcuts.toClose', '닫기')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ShortcutsBadge - Small floating badge to show shortcuts hint
 */
export function ShortcutsBadge() {
  const [visible, setVisible] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    // Hide after 10 seconds
    const timer = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 animate-fade-in">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-lg text-sm">
        <Keyboard className="w-4 h-4" />
        <span>{t('shortcuts.badgeHint', 'Alt + ? 단축키 도움말')}</span>
        <button
          onClick={() => setVisible(false)}
          className="ml-2 p-0.5 hover:bg-white/20 rounded transition-colors"
          aria-label={t('common.close', '닫기')}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

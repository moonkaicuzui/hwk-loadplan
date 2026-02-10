/**
 * @fileoverview Quick Action Floating Action Button (FAB)
 * Provides quick access to common actions for factory managers.
 * Mobile-optimized with gesture support and haptic feedback patterns.
 *
 * @module components/common/QuickActionFAB
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  X,
  RefreshCw,
  Search,
  AlertTriangle,
  Download,
  Upload,
  Filter,
  BarChart3,
  FileText,
  Printer,
  Share2,
  Clock,
  Zap
} from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useToast } from '../../contexts/ToastContext';

/**
 * Quick action definitions with icons and handlers
 */
const QUICK_ACTIONS = [
  {
    id: 'refresh',
    icon: RefreshCw,
    labelKey: 'quickAction.refresh',
    defaultLabel: '새로고침',
    color: 'bg-blue-500 hover:bg-blue-600',
    shortcut: 'Alt+R'
  },
  {
    id: 'search',
    icon: Search,
    labelKey: 'quickAction.search',
    defaultLabel: '빠른 검색',
    color: 'bg-purple-500 hover:bg-purple-600',
    path: '/search',
    shortcut: 'Alt+S'
  },
  {
    id: 'delayed',
    icon: AlertTriangle,
    labelKey: 'quickAction.viewDelayed',
    defaultLabel: '지연 주문',
    color: 'bg-red-500 hover:bg-red-600',
    path: '/data?status=delayed',
    badge: true
  },
  {
    id: 'export',
    icon: Download,
    labelKey: 'quickAction.export',
    defaultLabel: '엑셀 내보내기',
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    id: 'print',
    icon: Printer,
    labelKey: 'quickAction.print',
    defaultLabel: '인쇄',
    color: 'bg-gray-500 hover:bg-gray-600',
    shortcut: 'Ctrl+P'
  },
  {
    id: 'analytics',
    icon: BarChart3,
    labelKey: 'quickAction.analytics',
    defaultLabel: '분석 리포트',
    color: 'bg-indigo-500 hover:bg-indigo-600',
    path: '/factory'
  }
];

/**
 * QuickActionFAB Component
 * Floating action button with expandable quick actions menu
 */
const QuickActionFAB = memo(function QuickActionFAB({
  onRefresh,
  onExport,
  delayedCount = 0,
  position = 'bottom-right',
  showOnMobile = true,
  showOnDesktop = true
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, info } = useToast();
  const { dispatch } = useDashboard();

  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [recentAction, setRecentAction] = useState(null);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2'
  };

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Handle action execution
  const handleAction = useCallback(async (action) => {
    setIsAnimating(true);
    setRecentAction(action.id);

    // Haptic feedback for mobile (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    try {
      switch (action.id) {
        case 'refresh':
          if (onRefresh) {
            await onRefresh();
            success(t('quickAction.refreshSuccess', '데이터를 새로고침했습니다'));
          }
          break;

        case 'search':
          navigate(action.path);
          break;

        case 'delayed':
          navigate(action.path);
          break;

        case 'export':
          if (onExport) {
            await onExport();
            success(t('quickAction.exportSuccess', '엑셀 파일을 다운로드했습니다'));
          } else {
            info(t('quickAction.exportNotReady', '내보내기 기능 준비 중...'));
          }
          break;

        case 'print':
          window.print();
          break;

        case 'analytics':
          navigate(action.path);
          break;

        default:
          if (action.path) {
            navigate(action.path);
          }
      }
    } catch (error) {
      console.error('Quick action error:', error);
    } finally {
      setTimeout(() => {
        setIsAnimating(false);
        setRecentAction(null);
      }, 300);
      setIsOpen(false);
    }
  }, [onRefresh, onExport, navigate, success, info, t]);

  // Toggle menu with animation
  const toggleMenu = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    setIsOpen(prev => !prev);
  }, []);

  // Responsive visibility
  const visibilityClass = [
    !showOnMobile && 'hidden md:flex',
    !showOnDesktop && 'flex md:hidden',
    showOnMobile && showOnDesktop && 'flex'
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Backdrop when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* FAB Container */}
      <div
        className={`
          fixed ${positionClasses[position]} z-50
          ${visibilityClass}
          flex flex-col-reverse items-center gap-3
          no-print
        `}
      >
        {/* Quick Action Buttons (expanded state) */}
        {isOpen && (
          <div className="flex flex-col-reverse items-center gap-3 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {QUICK_ACTIONS.map((action, index) => {
              const Icon = action.icon;
              const isRecent = recentAction === action.id;

              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action)}
                  className={`
                    relative group flex items-center justify-center
                    w-12 h-12 rounded-full shadow-lg
                    ${action.color}
                    text-white transition-all duration-200
                    hover:scale-110 active:scale-95
                    ${isRecent && isAnimating ? 'animate-pulse' : ''}
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                  aria-label={t(action.labelKey, action.defaultLabel)}
                  title={`${t(action.labelKey, action.defaultLabel)}${action.shortcut ? ` (${action.shortcut})` : ''}`}
                >
                  <Icon className={`w-5 h-5 ${isRecent && isAnimating ? 'animate-spin' : ''}`} />

                  {/* Badge for delayed count */}
                  {action.badge && delayedCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-white text-red-600 text-xs font-bold rounded-full shadow">
                      {delayedCount > 99 ? '99+' : delayedCount}
                    </span>
                  )}

                  {/* Tooltip on hover */}
                  <span className="
                    absolute right-full mr-3 px-3 py-1.5
                    bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg
                    whitespace-nowrap opacity-0 group-hover:opacity-100
                    pointer-events-none transition-opacity duration-200
                    shadow-lg
                  ">
                    {t(action.labelKey, action.defaultLabel)}
                    {action.shortcut && (
                      <span className="ml-2 text-xs text-gray-400">
                        {action.shortcut}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onClick={toggleMenu}
          className={`
            flex items-center justify-center
            w-14 h-14 rounded-full shadow-xl
            bg-gradient-to-br from-blue-500 to-blue-600
            hover:from-blue-600 hover:to-blue-700
            text-white transition-all duration-300
            hover:scale-105 active:scale-95
            ${isOpen ? 'rotate-45' : 'rotate-0'}
            focus:outline-none focus:ring-4 focus:ring-blue-500/30
          `}
          aria-label={isOpen ? t('quickAction.close', '닫기') : t('quickAction.open', '빠른 작업')}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Zap className="w-6 h-6" />
          )}
        </button>

        {/* Pulse indicator when closed (indicates available actions) */}
        {!isOpen && delayedCount > 0 && (
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        )}
      </div>
    </>
  );
});

export default QuickActionFAB;

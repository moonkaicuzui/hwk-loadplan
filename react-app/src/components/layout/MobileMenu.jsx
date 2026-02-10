/**
 * @fileoverview Mobile Menu Component
 * Slide-out navigation menu for mobile devices.
 *
 * @module components/layout/MobileMenu
 */

import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  LayoutDashboard,
  Calendar,
  MapPin,
  Factory,
  Package,
  Truck,
  Grid3X3,
  Database,
  Search,
  Eye,
  ListTodo,
  Settings
} from 'lucide-react';

/**
 * Navigation items configuration
 */
const getNavItems = (t) => [
  {
    id: 'dashboard',
    path: '/',
    icon: LayoutDashboard,
    label: t('nav.dashboard', '대시보드')
  },
  {
    id: 'monthly',
    path: '/monthly',
    icon: Calendar,
    label: t('nav.monthly', '월별 현황')
  },
  {
    id: 'destination',
    path: '/destination',
    icon: MapPin,
    label: t('nav.destination', '행선지 분석')
  },
  {
    id: 'factory',
    path: '/factory',
    icon: Factory,
    label: t('nav.factory', '공장 비교')
  },
  {
    id: 'model',
    path: '/model',
    icon: Package,
    label: t('nav.model', '모델 분석')
  },
  {
    id: 'vendor',
    path: '/vendor',
    icon: Truck,
    label: t('nav.vendor', '벤더 분석')
  },
  {
    id: 'heatmap',
    path: '/heatmap',
    icon: Grid3X3,
    label: t('nav.heatmap', '공정 히트맵')
  },
  {
    id: 'data',
    path: '/data',
    icon: Database,
    label: t('nav.data', '데이터 탐색')
  },
  { type: 'divider' },
  {
    id: 'search',
    path: '/search',
    icon: Search,
    label: t('nav.search', '주문 검색')
  },
  {
    id: 'monitoring',
    path: '/monitoring',
    icon: Eye,
    label: t('nav.monitoring', '모니터링')
  },
  {
    id: 'tasks',
    path: '/tasks',
    icon: ListTodo,
    label: t('nav.tasks', '작업 관리')
  },
  { type: 'divider' },
  {
    id: 'settings',
    path: '/settings',
    icon: Settings,
    label: t('nav.settings', '설정')
  }
];

/**
 * MobileMenu Component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether menu is open
 * @param {Function} props.onClose - Handler to close menu
 */
export default function MobileMenu({ isOpen, onClose }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navItems = getNavItems(t);
  const menuRef = useRef(null);

  // Trap focus within menu when open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Tab' && menuRef.current) {
        const focusableElements = menuRef.current.querySelectorAll(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
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
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        ref={menuRef}
        className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-secondary shadow-xl transform transition-transform"
        role="dialog"
        aria-modal="true"
        aria-label={t('mobile.menuLabel', '모바일 메뉴')}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Rachgia</h2>
              <p className="text-xs text-secondary">Factory Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-hover transition-colors"
            aria-label={t('common.close', '닫기')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item, index) => {
              if (item.type === 'divider') {
                return (
                  <li key={`divider-${index}`} className="my-2">
                    <hr className="border-theme" />
                  </li>
                );
              }

              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-lg
                      transition-colors
                      ${isActive
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'text-secondary hover:bg-hover hover:text-primary'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-500' : ''}`} />
                    <span className="flex-1">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Version Info */}
        <div className="p-4 border-t border-theme text-center">
          <p className="text-xs text-secondary">
            v19.0.0 • {t('mobile.madeWith', 'Made with')} ❤️
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * @fileoverview Sidebar Navigation Component
 * Desktop sidebar with navigation links and collapsible state.
 *
 * @module components/layout/Sidebar
 */

import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Calendar,
  MapPin,
  Factory,
  Package,
  Truck,
  Grid3X3,
  Database,
  Upload,
  Search,
  Eye,
  ListTodo,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * Navigation items configuration
 */
const getNavItems = (t) => [
  {
    id: 'dashboard',
    path: '/',
    icon: LayoutDashboard,
    label: t('nav.dashboard', '대시보드'),
    shortcut: 'Alt+1'
  },
  {
    id: 'monthly',
    path: '/monthly',
    icon: Calendar,
    label: t('nav.monthly', '월별 현황'),
    shortcut: 'Alt+2'
  },
  {
    id: 'destination',
    path: '/destination',
    icon: MapPin,
    label: t('nav.destination', '행선지 분석'),
    shortcut: 'Alt+3'
  },
  {
    id: 'factory',
    path: '/factory',
    icon: Factory,
    label: t('nav.factory', '공장 비교'),
    shortcut: 'Alt+4'
  },
  {
    id: 'model',
    path: '/model',
    icon: Package,
    label: t('nav.model', '모델 분석'),
    shortcut: 'Alt+5'
  },
  {
    id: 'vendor',
    path: '/vendor',
    icon: Truck,
    label: t('nav.vendor', '벤더 분석'),
    shortcut: 'Alt+6'
  },
  {
    id: 'heatmap',
    path: '/heatmap',
    icon: Grid3X3,
    label: t('nav.heatmap', '공정 히트맵'),
    shortcut: 'Alt+7'
  },
  {
    id: 'data',
    path: '/data',
    icon: Database,
    label: t('nav.data', '데이터 탐색'),
    shortcut: 'Alt+8'
  },
  {
    id: 'upload',
    path: '/upload',
    icon: Upload,
    label: t('nav.upload', '데이터 업로드')
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
 * Sidebar Component
 * @param {Object} props
 * @param {boolean} props.collapsed - Whether sidebar is collapsed
 * @param {Function} props.onToggle - Handler for collapse toggle
 * @param {string} props.className - Additional CSS classes
 */
export default function Sidebar({ collapsed, onToggle, className = '' }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navItems = getNavItems(t);

  return (
    <aside
      className={`
        fixed left-0 top-0 bottom-0 z-30
        flex flex-col
        bg-secondary border-r border-theme
        transition-all duration-300
        ${collapsed ? 'w-16' : 'w-60'}
        ${className}
      `}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-theme">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Factory className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold truncate">Rachgia</h1>
              <p className="text-xs text-secondary truncate">Factory Dashboard</p>
            </div>
          )}
        </div>
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
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-colors group relative
                    ${isActive
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'text-secondary hover:bg-hover hover:text-primary'
                    }
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-500' : ''}`} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.shortcut && (
                        <span className="text-xs text-muted hidden lg:inline">
                          {item.shortcut}
                        </span>
                      )}
                    </>
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <span className="
                      absolute left-full ml-2 px-2 py-1
                      bg-gray-900 text-white text-sm rounded
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible
                      transition-all whitespace-nowrap z-50
                    ">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle Button */}
      <div className="p-2 border-t border-theme">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-hover transition-colors"
          aria-label={collapsed ? t('sidebar.expand', '사이드바 펼치기') : t('sidebar.collapse', '사이드바 접기')}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm text-secondary">{t('sidebar.collapse', '접기')}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

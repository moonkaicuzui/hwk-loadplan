/**
 * @fileoverview Header Component
 * Top navigation bar with factory selector, date mode toggle, and user menu.
 *
 * @module components/layout/Header
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  Sun,
  Moon,
  Globe,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { useOrdersContext } from '../../contexts/OrdersContext';
import { useGoogleDriveContext } from '../../contexts/GoogleDriveContext';

/**
 * Header Component
 * @param {Object} props
 * @param {Function} props.onMenuClick - Handler for mobile menu button
 * @param {boolean} props.sidebarCollapsed - Whether sidebar is collapsed
 */
export default function Header({ onMenuClick, sidebarCollapsed }) {
  const { t, i18n } = useTranslation();
  const { user, logout, hasFactoryAccess } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { state, dispatch } = useDashboard();
  // Use OrdersContext for centralized factory/dateMode management
  const { dateMode, selectedFactory, setDateMode, setSelectedFactory } = useOrdersContext();
  const { isAuthenticated: driveAuth, syncStatus, lastSync, error: driveError, manualSync } = useGoogleDriveContext();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Placeholder notifications - can be connected to real data later
  const [notifications] = useState([
    // Example structure for future notifications:
    // { id: 1, title: '지연 주문 알림', message: 'Factory A에서 5건의 지연 주문이 있습니다.', time: new Date(), read: false },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const factories = [
    { id: 'ALL', label: t('factories.all', '전체') },
    { id: 'A', label: t('factories.a', 'Factory A') },
    { id: 'B', label: t('factories.b', 'Factory B') },
    { id: 'C', label: t('factories.c', 'Factory C') },
    { id: 'D', label: t('factories.d', 'Factory D') }
  ];

  const languages = [
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' }
  ];

  const handleFactoryChange = (factoryId) => {
    // Update both contexts for backward compatibility
    dispatch({ type: 'SET_FACTORY', payload: factoryId });
    setSelectedFactory(factoryId);
  };

  const handleDateModeToggle = () => {
    const newMode = dateMode === 'SDD' ? 'CRD' : 'SDD';
    // Update both contexts for backward compatibility
    dispatch({ type: 'SET_DATE_MODE', payload: newMode });
    setDateMode(newMode);
  };

  const handleDateModeKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDateModeToggle();
    }
  };

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setLangMenuOpen(false);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-secondary border-b border-theme">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-hover transition-colors"
            aria-label={t('common.menu', '메뉴')}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Factory Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-secondary hidden sm:inline">
              {t('header.factory', '공장')}:
            </label>
            <select
              value={selectedFactory}
              onChange={(e) => handleFactoryChange(e.target.value)}
              className="px-3 py-1.5 text-sm bg-card border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {factories.map((factory) => (
                <option
                  key={factory.id}
                  value={factory.id}
                  disabled={factory.id !== 'ALL' && !hasFactoryAccess(factory.id)}
                >
                  {factory.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Mode Toggle */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-secondary">
              {t('header.dateMode', '날짜 기준')}:
            </span>
            <button
              onClick={handleDateModeToggle}
              onKeyDown={handleDateModeKeyDown}
              className={`
                relative inline-flex items-center h-7 w-20 rounded-full transition-colors
                ${dateMode === 'SDD' ? 'bg-blue-500' : 'bg-green-500'}
              `}
              role="switch"
              aria-checked={dateMode === 'SDD'}
              aria-label={t('header.toggleDateMode', '날짜 기준 전환')}
            >
              <span
                className={`
                  absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform
                  ${dateMode === 'CRD' ? 'translate-x-12' : 'translate-x-0'}
                `}
              />
              <span className="flex-1 text-xs font-medium text-white text-center">
                {dateMode}
              </span>
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-hover transition-colors"
            aria-label={theme === 'dark' ? t('header.lightMode', '라이트 모드') : t('header.darkMode', '다크 모드')}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="p-2 rounded-lg hover:bg-hover transition-colors"
              aria-label={t('header.language', '언어')}
              aria-expanded={langMenuOpen}
            >
              <Globe className="w-5 h-5" />
            </button>

            {langMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-36 bg-card rounded-lg shadow-lg border border-theme z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`
                        w-full px-4 py-2 text-sm text-left hover:bg-hover transition-colors
                        flex items-center gap-2
                        ${i18n.language === lang.code ? 'bg-blue-500/10 text-blue-500' : ''}
                        first:rounded-t-lg last:rounded-b-lg
                      `}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Google Drive Sync Status */}
          <button
            onClick={manualSync}
            className={`p-2 rounded-lg hover:bg-hover transition-colors relative group ${
              syncStatus === 'syncing' ? 'animate-pulse' : ''
            }`}
            aria-label={
              driveAuth
                ? syncStatus === 'syncing'
                  ? t('header.syncing', '동기화 중...')
                  : t('header.syncDrive', 'Google Drive 동기화')
                : t('header.driveNotConnected', 'Google Drive 연결 필요')
            }
            title={
              driveAuth
                ? lastSync
                  ? `마지막 동기화: ${lastSync.toLocaleTimeString()}`
                  : '동기화 대기 중'
                : 'Google Drive 연결 필요'
            }
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
            ) : syncStatus === 'error' || driveError ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : driveAuth ? (
              <Cloud className="w-5 h-5 text-green-500" />
            ) : (
              <CloudOff className="w-5 h-5 text-gray-400" />
            )}
            {/* Sync indicator */}
            {syncStatus === 'watching' && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="p-2 rounded-lg hover:bg-hover transition-colors relative"
              aria-label={t('header.notifications', '알림')}
              aria-expanded={notificationOpen}
            >
              <Bell className="w-5 h-5" />
              {/* Notification Badge - only show if there are unread notifications */}
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {notificationOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setNotificationOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-card rounded-lg shadow-lg border border-theme z-50">
                  <div className="px-4 py-3 border-b border-theme flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      {t('header.notifications', '알림')}
                    </h3>
                    {unreadCount > 0 && (
                      <span className="text-xs text-blue-500">
                        {unreadCount} {t('header.unread', '개 안읽음')}
                      </span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-secondary">
                          {t('header.noNotifications', '새로운 알림이 없습니다')}
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 border-b border-theme hover:bg-hover transition-colors cursor-pointer ${
                            !notification.read ? 'bg-blue-500/5' : ''
                          }`}
                        >
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-secondary mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.time?.toLocaleTimeString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-theme">
                      <button className="w-full text-center text-xs text-blue-500 hover:text-blue-600">
                        {t('header.viewAllNotifications', '모든 알림 보기')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-hover transition-colors"
              aria-expanded={userMenuOpen}
              aria-label={t('header.userMenu', '사용자 메뉴')}
              aria-haspopup="menu"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="hidden md:inline text-sm font-medium">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </span>
              <ChevronDown className="w-4 h-4 hidden md:inline" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-theme z-50">
                  <div className="px-4 py-3 border-b border-theme">
                    <p className="text-sm font-medium truncate">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-secondary truncate">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <a
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-hover transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>{t('header.settings', '설정')}</span>
                    </a>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-hover transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('header.logout', '로그아웃')}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

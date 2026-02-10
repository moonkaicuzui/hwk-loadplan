/**
 * @fileoverview Settings Page
 * User preferences and application settings.
 *
 * @module pages/Settings
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Bell, Palette, Globe, Shield, Database, Info, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const STORAGE_KEY = 'rachgia_settings';

/**
 * Default settings values
 */
const DEFAULT_SETTINGS = {
  notifications: true,
  autoRefresh: true,
  refreshInterval: 30
};

/**
 * Load settings from localStorage
 * @returns {Object} Settings object
 */
function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save settings to localStorage
 * @param {Object} settings - Settings to save
 */
function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
    return false;
  }
}

/**
 * Settings Page Component
 */
export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  // Load initial settings from localStorage
  const [notifications, setNotifications] = useState(() => loadSettings().notifications);
  const [autoRefresh, setAutoRefresh] = useState(() => loadSettings().autoRefresh);
  const [refreshInterval, setRefreshInterval] = useState(() => loadSettings().refreshInterval);

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  /**
   * Show toast notification
   * @param {string} message - Message to display
   */
  const showSaveToast = useCallback((message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  /**
   * Handle notifications toggle
   */
  const handleNotificationsChange = useCallback(() => {
    setNotifications((prev) => {
      const newValue = !prev;
      const settings = { notifications: newValue, autoRefresh, refreshInterval };
      if (saveSettings(settings)) {
        showSaveToast(t('settings.saved', '설정이 저장되었습니다.'));
      }
      return newValue;
    });
  }, [autoRefresh, refreshInterval, showSaveToast, t]);

  /**
   * Handle auto-refresh toggle
   */
  const handleAutoRefreshChange = useCallback(() => {
    setAutoRefresh((prev) => {
      const newValue = !prev;
      const settings = { notifications, autoRefresh: newValue, refreshInterval };
      if (saveSettings(settings)) {
        showSaveToast(t('settings.saved', '설정이 저장되었습니다.'));
      }
      return newValue;
    });
  }, [notifications, refreshInterval, showSaveToast, t]);

  /**
   * Handle refresh interval change
   * @param {Event} e - Change event
   */
  const handleRefreshIntervalChange = useCallback((e) => {
    const newValue = Number(e.target.value);
    setRefreshInterval(newValue);
    const settings = { notifications, autoRefresh, refreshInterval: newValue };
    if (saveSettings(settings)) {
      showSaveToast(t('settings.saved', '설정이 저장되었습니다.'));
    }
  }, [notifications, autoRefresh, showSaveToast, t]);

  const languages = [
    { code: 'ko', label: '한국어' },
    { code: 'en', label: 'English' },
    { code: 'vi', label: 'Tiếng Việt' }
  ];

  const themes = [
    { id: 'light', label: t('settings.lightMode', '라이트 모드') },
    { id: 'dark', label: t('settings.darkMode', '다크 모드') },
    { id: 'system', label: t('settings.systemMode', '시스템 설정') }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {t('settings.title', '설정')}
        </h1>
        <p className="text-sm text-secondary mt-1">
          {t('settings.subtitle', '앱 환경설정 및 사용자 설정')}
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-theme flex items-center gap-3">
          <User className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">{t('settings.profile', '프로필')}</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <p className="text-lg font-medium">{user?.displayName || 'User'}</p>
              <p className="text-sm text-secondary">{user?.email}</p>
              <p className="text-xs text-secondary mt-1">
                {t('settings.role', '역할')}: {user?.role || 'viewer'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-theme flex items-center gap-3">
          <Palette className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold">{t('settings.appearance', '외관')}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('settings.theme', '테마')}</label>
            <div className="flex gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`
                    px-4 py-2 rounded-lg text-sm transition-colors
                    ${theme === t.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-primary border border-theme hover:bg-hover'
                    }
                  `}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Language Section */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-theme flex items-center gap-3">
          <Globe className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-semibold">{t('settings.language', '언어')}</h2>
        </div>
        <div className="p-6">
          <div className="flex gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`
                  px-4 py-2 rounded-lg text-sm transition-colors
                  ${i18n.language === lang.code
                    ? 'bg-blue-500 text-white'
                    : 'bg-primary border border-theme hover:bg-hover'
                  }
                `}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-theme flex items-center gap-3">
          <Bell className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">{t('settings.notifications', '알림')}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.enableNotifications', '알림 활성화')}</p>
              <p className="text-sm text-secondary">
                {t('settings.notificationsDesc', '지연 주문 및 경고에 대한 알림을 받습니다.')}
              </p>
            </div>
            <button
              onClick={handleNotificationsChange}
              className={`
                relative w-12 h-6 rounded-full transition-colors
                ${notifications ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
              `}
              aria-label={t('settings.enableNotifications', '알림 활성화')}
              role="switch"
              aria-checked={notifications}
            >
              <span
                className={`
                  absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                  ${notifications ? 'translate-x-6' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Data Section */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-theme flex items-center gap-3">
          <Database className="w-5 h-5 text-cyan-500" />
          <h2 className="text-lg font-semibold">{t('settings.data', '데이터')}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.autoRefresh', '자동 새로고침')}</p>
              <p className="text-sm text-secondary">
                {t('settings.autoRefreshDesc', '데이터를 자동으로 새로고침합니다.')}
              </p>
            </div>
            <button
              onClick={handleAutoRefreshChange}
              className={`
                relative w-12 h-6 rounded-full transition-colors
                ${autoRefresh ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
              `}
              aria-label={t('settings.autoRefresh', '자동 새로고침')}
              role="switch"
              aria-checked={autoRefresh}
            >
              <span
                className={`
                  absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                  ${autoRefresh ? 'translate-x-6' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          {autoRefresh && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('settings.refreshInterval', '새로고침 간격')}
              </label>
              <select
                value={refreshInterval}
                onChange={handleRefreshIntervalChange}
                className="px-3 py-2 bg-primary border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value={15}>15{t('settings.seconds', '초')}</option>
                <option value={30}>30{t('settings.seconds', '초')}</option>
                <option value={60}>1{t('settings.minute', '분')}</option>
                <option value={300}>5{t('settings.minutes', '분')}</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* About Section */}
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-theme flex items-center gap-3">
          <Info className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">{t('settings.about', '정보')}</h2>
        </div>
        <div className="p-6">
          <div className="space-y-2 text-sm">
            <p><strong>{t('settings.version', '버전')}:</strong> 19.0.0</p>
            <p><strong>{t('settings.buildDate', '빌드 날짜')}:</strong> 2025-01-24</p>
            <p><strong>{t('settings.copyright', '저작권')}:</strong> © 2024-2025 Rachgia Factory</p>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div
          className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in z-50"
          role="alert"
          aria-live="polite"
        >
          <Check className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

/**
 * @fileoverview Data Freshness Indicator Component
 * Shows real-time data sync status with visual feedback.
 * Helps factory managers understand data currency at a glance.
 *
 * @module components/common/DataFreshnessIndicator
 */

import { useState, useEffect, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  CloudOff,
  Zap
} from 'lucide-react';

/**
 * Freshness thresholds in minutes
 */
const FRESHNESS_THRESHOLDS = {
  FRESH: 5,        // < 5 mins = fresh (green)
  RECENT: 15,      // 5-15 mins = recent (blue)
  STALE: 60,       // 15-60 mins = stale (yellow)
  OUTDATED: 180    // > 60 mins = outdated (red)
};

/**
 * Calculate freshness level based on time difference
 */
function getFreshnessLevel(lastUpdated) {
  if (!lastUpdated) return 'unknown';

  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffMinutes = Math.floor((now - updated) / (1000 * 60));

  if (diffMinutes < FRESHNESS_THRESHOLDS.FRESH) return 'fresh';
  if (diffMinutes < FRESHNESS_THRESHOLDS.RECENT) return 'recent';
  if (diffMinutes < FRESHNESS_THRESHOLDS.STALE) return 'stale';
  if (diffMinutes < FRESHNESS_THRESHOLDS.OUTDATED) return 'outdated';
  return 'critical';
}

/**
 * Format relative time
 */
function formatRelativeTime(date, t) {
  if (!date) return t('data.unknown', '알 수 없음');

  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return t('data.justNow', '방금 전');
  if (minutes < 60) return t('data.minutesAgo', '{{count}}분 전', { count: minutes });
  if (hours < 24) return t('data.hoursAgo', '{{count}}시간 전', { count: hours });
  return t('data.daysAgo', '{{count}}일 전', { count: days });
}

/**
 * Freshness configuration by level
 */
const FRESHNESS_CONFIG = {
  fresh: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-500',
    pulseColor: 'bg-green-500',
    label: 'data.fresh',
    defaultLabel: '최신',
    description: '데이터가 최신 상태입니다'
  },
  recent: {
    icon: Clock,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-500',
    pulseColor: 'bg-blue-500',
    label: 'data.recent',
    defaultLabel: '최근',
    description: '최근 업데이트됨'
  },
  stale: {
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-500',
    pulseColor: 'bg-yellow-500',
    label: 'data.stale',
    defaultLabel: '오래됨',
    description: '새로고침 권장'
  },
  outdated: {
    icon: AlertCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-500',
    pulseColor: 'bg-orange-500',
    label: 'data.outdated',
    defaultLabel: '갱신 필요',
    description: '데이터 갱신이 필요합니다'
  },
  critical: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-500',
    pulseColor: 'bg-red-500',
    label: 'data.critical',
    defaultLabel: '매우 오래됨',
    description: '즉시 데이터 새로고침 필요'
  },
  unknown: {
    icon: CloudOff,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-500',
    pulseColor: 'bg-gray-500',
    label: 'data.unknown',
    defaultLabel: '알 수 없음',
    description: '데이터 로드 필요'
  }
};

/**
 * DataFreshnessIndicator Component
 * Visual indicator for data freshness status
 */
const DataFreshnessIndicator = memo(function DataFreshnessIndicator({
  lastUpdated,
  isRefreshing = false,
  isSyncing = false,
  isOnline = true,
  onRefresh,
  variant = 'default', // 'default', 'compact', 'badge', 'detailed'
  showPulse = true,
  autoRefreshInterval = 0, // 0 = disabled, otherwise in seconds
  className = ''
}) {
  const { t } = useTranslation();
  const [, setTick] = useState(0);

  // Update relative time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshInterval > 0 && onRefresh) {
      const interval = setInterval(() => {
        onRefresh();
      }, autoRefreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval, onRefresh]);

  const freshnessLevel = useMemo(() => getFreshnessLevel(lastUpdated), [lastUpdated]);
  const config = FRESHNESS_CONFIG[freshnessLevel];
  const Icon = config.icon;
  const relativeTime = formatRelativeTime(lastUpdated, t);

  // Handle refresh click
  const handleRefresh = (e) => {
    e.stopPropagation();
    if (onRefresh && !isRefreshing) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
      onRefresh();
    }
  };

  // Badge variant - minimal
  if (variant === 'badge') {
    return (
      <span
        className={`
          inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
          ${config.bgColor} ${config.color}
          ${className}
        `}
        title={`${t(config.label, config.defaultLabel)} - ${relativeTime}`}
      >
        {isRefreshing || isSyncing ? (
          <RefreshCw className="w-3 h-3 animate-spin" />
        ) : (
          <Icon className="w-3 h-3" />
        )}
        {relativeTime}
      </span>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
          ${config.bgColor} ${config.color}
          hover:opacity-80 transition-opacity
          disabled:cursor-not-allowed
          ${className}
        `}
        title={`${t(config.label, config.defaultLabel)}: ${relativeTime}. ${t('data.clickToRefresh', '클릭하여 새로고침')}`}
      >
        {isRefreshing || isSyncing ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
        <span className="text-xs font-medium">{relativeTime}</span>
      </button>
    );
  }

  // Detailed variant - full info
  if (variant === 'detailed') {
    return (
      <div
        className={`
          rounded-lg border p-4 ${config.bgColor} ${config.borderColor}
          ${className}
        `}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* Icon with pulse */}
            <div className="relative">
              {isRefreshing || isSyncing ? (
                <RefreshCw className={`w-8 h-8 ${config.color} animate-spin`} />
              ) : (
                <Icon className={`w-8 h-8 ${config.color}`} />
              )}
              {showPulse && freshnessLevel !== 'fresh' && !isRefreshing && (
                <span className={`absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5`}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pulseColor} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.pulseColor}`} />
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${config.color}`}>
                  {t(config.label, config.defaultLabel)}
                </span>
                {!isOnline && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-500">
                    <WifiOff className="w-3 h-3" />
                    {t('data.offline', '오프라인')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {isRefreshing
                  ? t('data.refreshing', '새로고침 중...')
                  : isSyncing
                    ? t('data.syncing', '동기화 중...')
                    : relativeTime
                }
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {config.description}
              </p>
            </div>
          </div>

          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`
                p-2 rounded-lg transition-colors
                hover:bg-white/50 dark:hover:bg-black/20
                disabled:opacity-50 disabled:cursor-not-allowed
                ${config.color}
              `}
              aria-label={t('data.refresh', '새로고침')}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Auto-refresh indicator */}
        {autoRefreshInterval > 0 && (
          <div className="mt-3 pt-3 border-t border-current/10">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Zap className="w-3 h-3" />
              <span>{t('data.autoRefresh', '자동 새로고침')}: {autoRefreshInterval}초</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
        ${config.bgColor}
        ${className}
      `}
    >
      {/* Status icon with pulse */}
      <div className="relative">
        {isRefreshing || isSyncing ? (
          <RefreshCw className={`w-4 h-4 ${config.color} animate-spin`} />
        ) : (
          <Icon className={`w-4 h-4 ${config.color}`} />
        )}
        {showPulse && (freshnessLevel === 'stale' || freshnessLevel === 'outdated' || freshnessLevel === 'critical') && !isRefreshing && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pulseColor} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${config.pulseColor}`} />
          </span>
        )}
      </div>

      {/* Text info */}
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${config.color}`}>
          {t(config.label, config.defaultLabel)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {isRefreshing
            ? t('data.refreshing', '새로고침 중...')
            : relativeTime
          }
        </span>
      </div>

      {/* Refresh button */}
      {onRefresh && (
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`
            p-1 rounded transition-colors
            hover:bg-white/50 dark:hover:bg-black/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${config.color}
          `}
          aria-label={t('data.refresh', '새로고침')}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      )}

      {/* Offline indicator */}
      {!isOnline && (
        <WifiOff className="w-4 h-4 text-red-500 ml-1" />
      )}
    </div>
  );
});

/**
 * Sync Status Bar - Fixed position indicator
 * Shows at top of screen during sync operations
 */
export const SyncStatusBar = memo(function SyncStatusBar({
  isSyncing = false,
  progress = 0, // 0-100
  message = ''
}) {
  const { t } = useTranslation();

  if (!isSyncing) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      {/* Progress bar */}
      <div className="h-1 bg-blue-100 dark:bg-blue-900/30">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status message */}
      {message && (
        <div className="flex items-center justify-center gap-2 py-1 px-4 bg-blue-500 text-white text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
});

/**
 * Connection Status Indicator - Shows online/offline status
 */
export const ConnectionStatus = memo(function ConnectionStatus() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-auto z-50 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-3 px-4 py-3 bg-red-500 text-white rounded-lg shadow-lg">
        <WifiOff className="w-5 h-5 flex-shrink-0" />
        <div>
          <p className="font-medium">{t('network.offline', '인터넷 연결 끊김')}</p>
          <p className="text-sm text-red-100">
            {t('network.offlineMessage', '일부 기능이 제한될 수 있습니다')}
          </p>
        </div>
      </div>
    </div>
  );
});

export default DataFreshnessIndicator;

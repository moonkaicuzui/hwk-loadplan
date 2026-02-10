/**
 * @fileoverview Cache Status Indicator
 * Shows cache freshness status to users
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useCacheStatus } from '../../hooks/useCacheStatus';

function CacheStatusIndicator({ factoryId = 'ALL', showDetails = false }) {
  const { t } = useTranslation();
  const { isStale, lastRefresh, staleSince } = useCacheStatus(factoryId);

  // Calculate time since last refresh
  const getTimeSince = (timestamp) => {
    if (!timestamp) return null;
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return t('cache.justNow', '방금 전');
    if (diff < 3600) return t('cache.minutesAgo', '{{min}}분 전', { min: Math.floor(diff / 60) });
    return t('cache.hoursAgo', '{{hour}}시간 전', { hour: Math.floor(diff / 3600) });
  };

  if (isStale) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm">
        <AlertTriangle className="w-4 h-4" />
        <span>{t('cache.staleData', '오래된 데이터')}</span>
        {showDetails && staleSince && (
          <span className="text-xs opacity-75">({getTimeSince(staleSince)})</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
      <Cloud className="w-4 h-4" />
      <span>{t('cache.fresh', '최신 데이터')}</span>
      {showDetails && lastRefresh && (
        <span className="text-xs opacity-75">({getTimeSince(lastRefresh)})</span>
      )}
    </div>
  );
}

export default memo(CacheStatusIndicator);

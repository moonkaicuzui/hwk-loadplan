/**
 * @fileoverview Cache Status Hook
 * Subscribes to cache events and provides cache status state
 */

import { useState, useEffect, useCallback } from 'react';
import { cacheEvents, CACHE_EVENTS } from '../services/cacheEvents';

/**
 * Hook that subscribes to cache events and returns cache status
 * @returns {{ isStale: boolean, lastRefresh: Date|null, staleSince: Date|null, factoryId: string|null }}
 */
export function useCacheStatus() {
  const [status, setStatus] = useState({
    isStale: false,
    lastRefresh: null,
    staleSince: null,
    factoryId: null
  });

  const handleStale = useCallback((data) => {
    setStatus(prev => ({
      ...prev,
      isStale: true,
      staleSince: new Date(),
      factoryId: data?.factoryId || prev.factoryId
    }));
  }, []);

  const handleRefresh = useCallback((data) => {
    setStatus({
      isStale: false,
      lastRefresh: new Date(),
      staleSince: null,
      factoryId: data?.factoryId || null
    });
  }, []);

  const handleInvalidate = useCallback((data) => {
    setStatus(prev => ({
      ...prev,
      isStale: true,
      staleSince: new Date(),
      factoryId: data?.factoryId || prev.factoryId
    }));
  }, []);

  const handleError = useCallback((data) => {
    console.warn('[useCacheStatus] Cache error:', data?.error);
  }, []);

  useEffect(() => {
    const unsubscribeStale = cacheEvents.on(CACHE_EVENTS.STALE, handleStale);
    const unsubscribeRefresh = cacheEvents.on(CACHE_EVENTS.REFRESH, handleRefresh);
    const unsubscribeInvalidate = cacheEvents.on(CACHE_EVENTS.INVALIDATE, handleInvalidate);
    const unsubscribeError = cacheEvents.on(CACHE_EVENTS.ERROR, handleError);

    return () => {
      unsubscribeStale();
      unsubscribeRefresh();
      unsubscribeInvalidate();
      unsubscribeError();
    };
  }, [handleStale, handleRefresh, handleInvalidate, handleError]);

  return status;
}

export default useCacheStatus;

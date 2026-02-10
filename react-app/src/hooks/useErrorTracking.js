/**
 * @fileoverview Error Tracking Hook
 */
import { useCallback, useEffect, useState } from 'react';
import { errorTracking, ERROR_CATEGORY, ERROR_SEVERITY } from '../services/errorTracking';

export function useErrorTracking(componentName) {
  const [recentErrors, setRecentErrors] = useState([]);

  useEffect(() => {
    const unsubscribe = errorTracking.subscribe(() => {
      setRecentErrors(errorTracking.getRecentErrors(5));
    });
    return unsubscribe;
  }, []);

  const trackError = useCallback((error, context = {}) => {
    return errorTracking.track(error, {
      ...context,
      component: componentName
    });
  }, [componentName]);

  return {
    trackError,
    recentErrors,
    stats: errorTracking.getStats()
  };
}

export { ERROR_CATEGORY, ERROR_SEVERITY };

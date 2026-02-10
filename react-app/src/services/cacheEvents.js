/**
 * @fileoverview Cache Event System
 * Event-driven cache invalidation and notifications
 */

class CacheEventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach(cb => {
      try {
        cb(data);
      } catch (error) {
        console.error('[CacheEvents] Listener error:', error);
      }
    });
  }

  once(event, callback) {
    const unsubscribe = this.on(event, (data) => {
      unsubscribe();
      callback(data);
    });
    return unsubscribe;
  }
}

export const cacheEvents = new CacheEventEmitter();

// Event types
export const CACHE_EVENTS = {
  STALE: 'cache:stale',
  REFRESH: 'cache:refresh',
  INVALIDATE: 'cache:invalidate',
  ERROR: 'cache:error'
};

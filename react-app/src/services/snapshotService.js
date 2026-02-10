/**
 * @fileoverview Daily Snapshot Service
 * Manages daily snapshots of production data using IndexedDB for persistence.
 * Enables historical comparison and trend analysis.
 *
 * @module services/snapshotService
 */

const DB_NAME = 'RachgiaDashboard';
const DB_VERSION = 1;
const STORE_SNAPSHOTS = 'snapshots';
const STORE_SUMMARY = 'summarySnapshots';

/**
 * Open IndexedDB connection
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Full snapshots store (less frequent, full data)
      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
        const snapshotStore = db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'id' });
        snapshotStore.createIndex('date', 'date', { unique: false });
        snapshotStore.createIndex('factory', 'factory', { unique: false });
      }

      // Summary snapshots store (daily, aggregated metrics only)
      if (!db.objectStoreNames.contains(STORE_SUMMARY)) {
        const summaryStore = db.createObjectStore(STORE_SUMMARY, { keyPath: 'id' });
        summaryStore.createIndex('date', 'date', { unique: false });
        summaryStore.createIndex('factory', 'factory', { unique: false });
      }
    };
  });
}

/**
 * Generate snapshot ID
 */
function generateSnapshotId(date, factory = 'ALL') {
  const dateStr = date.toISOString().slice(0, 10);
  return `${dateStr}_${factory}`;
}

/**
 * Calculate summary metrics from orders
 */
function calculateSummaryMetrics(orders) {
  const metrics = {
    totalOrders: orders.length,
    totalQuantity: 0,
    completedOrders: 0,
    completedQuantity: 0,
    delayedOrders: 0,
    delayedQuantity: 0,
    stageBacklog: {
      S_CUT: 0,
      PRE_SEW: 0,
      SEW_INPUT: 0,
      SEW_BAL: 0,
      S_FIT: 0,
      ASS_BAL: 0,
      WH_IN: 0,
      WH_OUT: 0
    },
    factoryDistribution: {},
    destinationDistribution: {}
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  orders.forEach(order => {
    const qty = parseNumber(order['Q.ty'] || order['Qty']);
    const whOutBal = parseNumber(order['W.H OUT BAL']);
    const completed = qty - whOutBal;
    const completionRate = qty > 0 ? (completed / qty) * 100 : 100;

    metrics.totalQuantity += qty;

    // Completed check
    if (completionRate >= 100) {
      metrics.completedOrders++;
      metrics.completedQuantity += qty;
    }

    // Delayed check
    const crd = parseDate(order['CRD']);
    if (crd && crd < today && completionRate < 100) {
      metrics.delayedOrders++;
      metrics.delayedQuantity += qty;
    }

    // Stage backlog
    metrics.stageBacklog.S_CUT += parseNumber(order['S.Cut Bal']);
    metrics.stageBacklog.PRE_SEW += parseNumber(order['Pre-Sew Bal']);
    metrics.stageBacklog.SEW_INPUT += parseNumber(order['Sew input Bal']);
    metrics.stageBacklog.SEW_BAL += parseNumber(order['Sew Bal']);
    metrics.stageBacklog.S_FIT += parseNumber(order['S/Fit Bal']);
    metrics.stageBacklog.ASS_BAL += parseNumber(order['Ass Bal']);
    metrics.stageBacklog.WH_IN += parseNumber(order['W.H IN BAL']);
    metrics.stageBacklog.WH_OUT += parseNumber(order['W.H OUT BAL']);

    // Factory distribution
    const factory = extractFactory(order);
    if (factory) {
      metrics.factoryDistribution[factory] = (metrics.factoryDistribution[factory] || 0) + qty;
    }

    // Destination distribution
    const dest = order['Dest'] || order['Destination'] || 'Other';
    metrics.destinationDistribution[dest] = (metrics.destinationDistribution[dest] || 0) + qty;
  });

  return metrics;
}

/**
 * Parse numeric value
 */
function parseNumber(value) {
  if (value === undefined || value === null || value === '') return 0;
  const cleaned = String(value).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Parse date value
 */
function parseDate(value) {
  if (!value || value === '1/0' || value === '-') return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  const str = String(value).trim();
  const mmddMatch = str.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (mmddMatch) {
    const month = parseInt(mmddMatch[1], 10) - 1;
    const day = parseInt(mmddMatch[2], 10);
    const year = new Date().getFullYear();
    return new Date(year, month, day);
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Extract factory code
 */
function extractFactory(order) {
  if (order.factory) {
    const match = order.factory.match(/[ABCD]/i);
    if (match) return match[0].toUpperCase();
  }
  const unit = order['Unit'] || order['Factory'] || '';
  const unitMatch = unit.match(/R([ABCD])/i);
  if (unitMatch) return unitMatch[1].toUpperCase();
  return null;
}

/**
 * SnapshotService class
 */
class SnapshotService {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize the service
   */
  async init() {
    if (!this.db) {
      this.db = await openDB();
    }
    return this;
  }

  /**
   * Save a daily summary snapshot
   */
  async saveDailySummary(orders, factory = 'ALL') {
    await this.init();

    const date = new Date();
    date.setHours(0, 0, 0, 0);

    const id = generateSnapshotId(date, factory);
    const metrics = calculateSummaryMetrics(orders);

    const snapshot = {
      id,
      date: date.toISOString(),
      factory,
      metrics,
      createdAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_SUMMARY], 'readwrite');
      const store = transaction.objectStore(STORE_SUMMARY);
      const request = store.put(snapshot);

      request.onsuccess = () => resolve(snapshot);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save a full snapshot (less frequent, more data)
   */
  async saveFullSnapshot(orders, factory = 'ALL') {
    await this.init();

    const date = new Date();
    date.setHours(0, 0, 0, 0);

    const id = generateSnapshotId(date, factory);
    const metrics = calculateSummaryMetrics(orders);

    // Store only essential fields to reduce storage
    const essentialOrders = orders.map(order => ({
      po: order['Sales Order and Item'] || order['PO#'] || order['PO'],
      qty: parseNumber(order['Q.ty'] || order['Qty']),
      crd: order['CRD'],
      whOutBal: parseNumber(order['W.H OUT BAL']),
      factory: extractFactory(order)
    }));

    const snapshot = {
      id,
      date: date.toISOString(),
      factory,
      metrics,
      orders: essentialOrders,
      createdAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_SNAPSHOTS], 'readwrite');
      const store = transaction.objectStore(STORE_SNAPSHOTS);
      const request = store.put(snapshot);

      request.onsuccess = () => resolve(snapshot);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get summary snapshot by date
   */
  async getSummaryByDate(date, factory = 'ALL') {
    await this.init();

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const id = generateSnapshotId(targetDate, factory);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_SUMMARY], 'readonly');
      const store = transaction.objectStore(STORE_SUMMARY);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get summary snapshots for a date range
   */
  async getSummariesInRange(startDate, endDate, factory = 'ALL') {
    await this.init();

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_SUMMARY], 'readonly');
      const store = transaction.objectStore(STORE_SUMMARY);
      const index = store.index('date');
      const range = IDBKeyRange.bound(start.toISOString(), end.toISOString());

      const results = [];
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (factory === 'ALL' || cursor.value.factory === factory) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(results.sort((a, b) => new Date(a.date) - new Date(b.date)));
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Compare two snapshots
   */
  compareSnapshots(snapshot1, snapshot2) {
    if (!snapshot1 || !snapshot2) return null;

    const m1 = snapshot1.metrics;
    const m2 = snapshot2.metrics;

    const calcChange = (v1, v2) => {
      if (v1 === 0) return v2 > 0 ? 100 : 0;
      return ((v2 - v1) / v1) * 100;
    };

    return {
      period: {
        from: snapshot1.date,
        to: snapshot2.date
      },
      changes: {
        totalOrders: {
          from: m1.totalOrders,
          to: m2.totalOrders,
          change: m2.totalOrders - m1.totalOrders,
          changePercent: calcChange(m1.totalOrders, m2.totalOrders)
        },
        totalQuantity: {
          from: m1.totalQuantity,
          to: m2.totalQuantity,
          change: m2.totalQuantity - m1.totalQuantity,
          changePercent: calcChange(m1.totalQuantity, m2.totalQuantity)
        },
        completedOrders: {
          from: m1.completedOrders,
          to: m2.completedOrders,
          change: m2.completedOrders - m1.completedOrders,
          changePercent: calcChange(m1.completedOrders, m2.completedOrders)
        },
        delayedOrders: {
          from: m1.delayedOrders,
          to: m2.delayedOrders,
          change: m2.delayedOrders - m1.delayedOrders,
          changePercent: calcChange(m1.delayedOrders, m2.delayedOrders)
        },
        completionRate: {
          from: m1.totalOrders > 0 ? (m1.completedOrders / m1.totalOrders) * 100 : 0,
          to: m2.totalOrders > 0 ? (m2.completedOrders / m2.totalOrders) * 100 : 0
        },
        delayRate: {
          from: m1.totalOrders > 0 ? (m1.delayedOrders / m1.totalOrders) * 100 : 0,
          to: m2.totalOrders > 0 ? (m2.delayedOrders / m2.totalOrders) * 100 : 0
        }
      },
      stageBacklogChanges: Object.keys(m1.stageBacklog).reduce((acc, stage) => {
        acc[stage] = {
          from: m1.stageBacklog[stage],
          to: m2.stageBacklog[stage],
          change: m2.stageBacklog[stage] - m1.stageBacklog[stage],
          changePercent: calcChange(m1.stageBacklog[stage], m2.stageBacklog[stage])
        };
        return acc;
      }, {})
    };
  }

  /**
   * Get all available snapshot dates
   */
  async getAvailableDates(factory = 'ALL') {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_SUMMARY], 'readonly');
      const store = transaction.objectStore(STORE_SUMMARY);
      const request = store.getAll();

      request.onsuccess = () => {
        const snapshots = request.result
          .filter(s => factory === 'ALL' || s.factory === factory)
          .map(s => s.date)
          .sort();
        resolve([...new Set(snapshots)]);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete old snapshots (keep last N days)
   */
  async cleanupOldSnapshots(keepDays = 90) {
    await this.init();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    cutoffDate.setHours(0, 0, 0, 0);

    const deleteFromStore = (storeName) => {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const index = store.index('date');
        const range = IDBKeyRange.upperBound(cutoffDate.toISOString());

        let deletedCount = 0;
        const request = index.openCursor(range);

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            resolve(deletedCount);
          }
        };

        request.onerror = () => reject(request.error);
      });
    };

    const summaryDeleted = await deleteFromStore(STORE_SUMMARY);
    const snapshotDeleted = await deleteFromStore(STORE_SNAPSHOTS);

    return { summaryDeleted, snapshotDeleted };
  }

  /**
   * Get storage usage estimate
   */
  async getStorageStats() {
    await this.init();

    const countStore = (storeName) => {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    };

    const [summaryCount, snapshotCount] = await Promise.all([
      countStore(STORE_SUMMARY),
      countStore(STORE_SNAPSHOTS)
    ]);

    return {
      summarySnapshots: summaryCount,
      fullSnapshots: snapshotCount,
      estimatedSizeMB: (summaryCount * 0.002 + snapshotCount * 0.5).toFixed(2)
    };
  }
}

// Singleton instance
export const snapshotService = new SnapshotService();

export default SnapshotService;

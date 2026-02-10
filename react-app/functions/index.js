/**
 * @fileoverview Firebase Cloud Functions for Rachgia Dashboard
 *
 * Functions:
 * - syncProductionData: Google Sheets → Firestore (30분마다)
 * - saveMonthlySnapshot: 월별 히스토리 저장 (매월 1일)
 * - getAlertThresholds: 사용자별 알림 임계값 조회
 * - setAlertThresholds: 사용자별 알림 임계값 저장
 *
 * @module functions/index
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { google } = require('googleapis');

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// ========================================
// Configuration
// ========================================

// Configuration from environment variables
// Set these in Firebase Console > Functions > Configuration
// or via: firebase functions:secrets:set GOOGLE_SPREADSHEET_ID
// For now, read from process.env (set via .env file or runtime environment)

function getSpreadsheetId() {
  return process.env.GOOGLE_SPREADSHEET_ID || '';
}

function getApiKey() {
  return process.env.GOOGLE_API_KEY || '';
}

const FACTORY_SHEETS = {
  FACTORY_A: 'Factory A Data',
  FACTORY_B: 'Factory B Data',
  FACTORY_C: 'Factory C Data',
  FACTORY_D: 'Factory D Data'
};

// Process stages for production tracking
const PROCESS_STAGES = ['s_cut', 'pre_sew', 'sew_input', 'sew_bal', 's_fit', 'ass_bal', 'wh_in', 'wh_out'];

// ========================================
// Helper Functions
// ========================================

/**
 * Parse date string to Date object
 * @param {string} dateStr - Date string (YYYY-MM-DD or MM/DD/YYYY)
 * @returns {Date|null}
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr === '00:00:00') return null;

  // Try ISO format first
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;

  // Try MM/DD/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    date = new Date(parts[2], parts[0] - 1, parts[1]);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

/**
 * Check if order is delayed (SDD > CRD)
 * @param {Object} order - Order data
 * @returns {boolean}
 */
function isDelayed(order) {
  if (order.code04) return false; // Code04 approved
  if (isShipped(order)) return false; // Already shipped

  const sdd = parseDate(order.sdd);
  const crd = parseDate(order.crd);

  if (!sdd || !crd) return false;
  return sdd > crd;
}

/**
 * Get delay days
 * @param {Object} order - Order data
 * @returns {number}
 */
function getDelayDays(order) {
  if (!isDelayed(order)) return 0;

  const sdd = parseDate(order.sdd);
  const crd = parseDate(order.crd);

  if (!sdd || !crd) return 0;
  return Math.ceil((sdd - crd) / (1000 * 60 * 60 * 24));
}

/**
 * Check if order has warning status (CRD within 3 days)
 * @param {Object} order - Order data
 * @returns {boolean}
 */
function isWarning(order) {
  if (isDelayed(order)) return false;
  if (isShipped(order)) return false;

  const crd = parseDate(order.crd);
  if (!crd) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysUntilCrd = Math.ceil((crd - today) / (1000 * 60 * 60 * 24));
  return daysUntilCrd >= 0 && daysUntilCrd <= 3;
}

/**
 * Check if order is shipped
 * @param {Object} order - Order data
 * @returns {boolean}
 */
function isShipped(order) {
  const qty = order.quantity || order.ttl_qty || 0;
  const whOut = order.wh_out || 0;
  return qty > 0 && whOut >= qty;
}

/**
 * Get order status
 * @param {Object} order - Order data
 * @returns {string} 'completed' | 'partial' | 'pending'
 */
function getOrderStatus(order) {
  const qty = order.quantity || order.ttl_qty || 0;
  const whIn = order.wh_in || 0;

  if (qty <= 0) return 'pending';
  if (whIn >= qty) return 'completed';
  if (whIn > 0) return 'partial';
  return 'pending';
}

/**
 * Column name mapping (Excel header → internal field name)
 * Handles various naming conventions from different spreadsheets
 */
const COLUMN_MAPPING = {
  // PO Number variations
  'po': 'po', 'po_no': 'po', 'po#': 'po', 'po number': 'po', 'purchase order': 'po',

  // Style/Model variations
  'style': 'style', 'model': 'model', 'article': 'article', 'style no': 'style',

  // Quantity variations
  'quantity': 'quantity', 'qty': 'quantity', 'ttl_qty': 'quantity', 'total qty': 'quantity',
  'order qty': 'quantity', 'order_qty': 'quantity',

  // Date fields
  'crd': 'crd', 'customer required date': 'crd', 'req date': 'crd',
  'sdd': 'sdd', 'scheduled delivery date': 'sdd', 'ship date': 'sdd', 'delivery date': 'sdd',

  // Location fields
  'destination': 'destination', 'dest': 'destination', 'ship to': 'destination',
  'factory': 'factory', 'plant': 'factory', 'fty': 'factory',

  // Process stages
  's_cut': 's_cut', 'scut': 's_cut', 'cutting': 's_cut',
  'pre_sew': 'pre_sew', 'presew': 'pre_sew',
  'sew_input': 'sew_input', 'sewinput': 'sew_input',
  'sew_bal': 'sew_bal', 'sewbal': 'sew_bal', 'sewing': 'sew_bal',
  's_fit': 's_fit', 'sfit': 's_fit', 'fitting': 's_fit',
  'ass_bal': 'ass_bal', 'assbal': 'ass_bal', 'assembly': 'ass_bal',
  'wh_in': 'wh_in', 'whin': 'wh_in', 'warehouse in': 'wh_in',
  'wh_out': 'wh_out', 'whout': 'wh_out', 'warehouse out': 'wh_out', 'shipped': 'wh_out',

  // Status fields
  'code04': 'code04', 'approved': 'code04',

  // Vendor/Buyer
  'vendor': 'vendor', 'buyer': 'buyer', 'customer': 'buyer'
};

/**
 * Numeric fields that should be parsed as integers
 */
const NUMERIC_FIELDS = [
  'quantity', 's_cut', 'pre_sew', 'sew_input', 'sew_bal',
  's_fit', 'ass_bal', 'wh_in', 'wh_out'
];

/**
 * Boolean fields
 */
const BOOLEAN_FIELDS = ['code04'];

/**
 * Convert sheet row to order object
 * @param {Array} row - Sheet row data
 * @param {Array} headers - Column headers
 * @returns {Object} Order object
 */
function rowToOrder(row, headers) {
  const order = {};

  headers.forEach((header, index) => {
    // Normalize header name
    const normalizedHeader = header.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    // Map to internal field name
    const fieldName = COLUMN_MAPPING[normalizedHeader] || normalizedHeader;

    let value = row[index];

    // Skip empty values
    if (value === undefined || value === null || value === '') {
      return;
    }

    // Parse numeric fields
    if (NUMERIC_FIELDS.includes(fieldName)) {
      value = parseInt(String(value).replace(/,/g, ''), 10) || 0;
    }

    // Parse boolean fields
    if (BOOLEAN_FIELDS.includes(fieldName)) {
      value = value === 'Y' || value === 'y' || value === 'true' || value === true || value === '1';
    }

    order[fieldName] = value;
  });

  // Ensure model field exists (fallback chain)
  if (!order.model) {
    order.model = order.style || order.article || 'Unknown';
  }

  return order;
}

/**
 * Calculate statistics from orders
 * @param {Array} orders - Array of order objects
 * @returns {Object} Statistics object
 */
function calculateStatistics(orders) {
  const stats = {
    totalOrders: orders.length,
    totalQuantity: 0,
    completedQuantity: 0,
    shippedQuantity: 0,
    delayedOrders: 0,
    delayedQuantity: 0,
    warningOrders: 0,
    warningQuantity: 0,
    pendingOrders: 0,
    partialOrders: 0,
    completedOrders: 0,
    // Delay severity breakdown
    delayMinor: 0,      // 1-3 days
    delayModerate: 0,   // 4-7 days
    delaySevere: 0,     // 8+ days
    // Process stage totals
    processData: {}
  };

  // Initialize process data
  PROCESS_STAGES.forEach(stage => {
    stats.processData[stage] = { total: 0, completed: 0 };
  });

  orders.forEach(order => {
    const qty = order.quantity || order.ttl_qty || 0;
    const whIn = order.wh_in || 0;
    const whOut = order.wh_out || 0;

    stats.totalQuantity += qty;
    stats.completedQuantity += whIn;
    stats.shippedQuantity += whOut;

    // Status counting
    const status = getOrderStatus(order);
    if (status === 'completed') stats.completedOrders++;
    else if (status === 'partial') stats.partialOrders++;
    else stats.pendingOrders++;

    // Delay counting
    if (isDelayed(order)) {
      stats.delayedOrders++;
      stats.delayedQuantity += qty;

      // Severity breakdown
      const delayDays = getDelayDays(order);
      if (delayDays <= 3) stats.delayMinor++;
      else if (delayDays <= 7) stats.delayModerate++;
      else stats.delaySevere++;
    }

    // Warning counting
    if (isWarning(order)) {
      stats.warningOrders++;
      stats.warningQuantity += qty;
    }

    // Process stage data
    PROCESS_STAGES.forEach(stage => {
      stats.processData[stage].total += qty;
      stats.processData[stage].completed += order[stage] || 0;
    });
  });

  // Calculate rates
  stats.completionRate = stats.totalQuantity > 0
    ? ((stats.completedQuantity / stats.totalQuantity) * 100).toFixed(2)
    : '0.00';

  stats.delayRate = stats.totalOrders > 0
    ? ((stats.delayedOrders / stats.totalOrders) * 100).toFixed(2)
    : '0.00';

  stats.shippedRate = stats.totalQuantity > 0
    ? ((stats.shippedQuantity / stats.totalQuantity) * 100).toFixed(2)
    : '0.00';

  return stats;
}

/**
 * Group orders by date (for daily data)
 * @param {Array} orders - Array of orders
 * @param {string} dateField - Field to group by ('crd' or 'sdd')
 * @returns {Array} Daily data array
 */
function groupByDate(orders, dateField = 'crd') {
  const grouped = {};

  orders.forEach(order => {
    const dateStr = order[dateField];
    const date = parseDate(dateStr);
    if (!date) return;

    const key = date.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        orders: 0,
        quantity: 0,
        completed: 0,
        delayed: 0
      };
    }

    grouped[key].orders++;
    grouped[key].quantity += order.quantity || order.ttl_qty || 0;
    grouped[key].completed += order.wh_in || 0;
    if (isDelayed(order)) grouped[key].delayed++;
  });

  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Group orders by model
 * @param {Array} orders - Array of orders
 * @returns {Array} Model data array
 */
function groupByModel(orders) {
  const grouped = {};

  orders.forEach(order => {
    const model = order.model || order.style || order.article || 'Unknown';
    const qty = order.quantity || order.ttl_qty || 0;

    if (!grouped[model]) {
      grouped[model] = {
        model,
        orders: 0,
        quantity: 0,
        delayedQuantity: 0
      };
    }

    grouped[model].orders++;
    grouped[model].quantity += qty;
    if (isDelayed(order)) grouped[model].delayedQuantity += qty;
  });

  return Object.values(grouped)
    .map(m => ({
      ...m,
      delayRate: m.quantity > 0 ? ((m.delayedQuantity / m.quantity) * 100).toFixed(2) : '0.00'
    }))
    .sort((a, b) => b.quantity - a.quantity);
}

/**
 * Group orders by destination
 * @param {Array} orders - Array of orders
 * @returns {Array} Destination data array
 */
function groupByDestination(orders) {
  const grouped = {};

  orders.forEach(order => {
    const dest = order.destination || 'Unknown';
    const qty = order.quantity || order.ttl_qty || 0;

    if (!grouped[dest]) {
      grouped[dest] = {
        destination: dest,
        orders: 0,
        quantity: 0,
        completed: 0
      };
    }

    grouped[dest].orders++;
    grouped[dest].quantity += qty;
    grouped[dest].completed += order.wh_out || 0;
  });

  return Object.values(grouped).sort((a, b) => b.quantity - a.quantity);
}

// ========================================
// Google Sheets API Functions
// ========================================

/**
 * Fetch data from Google Sheets
 * @param {string} sheetName - Name of the sheet to fetch
 * @returns {Promise<Array>} Array of order objects
 */
async function fetchSheetData(sheetName) {
  const spreadsheetId = getSpreadsheetId();
  const apiKey = getApiKey();

  // Check if Sheets API is configured
  if (!spreadsheetId || !apiKey) {
    console.warn(`[fetchSheetData] Sheets API not configured. Using cached data for ${sheetName}`);
    return await fetchCachedOrMockData(sheetName);
  }

  const sheets = google.sheets({ version: 'v4', auth: apiKey });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A:Z`, // Adjust range as needed
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      console.log(`No data found in sheet: ${sheetName}`);
      return [];
    }

    const headers = rows[0];
    const orders = rows.slice(1).map(row => rowToOrder(row, headers));

    console.log(`Fetched ${orders.length} orders from ${sheetName}`);
    return orders;

  } catch (error) {
    console.error(`Error fetching sheet ${sheetName}:`, error.message);

    // Try to use cached data as fallback
    console.log(`Attempting to use cached data for ${sheetName}`);
    return await fetchCachedOrMockData(sheetName);
  }
}

/**
 * Fetch cached data from Firestore or return mock data
 * @param {string} sheetName - Sheet name to identify factory
 * @returns {Promise<Array>} Array of order objects
 */
async function fetchCachedOrMockData(sheetName) {
  // Map sheet name to factory ID
  const factoryId = Object.entries(FACTORY_SHEETS)
    .find(([, name]) => name === sheetName)?.[0];

  if (!factoryId) {
    console.warn(`Unknown sheet: ${sheetName}`);
    return [];
  }

  try {
    // Try to get existing cached data
    const cacheDoc = await db.collection('productionCache').doc(factoryId).get();
    if (cacheDoc.exists && cacheDoc.data().orders) {
      console.log(`Using existing cached orders for ${factoryId}`);
      return cacheDoc.data().orders;
    }
  } catch (e) {
    console.warn(`Could not fetch cached data: ${e.message}`);
  }

  // Return empty array if no cache available
  console.warn(`No cached data available for ${sheetName}`);
  return [];
}

// ========================================
// Cloud Functions
// ========================================

/**
 * Sync production data from Google Sheets to Firestore
 * Runs every 30 minutes
 */
exports.syncProductionData = onSchedule({
  schedule: 'every 30 minutes',
  timeZone: 'Asia/Ho_Chi_Minh',
  region: 'asia-northeast3'
}, async (_context) => {
  try {
    return await performDataSync();
  } catch (error) {
    console.error('Scheduled sync failed:', error);
    throw error;
  }
});

/**
 * Core sync logic - shared between scheduled and manual sync
 * @returns {Promise<Object>} Sync result
 */
async function performDataSync() {
  console.log('Starting production data sync...');
  const startTime = Date.now();

  const allOrders = [];
  const factoryResults = {};

  // Fetch data for each factory
  for (const [factoryId, sheetName] of Object.entries(FACTORY_SHEETS)) {
    try {
      const orders = await fetchSheetData(sheetName);

      // Add factory info and calculated fields
      const enrichedOrders = orders.map(order => ({
        ...order,
        factory: factoryId,
        isDelayed: isDelayed(order),
        isWarning: isWarning(order),
        isShipped: isShipped(order),
        delayDays: getDelayDays(order),
        status: getOrderStatus(order)
      }));

      allOrders.push(...enrichedOrders);

      // Calculate factory statistics
      const statistics = calculateStatistics(enrichedOrders);
      const dailyData = groupByDate(enrichedOrders);
      const modelData = groupByModel(enrichedOrders);
      const destinationData = groupByDestination(enrichedOrders);

      factoryResults[factoryId] = {
        factoryId,
        factoryName: `Factory ${factoryId.split('_')[1]}`,
        statistics,
        dailyData,
        modelData,
        destinationData,
        processData: statistics.processData,
        orderCount: enrichedOrders.length,
        updatedAt: FieldValue.serverTimestamp()
      };

      // Save to Firestore
      await db.collection('productionCache').doc(factoryId).set(factoryResults[factoryId]);
      console.log(`Saved ${factoryId} to Firestore`);

    } catch (factoryError) {
      console.error(`Error processing ${factoryId}:`, factoryError.message);
    }
  }

  // Calculate and save aggregated data (ALL_FACTORIES)
  const allStatistics = calculateStatistics(allOrders);
  const allDailyData = groupByDate(allOrders);
  const allModelData = groupByModel(allOrders);
  const allDestinationData = groupByDestination(allOrders);

  const allFactoriesData = {
    factoryId: 'ALL_FACTORIES',
    factoryName: 'All Factories',
    statistics: allStatistics,
    dailyData: allDailyData,
    modelData: allModelData,
    destinationData: allDestinationData,
    processData: allStatistics.processData,
    orderCount: allOrders.length,
    factoryBreakdown: Object.keys(factoryResults).map(fid => ({
      factoryId: fid,
      orderCount: factoryResults[fid].orderCount,
      statistics: factoryResults[fid].statistics
    })),
    updatedAt: FieldValue.serverTimestamp()
  };

  await db.collection('productionCache').doc('ALL_FACTORIES').set(allFactoriesData);

  const duration = Date.now() - startTime;
  console.log(`Production data sync completed in ${duration}ms`);
  console.log(`Total orders processed: ${allOrders.length}`);

  return { success: true, ordersProcessed: allOrders.length, duration };
}

/**
 * Manual trigger for production data sync
 * Callable from dashboard for immediate refresh
 */
exports.manualSyncProductionData = onCall({
  region: 'asia-northeast3'
}, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  console.log(`Manual sync triggered by user: ${request.auth.uid}`);

  try {
    const result = await performDataSync();
    return result;
  } catch (error) {
    console.error('Manual sync failed:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Save monthly snapshot for historical comparison
 * Runs on the 1st of each month at 00:30
 */
exports.saveMonthlySnapshot = onSchedule({
  schedule: '30 0 1 * *', // 1st of month at 00:30
  timeZone: 'Asia/Ho_Chi_Minh',
  region: 'asia-northeast3'
}, async (_context) => {
  console.log('Saving monthly snapshot...');

  try {
    const now = new Date();
    // Get previous month (since we run on 1st)
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    // Get current cache data
    const factories = ['FACTORY_A', 'FACTORY_B', 'FACTORY_C', 'FACTORY_D', 'ALL_FACTORIES'];

    for (const factoryId of factories) {
      const cacheDoc = await db.collection('productionCache').doc(factoryId).get();

      if (cacheDoc.exists) {
        const data = cacheDoc.data();

        // Save to history collection
        await db.collection('productionHistory')
          .doc(factoryId)
          .collection('monthly')
          .doc(monthKey)
          .set({
            ...data.statistics,
            monthKey,
            factoryId,
            snapshotDate: FieldValue.serverTimestamp()
          });

        console.log(`Saved monthly snapshot for ${factoryId}: ${monthKey}`);
      }
    }

    return { success: true, month: monthKey };

  } catch (error) {
    console.error('Monthly snapshot failed:', error);
    throw error;
  }
});

/**
 * Get historical comparison data
 * Returns current vs previous month statistics
 */
exports.getHistoricalComparison = onCall({
  region: 'asia-northeast3'
}, async (request) => {
  const factoryId = request.data?.factoryId || 'ALL_FACTORIES';

  try {
    // Get current data
    const currentDoc = await db.collection('productionCache').doc(factoryId).get();
    const currentStats = currentDoc.exists ? currentDoc.data().statistics : null;

    // Get previous month
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    const prevDoc = await db.collection('productionHistory')
      .doc(factoryId)
      .collection('monthly')
      .doc(prevMonthKey)
      .get();

    const previousStats = prevDoc.exists ? prevDoc.data() : null;

    // Calculate comparison
    const comparison = {};

    if (currentStats && previousStats) {
      const metrics = [
        { key: 'totalOrders', lowerIsBetter: false },
        { key: 'totalQuantity', lowerIsBetter: false },
        { key: 'completedQuantity', lowerIsBetter: false },
        { key: 'delayedOrders', lowerIsBetter: true },
        { key: 'warningOrders', lowerIsBetter: true },
        { key: 'completionRate', lowerIsBetter: false },
        { key: 'delayRate', lowerIsBetter: true }
      ];

      metrics.forEach(({ key, lowerIsBetter }) => {
        const current = parseFloat(currentStats[key]) || 0;
        const previous = parseFloat(previousStats[key]) || 0;
        const change = previous !== 0 ? ((current - previous) / previous * 100) : 0;

        let trend = 'neutral';
        if (Math.abs(change) > 5) { // 5% threshold
          const improved = lowerIsBetter ? change < 0 : change > 0;
          trend = improved ? 'improved' : 'declined';
        }

        comparison[key] = {
          current,
          previous,
          change: change.toFixed(1),
          trend
        };
      });
    }

    return {
      factoryId,
      currentMonth: new Date().toISOString().slice(0, 7),
      previousMonth: prevMonthKey,
      current: currentStats,
      previous: previousStats,
      comparison
    };

  } catch (error) {
    console.error('Error getting historical comparison:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Get user alert thresholds
 */
exports.getAlertThresholds = onCall({
  region: 'asia-northeast3'
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;

  try {
    const doc = await db.collection('userSettings').doc(userId).get();

    if (doc.exists && doc.data().alertThresholds) {
      return doc.data().alertThresholds;
    }

    // Return defaults
    return {
      delayed: {
        orderCount: 1,
        quantity: 0,
        enabled: true
      },
      warning: {
        orderCount: 10,
        daysBeforeCrd: 3,
        enabled: true
      },
      completion: {
        minRate: 80,
        enabled: true
      },
      notifications: {
        dashboardBanner: true,
        browserNotification: true,
        email: false
      }
    };

  } catch (error) {
    console.error('Error getting alert thresholds:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Set user alert thresholds
 */
exports.setAlertThresholds = onCall({
  region: 'asia-northeast3'
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const thresholds = request.data;

  // Validate thresholds
  if (!thresholds || typeof thresholds !== 'object') {
    throw new HttpsError('invalid-argument', 'Invalid thresholds data');
  }

  try {
    await db.collection('userSettings').doc(userId).set({
      alertThresholds: thresholds,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true };

  } catch (error) {
    console.error('Error setting alert thresholds:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Check alerts against user thresholds
 * 현재 통계가 사용자 임계값을 초과하는지 확인
 */
exports.checkAlerts = onCall({
  region: 'asia-northeast3'
}, async (request) => {
  const factoryId = request.data?.factoryId || 'ALL_FACTORIES';
  const userId = request.auth?.uid || 'default';

  try {
    // Get current statistics
    const cacheDoc = await db.collection('productionCache').doc(factoryId).get();
    if (!cacheDoc.exists) {
      return { success: false, error: 'No data available', alerts: [] };
    }

    const stats = cacheDoc.data().statistics || {};

    // Get user thresholds (or defaults)
    let thresholds;
    if (userId !== 'default') {
      const thresholdDoc = await db.collection('userSettings').doc(userId).get();
      thresholds = thresholdDoc.exists ? thresholdDoc.data().alertThresholds : null;
    }

    if (!thresholds) {
      thresholds = {
        delayed: { orderCount: 10, quantity: 1000, enabled: true },
        warning: { orderCount: 20, daysBeforeCrd: 3, enabled: true },
        completion: { minRate: 80, enabled: true }
      };
    }

    const alerts = [];

    // Check delayed orders
    if (thresholds.delayed?.enabled) {
      const delayedOrders = parseInt(stats.delayedOrders) || 0;
      const delayedQty = parseInt(stats.delayedQuantity) || 0;

      if (delayedOrders >= (thresholds.delayed.orderCount || 10)) {
        alerts.push({
          type: 'delayed',
          severity: 'error',
          title: '지연 주문 경고',
          message: `지연 주문 ${delayedOrders}건 (임계값: ${thresholds.delayed.orderCount}건)`,
          value: delayedOrders,
          threshold: thresholds.delayed.orderCount
        });
      }

      if ((thresholds.delayed.quantity || 0) > 0 && delayedQty >= thresholds.delayed.quantity) {
        alerts.push({
          type: 'delayed_qty',
          severity: 'error',
          title: '지연 수량 경고',
          message: `지연 수량 ${delayedQty.toLocaleString()}pcs (임계값: ${thresholds.delayed.quantity.toLocaleString()}pcs)`,
          value: delayedQty,
          threshold: thresholds.delayed.quantity
        });
      }
    }

    // Check warning orders
    if (thresholds.warning?.enabled) {
      const warningOrders = parseInt(stats.warningOrders) || 0;
      if (warningOrders >= (thresholds.warning.orderCount || 20)) {
        alerts.push({
          type: 'warning',
          severity: 'warning',
          title: '경고 주문 알림',
          message: `경고 주문 ${warningOrders}건 (임계값: ${thresholds.warning.orderCount}건)`,
          value: warningOrders,
          threshold: thresholds.warning.orderCount
        });
      }
    }

    // Check completion rate
    if (thresholds.completion?.enabled) {
      const completionRate = parseFloat(stats.completionRate) || 0;
      const minRate = thresholds.completion.minRate || 80;
      if (completionRate < minRate) {
        alerts.push({
          type: 'completion',
          severity: 'warning',
          title: '완료율 저조',
          message: `완료율 ${completionRate}% (목표: ${minRate}%)`,
          value: completionRate,
          threshold: minRate
        });
      }
    }

    return {
      success: true,
      factoryId,
      alerts,
      alertCount: alerts.length,
      hasErrors: alerts.some(a => a.severity === 'error'),
      hasWarnings: alerts.some(a => a.severity === 'warning'),
      checkedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error checking alerts:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Get historical trend data for charts (multiple months)
 * 차트용 여러 달의 히스토리 데이터 조회
 */
exports.getHistoricalTrend = onCall({
  region: 'asia-northeast3'
}, async (request) => {
  const factoryId = request.data?.factoryId || 'ALL_FACTORIES';
  const months = request.data?.months || 6;

  try {
    const historyRef = db.collection('productionHistory')
      .doc(factoryId)
      .collection('monthly');

    const snapshot = await historyRef
      .orderBy('monthKey', 'desc')
      .limit(months)
      .get();

    const history = [];
    snapshot.forEach(doc => {
      history.push({
        monthKey: doc.id,
        ...doc.data()
      });
    });

    // Sort ascending for charts
    history.sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    return {
      success: true,
      factoryId,
      months: history.length,
      history
    };

  } catch (error) {
    console.error('Error getting historical trend:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * HTTP endpoint to check sync status
 */
exports.getSyncStatus = onRequest({
  region: 'asia-northeast3',
  cors: true
}, async (req, res) => {
  try {
    const factories = ['FACTORY_A', 'FACTORY_B', 'FACTORY_C', 'FACTORY_D', 'ALL_FACTORIES'];
    const status = {};

    for (const factoryId of factories) {
      const doc = await db.collection('productionCache').doc(factoryId).get();
      if (doc.exists) {
        const data = doc.data();
        status[factoryId] = {
          orderCount: data.orderCount,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
          delayedOrders: data.statistics?.delayedOrders || 0,
          completionRate: data.statistics?.completionRate || '0'
        };
      }
    }

    res.json({ success: true, status, timestamp: new Date().toISOString() });

  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

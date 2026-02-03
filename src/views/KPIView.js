/**
 * KPIView.js - KPI & Summary View Module
 * ======================================
 *
 * Handles all KPI cards, summary statistics, alerts, process flow visualization,
 * vendor sections, factory cards, and regional (Asia) statistics.
 *
 * Dependencies:
 * - OrderModel: isDelayed, isWarning, isShipped, isToday
 * - ChartModel: PROCESS_ORDER, PROCESS_LABELS
 * - FilterModel: IMPORTANT_DESTINATIONS
 * - Utilities: formatNumber, updateOrCreateChart
 *
 * @module views/KPIView
 * @agent A07 (MVC Architect)
 * @phase H06 - MVC 구조 리팩토링 Phase 2
 * @version 19.0.0
 */

// ============================================================================
// Module State (Dependency Injection)
// ============================================================================

/** @type {Array} All order data */
let allData = [];

/** @type {Array} Filtered order data */
let filteredData = [];

/** @type {Function} Check if order is delayed */
let isDelayed = () => false;

/** @type {Function} Check if order is warning */
let isWarning = () => false;

/** @type {Function} Check if order is shipped */
let isShipped = () => false;

/** @type {Function} Check if order is for today */
let isToday = () => false;

/** @type {Array} Process order keys */
let PROCESS_ORDER = ['s_cut', 'pre_sew', 'sew_input', 'sew_bal', 's_fit', 'ass_bal', 'wh_in', 'wh_out'];

/** @type {Object} Process display names */
let PROCESS_NAMES = {
  s_cut: '재단',
  pre_sew: '선봉',
  sew_input: '재봉투입',
  sew_bal: '재봉',
  s_fit: '핏팅',
  ass_bal: '조립',
  wh_in: '입고',
  wh_out: '출고',
};

/** @type {Object} Important destinations with emoji flags */
let IMPORTANT_DESTINATIONS = {};

/** @type {Function} Format number with locale */
let formatNumber = n => n?.toLocaleString?.() || '0';

/** @type {Function} Update or create Chart.js instance */
let updateOrCreateChart = () => {};

/** @type {Object} Logger instance */
let log = {
  info: console.log,
  debug: console.debug,
  warn: console.warn,
  error: console.error,
};

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize KPIView with dependencies
 *
 * @param {Object} dependencies - Dependency injection object
 * @param {Array} [dependencies.allData] - All order data
 * @param {Array} [dependencies.filteredData] - Filtered order data
 * @param {Function} [dependencies.isDelayed] - Delay check function
 * @param {Function} [dependencies.isWarning] - Warning check function
 * @param {Function} [dependencies.isShipped] - Shipped check function
 * @param {Function} [dependencies.isToday] - Today check function
 * @param {Array} [dependencies.PROCESS_ORDER] - Process order array
 * @param {Object} [dependencies.PROCESS_NAMES] - Process display names
 * @param {Object} [dependencies.IMPORTANT_DESTINATIONS] - Destination emoji map
 * @param {Function} [dependencies.formatNumber] - Number formatter
 * @param {Function} [dependencies.updateOrCreateChart] - Chart manager function
 * @param {Object} [dependencies.log] - Logger instance
 */
export function initKPIView(dependencies = {}) {
  if (dependencies.allData !== undefined) allData = dependencies.allData;
  if (dependencies.filteredData !== undefined) filteredData = dependencies.filteredData;
  if (dependencies.isDelayed) isDelayed = dependencies.isDelayed;
  if (dependencies.isWarning) isWarning = dependencies.isWarning;
  if (dependencies.isShipped) isShipped = dependencies.isShipped;
  if (dependencies.isToday) isToday = dependencies.isToday;
  if (dependencies.PROCESS_ORDER) PROCESS_ORDER = dependencies.PROCESS_ORDER;
  if (dependencies.PROCESS_NAMES) PROCESS_NAMES = dependencies.PROCESS_NAMES;
  if (dependencies.IMPORTANT_DESTINATIONS)
    IMPORTANT_DESTINATIONS = dependencies.IMPORTANT_DESTINATIONS;
  if (dependencies.formatNumber) formatNumber = dependencies.formatNumber;
  if (dependencies.updateOrCreateChart) updateOrCreateChart = dependencies.updateOrCreateChart;
  if (dependencies.log) log = dependencies.log;

  log.info('[KPIView] Initialized with dependencies');
}

/**
 * Update data references (call when data changes)
 *
 * @param {Array} newAllData - Updated all data
 * @param {Array} newFilteredData - Updated filtered data
 */
export function updateKPIData(newAllData, newFilteredData) {
  allData = newAllData;
  filteredData = newFilteredData;
}

// ============================================================================
// Weekly Summary Functions
// ============================================================================

/**
 * Update weekly summary statistics
 * Shows SDD/CRD delay counts, sewing completion, warehouse output
 *
 * DOM Elements Updated:
 * - sddDelayCount, sddWarningCount
 * - crdDelayCount, crdWarningCount
 * - sewingCompleteCount, warehouseOutCount
 * - summaryUpdateTime
 */
export function updateWeeklySummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let sddDelayed = 0,
    sddWarning = 0;
  let crdDelayed = 0,
    crdWarning = 0;
  let sewingComplete = 0;
  let warehouseOut = 0;

  // Defensive: ensure allData is an array
  const safeAllData = Array.isArray(allData) ? allData : [];

  safeAllData.forEach(d => {
    const qty = d.quantity || 0;
    const sewBalCompleted = d.production?.sew_bal?.completed || 0;
    const whOutCompleted = d.production?.wh_out?.completed || 0;

    if (sewBalCompleted >= qty && qty > 0) sewingComplete++;
    if (whOutCompleted >= qty && qty > 0) warehouseOut++;

    // Only check delays for incomplete orders
    if (whOutCompleted < qty) {
      if (isDelayed(d)) sddDelayed++;
      else if (isWarning(d)) sddWarning++;

      // CRD-based delays
      const crd = d.crd;
      if (crd && crd !== '00:00:00') {
        try {
          const crdDate = new Date(crd.replace(/\./g, '-'));
          crdDate.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((crdDate - today) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) crdDelayed++;
          else if (diffDays <= 3) crdWarning++;
        } catch (_e) {
          log.debug('[KPIView] Invalid CRD date:', crd);
        }
      }
    }
  });

  // Update DOM elements
  const setTextContent = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setTextContent('sddDelayCount', sddDelayed + '건');
  setTextContent('sddWarningCount', sddWarning + '건');
  setTextContent('crdDelayCount', crdDelayed + '건');
  setTextContent('crdWarningCount', crdWarning + '건');
  setTextContent('sewingCompleteCount', sewingComplete + '건');
  setTextContent('warehouseOutCount', warehouseOut + '건');
  setTextContent(
    'summaryUpdateTime',
    new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );

  log.debug('[KPIView] Weekly summary updated');
}

// ============================================================================
// Main Summary Functions
// ============================================================================

/**
 * Find the bottleneck process (lowest completion rate)
 *
 * @returns {{key: string|null, rate: number}} Bottleneck process info
 */
export function findBottleneck() {
  let minRate = 100;
  let bottleneckKey = null;

  // Defensive: ensure filteredData is an array
  const safeFilteredData = Array.isArray(filteredData) ? filteredData : [];

  PROCESS_ORDER.forEach(key => {
    let completed = 0,
      total = 0;

    safeFilteredData.forEach(d => {
      const p = d.production?.[key];
      if (p) {
        completed += p.completed || 0;
        total += (p.completed || 0) + (p.pending || 0);
      }
    });

    const rate = total > 0 ? (completed / total) * 100 : 100;
    if (rate < minRate) {
      minRate = rate;
      bottleneckKey = key;
    }
  });

  return { key: bottleneckKey, rate: minRate };
}

/**
 * Update main summary statistics
 * Shows total orders, quantities, completion rates, factory rankings
 *
 * DOM Elements Updated:
 * - totalOrders, totalQty, totalCompleted, totalRate
 * - execCompletionRate, execTodayCount, execTodayQty
 * - execFactoryRanking, execWarnings
 * - rateDonut (Chart)
 */
export function updateSummary() {
  // Defensive: ensure filteredData is an array
  const safeFilteredData = Array.isArray(filteredData) ? filteredData : [];
  const safeAllData = Array.isArray(allData) ? allData : [];

  const totalQty = safeFilteredData.reduce((sum, d) => sum + (d.quantity || 0), 0);
  const totalCompleted = safeFilteredData.reduce(
    (sum, d) => sum + (d.production?.wh_in?.completed || 0),
    0
  );
  const rate = totalQty > 0 ? (totalCompleted / totalQty) * 100 : 0;

  // Update DOM elements
  const setTextContent = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setTextContent('totalOrders', formatNumber(safeFilteredData.length) + '건');
  setTextContent('totalQty', formatNumber(totalQty) + '족');
  setTextContent('totalCompleted', formatNumber(totalCompleted) + '족');
  setTextContent('totalRate', rate.toFixed(1) + '%');
  setTextContent('execCompletionRate', rate.toFixed(1) + '%');

  // Update donut chart
  const donutCanvas = document.getElementById('rateDonut');
  if (donutCanvas) {
    updateOrCreateChart('rateDonut', donutCanvas, {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [rate, 100 - rate],
            backgroundColor: ['#8b5cf6', '#e5e7eb'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: '70%',
        plugins: { legend: { display: false } },
        responsive: true,
        maintainAspectRatio: true,
      },
    });
  }

  // Today's orders
  const todayOrders = safeAllData.filter(isToday);
  const todayQty = todayOrders.reduce((sum, d) => sum + (d.quantity || 0), 0);
  setTextContent('execTodayCount', todayOrders.length + '건');
  setTextContent('execTodayQty', formatNumber(todayQty) + '족');

  // Factory rankings
  const factoryRates = ['A', 'B', 'C', 'D']
    .map(f => {
      const fData = safeFilteredData.filter(d => d.factory === f);
      const fQty = fData.reduce((s, d) => s + (d.quantity || 0), 0);
      const fCompleted = fData.reduce((s, d) => s + (d.production?.wh_in?.completed || 0), 0);
      return { factory: f, rate: fQty > 0 ? (fCompleted / fQty) * 100 : 0 };
    })
    .sort((a, b) => b.rate - a.rate);

  const rankingEl = document.getElementById('execFactoryRanking');
  if (rankingEl) {
    rankingEl.innerHTML = factoryRates
      .map(
        (f, i) => `<span class="mr-2">${i + 1}. Factory ${f.factory}: ${f.rate.toFixed(1)}%</span>`
      )
      .join('');
  }

  // Warnings
  const delayed = safeAllData.filter(isDelayed);
  const warnings = [];

  if (delayed.length > 0) {
    warnings.push(`🚨 지연 ${delayed.length}건`);
  }

  const bottleneck = findBottleneck();
  if (bottleneck && bottleneck.rate < 80) {
    const processName = PROCESS_NAMES[bottleneck.key] || bottleneck.key;
    warnings.push(`🔴 병목: ${processName} (${bottleneck.rate.toFixed(1)}%)`);
  }

  const warningsEl = document.getElementById('execWarnings');
  if (warningsEl) {
    warningsEl.innerHTML = warnings.length > 0 ? warnings.join(' | ') : '✅ 정상';
  }

  log.debug('[KPIView] Summary updated');
}

// ============================================================================
// Alert Functions
// ============================================================================

/**
 * Update alert section with delay/warning/shipped statistics
 *
 * DOM Elements Updated:
 * - delayedOrderCount, delayedOrderQty
 * - warningOrderCount, warningOrderQty
 * - inventoryCount, inventoryOrders
 * - shippedOrderCount, shippedOrderQty
 * - alertSection, delayAlert, delayCount
 * - execDelayCount, execInventory, execInventoryOrders
 */
export function updateAlerts() {
  // Defensive: ensure allData is an array
  const safeAllData = Array.isArray(allData) ? allData : [];

  const delayed = safeAllData.filter(isDelayed);
  const warning = safeAllData.filter(isWarning);
  const delayedQty = delayed.reduce((sum, d) => sum + (d.quantity || 0), 0);
  const warningQty = warning.reduce((sum, d) => sum + (d.quantity || 0), 0);

  // Update DOM elements
  const setTextContent = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setTextContent('delayedOrderCount', delayed.length + '건');
  setTextContent('delayedOrderQty', formatNumber(delayedQty) + '족');
  setTextContent('warningOrderCount', warning.length + '건');
  setTextContent('warningOrderQty', formatNumber(warningQty) + '족');
  setTextContent('execDelayCount', delayed.length + '건');

  // Calculate inventory (WH_IN - WH_OUT difference)
  let invQty = 0,
    invCount = 0;
  safeAllData.forEach(d => {
    const diff = (d.production?.wh_in?.completed || 0) - (d.production?.wh_out?.completed || 0);
    if (diff > 0) {
      invQty += diff;
      invCount++;
    }
  });

  setTextContent('inventoryCount', formatNumber(invQty) + '족');
  setTextContent('inventoryOrders', invCount + '건');
  setTextContent('execInventory', formatNumber(invQty));
  setTextContent('execInventoryOrders', invCount + '건');

  // Shipped orders
  const shipped = safeAllData.filter(isShipped);
  const shippedQty = shipped.reduce((sum, d) => sum + (d.quantity || 0), 0);
  setTextContent('shippedOrderCount', shipped.length + '건');
  setTextContent('shippedOrderQty', formatNumber(shippedQty) + '족');

  // Toggle alert section visibility
  const alertSection = document.getElementById('alertSection');
  if (alertSection) {
    const hasAlerts = delayed.length > 0 || warning.length > 0 || shipped.length > 0;
    alertSection.classList.toggle('hidden', !hasAlerts);
  }

  const delayAlert = document.getElementById('delayAlert');
  if (delayAlert) {
    delayAlert.classList.toggle('hidden', delayed.length === 0);
  }

  setTextContent('delayCount', delayed.length.toString());

  log.debug('[KPIView] Alerts updated');
}

// ============================================================================
// Process Flow Functions
// ============================================================================

/**
 * Update process flow visualization (funnel chart and progress bars)
 *
 * DOM Elements Updated:
 * - funnelChart (innerHTML)
 * - processProgress (innerHTML)
 */
export function updateProcessFlow() {
  const processData = {};
  let minRate = 100,
    bottleneckKey = null;

  // Defensive: ensure filteredData is an array
  const safeFilteredData = Array.isArray(filteredData) ? filteredData : [];

  // Initialize process data
  PROCESS_ORDER.forEach(key => {
    processData[key] = { completed: 0, pending: 0 };
  });

  // Aggregate data
  safeFilteredData.forEach(d => {
    PROCESS_ORDER.forEach(key => {
      const p = d.production?.[key];
      if (p) {
        processData[key].completed += p.completed || 0;
        processData[key].pending += p.pending || 0;
      }
    });
  });

  // Find bottleneck
  PROCESS_ORDER.forEach(key => {
    const data = processData[key];
    const total = data.completed + data.pending;
    const rate = total > 0 ? (data.completed / total) * 100 : 100;
    if (rate < minRate) {
      minRate = rate;
      bottleneckKey = key;
    }
  });

  // Render funnel chart
  const funnelChart = document.getElementById('funnelChart');
  if (funnelChart) {
    funnelChart.innerHTML = PROCESS_ORDER.map((key, i) => {
      const data = processData[key];
      const total = data.completed + data.pending;
      const rate = total > 0 ? (data.completed / total) * 100 : 0;
      const width = 100 - i * 2;
      const color = rate >= 80 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444';
      const isBottleneck = key === bottleneckKey && minRate < 80;
      const processName = PROCESS_NAMES[key] || key;

      return `<div class="funnel-step ${isBottleneck ? 'bottleneck' : ''}"
                style="background: linear-gradient(to right, ${color}40, ${color}20); width: ${width}%"
                data-action="showProcessDetail" data-param="${key}"
                title="${processName}: ${rate.toFixed(1)}%">
                <div class="text-xs font-medium">${processName}</div>
                <div class="text-lg font-bold" style="color: ${color}">${rate.toFixed(0)}%</div>
                <div class="text-xs text-secondary">${formatNumber(data.completed)}</div>
                ${isBottleneck ? '<div class="text-xs text-red-500">병목</div>' : ''}
            </div>`;
    }).join('');
  }

  // Render progress bars
  const processProgress = document.getElementById('processProgress');
  if (processProgress) {
    processProgress.innerHTML = PROCESS_ORDER.map(key => {
      const data = processData[key];
      const total = data.completed + data.pending;
      const rate = total > 0 ? (data.completed / total) * 100 : 0;
      const color = rate >= 80 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444';
      const isBottleneck = key === bottleneckKey && minRate < 80;
      const processName = PROCESS_NAMES[key] || key;

      return `<div class="flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded ${isBottleneck ? 'ring-2 ring-red-500' : ''}"
                data-action="showProcessDetail" data-param="${key}">
                <div class="w-16 text-sm font-medium">${processName}${isBottleneck ? ' 🔴' : ''}</div>
                <div class="flex-1 progress-bar">
                    <div class="progress-fill" style="width: ${rate}%; background: ${color};"></div>
                </div>
                <div class="w-24 text-right text-sm">
                    <span class="font-medium" style="color: ${color}">${rate.toFixed(1)}%</span>
                    <span class="text-secondary">(${formatNumber(data.completed)})</span>
                </div>
            </div>`;
    }).join('');
  }

  log.debug('[KPIView] Process flow updated');
}

// ============================================================================
// Vendor Section Functions
// ============================================================================

/**
 * Update vendor section with pie chart and table
 *
 * DOM Elements Updated:
 * - vendorChart (Chart)
 * - vendorTableBody (innerHTML)
 */
export function updateVendorSection() {
  const vendorData = {};

  // Defensive: ensure filteredData is an array
  const safeFilteredData = Array.isArray(filteredData) ? filteredData : [];

  // Aggregate vendor data
  safeFilteredData.forEach(d => {
    const v = d.outsoleVendor || '(미지정)';
    if (!vendorData[v]) {
      vendorData[v] = { count: 0, qty: 0, completed: 0 };
    }
    vendorData[v].count++;
    vendorData[v].qty += d.quantity || 0;
    vendorData[v].completed += d.production?.wh_in?.completed || 0;
  });

  const sorted = Object.entries(vendorData).sort((a, b) => b[1].qty - a[1].qty);
  const isDarkMode = document.documentElement.classList.contains('dark');

  // Update pie chart
  const vendorChartCanvas = document.getElementById('vendorChart');
  if (vendorChartCanvas) {
    updateOrCreateChart('vendor', vendorChartCanvas, {
      type: 'pie',
      data: {
        labels: sorted.slice(0, 8).map(([v]) => v),
        datasets: [
          {
            data: sorted.slice(0, 8).map(([, d]) => d.qty),
            backgroundColor: [
              '#3b82f6',
              '#22c55e',
              '#f59e0b',
              '#ef4444',
              '#8b5cf6',
              '#ec4899',
              '#14b8a6',
              '#64748b',
            ],
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            position: 'right',
            labels: { color: isDarkMode ? '#fff' : '#333' },
          },
        },
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }

  // Update vendor table
  const vendorTableBody = document.getElementById('vendorTableBody');
  if (vendorTableBody) {
    vendorTableBody.innerHTML = sorted
      .slice(0, 10)
      .map(([vendor, data]) => {
        const rate = data.qty > 0 ? (data.completed / data.qty) * 100 : 0;
        const rateColor = rate >= 80 ? '#22c55e' : '#f59e0b';

        return `<tr class="border-b border-theme hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                data-action="showVendorDetail" data-param="${vendor}">
                <td class="px-3 py-2 text-xs">${vendor}</td>
                <td class="px-3 py-2 text-right">${formatNumber(data.count)}</td>
                <td class="px-3 py-2 text-right">${formatNumber(data.qty)}</td>
                <td class="px-3 py-2 text-right font-medium" style="color: ${rateColor}">${rate.toFixed(1)}%</td>
            </tr>`;
      })
      .join('');
  }

  log.debug('[KPIView] Vendor section updated');
}

// ============================================================================
// Factory Cards Functions
// ============================================================================

/**
 * Update factory cards and radar chart
 *
 * DOM Elements Updated:
 * - factoryCards (innerHTML)
 * - factoryRadar (Chart)
 */
export function updateFactoryCards() {
  const factoryData = {
    A: { count: 0, qty: 0, completed: 0 },
    B: { count: 0, qty: 0, completed: 0 },
    C: { count: 0, qty: 0, completed: 0 },
    D: { count: 0, qty: 0, completed: 0 },
  };

  // Defensive: ensure filteredData is an array
  const safeFilteredData = Array.isArray(filteredData) ? filteredData : [];

  // Aggregate factory data
  safeFilteredData.forEach(d => {
    if (!factoryData[d.factory]) return;
    factoryData[d.factory].qty += d.quantity || 0;
    factoryData[d.factory].completed += d.production?.wh_in?.completed || 0;
    factoryData[d.factory].count++;
  });

  // Render factory cards
  const factoryCardsEl = document.getElementById('factoryCards');
  if (factoryCardsEl) {
    factoryCardsEl.innerHTML = ['A', 'B', 'C', 'D']
      .map(f => {
        const d = factoryData[f];
        const rate = d.qty > 0 ? (d.completed / d.qty) * 100 : 0;
        const color = rate >= 80 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444';

        return `<div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                data-action="showFactoryDetail" data-param="${f}">
                <div class="flex justify-between items-center">
                    <span class="font-semibold">Factory ${f}</span>
                    <span class="text-sm font-medium" style="color: ${color}">${rate.toFixed(1)}%</span>
                </div>
                <div class="text-xs text-secondary mt-1">${formatNumber(d.count)}건 · ${formatNumber(d.qty)}족</div>
                <div class="progress-bar mt-2" style="height: 6px;">
                    <div class="progress-fill" style="width: ${rate}%; background: ${color};"></div>
                </div>
            </div>`;
      })
      .join('');
  }

  // Prepare radar chart data
  const radarData = ['A', 'B', 'C', 'D'].map(f => {
    const fData = safeFilteredData.filter(d => d.factory === f);
    const qty = fData.reduce((s, d) => s + (d.quantity || 0), 0);
    const completed = fData.reduce((s, d) => s + (d.production?.wh_in?.completed || 0), 0);
    return qty > 0 ? (completed / qty) * 100 : 0;
  });

  const isDarkMode = document.documentElement.classList.contains('dark');

  // Update radar chart
  const factoryRadarCanvas = document.getElementById('factoryRadar');
  if (factoryRadarCanvas) {
    updateOrCreateChart('factoryRadar', factoryRadarCanvas, {
      type: 'radar',
      data: {
        labels: ['Factory A', 'Factory B', 'Factory C', 'Factory D'],
        datasets: [
          {
            label: '완료율',
            data: radarData,
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            borderColor: '#3b82f6',
          },
        ],
      },
      options: {
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { color: isDarkMode ? '#fff' : '#333' },
            pointLabels: { color: isDarkMode ? '#fff' : '#333' },
          },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  log.debug('[KPIView] Factory cards updated');
}

// ============================================================================
// Asia Regional Cards Functions
// ============================================================================

/**
 * Update Asia regional cards (Japan, Korea, China, Taiwan, India)
 *
 * DOM Elements Updated:
 * - asiaCards (innerHTML)
 */
export function updateAsiaCards() {
  const asiaData = {};
  const displayNames = {
    Japan: '일본',
    'South Korea': '한국',
    China: '중국',
    Taiwan: '대만',
    India: '인도',
  };
  const displayOrder = ['Japan', 'South Korea', 'China', 'Taiwan', 'India'];

  // Defensive: ensure filteredData is an array
  const safeFilteredData = Array.isArray(filteredData) ? filteredData : [];

  // Initialize Asia data
  displayOrder.forEach(c => {
    asiaData[c] = { qty: 0, completed: 0, count: 0 };
  });

  // Aggregate data by country
  safeFilteredData.forEach(d => {
    let country = null;

    if (d.destination === 'Japan') country = 'Japan';
    else if (d.destination === 'South Korea' || d.destination === 'Korea') country = 'South Korea';
    else if (d.destination === 'China') country = 'China';
    else if (d.destination === 'Taiwan') country = 'Taiwan';
    else if (d.destination === 'India') country = 'India';

    if (country) {
      asiaData[country].qty += d.quantity || 0;
      asiaData[country].completed += d.production?.wh_in?.completed || 0;
      asiaData[country].count++;
    }
  });

  // Render Asia cards
  const asiaCardsEl = document.getElementById('asiaCards');
  if (asiaCardsEl) {
    asiaCardsEl.innerHTML = displayOrder
      .map(country => {
        const data = asiaData[country] || { qty: 0, completed: 0, count: 0 };
        const rate = data.qty > 0 ? (data.completed / data.qty) * 100 : 0;
        const color = rate >= 80 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444';
        const emoji = IMPORTANT_DESTINATIONS[country] || '🌏';

        return `<div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl cursor-pointer hover:shadow-md transition"
                data-action="showCountryDetail" data-param="${country}">
                <div class="text-2xl mb-1">${emoji}</div>
                <div class="font-medium">${displayNames[country]}</div>
                <div class="text-sm text-secondary">${formatNumber(data.qty)}족 · ${data.count}건</div>
                <div class="progress-bar mt-2" style="height: 6px;">
                    <div class="progress-fill" style="width: ${rate}%; background: ${color};"></div>
                </div>
                <div class="text-xs text-right mt-1" style="color: ${color}">${rate.toFixed(1)}%</div>
            </div>`;
      })
      .join('');
  }

  log.debug('[KPIView] Asia cards updated');
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Update all KPI sections at once
 * Calls all update functions in optimal order
 */
export function updateAllKPIs() {
  updateWeeklySummary();
  updateSummary();
  updateAlerts();
  updateProcessFlow();
  updateVendorSection();
  updateFactoryCards();
  updateAsiaCards();

  log.info('[KPIView] All KPIs updated');
}

// ============================================================================
// Module Summary
// ============================================================================
/**
 * Total Exports: 11
 *
 * Initialization:
 * - initKPIView(dependencies)
 * - updateKPIData(allData, filteredData)
 *
 * Weekly Summary:
 * - updateWeeklySummary()
 *
 * Main Summary:
 * - findBottleneck()
 * - updateSummary()
 *
 * Alerts:
 * - updateAlerts()
 *
 * Process Flow:
 * - updateProcessFlow()
 *
 * Vendor:
 * - updateVendorSection()
 *
 * Factory:
 * - updateFactoryCards()
 *
 * Regional:
 * - updateAsiaCards()
 *
 * Convenience:
 * - updateAllKPIs()
 */

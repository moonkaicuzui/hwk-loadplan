/**
 * TableView.js - Table Rendering View Module
 * ==========================================
 *
 * Handles all table rendering, pagination, sorting, and mobile card views.
 * Includes progressive rendering and virtual scrolling for performance.
 *
 * Features:
 * - Progressive table rendering with requestAnimationFrame
 * - Virtual scrolling with IntersectionObserver for large datasets
 * - Mobile responsive card view
 * - Sortable columns with state management
 * - Pagination with configurable page sizes
 *
 * @module views/TableView
 * @agent A07 (MVC Architect)
 * @phase H06 - MVC 구조 리팩토링 Phase 2
 * @version 19.0.0
 */

// ============================================================================
// Module State
// ============================================================================

/**
 * External dependencies injected via initTableView()
 * @private
 */
let deps = {
  // State references
  getFilteredData: () => [],
  getAllData: () => [],
  getCurrentPage: () => 1,
  setCurrentPage: _page => {},
  getPageSize: () => 50,
  setPageSize: _size => {},
  getSortState: () => ({}),
  setSortState: (_table, _state) => {},

  // Model functions (from OrderModel)
  isShipped: () => false,
  isDelayed: () => false,
  isWarning: () => false,

  // Utility functions
  escapeHtml: str => str,
  formatNumber: num => num.toLocaleString(),
  getStatusIcon: _status => '⏳',
  applyColumnVisibility: () => {},
  log: () => {},

  // Settings
  settings: { set: () => {}, get: () => null },

  // Callbacks
  onUpdateTabs: () => {},
};

/**
 * Initialize flag
 * @private
 */
let initialized = false;

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize TableView with external dependencies
 *
 * @param {Object} dependencies - External dependencies
 * @param {Function} dependencies.getFilteredData - Returns filtered data array
 * @param {Function} dependencies.getAllData - Returns all data array
 * @param {Function} dependencies.getCurrentPage - Returns current page number
 * @param {Function} dependencies.setCurrentPage - Sets current page number
 * @param {Function} dependencies.getPageSize - Returns page size
 * @param {Function} dependencies.setPageSize - Sets page size
 * @param {Function} dependencies.getSortState - Returns sort state object
 * @param {Function} dependencies.setSortState - Sets sort state for a table
 * @param {Function} dependencies.isShipped - Check if order is shipped
 * @param {Function} dependencies.isDelayed - Check if order is delayed
 * @param {Function} dependencies.isWarning - Check if order is warning
 * @param {Function} dependencies.escapeHtml - Escape HTML entities
 * @param {Function} dependencies.formatNumber - Format number with locale
 * @param {Function} dependencies.getStatusIcon - Get status icon
 * @param {Function} dependencies.applyColumnVisibility - Apply column visibility
 * @param {Function} dependencies.log - Logging function
 * @param {Object} dependencies.settings - Settings manager
 * @param {Function} dependencies.onUpdateTabs - Callback to update tabs
 * @returns {boolean} Initialization success
 */
export function initTableView(dependencies) {
  if (initialized) {
    deps.log?.('TableView already initialized', 'warn');
    return true;
  }

  // Merge provided dependencies
  deps = { ...deps, ...dependencies };

  // Validate required dependencies
  const required = [
    'getFilteredData',
    'getAllData',
    'getCurrentPage',
    'setCurrentPage',
    'getPageSize',
    'isShipped',
    'isDelayed',
    'isWarning',
    'escapeHtml',
  ];

  const missing = required.filter(key => !deps[key]);
  if (missing.length > 0) {
    console.error('[TableView] Missing required dependencies:', missing);
    return false;
  }

  initialized = true;
  deps.log?.('[TableView] Initialized successfully', 'info');
  return true;
}

// ============================================================================
// Table Row HTML Generation
// ============================================================================

/**
 * Create HTML for a single table row
 *
 * @param {Object} d - Order data object
 * @param {number} index - Row index in filtered data
 * @param {Object} [options] - Optional overrides
 * @returns {string} HTML string for table row
 */
export function createTableRowHTML(d, index, options = {}) {
  const {
    isShipped = deps.isShipped,
    isDelayed = deps.isDelayed,
    isWarning = deps.isWarning,
    escapeHtml = deps.escapeHtml,
    formatNumber = deps.formatNumber,
    getStatusIcon = deps.getStatusIcon,
  } = options;

  const shipped = isShipped(d);
  const delayed = isDelayed(d);
  const warning = isWarning(d);
  const rowClass = shipped
    ? 'shipped-highlight'
    : delayed
      ? 'delay-highlight'
      : warning
        ? 'warning-highlight'
        : '';

  // Get production data with safe access
  const prod = d.production || {};
  const whOut = prod.wh_out || {};
  const sewBal = prod.sew_bal || {};
  const sCut = prod.s_cut || {};

  // Calculate progress percentage
  const totalQty = d.quantity || 1;
  const completedQty = whOut.completed || 0;
  const progress = Math.min(100, Math.round((completedQty / totalQty) * 100));

  // Status display
  const status = whOut.status || 'pending';
  const statusIcon = getStatusIcon(status);

  return `<tr class="border-b border-theme ${rowClass} clickable-row"
                data-action="showOrderProcessDetail"
                data-index="${index}">
        <td class="px-2 py-2">${escapeHtml(d.factory || '-')}</td>
        <td class="px-2 py-2 text-xs">${escapeHtml(d.poNumber || '-')}</td>
        <td class="px-2 py-2 text-xs max-w-[120px] truncate" title="${escapeHtml(d.article || '')}">${escapeHtml(d.article || '-')}</td>
        <td class="px-2 py-2 text-xs max-w-[150px] truncate" title="${escapeHtml(d.model || '')}">${escapeHtml(d.model || '-')}</td>
        <td class="px-2 py-2 text-xs">${escapeHtml(d.destination || '-')}</td>
        <td class="px-2 py-2 text-right">${formatNumber(d.quantity || 0)}</td>
        <td class="px-2 py-2 text-xs">${escapeHtml(d.crd || '-')}</td>
        <td class="px-2 py-2 text-xs">${escapeHtml(d.sddValue || '-')}</td>
        <td class="px-2 py-2 text-right">${formatNumber(sCut.completed || 0)}</td>
        <td class="px-2 py-2 text-right">${formatNumber(sewBal.completed || 0)}</td>
        <td class="px-2 py-2 text-right">${formatNumber(whOut.completed || 0)}</td>
        <td class="px-2 py-2">
            <div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div class="h-2 rounded-full ${progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}"
                     style="width: ${progress}%"></div>
            </div>
        </td>
        <td class="px-2 py-2 text-center">${statusIcon}</td>
        <td class="px-2 py-2 text-xs">${escapeHtml(d.vendor || '-')}</td>
    </tr>`;
}

/**
 * Create HTML for a modal table row (uses allData index)
 *
 * @param {Object} d - Order data object
 * @param {Object} [options] - Optional overrides
 * @returns {string} HTML string for modal table row
 */
export function createModalTableRowHTML(d, options = {}) {
  const {
    getAllData = deps.getAllData,
    isShipped = deps.isShipped,
    isDelayed = deps.isDelayed,
    isWarning = deps.isWarning,
    escapeHtml = deps.escapeHtml,
    formatNumber = deps.formatNumber,
    getStatusIcon = deps.getStatusIcon,
  } = options;

  const allData = getAllData();
  const globalIndex = allData.indexOf(d);

  const shipped = isShipped(d);
  const delayed = isDelayed(d);
  const warning = isWarning(d);
  const rowClass = shipped
    ? 'shipped-highlight'
    : delayed
      ? 'delay-highlight'
      : warning
        ? 'warning-highlight'
        : '';

  // Get production data with safe access
  const prod = d.production || {};
  const whOut = prod.wh_out || {};
  const sewBal = prod.sew_bal || {};
  const sCut = prod.s_cut || {};

  // Calculate progress percentage
  const totalQty = d.quantity || 1;
  const completedQty = whOut.completed || 0;
  const progress = Math.min(100, Math.round((completedQty / totalQty) * 100));

  // Status display
  const status = whOut.status || 'pending';
  const statusIcon = getStatusIcon(status);

  return `<tr class="border-b border-theme ${rowClass} clickable-row"
                data-action="closeAndShowOrderDetail"
                data-index="${globalIndex}">
        <td class="px-2 py-2">${escapeHtml(d.factory || '-')}</td>
        <td class="px-2 py-2 text-xs">${escapeHtml(d.poNumber || '-')}</td>
        <td class="px-2 py-2 text-xs max-w-[120px] truncate" title="${escapeHtml(d.article || '')}">${escapeHtml(d.article || '-')}</td>
        <td class="px-2 py-2 text-xs max-w-[150px] truncate" title="${escapeHtml(d.model || '')}">${escapeHtml(d.model || '-')}</td>
        <td class="px-2 py-2 text-xs">${escapeHtml(d.destination || '-')}</td>
        <td class="px-2 py-2 text-right">${formatNumber(d.quantity || 0)}</td>
        <td class="px-2 py-2 text-xs">${escapeHtml(d.crd || '-')}</td>
        <td class="px-2 py-2 text-xs">${escapeHtml(d.sddValue || '-')}</td>
        <td class="px-2 py-2 text-right">${formatNumber(sCut.completed || 0)}</td>
        <td class="px-2 py-2 text-right">${formatNumber(sewBal.completed || 0)}</td>
        <td class="px-2 py-2 text-right">${formatNumber(whOut.completed || 0)}</td>
        <td class="px-2 py-2">
            <div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div class="h-2 rounded-full ${progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}"
                     style="width: ${progress}%"></div>
            </div>
        </td>
        <td class="px-2 py-2 text-center">${statusIcon}</td>
        <td class="px-2 py-2 text-xs">${escapeHtml(d.vendor || '-')}</td>
    </tr>`;
}

// ============================================================================
// Progressive Rendering
// ============================================================================

/**
 * Render table progressively using requestAnimationFrame
 * Prevents main thread blocking for large datasets
 *
 * @param {HTMLElement} tbody - Table body element
 * @param {Array} data - Data array to render
 * @param {Object} [options] - Rendering options
 * @param {number} [options.chunkSize=50] - Rows per animation frame
 * @param {Function} [options.onComplete] - Callback when rendering completes
 * @returns {void}
 */
export function renderTableProgressively(tbody, data, options = {}) {
  const {
    chunkSize = 50,
    onComplete,
    getFilteredData = deps.getFilteredData,
    applyColumnVisibility = deps.applyColumnVisibility,
    log = deps.log,
  } = options;

  const startTime = performance.now();
  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr>
            <td colspan="14" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                데이터가 없습니다
            </td>
        </tr>`;
    onComplete?.();
    return;
  }

  const filteredData = getFilteredData();
  let currentIndex = 0;

  function renderChunk() {
    const fragment = document.createDocumentFragment();
    const endIndex = Math.min(currentIndex + chunkSize, data.length);

    for (let i = currentIndex; i < endIndex; i++) {
      const d = data[i];
      const globalIndex = filteredData.indexOf(d);
      const rowHTML = createTableRowHTML(d, globalIndex, options);

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = rowHTML;
      fragment.appendChild(tempDiv.firstChild);
    }

    tbody.appendChild(fragment);
    currentIndex = endIndex;

    if (currentIndex < data.length) {
      requestAnimationFrame(renderChunk);
    } else {
      // Rendering complete
      applyColumnVisibility?.();

      const elapsed = performance.now() - startTime;
      log?.(
        `[TableView] Progressive render complete: ${data.length} rows in ${elapsed.toFixed(1)}ms`,
        'debug'
      );

      onComplete?.();
    }
  }

  requestAnimationFrame(renderChunk);
}

// ============================================================================
// Virtual Scrolling
// ============================================================================

/**
 * Render table with virtual scrolling using IntersectionObserver
 * Ideal for very large datasets (1000+ rows)
 *
 * @param {HTMLElement} tbody - Table body element
 * @param {Array} data - Data array to render
 * @param {Object} [options] - Rendering options
 * @param {number} [options.initialRows=100] - Initial rows to render
 * @param {number} [options.loadMoreRows=50] - Rows to load on scroll
 * @param {Function} [options.onComplete] - Callback when rendering completes
 * @returns {void}
 */
export function renderTableVirtually(tbody, data, options = {}) {
  const {
    initialRows = 100,
    loadMoreRows = 50,
    onComplete,
    getFilteredData = deps.getFilteredData,
    applyColumnVisibility = deps.applyColumnVisibility,
    log = deps.log,
  } = options;

  const startTime = performance.now();
  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr>
            <td colspan="14" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                데이터가 없습니다
            </td>
        </tr>`;
    onComplete?.();
    return;
  }

  const filteredData = getFilteredData();
  let loadedCount = 0;
  let observer = null;
  let sentinel = null;

  /**
   * Load more data rows
   */
  function loadMoreData() {
    if (loadedCount >= data.length) {
      // All data loaded, cleanup observer
      if (observer && sentinel) {
        observer.unobserve(sentinel);
        sentinel.remove();
      }
      onComplete?.();
      return;
    }

    const fragment = document.createDocumentFragment();
    const endIndex = Math.min(loadedCount + loadMoreRows, data.length);

    for (let i = loadedCount; i < endIndex; i++) {
      const d = data[i];
      const globalIndex = filteredData.indexOf(d);
      const rowHTML = createTableRowHTML(d, globalIndex, options);

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = rowHTML;
      fragment.appendChild(tempDiv.firstChild);
    }

    // Remove old sentinel before appending new rows
    if (sentinel && sentinel.parentNode) {
      sentinel.remove();
    }

    tbody.appendChild(fragment);
    loadedCount = endIndex;

    // Add new sentinel if more data remains
    if (loadedCount < data.length) {
      sentinel = document.createElement('tr');
      sentinel.id = 'virtual-scroll-sentinel';
      sentinel.innerHTML = `<td colspan="14" class="px-4 py-4 text-center text-gray-400">
                <span class="loading-spinner inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                로딩 중...
            </td>`;
      tbody.appendChild(sentinel);

      if (observer) {
        observer.observe(sentinel);
      }
    }

    applyColumnVisibility?.();
  }

  /**
   * Setup IntersectionObserver for infinite scroll
   */
  function setupIntersectionObserver() {
    observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadMoreData();
          }
        });
      },
      {
        root: tbody.closest('.table-scroll-container') || null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );
  }

  // Initialize
  setupIntersectionObserver();

  // Load initial rows
  const initialFragment = document.createDocumentFragment();
  const initialEndIndex = Math.min(initialRows, data.length);

  for (let i = 0; i < initialEndIndex; i++) {
    const d = data[i];
    const globalIndex = filteredData.indexOf(d);
    const rowHTML = createTableRowHTML(d, globalIndex, options);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rowHTML;
    initialFragment.appendChild(tempDiv.firstChild);
  }

  tbody.appendChild(initialFragment);
  loadedCount = initialEndIndex;

  // Add sentinel if more data exists
  if (loadedCount < data.length) {
    sentinel = document.createElement('tr');
    sentinel.id = 'virtual-scroll-sentinel';
    sentinel.innerHTML = `<td colspan="14" class="px-4 py-4 text-center text-gray-400">
            <span class="loading-spinner inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
            로딩 중...
        </td>`;
    tbody.appendChild(sentinel);
    observer.observe(sentinel);
  }

  applyColumnVisibility?.();

  const elapsed = performance.now() - startTime;
  log?.(
    `[TableView] Virtual render initialized: ${initialEndIndex}/${data.length} rows in ${elapsed.toFixed(1)}ms`,
    'debug'
  );

  if (loadedCount >= data.length) {
    onComplete?.();
  }
}

// ============================================================================
// Mobile Card View
// ============================================================================

/**
 * Render mobile card view for orders
 * Displayed on screens < 768px
 *
 * @param {Array} pageData - Data array for current page
 * @param {Object} [options] - Rendering options
 * @returns {void}
 */
export function renderDataCards(pageData, options = {}) {
  const {
    containerId = 'dataCardsContainer',
    isShipped = deps.isShipped,
    isDelayed = deps.isDelayed,
    isWarning = deps.isWarning,
    escapeHtml = deps.escapeHtml,
    formatNumber = deps.formatNumber,
    getStatusIcon = deps.getStatusIcon,
    getFilteredData = deps.getFilteredData,
  } = options;

  const container = document.getElementById(containerId);
  if (!container) {
    console.warn('[TableView] Card container not found:', containerId);
    return;
  }

  if (!pageData || pageData.length === 0) {
    container.innerHTML = `
            <div class="cards-empty-state p-8 text-center text-gray-500 dark:text-gray-400">
                <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>데이터가 없습니다</p>
            </div>
        `;
    return;
  }

  const filteredData = getFilteredData();

  container.innerHTML = pageData
    .map((d, _idx) => {
      const shipped = isShipped(d);
      const delayed = isDelayed(d);
      const warning = isWarning(d);
      const cardClass = shipped ? 'shipped' : delayed ? 'delayed' : warning ? 'warning' : '';

      const globalIndex = filteredData.indexOf(d);

      // Get production data with safe access
      const prod = d.production || {};
      const whOut = prod.wh_out || {};

      // Calculate progress
      const totalQty = d.quantity || 1;
      const completedQty = whOut.completed || 0;
      const progress = Math.min(100, Math.round((completedQty / totalQty) * 100));

      // Status
      const status = whOut.status || 'pending';
      const statusIcon = getStatusIcon(status);
      const statusText = status === 'completed' ? '완료' : status === 'partial' ? '진행중' : '대기';

      return `
            <div class="order-card ${cardClass} bg-card rounded-lg shadow-sm p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow"
                 data-action="showOrderProcessDetail"
                 data-index="${globalIndex}">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="text-xs text-gray-500 dark:text-gray-400">${escapeHtml(d.factory || '-')}</span>
                        <h4 class="font-medium text-sm truncate max-w-[200px]" title="${escapeHtml(d.model || '')}">${escapeHtml(d.model || '-')}</h4>
                    </div>
                    <span class="status-badge ${status} text-xs px-2 py-1 rounded-full">
                        ${statusIcon} ${statusText}
                    </span>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                        <span class="text-gray-500 dark:text-gray-400">PO:</span>
                        <span class="ml-1">${escapeHtml(d.poNumber || '-')}</span>
                    </div>
                    <div>
                        <span class="text-gray-500 dark:text-gray-400">행선지:</span>
                        <span class="ml-1">${escapeHtml(d.destination || '-')}</span>
                    </div>
                    <div>
                        <span class="text-gray-500 dark:text-gray-400">수량:</span>
                        <span class="ml-1 font-medium">${formatNumber(d.quantity || 0)}</span>
                    </div>
                    <div>
                        <span class="text-gray-500 dark:text-gray-400">완료:</span>
                        <span class="ml-1 font-medium">${formatNumber(completedQty)}</span>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div class="h-2 rounded-full ${progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}"
                             style="width: ${progress}%"></div>
                    </div>
                    <span class="text-xs font-medium ${progress >= 100 ? 'text-green-600' : 'text-gray-600'}">${progress}%</span>
                </div>

                <div class="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>CRD: ${escapeHtml(d.crd || '-')}</span>
                    <span>SDD: ${escapeHtml(d.sddValue || '-')}</span>
                </div>
            </div>
        `;
    })
    .join('');
}

// ============================================================================
// Sorting
// ============================================================================

/**
 * Sort data array by specified key
 *
 * @param {Array} data - Data array to sort
 * @param {string} table - Table identifier for sort state
 * @param {Object} [options] - Sort options
 * @returns {Array} Sorted data array (new array, original unchanged)
 */
export function sortData(data, table, options = {}) {
  const { getSortState = deps.getSortState } = options;

  const sortState = getSortState();
  if (!sortState[table] || !sortState[table].key) {
    return data;
  }

  const key = sortState[table].key;
  const dir = sortState[table].dir === 'asc' ? 1 : -1;

  return [...data].sort((a, b) => {
    // Handle nested keys for aggregated data (e.g., [key, value] format)
    let valA = a[key] ?? a[1]?.[key] ?? 0;
    let valB = b[key] ?? b[1]?.[key] ?? 0;

    // Handle null/undefined
    if (valA === null || valA === undefined) valA = '';
    if (valB === null || valB === undefined) valB = '';

    // String comparison
    if (typeof valA === 'string' && typeof valB === 'string') {
      return dir * valA.localeCompare(valB, 'ko');
    }

    // Numeric comparison
    return dir * (Number(valA) - Number(valB));
  });
}

/**
 * Handle sort header click
 * Updates sort state and triggers table refresh
 *
 * @param {HTMLElement} header - Clicked header element
 * @param {Object} [options] - Options
 * @returns {void}
 */
export function handleSort(header, options = {}) {
  const {
    getSortState = deps.getSortState,
    setSortState = deps.setSortState,
    onUpdateTabs = deps.onUpdateTabs,
  } = options;

  const sortKey = header.dataset.sort;
  const table = header.dataset.table;

  if (!sortKey || !table) {
    console.warn('[TableView] Invalid sort header - missing data-sort or data-table');
    return;
  }

  const sortState = getSortState();

  // Initialize sort state for this table if needed
  if (!sortState[table]) {
    sortState[table] = { key: null, dir: 'asc' };
  }

  // Toggle direction if same key, otherwise set new key with asc
  if (sortState[table].key === sortKey) {
    sortState[table].dir = sortState[table].dir === 'asc' ? 'desc' : 'asc';
  } else {
    sortState[table].key = sortKey;
    sortState[table].dir = 'asc';
  }

  // Update sort state
  setSortState?.(table, sortState[table]);

  // Update header UI
  updateSortHeaderUI(header, sortState[table]);

  // Trigger table refresh
  onUpdateTabs?.();
}

/**
 * Update sort header UI (aria-sort and visual indicators)
 *
 * @param {HTMLElement} clickedHeader - The clicked header element
 * @param {Object} sortState - Current sort state { key, dir }
 * @private
 */
function updateSortHeaderUI(clickedHeader, sortState) {
  const table = clickedHeader.dataset.table;
  const parentTable = clickedHeader.closest('table');

  if (!parentTable) return;

  // Reset all headers in this table
  parentTable.querySelectorAll(`th[data-table="${table}"]`).forEach(th => {
    th.removeAttribute('aria-sort');
    th.classList.remove('sort-asc', 'sort-desc');
  });

  // Set current header state
  clickedHeader.setAttribute('aria-sort', sortState.dir === 'asc' ? 'ascending' : 'descending');
  clickedHeader.classList.add(sortState.dir === 'asc' ? 'sort-asc' : 'sort-desc');
}

// ============================================================================
// Pagination
// ============================================================================

/**
 * Go to previous page
 *
 * @param {Object} [options] - Options
 * @returns {boolean} Whether page changed
 */
export function prevPage(options = {}) {
  const { getCurrentPage = deps.getCurrentPage, setCurrentPage = deps.setCurrentPage } = options;

  const currentPage = getCurrentPage();

  if (currentPage > 1) {
    setCurrentPage(currentPage - 1);
    return true;
  }
  return false;
}

/**
 * Go to next page
 *
 * @param {Object} [options] - Options
 * @returns {boolean} Whether page changed
 */
export function nextPage(options = {}) {
  const {
    getCurrentPage = deps.getCurrentPage,
    setCurrentPage = deps.setCurrentPage,
    getFilteredData = deps.getFilteredData,
    getPageSize = deps.getPageSize,
  } = options;

  const currentPage = getCurrentPage();
  const filteredData = getFilteredData();
  const pageSize = getPageSize();
  const totalPages = Math.ceil(filteredData.length / pageSize);

  if (currentPage < totalPages) {
    setCurrentPage(currentPage + 1);
    return true;
  }
  return false;
}

/**
 * Change page size
 *
 * @param {number|string} newSize - New page size (or 'all')
 * @param {Object} [options] - Options
 * @returns {void}
 */
export function changePageSize(newSize, options = {}) {
  const {
    setPageSize = deps.setPageSize,
    setCurrentPage = deps.setCurrentPage,
    settings = deps.settings,
    getFilteredData = deps.getFilteredData,
  } = options;

  const filteredData = getFilteredData();

  // Handle 'all' option
  let size = newSize;
  if (newSize === 'all' || newSize === 'ALL') {
    size = filteredData.length || 1000;
  } else {
    size = parseInt(newSize, 10);
  }

  if (isNaN(size) || size <= 0) {
    console.warn('[TableView] Invalid page size:', newSize);
    return;
  }

  setPageSize(size);
  setCurrentPage(1); // Reset to first page
  settings?.set?.('pageSize', size);
}

// ============================================================================
// Main Update Function
// ============================================================================

/**
 * Update data tab - main table update function
 * Renders both mobile cards and desktop table
 * Uses virtual scrolling for large page sizes (>= 200)
 *
 * @param {Object} [options] - Update options
 * @param {boolean} [options.useVirtualScroll] - Force virtual scrolling
 * @returns {void}
 */
export function updateDataTab(options = {}) {
  const {
    getFilteredData = deps.getFilteredData,
    getCurrentPage = deps.getCurrentPage,
    getPageSize = deps.getPageSize,
    formatNumber = deps.formatNumber,
    log = deps.log,
    useVirtualScroll,
    dataCountId = 'dataCount',
    paginationId = 'pagination',
    cardsContainerId = 'dataCardsContainer',
    tableBodyId = 'dataTable',
  } = options;

  const filteredData = getFilteredData();
  const currentPage = getCurrentPage();
  const pageSize = getPageSize();

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = filteredData.slice(start, end);
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  // Update count display
  const dataCountEl = document.getElementById(dataCountId);
  if (dataCountEl) {
    dataCountEl.textContent = `(${formatNumber(filteredData.length)}건)`;
  }

  // Update pagination display
  const paginationEl = document.getElementById(paginationId);
  if (paginationEl) {
    paginationEl.textContent = `${currentPage} / ${totalPages} 페이지`;
  }

  // Render mobile cards
  renderDataCards(pageData, { ...options, containerId: cardsContainerId });

  // Render desktop table
  const tbody = document.querySelector(`#${tableBodyId} tbody`);
  if (tbody) {
    // Use virtual scrolling for large page sizes
    const shouldUseVirtual = useVirtualScroll ?? (pageSize >= 200 || pageData.length >= 200);

    if (shouldUseVirtual) {
      renderTableVirtually(tbody, pageData, options);
    } else {
      renderTableProgressively(tbody, pageData, options);
    }
  }

  log?.(
    `[TableView] Data tab updated: page ${currentPage}/${totalPages}, showing ${pageData.length} of ${filteredData.length}`,
    'debug'
  );
}

// ============================================================================
// Module Exports Summary
// ============================================================================
/**
 * Total Exports: 14
 *
 * Initialization:
 * - initTableView(dependencies)
 *
 * Row HTML Generation:
 * - createTableRowHTML(d, index, options)
 * - createModalTableRowHTML(d, options)
 *
 * Table Rendering:
 * - renderTableProgressively(tbody, data, options)
 * - renderTableVirtually(tbody, data, options)
 * - renderDataCards(pageData, options)
 * - updateDataTab(options)
 *
 * Sorting:
 * - sortData(data, table, options)
 * - handleSort(header, options)
 *
 * Pagination:
 * - prevPage(options)
 * - nextPage(options)
 * - changePageSize(newSize, options)
 */

/**
 * ModalView.js - Modal View Module
 * =================================
 *
 * Handles all modal-related rendering and interactions for the Rachgia Dashboard.
 * Includes order list modals, help modals, info modals, keyboard shortcuts modals,
 * and analytics detail modals.
 *
 * @module ModalView
 * @agent A07 (MVC Architect)
 * @phase H06 - MVC 구조 리팩토링 Phase 2 (View Layer)
 * @version 19.0.0
 */

// ============================================================================
// Module Dependencies (injected via initModalView)
// ============================================================================

let deps = {
    // Data
    getAllData: () => [],
    getFilteredData: () => [],

    // Order state functions (from OrderModel)
    isDelayed: () => false,
    isWarning: () => false,
    isShipped: () => false,

    // Utility functions
    formatNumber: (n) => String(n),
    escapeHtml: (s) => s,
    getStatusIcon: () => '',

    // Focus management
    trapFocus: () => {},
    releaseFocus: () => {},

    // Constants
    PROCESS_ORDER: [],
    PROCESS_NAMES: {},
    IMPORTANT_DESTINATIONS: {},
    UNIT_PRICE: 30,

    // Analytics functions (from ChartModel)
    calculateOTDRate: () => ({ rate: 0, onTime: 0, total: 0 }),
    calculateRevenueAtRisk: () => ({ total: 0, items: [] }),
    calculateAQLStats: () => ({ passRate: 0, defects: [] }),
    predictBottleneck: () => ({ process: '', severity: 0 }),

    // Other modal closers
    closeDailyReport: () => {}
};

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize ModalView with dependencies
 * @param {Object} dependencies - External dependencies
 * @param {Function} dependencies.getAllData - Function to get all data
 * @param {Function} dependencies.getFilteredData - Function to get filtered data
 * @param {Function} dependencies.isDelayed - Check if order is delayed
 * @param {Function} dependencies.isWarning - Check if order has warning
 * @param {Function} dependencies.isShipped - Check if order is shipped
 * @param {Function} dependencies.formatNumber - Format number with locale
 * @param {Function} dependencies.escapeHtml - Escape HTML characters
 * @param {Function} dependencies.getStatusIcon - Get status icon
 * @param {Function} dependencies.trapFocus - Trap focus within modal
 * @param {Function} dependencies.releaseFocus - Release focus trap
 * @param {Array} dependencies.PROCESS_ORDER - Process order array
 * @param {Object} dependencies.PROCESS_NAMES - Process name mapping
 * @param {Object} dependencies.IMPORTANT_DESTINATIONS - Important destinations
 * @param {number} dependencies.UNIT_PRICE - Unit price constant
 * @param {Function} dependencies.calculateOTDRate - Calculate OTD rate
 * @param {Function} dependencies.calculateRevenueAtRisk - Calculate revenue at risk
 * @param {Function} dependencies.calculateAQLStats - Calculate AQL statistics
 * @param {Function} dependencies.predictBottleneck - Predict bottleneck
 * @param {Function} dependencies.closeDailyReport - Close daily report modal
 */
export function initModalView(dependencies) {
    deps = { ...deps, ...dependencies };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create table row HTML for modal order table
 * @param {Object} d - Order data object
 * @returns {string} HTML string for table row
 */
export function createModalTableRowHTML(d) {
    const statusClass = deps.isDelayed(d) ? 'text-red-600 dark:text-red-400 font-bold' :
                        deps.isWarning(d) ? 'text-yellow-600 dark:text-yellow-400' : '';

    const whOutCompleted = d.production?.wh_out?.completed || 0;
    const completionRate = d.quantity > 0 ? Math.round((whOutCompleted / d.quantity) * 100) : 0;

    return `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 ${statusClass}">
            <td class="px-3 py-2 text-sm">${deps.escapeHtml(d.factory || '')}</td>
            <td class="px-3 py-2 text-sm">${deps.escapeHtml(d.poNumber || '')}</td>
            <td class="px-3 py-2 text-sm">${deps.escapeHtml(d.model || '')}</td>
            <td class="px-3 py-2 text-sm">${deps.escapeHtml(d.destination || '')}</td>
            <td class="px-3 py-2 text-sm text-right">${deps.formatNumber(d.quantity || 0)}</td>
            <td class="px-3 py-2 text-sm">${deps.escapeHtml(d.crd || '')}</td>
            <td class="px-3 py-2 text-sm">${deps.escapeHtml(d.sddValue || '')}</td>
            <td class="px-3 py-2 text-sm text-center">${completionRate}%</td>
            <td class="px-3 py-2 text-sm text-center">${deps.getStatusIcon(d.production?.wh_out?.status)}</td>
        </tr>
    `;
}

/**
 * Show shortcut notification toast
 * @param {string} description - Notification description text
 */
export function showShortcutNotification(description) {
    // Remove existing notification
    const existing = document.getElementById('shortcutNotification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'shortcutNotification';
    notification.className = 'fixed bottom-4 right-4 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 px-4 py-2 rounded-lg shadow-lg z-[10001] transition-opacity duration-300';
    notification.textContent = description;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ============================================================================
// Order List Modal Functions
// ============================================================================

/**
 * Show order list modal with given title and orders
 * @param {string} title - Modal title
 * @param {Array} orders - Array of order objects to display
 */
export function showOrderListModal(title, orders) {
    const modal = document.getElementById('orderDetailModal');
    if (!modal) return;

    const titleEl = document.getElementById('orderDetailModalTitle');
    const bodyEl = document.getElementById('orderDetailModalBody');

    if (titleEl) titleEl.textContent = title;

    if (bodyEl) {
        // Calculate summary statistics
        const totalQty = orders.reduce((sum, d) => sum + (d.quantity || 0), 0);
        const delayedCount = orders.filter(d => deps.isDelayed(d)).length;
        const warningCount = orders.filter(d => deps.isWarning(d)).length;
        const completedCount = orders.filter(d => d.production?.wh_out?.status === 'completed').length;

        // Generate summary HTML
        const summaryHtml = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div class="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-center">
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${deps.formatNumber(orders.length)}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">총 오더</div>
                </div>
                <div class="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg text-center">
                    <div class="text-2xl font-bold text-green-600 dark:text-green-400">${deps.formatNumber(totalQty)}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">총 수량</div>
                </div>
                <div class="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg text-center">
                    <div class="text-2xl font-bold text-red-600 dark:text-red-400">${delayedCount}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">지연</div>
                </div>
                <div class="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg text-center">
                    <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">${warningCount}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">경고</div>
                </div>
            </div>
        `;

        // Generate table HTML
        const tableHtml = `
            <div class="overflow-x-auto max-h-96">
                <table class="min-w-full">
                    <thead class="bg-gray-100 dark:bg-gray-700 sticky top-0">
                        <tr>
                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Factory</th>
                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">PO</th>
                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Model</th>
                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Dest</th>
                            <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qty</th>
                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">CRD</th>
                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">SDD</th>
                            <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">완료율</th>
                            <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">상태</th>
                        </tr>
                    </thead>
                    <tbody id="orderDetailModalTableBody">
                    </tbody>
                </table>
            </div>
        `;

        bodyEl.innerHTML = summaryHtml + tableHtml;

        // Progressive rendering for large datasets
        const tbody = document.getElementById('orderDetailModalTableBody');
        if (tbody && orders.length > 0) {
            const BATCH_SIZE = 50;
            let currentIndex = 0;

            function renderBatch() {
                const fragment = document.createDocumentFragment();
                const endIndex = Math.min(currentIndex + BATCH_SIZE, orders.length);

                for (let i = currentIndex; i < endIndex; i++) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = createModalTableRowHTML(orders[i]).trim().slice(4, -5); // Remove <tr> tags
                    tr.className = `hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 ${
                        deps.isDelayed(orders[i]) ? 'text-red-600 dark:text-red-400 font-bold' :
                        deps.isWarning(orders[i]) ? 'text-yellow-600 dark:text-yellow-400' : ''
                    }`;
                    fragment.appendChild(tr);
                }

                tbody.appendChild(fragment);
                currentIndex = endIndex;

                if (currentIndex < orders.length) {
                    requestAnimationFrame(renderBatch);
                }
            }

            renderBatch();
        }
    }

    modal.classList.remove('hidden');
    deps.trapFocus(modal);
}

/**
 * Close order detail modal
 */
export function closeOrderModal() {
    const modal = document.getElementById('orderDetailModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    deps.releaseFocus();
}

// ============================================================================
// Quick Access Modal Functions
// ============================================================================

/**
 * Show delayed orders modal
 */
export function showDelayedOrders() {
    const allData = deps.getAllData();
    const delayed = allData.filter(d => deps.isDelayed(d));
    showOrderListModal('🚨 지연 오더', delayed);
}

/**
 * Show warning orders modal (3 days until deadline, not completed)
 */
export function showWarningOrders() {
    const allData = deps.getAllData();
    const warning = allData.filter(d => deps.isWarning(d));
    showOrderListModal('⚡ 3일 내 예정 (미완료)', warning);
}

/**
 * Show inventory orders modal (wh_in > wh_out)
 */
export function showInventoryOrders() {
    const allData = deps.getAllData();
    const inventory = allData.filter(d => {
        const whIn = d.production?.wh_in?.completed || 0;
        const whOut = d.production?.wh_out?.completed || 0;
        return whIn > whOut;
    });
    showOrderListModal('📦 재고 현황 (입고 > 출고)', inventory);
}

/**
 * Show shipped orders modal
 */
export function showShippedOrders() {
    const allData = deps.getAllData();
    const shipped = allData.filter(d => deps.isShipped(d));
    showOrderListModal('🚢 선적 완료 오더', shipped);
}

// ============================================================================
// Entity Detail Modal Functions
// ============================================================================

/**
 * Show vendor detail modal
 * @param {string} vendor - Vendor name
 */
export function showVendorDetail(vendor) {
    const filteredData = deps.getFilteredData();
    const vendorOrders = filteredData.filter(d => (d.outsoleVendor || '(미지정)') === vendor);
    showOrderListModal(`${deps.escapeHtml(vendor)} 상세`, vendorOrders);
}

/**
 * Show factory detail modal
 * @param {string} factory - Factory identifier (A, B, C, D)
 */
export function showFactoryDetail(factory) {
    const filteredData = deps.getFilteredData();
    const factoryOrders = filteredData.filter(d => d.factory === factory);
    showOrderListModal(`Factory ${deps.escapeHtml(factory)} 상세`, factoryOrders);
}

/**
 * Show country detail modal
 * @param {string} country - Country name
 */
export function showCountryDetail(country) {
    const filteredData = deps.getFilteredData();
    // Handle Korea/South Korea alias
    const countryOrders = filteredData.filter(d => {
        const dest = d.destination || '';
        if (country === 'South Korea' || country === 'Korea') {
            return dest === 'South Korea' || dest === 'Korea';
        }
        return dest === country;
    });
    showOrderListModal(`${deps.escapeHtml(country)} 상세`, countryOrders);
}

/**
 * Show model detail modal
 * @param {string} model - Model name
 */
export function showModelDetail(model) {
    const filteredData = deps.getFilteredData();
    const modelOrders = filteredData.filter(d => d.model === model);
    showOrderListModal(`${deps.escapeHtml(model)} 상세`, modelOrders);
}

// ============================================================================
// Help Modal Functions
// ============================================================================

/**
 * Toggle help modal visibility
 */
export function toggleHelpModal() {
    const modal = document.getElementById('helpModal');
    if (!modal) return;

    modal.classList.toggle('hidden');

    if (!modal.classList.contains('hidden')) {
        deps.trapFocus(modal);
    } else {
        deps.releaseFocus();
    }
}

/**
 * Toggle insights help section
 */
export function toggleInsightsHelp() {
    const helpSection = document.getElementById('insightsHelp');
    if (helpSection) {
        helpSection.classList.toggle('hidden');
    }
}

/**
 * Close help modal
 */
export function closeHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    deps.releaseFocus();
}

// ============================================================================
// Info Modal Functions
// ============================================================================

/**
 * Show info modal with dynamic content
 * @param {string} title - Modal title
 * @param {string} content - HTML content for modal body
 */
export function showInfoModal(title, content) {
    let modal = document.getElementById('infoModal');

    // Create modal if it doesn't exist
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'infoModal';
        modal.className = 'fixed inset-0 bg-black/50 z-[10000] hidden flex items-center justify-center p-4';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'infoModalTitle');

        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 id="infoModalTitle" class="text-lg font-bold text-gray-900 dark:text-white"></h3>
                    <button onclick="closeInfoModal()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors" aria-label="닫기">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div id="infoModalContent" class="p-4 overflow-y-auto max-h-[calc(90vh-80px)]"></div>
            </div>
        `;

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeInfoModal();
            }
        });

        document.body.appendChild(modal);
    }

    // Set content
    const titleEl = document.getElementById('infoModalTitle');
    const contentEl = document.getElementById('infoModalContent');

    if (titleEl) titleEl.textContent = title;
    if (contentEl) contentEl.innerHTML = content;

    modal.classList.remove('hidden');
    deps.trapFocus(modal);
}

/**
 * Close info modal
 */
export function closeInfoModal() {
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    deps.releaseFocus();
}

// ============================================================================
// Analytics Detail Modal Functions
// ============================================================================

/**
 * Show OTD (On-Time Delivery) detail modal
 */
export function showOTDDetail() {
    const filteredData = deps.getFilteredData();
    const otdData = deps.calculateOTDRate(filteredData);

    const onTimeOrders = filteredData.filter(d => !deps.isDelayed(d) && d.production?.wh_out?.status === 'completed');
    const lateOrders = filteredData.filter(d => deps.isDelayed(d));

    const html = `
        <div class="space-y-4">
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg text-center">
                    <div class="text-3xl font-bold text-green-600 dark:text-green-400">${otdData.rate?.toFixed(1) || 0}%</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">OTD Rate</div>
                </div>
                <div class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-center">
                    <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">${deps.formatNumber(otdData.onTime || 0)}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">정시 배송</div>
                </div>
                <div class="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg text-center">
                    <div class="text-3xl font-bold text-red-600 dark:text-red-400">${deps.formatNumber(lateOrders.length)}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">지연 건수</div>
                </div>
            </div>

            <div class="mt-4">
                <h4 class="font-semibold mb-2">📊 OTD 계산 기준</h4>
                <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• 정시 배송: 출고 완료 + SDD ≤ CRD</li>
                    <li>• 지연: SDD > CRD (Code04 승인 제외)</li>
                    <li>• OTD Rate = 정시 배송 / 전체 완료 × 100%</li>
                </ul>
            </div>
        </div>
    `;

    showInfoModal('📈 OTD 상세 분석', html);
}

/**
 * Show Revenue at Risk detail modal
 */
export function showRevenueRiskDetail() {
    const filteredData = deps.getFilteredData();
    const delayedOrders = filteredData.filter(d => deps.isDelayed(d));
    const totalRiskQty = delayedOrders.reduce((sum, d) => sum + (d.quantity || 0), 0);
    const totalRiskRevenue = totalRiskQty * deps.UNIT_PRICE;

    // Group by destination
    const byDest = {};
    delayedOrders.forEach(d => {
        const dest = d.destination || '(미지정)';
        if (!byDest[dest]) {
            byDest[dest] = { orders: 0, qty: 0 };
        }
        byDest[dest].orders++;
        byDest[dest].qty += (d.quantity || 0);
    });

    const destRows = Object.entries(byDest)
        .sort((a, b) => b[1].qty - a[1].qty)
        .slice(0, 5)
        .map(([dest, data]) => `
            <tr class="border-b border-gray-200 dark:border-gray-600">
                <td class="py-2">${deps.escapeHtml(dest)}</td>
                <td class="py-2 text-right">${data.orders}</td>
                <td class="py-2 text-right">${deps.formatNumber(data.qty)}</td>
                <td class="py-2 text-right">$${deps.formatNumber(data.qty * deps.UNIT_PRICE)}</td>
            </tr>
        `).join('');

    const html = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg text-center">
                    <div class="text-3xl font-bold text-red-600 dark:text-red-400">$${deps.formatNumber(totalRiskRevenue)}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">위험 매출액</div>
                </div>
                <div class="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg text-center">
                    <div class="text-3xl font-bold text-orange-600 dark:text-orange-400">${deps.formatNumber(totalRiskQty)}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">위험 수량</div>
                </div>
            </div>

            <div class="mt-4">
                <h4 class="font-semibold mb-2">📍 행선지별 위험 현황 (Top 5)</h4>
                <table class="w-full text-sm">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th class="py-2 text-left">행선지</th>
                            <th class="py-2 text-right">오더</th>
                            <th class="py-2 text-right">수량</th>
                            <th class="py-2 text-right">금액</th>
                        </tr>
                    </thead>
                    <tbody>${destRows}</tbody>
                </table>
            </div>

            <div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
                * 단가 기준: $${deps.UNIT_PRICE}/pair
            </div>
        </div>
    `;

    showInfoModal('💰 위험 매출액 상세', html);
}

/**
 * Show AQL (Acceptable Quality Level) detail modal
 */
export function showAQLDetail() {
    const filteredData = deps.getFilteredData();
    const aqlStats = deps.calculateAQLStats(filteredData);

    // Calculate process completion stats
    const processStats = {};
    deps.PROCESS_ORDER.forEach(proc => {
        const completed = filteredData.reduce((sum, d) => sum + (d.production?.[proc]?.completed || 0), 0);
        const total = filteredData.reduce((sum, d) => sum + (d.quantity || 0), 0);
        processStats[proc] = {
            completed,
            total,
            rate: total > 0 ? (completed / total * 100).toFixed(1) : 0
        };
    });

    const processRows = deps.PROCESS_ORDER.map(proc => `
        <tr class="border-b border-gray-200 dark:border-gray-600">
            <td class="py-2">${deps.PROCESS_NAMES[proc] || proc}</td>
            <td class="py-2 text-right">${deps.formatNumber(processStats[proc].completed)}</td>
            <td class="py-2 text-right">${processStats[proc].rate}%</td>
        </tr>
    `).join('');

    const html = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg text-center">
                    <div class="text-3xl font-bold text-green-600 dark:text-green-400">${aqlStats.passRate?.toFixed(1) || 0}%</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">AQL 합격률</div>
                </div>
                <div class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-center">
                    <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">${deps.formatNumber(filteredData.length)}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">검사 대상</div>
                </div>
            </div>

            <div class="mt-4">
                <h4 class="font-semibold mb-2">📊 공정별 완료 현황</h4>
                <table class="w-full text-sm">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th class="py-2 text-left">공정</th>
                            <th class="py-2 text-right">완료 수량</th>
                            <th class="py-2 text-right">완료율</th>
                        </tr>
                    </thead>
                    <tbody>${processRows}</tbody>
                </table>
            </div>
        </div>
    `;

    showInfoModal('🔍 AQL 품질 분석', html);
}

/**
 * Show Bottleneck detail modal
 */
export function showBottleneckDetail() {
    const filteredData = deps.getFilteredData();
    const bottleneck = deps.predictBottleneck(filteredData);

    // Calculate all process completion rates
    const processRates = deps.PROCESS_ORDER.map(proc => {
        const completed = filteredData.reduce((sum, d) => sum + (d.production?.[proc]?.completed || 0), 0);
        const total = filteredData.reduce((sum, d) => sum + (d.quantity || 0), 0);
        return {
            process: proc,
            name: deps.PROCESS_NAMES[proc] || proc,
            completed,
            total,
            rate: total > 0 ? (completed / total * 100) : 0
        };
    }).sort((a, b) => a.rate - b.rate);

    const processRows = processRates.map((p, i) => {
        const isBottleneck = i === 0;
        const rowClass = isBottleneck ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold' : '';
        return `
            <tr class="border-b border-gray-200 dark:border-gray-600 ${rowClass}">
                <td class="py-2">${isBottleneck ? '🚨 ' : ''}${p.name}</td>
                <td class="py-2 text-right">${deps.formatNumber(p.completed)}</td>
                <td class="py-2 text-right">${deps.formatNumber(p.total)}</td>
                <td class="py-2 text-right">${p.rate.toFixed(1)}%</td>
            </tr>
        `;
    }).join('');

    const html = `
        <div class="space-y-4">
            <div class="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-2xl">🚨</span>
                    <span class="text-xl font-bold text-red-600 dark:text-red-400">
                        ${bottleneck.process ? (deps.PROCESS_NAMES[bottleneck.process] || bottleneck.process) : '분석 중...'}
                    </span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    가장 낮은 완료율을 보이는 공정입니다. 이 공정에 리소스를 집중하면 전체 생산성을 개선할 수 있습니다.
                </p>
            </div>

            <div class="mt-4">
                <h4 class="font-semibold mb-2">📊 공정별 완료율 (낮은 순)</h4>
                <table class="w-full text-sm">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th class="py-2 text-left">공정</th>
                            <th class="py-2 text-right">완료</th>
                            <th class="py-2 text-right">목표</th>
                            <th class="py-2 text-right">완료율</th>
                        </tr>
                    </thead>
                    <tbody>${processRows}</tbody>
                </table>
            </div>

            <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <h4 class="font-semibold mb-1">💡 개선 제안</h4>
                <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• 병목 공정에 추가 인력 배치 고려</li>
                    <li>• 선행 공정의 출력량 조절로 재공품 감소</li>
                    <li>• 병목 공정의 작업 효율화 검토</li>
                </ul>
            </div>
        </div>
    `;

    showInfoModal('🔧 병목 공정 분석', html);
}

// ============================================================================
// Keyboard Shortcuts Modal Functions
// ============================================================================

/**
 * Open keyboard shortcuts modal
 */
export function openKeyboardShortcutsModal() {
    const modal = document.getElementById('keyboardShortcutsModal');
    if (modal) {
        modal.classList.remove('hidden');
        deps.trapFocus(modal);
    }
}

/**
 * Close keyboard shortcuts modal
 */
export function closeKeyboardShortcutsModal() {
    const modal = document.getElementById('keyboardShortcutsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    deps.releaseFocus();
}

// ============================================================================
// Global Modal Management
// ============================================================================

/**
 * Close all open modals
 */
export function closeAllModals() {
    // Close specific known modals
    const modalIds = [
        'orderDetailModal',
        'helpModal',
        'infoModal',
        'keyboardShortcutsModal',
        'dailyReportModal'
    ];

    modalIds.forEach(id => {
        const modal = document.getElementById(id);
        if (modal && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
        }
    });

    // Close daily report if function exists
    if (typeof deps.closeDailyReport === 'function') {
        try {
            deps.closeDailyReport();
        } catch (e) {
            // Ignore errors
        }
    }

    // Close any other open modals with standard structure
    document.querySelectorAll('.fixed.inset-0:not(.hidden)').forEach(modal => {
        if (modal.getAttribute('role') === 'dialog' || modal.classList.contains('z-[10000]')) {
            modal.classList.add('hidden');
        }
    });

    deps.releaseFocus();
}

// ============================================================================
// Order Process Detail Modal
// ============================================================================

/**
 * Show detailed process information for an order
 * @param {Object} order - Order data object
 */
export function showOrderProcessDetail(order) {
    if (!order || !order.production) return;

    const processRows = deps.PROCESS_ORDER.map(proc => {
        const procData = order.production[proc] || {};
        const completed = procData.completed || 0;
        const status = procData.status || 'pending';
        const rate = order.quantity > 0 ? (completed / order.quantity * 100).toFixed(1) : 0;

        const statusColors = {
            completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            pending: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
        };

        return `
            <tr class="border-b border-gray-200 dark:border-gray-600">
                <td class="py-2">${deps.PROCESS_NAMES[proc] || proc}</td>
                <td class="py-2 text-right">${deps.formatNumber(completed)}</td>
                <td class="py-2 text-right">${rate}%</td>
                <td class="py-2 text-center">
                    <span class="px-2 py-1 rounded-full text-xs ${statusColors[status] || statusColors.pending}">
                        ${status}
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    const html = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div><span class="font-semibold">PO:</span> ${deps.escapeHtml(order.poNumber || '')}</div>
                <div><span class="font-semibold">Model:</span> ${deps.escapeHtml(order.model || '')}</div>
                <div><span class="font-semibold">Factory:</span> ${deps.escapeHtml(order.factory || '')}</div>
                <div><span class="font-semibold">Destination:</span> ${deps.escapeHtml(order.destination || '')}</div>
                <div><span class="font-semibold">Quantity:</span> ${deps.formatNumber(order.quantity || 0)}</div>
                <div><span class="font-semibold">CRD:</span> ${deps.escapeHtml(order.crd || '')}</div>
            </div>

            <div class="mt-4">
                <h4 class="font-semibold mb-2">📊 공정별 진행 현황</h4>
                <table class="w-full text-sm">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th class="py-2 text-left">공정</th>
                            <th class="py-2 text-right">완료</th>
                            <th class="py-2 text-right">완료율</th>
                            <th class="py-2 text-center">상태</th>
                        </tr>
                    </thead>
                    <tbody>${processRows}</tbody>
                </table>
            </div>
        </div>
    `;

    showInfoModal(`📋 오더 상세: ${deps.escapeHtml(order.poNumber || '')}`, html);
}

// ============================================================================
// Module Exports Summary
// ============================================================================
/**
 * Total Exports: 25
 *
 * Initialization (1):
 * - initModalView(dependencies)
 *
 * Helper Functions (2):
 * - createModalTableRowHTML(d)
 * - showShortcutNotification(description)
 *
 * Order List Modal (2):
 * - showOrderListModal(title, orders)
 * - closeOrderModal()
 *
 * Quick Access Modals (4):
 * - showDelayedOrders()
 * - showWarningOrders()
 * - showInventoryOrders()
 * - showShippedOrders()
 *
 * Entity Detail Modals (4):
 * - showVendorDetail(vendor)
 * - showFactoryDetail(factory)
 * - showCountryDetail(country)
 * - showModelDetail(model)
 *
 * Help Modal (3):
 * - toggleHelpModal()
 * - toggleInsightsHelp()
 * - closeHelpModal()
 *
 * Info Modal (2):
 * - showInfoModal(title, content)
 * - closeInfoModal()
 *
 * Analytics Detail Modals (4):
 * - showOTDDetail()
 * - showRevenueRiskDetail()
 * - showAQLDetail()
 * - showBottleneckDetail()
 *
 * Keyboard Shortcuts Modal (2):
 * - openKeyboardShortcutsModal()
 * - closeKeyboardShortcutsModal()
 *
 * Global Modal Management (1):
 * - closeAllModals()
 *
 * Order Process Detail (1):
 * - showOrderProcessDetail(order)
 */

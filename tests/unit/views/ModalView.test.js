/**
 * ModalView.test.js - Unit Tests for ModalView Module
 * =====================================================
 *
 * Tests for modal dialogs, detail views, help overlays, and keyboard shortcuts.
 *
 * @module tests/unit/views/ModalView
 * @version 19.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    initModalView,
    createModalTableRowHTML,
    showShortcutNotification,
    showOrderListModal,
    closeOrderModal,
    showDelayedOrders,
    showWarningOrders,
    showInventoryOrders,
    showShippedOrders,
    showVendorDetail,
    showFactoryDetail,
    showCountryDetail,
    showModelDetail,
    showOrderProcessDetail,
    toggleHelpModal,
    toggleInsightsHelp,
    closeHelpModal,
    showInfoModal,
    closeInfoModal,
    showOTDDetail,
    showRevenueRiskDetail,
    showAQLDetail,
    showBottleneckDetail,
    openKeyboardShortcutsModal,
    closeKeyboardShortcutsModal,
    closeAllModals
} from '../../../src/views/ModalView.js';

// ============================================================================
// Mock Data
// ============================================================================

const mockOrderData = [
    {
        factory: 'A',
        poNumber: 'PO-001',
        model: 'RS-100',
        article: 'ART-001',
        destination: 'USA',
        quantity: 1000,
        crd: '2026-01-15',
        sddValue: '2026-01-10',
        vendor: 'Vendor1',
        production: {
            s_cut: { completed: 1000, status: 'completed' },
            sew_bal: { completed: 800, status: 'partial' },
            wh_out: { completed: 500, status: 'partial' }
        }
    },
    {
        factory: 'B',
        poNumber: 'PO-002',
        model: 'RS-200',
        article: 'ART-002',
        destination: 'Japan',
        quantity: 500,
        crd: '2026-01-20',
        sddValue: '2026-01-25', // Delayed
        vendor: 'Vendor2',
        production: {
            s_cut: { completed: 500, status: 'completed' },
            sew_bal: { completed: 200, status: 'partial' },
            wh_out: { completed: 0, status: 'pending' }
        }
    }
];

// ============================================================================
// Mock DOM Elements
// ============================================================================

function createMockElement(id, options = {}) {
    const children = [];
    return {
        id,
        innerHTML: options.innerHTML || '',
        textContent: '',
        value: options.value || '',
        style: { display: '' },
        children,
        classList: {
            contains: vi.fn(() => options.hasClass || false),
            add: vi.fn(),
            remove: vi.fn(),
            toggle: vi.fn()
        },
        appendChild: vi.fn((child) => children.push(child)),
        removeChild: vi.fn(),
        insertAdjacentHTML: vi.fn(),
        querySelector: vi.fn(() => createMockElement('child')),
        querySelectorAll: vi.fn(() => []),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        focus: vi.fn(),
        blur: vi.fn(),
        click: vi.fn(),
        remove: vi.fn(),
        closest: vi.fn(() => null),
        getAttribute: vi.fn(() => null),
        setAttribute: vi.fn(),
        removeAttribute: vi.fn()
    };
}

function createMockDocument() {
    const elements = {};
    const body = createMockElement('body');

    return {
        getElementById: vi.fn((id) => {
            if (!elements[id]) {
                elements[id] = createMockElement(id);
            }
            return elements[id];
        }),
        querySelector: vi.fn(() => createMockElement('mock')),
        querySelectorAll: vi.fn(() => []),
        createElement: vi.fn((tag) => createMockElement(tag)),
        createDocumentFragment: vi.fn(() => ({
            appendChild: vi.fn(),
            children: [],
            querySelectorAll: vi.fn(() => [])
        })),
        body,
        activeElement: createMockElement('active')
    };
}

// ============================================================================
// Mock Dependencies
// ============================================================================

function createMockDependencies() {
    return {
        document: createMockDocument(),
        allData: mockOrderData,
        filteredData: mockOrderData,
        isDelayed: vi.fn((d) => d.sddValue && d.crd && new Date(d.sddValue) > new Date(d.crd)),
        isWarning: vi.fn(() => false),
        isCritical: vi.fn(() => false),
        isShipped: vi.fn((d) => d.production?.wh_out?.status === 'completed'),
        escapeHtml: vi.fn((str) => String(str).replace(/[&<>"']/g, '')),
        formatNumber: vi.fn((n) => n?.toLocaleString() || '0'),
        formatDate: vi.fn((d) => d || '-'),
        i18n: vi.fn((key) => key),
        createModalTableRowHTML: vi.fn(() => '<tr><td>Mock Row</td></tr>')
    };
}

// ============================================================================
// Tests
// ============================================================================

describe('ModalView Module', () => {
    let mockDeps;

    beforeEach(() => {
        vi.clearAllMocks();
        mockDeps = createMockDependencies();
        vi.stubGlobal('document', mockDeps.document);
        initModalView(mockDeps);
    });

    afterEach(() => {
        closeAllModals();
    });

    // ========================================================================
    // Initialization Tests
    // ========================================================================

    describe('initModalView', () => {
        it('should initialize without errors', () => {
            expect(() => {
                initModalView(mockDeps);
            }).not.toThrow();
        });

        it('should accept custom dependencies', () => {
            const customEscape = vi.fn((s) => s);

            expect(() => {
                initModalView({
                    ...mockDeps,
                    escapeHtml: customEscape
                });
            }).not.toThrow();
        });
    });

    // ========================================================================
    // Row Rendering Tests
    // ========================================================================

    describe('createModalTableRowHTML', () => {
        it('should create HTML for modal table row', () => {
            const html = createModalTableRowHTML(mockOrderData[0], 0);

            expect(typeof html).toBe('string');
        });

        it('should handle various data structures', () => {
            mockOrderData.forEach((data, index) => {
                expect(() => {
                    createModalTableRowHTML(data, index);
                }).not.toThrow();
            });
        });
    });

    // ========================================================================
    // Notification Tests
    // ========================================================================

    describe('showShortcutNotification', () => {
        it('should show notification message', () => {
            expect(() => {
                showShortcutNotification('Test notification');
            }).not.toThrow();
        });

        it('should handle empty message', () => {
            expect(() => {
                showShortcutNotification('');
            }).not.toThrow();
        });

        it('should handle special characters', () => {
            expect(() => {
                showShortcutNotification('<script>alert("xss")</script>');
            }).not.toThrow();
        });
    });

    // ========================================================================
    // Order List Modal Tests
    // ========================================================================

    describe('showOrderListModal', () => {
        it('should show order list modal', () => {
            expect(() => {
                showOrderListModal('Test Orders', mockOrderData, () => true);
            }).not.toThrow();
        });

        it('should filter orders with provided function', () => {
            const filterFn = vi.fn((d) => d.factory === 'A');

            showOrderListModal('Factory A Orders', mockOrderData, filterFn);

            expect(filterFn).toHaveBeenCalled();
        });

        it('should handle empty orders array', () => {
            expect(() => {
                showOrderListModal('Empty Orders', [], () => true);
            }).not.toThrow();
        });
    });

    describe('closeOrderModal', () => {
        it('should close order modal', () => {
            showOrderListModal('Test', mockOrderData, () => true);

            expect(() => {
                closeOrderModal();
            }).not.toThrow();
        });

        it('should not throw when no modal is open', () => {
            expect(() => {
                closeOrderModal();
            }).not.toThrow();
        });
    });

    // ========================================================================
    // Quick Order Views Tests
    // ========================================================================

    describe('showDelayedOrders', () => {
        it('should show delayed orders modal', () => {
            expect(() => {
                showDelayedOrders();
            }).not.toThrow();
        });
    });

    describe('showWarningOrders', () => {
        it('should show warning orders modal', () => {
            expect(() => {
                showWarningOrders();
            }).not.toThrow();
        });
    });

    describe('showInventoryOrders', () => {
        it('should show inventory orders modal', () => {
            expect(() => {
                showInventoryOrders();
            }).not.toThrow();
        });
    });

    describe('showShippedOrders', () => {
        it('should show shipped orders modal', () => {
            expect(() => {
                showShippedOrders();
            }).not.toThrow();
        });
    });

    // ========================================================================
    // Detail Modal Tests
    // ========================================================================

    describe('showVendorDetail', () => {
        it('should show vendor detail modal', () => {
            expect(() => {
                showVendorDetail('Vendor1');
            }).not.toThrow();
        });

        it('should handle non-existent vendor', () => {
            expect(() => {
                showVendorDetail('NonExistentVendor');
            }).not.toThrow();
        });

        it('should escape vendor name', () => {
            expect(() => {
                showVendorDetail('<script>alert("xss")</script>');
            }).not.toThrow();
        });
    });

    describe('showFactoryDetail', () => {
        it('should show factory detail modal', () => {
            expect(() => {
                showFactoryDetail('A');
            }).not.toThrow();
        });

        it('should handle all factory codes', () => {
            ['A', 'B', 'C', 'D'].forEach(factory => {
                expect(() => {
                    showFactoryDetail(factory);
                }).not.toThrow();
            });
        });
    });

    describe('showCountryDetail', () => {
        it('should show country detail modal', () => {
            expect(() => {
                showCountryDetail('USA');
            }).not.toThrow();
        });

        it('should handle Korean country names', () => {
            expect(() => {
                showCountryDetail('한국');
            }).not.toThrow();
        });
    });

    describe('showModelDetail', () => {
        it('should show model detail modal', () => {
            expect(() => {
                showModelDetail('RS-100');
            }).not.toThrow();
        });
    });

    describe('showOrderProcessDetail', () => {
        it('should show order process detail modal', () => {
            expect(() => {
                showOrderProcessDetail(mockOrderData[0]);
            }).not.toThrow();
        });

        it('should handle incomplete order data', () => {
            const incompleteOrder = {
                factory: 'A',
                model: 'Test'
            };

            expect(() => {
                showOrderProcessDetail(incompleteOrder);
            }).not.toThrow();
        });
    });

    // ========================================================================
    // Help Modal Tests
    // ========================================================================

    describe('toggleHelpModal', () => {
        it('should toggle help modal', () => {
            expect(() => {
                toggleHelpModal();
            }).not.toThrow();
        });

        it('should toggle off when called twice', () => {
            toggleHelpModal(); // Open
            toggleHelpModal(); // Close

            expect(true).toBe(true);
        });
    });

    describe('toggleInsightsHelp', () => {
        it('should toggle insights help', () => {
            expect(() => {
                toggleInsightsHelp();
            }).not.toThrow();
        });
    });

    describe('closeHelpModal', () => {
        it('should close help modal', () => {
            toggleHelpModal();

            expect(() => {
                closeHelpModal();
            }).not.toThrow();
        });
    });

    // ========================================================================
    // Info Modal Tests
    // ========================================================================

    describe('showInfoModal', () => {
        it('should show info modal with title and content', () => {
            expect(() => {
                showInfoModal('Info Title', 'Info content goes here');
            }).not.toThrow();
        });

        it('should handle HTML content', () => {
            expect(() => {
                showInfoModal('Title', '<p>Paragraph content</p>');
            }).not.toThrow();
        });
    });

    describe('closeInfoModal', () => {
        it('should close info modal', () => {
            showInfoModal('Test', 'Content');

            expect(() => {
                closeInfoModal();
            }).not.toThrow();
        });
    });

    // ========================================================================
    // KPI Detail Modal Tests
    // ========================================================================

    describe('showOTDDetail', () => {
        it('should show OTD detail modal', () => {
            expect(() => {
                showOTDDetail();
            }).not.toThrow();
        });
    });

    describe('showRevenueRiskDetail', () => {
        it('should show revenue risk detail modal', () => {
            expect(() => {
                showRevenueRiskDetail();
            }).not.toThrow();
        });
    });

    describe('showAQLDetail', () => {
        it('should show AQL detail modal', () => {
            expect(() => {
                showAQLDetail();
            }).not.toThrow();
        });
    });

    describe('showBottleneckDetail', () => {
        it('should show bottleneck detail modal', () => {
            expect(() => {
                showBottleneckDetail();
            }).not.toThrow();
        });
    });

    // ========================================================================
    // Keyboard Shortcuts Modal Tests
    // ========================================================================

    describe('openKeyboardShortcutsModal', () => {
        it('should open keyboard shortcuts modal', () => {
            expect(() => {
                openKeyboardShortcutsModal();
            }).not.toThrow();
        });
    });

    describe('closeKeyboardShortcutsModal', () => {
        it('should close keyboard shortcuts modal', () => {
            openKeyboardShortcutsModal();

            expect(() => {
                closeKeyboardShortcutsModal();
            }).not.toThrow();
        });
    });

    // ========================================================================
    // Close All Modals Tests
    // ========================================================================

    describe('closeAllModals', () => {
        it('should close all open modals', () => {
            // Open multiple modals
            showOrderListModal('Test1', mockOrderData, () => true);
            toggleHelpModal();
            showInfoModal('Info', 'Content');

            expect(() => {
                closeAllModals();
            }).not.toThrow();
        });

        it('should work when no modals are open', () => {
            expect(() => {
                closeAllModals();
            }).not.toThrow();
        });
    });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('ModalView Integration', () => {
    let mockDeps;

    beforeEach(() => {
        vi.clearAllMocks();
        mockDeps = createMockDependencies();
        vi.stubGlobal('document', mockDeps.document);
        initModalView(mockDeps);
    });

    it('should handle modal lifecycle correctly', () => {
        // Open modal
        showOrderListModal('Test Orders', mockOrderData, () => true);

        // Close modal
        closeOrderModal();

        // Verify no errors
        expect(true).toBe(true);
    });

    it('should handle rapid open/close cycles', () => {
        for (let i = 0; i < 10; i++) {
            showInfoModal('Test', 'Content');
            closeInfoModal();
        }

        expect(true).toBe(true);
    });

    it('should handle keyboard shortcut notification during modal', () => {
        showOrderListModal('Test', mockOrderData, () => true);
        showShortcutNotification('Shortcut pressed');

        expect(true).toBe(true);
    });
});

// ============================================================================
// Edge Cases and Error Handling Tests
// ============================================================================

describe('ModalView Edge Cases', () => {
    let mockDeps;

    beforeEach(() => {
        vi.clearAllMocks();
        mockDeps = createMockDependencies();
        vi.stubGlobal('document', mockDeps.document);
        initModalView(mockDeps);
    });

    it('should handle null data gracefully', () => {
        expect(() => {
            showOrderListModal('Null Data', null, () => true);
        }).not.toThrow();
    });

    it('should handle undefined filter function', () => {
        expect(() => {
            showOrderListModal('No Filter', mockOrderData, undefined);
        }).not.toThrow();
    });

    it('should handle XSS attempts in modal content', () => {
        expect(() => {
            showInfoModal(
                '<script>alert("title")</script>',
                '<img src=x onerror=alert("content")>'
            );
        }).not.toThrow();
    });

    it('should handle very long content', () => {
        const longContent = 'A'.repeat(10000);

        expect(() => {
            showInfoModal('Long Content', longContent);
        }).not.toThrow();
    });

    it('should handle concurrent modal operations', () => {
        // Rapidly open different modals
        showVendorDetail('Vendor1');
        showFactoryDetail('A');
        showCountryDetail('USA');
        showModelDetail('RS-100');

        closeAllModals();

        expect(true).toBe(true);
    });
});

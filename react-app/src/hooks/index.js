/**
 * @fileoverview Hooks Index
 * Exports all custom hooks from a single entry point.
 *
 * Architecture Note:
 * - useOrdersData: NEW unified hook using OrdersContext (recommended)
 * - useOrders + useFilters: Legacy hooks (being phased out)
 *
 * Migration: Components should migrate from useOrders + useFilters
 * to useOrdersData for unified data management.
 *
 * @module hooks
 */

// NEW: Unified order data hook (uses OrdersContext)
export { useOrdersData } from './useOrdersData';

// Legacy: Individual data hooks (still functional but being phased out)
export { useOrders } from './useOrders';
export { useFilters } from './useFilters';

// Utility hooks
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useDataValidation } from './useDataValidation';
export { useGoogleDrive } from './useGoogleDrive';
export { useCacheStatus } from './useCacheStatus';
export { useErrorTracking, ERROR_CATEGORY, ERROR_SEVERITY } from './useErrorTracking';
export { useSnapshot } from './useSnapshot';
export { useAQLEvents } from './useAQLEvents';
export { useTasks, TASK_STATUS, TASK_PRIORITY } from './useTasks';

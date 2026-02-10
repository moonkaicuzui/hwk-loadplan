/**
 * @fileoverview Grouping Utility Functions
 * Reusable functions for grouping order data by various dimensions.
 *
 * @module utils/groupingUtils
 */

import { getYearMonth } from './dateUtils';
import { isDelayed, getOrderStatus } from './orderUtils';

/**
 * Group orders by month
 * @param {Object[]} orders - Array of orders
 * @param {string} dateMode - 'SDD' or 'CRD'
 * @returns {Object[]} Array of month groups sorted by month
 */
export function groupOrdersByMonth(orders, dateMode = 'SDD') {
  if (!orders || orders.length === 0) return [];

  const grouped = {};

  orders.forEach(order => {
    const dateField = dateMode === 'SDD' ? (order.sddValue || order.sdd) : order.crd;
    const month = getYearMonth(dateField);

    if (!month) return;

    if (!grouped[month]) {
      grouped[month] = {
        month,
        orders: [],
        totalQuantity: 0,
        completedQuantity: 0,
        delayedCount: 0,
        delayedQuantity: 0,
        orderCount: 0
      };
    }

    const qty = order.quantity || order.ttl_qty || 0;

    grouped[month].orders.push(order);
    grouped[month].totalQuantity += qty;
    grouped[month].orderCount++;

    if (getOrderStatus(order) === 'completed') {
      grouped[month].completedQuantity += qty;
    }

    if (isDelayed(order)) {
      grouped[month].delayedCount++;
      grouped[month].delayedQuantity += qty;
    }
  });

  return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Group orders by destination
 * @param {Object[]} orders - Array of orders
 * @returns {Object[]} Array of destination groups sorted by quantity (descending)
 */
export function groupOrdersByDestination(orders) {
  if (!orders || orders.length === 0) return [];

  const grouped = {};

  orders.forEach(order => {
    const dest = order.destination || 'Unknown';
    const qty = order.quantity || order.ttl_qty || 0;

    if (!grouped[dest]) {
      grouped[dest] = {
        destination: dest,
        orders: [],
        totalQuantity: 0,
        completedQuantity: 0,
        orderCount: 0,
        delayedCount: 0
      };
    }

    grouped[dest].orders.push(order);
    grouped[dest].totalQuantity += qty;
    grouped[dest].orderCount++;

    if (getOrderStatus(order) === 'completed') {
      grouped[dest].completedQuantity += qty;
    }

    if (isDelayed(order)) {
      grouped[dest].delayedCount++;
    }
  });

  return Object.values(grouped).sort((a, b) => b.totalQuantity - a.totalQuantity);
}

/**
 * Group orders by factory
 * @param {Object[]} orders - Array of orders
 * @returns {Object} Factory ID to group data mapping
 */
export function groupOrdersByFactory(orders) {
  if (!orders || orders.length === 0) return {};

  const grouped = {};

  orders.forEach(order => {
    const fact = order.factory || 'Unknown';
    const qty = order.quantity || order.ttl_qty || 0;

    if (!grouped[fact]) {
      grouped[fact] = {
        factory: fact,
        orders: [],
        totalQuantity: 0,
        completedQuantity: 0,
        delayedCount: 0,
        delayedQuantity: 0,
        orderCount: 0
      };
    }

    grouped[fact].orders.push(order);
    grouped[fact].totalQuantity += qty;
    grouped[fact].orderCount++;

    if (getOrderStatus(order) === 'completed') {
      grouped[fact].completedQuantity += qty;
    }

    if (isDelayed(order)) {
      grouped[fact].delayedCount++;
      grouped[fact].delayedQuantity += qty;
    }
  });

  return grouped;
}

/**
 * Group orders by model/style
 * @param {Object[]} orders - Array of orders
 * @returns {Object[]} Array of model groups sorted by quantity (descending)
 */
export function groupOrdersByModel(orders) {
  if (!orders || orders.length === 0) return [];

  const grouped = {};

  orders.forEach(order => {
    const model = order.model || order.style || order.article || 'Unknown';
    const qty = order.quantity || order.ttl_qty || 0;

    if (!grouped[model]) {
      grouped[model] = {
        model,
        orders: [],
        totalQuantity: 0,
        completedQuantity: 0,
        orderCount: 0,
        delayedCount: 0,
        factories: new Set()
      };
    }

    grouped[model].orders.push(order);
    grouped[model].totalQuantity += qty;
    grouped[model].orderCount++;
    grouped[model].factories.add(order.factory || 'Unknown');

    if (getOrderStatus(order) === 'completed') {
      grouped[model].completedQuantity += qty;
    }

    if (isDelayed(order)) {
      grouped[model].delayedCount++;
    }
  });

  // Convert Set to Array for serialization
  return Object.values(grouped)
    .map(g => ({ ...g, factories: Array.from(g.factories) }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity);
}

/**
 * Group orders by vendor
 * @param {Object[]} orders - Array of orders
 * @returns {Object[]} Array of vendor groups sorted by quantity (descending)
 */
export function groupOrdersByVendor(orders) {
  if (!orders || orders.length === 0) return [];

  const grouped = {};

  orders.forEach(order => {
    const vendor = order.vendor || order.buyer || 'Unknown';
    const qty = order.quantity || order.ttl_qty || 0;

    if (!grouped[vendor]) {
      grouped[vendor] = {
        vendor,
        orders: [],
        totalQuantity: 0,
        completedQuantity: 0,
        orderCount: 0,
        delayedCount: 0
      };
    }

    grouped[vendor].orders.push(order);
    grouped[vendor].totalQuantity += qty;
    grouped[vendor].orderCount++;

    if (getOrderStatus(order) === 'completed') {
      grouped[vendor].completedQuantity += qty;
    }

    if (isDelayed(order)) {
      grouped[vendor].delayedCount++;
    }
  });

  return Object.values(grouped).sort((a, b) => b.totalQuantity - a.totalQuantity);
}

/**
 * Calculate completion rate from group data
 * @param {Object} group - Group object with totalQuantity and completedQuantity
 * @returns {number} Completion rate (0-100)
 */
export function getGroupCompletionRate(group) {
  if (!group || !group.totalQuantity) return 0;
  return Math.round((group.completedQuantity / group.totalQuantity) * 100);
}

/**
 * Calculate delay rate from group data
 * @param {Object} group - Group object with orderCount and delayedCount
 * @returns {number} Delay rate (0-100)
 */
export function getGroupDelayRate(group) {
  if (!group || !group.orderCount) return 0;
  return Math.round((group.delayedCount / group.orderCount) * 100);
}

export default {
  groupOrdersByMonth,
  groupOrdersByDestination,
  groupOrdersByFactory,
  groupOrdersByModel,
  groupOrdersByVendor,
  getGroupCompletionRate,
  getGroupDelayRate
};

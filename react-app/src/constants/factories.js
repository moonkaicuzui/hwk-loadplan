/**
 * @fileoverview Factory Configuration Constants
 * Defines factory identifiers and configuration.
 *
 * @module constants/factories
 */

/**
 * Factory identifiers
 */
export const FACTORIES = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  ALL: 'ALL'
};

/**
 * Factory configuration with metadata
 */
export const FACTORY_CONFIG = {
  [FACTORIES.A]: {
    id: 'A',
    name: 'Factory A',
    code: 'FACTORY_A',
    color: '#3B82F6', // Blue
    description: 'Rachgia Factory A',
    location: 'Vietnam',
    capacity: 50000,
    enabled: true
  },
  [FACTORIES.B]: {
    id: 'B',
    name: 'Factory B',
    code: 'FACTORY_B',
    color: '#10B981', // Green
    description: 'Rachgia Factory B',
    location: 'Vietnam',
    capacity: 45000,
    enabled: true
  },
  [FACTORIES.C]: {
    id: 'C',
    name: 'Factory C',
    code: 'FACTORY_C',
    color: '#F59E0B', // Amber
    description: 'Rachgia Factory C',
    location: 'Vietnam',
    capacity: 40000,
    enabled: true
  },
  [FACTORIES.D]: {
    id: 'D',
    name: 'Factory D',
    code: 'FACTORY_D',
    color: '#EF4444', // Red
    description: 'Rachgia Factory D',
    location: 'Vietnam',
    capacity: 35000,
    enabled: true
  }
};

/**
 * Factory list for dropdowns and selectors
 */
export const FACTORY_LIST = [
  { id: 'ALL', name: '전체', code: 'ALL_FACTORIES' },
  { id: 'A', name: 'Factory A', code: 'FACTORY_A' },
  { id: 'B', name: 'Factory B', code: 'FACTORY_B' },
  { id: 'C', name: 'Factory C', code: 'FACTORY_C' },
  { id: 'D', name: 'Factory D', code: 'FACTORY_D' }
];

/**
 * Get factory info by ID
 * @param {string} factoryId - Factory identifier
 * @returns {Object|null} Factory configuration
 */
export function getFactoryById(factoryId) {
  if (factoryId === FACTORIES.ALL) {
    return {
      id: 'ALL',
      name: '전체 공장',
      code: 'ALL_FACTORIES',
      color: '#6B7280',
      description: 'All Factories Combined'
    };
  }
  return FACTORY_CONFIG[factoryId] || null;
}

/**
 * Get factory color by ID
 * @param {string} factoryId - Factory identifier
 * @returns {string} Color hex code
 */
export function getFactoryColor(factoryId) {
  const factory = getFactoryById(factoryId);
  return factory?.color || '#6B7280';
}

/**
 * Check if factory ID is valid
 * @param {string} factoryId - Factory identifier
 * @returns {boolean} True if valid
 */
export function isValidFactory(factoryId) {
  return factoryId === FACTORIES.ALL || factoryId in FACTORY_CONFIG;
}

export default FACTORY_CONFIG;

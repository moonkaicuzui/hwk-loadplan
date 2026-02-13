/**
 * @fileoverview Production Process Constants
 * Defines the 8-stage production process flow.
 *
 * @module constants/processes
 */

/**
 * Production process stages in order
 * S_CUT → PRE_SEW → SEW_INPUT → SEW_BAL → S_FIT → ASS_BAL → WH_IN → WH_OUT
 */
export const PROCESS_STAGES = [
  {
    id: 's_cut',
    code: 'S_CUT',
    name: '재단',
    nameEn: 'Cutting',
    nameVi: 'Cắt',
    order: 1,
    color: '#3B82F6', // Blue
    description: '원단 재단 공정'
  },
  {
    id: 'pre_sew',
    code: 'PRE_SEW',
    name: '선봉',
    nameEn: 'Pre-Sewing',
    nameVi: 'May sơ bộ',
    order: 2,
    color: '#8B5CF6', // Purple
    description: '선봉 작업'
  },
  {
    id: 'sew_input',
    code: 'SEW_INPUT',
    name: '재봉투입',
    nameEn: 'Sewing Input',
    nameVi: 'Nhập may',
    order: 3,
    color: '#EC4899', // Pink
    description: '재봉 라인 투입'
  },
  {
    id: 'sew_bal',
    code: 'SEW_BAL',
    name: '재봉',
    nameEn: 'Sewing',
    nameVi: 'May',
    order: 4,
    color: '#F59E0B', // Amber
    description: '재봉 완료'
  },
  {
    id: 's_fit',
    code: 'S_FIT',
    name: '핏팅',
    nameEn: 'Fitting',
    nameVi: 'Lắp ráp',
    order: 5,
    color: '#10B981', // Emerald
    description: '갑피 핏팅'
  },
  {
    id: 'ass_bal',
    code: 'ASS_BAL',
    name: '제화',
    nameEn: 'Assembly',
    nameVi: 'Hoàn thiện',
    order: 6,
    color: '#14B8A6', // Teal
    description: '제화 완료'
  },
  {
    id: 'wh_in',
    code: 'WH_IN',
    name: '제품창고 입고',
    nameEn: 'Warehouse In',
    nameVi: 'Nhập kho',
    order: 7,
    color: '#06B6D4', // Cyan
    description: '제품창고 입고'
  },
  {
    id: 'wh_out',
    code: 'WH_OUT',
    name: '제품창고 출고',
    nameEn: 'Warehouse Out',
    nameVi: 'Xuất kho',
    order: 8,
    color: '#22C55E', // Green
    description: '제품창고 출고 (선적)'
  }
];

/**
 * Process stage map for quick lookup
 */
export const PROCESS_MAP = PROCESS_STAGES.reduce((map, stage) => {
  map[stage.id] = stage;
  map[stage.code] = stage;
  return map;
}, {});

/**
 * Get process stage by ID or code
 * @param {string} idOrCode - Process ID or code
 * @returns {Object|null} Process stage object
 */
export function getProcessStage(idOrCode) {
  return PROCESS_MAP[idOrCode] || PROCESS_MAP[idOrCode?.toLowerCase()] || null;
}

/**
 * Get process name in specified language
 * @param {string} idOrCode - Process ID or code
 * @param {string} lang - Language code (ko, en, vi)
 * @returns {string} Localized process name
 */
export function getProcessName(idOrCode, lang = 'ko') {
  const stage = getProcessStage(idOrCode);
  if (!stage) return idOrCode;

  switch (lang) {
    case 'en':
      return stage.nameEn;
    case 'vi':
      return stage.nameVi;
    default:
      return stage.name;
  }
}

/**
 * Get all process IDs in order
 * @returns {string[]} Array of process IDs
 */
export function getProcessIds() {
  return PROCESS_STAGES.map(s => s.id);
}

/**
 * Get all process codes in order
 * @returns {string[]} Array of process codes
 */
export function getProcessCodes() {
  return PROCESS_STAGES.map(s => s.code);
}

/**
 * Check if process ID/code is valid
 * @param {string} idOrCode - Process ID or code
 * @returns {boolean} True if valid
 */
export function isValidProcess(idOrCode) {
  return !!getProcessStage(idOrCode);
}

/**
 * Get process index (0-based)
 * @param {string} idOrCode - Process ID or code
 * @returns {number} Index or -1 if not found
 */
export function getProcessIndex(idOrCode) {
  const stage = getProcessStage(idOrCode);
  return stage ? stage.order - 1 : -1;
}

/**
 * Get process progress percentage
 * @param {string} currentProcess - Current process ID or code
 * @returns {number} Progress percentage (0-100)
 */
export function getProcessProgress(currentProcess) {
  const index = getProcessIndex(currentProcess);
  if (index < 0) return 0;
  return Math.round(((index + 1) / PROCESS_STAGES.length) * 100);
}

export default PROCESS_STAGES;

/**
 * @fileoverview Filter Chip Component
 * Displays selectable filter chips/tags.
 *
 * @module components/common/FilterChip
 */

import { X } from 'lucide-react';

/**
 * FilterChip Component
 * @param {Object} props
 * @param {string} props.label - Chip label text
 * @param {boolean} props.active - Whether chip is active/selected
 * @param {Function} props.onClick - Click handler
 * @param {Function} props.onRemove - Remove handler (shows X button)
 * @param {string} props.icon - Optional icon
 * @param {string} props.color - Optional color variant
 */
export default function FilterChip({
  label,
  active = false,
  onClick,
  onRemove,
  icon,
  color = 'blue',
  className = ''
}) {
  const colorVariants = {
    blue: active
      ? 'bg-blue-500 text-white hover:bg-blue-600'
      : 'bg-gray-100 dark:bg-gray-700 text-secondary hover:bg-gray-200 dark:hover:bg-gray-600',
    green: active
      ? 'bg-green-500 text-white hover:bg-green-600'
      : 'bg-gray-100 dark:bg-gray-700 text-secondary hover:bg-gray-200 dark:hover:bg-gray-600',
    red: active
      ? 'bg-red-500 text-white hover:bg-red-600'
      : 'bg-gray-100 dark:bg-gray-700 text-secondary hover:bg-gray-200 dark:hover:bg-gray-600',
    yellow: active
      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
      : 'bg-gray-100 dark:bg-gray-700 text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
        transition-all duration-200 cursor-pointer
        ${colorVariants[color] || colorVariants.blue}
        ${className}
      `}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
      {onRemove && active && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 p-0.5 rounded-full hover:bg-white/20 transition-colors"
          aria-label={`${label} 필터 제거`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </button>
  );
}

/**
 * FilterChipGroup Component
 * Groups multiple filter chips together
 */
export function FilterChipGroup({
  options,
  value,
  onChange,
  multiple = false,
  className = ''
}) {
  const handleClick = (optionValue) => {
    if (multiple) {
      const newValue = Array.isArray(value) ? [...value] : [];
      const index = newValue.indexOf(optionValue);
      if (index > -1) {
        newValue.splice(index, 1);
      } else {
        newValue.push(optionValue);
      }
      onChange(newValue);
    } else {
      onChange(value === optionValue ? null : optionValue);
    }
  };

  const isActive = (optionValue) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => (
        <FilterChip
          key={option.value}
          label={option.label}
          icon={option.icon}
          color={option.color}
          active={isActive(option.value)}
          onClick={() => handleClick(option.value)}
        />
      ))}
    </div>
  );
}

/**
 * ActiveFilters Component
 * Shows list of active filters with remove buttons
 */
export function ActiveFilters({ filters, onRemove, onClearAll }) {
  if (!filters || filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-secondary">활성 필터:</span>
      {filters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
        >
          <span className="font-medium">{filter.label}:</span>
          <span>{filter.value}</span>
          <button
            type="button"
            onClick={() => onRemove(filter.key)}
            className="ml-1 p-0.5 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            aria-label={`${filter.label} 필터 제거`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {filters.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-red-500 hover:text-red-600 underline"
        >
          전체 해제
        </button>
      )}
    </div>
  );
}


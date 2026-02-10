/**
 * @fileoverview Swipeable Order Card Component
 * Touch-friendly order card with swipe-to-action for mobile factory managers.
 * Supports swipe left (mark complete) and swipe right (view details).
 *
 * @module components/common/SwipeableOrderCard
 */

import { useState, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle,
  Eye,
  AlertTriangle,
  Clock,
  Package,
  MapPin,
  Factory,
  ChevronRight,
  Undo
} from 'lucide-react';

// Swipe thresholds
const SWIPE_THRESHOLD = 80; // pixels to trigger action
const VELOCITY_THRESHOLD = 0.3; // px/ms for fast swipe

/**
 * Status badge configurations
 */
const STATUS_CONFIG = {
  completed: {
    label: '완료',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle
  },
  partial: {
    label: '진행중',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Clock
  },
  pending: {
    label: '대기',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    icon: Package
  },
  delayed: {
    label: '지연',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: AlertTriangle
  },
  warning: {
    label: '경고',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: AlertTriangle
  }
};

/**
 * SwipeableOrderCard Component
 * Mobile-optimized order card with swipe gestures
 */
const SwipeableOrderCard = memo(function SwipeableOrderCard({
  order,
  status = 'pending',
  isDelayed = false,
  isWarning = false,
  completionRate = 0,
  daysUntilDue,
  onMarkComplete,
  onViewDetails,
  onQuickAction,
  className = ''
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);

  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isActionTriggered, setIsActionTriggered] = useState(false);

  // Determine effective status
  const effectiveStatus = isDelayed ? 'delayed' : isWarning ? 'warning' : status;
  const statusConfig = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  // Extract order info
  const poNumber = order.poNumber || order['Sales Order and Item'] || order['PO#'] || '-';
  const style = order.style || order['Art'] || order['Style'] || '-';
  const destination = order.destination || order['Dest'] || '-';
  const factory = order.factory || '-';
  const quantity = order.quantity || order['Q.ty'] || order['Qty'] || 0;

  // Format due date text
  const getDueDateText = () => {
    if (daysUntilDue === null || daysUntilDue === undefined) return null;
    if (daysUntilDue < 0) return `D+${Math.abs(daysUntilDue)}`;
    if (daysUntilDue === 0) return 'D-Day';
    return `D-${daysUntilDue}`;
  };

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    startXRef.current = e.touches[0].clientX;
    startTimeRef.current = Date.now();
    setIsDragging(true);
    setIsActionTriggered(false);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;

    // Limit the swipe distance with resistance
    const resistance = 0.5;
    const limitedDiff = diff > 0
      ? Math.min(diff * resistance, SWIPE_THRESHOLD * 1.5)
      : Math.max(diff * resistance, -SWIPE_THRESHOLD * 1.5);

    setTranslateX(limitedDiff);

    // Check if action threshold is reached
    if (Math.abs(limitedDiff) >= SWIPE_THRESHOLD && !isActionTriggered) {
      setIsActionTriggered(true);
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } else if (Math.abs(limitedDiff) < SWIPE_THRESHOLD && isActionTriggered) {
      setIsActionTriggered(false);
    }
  }, [isDragging, isActionTriggered]);

  const handleTouchEnd = useCallback((e) => {
    if (!isDragging) return;

    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;
    const velocity = Math.abs(translateX) / duration;

    // Check for fast swipe or threshold reached
    const shouldTrigger = Math.abs(translateX) >= SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD;

    if (shouldTrigger && Math.abs(translateX) > 30) {
      // Haptic feedback for action
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }

      if (translateX > 0) {
        // Swipe right - View details
        if (onViewDetails) {
          onViewDetails(order);
        } else {
          navigate(`/search?po=${encodeURIComponent(poNumber)}`);
        }
      } else {
        // Swipe left - Quick action
        if (onQuickAction) {
          onQuickAction(order, 'complete');
        } else if (onMarkComplete) {
          onMarkComplete(order);
        }
      }
    }

    // Reset position with animation
    setTranslateX(0);
    setIsDragging(false);
    setIsActionTriggered(false);
  }, [isDragging, translateX, onViewDetails, onQuickAction, onMarkComplete, order, poNumber, navigate]);

  // Mouse handlers for desktop testing
  const handleMouseDown = useCallback((e) => {
    startXRef.current = e.clientX;
    startTimeRef.current = Date.now();
    setIsDragging(true);

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const diff = e.clientX - startXRef.current;
      const resistance = 0.5;
      const limitedDiff = diff > 0
        ? Math.min(diff * resistance, SWIPE_THRESHOLD * 1.5)
        : Math.max(diff * resistance, -SWIPE_THRESHOLD * 1.5);
      setTranslateX(limitedDiff);
    };

    const handleMouseUp = () => {
      setTranslateX(0);
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isDragging]);

  const handleClick = useCallback(() => {
    if (Math.abs(translateX) < 10) {
      if (onViewDetails) {
        onViewDetails(order);
      } else {
        navigate(`/search?po=${encodeURIComponent(poNumber)}`);
      }
    }
  }, [translateX, onViewDetails, order, poNumber, navigate]);

  const dueDateText = getDueDateText();

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      role="listitem"
    >
      {/* Swipe action backgrounds */}
      {/* Left action (swipe right to reveal) - View Details */}
      <div
        className={`
          absolute inset-y-0 left-0 w-24 flex items-center justify-center
          bg-blue-500 transition-opacity duration-200
          ${translateX > 30 ? 'opacity-100' : 'opacity-50'}
        `}
      >
        <div className="flex flex-col items-center text-white">
          <Eye className={`w-6 h-6 ${isActionTriggered && translateX > 0 ? 'scale-125' : ''} transition-transform`} />
          <span className="text-xs mt-1">상세</span>
        </div>
      </div>

      {/* Right action (swipe left to reveal) - Quick Action */}
      <div
        className={`
          absolute inset-y-0 right-0 w-24 flex items-center justify-center
          bg-green-500 transition-opacity duration-200
          ${translateX < -30 ? 'opacity-100' : 'opacity-50'}
        `}
      >
        <div className="flex flex-col items-center text-white">
          <CheckCircle className={`w-6 h-6 ${isActionTriggered && translateX < 0 ? 'scale-125' : ''} transition-transform`} />
          <span className="text-xs mt-1">완료</span>
        </div>
      </div>

      {/* Main card content */}
      <div
        ref={cardRef}
        className={`
          relative bg-card border border-theme p-4
          transition-transform duration-200
          ${isDragging ? 'transition-none' : ''}
          ${isDelayed ? 'border-l-4 border-l-red-500' : ''}
          ${isWarning ? 'border-l-4 border-l-yellow-500' : ''}
          cursor-pointer active:bg-hover
        `}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        {/* Top row: PO# and Status */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-primary truncate">
              {poNumber}
            </h4>
            <p className="text-sm text-secondary truncate">
              {style}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-3">
            {/* Due date badge */}
            {dueDateText && (
              <span className={`
                px-2 py-0.5 rounded text-xs font-bold
                ${daysUntilDue <= 0 ? 'bg-red-500 text-white' : ''}
                ${daysUntilDue > 0 && daysUntilDue <= 3 ? 'bg-yellow-500 text-white' : ''}
                ${daysUntilDue > 3 ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : ''}
              `}>
                {dueDateText}
              </span>
            )}

            {/* Status badge */}
            <span className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
              ${statusConfig.color}
            `}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Middle row: Details */}
        <div className="flex items-center gap-4 text-sm text-secondary mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {destination}
          </span>
          <span className="flex items-center gap-1">
            <Factory className="w-3.5 h-3.5" />
            {factory}
          </span>
          <span className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            {Number(quantity).toLocaleString()}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`
                h-full rounded-full transition-all duration-300
                ${completionRate >= 100 ? 'bg-green-500' : ''}
                ${completionRate >= 50 && completionRate < 100 ? 'bg-blue-500' : ''}
                ${completionRate < 50 ? 'bg-gray-400' : ''}
              `}
              style={{ width: `${Math.min(100, completionRate)}%` }}
            />
          </div>
          <span className="absolute right-0 -top-5 text-xs text-secondary">
            {completionRate.toFixed(0)}%
          </span>
        </div>

        {/* Swipe hint for mobile */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none md:hidden">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
});

/**
 * SwipeableOrderList - Optimized list of swipeable cards
 */
export function SwipeableOrderList({
  orders = [],
  onMarkComplete,
  onViewDetails,
  onQuickAction,
  getOrderStatus,
  getCompletionRate,
  getDaysUntilDue,
  isDelayed: checkIsDelayed,
  isWarning: checkIsWarning,
  emptyMessage = '주문이 없습니다',
  className = ''
}) {
  const { t } = useTranslation();

  if (orders.length === 0) {
    return (
      <div className={`text-center py-12 text-secondary ${className}`}>
        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Swipe hint - show once */}
      <div className="text-xs text-secondary text-center py-2 md:hidden">
        <span className="inline-flex items-center gap-1">
          <Undo className="w-3 h-3 rotate-180" />
          {t('swipe.hint', '좌우로 밀어서 빠른 작업')}
        </span>
      </div>

      {orders.map((order, index) => {
        const status = getOrderStatus ? getOrderStatus(order) : 'pending';
        const completionRate = getCompletionRate ? getCompletionRate(order) : 0;
        const daysUntilDue = getDaysUntilDue ? getDaysUntilDue(order) : null;
        const delayed = checkIsDelayed ? checkIsDelayed(order) : false;
        const warning = checkIsWarning ? checkIsWarning(order) : false;

        return (
          <SwipeableOrderCard
            key={order.id || order.poNumber || index}
            order={order}
            status={status}
            isDelayed={delayed}
            isWarning={warning}
            completionRate={completionRate}
            daysUntilDue={daysUntilDue}
            onMarkComplete={onMarkComplete}
            onViewDetails={onViewDetails}
            onQuickAction={onQuickAction}
          />
        );
      })}
    </div>
  );
}

export default SwipeableOrderCard;

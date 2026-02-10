/**
 * @fileoverview Snapshot Hook - 간단한 일일 스냅샷 관리
 *
 * 사용법:
 * const { saveToday, getYesterday, compare } = useSnapshot();
 * await saveToday(orders);
 * const comparison = await compare(); // 어제 vs 오늘
 *
 * @module hooks/useSnapshot
 */

import { useState, useCallback } from 'react';
import { snapshotService } from '../services/snapshotService';

/**
 * useSnapshot - 간단한 스냅샷 관리 훅
 */
export function useSnapshot() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [comparison, setComparison] = useState(null);

  /**
   * 오늘 데이터 저장
   */
  const saveToday = useCallback(async (orders, factory = 'ALL') => {
    setIsLoading(true);
    try {
      const result = await snapshotService.saveDailySummary(orders, factory);
      setLastSaved(new Date());
      return result;
    } catch (error) {
      console.error('[useSnapshot] 저장 실패:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 어제 vs 오늘 비교
   */
  const compareWithYesterday = useCallback(async (factory = 'ALL') => {
    setIsLoading(true);
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const [todaySnapshot, yesterdaySnapshot] = await Promise.all([
        snapshotService.getSummaryByDate(today, factory),
        snapshotService.getSummaryByDate(yesterday, factory)
      ]);

      if (!todaySnapshot || !yesterdaySnapshot) {
        setComparison(null);
        return null;
      }

      const result = snapshotService.compareSnapshots(yesterdaySnapshot, todaySnapshot);
      setComparison(result);
      return result;
    } catch (error) {
      console.error('[useSnapshot] 비교 실패:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 최근 N일 추이 가져오기
   */
  const getRecentTrend = useCallback(async (days = 7, factory = 'ALL') => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const snapshots = await snapshotService.getSummariesInRange(startDate, endDate, factory);
      return snapshots.map(s => ({
        date: s.date.slice(0, 10),
        총오더: s.metrics.totalOrders,
        완료: s.metrics.completedOrders,
        지연: s.metrics.delayedOrders,
        총수량: s.metrics.totalQuantity
      }));
    } catch (error) {
      console.error('[useSnapshot] 추이 조회 실패:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    lastSaved,
    comparison,
    saveToday,
    compareWithYesterday,
    getRecentTrend
  };
}

export default useSnapshot;

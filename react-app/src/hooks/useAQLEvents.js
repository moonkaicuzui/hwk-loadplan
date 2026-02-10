/**
 * @fileoverview AQL Events Hook
 * AQL reject 이벤트 관리 훅 (localStorage 영속성)
 *
 * @module hooks/useAQLEvents
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'rachgia_aql_events';

/**
 * AQL 이벤트 관리 훅
 * @returns {Object} AQL 이벤트 상태 및 메서드
 */
export function useAQLEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // localStorage에서 이벤트 로드
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEvents(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load AQL events:', error);
    }
    setLoading(false);
  }, []);

  // 이벤트 변경 시 localStorage에 저장
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      } catch (error) {
        console.error('Failed to save AQL events:', error);
      }
    }
  }, [events, loading]);

  /**
   * 이벤트 추가
   */
  const addEvent = useCallback((event) => {
    setEvents(prev => [...prev, event]);
  }, []);

  /**
   * 이벤트 수정
   */
  const updateEvent = useCallback((eventId, updates) => {
    setEvents(prev => prev.map(event =>
      event.id === eventId
        ? { ...event, ...updates, updatedAt: new Date().toISOString() }
        : event
    ));
  }, []);

  /**
   * 상태만 업데이트
   */
  const updateStatus = useCallback((eventId, newStatus) => {
    updateEvent(eventId, { status: newStatus });
  }, [updateEvent]);

  /**
   * 이벤트 삭제
   */
  const deleteEvent = useCallback((eventId) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  }, []);

  /**
   * 모든 이벤트 삭제
   */
  const clearAllEvents = useCallback(() => {
    setEvents([]);
  }, []);

  /**
   * PO# 기준으로 이벤트 조회
   */
  const getEventsByPO = useCallback((poNumber) => {
    return events.filter(event => event.orderId === poNumber);
  }, [events]);

  /**
   * Article 기준으로 이벤트 조회
   */
  const getEventsByArticle = useCallback((article) => {
    return events.filter(event => {
      const eventArticle = event.order?.Art || event.order?.Article;
      return eventArticle === article;
    });
  }, [events]);

  /**
   * 진행 중인 이벤트만 조회 (Pass 제외)
   */
  const getActiveEvents = useCallback(() => {
    return events.filter(event => event.status !== 'pass');
  }, [events]);

  /**
   * 통계 계산
   */
  const getStatistics = useCallback(() => {
    const stats = {
      total: events.length,
      reject: 0,
      repacking: 0,
      reinspection: 0,
      pass: 0,
      totalRejectQty: 0,
      byDefectType: { critical: 0, major: 0, minor: 0 }
    };

    events.forEach(event => {
      stats[event.status]++;
      if (event.status !== 'pass') {
        stats.totalRejectQty += event.rejectQty || 0;
      }
      if (event.defectType) {
        stats.byDefectType[event.defectType]++;
      }
    });

    return stats;
  }, [events]);

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    updateStatus,
    deleteEvent,
    clearAllEvents,
    getEventsByPO,
    getEventsByArticle,
    getActiveEvents,
    getStatistics
  };
}

export default useAQLEvents;

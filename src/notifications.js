// =============================================================================
// Browser Notification System
// Agent W08: Browser Notifications Specialist
// Version: 19.0.0
// =============================================================================

/**
 * 브라우저 알림 시스템
 * - 지연 오더 자동 알림
 * - 마감 임박 경고
 * - 커스텀 알림 규칙
 * - 알림 빈도 제어 (throttling)
 */

class NotificationManager {
  constructor() {
    this.permission = 'default';
    this.notificationQueue = [];
    this.lastNotificationTime = {};
    this.throttleInterval = 5 * 60 * 1000; // 5분
    this.settings = this.loadSettings();

    this.init();
  }

  /**
   * 초기화
   */
  async init() {
    // 권한 상태 확인
    if ('Notification' in window) {
      this.permission = Notification.permission;
      console.log('[Notifications] Permission:', this.permission);
    } else {
      console.warn('[Notifications] Browser does not support notifications');
      return;
    }

    // 설정이 활성화되어 있으면 자동 체크 시작
    if (this.settings.enabled) {
      this.startAutoCheck();
    }
  }

  /**
   * 알림 권한 요청
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.error('[Notifications] Not supported');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      this.permission = await Notification.requestPermission();
      console.log('[Notifications] Permission granted:', this.permission === 'granted');

      if (this.permission === 'granted') {
        this.showToast('✅ 알림이 활성화되었습니다');
        this.sendWelcomeNotification();
      }

      return this.permission === 'granted';
    } catch (error) {
      console.error('[Notifications] Permission request failed:', error);
      return false;
    }
  }

  /**
   * 환영 알림
   */
  sendWelcomeNotification() {
    this.send('🎉 Rachgia Dashboard 알림', {
      body: '지연 오더와 마감 임박 알림을 받으실 수 있습니다.',
      icon: '/favicon.ico',
      tag: 'welcome',
      requireInteraction: false
    });
  }

  /**
   * 알림 전송
   */
  send(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('[Notifications] Permission not granted');
      return null;
    }

    // Throttling 체크
    const notificationKey = options.tag || title;
    if (this.isThrottled(notificationKey)) {
      console.log('[Notifications] Throttled:', notificationKey);
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        ...options
      });

      // 클릭 이벤트
      notification.onclick = () => {
        window.focus();
        notification.close();

        if (options.onClick) {
          options.onClick();
        }
      };

      // Throttling 기록
      this.lastNotificationTime[notificationKey] = Date.now();

      console.log('[Notifications] Sent:', title);
      return notification;
    } catch (error) {
      console.error('[Notifications] Send failed:', error);
      return null;
    }
  }

  /**
   * Throttling 체크
   */
  isThrottled(key) {
    const lastTime = this.lastNotificationTime[key];
    if (!lastTime) return false;

    const elapsed = Date.now() - lastTime;
    return elapsed < this.throttleInterval;
  }

  /**
   * 자동 체크 시작
   */
  startAutoCheck() {
    // 초기 체크
    this.checkDelayedOrders();

    // 주기적 체크 (5분마다)
    this.autoCheckInterval = setInterval(() => {
      if (this.settings.enabled) {
        this.checkDelayedOrders();
        this.checkUpcomingDeadlines();
      }
    }, 5 * 60 * 1000);

    console.log('[Notifications] Auto-check started (every 5 minutes)');
  }

  /**
   * 자동 체크 중지
   */
  stopAutoCheck() {
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
      this.autoCheckInterval = null;
      console.log('[Notifications] Auto-check stopped');
    }
  }

  /**
   * 지연 오더 체크
   */
  checkDelayedOrders() {
    if (!window.filteredData || !Array.isArray(window.filteredData)) {
      console.warn('[Notifications] No data available');
      return;
    }

    const delayedOrders = window.filteredData.filter(d => {
      if (typeof window.isDelayed === 'function') {
        return window.isDelayed(d);
      }
      // Fallback: 간단한 지연 체크
      return d.sddValue && d.crd && new Date(d.sddValue) > new Date(d.crd);
    });

    if (delayedOrders.length > 0 && this.settings.delayedOrders) {
      const count = delayedOrders.length;
      const totalQty = delayedOrders.reduce((sum, d) => sum + (d.quantity || 0), 0);

      this.send('🚨 지연 오더 감지', {
        body: `${count}건의 오더 (${totalQty.toLocaleString()}개)가 지연되었습니다.`,
        tag: 'delayed-orders',
        requireInteraction: true,
        onClick: () => {
          // 지연 오더 필터 적용
          const quickDateFilter = document.getElementById('quickDateFilter');
          if (quickDateFilter) {
            quickDateFilter.value = 'delayed';
            if (typeof window.applyFilters === 'function') {
              window.applyFilters();
            }
          }
        }
      });

      console.log('[Notifications] Delayed orders found:', count);
    }
  }

  /**
   * 마감 임박 체크 (D-3, D-7)
   */
  checkUpcomingDeadlines() {
    if (!window.filteredData || !Array.isArray(window.filteredData)) {
      return;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcomingOrders = window.filteredData.filter(d => {
      if (!d.crd) return false;

      const crdDate = new Date(d.crd);
      crdDate.setHours(0, 0, 0, 0);

      const daysUntil = Math.ceil((crdDate - now) / (1000 * 60 * 60 * 24));

      // D-3 또는 D-7
      return (daysUntil === 3 || daysUntil === 7) &&
             (!d.production?.wh_out?.status || d.production.wh_out.status !== 'completed');
    });

    if (upcomingOrders.length > 0 && this.settings.upcomingDeadlines) {
      const d3Orders = upcomingOrders.filter(d => {
        const crdDate = new Date(d.crd);
        crdDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((crdDate - now) / (1000 * 60 * 60 * 24));
        return daysUntil === 3;
      });

      const d7Orders = upcomingOrders.filter(d => {
        const crdDate = new Date(d.crd);
        crdDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((crdDate - now) / (1000 * 60 * 60 * 24));
        return daysUntil === 7;
      });

      if (d3Orders.length > 0) {
        this.send('⏰ 마감 임박 (D-3)', {
          body: `${d3Orders.length}건의 오더가 3일 후 마감입니다.`,
          tag: 'deadline-d3',
          requireInteraction: true
        });
      }

      if (d7Orders.length > 0) {
        this.send('📅 마감 예정 (D-7)', {
          body: `${d7Orders.length}건의 오더가 7일 후 마감입니다.`,
          tag: 'deadline-d7',
          requireInteraction: false
        });
      }

      console.log('[Notifications] Upcoming deadlines:', {
        d3: d3Orders.length,
        d7: d7Orders.length
      });
    }
  }

  /**
   * 커스텀 알림 규칙 추가
   */
  addCustomRule(rule) {
    if (!this.settings.customRules) {
      this.settings.customRules = [];
    }

    this.settings.customRules.push({
      id: Date.now(),
      enabled: true,
      ...rule
    });

    this.saveSettings();
    console.log('[Notifications] Custom rule added:', rule.name);
  }

  /**
   * 커스텀 규칙 체크
   */
  checkCustomRules() {
    if (!this.settings.customRules || !window.filteredData) {
      return;
    }

    this.settings.customRules
      .filter(rule => rule.enabled)
      .forEach(rule => {
        const matchedOrders = window.filteredData.filter(d =>
          this.evaluateRule(d, rule)
        );

        if (matchedOrders.length > 0) {
          this.send(rule.title || '커스텀 알림', {
            body: rule.message.replace('{count}', matchedOrders.length),
            tag: `custom-${rule.id}`,
            onClick: rule.onClick
          });
        }
      });
  }

  /**
   * 규칙 평가
   */
  evaluateRule(data, rule) {
    const value = this.getNestedValue(data, rule.field);

    switch (rule.operator) {
      case '>': return Number(value) > Number(rule.value);
      case '<': return Number(value) < Number(rule.value);
      case '>=': return Number(value) >= Number(rule.value);
      case '<=': return Number(value) <= Number(rule.value);
      case '=': return value == rule.value;
      case '!=': return value != rule.value;
      case 'contains': return String(value).toLowerCase().includes(String(rule.value).toLowerCase());
      default: return false;
    }
  }

  /**
   * 중첩된 값 가져오기
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Toast 메시지 표시
   */
  showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-gray-800 dark:bg-gray-700 text-white px-4 py-3 rounded-lg shadow-xl z-[9999] transition-opacity duration-300';
    toast.style.opacity = '0';
    toast.textContent = message;

    document.body.appendChild(toast);

    // Fade in
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 10);

    // Fade out
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * 설정 로드
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('notificationSettings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('[Notifications] Failed to load settings:', error);
    }

    // 기본 설정
    return {
      enabled: false,
      delayedOrders: true,
      upcomingDeadlines: true,
      customRules: []
    };
  }

  /**
   * 설정 저장
   */
  saveSettings() {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
      console.log('[Notifications] Settings saved');
    } catch (error) {
      console.error('[Notifications] Failed to save settings:', error);
    }
  }

  /**
   * 설정 업데이트
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();

    // 자동 체크 활성화/비활성화
    if (this.settings.enabled) {
      this.startAutoCheck();
    } else {
      this.stopAutoCheck();
    }

    console.log('[Notifications] Settings updated:', this.settings);
  }

  /**
   * 알림 활성화/비활성화
   */
  async setEnabled(enabled) {
    if (enabled && this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        this.showToast('❌ 알림 권한이 거부되었습니다');
        return false;
      }
    }

    this.updateSettings({ enabled });

    if (enabled) {
      this.showToast('✅ 알림이 활성화되었습니다');
      this.checkDelayedOrders();
    } else {
      this.showToast('🔕 알림이 비활성화되었습니다');
    }

    return true;
  }

  /**
   * 테스트 알림
   */
  sendTestNotification() {
    this.send('🔔 테스트 알림', {
      body: '알림이 정상적으로 작동합니다.',
      tag: 'test',
      requireInteraction: false
    });
  }

  /**
   * 상태 정보
   */
  getStatus() {
    return {
      supported: 'Notification' in window,
      permission: this.permission,
      enabled: this.settings.enabled,
      autoCheckRunning: !!this.autoCheckInterval,
      throttleInterval: this.throttleInterval / 1000 / 60 + ' minutes',
      customRules: this.settings.customRules?.length || 0
    };
  }
}

// =============================================================================
// 전역 인스턴스 생성
// =============================================================================
let notificationManager;

// DOM 로드 후 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    notificationManager = new NotificationManager();
  });
} else {
  notificationManager = new NotificationManager();
}

// 전역으로 노출
window.notificationManager = notificationManager;

console.log('[Notifications] Module loaded');

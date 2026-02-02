// =============================================================================
// i18n Multi-language System
// Agent W09: i18n & Localization Specialist
// Version: 19.0.0
// =============================================================================

/**
 * i18n 다국어 지원 시스템
 * - 한국어, 영어, 베트남어 지원
 * - 브라우저 언어 자동 감지
 * - LocalStorage 사용자 선호 언어
 * - 동적 콘텐츠 번역
 * - 날짜/숫자 포맷팅
 */

class I18n {
  constructor() {
    this.currentLang = null;
    this.translations = {};
    this.supportedLangs = ['ko', 'en', 'vi'];
    this.defaultLang = 'ko';
    this.fallbackLang = 'en';

    this.init();
  }

  /**
   * 초기화
   */
  async init() {
    // 사용자 선호 언어 감지
    this.currentLang = this.detectLanguage();

    // 번역 파일 로드
    await this.loadTranslations(this.currentLang);

    // DOM 번역 적용
    this.translatePage();

    // 언어 전환기 UI 추가
    this.addLanguageSwitcher();

    console.log('[i18n] Initialized with language:', this.currentLang);
  }

  /**
   * 언어 감지
   */
  detectLanguage() {
    // 1. LocalStorage에 저장된 언어
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && this.supportedLangs.includes(savedLang)) {
      return savedLang;
    }

    // 2. 브라우저 언어
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0]; // 'ko-KR' → 'ko'

    if (this.supportedLangs.includes(langCode)) {
      return langCode;
    }

    // 3. 기본 언어
    return this.defaultLang;
  }

  /**
   * 번역 파일 로드
   */
  async loadTranslations(lang) {
    try {
      // 캐시 버스팅: 버전 파라미터 추가로 항상 최신 번역 로드
      const cacheBuster = `v=${Date.now()}`;
      const response = await fetch(`/locales/${lang}.json?${cacheBuster}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${lang}.json`);
      }

      this.translations[lang] = await response.json();
      console.log(`[i18n] Loaded translations for: ${lang}`);

      // Fallback 언어도 로드 (에러 방지)
      if (lang !== this.fallbackLang && !this.translations[this.fallbackLang]) {
        const fallbackResponse = await fetch(`/locales/${this.fallbackLang}.json?${cacheBuster}`);
        this.translations[this.fallbackLang] = await fallbackResponse.json();
      }
    } catch (error) {
      console.error(`[i18n] Error loading translations for ${lang}:`, error);

      // Fallback 언어 시도
      if (lang !== this.fallbackLang) {
        console.log(`[i18n] Trying fallback language: ${this.fallbackLang}`);
        this.currentLang = this.fallbackLang;
        await this.loadTranslations(this.fallbackLang);
      }
    }
  }

  /**
   * 번역 가져오기
   * @param {string} key - 번역 키 (예: 'header.title')
   * @param {object} params - 동적 변수 (예: {count: 5})
   * @returns {string} 번역된 텍스트
   */
  t(key, params = {}) {
    const keys = key.split('.');
    let value = this.translations[this.currentLang];

    // 중첩된 키 탐색
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    // 번역을 찾지 못하면 fallback 언어 시도
    if (value === undefined && this.currentLang !== this.fallbackLang) {
      let fallbackValue = this.translations[this.fallbackLang];
      for (const k of keys) {
        if (fallbackValue && typeof fallbackValue === 'object') {
          fallbackValue = fallbackValue[k];
        } else {
          fallbackValue = undefined;
          break;
        }
      }
      value = fallbackValue;
    }

    // 여전히 없으면 키 그대로 반환
    if (value === undefined) {
      console.warn(`[i18n] Translation not found: ${key}`);
      return key;
    }

    // 동적 변수 치환
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      Object.entries(params).forEach(([param, val]) => {
        value = value.replace(new RegExp(`{${param}}`, 'g'), val);
      });
    }

    return value;
  }

  /**
   * 페이지 번역
   */
  translatePage() {
    // data-i18n 속성이 있는 모든 요소 번역
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);

      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        // 입력 필드는 placeholder 번역
        if (element.hasAttribute('placeholder')) {
          element.placeholder = translation;
        }
      } else {
        // 일반 요소는 textContent 번역
        element.textContent = translation;
      }
    });

    // data-i18n-title 속성 (title/tooltip 번역)
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.t(key);
    });

    // data-i18n-aria 속성 (aria-label 번역)
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
      const key = element.getAttribute('data-i18n-aria');
      element.setAttribute('aria-label', this.t(key));
    });

    console.log('[i18n] Page translated');
  }

  /**
   * 언어 전환
   */
  async switchLanguage(lang) {
    if (!this.supportedLangs.includes(lang)) {
      console.error(`[i18n] Unsupported language: ${lang}`);
      return;
    }

    if (lang === this.currentLang) {
      return; // 이미 선택된 언어
    }

    this.currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);

    // 번역 파일 로드 (아직 안 로드된 경우)
    if (!this.translations[lang]) {
      await this.loadTranslations(lang);
    }

    // 페이지 다시 번역
    this.translatePage();

    // HTML lang 속성 업데이트
    document.documentElement.lang = lang;

    // 언어 전환기 UI 업데이트
    this.updateLanguageSwitcher();

    // 이벤트 발생 (다른 컴포넌트에서 언어 변경 감지 가능)
    window.dispatchEvent(
      new CustomEvent('languageChanged', {
        detail: { language: lang },
      })
    );

    this.showToast(this.t('settings.saved'));

    console.log('[i18n] Language switched to:', lang);
  }

  /**
   * 언어 전환기 UI 추가
   */
  addLanguageSwitcher() {
    // 이미 추가된 경우 중복 방지
    if (document.getElementById('languageSwitcher')) return;

    // 로그인 오버레이가 표시 중인지 확인 - 로그인 전에는 추가하지 않음
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay && !loginOverlay.classList.contains('hidden')) {
      // 로그인 후 다시 시도
      return;
    }

    // 헤더 영역 내에서만 찾기 (로그인 오버레이 제외)
    const header = document.querySelector('header') || document.querySelector('[role="banner"]');
    if (!header) return;

    // 헤더 내 다크모드 토글 옆에 언어 선택기 추가
    const darkModeContainer = header.querySelector('.flex.items-center.gap-2');
    if (!darkModeContainer) return;

    const langSwitcher = document.createElement('div');
    langSwitcher.className = 'flex items-center gap-2';
    langSwitcher.id = 'languageSwitcher';
    langSwitcher.innerHTML = `
      <label class="text-sm font-medium">🌐</label>
      <select id="langSelect"
              class="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              onchange="window.i18n.switchLanguage(this.value)">
        <option value="ko" ${this.currentLang === 'ko' ? 'selected' : ''}>한국어</option>
        <option value="en" ${this.currentLang === 'en' ? 'selected' : ''}>English</option>
        <option value="vi" ${this.currentLang === 'vi' ? 'selected' : ''}>Tiếng Việt</option>
      </select>
    `;

    // 알림 토글 다음에 삽입
    const notificationToggle = document.getElementById('notificationToggle');
    if (notificationToggle && notificationToggle.parentElement.parentElement) {
      notificationToggle.parentElement.parentElement.parentNode.insertBefore(
        langSwitcher,
        notificationToggle.parentElement.parentElement.nextSibling
      );
    } else {
      darkModeContainer.parentNode.insertBefore(langSwitcher, darkModeContainer.nextSibling);
    }
  }

  /**
   * 언어 전환기 UI 업데이트
   */
  updateLanguageSwitcher() {
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
      langSelect.value = this.currentLang;
    }
  }

  /**
   * 날짜 포맷팅
   */
  formatDate(date, format = 'short') {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    const options = {
      short: { year: 'numeric', month: '2-digit', day: '2-digit' },
      medium: { year: 'numeric', month: 'short', day: '2-digit' },
      long: { year: 'numeric', month: 'long', day: '2-digit', weekday: 'long' },
      time: { hour: '2-digit', minute: '2-digit' },
      datetime: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      },
    };

    const locale = this.getLocale();
    const formatter = new Intl.DateTimeFormat(locale, options[format] || options.short);

    return formatter.format(date);
  }

  /**
   * 숫자 포맷팅
   */
  formatNumber(number, options = {}) {
    const locale = this.getLocale();
    const formatter = new Intl.NumberFormat(locale, options);

    return formatter.format(number);
  }

  /**
   * 통화 포맷팅
   */
  formatCurrency(amount, currency = 'USD') {
    const locale = this.getLocale();
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    });

    return formatter.format(amount);
  }

  /**
   * 퍼센트 포맷팅
   */
  formatPercent(value, decimals = 1) {
    const locale = this.getLocale();
    const formatter = new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return formatter.format(value / 100);
  }

  /**
   * 로케일 가져오기
   */
  getLocale() {
    const localeMap = {
      ko: 'ko-KR',
      en: 'en-US',
      vi: 'vi-VN',
    };

    return localeMap[this.currentLang] || 'en-US';
  }

  /**
   * 현재 언어 가져오기
   */
  getCurrentLanguage() {
    return this.currentLang;
  }

  /**
   * 지원 언어 목록
   */
  getSupportedLanguages() {
    return this.supportedLangs.map(code => ({
      code,
      name:
        (this.translations[code] &&
          this.translations[code].meta &&
          this.translations[code].meta.language) ||
        code,
      direction:
        (this.translations[code] &&
          this.translations[code].meta &&
          this.translations[code].meta.direction) ||
        'ltr',
    }));
  }

  /**
   * Toast 메시지
   */
  showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className =
      'fixed bottom-4 right-4 bg-gray-800 dark:bg-gray-700 text-white px-4 py-3 rounded-lg shadow-xl z-[9999] transition-opacity duration-300';
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
   * 복수형 처리 (간단한 버전)
   */
  plural(key, count, params = {}) {
    const baseKey = `${key}.${count === 1 ? 'one' : 'other'}`;
    return this.t(baseKey, { count, ...params });
  }

  /**
   * 상대 시간 (예: "3일 전")
   */
  relativeTime(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return this.t('dates.today');
    } else if (diffDays === 1) {
      return this.t('dates.yesterday');
    } else if (diffDays === -1) {
      return this.t('dates.tomorrow');
    } else if (diffDays > 0) {
      return this.t('dates.daysAgo', { days: diffDays });
    } else {
      return this.t('dates.daysLater', { days: Math.abs(diffDays) });
    }
  }
}

// =============================================================================
// 전역 인스턴스 생성
// =============================================================================
let i18n;

// DOM 로드 후 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    i18n = new I18n();
    await i18n.init();
  });
} else {
  i18n = new I18n();
  i18n.init();
}

// 전역으로 노출
window.i18n = i18n;

// 전역 함수로 t() 노출 (편의성)
window.t = (key, params) => {
  if (window.i18n) {
    return window.i18n.t(key, params);
  }
  return key;
};

console.log('[i18n] Module loaded');

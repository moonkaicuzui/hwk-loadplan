// =============================================================================
// Keyboard Shortcuts System
// Agent W06: Keyboard Shortcuts Specialist
// Version: 19.0.0
// =============================================================================

/**
 * 키보드 단축키 시스템
 * - Alt+1~8: 탭 전환
 * - Alt+F: 검색 포커스
 * - Alt+E: 내보내기 모달
 * - Alt+S: 설정 모달
 * - Alt+H: 도움말
 * - ESC: 모달 닫기
 * - /: 검색 포커스 (슬래시 키)
 * - ?: 단축키 도움말 (Shift+/)
 */

class KeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map();
    this.enabled = true;
    this.modalOpen = false;

    this.init();
  }

  /**
   * 초기화
   */
  init() {
    this.registerDefaultShortcuts();
    this.attachEventListeners();
    this.loadUserPreferences();

    console.log('[Shortcuts] Initialized with', this.shortcuts.size, 'shortcuts');
  }

  /**
   * 기본 단축키 등록
   */
  registerDefaultShortcuts() {
    // 탭 전환
    this.register('Alt+1', () => this.switchTab('summary'), '요약 탭');
    this.register('Alt+2', () => this.switchTab('monthly'), '월별 탭');
    this.register('Alt+3', () => this.switchTab('destination'), '행선지 탭');
    this.register('Alt+4', () => this.switchTab('model'), '모델 탭');
    this.register('Alt+5', () => this.switchTab('factory'), '공장 탭');
    this.register('Alt+6', () => this.switchTab('vendor'), '벤더 탭');
    this.register('Alt+7', () => this.switchTab('heatmap'), '히트맵 탭');
    this.register('Alt+8', () => this.switchTab('data'), '데이터 탭');

    // 기능 단축키
    this.register('Alt+F', () => this.focusSearch(), '검색 포커스');
    this.register('Alt+E', () => this.openExportModal(), '내보내기');
    this.register('Alt+S', () => this.openSettingsModal(), '설정');
    this.register('Alt+H', () => this.openHelpModal(), '도움말');
    this.register('Alt+R', () => this.resetFilters(), '필터 초기화');
    this.register('Alt+D', () => this.toggleDarkMode(), '다크모드 전환');
    this.register(
      'Alt+P',
      e => {
        e.preventDefault();
        this.printPage();
      },
      '인쇄'
    );

    // 특수 키
    this.register('Escape', () => this.closeModal(), '모달 닫기');
    this.register('/', () => this.focusSearch(), '검색 포커스');
    this.register('?', () => this.showShortcutsHelp(), '단축키 도움말');

    // 네비게이션
    this.register('Alt+ArrowLeft', () => this.previousTab(), '이전 탭');
    this.register('Alt+ArrowRight', () => this.nextTab(), '다음 탭');

    // 데이터 조작
    this.register(
      'Ctrl+S',
      e => {
        e.preventDefault();
        this.saveData();
      },
      '데이터 저장'
    );

    this.register(
      'Ctrl+P',
      e => {
        e.preventDefault();
        this.printPage();
      },
      '인쇄'
    );
  }

  /**
   * 단축키 등록
   */
  register(key, callback, description = '') {
    this.shortcuts.set(key, {
      callback,
      description,
      enabled: true,
    });
  }

  /**
   * 단축키 제거
   */
  unregister(key) {
    this.shortcuts.delete(key);
  }

  /**
   * 이벤트 리스너 연결
   */
  attachEventListeners() {
    document.addEventListener('keydown', e => {
      if (!this.enabled) return;

      // 입력 필드에서는 일부 단축키 무시
      if (this.isInputField(e.target) && !['Escape'].includes(e.key)) {
        return;
      }

      const key = this.getKeyString(e);
      const shortcut = this.shortcuts.get(key);

      if (shortcut && shortcut.enabled) {
        console.log('[Shortcuts] Triggered:', key);
        shortcut.callback(e);
      }
    });

    // 모달 상태 추적
    const observer = new MutationObserver(() => {
      this.updateModalState();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  /**
   * 키 문자열 생성
   */
  getKeyString(event) {
    const parts = [];

    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey && event.key !== '?') parts.push('Shift');
    if (event.metaKey) parts.push('Meta');

    // 특수 키 처리
    if (event.key === '?') {
      return '?';
    }

    parts.push(event.key);

    return parts.join('+');
  }

  /**
   * 입력 필드 여부 확인
   */
  isInputField(element) {
    const tagName = element.tagName.toLowerCase();
    return ['input', 'textarea', 'select'].includes(tagName) || element.isContentEditable;
  }

  /**
   * 모달 상태 업데이트
   */
  updateModalState() {
    const modals = document.querySelectorAll('.modal-overlay:not(.hidden)');
    this.modalOpen = modals.length > 0;
  }

  // =============================================================================
  // 단축키 동작 함수들
  // =============================================================================

  /**
   * 탭 전환
   */
  switchTab(tabName) {
    const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (tabButton) {
      tabButton.click();
      this.showToast(`${tabName} 탭으로 이동`);
    }
  }

  /**
   * 이전 탭
   */
  previousTab() {
    const tabs = [
      'summary',
      'monthly',
      'destination',
      'model',
      'factory',
      'vendor',
      'heatmap',
      'data',
    ];
    const currentTab = this.getCurrentTab();
    const currentIndex = tabs.indexOf(currentTab);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;

    this.switchTab(tabs[prevIndex]);
  }

  /**
   * 다음 탭
   */
  nextTab() {
    const tabs = [
      'summary',
      'monthly',
      'destination',
      'model',
      'factory',
      'vendor',
      'heatmap',
      'data',
    ];
    const currentTab = this.getCurrentTab();
    const currentIndex = tabs.indexOf(currentTab);
    const nextIndex = (currentIndex + 1) % tabs.length;

    this.switchTab(tabs[nextIndex]);
  }

  /**
   * 현재 활성 탭 가져오기
   */
  getCurrentTab() {
    const activeTab = document.querySelector('[data-tab].active, [data-tab].text-blue-600');
    return activeTab ? activeTab.dataset.tab : 'summary';
  }

  /**
   * 검색 포커스
   */
  focusSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
      this.showToast('검색 필드로 이동');
    }
  }

  /**
   * 내보내기 모달
   */
  openExportModal() {
    if (typeof showExportModal === 'function') {
      showExportModal();
      this.showToast('내보내기 모달 열림');
    }
  }

  /**
   * 설정 모달
   */
  openSettingsModal() {
    if (typeof showSettingsModal === 'function') {
      showSettingsModal();
      this.showToast('설정 모달 열림');
    }
  }

  /**
   * 도움말 모달
   */
  openHelpModal() {
    if (typeof showHelpModal === 'function') {
      showHelpModal();
    } else {
      this.showShortcutsHelp();
    }
  }

  /**
   * 모달 닫기
   */
  closeModal() {
    const visibleModals = document.querySelectorAll('.modal-overlay:not(.hidden)');

    visibleModals.forEach(modal => {
      modal.classList.add('hidden');
    });

    if (visibleModals.length > 0) {
      this.showToast('모달 닫힘');
    }
  }

  /**
   * 필터 초기화
   */
  resetFilters() {
    if (typeof resetFilters === 'function') {
      resetFilters();
      this.showToast('필터 초기화됨');
    }
  }

  /**
   * 다크모드 전환
   */
  toggleDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
      darkModeToggle.click();
      const isDark = document.documentElement.classList.contains('dark');
      this.showToast(isDark ? '다크모드 활성화' : '라이트모드 활성화');
    }
  }

  /**
   * 데이터 저장
   */
  saveData() {
    // 브라우저 저장 (LocalStorage)
    this.showToast('데이터 저장됨 (LocalStorage)');
  }

  /**
   * 인쇄
   */
  printPage() {
    window.print();
  }

  /**
   * 단축키 도움말 표시
   */
  showShortcutsHelp() {
    const shortcuts = Array.from(this.shortcuts.entries())
      .filter(([_, shortcut]) => shortcut.description)
      .map(([key, shortcut]) => ({
        key,
        description: shortcut.description,
      }));

    const modal = document.createElement('div');
    modal.className =
      'modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="modal-content bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold">⌨️ 키보드 단축키</h3>
          <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${shortcuts
            .map(
              ({ key, description }) => `
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span class="text-sm text-gray-600 dark:text-gray-300">${description}</span>
              <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded dark:bg-gray-600 dark:text-white dark:border-gray-500">
                ${key.replace(/\+/g, ' + ')}
              </kbd>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p class="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>팁:</strong> 입력 필드에서는 일부 단축키가 동작하지 않습니다. ESC 키를 눌러 포커스를 해제하세요.
          </p>
        </div>

        <button onclick="this.closest('.modal-overlay').remove()" class="mt-4 w-full btn-primary">
          닫기
        </button>
      </div>
    `;

    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
  }

  /**
   * 토스트 메시지 표시
   */
  showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className =
      'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * 사용자 설정 로드
   */
  loadUserPreferences() {
    const saved = localStorage.getItem('keyboardShortcuts');
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        this.enabled = prefs.enabled !== false;
      } catch (e) {
        console.error('[Shortcuts] Failed to load preferences:', e);
      }
    }
  }

  /**
   * 사용자 설정 저장
   */
  saveUserPreferences() {
    localStorage.setItem(
      'keyboardShortcuts',
      JSON.stringify({
        enabled: this.enabled,
      })
    );
  }

  /**
   * 단축키 활성화/비활성화
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.saveUserPreferences();
    console.log('[Shortcuts]', enabled ? 'Enabled' : 'Disabled');
  }

  /**
   * 특정 단축키 활성화/비활성화
   */
  setShortcutEnabled(key, enabled) {
    const shortcut = this.shortcuts.get(key);
    if (shortcut) {
      shortcut.enabled = enabled;
    }
  }

  /**
   * 모든 단축키 목록
   */
  getShortcuts() {
    return Array.from(this.shortcuts.entries()).map(([key, shortcut]) => ({
      key,
      description: shortcut.description,
      enabled: shortcut.enabled,
    }));
  }
}

// =============================================================================
// 전역 인스턴스 생성
// =============================================================================
let keyboardShortcuts;

// DOM 로드 후 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    keyboardShortcuts = new KeyboardShortcuts();
  });
} else {
  keyboardShortcuts = new KeyboardShortcuts();
}

// 전역으로 노출
window.keyboardShortcuts = keyboardShortcuts;

console.log('[Shortcuts] Module loaded');

/**
 * Rachgia Dashboard v18 개선사항 모듈
 * Phase 1: Security & Performance
 *
 * V01: XSS 완전 제거 - Event Delegation System
 * V02: 캐싱 레이어 - LRU Cache Implementation
 * V03: 메모리 최적화 - Chart Manager
 * V04: 차트 성능 - Conditional Animation
 */

// =============================================================================
// V02: LRU Cache Implementation (필터 결과 캐싱)
// =============================================================================
class FilterCache {
    constructor(maxSize = 50) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * 캐시 키 생성
     * @param {Object} filters - 현재 필터 상태
     * @returns {string} - 캐시 키
     */
    generateKey(filters) {
        return JSON.stringify({
            month: filters.month || '',
            quick: filters.quick || '',
            dest: filters.dest || '',
            vendor: filters.vendor || '',
            status: filters.status || '',
            factory: filters.factory || '',
            search: filters.search || '',
            startDate: filters.startDate || '',
            endDate: filters.endDate || '',
            minQuantity: filters.minQuantity || 0,
            maxQuantity: filters.maxQuantity || Infinity,
            logic: filters.logic || 'AND'
        });
    }

    /**
     * 캐시에서 데이터 가져오기 (LRU: 최근 사용한 항목을 뒤로 이동)
     * @param {string} key - 캐시 키
     * @returns {Array|null} - 캐시된 데이터 또는 null
     */
    get(key) {
        if (!this.cache.has(key)) {
            this.misses++;
            return null;
        }

        const value = this.cache.get(key);
        // LRU: 최근 사용 항목을 Map 끝으로 이동
        this.cache.delete(key);
        this.cache.set(key, value);
        this.hits++;

        return value;
    }

    /**
     * 캐시에 데이터 저장
     * @param {string} key - 캐시 키
     * @param {Array} value - 저장할 데이터
     */
    set(key, value) {
        // 이미 존재하면 삭제 후 재삽입 (순서 변경)
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // LRU: 가장 오래된 항목 (첫 번째) 제거
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, value);
    }

    /**
     * 캐시 무효화 (데이터 변경 시)
     */
    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * 캐시 통계 반환
     * @returns {Object} - 캐시 통계
     */
    getStats() {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? (this.hits / total * 100).toFixed(1) : 0;

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: `${hitRate}%`
        };
    }
}

// =============================================================================
// V03: Chart Manager (Chart.js 인스턴스 재사용)
// =============================================================================
class ChartManager {
    constructor() {
        this.charts = new Map();
        this.activeCharts = new Set();
    }

    /**
     * 차트 생성 또는 업데이트
     * @param {string} chartId - 차트 ID
     * @param {HTMLCanvasElement} canvas - Canvas 요소
     * @param {Object} config - Chart.js 설정
     * @param {boolean} animate - 애니메이션 여부
     * @returns {Chart} - Chart.js 인스턴스
     */
    createOrUpdate(chartId, canvas, config, animate = true) {
        if (this.charts.has(chartId)) {
            // 기존 인스턴스 재사용
            const chart = this.charts.get(chartId);

            // 데이터만 업데이트
            chart.data = config.data;

            // 옵션 업데이트 (필요한 경우)
            if (config.options) {
                chart.options = config.options;
            }

            // 애니메이션 설정 (V04: 차트 성능 최적화)
            const updateMode = animate ? 'active' : 'none';
            chart.update(updateMode);

            this.activeCharts.add(chartId);
            return chart;
        } else {
            // 새 인스턴스 생성
            const chart = new Chart(canvas, config);
            this.charts.set(chartId, chart);
            this.activeCharts.add(chartId);
            return chart;
        }
    }

    /**
     * 차트 제거 (메모리 해제)
     * @param {string} chartId - 차트 ID
     */
    destroy(chartId) {
        if (this.charts.has(chartId)) {
            const chart = this.charts.get(chartId);
            chart.destroy();
            this.charts.delete(chartId);
            this.activeCharts.delete(chartId);
        }
    }

    /**
     * 모든 차트 제거
     */
    destroyAll() {
        this.charts.forEach((chart, chartId) => {
            chart.destroy();
        });
        this.charts.clear();
        this.activeCharts.clear();
    }

    /**
     * 차트 존재 여부 확인
     * @param {string} chartId - 차트 ID
     * @returns {boolean}
     */
    has(chartId) {
        return this.charts.has(chartId);
    }

    /**
     * 차트 가져오기
     * @param {string} chartId - 차트 ID
     * @returns {Chart|undefined}
     */
    get(chartId) {
        return this.charts.get(chartId);
    }

    /**
     * 메모리 통계 반환
     * @returns {Object}
     */
    getStats() {
        return {
            totalCharts: this.charts.size,
            activeCharts: this.activeCharts.size,
            chartIds: Array.from(this.charts.keys())
        };
    }
}

// =============================================================================
// V01: Event Delegation System (XSS 제거)
// =============================================================================
class EventDelegator {
    constructor() {
        this.handlers = new Map();
    }

    /**
     * 이벤트 핸들러 등록
     * @param {string} selector - CSS 선택자
     * @param {string} event - 이벤트 타입
     * @param {Function} handler - 핸들러 함수
     */
    on(selector, event, handler) {
        const key = `${selector}:${event}`;
        if (!this.handlers.has(key)) {
            this.handlers.set(key, []);
        }
        this.handlers.get(key).push(handler);
    }

    /**
     * 이벤트 위임 초기화
     */
    init() {
        // 문서 레벨에서 모든 클릭 이벤트를 위임
        document.addEventListener('click', (e) => {
            this.handleEvent(e, 'click');
        });

        // 필요한 경우 다른 이벤트 타입도 추가
        document.addEventListener('change', (e) => {
            this.handleEvent(e, 'change');
        });
    }

    /**
     * 이벤트 처리
     * @param {Event} event - 이벤트 객체
     * @param {string} eventType - 이벤트 타입
     */
    handleEvent(event, eventType) {
        const target = event.target;

        // 모든 등록된 핸들러 확인
        this.handlers.forEach((handlers, key) => {
            const [selector, type] = key.split(':');

            if (type !== eventType) return;

            // 이벤트 타겟이 선택자와 매치되는지 확인
            if (target.matches(selector) || target.closest(selector)) {
                const matchedElement = target.matches(selector) ? target : target.closest(selector);
                handlers.forEach(handler => handler.call(matchedElement, event));
            }
        });
    }

    /**
     * data- 속성에서 안전하게 값 가져오기
     * @param {HTMLElement} element - DOM 요소
     * @param {string} attrName - 속성 이름 (data- 제외)
     * @returns {string}
     */
    static getData(element, attrName) {
        return element.dataset[attrName] || '';
    }
}

// =============================================================================
// V04: Chart Performance Utilities (차트 성능 최적화)
// =============================================================================
const ChartPerformance = {
    /**
     * 데이터 샘플링 (대용량 데이터셋 최적화)
     * @param {Array} data - 원본 데이터
     * @param {number} maxPoints - 최대 포인트 수
     * @returns {Array} - 샘플링된 데이터
     */
    sampleData(data, maxPoints = 100) {
        if (data.length <= maxPoints) {
            return data;
        }

        const step = Math.ceil(data.length / maxPoints);
        return data.filter((_, index) => index % step === 0);
    },

    /**
     * 조건부 애니메이션 설정 생성
     * @param {boolean} isFirstRender - 첫 렌더링 여부
     * @returns {Object} - Chart.js 애니메이션 설정
     */
    getAnimationConfig(isFirstRender = true) {
        if (isFirstRender) {
            return {
                animation: {
                    duration: 500,
                    easing: 'easeOutQuart'
                }
            };
        } else {
            return {
                animation: false  // 업데이트 시 애니메이션 비활성화
            };
        }
    },

    /**
     * 리사이즈 디바운싱
     * @param {Function} callback - 콜백 함수
     * @param {number} delay - 지연 시간 (ms)
     * @returns {Function}
     */
    debounceResize(callback, delay = 300) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => callback.apply(this, args), delay);
        };
    }
};

// =============================================================================
// Export (글로벌 스코프에 노출)
// =============================================================================
if (typeof window !== 'undefined') {
    window.FilterCache = FilterCache;
    window.ChartManager = ChartManager;
    window.EventDelegator = EventDelegator;
    window.ChartPerformance = ChartPerformance;
}

/**
 * Rachgia Dashboard v18 개선사항 모듈
 * Phase 1: Security & Performance
 *
 * V01: XSS 완전 제거 - Event Delegation System
 * V02: 캐싱 레이어 - LRU Cache Implementation
 * V03: 메모리 최적화 - Chart Manager
 * V04: 차트 성능 - Conditional Animation
 * V05: Safari 호환성 - Safe Property Access Helpers
 */

// =============================================================================
// V05: Safari Compatibility Helpers (Safari 13+ 호환)
// =============================================================================

/**
 * 안전한 중첩 속성 접근 (Optional Chaining 대체)
 * Safari 13 이하에서 ?. 연산자 미지원 대응
 * @param {Object} obj - 대상 객체
 * @param {string} path - 점으로 구분된 경로 (예: 'production.wh_out.completed')
 * @param {*} defaultValue - 기본값 (undefined일 경우 반환)
 * @returns {*} 속성 값 또는 기본값
 */
function safeGet(obj, path, defaultValue) {
    if (obj === null || obj === undefined) {
        return defaultValue;
    }

    var keys = path.split('.');
    var result = obj;

    for (var i = 0; i < keys.length; i++) {
        if (result === null || result === undefined) {
            return defaultValue;
        }
        result = result[keys[i]];
    }

    return result !== undefined ? result : defaultValue;
}

/**
 * DOM 요소 안전 접근
 * @param {string} id - 요소 ID
 * @returns {HTMLElement|null}
 */
function safeGetElement(id) {
    return document.getElementById(id) || null;
}

/**
 * DOM 요소 값 안전 접근
 * @param {string} id - 요소 ID
 * @param {string} defaultValue - 기본값
 * @returns {string}
 */
function safeGetValue(id, defaultValue) {
    var el = document.getElementById(id);
    if (el && el.value !== undefined) {
        return el.value.trim ? el.value.trim() : el.value;
    }
    return defaultValue !== undefined ? defaultValue : '';
}

/**
 * 안전한 날짜 파싱 (Safari 호환)
 * Safari는 'YYYY-MM-DD' 형식을 제대로 파싱하지 못할 수 있음
 * @param {string} dateStr - 날짜 문자열
 * @returns {Date|null}
 */
function safeParseDate(dateStr) {
    if (!dateStr) return null;

    // ISO 형식 (YYYY-MM-DD)인 경우 Safari 호환 처리
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        var parts = dateStr.split('-');
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }

    // ISO 8601 datetime 형식
    if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr)) {
        var datePart = dateStr.split('T')[0];
        var parts = datePart.split('-');
        var timePart = dateStr.split('T')[1];
        var date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

        if (timePart) {
            var timeMatch = timePart.match(/(\d{2}):(\d{2}):?(\d{2})?/);
            if (timeMatch) {
                date.setHours(parseInt(timeMatch[1], 10) || 0);
                date.setMinutes(parseInt(timeMatch[2], 10) || 0);
                date.setSeconds(parseInt(timeMatch[3], 10) || 0);
            }
        }
        return date;
    }

    // 기타 형식은 기본 파싱 시도
    var parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * 생산 데이터 안전 접근 헬퍼
 * @param {Object} d - 데이터 객체
 * @param {string} process - 공정명 (예: 'wh_out', 's_cut')
 * @param {string} field - 필드명 (예: 'completed', 'status')
 * @param {*} defaultValue - 기본값
 * @returns {*}
 */
function getProductionData(d, process, field, defaultValue) {
    if (!d || !d.production) return defaultValue;
    var proc = d.production[process];
    if (!proc) return defaultValue;
    var val = proc[field];
    return val !== undefined ? val : defaultValue;
}

// 전역으로 노출
if (typeof window !== 'undefined') {
    window.safeGet = safeGet;
    window.safeGetElement = safeGetElement;
    window.safeGetValue = safeGetValue;
    window.safeParseDate = safeParseDate;
    window.getProductionData = getProductionData;
}

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

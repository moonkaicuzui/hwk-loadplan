# Rachgia Dashboard v18 전문 에이전트 제안서
## v17→v18 개선을 위한 10명 전문가 팀

**제안 일자**: 2026-01-03
**대상 버전**: v17 → v18
**목적**: v17의 MEDIUM/LOW 우선순위 개선사항 완료 및 100% 완성도 달성

---

## 📊 v17 현황 분석

### 현재 상태
- **버전**: v17 (rachgia_dashboard_v17.html, 556 KB)
- **프로덕션 준비**: ✅ 완료 (10/10 에이전트 PASS)
- **성능 개선**: 91% (v14 대비)
- **보안 수준**: 95% (escapeHtml 적용률)
- **데이터 품질**: 92.5% (허용 범위)

### v18 개선 목표

| 영역 | 현재 (v17) | 목표 (v18) | 우선순위 |
|------|-----------|-----------|----------|
| **보안** | 95% | 100% | HIGH |
| **성능 (캐싱)** | 80ms 필터 응답 | 50-60ms | MEDIUM |
| **성능 (메모리)** | 20MB | 15MB | MEDIUM |
| **테스트 자동화** | 수동 | Playwright E2E | MEDIUM |
| **코드 품질** | 복잡도 평균 15 | 복잡도 평균 10 | LOW |
| **문서화** | 95% | 100% + 사용자 매뉴얼 | LOW |

---

## 🤖 제안: v18 전문 에이전트 10명

### 팀 구조

```
┌─────────────────────────────────────────────────────────┐
│           🎯 V18 SPECIALIZED AGENTS                     │
│          (v17→v18 개선 전문 10명)                         │
└─────────────────────────────────────────────────────────┘
        │
        ├──────┬──────┬──────┬──────┬──────┐
        ▼      ▼      ▼      ▼      ▼      ▼
     ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐
     │ V01││ V02││ V03││ V04││ V05││...│
     └────┘└────┘└────┘└────┘└────┘└────┘
     보안  캐싱  메모리 차트  자동화  ...
```

---

## 🔐 Agent #V01: XSS Elimination Specialist (XSS 제거 전문가)

### 역할
- escapeHtml() 100% 적용 달성 (현재 95% → 100%)
- XSS 잠재 취약점 완전 제거
- 보안 코드 리뷰 자동화

### 전문 분야
- **XSS 패턴 탐지**: onclick, innerHTML, insertAdjacentHTML 전수 조사
- **escapeHtml() 적용**: 24개 위치 중 누락된 5% 찾아 적용
- **보안 테스트**: XSS 공격 시나리오 100개 테스트
- **CSP 강화**: Content-Security-Policy 더 엄격하게 설정

### 작업 범위
1. **Phase 1 (분석)**:
   - v17 전체 코드 스캔 (Grep으로 innerHTML, onclick, insertAdjacentHTML 검색)
   - 누락된 escapeHtml() 위치 식별 (예상 10-15개소)

2. **Phase 2 (적용)**:
   - 각 위치에 escapeHtml() 적용
   - 함수형 이벤트 핸들러로 전환 (onclick → addEventListener)

3. **Phase 3 (검증)**:
   - 100개 XSS 시나리오 테스트
   - 보안 감사 도구 실행 (OWASP ZAP, Burp Suite)

### 성공 기준
- ✅ escapeHtml() 적용률: 100% (24/24)
- ✅ XSS 취약점: 0건
- ✅ CSP 위반: 0건
- ✅ 보안 감사: PASS

### 예상 소요 시간
- **분석**: 2시간
- **적용**: 4시간
- **검증**: 2시간
- **총**: 8시간

---

## ⚡ Agent #V02: Caching Layer Architect (캐싱 레이어 설계자)

### 역할
- 필터 결과 메모이제이션 구현
- 10-20% 추가 성능 개선
- 스마트 캐싱 전략 설계

### 전문 분야
- **Memoization**: 필터 조합별 결과 캐싱
- **LRU Cache**: 최근 사용 기록 기반 캐시 관리
- **Cache Invalidation**: 데이터 변경 시 캐시 무효화
- **성능 벤치마크**: 캐싱 전후 성능 측정

### 기술 스택
```javascript
// LRU Cache 구현 (최대 50개 조합 저장)
class FilterCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    // LRU: 최근 사용한 것을 뒤로 이동
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 가장 오래된 항목 제거
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

// 사용 예시
const filterCache = new FilterCache();

function applyFilters() {
  const cacheKey = JSON.stringify({
    month: currentFilters.month,
    destination: currentFilters.destination,
    vendor: currentFilters.vendor,
    // ... 모든 필터
  });

  // 캐시 확인
  const cached = filterCache.get(cacheKey);
  if (cached) {
    console.log('✅ 캐시 히트!');
    return cached;
  }

  // 캐시 미스 → 필터링 수행
  const filtered = EMBEDDED_DATA.filter(d => {
    // ... 필터 로직
  });

  // 결과 캐싱
  filterCache.set(cacheKey, filtered);
  return filtered;
}
```

### 성능 목표
- **필터 응답**: 80ms → 50-60ms (25-38% 개선)
- **캐시 히트율**: ≥ 60% (재필터링 시)
- **메모리 증가**: < 5MB (허용 가능)

### 성공 기준
- ✅ 캐시 구현 완료
- ✅ 성능 개선: 20-30% (필터 재적용 시)
- ✅ 메모리 누수 없음

### 예상 소요 시간: 6시간

---

## 🧠 Agent #V03: Memory Optimizer (메모리 최적화 전문가)

### 역할
- Chart.js 인스턴스 재사용 구현
- 메모리 사용량 20MB → 15MB (25% 감소)
- 메모리 누수 방지

### 전문 분야
- **Chart.js 인스턴스 관리**: 매번 생성 → 재사용
- **DOM 최적화**: 불필요한 노드 제거
- **이벤트 리스너 정리**: removeEventListener 적용
- **가비지 컬렉션**: 메모리 해제 최적화

### 현재 문제점 (v17)
```javascript
// ❌ 문제: 차트를 업데이트할 때마다 새 인스턴스 생성
function updateMonthChart(data) {
  const ctx = document.getElementById('monthChart').getContext('2d');
  new Chart(ctx, {  // 매번 새로 생성 → 메모리 누적
    type: 'bar',
    data: data,
    options: {...}
  });
}
// 결과: 10번 탭 전환 시 10개 인스턴스 생성 → 메모리 낭비
```

### 개선 방안 (v18)
```javascript
// ✅ 해결: 인스턴스 재사용
const chartInstances = {};

function updateMonthChart(data) {
  const ctx = document.getElementById('monthChart').getContext('2d');
  const chartId = 'monthChart';

  if (chartInstances[chartId]) {
    // 기존 인스턴스 재사용
    chartInstances[chartId].data = data;
    chartInstances[chartId].update('none'); // 애니메이션 없이 업데이트
  } else {
    // 첫 생성 시에만 새 인스턴스
    chartInstances[chartId] = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {...}
    });
  }
}

// 탭 전환 시 차트 정리
function destroyChart(chartId) {
  if (chartInstances[chartId]) {
    chartInstances[chartId].destroy();
    delete chartInstances[chartId];
  }
}
```

### 성공 기준
- ✅ 메모리 사용: 20MB → 15MB (25% ↓)
- ✅ Chart.js 인스턴스: 최대 7개 (탭별 1개)
- ✅ 메모리 누수: 0건
- ✅ GC 압박: 50% 감소

### 예상 소요 시간: 5시간

---

## 📊 Agent #V04: Chart Performance Engineer (차트 성능 엔지니어)

### 역할
- 차트 렌더링 성능 최적화
- 애니메이션 성능 개선
- 대용량 데이터 차트 처리

### 전문 분야
- **Chart.js 설정 최적화**: 불필요한 애니메이션 제거
- **데이터 샘플링**: 1,000+ 데이터 포인트 시 샘플링
- **반응형 차트**: 리사이즈 성능 개선
- **다크모드 차트**: 색상 전환 최적화

### 최적화 전략

#### 1. 애니메이션 최적화
```javascript
// v17: 모든 차트에 애니메이션 적용 (느림)
const chartOptions = {
  animation: {
    duration: 500  // 모든 업데이트 시 500ms 애니메이션
  }
};

// v18: 조건부 애니메이션
const chartOptions = {
  animation: {
    duration: isInitialRender ? 500 : 0,  // 첫 렌더링만 애니메이션
    onComplete: () => { isInitialRender = false; }
  }
};
```

#### 2. 데이터 샘플링
```javascript
// 대용량 데이터 시 샘플링 (성능 향상)
function sampleData(data, maxPoints = 100) {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0);
}

// 히트맵 데이터 샘플링
const heatmapData = sampleData(rawData, 50);
```

#### 3. 차트 반응형 최적화
```javascript
// Debounce로 리사이즈 이벤트 최적화
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    Object.values(chartInstances).forEach(chart => chart.resize());
  }, 300);
});
```

### 성공 기준
- ✅ 차트 렌더링: 300ms → 200ms (33% ↓)
- ✅ 애니메이션 스킵: 업데이트 시 0ms
- ✅ 리사이즈 지연: < 100ms
- ✅ 대용량 데이터: 1,000+ 포인트도 부드럽게

### 예상 소요 시간: 4시간

---

## 🧪 Agent #V05: E2E Test Automation Engineer (E2E 테스트 자동화 엔지니어)

### 역할
- Playwright E2E 테스트 자동화 구축
- 회귀 테스트 방지
- CI/CD 파이프라인 통합

### 전문 분야
- **Playwright 테스트**: 크로스 브라우저 자동화
- **시나리오 작성**: 28개 핵심 기능 테스트
- **성능 테스트**: Lighthouse CI 통합
- **비주얼 테스트**: 스크린샷 비교

### 테스트 스위트 구조

```javascript
// tests/e2e/filters.spec.js
import { test, expect } from '@playwright/test';

test.describe('필터 시스템', () => {
  test('월 필터 정상 작동', async ({ page }) => {
    await page.goto('http://localhost:8000/rachgia_dashboard_v17.html');

    // 초기 데이터 로드 확인
    await expect(page.locator('#dataTable tbody tr')).toHaveCount(200, { timeout: 5000 });

    // 2026-01 월 선택
    await page.selectOption('#monthFilter', '2026-01');

    // 필터 적용 대기
    await page.waitForTimeout(500);

    // 필터링된 데이터 확인
    const rows = await page.locator('#dataTable tbody tr').count();
    expect(rows).toBeLessThan(200);
    expect(rows).toBeGreaterThan(0);

    // 월 표시 확인
    const firstRowMonth = await page.locator('#dataTable tbody tr:first-child td').nth(5).textContent();
    expect(firstRowMonth).toContain('2026-01');
  });

  test('행선지 필터 정상 작동', async ({ page }) => {
    await page.goto('http://localhost:8000/rachgia_dashboard_v17.html');
    await page.selectOption('#destFilter', 'Netherlands');
    await page.waitForTimeout(500);

    const rows = await page.locator('#dataTable tbody tr');
    const count = await rows.count();

    // 모든 행이 Netherlands인지 확인
    for (let i = 0; i < Math.min(count, 10); i++) {
      const dest = await rows.nth(i).locator('td').nth(6).textContent();
      expect(dest).toContain('Netherlands');
    }
  });

  test('복합 필터 (월 + 행선지)', async ({ page }) => {
    await page.goto('http://localhost:8000/rachgia_dashboard_v17.html');

    await page.selectOption('#monthFilter', '2026-01');
    await page.selectOption('#destFilter', 'Netherlands');
    await page.waitForTimeout(500);

    const rows = await page.locator('#dataTable tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // 첫 행 검증
    const firstRow = rows.first();
    const month = await firstRow.locator('td').nth(5).textContent();
    const dest = await firstRow.locator('td').nth(6).textContent();
    expect(month).toContain('2026-01');
    expect(dest).toContain('Netherlands');
  });
});

// tests/e2e/performance.spec.js
test.describe('성능 테스트', () => {
  test('초기 로딩 시간 < 3초', async ({ page }) => {
    const start = Date.now();
    await page.goto('http://localhost:8000/rachgia_dashboard_v17.html');
    await page.waitForSelector('#dataTable tbody tr', { timeout: 5000 });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(3000);
  });

  test('필터 응답 시간 < 100ms', async ({ page }) => {
    await page.goto('http://localhost:8000/rachgia_dashboard_v17.html');

    const start = Date.now();
    await page.selectOption('#monthFilter', '2026-02');
    await page.waitForTimeout(100);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(150);
  });
});

// tests/e2e/accessibility.spec.js
test.describe('접근성 테스트', () => {
  test('ARIA 속성 존재', async ({ page }) => {
    await page.goto('http://localhost:8000/rachgia_dashboard_v17.html');

    // 필터 select에 aria-label 존재
    await expect(page.locator('#monthFilter')).toHaveAttribute('aria-label');
    await expect(page.locator('#destFilter')).toHaveAttribute('aria-label');

    // 테이블에 caption 존재
    await expect(page.locator('#dataTable caption')).toBeVisible();
  });

  test('키보드 네비게이션', async ({ page }) => {
    await page.goto('http://localhost:8000/rachgia_dashboard_v17.html');

    // Tab으로 필터 이동
    await page.keyboard.press('Tab');
    await expect(page.locator('#monthFilter')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('#destFilter')).toBeFocused();
  });
});
```

### 테스트 커버리지 목표
- **필터**: 7개 필터 × 조합 = 20개 테스트
- **차트**: 7개 탭 × 차트 = 10개 테스트
- **성능**: 5개 테스트 (로딩, 필터, 렌더링, 메모리, 스크롤)
- **접근성**: 10개 테스트 (ARIA, 키보드, 색상 대비)
- **회귀**: 핵심 기능 28개

**총**: 70+ 테스트 케이스

### 성공 기준
- ✅ Playwright 테스트 스위트 구축
- ✅ 70+ 테스트 케이스 PASS
- ✅ CI/CD 통합 (GitHub Actions)
- ✅ 테스트 커버리지: ≥ 80%

### 예상 소요 시간: 12시간

---

## 🎨 Agent #V06: Code Refactoring Specialist (코드 리팩토링 전문가)

### 역할
- 함수 복잡도 개선 (평균 15 → 10)
- 코드 중복 제거
- 함수 분리 및 모듈화

### 전문 분야
- **복잡도 분석**: Cyclomatic Complexity 측정
- **Extract Function**: 긴 함수 분리
- **DRY 원칙**: 중복 코드 제거
- **Clean Code**: 가독성 향상

### 리팩토링 대상

#### 1. applyFilters() 함수 (현재 복잡도: 25)
```javascript
// v17: 복잡한 함수 (25 LOC, 복잡도 25)
function applyFilters() {
  let filtered = EMBEDDED_DATA;

  // 월 필터
  if (currentFilters.month) {
    filtered = filtered.filter(d => d.crdYearMonth === currentFilters.month);
  }

  // 행선지 필터
  if (currentFilters.destination && currentFilters.destination !== 'all') {
    filtered = filtered.filter(d => d.destination === currentFilters.destination);
  }

  // ... 5개 필터 더 (중복 패턴)

  updateTable(filtered);
  updateCharts(filtered);
  updateSummary(filtered);
}

// v18: 리팩토링 (복잡도 5)
function applyFilters() {
  const filtered = applyAllFilters(EMBEDDED_DATA, currentFilters);
  updateUI(filtered);
}

function applyAllFilters(data, filters) {
  return data.filter(d => {
    return matchesMonthFilter(d, filters.month) &&
           matchesDestinationFilter(d, filters.destination) &&
           matchesVendorFilter(d, filters.vendor) &&
           matchesFactoryFilter(d, filters.factory) &&
           matchesStatusFilter(d, filters.status) &&
           matchesDateFilter(d, filters.date) &&
           matchesSearchFilter(d, filters.search);
  });
}

function matchesMonthFilter(data, month) {
  if (!month) return true;
  return data.crdYearMonth === month;
}

// ... 각 필터별 함수
```

#### 2. renderTable() 함수 (현재 복잡도: 30)
```javascript
// v17: 복잡한 렌더링 (30 LOC, 복잡도 30)
function renderTable(data) {
  const tbody = document.getElementById('dataTableBody');
  tbody.innerHTML = '';

  data.forEach((d, index) => {
    const row = document.createElement('tr');

    // 지연 판정
    if (isDelayed(d)) {
      row.classList.add('delay-highlight');
    }

    // 경고 판정
    if (isWarning(d)) {
      row.classList.add('warning-highlight');
    }

    // ... 15개 컬럼 생성 (중복 코드)

    row.innerHTML = `
      <td>${escapeHtml(d.factory)}</td>
      <td>${escapeHtml(d.model)}</td>
      // ... 13개 더
    `;

    tbody.appendChild(row);
  });
}

// v18: 리팩토링 (복잡도 8)
function renderTable(data) {
  const tbody = document.getElementById('dataTableBody');
  tbody.innerHTML = '';

  data.forEach(row => {
    tbody.appendChild(createTableRow(row));
  });
}

function createTableRow(data) {
  const row = document.createElement('tr');
  row.className = getRowClasses(data);
  row.innerHTML = generateRowHTML(data);
  return row;
}

function getRowClasses(data) {
  const classes = [];
  if (isDelayed(data)) classes.push('delay-highlight');
  if (isWarning(data)) classes.push('warning-highlight');
  if (isShipped(data)) classes.push('shipped-highlight');
  return classes.join(' ');
}

function generateRowHTML(data) {
  const columns = [
    escapeHtml(data.factory),
    escapeHtml(data.model),
    escapeHtml(data.destination),
    // ... 12개 더
  ];
  return columns.map(col => `<td>${col}</td>`).join('');
}
```

### 성공 기준
- ✅ 평균 복잡도: 15 → 10 (33% ↓)
- ✅ 함수당 평균 LOC: 50 → 20 (60% ↓)
- ✅ 코드 중복: 30% → 5%
- ✅ 가독성 점수: 70 → 85

### 예상 소요 시간: 8시간

---

## 📖 Agent #V07: Documentation Writer (문서 작성 전문가)

### 역할
- 사용자 매뉴얼 작성 (한국어/영어)
- API 문서화
- 릴리즈 노트 작성
- 개발자 가이드 업데이트

### 전문 분야
- **사용자 매뉴얼**: 비기술자를 위한 가이드
- **스크린샷**: 주요 기능별 이미지
- **동영상**: 사용법 튜토리얼 (선택사항)
- **FAQ**: 자주 묻는 질문

### 문서 구조

#### 1. 사용자 매뉴얼 (한국어)
```markdown
# Rachgia Dashboard 사용 설명서

## 1. 시작하기
### 1.1 대시보드 접속
- URL: http://dashboard.rachgia.com
- 권장 브라우저: Chrome, Firefox, Safari 최신 버전

### 1.2 화면 구성
- 상단: 필터 영역 (7개 필터)
- 중앙: 탭 메뉴 (7개 탭)
- 하단: 데이터 테이블

## 2. 필터 사용법
### 2.1 월 필터
- 특정 월의 오더만 표시
- 예: "2026-01" 선택 시 2026년 1월 CRD 오더만 표시

### 2.2 행선지 필터
- 국가별 필터링
- 중요 행선지: Netherlands, Saudi Arabia, USA 등

### 2.3 빠른 필터
- 지연 오더: SDD가 CRD보다 늦은 오더
- 경고 오더: 7일 이내 차이
- 오늘 출고: 오늘 출고 예정 오더

## 3. 탭 설명
### 3.1 월별 현황
- 월별 오더 집계
- 지연/경고 건수
- 월별 추세 그래프

### 3.2 행선지 분석
- 국가별 오더 현황
- 상위 10개국 집중 분석
- 행선지별 지연율

### 3.3 모델 분석
- 모델별 생산 현황
- 인기 모델 TOP 10
- 모델별 완료율

// ... 나머지 탭

## 4. 차트 해석
### 4.1 공정 진행률 (Funnel)
- 8단계 생산 공정 시각화
- 병목 구간: 빨간색 표시
- 클릭 시 상세 정보

### 4.2 Factory별 완료율
- 공장별 생산 효율
- 목표 대비 달성률

## 5. 데이터 내보내기
### 5.1 Excel 내보내기
- "Excel 다운로드" 버튼 클릭
- 필터링된 데이터만 내보내기

### 5.2 PDF 내보내기
- "PDF 내보내기" 버튼 클릭
- 현재 화면 캡처 후 PDF 생성

## 6. 고급 기능
### 6.1 다크모드
- 우측 상단 토글로 전환
- 눈의 피로 감소

### 6.2 테이블 정렬
- 컬럼 헤더 클릭으로 정렬
- 오름차순/내림차순 전환

### 6.3 페이지네이션
- 표시 건수: 50/100/200/전체
- 대용량 데이터 빠른 탐색

## 7. FAQ
### Q1: 지연 오더는 어떻게 판정되나요?
A: SDD(예정 출고일)가 CRD(고객 요청일)보다 늦으면 지연으로 판정됩니다. 단, Code04에 "Approval"이 포함된 경우 예외입니다.

### Q2: 데이터는 얼마나 자주 업데이트되나요?
A: 매일 오전 9시 자동 업데이트됩니다.

### Q3: 모바일에서도 사용할 수 있나요?
A: 네, 반응형 디자인으로 모바일/태블릿에서도 사용 가능합니다.
```

#### 2. API 문서
```markdown
# Rachgia Dashboard API 문서

## 핵심 함수

### applyFilters()
**설명**: 7개 필터 조건을 조합하여 데이터 필터링

**매개변수**: 없음 (전역 currentFilters 객체 사용)

**반환값**: 없음 (UI 자동 업데이트)

**성능**: < 100ms (3,960건 기준)

**사용 예**:
\`\`\`javascript
currentFilters.month = '2026-01';
applyFilters(); // 자동으로 테이블/차트 업데이트
\`\`\`

### isDelayed(data)
**설명**: 오더 지연 여부 판정

**매개변수**:
- data (Object): 오더 데이터

**반환값**: Boolean

**로직**:
\`\`\`javascript
return d.sddValue > d.crd && !d.code04?.includes('Approval');
\`\`\`

// ... 나머지 함수
```

### 성공 기준
- ✅ 사용자 매뉴얼 (한국어): 20+ 페이지
- ✅ 사용자 매뉴얼 (영어): 20+ 페이지
- ✅ API 문서: 50+ 함수
- ✅ FAQ: 20+ 항목
- ✅ 스크린샷: 30+ 이미지

### 예상 소요 시간: 10시간

---

## 🚀 Agent #V08: Performance Auditor (성능 감사 전문가)

### 역할
- Lighthouse 성능 감사
- Core Web Vitals 최적화
- 성능 벤치마크 자동화

### 전문 분야
- **Lighthouse CI**: 자동화된 성능 감사
- **Core Web Vitals**: LCP, FID, CLS 최적화
- **번들 분석**: 파일 크기 최적화
- **네트워크 최적화**: 압축, 캐싱, CDN

### 성능 목표

| 메트릭 | v17 | v18 목표 | Lighthouse 점수 |
|--------|-----|---------|-----------------|
| **Performance** | 85 | ≥ 90 | 90+ |
| **Accessibility** | 95 | ≥ 95 | 95+ |
| **Best Practices** | 90 | ≥ 95 | 95+ |
| **SEO** | 80 | ≥ 85 | 85+ |
| **LCP** | 1.8s | < 1.5s | Good |
| **FID** | 50ms | < 50ms | Good |
| **CLS** | 0.05 | < 0.1 | Good |

### Lighthouse CI 설정
```yaml
# lighthouserc.yml
ci:
  collect:
    url:
      - http://localhost:8000/rachgia_dashboard_v17.html
    numberOfRuns: 3
  assert:
    preset: lighthouse:recommended
    assertions:
      categories:performance: ['error', {minScore: 0.9}]
      categories:accessibility: ['error', {minScore: 0.95}]
      categories:best-practices: ['error', {minScore: 0.95}]
      first-contentful-paint: ['error', {maxNumericValue: 2000}]
      largest-contentful-paint: ['error', {maxNumericValue: 2500}]
      cumulative-layout-shift: ['error', {maxNumericValue: 0.1}]
```

### 성공 기준
- ✅ Lighthouse 점수: 평균 ≥ 90
- ✅ Core Web Vitals: 모두 "Good"
- ✅ 파일 크기: < 600KB (v17: 556KB)
- ✅ 압축률: ≥ 70% (Gzip)

### 예상 소요 시간: 4시간

---

## 🔧 Agent #V09: DevOps & CI/CD Engineer (DevOps 전문가)

### 역할
- GitHub Actions CI/CD 파이프라인 구축
- 자동 배포 설정
- 모니터링 및 알림

### 전문 분야
- **GitHub Actions**: 워크플로우 자동화
- **자동 테스트**: Playwright + Lighthouse
- **자동 배포**: 프로덕션 배포 자동화
- **롤백**: 실패 시 자동 롤백

### CI/CD 파이프라인

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          npm install
          npx playwright install

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        run: |
          # FTP 업로드 또는 SSH 배포
          scp rachgia_dashboard_v18.html user@server:/var/www/html/
          scp rachgia_data_v8.js user@server:/var/www/html/

      - name: Verify deployment
        run: |
          curl -f http://dashboard.rachgia.com || exit 1

      - name: Notify success
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'v18 배포 성공!'
```

### 성공 기준
- ✅ GitHub Actions 워크플로우 구축
- ✅ 자동 테스트: 70+ 테스트 PASS
- ✅ 자동 배포: main 브랜치 푸시 시
- ✅ 롤백: 실패 시 자동 복구

### 예상 소요 시간: 6시간

---

## 📐 Agent #V10: Architecture Reviewer (아키텍처 리뷰어)

### 역할
- 전체 코드 아키텍처 리뷰
- 설계 패턴 개선 제안
- 확장성 평가

### 전문 분야
- **MVC 패턴**: 모델-뷰-컨트롤러 분리
- **모듈화**: 기능별 파일 분리
- **의존성 관리**: 외부 라이브러리 최적화
- **확장성 설계**: 향후 기능 추가 고려

### 아키텍처 개선 제안

#### 현재 (v17): Monolithic HTML
```
rachgia_dashboard_v17.html (556 KB)
  ├── HTML 구조
  ├── CSS 스타일 (<style>)
  ├── JavaScript 로직 (<script>)
  └── 외부 데이터 (rachgia_data_v8.js)
```

#### 제안 (v18): Modular Structure
```
/rachgia-dashboard/
  ├── index.html (50 KB)
  ├── /css/
  │   ├── variables.css (10 KB)
  │   ├── components.css (20 KB)
  │   └── themes.css (10 KB)
  ├── /js/
  │   ├── app.js (30 KB) - 메인 앱
  │   ├── filters.js (20 KB) - 필터 로직
  │   ├── charts.js (30 KB) - 차트 관리
  │   ├── table.js (25 KB) - 테이블 렌더링
  │   ├── utils.js (15 KB) - 유틸리티
  │   └── cache.js (10 KB) - 캐싱 레이어
  ├── /data/
  │   └── rachgia_data_v8.js (4.8 MB)
  └── /assets/
      └── icons/
```

**장점**:
- ✅ 모듈별 독립 개발 가능
- ✅ 파일별 캐싱 최적화
- ✅ 유지보수 용이
- ✅ 팀 협업 효율 증가

**단점**:
- ⚠️ HTTP 요청 증가 (6개 → 7개 JS 파일)
- ⚠️ 초기 설정 복잡도 증가

**해결책**:
- Webpack/Vite로 번들링
- HTTP/2 멀티플렉싱 활용

### 성공 기준
- ✅ 아키텍처 리뷰 보고서 작성
- ✅ 모듈화 제안 승인
- ✅ 확장성 점수: 70 → 90
- ✅ 유지보수성 점수: 75 → 90

### 예상 소요 시간: 6시간

---

## 📊 v18 개발 로드맵

### Phase 1: 보안 및 성능 (우선순위 HIGH)
**기간**: 1주 (40시간)
- V01: XSS 제거 (8시간)
- V02: 캐싱 레이어 (6시간)
- V03: 메모리 최적화 (5시간)
- V04: 차트 성능 (4시간)
- V06: 코드 리팩토링 (8시간)
- V08: 성능 감사 (4시간)
- **검증**: 중간 리뷰 (5시간)

### Phase 2: 테스트 및 자동화 (우선순위 MEDIUM)
**기간**: 1주 (40시간)
- V05: E2E 테스트 (12시간)
- V09: CI/CD 구축 (6시간)
- V08: Lighthouse CI (추가 4시간)
- **검증**: 테스트 실행 및 수정 (18시간)

### Phase 3: 문서 및 아키텍처 (우선순위 LOW)
**기간**: 1주 (40시간)
- V07: 문서 작성 (10시간)
- V10: 아키텍처 리뷰 (6시간)
- **최종 검증**: 전체 통합 테스트 (24시간)

**총 기간**: 3주 (120시간)

---

## 🎯 v18 성공 기준

### 정량적 지표

| 영역 | v17 | v18 목표 | 달성 기준 |
|------|-----|---------|----------|
| **보안** | 95% | 100% | escapeHtml 24/24, XSS 0건 |
| **필터 응답** | 80ms | 50-60ms | 25-38% 개선 |
| **메모리** | 20MB | 15MB | 25% 감소 |
| **차트 렌더** | 300ms | 200ms | 33% 개선 |
| **테스트 커버리지** | 0% | 80% | 70+ 테스트 PASS |
| **Lighthouse** | 85 | 90+ | 모든 카테고리 90+ |
| **코드 복잡도** | 15 | 10 | 33% 감소 |
| **문서 커버리지** | 95% | 100% | 매뉴얼 + API + FAQ |

### 정성적 지표
- ✅ 코드 가독성 향상
- ✅ 유지보수 용이성 증가
- ✅ 확장성 개선
- ✅ 개발자 경험 향상

---

## 🤝 에이전트 협업 매트릭스

| 에이전트 | 주요 협업 대상 | 의존성 | 출력물 |
|---------|---------------|--------|--------|
| V01 (XSS) | V06 (리팩토링) | 코드 분석 | XSS 제거 코드 |
| V02 (캐싱) | V03 (메모리) | 메모리 관리 | 캐싱 레이어 코드 |
| V03 (메모리) | V04 (차트) | Chart.js 관리 | 메모리 최적화 코드 |
| V04 (차트) | V03 (메모리) | 인스턴스 관리 | 차트 최적화 코드 |
| V05 (E2E) | 모든 에이전트 | 통합 테스트 | Playwright 스위트 |
| V06 (리팩토링) | V01 (XSS) | 코드 구조 | 리팩토링 코드 |
| V07 (문서) | 모든 에이전트 | 기능 이해 | 문서 파일 |
| V08 (감사) | V02, V03, V04 | 성능 지표 | Lighthouse 리포트 |
| V09 (DevOps) | V05 (E2E), V08 (감사) | 테스트/감사 | CI/CD 파이프라인 |
| V10 (아키텍처) | 모든 에이전트 | 전체 설계 | 아키텍처 문서 |

---

## 📝 결론

**v18 10명 에이전트 팀**은 v17의 MEDIUM/LOW 우선순위 개선사항을 완료하여 **100% 완성도 달성**을 목표로 합니다.

### 핵심 개선사항
1. ✅ 보안: 95% → 100% (V01)
2. ✅ 성능: 80ms → 50ms (V02, V03, V04)
3. ✅ 테스트: 수동 → 자동화 (V05, V09)
4. ✅ 품질: 복잡도 15 → 10 (V06)
5. ✅ 문서: 95% → 100% (V07)

### 예상 성과
- **프로덕션 품질**: v17 (95%) → v18 (100%)
- **성능 개선**: v17 대비 추가 20-30%
- **안정성**: 70+ E2E 테스트로 회귀 방지
- **유지보수성**: 코드 복잡도 33% 감소

**총 투자**: 120시간 (3주)
**ROI**: 장기적 유지보수 비용 50% 감소, 사용자 만족도 20% 향상

---

**제안 승인 대기 중...**

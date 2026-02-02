# Performance Optimization Guide

Rachgia Dashboard 성능 최적화 가이드

## 현재 상태

### 번들 크기 (2026-02-02 분석 기준)

| 파일 | 원본 크기 | Gzip 크기 | 압축률 |
|------|-----------|-----------|--------|
| rachgia_data_v8.js | 4.85 MB | 261 KB | 94.7% |
| rachgia_dashboard_v19.html | 997 KB | 164 KB | 83.6% |
| 기타 JS/JSON | 122 KB | 48 KB | ~70% |
| **총합** | **5.99 MB** | **473 KB** | **92.3%** |

## 적용된 최적화

### 1. Gzip 압축 ✅
```apache
# .htaccess
AddOutputFilterByType DEFLATE text/html text/css application/javascript
```

### 2. Progressive Rendering ✅
- 테이블 데이터: 50개 단위 배치 렌더링
- Virtual scrolling: 200개 이상 행 지원

### 3. 차트 인스턴스 재사용 ✅
- `updateOrCreateChart()` 함수로 기존 차트 인스턴스 파괴 후 재생성

### 4. 날짜 파싱 캐싱 ✅
- `dateParseCache` Map으로 중복 파싱 방지

## 추가 최적화 권장사항

### 데이터 최적화

#### 1. 데이터 분할 로딩
```javascript
// 현재: 모든 데이터 로드
const EMBEDDED_DATA = [...]; // 4.85 MB

// 권장: 페이지네이션 기반 로딩
async function loadDataPage(page, pageSize = 100) {
  const response = await fetch(`/api/orders?page=${page}&size=${pageSize}`);
  return response.json();
}
```

#### 2. IndexedDB 캐싱
```javascript
// 오프라인 데이터 캐싱
const db = await idb.openDB('rachgia', 1, {
  upgrade(db) {
    db.createObjectStore('orders', { keyPath: 'poNumber' });
  }
});
```

### 렌더링 최적화

#### 1. CSS Containment
```css
.order-card {
  contain: content;
}

.chart-container {
  contain: size layout;
}
```

#### 2. will-change 힌트
```css
.tab-content {
  will-change: opacity, transform;
}
```

### 네트워크 최적화

#### 1. Resource Hints
```html
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://firebaseio.com">
```

#### 2. Critical CSS
- 첫 화면에 필요한 CSS만 인라인
- 나머지는 `<link rel="preload">`로 비동기 로딩

## Core Web Vitals 목표

| 메트릭 | 목표 | 현재 (예상) |
|--------|------|------------|
| LCP (Largest Contentful Paint) | < 2.5s | ~3.0s |
| FID (First Input Delay) | < 100ms | ~50ms |
| CLS (Cumulative Layout Shift) | < 0.1 | ~0.05 |

## 측정 도구

```bash
# Lighthouse CI
npm run lighthouse

# 번들 분석
npm run analyze:bundle

# 브라우저 DevTools
- Performance 탭
- Coverage 탭 (미사용 CSS/JS 확인)
```

## 모니터링

### 실제 사용자 메트릭 (RUM)
```javascript
// Web Vitals 측정
import { getLCP, getFID, getCLS } from 'web-vitals';

getLCP(console.log);
getFID(console.log);
getCLS(console.log);
```

## 참고 자료

- [Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

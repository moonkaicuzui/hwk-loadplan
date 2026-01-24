# Rachgia Dashboard Project - Claude Code Configuration

## Project Overview

**프로젝트명**: Rachgia Factory 통합 생산관리 대시보드
**현재 버전**: v19.0.0 (Production Ready)
**목적**: 베트남 Rachgia 공장(A, B, C, D)의 생산 현황 실시간 모니터링
**기술 스택**: HTML, CSS (Tailwind), JavaScript (Vanilla), Chart.js, XLSX.js, PWA, i18n

## Project Structure

```
오더 현황 분석/
├── CLAUDE.md                    # 이 파일 (프로젝트 설정)
├── README.md                    # 프로젝트 문서
├── rachgia_dashboard_v19.html   # 현재 대시보드 (Production)
├── src/                         # 소스 파일
│   ├── i18n.js                  # 다국어 지원 (ko/en/vi)
│   ├── notifications.js         # 브라우저 알림
│   └── keyboard-shortcuts.js    # 키보드 단축키
├── locales/                     # 번역 파일
│   ├── ko.json, en.json, vi.json
├── dist/                        # 빌드 출력
├── tests/                       # Playwright 테스트
├── docs/                        # 문서
│   └── QMS_*.md                 # QMS 품질관리 문서
├── .htaccess                    # Apache 설정 (Gzip)
├── manifest.json                # PWA 매니페스트
├── sw.js                        # Service Worker
└── archive/                     # 레거시 파일 보관
```

## Key Domain Concepts

### 생산 공정 순서
```
S_CUT → PRE_SEW → SEW_INPUT → SEW_BAL → OSC → ASS → WH_IN → WH_OUT
(재단)   (선봉)   (재봉투입)  (재봉)   (외주) (조립) (입고)  (출고)
```

### 핵심 날짜 필드
- **CRD**: Customer Required Date (고객 요청일) - 절대 기준
- **SDD**: Scheduled Delivery Date (예정 출고일) - 공장 계획
- **지연 판정**: SDD > CRD (Code04 승인 제외)

### 상태 정의
- **completed**: 완료량 >= 주문량
- **partial**: 0 < 완료량 < 주문량
- **pending**: 완료량 = 0

## Code Conventions

### JavaScript
```javascript
// 함수 명명: camelCase
function isDelayed(d) { ... }
function applyFilters() { ... }

// 상수: UPPER_SNAKE_CASE
const EMBEDDED_DATA = [...];
const IMPORTANT_DESTINATIONS = {...};

// DOM 접근: getElementById 사용
document.getElementById('filterName').value;
```

### CSS (Tailwind)
```html
<!-- 일관된 패딩/마진 -->
<div class="p-4 mb-6">

<!-- 카드 스타일 -->
<div class="bg-card rounded-xl shadow-sm p-6">

<!-- 다크모드 대응 -->
<div class="bg-white dark:bg-gray-800">
```

## Quality Gates

모든 변경사항은 다음 검증을 통과해야 합니다:

1. **코드 품질 (Security)**
   - XSS 취약점 없음
   - escapeHtml() 적용 확인

2. **성능 (Performance)**
   - 초기 로딩 < 3초
   - 필터 응답 < 100ms

3. **접근성 (Accessibility)**
   - ARIA 속성 확인
   - 키보드 네비게이션 지원

4. **데이터 정확성 (Data Quality)**
   - 집계 값 검증
   - 지연/경고 판정 정확성

## Current Issues & Priorities

### Completed ✅
- [x] Gzip 압축 (.htaccess) - 75% 로딩 개선
- [x] 프린트 스타일 (@media print, A4 landscape)
- [x] 모바일 반응형 (768px 테이블→카드 레이아웃)
- [x] 키보드 단축키 (Alt+1~8, Alt+F, Alt+E, Escape)
- [x] PWA 지원 (Service Worker, manifest.json)
- [x] i18n 다국어 (한국어/영어/베트남어)
- [x] QMS 품질관리 시스템 통합

### Future Enhancements (Optional)
- [ ] Virtual Scrolling (10,000+ 레코드 지원)
- [ ] 실시간 데이터 연동 (API)
- [ ] 차트 인스턴스 재사용 (메모리 최적화)

## Version History

| 버전 | 날짜 | 주요 변경 |
|------|------|-----------|
| v19 | 2026-01-24 | **Production Release** - Gzip압축, 프린트스타일, 모바일반응형, 폴더정리 |
| v18 | 2026-01-03 | QMS 품질관리, PWA, i18n, 키보드단축키 |
| v17 | 2025-12-28 | 성능최적화, 보안강화, 접근성개선 |
| v11-v16 | 2025-12 | 단계적 기능 추가 (archive/ 보관) |
| v8 | 2024-12-22 | 필터수정, 잔량계산, XSS보안, 접근성 |
| v7 | 2024-12-22 | Ground Truth, 날짜필터, AQL, 잔량표시 |

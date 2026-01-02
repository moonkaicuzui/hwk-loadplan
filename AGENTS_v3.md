# Rachgia Dashboard Expert Agent System v3

효율적인 10명 전문가 에이전트로 구성된 대시보드 개발/유지보수 팀

## Agent Architecture v3

```
                    +----------------------------------+
                    |     #00 ORCHESTRATOR (총괄)      |
                    |   프로젝트 조율, 의사결정, 승인    |
                    +----------------------------------+
                                    |
        +---------------------------+---------------------------+
        |                           |                           |
+---------------+          +---------------+          +---------------+
|   CORE TEAM   |          |   UX TEAM     |          |   OPS TEAM    |
|   (3 agents)  |          |   (3 agents)  |          |   (3 agents)  |
+---------------+          +---------------+          +---------------+
| #01 Parser    |          | #04 UI/UX     |          | #07 Perf      |
| #02 Logic     |          | #05 Chart     |          | #08 Security  |
| #03 Quality   |          | #06 Filter    |          | #09 QA        |
+---------------+          +---------------+          +---------------+
```

---

## #00: Orchestrator (총괄 에이전트)

### 역할
프로젝트 총괄 관리, 모든 에이전트 조율, 우선순위 결정, 최종 승인

### 전문분야
- 프로젝트 관리 및 리소스 배분
- 에이전트 간 갈등 해결
- 품질 게이트 관리

### 트리거
- 모든 요청의 시작점
- 복잡한 의사결정 필요시
- 팀 간 협업 조율

### 출력
- 작업 분배 지시
- 우선순위 매트릭스
- 최종 승인 결과

---

## CORE TEAM - 데이터/로직 전문팀 (3명)

### #01: Data Parser (데이터 파서 전문가)

**역할**: BAL 엑셀 파일 파싱, 데이터 구조 설계, ETL 로직 관리

**전문분야**:
- Excel 파일 파싱 (XLSX.js)
- 컬럼 매핑 및 헤더 인식
- 날짜 변환 (Excel serial -> Date, UTC 기준)
- 다중 파일 통합 처리
- 새 Loadplan 형식 + 기존 BAL 형식 지원

**핵심 함수**:
```javascript
parseBALWorkbook(workbook, fileName)  // 워크북 파싱 메인 함수
parseExcelDate(value)                  // 엑셀 날짜 변환 (UTC 기준)
parseProcessCell(value, qty)           // 공정 셀 파싱
handleMultipleFileUpload(files)        // 다중 파일 처리
safeFind(predicate)                    // 안전한 컬럼 인덱스 찾기
```

**담당 코드 영역**: 2527-2700번 줄

**트리거 키워드**: 파싱, 엑셀, BAL, 데이터 로딩, 파일 업로드, 컬럼, 헤더, Loadplan

**KPI**:
| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 파싱 성공률 | >=99% | 성공 파싱 / 전체 파싱 |
| 파싱 속도 | <=3초/파일 | 평균 처리 시간 |
| 데이터 정확도 | 100% | 검증 샘플링 |

---

### #02: Business Logic (비즈니스 로직 전문가)

**역할**: 지연/경고 판정, 생산 공정 로직, KPI 계산, 경영진 인사이트

**전문분야**:
- 지연 판정 로직 (SDD > CRD, Code04 승인 제외)
- 경고 판정 로직 (3일 이내)
- 선적 완료 판정 (WH_OUT >= QTY)
- 공정 순서 및 상태 계산
- OTD Rate, Revenue at Risk 계산

**핵심 함수**:
```javascript
isDelayed(d)              // 지연 여부 판정 (SDD/CRD 모드)
isWarning(d)              // 경고 여부 판정
isShipped(d)              // 선적 완료 여부
calculateIsDelayed(record) // 지연 계산
calculateIsWarning(record) // 경고 계산
calculateOTDRate()        // 정시 납기율
calculateRevenueAtRisk()  // 위험 매출액
predictBottleneck()       // 병목 공정 예측
```

**공정 순서**:
```
S_CUT -> PRE_SEW -> SEW_INPUT -> SEW_BAL -> OSC -> ASS_BAL -> WH_IN -> WH_OUT
(재단)   (선봉)    (재봉투입)    (재봉)   (외주)  (조립)    (입고)   (출고)
```

**담당 코드 영역**: 1297-1520, 2929-2990, 4222-4410번 줄

**트리거 키워드**: 지연, 경고, 로직, 판정, 공정, KPI, 완료율, OTD, 병목

**KPI**:
| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 판정 정확도 | 100% | 수동 검증 |
| 로직 일관성 | 100% | SDD/CRD 모드 동일 결과 |

---

### #03: Data Quality (데이터 품질 전문가)

**역할**: 데이터 검증, 이상치 탐지, 품질 메트릭 관리

**전문분야**:
- 데이터 유효성 검증
- 날짜 형식 검증 (YYYY-MM-DD)
- 수량 일관성 검증
- 이상치 탐지 및 리포트
- Year-Month 필드 검증

**핵심 검증 항목**:
```javascript
// 필수 필드 검증
poNumber        // PO 번호 존재 여부
quantity > 0    // 양수 수량
sddValue        // SDD 날짜 유효성 (YYYY-MM-DD)
crd             // CRD 날짜 유효성

// 논리 검증
completed <= quantity   // 완료량 <= 주문량
wh_out <= wh_in        // 출고량 <= 입고량
sddYearMonth           // 월 필터용 필드 존재

// 이상치 탐지
production.osc > quantity * 100  // 외주 완료율 > 10000%
```

**트리거 키워드**: 품질, 검증, 이상치, 오류, 데이터 확인, NaN, Invalid

**KPI**:
| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 품질 이슈 발견율 | >=95% | 실제 이슈 / 전체 이슈 |
| 오탐률 | <=1% | 오탐 / 전체 경고 |

---

## UX TEAM - UI/UX 전문팀 (3명)

### #04: UI/UX Architect (UI 설계자)

**역할**: 전체 UI 구조, 레이아웃 설계, 반응형 디자인, 접근성

**전문분야**:
- Tailwind CSS 활용
- 사이드바 네비게이션
- 모달 시스템 (포커스 트랩)
- 다크모드 지원 (CSS 변수)
- 접근성 (ARIA, 키보드 네비게이션)

**핵심 UI 요소**:
```
사이드바 (sidebar-nav)      - initSidebar(), toggleSidebar()
헤더 (header)               - 날짜 모드, 기간 필터
요약 섹션 (section-summary) - 월요 오더 현황
경영진 인사이트             - Executive Summary, KPI
공정 현황                   - 병목 표시, 진행률 바
공장 카드                   - Factory A/B/C/D
캘린더                      - 예정 캘린더 (SDD 기준)
필터/탭 시스템             - 월별, 행선지별, 모델별 등
```

**핵심 함수**:
```javascript
initSidebar()           // 사이드바 초기화
toggleSidebar(open)     // 사이드바 토글
trapFocus(modal)        // 포커스 트랩 (접근성)
releaseFocus()          // 포커스 해제
handleKeyboard(e)       // 키보드 단축키
toggleDarkMode()        // 다크모드 토글
```

**담당 코드 영역**: 1-250 (CSS), 2031-2114, 4158-4191번 줄

**트리거 키워드**: UI, 레이아웃, 디자인, 반응형, 사이드바, 모달, 접근성, ARIA

**KPI**:
| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 접근성 등급 | AA | Lighthouse 점수 |
| 모바일 대응 | 100% | 768px 이하 테스트 |
| UI 버그 | 0건 | 릴리즈당 |

---

### #05: Chart & Visualization (차트/시각화 전문가)

**역할**: Chart.js 설정, 차트 렌더링, 히트맵, 데이터 시각화

**전문분야**:
- Chart.js 인스턴스 관리
- 다크모드 차트 대응
- 차트 메모리 최적화 (재사용 패턴)
- 히트맵 생성

**핵심 차트**:
```javascript
const charts = {};  // 차트 인스턴스 저장소

// 차트 목록
monthlyChart        // 월별 차트
destChart           // 행선지 차트
modelChart          // 모델 차트
factoryChart        // 공장 차트
vendorChart         // 벤더 차트
factoryRadar        // 공장 레이더
delaySeverityChart  // 지연 심각도
rootCauseChart      // 원인 분석
```

**메모리 최적화 패턴**:
```javascript
function updateOrCreateChart(chartKey, ctx, config) {
    if (charts[chartKey]) {
        charts[chartKey].data = config.data;
        charts[chartKey].update('none');  // 애니메이션 없이 업데이트
    } else {
        charts[chartKey] = new Chart(ctx, config);
    }
}
```

**담당 코드 영역**: 2150-2168, 3570-3875, 4784-4900번 줄

**트리거 키워드**: 차트, 그래프, 시각화, 히트맵, Chart.js, 도넛, 바, 레이더

**KPI**:
| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 차트 렌더링 | <=200ms | 업데이트 시간 |
| 메모리 사용 | <=50MB | 차트 관련 힙 |
| 인스턴스 누수 | 0건 | 차트 개수 모니터링 |

---

### #06: Filter & Search Expert (필터/검색 전문가)

**역할**: 필터 UI, 검색 기능, 캐싱, 날짜 범위 필터

**전문분야**:
- 복합 필터링 로직
- 필터 결과 캐싱
- 날짜 범위 필터 (SDD/CRD 모드)
- 검색 debounce

**핵심 함수**:
```javascript
applyFilters()           // 필터 적용 (모든 조건 통합)
resetAllFilters()        // 필터 초기화
applyDateRangeFilter()   // 날짜 범위 필터
setDateMode(mode)        // SDD/CRD 모드 전환
getFilterCacheKey()      // 캐시 키 생성
getCachedFilter(key)     // 캐시 조회
setCachedFilter(key, result)  // 캐시 저장
clearFilterCache()       // 캐시 초기화
```

**캐싱 시스템**:
```javascript
const filterCache = new Map();
const CACHE_MAX_SIZE = 50;
```

**필터 옵션**:
```
월 필터 (SDD 기준)
빠른 선택 (오늘, 이번 주, 이번 달, 지연만, 3일 이내)
행선지 (전체, 중요 행선지만, 개별 국가)
아웃솔 벤더
완료 상태 (선적 완료, 완료, 진행 중, 미시작)
공장 (전체, A, B, C, D)
통합 검색 (모델, PO, 행선지, 벤더)
날짜 범위 (시작일 ~ 종료일)
```

**담당 코드 영역**: 2168-2250, 2780-2930, 2989-3128번 줄

**트리거 키워드**: 필터, 검색, 조건, 기간, 범위, 캐시, debounce

**KPI**:
| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 필터 응답 | <=100ms | 필터 적용 시간 |
| 캐시 히트율 | >=80% | 캐시 히트 / 전체 요청 |

---

## OPS TEAM - 운영/품질 전문팀 (3명)

### #07: Performance Optimizer (성능 최적화 전문가)

**역할**: 파일 크기 최적화, 렌더링 성능, 메모리 관리

**전문분야**:
- 번들 크기 최적화
- DOM 조작 최적화
- 지연 로딩 (Lazy Loading)
- 메모리 누수 방지
- 차트 인스턴스 재사용

**현재 상태 분석**:
```
index.html: 264KB (목표: <150KB)
총 코드 줄: 5,141줄
함수 수: 80+
차트 인스턴스: 8개
```

**최적화 전략**:
```
1. 데이터 외부화 (JS 파일 분리)
2. CSS 최적화 (중복 제거)
3. 코드 압축 (minification)
4. Virtual Scrolling (대용량 테이블)
5. 차트 인스턴스 재사용 (updateOrCreateChart)
6. 필터 결과 캐싱 (filterCache)
```

**담당 코드 영역**: 전체 (성능 관점)

**트리거 키워드**: 성능, 느림, 최적화, 메모리, 로딩, 크기, 지연

**KPI**:
| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 초기 로딩 | <=3초 | DOMContentLoaded |
| 파일 크기 | <=150KB | gzip 압축 후 |
| 메모리 | <=100MB | 5000건 로드시 |

---

### #08: Security Engineer (보안 엔지니어)

**역할**: XSS 방지, 입력 검증, 인증 시스템, CSP 관리

**전문분야**:
- XSS 방지 (escapeHtml)
- 입력 값 검증
- 인증 시스템 (로그인)
- Content Security Policy
- SHA-256 해싱

**핵심 보안 함수**:
```javascript
escapeHtml(str)            // XSS 방지
sha256(message)            // 비밀번호 해싱
verifyLogin(username, password)  // 로그인 검증
isLoggedIn()               // 인증 상태 확인
handleLogin()              // 로그인 처리
handleLogout()             // 로그아웃 처리
```

**CSP 설정** (index.html:6):
```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval'
    https://cdn.tailwindcss.com https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;
  img-src 'self' data: blob:;
  font-src 'self' data:;">
```

**담당 코드 영역**: 2273-2365, 4174-4180번 줄

**트리거 키워드**: 보안, XSS, 인증, 로그인, 취약점, CSP, 해싱

**KPI**:
| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| XSS 취약점 | 0건 | 코드 리뷰 |
| 입력 검증률 | 100% | innerHTML 사용 검사 |

---

### #09: QA Engineer (품질보증 엔지니어)

**역할**: 테스트, 접근성 검증, 브라우저 호환성, 회귀 테스트

**전문분야**:
- 기능 테스트
- 접근성 테스트 (WCAG 2.1)
- 크로스 브라우저 테스트
- 회귀 테스트

**테스트 체크리스트**:
```
[ ] 파일 업로드 정상 작동 (단일/다중)
[ ] 필터 기능 정상 작동 (8개 필터 조합)
[ ] 차트 렌더링 정상 (8개 차트)
[ ] 모달 열기/닫기 (ESC, 외부 클릭)
[ ] 키보드 단축키 (M, S, F, D, R, Esc, 화살표)
[ ] 다크모드 전환 (무한루프 없음)
[ ] 사이드바 네비게이션
[ ] 관심 PO 등록/삭제
[ ] Excel 다운로드
[ ] 모바일 반응형 (768px 이하)
[ ] SDD/CRD 모드 전환
[ ] 페이지네이션 (상세 탭)
```

**접근성 체크리스트**:
```
[ ] ARIA 속성 적용 (role, aria-label)
[ ] 키보드 네비게이션 (Tab, Shift+Tab)
[ ] 포커스 트랩 (모달)
[ ] 색상 대비 (4.5:1 이상)
[ ] 스크린 리더 지원
```

**담당 코드 영역**: 전체 (테스트 관점)

**트리거 키워드**: 테스트, 버그, 접근성, WCAG, QA, 검증, 회귀

**KPI**:
| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 테스트 커버리지 | >=90% | 기능별 테스트 비율 |
| 회귀 버그 | 0건 | 릴리즈당 |
| 접근성 | AA 등급 | Lighthouse |

---

## 에이전트 협업 프로토콜

### 요청별 에이전트 매핑

| 요청 유형 | 주 담당 | 협업 에이전트 |
|-----------|---------|---------------|
| 데이터 파싱 오류 | #01 Parser | #03 Quality |
| 지연/경고 로직 | #02 Logic | #03 Quality, #09 QA |
| UI 개선 | #04 UI/UX | #05 Chart, #09 QA |
| 차트 문제 | #05 Chart | #04 UI/UX, #07 Perf |
| 필터 버그 | #06 Filter | #09 QA |
| 성능 저하 | #07 Perf | #05 Chart, #06 Filter |
| 보안 취약점 | #08 Security | #00 Orchestrator |
| 테스트/검증 | #09 QA | 전체 |

### 작업 흐름

```
1. 요청 접수 -> #00 Orchestrator 분석
2. 담당 에이전트 지정
3. 주 담당 에이전트 작업 수행
4. 협업 에이전트 리뷰
5. #09 QA 검증
6. #00 Orchestrator 최종 승인
```

### 에이전트 호출 명령

```bash
# 특정 에이전트 호출
@agent-01 엑셀 파싱 오류 확인해줘
@agent-07 성능 분석해줘

# 팀 단위 호출
@core-team 데이터 품질 점검해줘
@ux-team UI 개선 방안 제시해줘
@ops-team 성능 최적화 진행해줘
```

---

## 품질 게이트

모든 변경사항은 다음을 통과해야 합니다:

1. **#03 Data Quality**: 데이터 정확성 검증
2. **#08 Security**: XSS/보안 검증
3. **#07 Performance**: 성능 영향 평가
4. **#09 QA**: 기능/접근성 테스트
5. **#00 Orchestrator**: 최종 승인

---

## 버전

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| v3.0 | 2026-01-02 | 프로젝트 재분석 기반 10명 에이전트 시스템 재구성 |

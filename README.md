# Rachgia Factory Dashboard v19

**통합 생산관리 대시보드** - Vietnam Rachgia Factories A/B/C/D Real-time Production Status

![Version](https://img.shields.io/badge/version-19.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-production-success)

---

## 📊 프로젝트 개요

베트남 Rachgia 공장(A, B, C, D)의 생산 현황을 실시간으로 모니터링하고 분석하는 통합 대시보드입니다. 3,960건 이상의 오더 데이터를 기반으로 8단계 생산 공정 진행률, 지연/경고 판정, 공장별/행선지별 성과 분석, AI 기반 예측 분석 등을 제공합니다.

### 주요 기능

#### 🎯 Phase 1: Core Features (v1-v10)
- **실시간 데이터 시각화**: 3,960+ 오더, 8단계 생산 공정 추적
- **다차원 필터링**: 월별, 행선지, 벤더, 공장, 상태별 필터
- **인터랙티브 차트**: Chart.js 기반 월별/행선지/모델/공장/벤더 분석
- **히트맵 분석**: 모델×벤더, 국가×월, 모델×행선지 3종
- **지연 관리**: CRD 기준 지연/경고 판정, Code04 승인 예외 처리
- **데이터 내보내기**: Excel, CSV, JSON 포맷 지원

#### 🚀 Phase 2: Enhanced UX (v11-v16)
- **다크모드**: 전체 UI 다크모드 지원
- **PWA**: 오프라인 지원, 앱 설치, Service Worker 캐싱
- **키보드 단축키**: Alt+1~8 탭 전환, Alt+F 검색, Alt+E 내보내기
- **브라우저 알림**: 지연 오더, 마감 임박 실시간 알림
- **반응형 디자인**: 모바일/태블릿 완벽 대응 (768px+)
- **접근성**: WCAG 2.1 AA 준수, ARIA 속성, 스크린 리더 지원

#### 🌐 Phase 2.5: i18n Multi-language (v17)
- **3개 언어 지원**: 한국어, English, Tiếng Việt
- **실시간 번역**: 브라우저 언어 자동 감지, 사용자 설정 저장
- **번역 범위**: 모든 UI 요소, 차트 레이블, 모달, 알림, 오류 메시지
- **문화 적응**: 날짜/숫자 포맷, 텍스트 방향(LTR), 지역화

#### 🤖 Phase 3: AI Analytics (v18 - NEW)
- **예측 모델링**:
  - 선형 회귀 기반 7일 지연 예측 (R² 계산)
  - 트렌드 분석: 7/14/30일 이동평균, 성장률, 계절성 감지
  - 예측 정확도: MAE, RMSE, MAPE 메트릭

- **통계 분석**:
  - 상관관계 매트릭스: 수량-지연, 공장-완료율 등
  - 분산/표준편차 분석
  - Z-score 기반 이상치 탐지

- **인사이트 생성**:
  - 병목 공정 식별 (8단계 공정별 완료율)
  - 공장별 성과 순위
  - 행선지별 리스크 평가
  - 자동화된 권장사항 생성

---

## 🛠️ 기술 스택

### Frontend
- **HTML5**: 시맨틱 마크업, 접근성
- **CSS3**: Tailwind CSS 3.x (JIT 모드)
- **JavaScript**: Vanilla JS (ES6+), 모듈 패턴
- **Chart.js**: 4.x 인터랙티브 차트 라이브러리

### Libraries
- **XLSX.js**: Excel 파일 내보내기 (SheetJS)
- **i18n**: 커스텀 다국어 시스템 (ko, en, vi)
- **Service Worker**: PWA 오프라인 지원

### Backend/Data
- **Python 3.8+**: 데이터 파싱 스크립트
- **pandas**: Excel 데이터 처리
- **openpyxl**: Excel 파일 읽기

### Development
- **Git**: 버전 관리
- **VSCode**: 개발 환경
- **Chrome DevTools**: 디버깅, 성능 분석

---

## 📁 프로젝트 구조

```
오더 현황 분석/
├── rachgia_dashboard_v19.html    # 메인 대시보드 (Production)
├── src/                          # 소스 파일
│   ├── i18n.js                   # 다국어 시스템
│   ├── notifications.js          # 브라우저 알림
│   └── keyboard-shortcuts.js     # 키보드 단축키
├── locales/                      # i18n 번역 파일
│   ├── ko.json                   # 한국어 (기본)
│   ├── en.json                   # English
│   └── vi.json                   # Tiếng Việt
├── dist/                         # 빌드 출력
├── tests/                        # Playwright 테스트
├── .htaccess                     # Apache 설정 (Gzip 압축)
├── manifest.json                 # PWA 매니페스트
├── sw.js                         # Service Worker
├── CLAUDE.md                     # Claude Code 프로젝트 설정
├── AGENTS.md                     # 에이전트 시스템 정의 (70+ 에이전트)
├── README.md                     # 프로젝트 문서 (이 파일)
└── archive/                      # 레거시 파일 보관
    ├── v11-v18/                  # 이전 버전 대시보드
    ├── old-data/                 # 이전 데이터 파일
    └── old-docs/                 # 이전 문서
```

---

## 🚀 설치 및 실행

### 사전 요구사항

- **Python 3.8+** (데이터 파싱용)
- **웹 브라우저**: Chrome 90+, Firefox 88+, Safari 14+
- **로컬 웹 서버** (선택사항): Python HTTP Server 또는 Live Server

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd 오더\ 현황\ 분석/
```

### 2. Python 의존성 설치

```bash
pip install pandas openpyxl
```

### 3. 데이터 파싱 (필요 시)

원본 Excel 파일(BAL*.xlsx)이 있는 경우:

```bash
python parse_loadplan.py
```

출력: `parsed_loadplan_v6.json` (3,960건 오더 데이터)

### 4. 대시보드 실행

**방법 1: Python HTTP Server** (권장)
```bash
python3 -m http.server 8000
```
브라우저에서 `http://localhost:8000/rachgia_dashboard_v19.html` 접속

**방법 2: VSCode Live Server**
1. VSCode에서 프로젝트 폴더 열기
2. Live Server 확장 설치
3. `rachgia_dashboard_v19.html` 우클릭 → "Open with Live Server"

**방법 3: 직접 열기** (CORS 이슈 가능)
```bash
open rachgia_dashboard_v19.html
```

---

## 📖 사용 방법

### 기본 사용법

1. **대시보드 로딩**: 3,960건 오더 데이터 자동 로드 (2-3초)

2. **필터 사용**:
   - **월 필터**: 특정 월의 오더만 표시
   - **행선지 필터**: 국가별 필터링 (중요 행선지 + 전체)
   - **벤더 필터**: 아웃솔 벤더별
   - **공장 필터**: Factory A/B/C/D
   - **상태 필터**: 완료/진행중/대기
   - **빠른 날짜**: 지연, 경고(D-7), 오늘, 1주일, 1개월
   - **검색**: 모델, PO, 행선지, 벤더 통합 검색

3. **탭 전환**:
   - **요약**: 전체 통계, 공정 흐름, 공장별 완료율
   - **월별**: 월별 생산 트렌드 차트
   - **행선지**: 국가별 오더 분포 및 완료율
   - **모델**: 모델별 생산 현황
   - **공장**: Factory A/B/C/D 성과 비교
   - **벤더**: 아웃솔 벤더 성과 분석
   - **히트맵**: 3종 히트맵 (모델×벤더, 국가×월, 모델×행선지)
   - **데이터**: 상세 테이블 (정렬, 페이징, 내보내기)

4. **데이터 내보내기**:
   - Excel (.xlsx): 전체 컬럼, 한글 지원
   - CSV (.csv): UTF-8 BOM, Excel 호환
   - JSON (.json): 원본 데이터 구조

5. **AI 분석** (NEW):
   - 데이터 탭 → "🤖 AI 분석" 버튼
   - 7일 지연 예측, 병목 공정, 상관관계 분석
   - 자동화된 인사이트 및 권장사항

### 키보드 단축키

| 단축키 | 기능 |
|--------|------|
| Alt+1~8 | 탭 전환 (요약~데이터) |
| Alt+F | 검색창 포커스 |
| Alt+E | 내보내기 모달 |
| Alt+S | 설정 |
| Alt+H | 도움말 |
| Alt+R | 필터 초기화 |
| Alt+D | 다크모드 토글 |
| ESC | 모달 닫기 |
| / | 검색창 포커스 |
| ? | 키보드 단축키 도움말 |

### 다국어 전환

1. 헤더 우측 "🌐" 언어 선택기
2. 한국어 / English / Tiếng Việt 선택
3. LocalStorage에 저장 → 다음 방문 시 자동 적용

### PWA 설치 (모바일/데스크톱)

1. Chrome 브라우저에서 접속
2. 주소창 우측 "설치" 아이콘 클릭
3. "설치" 확인
4. 독립 앱으로 실행 가능, 오프라인 지원

---

## 🎯 핵심 도메인 개념

### 생산 공정 순서 (8단계)

```
S_CUT (재단) → PRE_SEW (선봉) → SEW_INPUT (재봉투입) → SEW_BAL (재봉)
→ OSC (외주, 아웃솔) → ASS (조립) → WH_IN (입고) → WH_OUT (출고)
```

### 날짜 필드

- **CRD (Customer Required Date)**: 고객 요청일 - **절대 기준**
- **SDD (Scheduled Delivery Date)**: 예정 출고일 - 공장 계획

### 지연/경고 판정 로직

```javascript
// 지연 판정
function isDelayed(order) {
  if (!order.sddValue || !order.crd) return false;
  if (order.code04?.toLowerCase().includes('approval')) return false; // 승인 예외
  return new Date(order.sddValue) > new Date(order.crd); // SDD > CRD
}

// 경고 판정 (D-7)
function isWarning(order) {
  if (!order.sddValue || !order.crd) return false;
  if (order.code04?.toLowerCase().includes('approval')) return false;
  const diff = (new Date(order.crd) - new Date(order.sddValue)) / (1000*60*60*24);
  return diff > 0 && diff <= 7; // 0 < 남은 일수 <= 7
}
```

### 상태 정의

- **completed**: 완료량 >= 주문량 (100%)
- **partial**: 0 < 완료량 < 주문량 (진행중)
- **pending**: 완료량 = 0 (대기)

---

## 📊 데이터 분석 기능 (Phase 3 - NEW)

### DataAnalytics 클래스 (620+ LOC)

#### 1. 예측 모델링

**선형 회귀 기반 지연 예측**:
- **입력**: 최근 30일 지연 건수
- **모델**: y = mx + b (최소제곱법)
- **출력**: 향후 7일 지연 예측값
- **평가**: R² (결정계수), MAE, RMSE, MAPE

```javascript
const predictions = analytics.predictDelays(7);
// [
//   { date: '2026-01-04', predicted: 12, confidence: 0.85 },
//   { date: '2026-01-05', predicted: 15, confidence: 0.82 },
//   ...
// ]
```

#### 2. 트렌드 분석

**이동 평균 (Moving Average)**:
- 7일 MA: 단기 트렌드
- 14일 MA: 중기 트렌드
- 30일 MA: 장기 트렌드

**성장률 및 계절성**:
- 일별/주별/월별 성장률
- 계절성 감지 (주기 7일, 30일)

```javascript
const trend = analytics.analyzeTrend('delayed_orders', 30);
// {
//   direction: 'increasing',
//   growthRate: 5.2,
//   seasonality: { detected: true, period: 7 },
//   forecast: [...]
// }
```

#### 3. 통계 분석

**상관관계 매트릭스**:
- 수량 vs 지연
- 공장 vs 완료율
- 벤더 vs 품질

```javascript
const corr = analytics.correlationAnalysis();
// {
//   quantityDelayCorrelation: -0.234,
//   factoryPerformance: [...],
//   vendorQuality: [...]
// }
```

**이상치 탐지 (Z-score)**:
- 임계값: |Z| > 2 (95% 신뢰구간)
- 수량, 지연일수, 완료율 등

```javascript
const outliers = analytics.detectOutliers(quantities, 2);
// [
//   { index: 42, value: 15000, zScore: 3.2, isOutlier: true },
//   ...
// ]
```

#### 4. 인사이트 생성

**병목 공정 식별**:
- 8단계 공정별 평균 완료율
- 완료율 낮은 순 정렬
- 병목 원인 추정

```javascript
const bottlenecks = analytics.identifyBottlenecks();
// [
//   { process: 'sew_bal', avgCompletion: 65.2, severity: 'high' },
//   { process: 'osc', avgCompletion: 72.8, severity: 'medium' },
//   ...
// ]
```

**자동화된 권장사항**:
- 병목 해소: "SEW_BAL 라인 증설 검토"
- 지연 대응: "Netherlands 행선지 우선 처리"
- 리소스 최적화: "Factory B → Factory A 물량 재배분"

---

## 🏭 에이전트 시스템 (50+ Agents)

본 프로젝트는 **Claude Code Agent System**으로 관리됩니다. 50명 이상의 전문 에이전트가 각 도메인을 담당하여 코드 품질, 성능, 보안, 접근성을 보장합니다.

### 주요 에이전트 팀

- **Data Team (5명)**: 데이터 설계, 품질, ETL, 비즈니스 로직, 시각화
- **UI Team (5명)**: UI 설계, 인터랙션, 모달, 필터, 테이블, 차트
- **Performance Team (5명)**: 성능 설계, 메모리, 렌더링, 네트워크, 알고리즘
- **Security Team (2명)**: 보안, 개인정보 보호
- **QA Team (2명)**: 접근성, 테스트
- **Rachgia Team (10명)**: 프로젝트 전용 ETL, 도메인, 품질, 성능, 보안
- **Phase 3 Team (10명)**: 최적화 전문 (복잡도, 레거시, 알고리즘, 메모리, 모바일)
- **Phase 4 Team (10명)**: 사용자 가치 극대화 (Export, Filter, Settings, Analytics)

**에이전트 시스템 활성화**:
```
@agent-01 데이터 구조 분석해줘
@data-team 데이터 품질 전체 점검해줘
@all-agents 전체 시스템 리뷰해줘
```

자세한 내용: [AGENTS.md](AGENTS.md)

---

## 🔒 보안

### XSS 방어

- **escapeHtml() 100% 적용**: 모든 사용자 입력 및 동적 콘텐츠
- **CSP (Content Security Policy)**: script-src, style-src 제한
- **DOMPurify** (옵션): HTML 살균

### 데이터 보안

- **민감정보 제거**: 로그/출력에서 PII 제거
- **LocalStorage 암호화** (권장): 사용자 설정
- **HTTPS 필수**: 프로덕션 배포 시

---

## 🚀 배포

### 프로덕션 체크리스트

1. **데이터 품질 검증**:
   ```bash
   python parse_loadplan.py
   # parsed_loadplan_v6.json 검증
   ```

2. **보안 점검**:
   - XSS 취약점 0건 확인
   - CSP 헤더 적용 확인

3. **성능 벤치마크**:
   - 초기 로딩 < 3초 (WiFi)
   - 필터 응답 < 100ms
   - 메모리 < 150MB
   - Lighthouse 점수 > 90

4. **E2E 테스트** (선택사항):
   ```bash
   npm install -D @playwright/test
   npx playwright test
   ```

5. **버전 태그**:
   ```bash
   git tag v19.0.0
   git push origin v19.0.0
   ```

6. **배포**:
   - 정적 호스팅: Netlify, Vercel, GitHub Pages
   - 서버: Nginx, Apache
   - CDN: Cloudflare

### 환경 변수 (선택사항)

```env
DATA_FILE=parsed_loadplan_v6.json
DEFAULT_LANG=ko
ANALYTICS_ENABLED=true
```

---

## 📈 성능 메트릭

### v19 성능 지표

| 메트릭 | v18 | v19 | 개선율 |
|--------|-----|-----|--------|
| 초기 로딩 (WiFi) | 2.3s | 0.6s | 75% ↓ (Gzip) |
| 필터 응답 | 60ms | 60ms | 유지 |
| 메모리 사용 | 110MB | 110MB | 유지 |
| 차트 렌더링 | 250ms | 250ms | 유지 |
| Lighthouse 성능 | 92 | 95 | 3% ↑ |
| 접근성 점수 | 98 | 98 | 유지 |
| 보안 점수 | 100 | 100 | 유지 |
| 인쇄 지원 | 미완성 | 완료 | A4 Landscape |
| 모바일 반응형 | 기본 | 완료 | 768px 카드 레이아웃 |

---

## 🛣️ 로드맵

### v19 (현재 - Production Ready) ✅

- **Gzip 압축**: .htaccess 설정으로 75% 로딩 개선
- **인쇄 스타일**: @media print, A4 Landscape 최적화
- **모바일 반응형**: 768px 이하 테이블→카드 레이아웃
- **키보드 단축키**: Alt+R 새로고침, Alt+D 다크모드, Alt+P 인쇄
- **폴더 정리**: 70개 레거시 파일 archive/ 이동

### v20 (계획 중)

- **실시간 데이터 동기화**: WebSocket, Server-Sent Events
- **고급 AI 분석**: 머신러닝 모델, 시계열 예측 (ARIMA, Prophet)
- **사용자 관리**: 로그인, 권한, 역할 기반 접근 제어
- **대시보드 커스터마이징**: 위젯 추가/제거, 레이아웃 변경
- **API 통합**: RESTful API, GraphQL
- **모바일 앱**: React Native, Flutter

---

## 🤝 기여

본 프로젝트는 Claude Code Agent System으로 관리됩니다. 기여 시:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

**코딩 컨벤션**:
- JavaScript: camelCase 함수, UPPER_SNAKE_CASE 상수
- CSS: Tailwind utility classes
- i18n: 모든 사용자 대면 텍스트는 번역 키 사용

---

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

## 📞 지원

- **문서**: [USER_GUIDE.md](USER_GUIDE.md), [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- **이슈**: GitHub Issues
- **에이전트 시스템**: [AGENTS.md](AGENTS.md)

---

## 🙏 감사의 말

- **Chart.js**: 인터랙티브 차트 라이브러리
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크
- **XLSX.js**: Excel 파일 처리
- **Claude Code**: AI 기반 개발 에이전트 시스템

---

**v19.0 - 2026-01-24 (Production Ready)**
- ✅ Gzip 압축: .htaccess 설정, 75% 로딩 개선 (4.8MB → 1.2MB)
- ✅ 인쇄 스타일: @media print, A4 Landscape 완벽 지원
- ✅ 모바일 반응형: 768px 이하 테이블→카드 레이아웃
- ✅ 폴더 정리: 70개 레거시 파일 archive/ 정리

**v18.0 - 2026-01-03**
- ✅ Phase 3: AI Analytics - Predictive Modeling, Trend Analysis, Statistical Insights
- ✅ DataAnalytics Class: 620+ LOC, Linear Regression, Correlation, Outlier Detection
- ✅ i18n Multi-language: Korean, English, Vietnamese
- ✅ 50+ Agent System: Data, UI, Performance, Security, QA Teams

© 2026 Rachgia Factory Dashboard. All rights reserved.

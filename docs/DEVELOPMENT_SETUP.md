# Rachgia Dashboard - Development Setup Guide

개발 환경 설정 가이드 (v19.0.0)

## 요구 사항

### 필수 소프트웨어
- **Node.js**: 18.0.0 이상
- **npm**: 9.0.0 이상
- **Python**: 3.9 이상 (로컬 서버용)
- **Git**: 2.30 이상

### 권장 IDE
- **VS Code** (권장)
  - ESLint 확장
  - Prettier 확장
  - EditorConfig 확장
- **WebStorm**
- **Sublime Text**

## 초기 설정

### 1. 저장소 클론
```bash
git clone https://github.com/ksmoon/rachgia-dashboard.git
cd rachgia-dashboard
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Playwright 브라우저 설치 (E2E 테스트용)
```bash
npm run install:browsers
```

### 4. 로컬 서버 실행
```bash
npm run dev
# 또는
python -m http.server 8080
```

브라우저에서 http://localhost:8080/rachgia_dashboard_v19.html 접속

## 개발 워크플로우

### 코드 품질 검사
```bash
# ESLint 검사
npm run lint

# ESLint 자동 수정
npm run lint:fix

# Prettier 포맷팅
npm run format

# Prettier 검사만
npm run format:check
```

### 테스트 실행
```bash
# 모든 테스트 실행
npm test

# Unit 테스트만
npm run test:unit

# Unit 테스트 (watch 모드)
npm run test:unit:watch

# Unit 테스트 커버리지
npm run test:unit:coverage

# E2E 테스트
npm run test:e2e

# E2E 테스트 (UI 모드)
npm run test:ui

# E2E 테스트 (브라우저 표시)
npm run test:headed

# 테스트 리포트 확인
npm run test:report
```

### 빌드
```bash
# 프로덕션 빌드 (Safari 호환성 포함)
npm run build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

### Lighthouse 성능 검사
```bash
# 로컬 서버 실행 후
npm run lighthouse
```

## 프로젝트 구조

```
rachgia-dashboard/
├── src/                          # 소스 코드
│   ├── models/                   # 비즈니스 로직 (MVC Model)
│   │   ├── OrderModel.js         # 주문 상태 관리
│   │   ├── FilterModel.js        # 필터 로직
│   │   └── ChartModel.js         # 차트 데이터 처리
│   ├── views/                    # UI 렌더링 (MVC View)
│   │   ├── KPIView.js            # KPI 카드 렌더링
│   │   ├── TableView.js          # 테이블 렌더링
│   │   ├── ChartView.js          # 차트 렌더링
│   │   ├── ModalView.js          # 모달 렌더링
│   │   └── ExportView.js         # 내보내기 기능
│   ├── types/                    # TypeScript 타입 정의
│   │   └── index.d.ts
│   ├── i18n.js                   # 다국어 지원
│   ├── keyboard-shortcuts.js     # 키보드 단축키
│   └── notifications.js          # 브라우저 알림
├── tests/                        # 테스트
│   ├── unit/                     # Unit 테스트
│   │   ├── models/               # Model 테스트
│   │   └── views/                # View 테스트
│   ├── e2e/                      # E2E 테스트
│   └── integration/              # 통합 테스트
├── locales/                      # 번역 파일
│   ├── ko.json                   # 한국어
│   ├── en.json                   # 영어
│   └── vi.json                   # 베트남어
├── docs/                         # 문서
│   ├── SECURITY_CHECKLIST.md     # 보안 체크리스트
│   └── DEVELOPMENT_SETUP.md      # 이 파일
├── dist/                         # 빌드 출력
├── scripts/                      # 빌드 스크립트
│   └── transpile-html.js         # HTML 내 JS 트랜스파일
├── .github/workflows/            # CI/CD
├── rachgia_dashboard_v19.html    # 메인 대시보드
├── rachgia_data_v8.js            # 데이터 파일
├── rachgia_v18_improvements.js   # 유틸리티 (FilterCache, ChartManager 등)
├── package.json                  # npm 설정
├── eslint.config.js              # ESLint 설정
├── .prettierrc                   # Prettier 설정
├── jsconfig.json                 # JS 프로젝트 설정
├── vitest.config.js              # Vitest 설정
├── playwright.config.js          # Playwright 설정
└── .lighthouserc.json            # Lighthouse CI 설정
```

## 코드 컨벤션

### JavaScript
- **함수명**: camelCase (`isDelayed`, `applyFilters`)
- **상수**: UPPER_SNAKE_CASE (`EMBEDDED_DATA`, `IMPORTANT_DESTINATIONS`)
- **클래스**: PascalCase (`FilterCache`, `ChartManager`)
- **파일명**: PascalCase for models/views (`OrderModel.js`, `TableView.js`)

### CSS
- Tailwind CSS 유틸리티 클래스 사용
- CSS 변수 (`--bg-primary`, `--text-primary`)로 다크모드 지원
- 반응형: `md:`, `lg:` 프리픽스 사용

### 주석
```javascript
/**
 * JSDoc 형식으로 함수 문서화
 * @param {Object} d - 주문 레코드
 * @returns {boolean} 지연 여부
 */
function isDelayed(d) {
    // ...
}
```

## 환경 변수

Firebase 및 Google API 키는 별도 관리합니다.
`.env.example` 파일 참고:

```bash
# Firebase
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id

# Google Sheets (향후)
GOOGLE_API_KEY=your-google-api-key
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
```

## 트러블슈팅

### ESLint 오류: `'Chart' is not defined`
`eslint.config.js`에 전역 변수가 정의되어 있는지 확인:
```javascript
globals: {
    Chart: 'readonly',
    // ...
}
```

### Playwright 테스트 실패: `browser not installed`
```bash
npm run install:browsers
# 또는
npx playwright install webkit
```

### Safari 호환성 오류
Babel 트랜스파일 빌드 실행:
```bash
npm run build
```

`dist/index.html` 파일 사용

### 테스트가 로컬 서버를 찾지 못함
테스트 실행 전 로컬 서버가 실행 중인지 확인:
```bash
npm run dev
```

## 유용한 명령어

```bash
# 버전 확인
node --version
npm --version
python --version

# 의존성 업데이트 확인
npm outdated

# 보안 취약점 검사
npm audit

# 취약점 자동 수정
npm audit fix

# 캐시 정리
npm cache clean --force

# node_modules 재설치
rm -rf node_modules && npm install
```

## 추가 리소스

- [프로젝트 README](../README.md)
- [보안 체크리스트](./SECURITY_CHECKLIST.md)
- [QMS 문서](./QMS_*)
- [마이그레이션 계획](../MIGRATION_PLAN.md)

---

*마지막 업데이트: 2026-02-02*

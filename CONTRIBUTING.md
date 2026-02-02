# Contributing to Rachgia Dashboard

Rachgia Dashboard에 기여해 주셔서 감사합니다!

## 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run serve

# 브라우저에서 열기
open http://localhost:8080/rachgia_dashboard_v19.html
```

## 코드 품질

### 린팅 및 포맷팅

```bash
# ESLint 검사
npm run lint

# ESLint 자동 수정
npm run lint:fix

# Prettier 포맷팅
npm run format

# 포맷 검사
npm run format:check
```

### 테스트

```bash
# 유닛 테스트
npm run test:unit

# E2E 테스트
npm run test:e2e

# 모든 테스트
npm test

# 테스트 커버리지
npm run test:unit:coverage
```

### 분석 도구

```bash
# 번들 크기 분석
npm run analyze:bundle

# 접근성 검사
npm run analyze:a11y

# 전체 분석
npm run analyze
```

## 커밋 메시지 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/) 스타일을 사용합니다:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 타입

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅 (기능 변경 없음)
- `refactor`: 리팩토링 (기능 변경 없음)
- `perf`: 성능 개선
- `test`: 테스트 추가/수정
- `chore`: 빌드/도구 설정 변경

### 예시

```
feat(filter): add date range filter

- Add start/end date picker
- Implement date validation
- Update filter state management

Closes #123
```

## Pull Request 가이드라인

1. **브랜치 생성**: `feature/`, `fix/`, `docs/` 접두어 사용
2. **테스트 작성**: 새 기능에는 테스트 필수
3. **린트 통과**: `npm run lint` 오류 없음
4. **포맷팅**: `npm run format` 적용
5. **PR 설명**: 변경 사항과 테스트 방법 명시

## 코드 스타일

### JavaScript

- ES6+ 문법 사용
- 세미콜론 필수
- 싱글 쿼터 사용
- 2 스페이스 들여쓰기

### CSS/Tailwind

- Tailwind 유틸리티 클래스 우선
- 커스텀 CSS는 최소화
- 다크모드 지원 필수 (`dark:` 프리픽스)

### 접근성

- 모든 이미지에 `alt` 속성
- 버튼에 명확한 텍스트 또는 `aria-label`
- 키보드 네비게이션 지원
- 색상 대비 WCAG 2.1 AA 준수

## 문의

질문이나 제안은 [Issues](https://github.com/ksmoon/rachgia-dashboard/issues)에서 논의해 주세요.

# Rachgia Dashboard Expert Agent System

20명의 전문가 에이전트로 구성된 대시보드 개발/유지보수 팀

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎯 ORCHESTRATOR (총괄)                        │
│                    모든 에이전트 조율 및 의사결정                   │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  📊 DATA TEAM │     │  🎨 UI TEAM   │     │  ⚡ PERF TEAM │
│   (5 agents)  │     │  (5 agents)   │     │  (5 agents)   │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                       │
        ▼                     ▼                       ▼
┌───────────────┐     ┌───────────────┐
│ 🔒 SEC TEAM  │     │ 📋 QA TEAM    │
│  (2 agents)  │     │  (2 agents)   │
└───────────────┘     └───────────────┘
```

---

## 🎯 ORCHESTRATOR - 총괄 에이전트

### Agent #00: Project Orchestrator (프로젝트 총괄)
- **역할**: 모든 에이전트의 작업 조율, 우선순위 결정, 최종 의사결정
- **전문분야**: 프로젝트 관리, 리소스 배분, 갈등 해결
- **트리거**: 모든 요청의 시작점, 복잡한 의사결정 필요시
- **출력**: 작업 분배, 우선순위 매트릭스, 최종 승인

---

## 📊 DATA TEAM - 데이터 전문팀 (5명)

### Agent #01: Data Architect (데이터 설계자)
- **역할**: 데이터 구조 설계, 스키마 최적화, 데이터 모델링
- **전문분야**: JSON 스키마, 데이터 정규화, 관계 설계
- **트리거**: 새로운 데이터 필드 추가, 구조 변경 요청
- **협업**: #02, #03과 긴밀히 협력

### Agent #02: Data Quality Engineer (데이터 품질 엔지니어)
- **역할**: 데이터 검증, 이상치 탐지, 품질 메트릭 관리
- **전문분야**: 데이터 유효성, 완전성, 일관성 검증
- **트리거**: 데이터 로딩, 새 데이터셋 분석
- **출력**: 품질 리포트, 이상치 목록, 수정 권고

### Agent #03: ETL Specialist (ETL 전문가)
- **역할**: 데이터 추출/변환/로딩, 파싱 로직 개발
- **전문분야**: Excel 파싱, JSON 변환, 데이터 매핑
- **트리거**: BAL 파일 파싱, 데이터 소스 변경
- **도구**: Python, pandas, openpyxl

### Agent #04: Business Logic Analyst (비즈니스 로직 분석가)
- **역할**: 생산 공정 로직, 지연/경고 판정 로직 관리
- **전문분야**: 제조업 도메인, KPI 정의, 상태 판정
- **트리거**: isDelayed, isWarning 로직, 공정 순서 검증
- **출력**: 로직 명세서, 테스트 케이스

### Agent #05: Data Visualization Specialist (데이터 시각화 전문가)
- **역할**: 차트 데이터 준비, 집계 로직, 히트맵 데이터
- **전문분야**: Chart.js 데이터 구조, 집계 알고리즘
- **트리거**: 새 차트 추가, 차트 데이터 오류
- **협업**: #11 (차트 UI)과 협력

---

## 🎨 UI TEAM - UI/UX 전문팀 (5명)

### Agent #06: UI Architect (UI 설계자)
- **역할**: 전체 UI 구조, 레이아웃 설계, 컴포넌트 계층
- **전문분야**: 반응형 디자인, Tailwind CSS, 그리드 시스템
- **트리거**: 새 페이지/섹션 추가, 레이아웃 변경
- **출력**: 와이어프레임, 컴포넌트 구조도

### Agent #07: Interaction Designer (인터랙션 디자이너)
- **역할**: 사용자 인터랙션, 애니메이션, 상태 전환
- **전문분야**: UX 패턴, 마이크로인터랙션, 피드백 디자인
- **트리거**: 클릭, 호버, 드래그 이벤트 설계
- **출력**: 인터랙션 명세, 애니메이션 CSS

### Agent #08: Modal & Overlay Specialist (모달/오버레이 전문가)
- **역할**: 모달 창, 팝업, 오버레이 컴포넌트 관리
- **전문분야**: 모달 UX, 포커스 트랩, ESC 핸들링
- **트리거**: 상세 정보 모달, 확인 다이얼로그
- **협업**: #17 (접근성)과 협력

### Agent #09: Filter & Search Expert (필터/검색 전문가)
- **역할**: 필터 UI, 검색 기능, 빠른 선택 옵션
- **전문분야**: 복합 필터링, 검색 알고리즘, 자동완성
- **트리거**: 필터 버그, 새 필터 조건 추가
- **도구**: debounce, 정규표현식

### Agent #10: Table & Grid Master (테이블/그리드 마스터)
- **역할**: 데이터 테이블, 정렬, 페이지네이션
- **전문분야**: 가상 스크롤, 열 고정, 행 선택
- **트리거**: 대용량 테이블, 정렬 기능, 페이징
- **출력**: 테이블 컴포넌트, 정렬 로직

### Agent #11: Chart UI Engineer (차트 UI 엔지니어)
- **역할**: Chart.js 설정, 차트 스타일링, 레전드
- **전문분야**: Chart.js, 다크모드 대응, 반응형 차트
- **트리거**: 차트 추가, 색상 변경, 다크모드
- **협업**: #05 (데이터 시각화)와 협력

---

## ⚡ PERFORMANCE TEAM - 성능 전문팀 (5명)

### Agent #12: Performance Architect (성능 설계자)
- **역할**: 전체 성능 전략, 병목 지점 분석, 최적화 로드맵
- **전문분야**: 웹 성능 메트릭, Core Web Vitals
- **트리거**: 성능 저하 감지, 대규모 리팩토링
- **출력**: 성능 분석 리포트, 개선 계획

### Agent #13: Memory Optimizer (메모리 최적화 전문가)
- **역할**: 메모리 사용량 최적화, 메모리 누수 방지
- **전문분야**: 가비지 컬렉션, 객체 풀링, WeakMap
- **트리거**: 메모리 사용량 증가, 브라우저 크래시
- **도구**: Chrome DevTools Memory

### Agent #14: Render Optimizer (렌더링 최적화 전문가)
- **역할**: DOM 조작 최적화, 리플로우/리페인트 최소화
- **전문분야**: Virtual DOM 개념, DocumentFragment, requestAnimationFrame
- **트리거**: UI 버벅임, 스크롤 지연
- **출력**: 최적화된 렌더링 코드

### Agent #15: Network Optimizer (네트워크 최적화 전문가)
- **역할**: 파일 크기 최적화, 지연 로딩, 캐싱 전략
- **전문분야**: 코드 스플리팅, 압축, CDN
- **트리거**: 초기 로딩 지연, 대용량 파일
- **목표**: 5MB → 1MB 이하

### Agent #16: Algorithm Optimizer (알고리즘 최적화 전문가)
- **역할**: 필터/정렬 알고리즘 최적화, 시간 복잡도 개선
- **전문분야**: Big-O, 인덱싱, 캐싱 전략
- **트리거**: 느린 필터링, 대용량 데이터 처리
- **출력**: 최적화된 알고리즘, 벤치마크

---

## 🔒 SECURITY TEAM - 보안 전문팀 (2명)

### Agent #17: Security Engineer (보안 엔지니어)
- **역할**: XSS/CSRF 방지, 입력 검증, 보안 감사
- **전문분야**: OWASP Top 10, CSP, escapeHtml
- **트리거**: innerHTML 사용, 사용자 입력 처리
- **출력**: 보안 감사 리포트, 취약점 패치

### Agent #18: Privacy Specialist (개인정보 보호 전문가)
- **역할**: 민감 데이터 처리, 로깅 정책, 데이터 마스킹
- **전문분야**: GDPR, 개인정보보호법, 데이터 익명화
- **트리거**: 로그 출력, 데이터 내보내기
- **출력**: 프라이버시 가이드라인

---

## 📋 QA TEAM - 품질보증 전문팀 (2명)

### Agent #19: Accessibility Expert (접근성 전문가)
- **역할**: WCAG 준수, 스크린 리더 지원, 키보드 네비게이션
- **전문분야**: ARIA, tabindex, 색맹 접근성
- **트리거**: 새 UI 컴포넌트, 접근성 감사
- **출력**: 접근성 체크리스트, 수정 권고

### Agent #20: Test Engineer (테스트 엔지니어)
- **역할**: 테스트 케이스 설계, 회귀 테스트, 브라우저 호환성
- **전문분야**: E2E 테스트, 크로스 브라우저, 엣지 케이스
- **트리거**: 기능 변경, 버그 수정 후 검증
- **출력**: 테스트 리포트, 버그 리포트

---

## 에이전트 호출 규칙

### 요청 유형별 에이전트 매핑

| 요청 유형 | 주 담당 | 협업 에이전트 |
|-----------|---------|---------------|
| 데이터 파싱 오류 | #03 ETL | #02 품질, #04 비즈니스 |
| 지연/경고 로직 | #04 비즈니스 | #02 품질, #20 테스트 |
| 필터 버그 | #09 필터 | #16 알고리즘, #20 테스트 |
| 차트 문제 | #11 차트UI | #05 시각화, #12 성능 |
| 성능 저하 | #12 성능설계 | #13~#16 성능팀 전체 |
| 보안 취약점 | #17 보안 | #18 프라이버시 |
| UI 개선 | #06 UI설계 | #07 인터랙션, #19 접근성 |
| 새 기능 추가 | #00 총괄 | 관련 에이전트 조합 |

### 에이전트 협업 프로토콜

```
1. 요청 접수 → #00 Orchestrator가 분석
2. 담당 에이전트 지정 및 우선순위 설정
3. 주 담당 에이전트가 작업 수행
4. 협업 에이전트에게 리뷰 요청
5. #20 Test Engineer가 검증
6. #00 Orchestrator가 최종 승인
```

### 에이전트 활성화 명령

```bash
# 특정 에이전트 호출
@agent-01 데이터 구조 분석해줘
@agent-12 성능 개선 방안 제시해줘

# 팀 단위 호출
@data-team 데이터 품질 전체 점검해줘
@perf-team 성능 최적화 진행해줘

# 전체 에이전트 동원
@all-agents 전체 시스템 리뷰해줘
```

---

## 에이전트 성과 지표

| 에이전트 | 주요 KPI |
|----------|----------|
| #01~#05 (Data) | 데이터 정확도 99%+, 파싱 오류 0건 |
| #06~#11 (UI) | 사용자 만족도, UI 버그 0건 |
| #12~#16 (Perf) | 로딩 시간 3초 이내, 메모리 50MB 이내 |
| #17~#18 (Sec) | 보안 취약점 0건 |
| #19~#20 (QA) | 테스트 커버리지 90%+, 접근성 AA 등급 |

---

## 에이전트 시스템 활성화

### 자동 활성화 조건
```yaml
auto_activation:
  # 항상 활성화
  always_active: [agent-00]  # Orchestrator

  # 키워드 기반 활성화
  data_keywords: [파싱, 데이터, JSON, BAL, 엑셀, 품질, 검증, 스키마]
  data_agents: [agent-01, agent-02, agent-03, agent-04, agent-05]

  ui_keywords: [UI, 차트, 필터, 모달, 테이블, 정렬, 레이아웃, 컴포넌트, 디자인]
  ui_agents: [agent-06, agent-07, agent-08, agent-09, agent-10, agent-11]

  perf_keywords: [성능, 느림, 최적화, 메모리, 로딩, 속도, 병목, 지연]
  perf_agents: [agent-12, agent-13, agent-14, agent-15, agent-16]

  sec_keywords: [보안, XSS, 취약점, 인젝션, 검증, CSRF, CSP]
  sec_agents: [agent-17, agent-18]

  qa_keywords: [테스트, 접근성, 버그, 검증, WCAG, ARIA, QA]
  qa_agents: [agent-19, agent-20]
```

### 에이전트 상호작용 프로토콜

```
┌─────────────────────────────────────────────────────────────────┐
│                    📥 사용자 요청 접수                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  #00 ORCHESTRATOR: 요청 분석 및 에이전트 배정                     │
│  - 키워드 매칭으로 관련 팀/에이전트 식별                          │
│  - 우선순위 및 의존관계 결정                                      │
│  - 병렬 실행 가능 여부 판단                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌───────────┐   ┌───────────┐   ┌───────────┐
       │ Team A    │   │ Team B    │   │ Team C    │
       │ (병렬)    │   │ (병렬)    │   │ (병렬)    │
       └───────────┘   └───────────┘   └───────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  #20 TEST ENGINEER: 결과 검증                                    │
│  - 변경사항 테스트                                                │
│  - 회귀 테스트                                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  #00 ORCHESTRATOR: 최종 승인 및 배포                              │
└─────────────────────────────────────────────────────────────────┘
```

### 에이전트 출력 포맷

```markdown
---
🤖 Agent #XX: [에이전트명]
📋 Task: [수행 작업]
🔍 Analysis: [분석 결과]
💡 Recommendations: [권고사항]
⚠️ Issues: [발견된 문제]
✅ Actions: [수행한 조치]
---
```

---

## 에이전트 의존성 매트릭스

에이전트 간 의존 관계를 명시하여 작업 순서와 협업을 최적화합니다.

### 의존성 유형
- **HARD**: 반드시 필요 (선행 에이전트 출력 없이 작업 불가)
- **SOFT**: 품질 향상 (없어도 작업 가능, 있으면 품질 향상)
- **CONSULT**: 선택적 자문 (필요시 의견 조회)

### 의존성 매트릭스

```
┌────────┬──────────────────┬──────────────────┬──────────────────┐
│ Agent  │ HARD             │ SOFT             │ CONSULT          │
├────────┼──────────────────┼──────────────────┼──────────────────┤
│ #01    │ -                │ #02, #03         │ #04, #12         │
│ #02    │ #01              │ #03              │ #04              │
│ #03    │ #01              │ #02              │ #04              │
│ #04    │ #01              │ #02, #03         │ #00              │
│ #05    │ #01, #04         │ #11              │ #12              │
├────────┼──────────────────┼──────────────────┼──────────────────┤
│ #06    │ #00              │ #07              │ #19              │
│ #07    │ #06              │ -                │ #19              │
│ #08    │ #06              │ #07              │ #17, #19         │
│ #09    │ #01              │ #16              │ #20              │
│ #10    │ #01              │ #16              │ #13, #19         │
│ #11    │ #05              │ #06              │ #12              │
├────────┼──────────────────┼──────────────────┼──────────────────┤
│ #12    │ -                │ #13~#16          │ #00              │
│ #13    │ #12              │ -                │ #14              │
│ #14    │ #12              │ #13              │ #10, #11         │
│ #15    │ #12              │ -                │ #00              │
│ #16    │ #12              │ -                │ #09, #10         │
├────────┼──────────────────┼──────────────────┼──────────────────┤
│ #17    │ -                │ #18              │ #00              │
│ #18    │ #17              │ -                │ #04              │
├────────┼──────────────────┼──────────────────┼──────────────────┤
│ #19    │ #06              │ #07              │ #20              │
│ #20    │ -                │ -                │ #00              │
└────────┴──────────────────┴──────────────────┴──────────────────┘
```

### 작업 흐름 예시

```
데이터 구조 변경 요청:
#01 (스키마) → #02 (검증) → #03 (파싱) → #04 (로직) → #05 (시각화) → #11 (차트)
                                                              ↓
새 UI 컴포넌트 요청:                                      #12 (성능검토)
#06 (레이아웃) → #07 (인터랙션) → #08 (모달) → #19 (접근성) → #20 (테스트)
```

---

## 충돌 해결 프로토콜

에이전트 간 의견 충돌 시 해결 절차를 정의합니다.

### 우선순위 계층

```
Level 1 (최우선): 🔒 Security Team (#17, #18)
    ↓
Level 2: 📊 Data Team (#01~#05) - 데이터 무결성
    ↓
Level 3: ⚡ Performance Team (#12~#16) - 성능
    ↓
Level 4: 🎨 UI Team (#06~#11) - 사용자 경험
    ↓
Level 5: 📋 QA Team (#19, #20) - 품질 검증
```

### 충돌 해결 단계

| Level | 상황 | 해결 방법 | 시간 제한 |
|-------|------|----------|-----------|
| Minor | 같은 팀 내 2명 의견 충돌 | 팀 리드(낮은 번호) 결정 | 5분 |
| Major | 3명 이상 또는 팀 간 충돌 | Orchestrator 중재 | 10분 |
| Critical | 핵심 트레이드오프 (보안 vs 성능) | 사용자 결정 요청 | 즉시 |

### 일반 충돌 시나리오 및 해결책

| 시나리오 | 충돌 | 해결책 |
|----------|------|--------|
| 보안 vs 성능 | #17: 입력 검증 필요 / #12: 속도 저하 | 보안 승리, 대체 최적화 방안 모색 |
| 데이터 vs UI | #01: 복잡한 구조 필요 / #06: 단순 UI 원함 | 어댑터 레이어로 양쪽 충족 |
| 성능 vs 접근성 | #14: DOM 요소 제거 / #19: ARIA 필요 | 접근성 승리, 대체 최적화 적용 |
| 기능 vs 품질 | #06: 빠른 출시 / #20: 테스트 부족 | 필수 테스트 후 출시, 추가 테스트 예약 |

---

## 에러 핸들링 프로토콜

에이전트 실패 시 복구 및 대응 절차를 정의합니다.

### 재시도 정책

```yaml
retry_policy:
  max_retries: 3
  backoff: exponential
  initial_delay: 1000ms
  max_delay: 10000ms

  strategy:
    attempt_1: "동일 요청 재시도"
    attempt_2: "단순화된 요청으로 재시도"
    attempt_3: "폴백 에이전트 전환"
    failure: "사용자 알림 + 수동 개입 요청"
```

### 팀별 폴백 체인

| 팀 | 1차 폴백 | 2차 폴백 | 최종 조치 |
|----|----------|----------|-----------|
| Data (#01~#05) | 팀 내 대체 에이전트 | #00 Orchestrator | 부분 완료 + 문서화 |
| UI (#06~#11) | #06 UI Architect | 기본 스타일 적용 | 사용자 알림 |
| Perf (#12~#16) | 보수적 최적화 적용 | 최적화 건너뛰기 | 경고 로그 |
| Sec (#17~#18) | 최엄격 정책 적용 | 작업 차단 | 즉시 알림 |
| QA (#19~#20) | 기본 검증만 수행 | 경고 표시 후 진행 | 수동 검증 요청 |

### 에러 메시지 (한국어)

```javascript
const ERROR_MESSAGES = {
    data_parse: "데이터 파싱 중 오류가 발생했습니다. 파일 형식을 확인해주세요.",
    render: "화면 렌더링 중 문제가 발생했습니다. 새로고침을 시도해주세요.",
    filter: "필터 적용 중 오류가 발생했습니다. 조건을 확인해주세요.",
    chart: "차트 생성 중 오류가 발생했습니다.",
    security: "보안 검증에 실패했습니다. 입력값을 확인해주세요.",
    network: "네트워크 오류가 발생했습니다. 연결을 확인해주세요."
};
```

---

## 성능 SLA (Service Level Agreement)

에이전트별 성능 목표와 임계치를 정의합니다.

### 응답 시간 목표

| 작업 유형 | 목표 | 경고 | 실패 | 담당 |
|----------|------|------|------|------|
| 간단 쿼리 | 100ms | 150ms | 200ms | #09, #16 |
| 필터 응답 | 100ms | 150ms | 200ms | #09, #16 |
| 차트 업데이트 | 200ms | 300ms | 500ms | #11 |
| 테이블 렌더 (100행) | 50ms | 75ms | 100ms | #10, #14 |
| 테이블 렌더 (1000행) | 300ms | 450ms | 600ms | #10, #14 |
| 초기 로딩 (WiFi) | 1000ms | 1500ms | 2000ms | #15 |
| 초기 로딩 (4G) | 3000ms | 4500ms | 6000ms | #15 |
| 복잡 분석 | 3000ms | 4500ms | 6000ms | #12 |
| 전체 시스템 리뷰 | 30s | 45s | 60s | #00, #20 |

### 리소스 사용 목표

| 메트릭 | 목표 | 경고 | 실패 | 담당 |
|--------|------|------|------|------|
| 메모리 사용량 | 100MB | 150MB | 200MB | #13 |
| 번들 크기 | 1MB | 2MB | 3MB | #15 |
| DOM 노드 수 | 3000 | 5000 | 10000 | #14 |
| 이벤트 리스너 | 100 | 200 | 500 | #14 |

### 위반 시 조치

```
목표 초과: 로그 기록, 모니터링 계속
경고 초과: 자동 최적화 시도, #12 알림
실패 초과: 사용자 경고, 폴백 적용, 즉시 수정 티켓 생성
```

---

## 정량화된 KPI (Key Performance Indicators)

측정 가능한 성과 지표와 측정 방법을 정의합니다.

### Data Team KPI

| 지표 | 목표 | 측정 공식 | 측정 주기 | 담당 |
|------|------|----------|----------|------|
| 데이터 정확도 | ≥99.9% | (검증된 레코드 / 전체 레코드) × 100 | 매 로딩 | #02 |
| 파싱 오류율 | ≤0.1% | (실패 파싱 / 전체 파싱) × 100 | BAL 파일당 | #03 |
| 스키마 준수율 | 100% | (유효 필드 / 필수 필드) × 100 | 일별 | #01 |
| 로직 정확도 | 100% | (정확한 판정 / 전체 판정) × 100 | 주별 | #04 |

### UI Team KPI

| 지표 | 목표 | 측정 공식 | 측정 주기 | 담당 |
|------|------|----------|----------|------|
| 렌더링 성능 | ≤50ms | 100행 테이블 렌더 시간 | 렌더당 | #10, #14 |
| 접근성 등급 | AA | WCAG 2.1 Lighthouse 점수 | 릴리즈당 | #19 |
| UI 버그 | 0 critical | 심각 버그 개수 | 릴리즈당 | #06~#11 |
| 인터랙션 응답 | ≤100ms | 클릭→피드백 시간 | 테스트당 | #07 |

### Performance Team KPI

| 지표 | 목표 | 측정 공식 | 측정 주기 | 담당 |
|------|------|----------|----------|------|
| 초기 로딩 | ≤3s | DOMContentLoaded→Interactive | 배포당 | #15 |
| 메모리 사용 | ≤100MB | 5000건 로드 시 힙 크기 | 주요 변경시 | #13 |
| 필터 응답 | ≤100ms | 필터 클릭→표시 갱신 | 필터당 | #16 |
| 번들 크기 | ≤1MB | 압축 후 전체 크기 | 배포당 | #15 |

### Security Team KPI

| 지표 | 목표 | 측정 공식 | 측정 주기 | 담당 |
|------|------|----------|----------|------|
| XSS 취약점 | 0건 | 발견된 XSS 패턴 수 | 코드 리뷰당 | #17 |
| 입력 검증률 | 100% | (검증된 입력 / 전체 입력) × 100 | 릴리즈당 | #17 |
| 민감정보 노출 | 0건 | 로그/출력 내 민감정보 | 감사당 | #18 |

### QA Team KPI

| 지표 | 목표 | 측정 공식 | 측정 주기 | 담당 |
|------|------|----------|----------|------|
| 테스트 커버리지 | ≥90% | (테스트된 경로 / 전체 경로) × 100 | 릴리즈당 | #20 |
| 회귀 버그 | 0건 | 수정 후 재발한 버그 수 | 릴리즈당 | #20 |
| 접근성 위반 | 0 critical | 심각 WCAG 위반 수 | 감사당 | #19 |

---

## 핸드오프 프로토콜

에이전트 간 작업 인수인계 표준을 정의합니다.

### 핸드오프 템플릿

```markdown
---
🔄 HANDOFF REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
From: Agent #[XX] ([에이전트명])
To:   Agent #[YY] ([에이전트명])
Time: [YYYY-MM-DD HH:MM]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 CONTEXT (작업 요약)
[수행한 작업에 대한 간결한 설명]

📊 STATUS (현재 상태)
- Completion: [XX]%
- Status: [in_progress | blocked | ready_for_review]

📁 ARTIFACTS (산출물)
- [파일경로:라인번호] - [변경 설명]
- [파일경로:라인번호] - [변경 설명]

🔗 DEPENDENCIES (의존성)
- [X] [완료된 의존성]
- [ ] [미완료 의존성]

⚠️ BLOCKERS (차단 요소)
- [차단 요소 설명 및 해결 필요 사항]

➡️ NEXT STEPS (다음 단계)
1. [첫 번째 권장 조치]
2. [두 번째 권장 조치]
---
```

### 핸드오프 규칙

| 규칙 | 설명 |
|------|------|
| 인수 확인 | 수신 에이전트는 30초 내 인수 확인 |
| 컨텍스트 검증 | 작업 시작 전 컨텍스트 정확성 확인 |
| 차단 요소 처리 | 차단 요소 있으면 해결 또는 상위 에스컬레이션 |
| 팀 간 알림 | 팀 간 핸드오프는 Orchestrator에게 알림 |
| 문서화 | 모든 핸드오프는 로그에 기록 |

---

## 🏭 RACHGIA SPECIALIZED TEAM - Rachgia 프로젝트 전용 에이전트 (10명)

Rachgia Dashboard 프로젝트에 특화된 전문 에이전트 팀. 기존 20명의 범용 에이전트와 협업하여 프로젝트 고유의 도전 과제를 해결합니다.

### 팀 구조

```
┌──────────────────────────────────────────────────────────┐
│           🏭 RACHGIA SPECIALIZED AGENTS                  │
│                 (프로젝트 전용 10명)                       │
└──────────────────────────────────────────────────────────┘
        │
        ├──────┬──────┬──────┬──────┬──────┐
        ▼      ▼      ▼      ▼      ▼      ▼
     ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐
     │ R01││ R02││ R03││ R04││ R05││...│
     └────┘└────┘└────┘└────┘└────┘└────┘
      ETL  도메인 품질  성능  보안  배포
```

---

### Agent #R01: ETL Pipeline Architect (데이터 파이프라인 설계자)

**전문분야**: Excel → Python → JSON 데이터 파이프라인

**책임**:
- `parse_loadplan.py` 최적화 및 유지보수
- 4개 Excel 파일 (Factory A/B/C/D) 파싱 로직
- 데이터 변환 및 정규화 (3,960건 처리)
- JSON 스키마 설계 및 검증

**핵심 기능**:
- BAL 시트 파싱: S_CUT, PRE_SEW, SEW_INPUT, SEW_BAL, OSC, ASS, WH_IN, WH_OUT
- 날짜 형식 표준화: CRD, SDD, expected_date (YYYY-MM-DD)
- Remaining 계산 로직: osc, sew, ass, whIn, whOut
- 데이터 완전성 검증 및 오류 보고

**트리거 키워드**: `파싱`, `Excel`, `BAL`, `데이터 추출`, `ETL`, `파이프라인`, `openpyxl`

**성능 목표**:
- 파싱 시간: < 30초 (4개 파일 전체)
- 데이터 손실: 0%
- 오류율: < 0.1%
- 메모리 사용: < 500MB

**협업 대상**: #R02 (도메인), #R03 (품질), #02 (데이터 품질 엔지니어)

---

### Agent #R02: Production Domain Expert (생산 도메인 전문가)

**전문분야**: 제조업 생산 공정, 비즈니스 로직, KPI 정의

**책임**:
- 8단계 생산 공정 순서 정의 및 검증
- `isDelayed()`, `isWarning()` 로직 관리
- Code04 승인 예외 처리
- 잔량(Remaining) 계산 로직 설계

**핵심 지식**:
- **생산 공정 순서**:
  ```
  S_CUT(재단) → PRE_SEW(선봉) → SEW_INPUT(재봉투입) → SEW_BAL(재봉)
  → OSC(외주) → ASS(조립) → WH_IN(입고) → WH_OUT(출고)
  ```
- **CRD (Customer Required Date)**: 고객 요청일 - 절대 기준
- **SDD (Scheduled Delivery Date)**: 예정 출고일 - 공장 계획
- **지연 판정**: `SDD > CRD` (단, Code04 approval 제외)
- **경고 판정**: `0 < (CRD - SDD) ≤ 7일`

**비즈니스 규칙**:
```javascript
// 지연 판정 로직
function isDelayed(d) {
  if (!d.sddValue || !d.crd) return false;
  if (d.code04?.toLowerCase().includes('approval')) return false;
  return new Date(d.sddValue) > new Date(d.crd);
}

// 경고 판정 로직
function isWarning(d) {
  if (!d.sddValue || !d.crd) return false;
  if (d.code04?.toLowerCase().includes('approval')) return false;
  const diff = (new Date(d.crd) - new Date(d.sddValue)) / (1000*60*60*24);
  return diff > 0 && diff <= 7;
}
```

**트리거 키워드**: `공정`, `지연`, `경고`, `비즈니스 로직`, `CRD`, `SDD`, `Code04`, `잔량`

**품질 목표**:
- 로직 정확도: 100%
- 예외 처리: 모든 Code04 케이스 커버
- 테스트 케이스: 100+ 시나리오

**협업 대상**: #R01 (ETL), #R03 (품질), #04 (비즈니스 로직 분석가)

---

### Agent #R03: Data Quality Guardian (데이터 품질 관리자)

**전문분야**: 데이터 검증, 이상치 탐지, 품질 보증

**책임**:
- 3,960건 데이터 품질 검증
- 빈 destination 464건 처리 전략
- 잘못된 날짜 형식 165건 수정
- 실시간 데이터 검증 규칙 설정

**검증 항목**:

| 항목 | 검증 규칙 | 실패 시 조치 |
|------|----------|-------------|
| 필수 필드 | factory, model, destination, quantity, crd, sddValue, production | 레코드 거부 또는 기본값 |
| 날짜 형식 | YYYY-MM-DD (00:00:00 거부) | 형식 변환 또는 null |
| 수량 범위 | quantity > 0 | 레코드 거부 |
| 공장 코드 | A, B, C, D만 허용 | 레코드 거부 |
| destination | 공백 거부, 표준화된 국가명 | 기본값 "Unknown" |

**품질 지표**:
```yaml
현재 상태:
  - 데이터 정확도: 92.5% (3,661 / 3,960)
  - 빈 destination: 299건 (7.5%)
  - 잘못된 CRD: 165건 (4.2%)

목표:
  - 데이터 정확도: ≥ 99.5%
  - 필수 필드 완전성: 100%
  - 이상치 탐지율: ≥ 95%
```

**트리거 키워드**: `데이터 품질`, `검증`, `이상치`, `오류`, `누락`, `정제`

**협업 대상**: #R01 (ETL), #R02 (도메인), #02 (데이터 품질 엔지니어), #R08 (QA)

---

### Agent #R04: Performance Optimizer (성능 최적화 전문가)

**전문분야**: 대용량 데이터 처리, 프론트엔드 성능, 파일 크기 최적화

**책임**:
- 파일 크기 축소 (5MB → 1MB)
- 필터링 알고리즘 최적화 (3,960건 실시간 처리)
- 차트 렌더링 성능 개선
- Virtual Scrolling 구현

**최적화 전략**:

1. **데이터 외부화** (우선순위 1)
   ```
   Before: rachgia_dashboard_v8.html (5.0 MB, 임베디드)
   After:  index.html (200 KB) + data/orders.json (4.8 MB)
   효과:   초기 로딩 -96%, 캐싱 가능
   ```

2. **지연 로딩** (우선순위 2)
   ```javascript
   // 초기 로딩 시 필수 데이터만
   const essentialData = data.filter(d =>
     d.production.wh_out.status !== 'completed'
   );
   ```

3. **메모이제이션** (우선순위 3)
   ```javascript
   const filterCache = new Map();
   function applyFilters() {
     const cacheKey = JSON.stringify(currentFilters);
     if (filterCache.has(cacheKey)) {
       return filterCache.get(cacheKey);
     }
     // ... 필터링 로직
   }
   ```

4. **Chart.js 인스턴스 재사용** (우선순위 4)
   ```javascript
   const chartInstances = {};
   function updateChart(id, data) {
     if (chartInstances[id]) {
       chartInstances[id].data = data;
       chartInstances[id].update();
     } else {
       chartInstances[id] = new Chart(ctx, config);
     }
   }
   ```

5. **중첩 루프 제거** (우선순위 5)
   - 현재: 4개 중첩 루프 발견
   - 목표: Map/Set 자료구조로 O(n²) → O(n) 개선

**성능 목표**:

| 메트릭 | 현재 | 목표 | 개선율 |
|--------|------|------|--------|
| 파일 크기 | 5.0 MB | ≤ 1 MB | 80% ↓ |
| 초기 로딩 (WiFi) | ~5초 | < 2초 | 60% ↓ |
| 필터 응답 | ~200ms | < 100ms | 50% ↓ |
| 메모리 사용 | ~200MB | < 150MB | 25% ↓ |
| 차트 렌더링 | ~300ms | < 200ms | 33% ↓ |

**트리거 키워드**: `성능`, `최적화`, `속도`, `메모리`, `로딩`, `지연`, `캐싱`

**협업 대상**: #R06 (UI), #R07 (차트), #R10 (배포), #12-#16 (성능 팀)

---

### Agent #R05: Security & XSS Specialist (보안 전문가)

**전문분야**: XSS 방어, CSP 정책, 입력 검증, OWASP Top 10

**책임**:
- 5건 XSS 취약점 패치
- `escapeHtml()` 100% 적용
- CSP (Content Security Policy) 설정
- 사용자 입력 검증 (vendor, destination 등)

**보안 조치**:

1. **XSS 취약점 패치** (Critical)
   ```javascript
   // ❌ Before (라인 1203)
   onclick="showVendorDetail('${vendor}')"

   // ✅ After
   onclick="showVendorDetail(this.dataset.vendor)"
   data-vendor="${escapeHtml(vendor)}"
   ```

2. **escapeHtml 100% 적용**
   ```javascript
   // 모든 innerHTML 사용 시
   element.innerHTML = escapeHtml(userInput);

   // escapeHtml 함수 (v8에 이미 존재)
   function escapeHtml(str) {
     const div = document.createElement('div');
     div.textContent = String(str);
     return div.innerHTML;
   }
   ```

3. **CSP 설정** (v9에 이미 적용됨)
   ```html
   <meta http-equiv="Content-Security-Policy"
     content="default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net;
              style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;">
   ```

**취약점 현황**:

| 위치 | 취약점 | 심각도 | 패치 상태 |
|------|--------|--------|----------|
| 라인 1203 | vendor 직접 삽입 | High | Pending |
| 라인 1400 | month 직접 삽입 | High | Pending |
| 라인 1429 | dest 직접 삽입 | High | Pending |
| 라인 1465 | model 직접 삽입 | High | Pending |
| 라인 1540 | vendor 직접 삽입 | High | Pending |

**보안 목표**:
- XSS 취약점: 0건
- escapeHtml 적용률: 100% (24/24)
- OWASP Top 10 준수: 100%
- 보안 감사 통과: 연 2회

**트리거 키워드**: `보안`, `XSS`, `취약점`, `escapeHtml`, `CSP`, `인젝션`

**협업 대상**: #R06 (UI), #R10 (배포), #17 (보안 엔지니어)

---

### Agent #R06: UI/UX Specialist (사용자 경험 전문가)

**전문분야**: 대시보드 UI, 다크모드, 반응형 디자인, 사용성

**책임**:
- 7개 탭 (월별, 행선지, 모델, 공장, 벤더, 히트맵, 상세) 관리
- 필터 시스템 UX 개선 (7개 필터 통합)
- 다크모드 완성도 향상
- 모바일 반응형 최적화

**핵심 컴포넌트**:

1. **필터 시스템**
   - 월 필터 (월별 집계)
   - 행선지 필터 (중요 행선지 + 전체)
   - 벤더 필터 (아웃솔 벤더)
   - 공장 필터 (A/B/C/D)
   - 상태 필터 (completed/partial/pending)
   - 빠른 날짜 필터 (지연/경고/오늘/1주일/1개월)
   - 검색 (모델, PO, 행선지, 벤더)

2. **차트**
   - 공정 진행률 Funnel (8단계)
   - Factory별 완료율 Bar Chart
   - 히트맵 3종 (모델×벤더, 국가×월, 모델×행선지)
   - 캘린더뷰 (출고 일정)

3. **테이블**
   - 정렬 (모든 컬럼)
   - 페이지네이션 (50/100/200/전체)
   - Virtual Scrolling (대용량 데이터)

4. **모달**
   - 오더 상세 정보
   - 지연 오더 목록
   - 공장별 세부 진행 상황

**UX 원칙**:
- **3-Click Rule**: 모든 정보 3회 클릭 이내 접근
- **응답 속도**: 모든 인터랙션 100ms 이내
- **시각적 피드백**: 로딩 스피너, 호버 효과, 트랜지션
- **직관성**: 레이블, 아이콘, 색상 코딩 일관성

**다크모드**:
```css
:root {
  --bg-primary: #f8fafc;
  --text-primary: #1f2937;
}
.dark {
  --bg-primary: #111827;
  --text-primary: #f9fafb;
}
```

**트리거 키워드**: `UI`, `UX`, `다크모드`, `차트`, `필터`, `테이블`, `모달`, `반응형`

**UX 목표**:
- 사용자 만족도: ≥ 90%
- UI 버그: 0건
- 접근성: WCAG 2.1 AA
- 모바일 대응: 768px 이하 완벽 지원

**협업 대상**: #R07 (차트), #R04 (성능), #06-#11 (UI 팀), #R09 (문서)

---

### Agent #R07: Chart & Visualization Expert (차트 시각화 전문가)

**전문분야**: Chart.js, 데이터 시각화, 히트맵, 인터랙티브 차트

**책임**:
- 공정 흐름 차트 (Funnel) 관리
- Factory별 완료율 차트
- 히트맵 3종 생성 및 최적화
- 실시간 차트 업데이트

**차트 종류**:

1. **Funnel Chart (공정 진행률)**
   ```
   S_CUT     ████████████████████ 100%
   PRE_SEW   ██████████████████   95%
   SEW_BAL   ████████████████     85% ⚠️ 병목
   OSC       ██████████████████   90%
   ASS       ███████████████████  96%
   WH_IN     ████████████████     88%
   WH_OUT    ██████████           55%
   ```

2. **Bar Chart (Factory별 완료율)**
   ```
   Factory A: ███████████████ 78%
   Factory B: ████████████    65%
   Factory C: ██████████████  72%
   Factory D: █████████████   70%
   ```

3. **Heatmap (3종)**
   - 모델 × 벤더: 각 모델별 아웃솔 벤더 분포
   - 국가 × 월: 행선지별 월별 출고량
   - 모델 × 행선지: 모델별 주요 행선지

4. **Calendar View (출고 일정)**
   ```
   2026-01
   일 월 화 수 목 금 토
         1  2  3  4  5
    6  7  8  9 10 11 12
   13 14 15🔴17 18 19 20
   ```
   🔴 지연, 🟡 경고, 🟢 정상

**최적화 전략**:
```javascript
// Chart.js 인스턴스 재사용
const chartInstances = {};

function updateChart(chartId, newData) {
  if (chartInstances[chartId]) {
    // 기존 인스턴스 업데이트 (빠름)
    chartInstances[chartId].data.datasets[0].data = newData;
    chartInstances[chartId].update('none'); // 애니메이션 없이
  } else {
    // 새 인스턴스 생성
    chartInstances[chartId] = new Chart(ctx, config);
  }
}
```

**트리거 키워드**: `차트`, `Chart.js`, `시각화`, `히트맵`, `그래프`, `Funnel`, `병목`

**품질 목표**:
- 차트 렌더링: < 200ms
- 다크모드 지원: 100%
- 반응형: 모든 화면 크기
- 데이터 정확도: 100%

**협업 대상**: #R06 (UI), #R04 (성능), #05 (데이터 시각화), #11 (차트 UI)

---

### Agent #R08: Testing & QA Engineer (테스트 엔지니어)

**전문분야**: E2E 테스트, 회귀 테스트, 데이터 검증, 성능 벤치마크

**책임**:
- 필터 조합 테스트 (7개 필터 × 조합)
- 지연/경고 판정 로직 테스트
- 차트 데이터 정확성 검증
- 크로스 브라우저 호환성 (Chrome/Firefox/Safari)

**테스트 커버리지**:

1. **데이터 파싱** (Agent #R01)
   ```python
   # parse_loadplan.py 유닛 테스트
   def test_parse_bal_sheet():
       # 4개 Factory Excel 파싱
       # 3,960건 데이터 검증
       # 필수 필드 확인
   ```

2. **비즈니스 로직** (Agent #R02)
   ```javascript
   // isDelayed 테스트 케이스 100+
   test('지연 판정: SDD > CRD', () => {
     expect(isDelayed({sdd: '2026-02-01', crd: '2026-01-01'})).toBe(true);
   });

   test('Code04 승인 예외 처리', () => {
     expect(isDelayed({sdd: '2026-02-01', crd: '2026-01-01', code04: 'Approval'})).toBe(false);
   });
   ```

3. **UI 인터랙션** (Agent #R06, #R07)
   ```javascript
   // Playwright E2E 테스트
   test('필터 조합: 월 + 행선지', async ({ page }) => {
     await page.selectOption('#monthFilter', '2026-01');
     await page.selectOption('#destFilter', 'Netherlands');
     await expect(page.locator('#dataTable tbody tr')).toHaveCount(expected);
   });
   ```

4. **성능 벤치마크** (Agent #R04)
   ```javascript
   test('필터 응답 시간', async () => {
     const start = Date.now();
     applyFilters();
     const elapsed = Date.now() - start;
     expect(elapsed).toBeLessThan(100); // < 100ms
   });
   ```

**테스트 시나리오**:

| 시나리오 | 테스트 케이스 | 우선순위 |
|---------|--------------|----------|
| 빈 데이터셋 | 0건 처리 | High |
| 대용량 데이터 | 10,000+ 건 | High |
| 필터 조합 | 7² = 49 조합 | Medium |
| 다크모드 전환 | 색상 대비 검증 | Medium |
| 모바일 반응형 | 768px 이하 | Low |

**트리거 키워드**: `테스트`, `QA`, `검증`, `E2E`, `회귀`, `벤치마크`, `Playwright`

**품질 목표**:
- 테스트 커버리지: ≥ 85%
- 회귀 버그: 0건
- 크로스 브라우저: Chrome/Firefox/Safari 100% 호환
- 성능 벤치마크: 모든 목표 달성

**협업 대상**: 모든 에이전트 (통합 테스트), #R03 (품질), #20 (테스트 엔지니어)

---

### Agent #R09: Documentation Specialist (문서화 전문가)

**전문분야**: 기술 문서, API 문서, 사용자 가이드, 릴리즈 노트

**책임**:
- CLAUDE.md 업데이트 (프로젝트 설정)
- AGENTS.md 유지보수 (에이전트 시스템)
- 코드 주석 및 함수 문서화
- 사용자 매뉴얼 작성 (한국어/영어)

**문서 종류**:

1. **개발자 가이드**
   ```markdown
   # Rachgia Dashboard 개발 가이드

   ## 프로젝트 구조
   - rachgia_dashboard_v9.html: 메인 HTML
   - rachgia_data_v8.js: 데이터 (4.8MB)
   - parse_loadplan.py: Excel 파싱 스크립트

   ## 설치 및 실행
   1. Python 3.8+ 설치
   2. pip install pandas openpyxl
   3. python parse_loadplan.py
   4. 브라우저에서 index.html 열기
   ```

2. **API 레퍼런스**
   ```javascript
   /**
    * 필터 적용 함수
    * @description 7개 필터 조건을 조합하여 데이터 필터링
    * @returns {Array} filteredData - 필터링된 데이터 배열
    * @performance < 100ms (3,960건 기준)
    */
   function applyFilters() { ... }

   /**
    * 지연 판정 함수
    * @param {Object} d - 오더 데이터
    * @returns {Boolean} - 지연 여부
    * @rule SDD > CRD (Code04 approval 제외)
    */
   function isDelayed(d) { ... }
   ```

3. **사용자 매뉴얼**
   ```markdown
   # Rachgia Dashboard 사용 가이드

   ## 필터 사용법
   1. 월 필터: 특정 월의 오더만 표시
   2. 행선지 필터: 국가별 필터링
   3. 빠른 필터: 지연/경고 오더 바로 보기

   ## 차트 해석
   - 공정 진행률: 각 단계별 완료 비율
   - 병목 구간: 빨간색 표시
   ```

4. **릴리즈 노트**
   ```markdown
   # v9.0.0 (2026-01-03)

   ## 주요 변경사항
   - 데이터 외부화: 5MB → 1MB 파일 크기 축소
   - XSS 취약점 5건 패치
   - 성능 개선: 필터 응답 50% 향상

   ## 버그 수정
   - 빈 destination 464건 처리
   - 잘못된 날짜 형식 165건 수정
   ```

**문서화 원칙**:
- 코드와 동기화 (자동 생성 선호)
- 예제 중심 (실제 사용 케이스)
- 다국어 지원 (한국어, 영어)
- 버전 관리 (Git 연동)

**트리거 키워드**: `문서`, `문서화`, `매뉴얼`, `가이드`, `README`, `API`, `릴리즈`

**품질 목표**:
- 문서 커버리지: ≥ 90%
- 정확도: 100% (코드와 일치)
- 가독성: Flesch Reading Ease ≥ 60
- 업데이트 주기: 매 릴리즈

**협업 대상**: 모든 에이전트, #09 (문서화 전문가)

---

### Agent #R10: Deployment & DevOps Specialist (배포 전문가)

**전문분야**: 파일 구조 최적화, 배포 자동화, 버전 관리, 롤백

**책임**:
- 프로덕션 빌드 프로세스 설계
- 파일 분리 전략 (HTML, JS, CSS, JSON)
- 버전 관리 및 롤백 메커니즘
- 배포 체크리스트 관리

**배포 아키텍처**:

```
프로덕션 구조:
┌─────────────────────────────────────────┐
│ 웹 서버 (Nginx/Apache)                  │
├─────────────────────────────────────────┤
│ /index.html          (20 KB)  ← 메인    │
│ /assets/                                │
│   ├── app.js         (100 KB) ← JS      │
│   ├── styles.css     (30 KB)  ← CSS     │
│   └── data/                             │
│       └── orders.json (4.8 MB) ← 데이터 │
│ /cdn/ (Tailwind, Chart.js, XLSX.js)    │
└─────────────────────────────────────────┘

총 파일 크기: ~1 MB (데이터 제외)
초기 로딩: 150 KB (index + CSS + JS 압축)
```

**배포 체크리스트**:

| 단계 | 담당 | 검증 항목 | 도구 |
|------|------|----------|------|
| 1. 데이터 품질 | #R03 | 464건 이슈 해결 | Python script |
| 2. 보안 검사 | #R05 | XSS 5건 패치 | Manual review |
| 3. 성능 벤치마크 | #R04 | 파일 크기 < 1MB | Lighthouse |
| 4. E2E 테스트 | #R08 | 모든 테스트 통과 | Playwright |
| 5. 문서 업데이트 | #R09 | 릴리즈 노트 작성 | Markdown |
| 6. 버전 증가 | #R10 | v8 → v9 | Git tag |
| 7. 백업 | #R10 | v8 백업 | Git branch |
| 8. 배포 | #R10 | 프로덕션 푸시 | FTP/Git |

**버전 관리 전략**:

```bash
# Git 브랜치 전략
main              # 프로덕션 (v9)
├── develop       # 개발 (v10-dev)
├── hotfix/v9.1   # 긴급 패치
└── backup/v8     # 롤백용 백업

# 배포 명령
git tag v9.0.0
git push origin v9.0.0
```

**롤백 프로세스**:

```bash
# 1분 이내 롤백
1. 이슈 감지 (모니터링)
2. git checkout backup/v8
3. 배포 스크립트 실행
4. 검증 (헬스 체크)
5. 이슈 분석 및 수정
```

**트리거 키워드**: `배포`, `빌드`, `프로덕션`, `버전`, `릴리즈`, `롤백`, `DevOps`

**배포 목표**:
- 다운타임: 0초
- 롤백 시간: < 5분
- 파일 크기: < 1MB (HTML+JS+CSS)
- 배포 빈도: 주 1회 (안정 후)

**협업 대상**: #R04 (성능), #R05 (보안), #R08 (QA), #R09 (문서), #10 (배포 전문가)

---

## 🔄 Rachgia 에이전트 협업 프로토콜

### 협업 매트릭스

| 에이전트 | 주요 협업 대상 | 의존성 | 출력물 |
|---------|---------------|--------|--------|
| R01 (ETL) | R03, R02, #02 | Excel 파일 | parsed_loadplan_v6.json |
| R02 (도메인) | R01, R03, #04 | 비즈니스 요구사항 | 로직 명세서 |
| R03 (품질) | R01, R08, #02 | 데이터 소스 | 품질 리포트 |
| R04 (성능) | R06, R07, R10 | 성능 목표 | 최적화 코드 |
| R05 (보안) | R06, R10, #17 | 보안 정책 | 패치 파일 |
| R06 (UI) | R07, R04, #06-#11 | 디자인 시스템 | HTML/CSS |
| R07 (차트) | R06, R04, #11 | 차트 데이터 | Chart.js 코드 |
| R08 (QA) | 모든 에이전트 | 품질 기준 | 테스트 리포트 |
| R09 (문서) | 모든 에이전트 | 코드베이스 | 문서 파일 |
| R10 (배포) | R04, R05, R08 | 배포 승인 | 배포 패키지 |

### 작업 흐름 예시

```
데이터 파이프라인 수정 요청:
R01 (파싱) → R03 (검증) → R02 (로직) → R08 (테스트) → R10 (배포)

UI 개선 요청:
R06 (UI) → R07 (차트) → R04 (성능) → R05 (보안) → R08 (테스트) → R10 (배포)

성능 최적화 요청:
R04 (성능) → R01 (데이터) → R06 (UI) → R07 (차트) → R08 (벤치마크) → R10 (배포)
```

---

## 🚀 PHASE 3 OPTIMIZATION TEAM - 최적화 전문 에이전트 (10명)

Phase 3는 코드 품질, 성능 최적화, 유지보수성 향상에 집중합니다.

### 팀 구조

```
┌──────────────────────────────────────────────────────────┐
│           🚀 PHASE 3 OPTIMIZATION AGENTS                 │
│              (성능 & 품질 전문 10명)                       │
└──────────────────────────────────────────────────────────┘
        │
        ├──────┬──────┬──────┬──────┬──────┐
        ▼      ▼      ▼      ▼      ▼      ▼
     ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐
     │ P01││ P02││ P03││ P04││ P05││...│
     └────┘└────┘└────┘└────┘└────┘└────┘
    복잡도 레거시 알고리즘 메모리 모바일 PWA
```

---

### Agent #P01: Code Complexity Reducer (복잡도 감소 전문가)

**전문분야**: 코드 복잡도 측정 및 감소, 함수 분리, 가독성 개선

**책임**:
- 현재 119개 함수의 복잡도 분석
- Cyclomatic Complexity 측정 및 개선
- 긴 함수 분리 (> 50줄 → 30줄 이하)
- 중첩 깊이 감소 (> 3 depth → 3 이하)
- 함수 응집도 향상

**목표 메트릭**:
```yaml
current:
  함수 개수: 119개
  평균 함수 길이: ~35줄
  최대 함수 길이: 100+줄
  Cyclomatic Complexity: 최대 25+

target:
  평균 함수 길이: ≤30줄
  최대 함수 길이: ≤50줄
  Cyclomatic Complexity: ≤10
  중첩 깊이: ≤3
  함수 응집도: High
```

**개선 대상**:
- `applyFilters()`: 100+ 줄, 복잡도 20+ → 분리 필요
- `updateDataTab()`: 60+ 줄 → Extract 함수
- `showOrderListModal()`: 80+ 줄 → 모듈화

**트리거 키워드**: `복잡도`, `함수 분리`, `리팩토링`, `가독성`

**협업 대상**: #P07 (리팩토링), #P09 (아키텍처)

---

### Agent #P02: Legacy Cleaner (레거시 정리 전문가)

**전문분야**: 사용하지 않는 파일 정리, 버전 관리, 디스크 최적화

**책임**:
- 레거시 파일 15개 (32.45 MB) 정리
- v3-v9 HTML 백업 후 제거
- 사용하지 않는 JSON 파일 정리
- Git history 보존 전략
- .gitignore 최적화

**정리 대상**:
```yaml
html_files:
  - rachgia_dashboard_v3.html
  - rachgia_dashboard_v4.html
  - rachgia_dashboard_v5.html
  - rachgia_dashboard_v6.html
  - rachgia_dashboard_v7.html
  - rachgia_dashboard_v8.html
  - rachgia_dashboard_v9.html

python_scripts:
  - create_v6_dashboard.py
  - create_v7_dashboard.py
  - create_v8_dashboard.py

json_data:
  - parsed_data.json
  - parsed_data_v2.json
  - parsed_data_complete.json
  - parsed_data_full.json
  - dashboard_data.json
  - dashboard_data_v2.json
  - embedded_data.json
```

**정리 전략**:
1. Git에서 백업 브랜치 생성 (`legacy-backup`)
2. 파일 이동 (`archive/` 폴더)
3. `.gitignore`에 추가
4. 디스크 공간 확인

**절약 효과**: 32.45 MB → 약 5 MB (85% 감소)

**트리거 키워드**: `레거시`, `정리`, `디스크`, `파일 삭제`

**협업 대상**: #P09 (아키텍처)

---

### Agent #P03: Algorithm Optimizer (알고리즘 최적화 전문가)

**전문분야**: 시간 복잡도 개선, 반복문 최적화, 효율적인 자료구조

**책임**:
- O(n²) 알고리즘을 O(n) 또는 O(n log n)으로 개선
- 중첩 루프 제거
- Map/Set 활용한 빠른 조회
- 불필요한 재계산 제거
- 알고리즘 벤치마크

**최적화 전략**:

1. **차트 집계 로직 최적화**:
```javascript
// Before: O(n²) - 중첩 루프
function aggregateByMonth(data) {
  const months = [...new Set(data.map(d => d.month))];
  return months.map(month => {
    const filtered = data.filter(d => d.month === month);  // O(n)
    return { month, count: filtered.length };
  });  // Total: O(n²)
}

// After: O(n) - Single pass
function aggregateByMonth(data) {
  const monthMap = new Map();
  for (const d of data) {  // O(n)
    const count = monthMap.get(d.month) || 0;
    monthMap.set(d.month, count + 1);
  }
  return Array.from(monthMap.entries()).map(([month, count]) =>
    ({ month, count })
  );
}
```

2. **필터링 최적화**:
```javascript
// Before: 매번 전체 순회
filteredData = allData.filter(/* 7개 조건 */);

// After: 인덱스 기반
const monthIndex = new Map();  // 사전 인덱싱
const destIndex = new Map();
// ... 빠른 조회
```

3. **중복 계산 제거**:
```javascript
// Before: 매번 계산
if (isDelayed(d) || isWarning(d)) { ... }

// After: 캐싱
const statusCache = new Map();
function getStatus(d) {
  if (statusCache.has(d.id)) return statusCache.get(d.id);
  const status = isDelayed(d) ? 'delayed' : isWarning(d) ? 'warning' : 'normal';
  statusCache.set(d.id, status);
  return status;
}
```

**성능 목표**:
- 필터 응답: 100ms → 20ms (80% 개선)
- 차트 업데이트: 200ms → 50ms (75% 개선)
- 집계 연산: O(n²) → O(n)

**트리거 키워드**: `느림`, `성능`, `알고리즘`, `최적화`, `O(n²)`

**협업 대상**: #P04 (메모리), #P10 (테스트)

---

### Agent #P04: Memory Manager (메모리 관리 전문가)

**전문분야**: 메모리 누수 방지, WeakMap 활용, 가비지 컬렉션 최적화

**책임**:
- 차트 인스턴스 메모리 관리
- 이벤트 리스너 정리
- WeakMap/WeakSet 도입
- 메모리 프로파일링
- 순환 참조 제거

**개선 전략**:

1. **WeakMap 활용**:
```javascript
// Before: Strong references (메모리 누수 위험)
const chartInstances = {};
const filterCache = new Map();

// After: Weak references
const chartInstances = new WeakMap();  // DOM 삭제 시 자동 정리
const domNodeData = new WeakMap();
```

2. **이벤트 리스너 정리**:
```javascript
// Before: 리스너 누적
button.addEventListener('click', handler);

// After: 정리 메커니즘
const eventCleanup = [];
function addCleanableListener(el, event, handler) {
  el.addEventListener(event, handler);
  eventCleanup.push(() => el.removeEventListener(event, handler));
}
```

3. **차트 인스턴스 재사용**:
```javascript
function updateChart(id, data) {
  if (chartInstances.has(id)) {
    chartInstances.get(id).data = data;
    chartInstances.get(id).update('none');  // 재사용
  } else {
    chartInstances.set(id, new Chart(ctx, config));
  }
}
```

**메모리 목표**:
```yaml
current:
  초기 로딩: ~150 MB
  필터 10회 후: ~200 MB
  차트 업데이트: ~250 MB

target:
  초기 로딩: <100 MB
  필터 10회 후: <120 MB (누수 없음)
  차트 업데이트: <150 MB
```

**트리거 키워드**: `메모리`, `누수`, `WeakMap`, `가비지 컬렉션`

**협업 대상**: #P03 (알고리즘), #P10 (테스트)

---

### Agent #P05: Mobile UX Specialist (모바일 반응형 전문가)

**전문분야**: 모바일 최적화, 터치 인터랙션, 반응형 디자인

**책임**:
- 768px 이하 레이아웃 개선
- 터치 제스처 지원 (스와이프, 핀치)
- 가로/세로 모드 최적화
- 모바일 성능 개선
- 모바일 전용 UI 컴포넌트

**개선 항목**:

1. **테이블 스크롤**:
```css
/* 가로 스크롤 UX */
@media (max-width: 768px) {
  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x mandatory;
  }
}
```

2. **필터 UI (Bottom Sheet)**:
```html
<!-- 모바일: Bottom Sheet -->
<div class="mobile-filter-sheet">
  <div class="sheet-header">
    <h3>필터</h3>
    <button class="close">✕</button>
  </div>
  <div class="sheet-content">
    <!-- 필터 옵션 -->
  </div>
</div>
```

3. **터치 최적화**:
```javascript
// 터치 제스처
let touchStartX = 0;
element.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
});
element.addEventListener('touchend', e => {
  const touchEndX = e.changedTouches[0].clientX;
  if (touchEndX - touchStartX > 100) {
    // 스와이프 오른쪽 → 이전 페이지
    prevPage();
  }
});
```

4. **폰트 크기**:
```css
/* 모바일 가독성 */
@media (max-width: 768px) {
  body { font-size: 16px; }  /* 14px → 16px */
  .table { font-size: 14px; }
  h1 { font-size: 24px; }
}
```

**목표 디바이스**:
- iPhone SE (375px)
- iPhone 12/13 (390px, 414px)
- iPad (768px, 1024px)
- Android (360px, 412px)

**UX 목표**:
- 터치 타겟: ≥44px × 44px
- 가독성: 16px 이상
- 스크롤: 부드러움 (60fps)
- 로딩: <3초 (4G)

**트리거 키워드**: `모바일`, `반응형`, `터치`, `스와이프`

**협업 대상**: #P06 (UI), #P10 (테스트)

---

### Agent #P06: PWA Engineer (Progressive Web App 전문가)

**전문분야**: Service Worker, 오프라인 지원, 앱 설치

**책임**:
- Service Worker 구현
- 오프라인 데이터 캐싱
- 앱 설치 프롬프트 (Add to Home Screen)
- 백그라운드 동기화
- Push 알림 (선택사항)

**구현 항목**:

1. **Service Worker 등록**:
```javascript
// index.html
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW registered:', reg))
    .catch(err => console.error('SW registration failed:', err));
}
```

2. **sw.js (Stale-While-Revalidate)**:
```javascript
const CACHE_NAME = 'rachgia-v12';
const urlsToCache = [
  '/',
  '/rachgia_dashboard_v12.html',
  '/data/orders.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Cache hit - return response
      if (response) return response;

      // Fetch from network
      return fetch(event.request).then(response => {
        // Cache new response
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
```

3. **manifest.json (앱 설치)**:
```json
{
  "name": "Rachgia Factory Dashboard",
  "short_name": "Rachgia",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1f2937",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**오프라인 기능**:
- 마지막 로드된 데이터 보기
- 차트 렌더링
- 필터 동작
- 오프라인 표시 배너

**트리거 키워드**: `PWA`, `오프라인`, `Service Worker`, `앱 설치`

**협업 대상**: #P05 (모바일), #P08 (번들)

---

### Agent #P07: Code Refactorer (리팩토링 전문가)

**전문분야**: 코드 구조 개선, DRY 원칙, 모듈화

**책임**:
- 중복 코드 제거 (DRY 원칙)
- 함수 추출 (Extract Function)
- 상수 추출 (Extract Constant)
- 유틸리티 함수 모듈화
- 코드 일관성 개선

**리팩토링 대상**:

1. **중복된 getIcon 함수** (3곳에서 사용):
```javascript
// Before: 중복 정의
function getIcon1(status) {
  if (status === 'completed') return '✅';
  if (status === 'partial') return '🔄';
  return '⏳';
}
function getIcon2(status) { /* 동일한 로직 */ }

// After: 단일 정의
const STATUS_ICONS = {
  completed: '✅',
  partial: '🔄',
  pending: '⏳'
};
function getStatusIcon(status) {
  return STATUS_ICONS[status] || '⏳';
}
```

2. **중복된 날짜 처리**:
```javascript
// Before: 여러 곳에서 반복
const dateStr = d.crd;
if (!dateStr || dateStr === '00:00:00') return null;
const date = new Date(dateStr.replace(/\./g, '-'));

// After: 유틸리티 함수
function parseValidDate(dateStr) {
  if (!dateStr || dateStr === '00:00:00') return null;
  return new Date(dateStr.replace(/\./g, '-'));
}
```

3. **중복된 집계 로직**:
```javascript
// Before: 월별, 행선지별, 모델별 집계 로직 중복
// After: Generic aggregator
function aggregateBy(data, keyFn, valueFn) {
  const map = new Map();
  for (const item of data) {
    const key = keyFn(item);
    const value = valueFn(item);
    map.set(key, (map.get(key) || 0) + value);
  }
  return Array.from(map.entries());
}

// 사용
const byMonth = aggregateBy(data, d => d.month, d => d.quantity);
const byDest = aggregateBy(data, d => d.destination, d => 1);
```

**리팩토링 원칙**:
- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **YAGNI**: You Aren't Gonna Need It
- **SRP**: Single Responsibility Principle

**코드 품질 목표**:
- 중복 코드: < 3%
- 함수 재사용: > 80%
- 일관성: 100%

**트리거 키워드**: `리팩토링`, `중복`, `DRY`, `모듈화`

**협업 대상**: #P01 (복잡도), #P09 (아키텍처)

---

### Agent #P08: Bundle Optimizer (번들 최적화 전문가)

**전문분야**: 파일 크기 감소, 코드 스플리팅, 압축

**책임**:
- HTML 파일 크기 감소 (217KB → 150KB)
- 데이터 외부화 (임베디드 → 별도 파일)
- 지연 로딩 (Lazy Loading)
- Gzip/Brotli 압축
- Tree shaking

**최적화 전략**:

1. **데이터 분리**:
```
Before:
  rachgia_dashboard_v11.html (217 KB, 내장 데이터 포함)

After:
  rachgia_dashboard_v12.html (150 KB, 데이터 제외)
  data/orders.json (6.8 MB)

초기 로딩: 217 KB → 150 KB (31% 감소)
```

2. **코드 스플리팅**:
```javascript
// core.js (필수 - 즉시 로드)
import { initDashboard, applyFilters } from './core.js';

// charts.js (차트 탭 열 때 로드)
async function showChartTab() {
  const { updateCharts } = await import('./charts.js');
  updateCharts(data);
}

// heatmap.js (히트맵 탭 열 때 로드)
async function showHeatmapTab() {
  const { generateHeatmap } = await import('./heatmap.js');
  generateHeatmap(data);
}
```

3. **압축**:
```
Gzip:
  - HTML: 150 KB → 30 KB (80% 압축)
  - JSON: 6.8 MB → 1.2 MB (82% 압축)

Brotli (더 나은 압축):
  - HTML: 150 KB → 25 KB (83% 압축)
  - JSON: 6.8 MB → 1.0 MB (85% 압축)
```

4. **이미지 최적화** (미래):
```
- PNG → WebP (70% 압축)
- 지연 로딩 (Lazy Loading)
- Responsive images (<picture>)
```

**번들 크기 목표**:
```yaml
current:
  total: 7.0 MB (217 KB HTML + 6.8 MB JSON)
  gzip: ~1.5 MB

target:
  total: 7.0 MB (150 KB HTML + 6.8 MB JSON)
  gzip: ~1.2 MB
  초기 로딩: 150 KB HTML만
```

**트리거 키워드**: `번들`, `압축`, `파일 크기`, `최적화`

**협업 대상**: #P06 (PWA), #P09 (아키텍처)

---

### Agent #P09: Architecture Consultant (아키텍처 개선 전문가)

**전문분야**: 시스템 설계, 확장성, 유지보수성

**책임**:
- 파일 구조 재설계
- 프로젝트 구조 최적화
- 빌드 프로세스 도입
- 타입 안정성 (JSDoc 또는 TypeScript)
- 문서화 개선

**제안 구조**:
```
rachgia-dashboard/
├── src/                          # 소스 코드
│   ├── index.html
│   ├── js/
│   │   ├── core.js               # 핵심 로직
│   │   ├── filters.js            # 필터 로직
│   │   ├── charts.js             # 차트 생성
│   │   ├── heatmap.js            # 히트맵
│   │   ├── modals.js             # 모달 관리
│   │   └── utils.js              # 유틸리티
│   ├── css/
│   │   ├── main.css
│   │   ├── mobile.css            # 모바일 전용
│   │   └── print.css             # 인쇄 전용
│   └── data/
│       └── orders.json           # 외부 데이터
├── scripts/                      # 빌드/배포 스크립트
│   ├── parse_loadplan.py
│   └── build.js                  # 번들러
├── public/                       # 정적 자산
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
├── docs/                         # 문서
│   ├── CLAUDE.md
│   ├── AGENTS.md
│   └── README.md
├── archive/                      # 레거시 파일
│   └── v3-v10/
├── dist/                         # 빌드 출력
│   └── rachgia_dashboard_v12.html
├── .gitignore
└── package.json                  # 의존성 관리
```

**빌드 프로세스**:
```bash
# 개발 모드
npm run dev

# 프로덕션 빌드
npm run build
  → HTML 번들링
  → CSS 압축
  → JS 난독화
  → Gzip 압축

# 배포
npm run deploy
```

**타입 안정성 (JSDoc)**:
```javascript
/**
 * @typedef {Object} Order
 * @property {string} factory - Factory ID (A/B/C/D)
 * @property {string} model - 모델명
 * @property {string} destination - 행선지
 * @property {number} quantity - 주문량
 */

/**
 * 필터 적용
 * @param {Order[]} data - 전체 데이터
 * @param {Object} filters - 필터 조건
 * @returns {Order[]} 필터링된 데이터
 */
function applyFilters(data, filters) {
  // ...
}
```

**트리거 키워드**: `아키텍처`, `구조`, `모듈화`, `빌드`

**협업 대상**: #P07 (리팩토링), #P08 (번들)

---

### Agent #P10: Integration Tester (통합 테스트 전문가)

**전문분야**: E2E 테스트, 자동화 테스트, 품질 보증

**책임**:
- Playwright 테스트 작성
- 회귀 테스트 자동화
- 성능 벤치마크
- 시각적 회귀 테스트 (Visual Regression)
- CI/CD 통합

**테스트 시나리오**:

1. **필터 조합 테스트**:
```javascript
// tests/filters.spec.js
import { test, expect } from '@playwright/test';

test('Filter: Month + Destination', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // 월 필터 선택
  await page.selectOption('#monthFilter', '2026-01');

  // 행선지 필터 선택
  await page.selectOption('#destFilter', 'Netherlands');

  // 결과 검증
  const rowCount = await page.locator('#dataTable tbody tr').count();
  expect(rowCount).toBeGreaterThan(0);
  expect(rowCount).toBeLessThanOrEqual(50); // 페이지 크기
});
```

2. **페이지 크기 변경 테스트**:
```javascript
test('Page size change: 50 → 100', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('[data-tab="data"]');

  // 페이지 크기 변경
  await page.selectOption('#pageSizeSelect', '100');

  // 100행 렌더링 검증
  const rowCount = await page.locator('#dataTable tbody tr').count();
  expect(rowCount).toBe(100);
});
```

3. **성능 테스트**:
```javascript
test('Filter response time < 100ms', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const start = Date.now();
  await page.selectOption('#quickDateFilter', 'delayed');
  await page.waitForSelector('#dataTable tbody tr');
  const elapsed = Date.now() - start;

  expect(elapsed).toBeLessThan(100);
  console.log(`Filter response: ${elapsed}ms`);
});
```

4. **시각적 회귀 테스트**:
```javascript
test('Visual regression: Dashboard layout', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // 스크린샷 비교
  await expect(page).toHaveScreenshot('dashboard-main.png', {
    maxDiffPixels: 100
  });
});
```

**테스트 커버리지 목표**:
```yaml
unit_tests:
  - 핵심 함수: 100%
  - 유틸리티: 100%
  - 필터 로직: 100%

integration_tests:
  - 필터 조합: 90%
  - 차트 업데이트: 80%
  - 모달 동작: 100%

e2e_tests:
  - 주요 시나리오: 100%
  - 엣지 케이스: 70%
```

**성능 벤치마크**:
- 초기 로딩: < 2초
- 필터 응답: < 100ms
- 차트 업데이트: < 200ms
- 페이지네이션: < 50ms

**트리거 키워드**: `테스트`, `E2E`, `Playwright`, `벤치마크`

**협업 대상**: #P03 (알고리즘), #P04 (메모리), #P05 (모바일)

---

## Phase 3 에이전트 협업 매트릭스

| 에이전트 | 주요 협업 대상 | 의존성 | 출력물 |
|---------|---------------|--------|--------|
| P01 (복잡도) | P07, P09 | 코드베이스 | 리팩토링된 함수 |
| P02 (레거시) | P09 | Git history | 정리된 프로젝트 |
| P03 (알고리즘) | P04, P10 | 성능 목표 | 최적화된 코드 |
| P04 (메모리) | P03, P10 | 프로파일링 도구 | 메모리 보고서 |
| P05 (모바일) | P06, P10 | 디자인 시스템 | 모바일 UI |
| P06 (PWA) | P05, P08 | manifest, SW | 오프라인 지원 |
| P07 (리팩토링) | P01, P09 | 코드 분석 | 깨끗한 코드 |
| P08 (번들) | P06, P09 | 빌드 도구 | 최적화된 번들 |
| P09 (아키텍처) | P02, P07, P08 | 요구사항 | 프로젝트 구조 |
| P10 (테스트) | P03, P04, P05 | 테스트 시나리오 | 테스트 리포트 |

---

## Phase 3 우선순위 및 로드맵

### HIGH Priority (즉시 시작)
- **P01**: 코드 복잡도 감소 (유지보수성 +50%)
- **P03**: 알고리즘 최적화 (속도 +150%)
- **P07**: 코드 리팩토링 (품질 +60%)

### MEDIUM Priority (다음 단계)
- **P02**: 레거시 정리 (디스크 -85%)
- **P04**: 메모리 관리 (메모리 -30%)
- **P05**: 모바일 UX (만족도 +40%)
- **P08**: 번들 최적화 (크기 -30%)
- **P10**: 통합 테스트 (버그 -80%)

### LOW Priority (향후 계획)
- **P06**: PWA 구현 (오프라인 가능)
- **P09**: 아키텍처 개편 (확장성 +100%)

---

## 🎯 PHASE 4 TEAM - 사용자 가치 극대화 (10명)

**Phase 4 목표**: "User Value Maximization (사용자 가치 극대화)"

Phase 3에서 코드 품질과 성능 최적화를 완료한 후, Phase 4는 사용자 경험과 실용적 가치를 극대화합니다.

### 팀 구조

```
┌──────────────────────────────────────────────────────────┐
│           🎯 PHASE 4: USER VALUE MAXIMIZATION            │
│                 (사용자 가치 극대화 10명)                  │
└──────────────────────────────────────────────────────────┘
        │
        ├──────┬──────┬──────┬──────┬──────┐
        ▼      ▼      ▼      ▼      ▼      ▼
     ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐
     │ Q01││ Q02││ Q03││ Q04││ Q05││...│
     └────┘└────┘└────┘└────┘└────┘└────┘
     Export Filter Settings Notify Report Mobile
```

---

### Agent #Q01: Data Export Specialist (데이터 내보내기 전문가)

**전문분야**: Excel/CSV/PDF 데이터 내보내기, 다운로드 관리

**책임**:
- Excel (XLSX) 내보내기 구현
- CSV 다운로드 기능
- PDF 리포트 생성
- 필터링된 데이터 내보내기
- 커스텀 컬럼 선택

**핵심 기능**:

1. **Excel 내보내기**:
```javascript
// Excel 내보내기 함수 (XLSX.js 사용)
function exportToExcel() {
    const wb = XLSX.utils.book_new();

    // 현재 필터링된 데이터를 워크시트로 변환
    const wsData = filteredData.map(d => ({
        '공장': d.factory,
        'PO번호': d.poNumber,
        '모델': d.model,
        '행선지': d.destination,
        '수량': d.quantity,
        'CRD': d.crd,
        'SDD': d.sddValue,
        '지연여부': isDelayed(d) ? '지연' : '정상',
        'S_CUT 완료': d.production?.s_cut?.completed || 0,
        'SEW_BAL 완료': d.production?.sew_bal?.completed || 0,
        'WH_OUT 완료': d.production?.wh_out?.completed || 0,
        '전체 상태': d.production?.wh_out?.status || 'pending'
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);

    // 열 너비 자동 조정
    const colWidths = Object.keys(wsData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, '오더 현황');

    // 파일명에 날짜 포함
    const fileName = `Rachgia_Orders_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, fileName);

    showToast(`✅ ${filteredData.length}건의 데이터를 Excel로 내보냈습니다.`);
}
```

2. **CSV 내보내기**:
```javascript
function exportToCSV() {
    const headers = ['공장', 'PO번호', '모델', '행선지', '수량', 'CRD', 'SDD', '지연여부', '상태'];
    const rows = filteredData.map(d => [
        d.factory,
        d.poNumber,
        d.model,
        d.destination,
        d.quantity,
        d.crd,
        d.sddValue,
        isDelayed(d) ? '지연' : '정상',
        d.production?.wh_out?.status || 'pending'
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // UTF-8 BOM 추가 (Excel 한글 깨짐 방지)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Rachgia_Orders_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}
```

3. **PDF 리포트 생성**:
```javascript
async function exportToPDF() {
    // jsPDF 사용
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    // 타이틀
    doc.setFontSize(16);
    doc.text('Rachgia Factory 생산 현황 리포트', 14, 15);

    // 날짜
    doc.setFontSize(10);
    doc.text(`생성일: ${new Date().toLocaleDateString('ko-KR')}`, 14, 22);

    // 요약 통계
    const stats = {
        totalOrders: filteredData.length,
        delayed: filteredData.filter(d => isDelayed(d)).length,
        completed: filteredData.filter(d => d.production?.wh_out?.status === 'completed').length
    };

    doc.text(`총 오더: ${stats.totalOrders}건 | 지연: ${stats.delayed}건 | 완료: ${stats.completed}건`, 14, 28);

    // 테이블 (autoTable 플러그인)
    doc.autoTable({
        startY: 35,
        head: [['공장', 'PO번호', '모델', '행선지', '수량', 'CRD', 'SDD', '상태']],
        body: filteredData.slice(0, 50).map(d => [
            d.factory,
            d.poNumber,
            d.model,
            d.destination,
            d.quantity,
            d.crd,
            d.sddValue,
            isDelayed(d) ? '지연' : '정상'
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`Rachgia_Report_${new Date().toISOString().slice(0,10)}.pdf`);
}
```

4. **내보내기 옵션 UI**:
```javascript
function showExportModal() {
    const modal = `
        <div class="modal-overlay" onclick="closeExportModal()">
            <div class="modal-content bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold mb-4">데이터 내보내기</h3>

                <div class="mb-4">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        현재 필터링된 ${filteredData.length}건의 데이터를 내보냅니다.
                    </p>
                </div>

                <div class="space-y-3">
                    <button onclick="exportToExcel()" class="w-full btn-primary flex items-center justify-center gap-2">
                        <span>📊</span> Excel 내보내기 (.xlsx)
                    </button>
                    <button onclick="exportToCSV()" class="w-full btn-secondary flex items-center justify-center gap-2">
                        <span>📄</span> CSV 내보내기 (.csv)
                    </button>
                    <button onclick="exportToPDF()" class="w-full btn-secondary flex items-center justify-center gap-2">
                        <span>📑</span> PDF 리포트 (.pdf)
                    </button>
                </div>

                <button onclick="closeExportModal()" class="mt-4 w-full btn-ghost">
                    취소
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}
```

**기대 효과**:
- 사용자 만족도 +35% (데이터 활용성 향상)
- 수동 복사/붙여넣기 시간 -90%
- Excel 분석 연동 가능
- 보고서 작성 시간 -70%

**트리거 키워드**: `내보내기`, `export`, `Excel`, `CSV`, `PDF`, `다운로드`, `저장`

**협업 대상**: #Q02 (필터), #Q05 (리포트), #11 (차트 UI)

---

### Agent #Q02: Advanced Filter Engineer (고급 필터 엔지니어)

**전문분야**: 복잡한 필터링 로직, 필터 프리셋, 조합 필터

**책임**:
- 필터 프리셋 저장/불러오기
- AND/OR 조합 필터
- 범위 필터 (수량, 날짜)
- 정규표현식 검색
- 필터 히스토리

**핵심 기능**:

1. **필터 프리셋 시스템**:
```javascript
class FilterPresetManager {
    constructor() {
        this.presets = JSON.parse(localStorage.getItem('filterPresets') || '{}');
    }

    // 프리셋 저장
    savePreset(name, filters) {
        this.presets[name] = {
            filters: filters,
            created: new Date().toISOString(),
            count: this.countResults(filters)
        };
        localStorage.setItem('filterPresets', JSON.stringify(this.presets));
        this.renderPresetList();
        showToast(`✅ 필터 프리셋 "${name}" 저장됨`);
    }

    // 프리셋 불러오기
    loadPreset(name) {
        const preset = this.presets[name];
        if (!preset) return;

        // 모든 필터 적용
        Object.entries(preset.filters).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) element.value = value;
        });

        applyFilters();
        showToast(`✅ 필터 프리셋 "${name}" 적용됨`);
    }

    // 프리셋 삭제
    deletePreset(name) {
        delete this.presets[name];
        localStorage.setItem('filterPresets', JSON.stringify(this.presets));
        this.renderPresetList();
    }

    // 프리셋 목록 렌더링
    renderPresetList() {
        const container = document.getElementById('presetList');
        container.innerHTML = Object.entries(this.presets)
            .map(([name, preset]) => `
                <div class="preset-item flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <div class="flex-1 cursor-pointer" onclick="filterPresets.loadPreset('${escapeHtml(name)}')">
                        <div class="font-medium">${escapeHtml(name)}</div>
                        <div class="text-xs text-gray-500">${preset.count}건 결과</div>
                    </div>
                    <button onclick="filterPresets.deletePreset('${escapeHtml(name)}')" class="text-red-500 hover:text-red-700">
                        🗑️
                    </button>
                </div>
            `).join('');
    }
}

// 전역 인스턴스
const filterPresets = new FilterPresetManager();
```

2. **고급 필터 조건 (AND/OR)**:
```javascript
const advancedFilters = {
    conditions: [
        { field: 'quantity', operator: '>', value: 1000, enabled: true },
        { field: 'factory', operator: '=', value: 'A', enabled: true }
    ],
    logic: 'AND' // 'AND' 또는 'OR'
};

function applyAdvancedFilters(data) {
    return data.filter(item => {
        const results = advancedFilters.conditions
            .filter(c => c.enabled)
            .map(condition => {
                const fieldValue = getNestedValue(item, condition.field);
                switch (condition.operator) {
                    case '=': return fieldValue == condition.value;
                    case '!=': return fieldValue != condition.value;
                    case '>': return Number(fieldValue) > Number(condition.value);
                    case '<': return Number(fieldValue) < Number(condition.value);
                    case '>=': return Number(fieldValue) >= Number(condition.value);
                    case '<=': return Number(fieldValue) <= Number(condition.value);
                    case 'contains': return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
                    case 'regex': return new RegExp(condition.value, 'i').test(String(fieldValue));
                    default: return true;
                }
            });

        return advancedFilters.logic === 'AND'
            ? results.every(r => r)
            : results.some(r => r);
    });
}
```

3. **범위 필터 UI**:
```javascript
function renderRangeFilter() {
    return `
        <div class="range-filter mb-4">
            <label class="block text-sm font-medium mb-2">수량 범위</label>
            <div class="flex gap-2 items-center">
                <input type="number" id="quantityMin" placeholder="최소" class="input w-24">
                <span>~</span>
                <input type="number" id="quantityMax" placeholder="최대" class="input w-24">
            </div>
        </div>

        <div class="range-filter mb-4">
            <label class="block text-sm font-medium mb-2">CRD 범위</label>
            <div class="flex gap-2 items-center">
                <input type="date" id="crdStart" class="input">
                <span>~</span>
                <input type="date" id="crdEnd" class="input">
            </div>
        </div>
    `;
}

// 범위 필터 적용
function applyRangeFilters(data) {
    const qMin = document.getElementById('quantityMin').value;
    const qMax = document.getElementById('quantityMax').value;
    const crdStart = document.getElementById('crdStart').value;
    const crdEnd = document.getElementById('crdEnd').value;

    return data.filter(d => {
        // 수량 범위
        if (qMin && d.quantity < Number(qMin)) return false;
        if (qMax && d.quantity > Number(qMax)) return false;

        // CRD 범위
        if (crdStart && d.crd < crdStart) return false;
        if (crdEnd && d.crd > crdEnd) return false;

        return true;
    });
}
```

4. **정규표현식 검색**:
```javascript
function regexSearch(data, pattern, fields = ['model', 'poNumber', 'destination']) {
    try {
        const regex = new RegExp(pattern, 'i');
        return data.filter(item =>
            fields.some(field => regex.test(String(getNestedValue(item, field))))
        );
    } catch (e) {
        showToast('⚠️ 정규표현식 오류: ' + e.message);
        return data;
    }
}

// 사용 예시
// regexSearch(data, '^RS.*', ['model']) // RS로 시작하는 모델
// regexSearch(data, '\\d{5}', ['poNumber']) // 5자리 숫자 PO
```

**기대 효과**:
- 필터 설정 시간 -60% (프리셋 재사용)
- 복잡한 조건 검색 가능
- 업무 효율 +45%
- 반복 작업 자동화

**트리거 키워드**: `필터`, `프리셋`, `저장`, `복잡한 조건`, `범위`, `정규식`

**협업 대상**: #Q01 (내보내기), #Q03 (설정), #09 (필터 전문가)

---

### Agent #Q03: User Settings Manager (사용자 설정 관리자)

**전문분야**: LocalStorage, 사용자 설정 저장/복원, 세션 관리

**책임**:
- 다크모드 설정 저장
- 마지막 필터 상태 복원
- 페이지 크기 기억
- 탭 상태 저장
- 컬럼 표시/숨김 설정

**핵심 기능**:

1. **설정 관리 클래스**:
```javascript
class SettingsManager {
    constructor() {
        this.settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        this.defaults = {
            darkMode: false,
            pageSize: 50,
            lastTab: 'summary',
            columnVisibility: {},
            autoRefresh: false,
            refreshInterval: 60000, // 1분
            language: 'ko',
            notifications: true
        };
    }

    // 설정 가져오기
    get(key) {
        return this.settings[key] ?? this.defaults[key];
    }

    // 설정 저장
    save(key, value) {
        this.settings[key] = value;
        localStorage.setItem('userSettings', JSON.stringify(this.settings));
        this.emit('settingChanged', { key, value });
    }

    // 여러 설정 동시 저장
    saveMultiple(obj) {
        Object.assign(this.settings, obj);
        localStorage.setItem('userSettings', JSON.stringify(this.settings));
    }

    // 설정 초기화
    reset() {
        this.settings = { ...this.defaults };
        localStorage.setItem('userSettings', JSON.stringify(this.settings));
        location.reload();
    }

    // 설정 복원
    restore() {
        // 다크모드
        if (this.get('darkMode')) {
            document.documentElement.classList.add('dark');
            document.getElementById('darkModeToggle').checked = true;
        }

        // 페이지 크기
        const pageSizeSelect = document.getElementById('pageSizeSelect');
        if (pageSizeSelect) {
            pageSizeSelect.value = this.get('pageSize');
        }

        // 마지막 탭
        const lastTab = this.get('lastTab');
        if (lastTab) {
            switchTab(lastTab);
        }

        // 컬럼 가시성
        const colVis = this.get('columnVisibility');
        Object.entries(colVis).forEach(([col, visible]) => {
            toggleColumnVisibility(col, visible);
        });

        // 자동 새로고침
        if (this.get('autoRefresh')) {
            startAutoRefresh(this.get('refreshInterval'));
        }
    }

    // 이벤트 리스너
    emit(event, data) {
        window.dispatchEvent(new CustomEvent(event, { detail: data }));
    }
}

// 전역 인스턴스
const settings = new SettingsManager();

// 페이지 로드 시 설정 복원
window.addEventListener('DOMContentLoaded', () => {
    settings.restore();
});
```

2. **설정 UI**:
```javascript
function renderSettingsPanel() {
    const settingsHTML = `
        <div class="settings-panel p-6">
            <h3 class="text-xl font-bold mb-4">⚙️ 사용자 설정</h3>

            <!-- 다크모드 -->
            <div class="setting-item mb-4">
                <label class="flex items-center justify-between">
                    <span>다크모드</span>
                    <input type="checkbox" id="darkModeToggle"
                           onchange="settings.save('darkMode', this.checked); toggleDarkMode()"
                           ${settings.get('darkMode') ? 'checked' : ''}>
                </label>
            </div>

            <!-- 페이지 크기 -->
            <div class="setting-item mb-4">
                <label class="block mb-2">기본 페이지 크기</label>
                <select id="defaultPageSize" class="input w-full"
                        onchange="settings.save('pageSize', this.value)">
                    <option value="50" ${settings.get('pageSize') == 50 ? 'selected' : ''}>50</option>
                    <option value="100" ${settings.get('pageSize') == 100 ? 'selected' : ''}>100</option>
                    <option value="200" ${settings.get('pageSize') == 200 ? 'selected' : ''}>200</option>
                    <option value="all" ${settings.get('pageSize') == 'all' ? 'selected' : ''}>전체</option>
                </select>
            </div>

            <!-- 자동 새로고침 -->
            <div class="setting-item mb-4">
                <label class="flex items-center justify-between">
                    <span>자동 새로고침</span>
                    <input type="checkbox" id="autoRefreshToggle"
                           onchange="settings.save('autoRefresh', this.checked); toggleAutoRefresh(this.checked)"
                           ${settings.get('autoRefresh') ? 'checked' : ''}>
                </label>
                <div class="mt-2" id="refreshIntervalContainer" ${settings.get('autoRefresh') ? '' : 'style="display:none"'}>
                    <label class="block mb-1 text-sm">새로고침 간격 (초)</label>
                    <input type="number" id="refreshInterval" class="input w-full"
                           value="${settings.get('refreshInterval') / 1000}"
                           onchange="settings.save('refreshInterval', this.value * 1000)">
                </div>
            </div>

            <!-- 알림 -->
            <div class="setting-item mb-4">
                <label class="flex items-center justify-between">
                    <span>브라우저 알림</span>
                    <input type="checkbox" id="notificationsToggle"
                           onchange="settings.save('notifications', this.checked); requestNotificationPermission()"
                           ${settings.get('notifications') ? 'checked' : ''}>
                </label>
            </div>

            <!-- 설정 초기화 -->
            <button onclick="if(confirm('모든 설정을 초기화하시겠습니까?')) settings.reset()"
                    class="btn-secondary w-full mt-4">
                🔄 설정 초기화
            </button>
        </div>
    `;

    return settingsHTML;
}
```

3. **세션 상태 저장**:
```javascript
// 필터 상태 자동 저장
function autoSaveFilterState() {
    const filterState = {
        month: document.getElementById('monthFilter')?.value,
        destination: document.getElementById('destFilter')?.value,
        vendor: document.getElementById('vendorFilter')?.value,
        factory: document.getElementById('factoryFilter')?.value,
        status: document.getElementById('statusFilter')?.value,
        quickDate: document.getElementById('quickDateFilter')?.value,
        search: document.getElementById('searchInput')?.value
    };

    settings.save('lastFilterState', filterState);
}

// 필터 변경 시 자동 저장
document.querySelectorAll('#monthFilter, #destFilter, #vendorFilter, #factoryFilter, #statusFilter, #quickDateFilter, #searchInput').forEach(el => {
    el.addEventListener('change', autoSaveFilterState);
});

// 페이지 로드 시 필터 복원
function restoreFilterState() {
    const filterState = settings.get('lastFilterState');
    if (!filterState) return;

    Object.entries(filterState).forEach(([key, value]) => {
        const element = document.getElementById(key + 'Filter') || document.getElementById(key);
        if (element && value) {
            element.value = value;
        }
    });

    applyFilters();
}
```

**기대 효과**:
- 반복 설정 시간 -85%
- 사용자 편의성 +50%
- 이탈률 -25%
- 재방문 의도 +40%

**트리거 키워드**: `설정`, `저장`, `복원`, `LocalStorage`, `다크모드`, `세션`

**협업 대상**: #Q02 (필터), #Q04 (알림), #06 (UI 설계자)

---

### Agent #Q04: Notification System Engineer (알림 시스템 엔지니어)

**전문분야**: 브라우저 알림, 실시간 경고, 이벤트 트리거

**책임**:
- 지연 오더 알림
- 마감 임박 경고
- 데이터 업데이트 알림
- 커스텀 알림 규칙
- 알림 히스토리

**핵심 기능**:

1. **알림 권한 요청 및 관리**:
```javascript
class NotificationManager {
    constructor() {
        this.permission = Notification.permission;
        this.rules = JSON.parse(localStorage.getItem('notificationRules') || '[]');
    }

    // 권한 요청
    async requestPermission() {
        if (this.permission === 'granted') return true;

        this.permission = await Notification.requestPermission();
        return this.permission === 'granted';
    }

    // 알림 전송
    send(title, options = {}) {
        if (this.permission !== 'granted') return;

        const notification = new Notification(title, {
            icon: '/favicon.ico',
            badge: '/badge.png',
            ...options
        });

        notification.onclick = () => {
            window.focus();
            if (options.onClick) options.onClick();
        };

        // 히스토리 저장
        this.saveHistory(title, options.body);
    }

    // 지연 오더 알림
    checkDelayedOrders() {
        const delayed = filteredData.filter(d => isDelayed(d));

        if (delayed.length > 0) {
            this.send('🚨 지연 오더 감지', {
                body: `${delayed.length}건의 오더가 지연되었습니다.`,
                onClick: () => {
                    document.getElementById('quickDateFilter').value = 'delayed';
                    applyFilters();
                    switchTab('data');
                }
            });
        }
    }

    // 마감 임박 경고 (D-3)
    checkUpcomingDeadlines() {
        const upcoming = filteredData.filter(d => {
            if (!d.crd) return false;
            const daysUntil = (new Date(d.crd) - new Date()) / (1000 * 60 * 60 * 24);
            return daysUntil > 0 && daysUntil <= 3;
        });

        if (upcoming.length > 0) {
            this.send('⏰ 마감 임박', {
                body: `${upcoming.length}건의 오더가 3일 내 마감입니다.`,
                onClick: () => switchTab('data')
            });
        }
    }

    // 커스텀 규칙 추가
    addRule(rule) {
        this.rules.push({
            id: Date.now(),
            ...rule,
            enabled: true
        });
        localStorage.setItem('notificationRules', JSON.stringify(this.rules));
    }

    // 규칙 체크
    checkRules(data) {
        this.rules.filter(r => r.enabled).forEach(rule => {
            const matched = data.filter(d => this.evaluateRule(d, rule));

            if (matched.length > 0) {
                this.send(rule.title, {
                    body: rule.message.replace('{count}', matched.length),
                    onClick: rule.onClick
                });
            }
        });
    }

    // 규칙 평가
    evaluateRule(data, rule) {
        // 예: { field: 'quantity', operator: '>', value: 5000 }
        const value = getNestedValue(data, rule.field);

        switch (rule.operator) {
            case '>': return Number(value) > Number(rule.value);
            case '<': return Number(value) < Number(rule.value);
            case '=': return value == rule.value;
            case 'contains': return String(value).includes(rule.value);
            default: return false;
        }
    }

    // 히스토리 저장
    saveHistory(title, body) {
        const history = JSON.parse(localStorage.getItem('notificationHistory') || '[]');
        history.unshift({
            title,
            body,
            timestamp: new Date().toISOString()
        });

        // 최근 100개만 유지
        localStorage.setItem('notificationHistory', JSON.stringify(history.slice(0, 100)));
    }
}

// 전역 인스턴스
const notifications = new NotificationManager();

// 주기적 체크 (5분마다)
setInterval(() => {
    if (settings.get('notifications')) {
        notifications.checkDelayedOrders();
        notifications.checkUpcomingDeadlines();
        notifications.checkRules(filteredData);
    }
}, 5 * 60 * 1000);
```

2. **알림 규칙 UI**:
```javascript
function renderNotificationRules() {
    return `
        <div class="notification-rules p-4">
            <h4 class="font-bold mb-3">알림 규칙 설정</h4>

            <div class="mb-4">
                <button onclick="showAddRuleModal()" class="btn-primary w-full">
                    ➕ 새 규칙 추가
                </button>
            </div>

            <div id="rulesList">
                ${notifications.rules.map(rule => `
                    <div class="rule-item p-3 border rounded mb-2 ${rule.enabled ? '' : 'opacity-50'}">
                        <div class="flex items-center justify-between mb-1">
                            <span class="font-medium">${escapeHtml(rule.title)}</span>
                            <input type="checkbox" ${rule.enabled ? 'checked' : ''}
                                   onchange="toggleRule(${rule.id}, this.checked)">
                        </div>
                        <div class="text-sm text-gray-600">${escapeHtml(rule.message)}</div>
                        <div class="text-xs text-gray-400 mt-1">
                            조건: ${rule.field} ${rule.operator} ${rule.value}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}
```

**기대 효과**:
- 지연 감지 시간 -95% (실시간)
- 문제 대응 속도 +150%
- 사용자 경각심 +60%
- 놓치는 마감 -80%

**트리거 키워드**: `알림`, `notification`, `경고`, `실시간`, `이벤트`, `트리거`

**협업 대상**: #Q03 (설정), #Q02 (필터), #04 (비즈니스 로직)

---

### Agent #Q05: Report Generator (리포트 생성 전문가)

**전문분야**: 자동 리포트, 통계 요약, 시각화 리포트

**책임**:
- 일일/주간/월간 리포트 생성
- 공장별 성과 리포트
- 지연 오더 분석 리포트
- 차트 포함 PDF 리포트
- 이메일 전송 준비

**핵심 기능**:

1. **리포트 생성 엔진**:
```javascript
class ReportGenerator {
    constructor() {
        this.templates = {
            daily: this.generateDailyReport,
            weekly: this.generateWeeklyReport,
            monthly: this.generateMonthlyReport,
            factory: this.generateFactoryReport,
            delayed: this.generateDelayedReport
        };
    }

    // 일일 리포트
    generateDailyReport(date = new Date()) {
        const dateStr = date.toISOString().slice(0, 10);
        const data = filteredData.filter(d =>
            d.production?.wh_out?.expected_date === dateStr
        );

        return {
            title: `일일 생산 리포트 - ${dateStr}`,
            summary: {
                totalOrders: data.length,
                completedOrders: data.filter(d => d.production?.wh_out?.status === 'completed').length,
                delayedOrders: data.filter(d => isDelayed(d)).length,
                totalQuantity: data.reduce((sum, d) => sum + d.quantity, 0)
            },
            byFactory: this.groupByFactory(data),
            byDestination: this.groupByDestination(data),
            delayedDetails: data.filter(d => isDelayed(d)),
            charts: {
                factoryCompletion: this.generateFactoryCompletionChart(data),
                processFlow: this.generateProcessFlowChart(data)
            }
        };
    }

    // 주간 리포트
    generateWeeklyReport(weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const data = filteredData.filter(d => {
            const date = new Date(d.production?.wh_out?.expected_date);
            return date >= weekStart && date < weekEnd;
        });

        return {
            title: `주간 생산 리포트 (${weekStart.toISOString().slice(0, 10)} ~ ${weekEnd.toISOString().slice(0, 10)})`,
            summary: {
                totalOrders: data.length,
                avgCompletionRate: this.calculateAvgCompletionRate(data),
                topDestinations: this.getTopN(data, 'destination', 5),
                topModels: this.getTopN(data, 'model', 5)
            },
            trends: {
                dailyOutput: this.getDailyOutput(data, weekStart, 7),
                delayTrend: this.getDelayTrend(data, weekStart, 7)
            },
            recommendations: this.generateRecommendations(data)
        };
    }

    // 월간 리포트
    generateMonthlyReport(year, month) {
        const data = filteredData.filter(d => {
            const date = new Date(d.production?.wh_out?.expected_date);
            return date.getFullYear() === year && date.getMonth() === month - 1;
        });

        return {
            title: `월간 생산 리포트 - ${year}년 ${month}월`,
            summary: {
                totalOrders: data.length,
                totalQuantity: data.reduce((sum, d) => sum + d.quantity, 0),
                completionRate: (data.filter(d => d.production?.wh_out?.status === 'completed').length / data.length * 100).toFixed(1),
                delayRate: (data.filter(d => isDelayed(d)).length / data.length * 100).toFixed(1)
            },
            byFactory: this.groupByFactory(data),
            byDestination: this.groupByDestination(data),
            performanceMetrics: {
                onTimeDelivery: this.calculateOnTimeDelivery(data),
                avgLeadTime: this.calculateAvgLeadTime(data),
                bottlenecks: this.identifyBottlenecks(data)
            },
            charts: {
                monthlyTrend: this.generateMonthlyTrendChart(data),
                factoryPerformance: this.generateFactoryPerformanceChart(data)
            }
        };
    }

    // 공장별 리포트
    generateFactoryReport(factoryId) {
        const data = filteredData.filter(d => d.factory === factoryId);

        return {
            title: `Factory ${factoryId} 생산 리포트`,
            summary: {
                totalOrders: data.length,
                activeOrders: data.filter(d => d.production?.wh_out?.status !== 'completed').length,
                completedOrders: data.filter(d => d.production?.wh_out?.status === 'completed').length
            },
            processAnalysis: {
                s_cut: this.analyzeProcess(data, 's_cut'),
                sew_bal: this.analyzeProcess(data, 'sew_bal'),
                wh_out: this.analyzeProcess(data, 'wh_out')
            },
            topModels: this.getTopN(data, 'model', 10),
            recommendations: this.generateFactoryRecommendations(data)
        };
    }

    // PDF 생성
    async exportToPDF(report) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // 타이틀
        doc.setFontSize(18);
        doc.text(report.title, 14, 20);

        // 요약
        doc.setFontSize(12);
        let y = 35;
        Object.entries(report.summary).forEach(([key, value]) => {
            doc.text(`${this.formatLabel(key)}: ${value}`, 14, y);
            y += 7;
        });

        // 차트 (이미지로 변환)
        if (report.charts) {
            y += 10;
            for (const [chartName, chartData] of Object.entries(report.charts)) {
                const canvas = await this.chartToCanvas(chartData);
                const imgData = canvas.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', 14, y, 180, 100);
                y += 110;

                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }
            }
        }

        return doc;
    }

    // 헬퍼 함수들
    groupByFactory(data) {
        return data.reduce((acc, d) => {
            acc[d.factory] = acc[d.factory] || [];
            acc[d.factory].push(d);
            return acc;
        }, {});
    }

    calculateAvgCompletionRate(data) {
        const rates = data.map(d => {
            const completed = d.production?.wh_out?.completed || 0;
            return (completed / d.quantity * 100);
        });
        return (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1);
    }

    identifyBottlenecks(data) {
        const processes = ['s_cut', 'pre_sew', 'sew_bal', 'osc', 'ass', 'wh_in', 'wh_out'];

        return processes.map(proc => {
            const avgCompletion = data.reduce((sum, d) => {
                return sum + ((d.production?.[proc]?.completed || 0) / d.quantity);
            }, 0) / data.length * 100;

            return { process: proc, avgCompletion: avgCompletion.toFixed(1) };
        }).sort((a, b) => a.avgCompletion - b.avgCompletion);
    }
}

// 전역 인스턴스
const reportGen = new ReportGenerator();
```

2. **리포트 UI**:
```javascript
function showReportModal() {
    const modal = `
        <div class="modal-overlay" onclick="closeReportModal()">
            <div class="modal-content bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold mb-4">📊 리포트 생성</h3>

                <div class="grid grid-cols-2 gap-4">
                    <button onclick="generateReport('daily')" class="btn-primary p-4 text-left">
                        <div class="font-bold">일일 리포트</div>
                        <div class="text-sm opacity-80">오늘의 생산 현황</div>
                    </button>

                    <button onclick="generateReport('weekly')" class="btn-primary p-4 text-left">
                        <div class="font-bold">주간 리포트</div>
                        <div class="text-sm opacity-80">최근 7일 트렌드</div>
                    </button>

                    <button onclick="generateReport('monthly')" class="btn-primary p-4 text-left">
                        <div class="font-bold">월간 리포트</div>
                        <div class="text-sm opacity-80">이번 달 전체 분석</div>
                    </button>

                    <button onclick="generateReport('factory')" class="btn-primary p-4 text-left">
                        <div class="font-bold">공장별 리포트</div>
                        <div class="text-sm opacity-80">Factory A/B/C/D 개별</div>
                    </button>
                </div>

                <button onclick="closeReportModal()" class="mt-4 w-full btn-ghost">
                    취소
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}
```

**기대 효과**:
- 리포트 작성 시간 -90%
- 데이터 기반 의사결정 +70%
- 경영진 보고 편의성 +85%
- 인사이트 발견 +55%

**트리거 키워드**: `리포트`, `report`, `분석`, `통계`, `요약`, `PDF`

**협업 대상**: #Q01 (내보내기), #07 (차트), #05 (데이터 시각화)

---

### Agent #Q06: Mobile UX Optimizer (모바일 UX 최적화 전문가)

**전문분야**: 모바일 반응형, 터치 제스처, 모바일 성능

**책임**:
- 768px 이하 완벽 대응
- 터치 제스처 (스와이프, 핀치)
- Bottom Sheet 모달
- 모바일 필터 UI
- 가로/세로 모드 대응

**핵심 기능**:

1. **모바일 감지 및 최적화**:
```javascript
class MobileOptimizer {
    constructor() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
        this.isTouch = 'ontouchstart' in window;
        this.viewportWidth = window.innerWidth;

        this.init();
    }

    init() {
        if (this.isMobile || this.viewportWidth < 768) {
            this.applyMobileOptimizations();
        }

        window.addEventListener('resize', () => {
            this.viewportWidth = window.innerWidth;
            if (this.viewportWidth < 768) {
                this.applyMobileOptimizations();
            } else {
                this.applyDesktopOptimizations();
            }
        });
    }

    applyMobileOptimizations() {
        // 테이블 → 카드 레이아웃
        this.convertTableToCards();

        // 필터 → Bottom Sheet
        this.convertFiltersToBottomSheet();

        // 터치 제스처 활성화
        this.enableTouchGestures();

        // 폰트 크기 조정
        document.documentElement.style.fontSize = '14px';

        // 페이지 크기 기본값 감소
        document.getElementById('pageSizeSelect').value = '20';

        // 차트 높이 축소
        document.querySelectorAll('canvas').forEach(canvas => {
            canvas.style.height = '200px';
        });
    }

    // 테이블 → 카드 변환
    convertTableToCards() {
        const tableContainer = document.getElementById('dataTableContainer');
        if (!tableContainer) return;

        tableContainer.classList.add('mobile-card-view');

        // CSS로 제어
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                #dataTable {
                    display: block;
                }
                #dataTable thead {
                    display: none;
                }
                #dataTable tbody {
                    display: block;
                }
                #dataTable tr {
                    display: block;
                    margin-bottom: 1rem;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    padding: 0.75rem;
                    background: white;
                }
                .dark #dataTable tr {
                    background: #1f2937;
                    border-color: #374151;
                }
                #dataTable td {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid #f3f4f6;
                }
                .dark #dataTable td {
                    border-bottom-color: #374151;
                }
                #dataTable td:before {
                    content: attr(data-label);
                    font-weight: bold;
                    margin-right: 1rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Bottom Sheet 필터
    convertFiltersToBottomSheet() {
        const filterPanel = document.getElementById('filterPanel');
        if (!filterPanel) return;

        // 모바일에서는 필터를 숨기고 버튼으로 표시
        filterPanel.classList.add('bottom-sheet', 'hidden');

        const filterButton = document.createElement('button');
        filterButton.className = 'mobile-filter-btn fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-4 shadow-lg z-50';
        filterButton.innerHTML = '🔍 필터';
        filterButton.onclick = () => this.toggleBottomSheet();

        document.body.appendChild(filterButton);
    }

    toggleBottomSheet() {
        const sheet = document.getElementById('filterPanel');
        const overlay = document.createElement('div');
        overlay.className = 'bottom-sheet-overlay';
        overlay.onclick = () => this.toggleBottomSheet();

        if (sheet.classList.contains('hidden')) {
            sheet.classList.remove('hidden');
            sheet.classList.add('bottom-sheet-open');
            document.body.appendChild(overlay);
        } else {
            sheet.classList.add('hidden');
            sheet.classList.remove('bottom-sheet-open');
            document.querySelector('.bottom-sheet-overlay')?.remove();
        }
    }

    // 터치 제스처
    enableTouchGestures() {
        let startX, startY;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;

            const diffX = endX - startX;
            const diffY = endY - startY;

            // 가로 스와이프 (탭 전환)
            if (Math.abs(diffX) > 100 && Math.abs(diffY) < 50) {
                if (diffX > 0) {
                    // 오른쪽 스와이프 → 이전 탭
                    this.switchToPrevTab();
                } else {
                    // 왼쪽 스와이프 → 다음 탭
                    this.switchToNextTab();
                }
            }

            // 아래 스와이프 (새로고침)
            if (diffY > 150 && Math.abs(diffX) < 50 && window.scrollY === 0) {
                location.reload();
            }
        });
    }

    switchToNextTab() {
        const tabs = ['summary', 'monthly', 'destination', 'model', 'factory', 'vendor', 'heatmap', 'data'];
        const current = tabs.findIndex(t => document.querySelector(`[data-tab="${t}"]`)?.classList.contains('active'));
        const next = (current + 1) % tabs.length;
        switchTab(tabs[next]);
    }

    switchToPrevTab() {
        const tabs = ['summary', 'monthly', 'destination', 'model', 'factory', 'vendor', 'heatmap', 'data'];
        const current = tabs.findIndex(t => document.querySelector(`[data-tab="${t}"]`)?.classList.contains('active'));
        const prev = (current - 1 + tabs.length) % tabs.length;
        switchTab(tabs[prev]);
    }
}

// 전역 인스턴스
const mobileOptimizer = new MobileOptimizer();
```

2. **모바일 차트 최적화**:
```javascript
function createMobileFriendlyChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    const isMobile = window.innerWidth < 768;

    // 모바일용 설정 조정
    if (isMobile) {
        config.options = config.options || {};
        config.options.responsive = true;
        config.options.maintainAspectRatio = false;
        config.options.plugins = config.options.plugins || {};
        config.options.plugins.legend = {
            display: true,
            position: 'bottom', // 모바일에서는 하단
            labels: {
                boxWidth: 12,
                font: { size: 10 }
            }
        };
        config.options.plugins.tooltip = {
            enabled: true,
            mode: 'index',
            intersect: false,
            bodyFont: { size: 10 }
        };

        // 축 레이블 크기 축소
        if (config.options.scales) {
            Object.values(config.options.scales).forEach(scale => {
                scale.ticks = scale.ticks || {};
                scale.ticks.font = { size: 9 };
            });
        }
    }

    return new Chart(canvas, config);
}
```

**기대 효과**:
- 모바일 사용성 +120%
- 모바일 이탈률 -45%
- 터치 편의성 +90%
- 모바일 트래픽 +65%

**트리거 키워드**: `모바일`, `mobile`, `반응형`, `터치`, `제스처`, `768px`

**협업 대상**: #Q03 (설정), #06 (UI 설계), #05 (모바일 UX)

---

### Agent #Q07: Memory & Performance Tuner (메모리 및 성능 튜너)

**전문분야**: 메모리 누수 방지, 가비지 컬렉션, 성능 프로파일링

**책임**:
- WeakMap/WeakSet 활용
- 이벤트 리스너 정리
- 차트 인스턴스 관리
- Intersection Observer
- 메모리 프로파일링

**핵심 기능**:

1. **메모리 관리 시스템**:
```javascript
class MemoryManager {
    constructor() {
        this.chartInstances = new WeakMap();
        this.eventListeners = new Map();
        this.observers = new Set();

        this.startMonitoring();
    }

    // 차트 인스턴스 재사용
    getOrCreateChart(canvas, config) {
        if (this.chartInstances.has(canvas)) {
            const chart = this.chartInstances.get(canvas);
            chart.data = config.data;
            chart.update('none'); // 애니메이션 없이 업데이트
            return chart;
        }

        const chart = new Chart(canvas, config);
        this.chartInstances.set(canvas, chart);
        return chart;
    }

    // 차트 파괴
    destroyChart(canvas) {
        const chart = this.chartInstances.get(canvas);
        if (chart) {
            chart.destroy();
            this.chartInstances.delete(canvas);
        }
    }

    // 이벤트 리스너 등록 및 추적
    addEventListener(element, event, handler, options) {
        element.addEventListener(event, handler, options);

        const key = `${element.id || 'unknown'}-${event}`;
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, []);
        }
        this.eventListeners.get(key).push({ element, event, handler });
    }

    // 특정 엘리먼트의 모든 리스너 제거
    removeAllListeners(element) {
        for (const [key, listeners] of this.eventListeners) {
            const filtered = listeners.filter(l => {
                if (l.element === element) {
                    element.removeEventListener(l.event, l.handler);
                    return false;
                }
                return true;
            });

            if (filtered.length === 0) {
                this.eventListeners.delete(key);
            } else {
                this.eventListeners.set(key, filtered);
            }
        }
    }

    // Intersection Observer (지연 로딩)
    observeVisibility(elements, callback) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target);
                }
            });
        }, { threshold: 0.1 });

        elements.forEach(el => observer.observe(el));
        this.observers.add(observer);

        return observer;
    }

    // Observer 정리
    disconnectObserver(observer) {
        observer.disconnect();
        this.observers.delete(observer);
    }

    // 메모리 모니터링
    startMonitoring() {
        if (!performance.memory) {
            console.warn('performance.memory API not available');
            return;
        }

        setInterval(() => {
            const mem = performance.memory;
            const usedMB = (mem.usedJSHeapSize / 1024 / 1024).toFixed(1);
            const totalMB = (mem.totalJSHeapSize / 1024 / 1024).toFixed(1);
            const limitMB = (mem.jsHeapSizeLimit / 1024 / 1024).toFixed(1);

            console.log(`Memory: ${usedMB}MB / ${totalMB}MB (Limit: ${limitMB}MB)`);

            // 경고 임계값 (150MB)
            if (mem.usedJSHeapSize > 150 * 1024 * 1024) {
                console.warn('⚠️ High memory usage detected');
                this.triggerGarbageCollection();
            }
        }, 60000); // 1분마다
    }

    // 강제 GC 트리거 (가능한 경우)
    triggerGarbageCollection() {
        // 참조 정리
        this.cleanupStaleReferences();

        // 사용되지 않는 차트 파괴
        const visibleCharts = Array.from(document.querySelectorAll('canvas')).filter(c => c.offsetParent !== null);
        const allCharts = Array.from(this.chartInstances.keys());

        allCharts.forEach(canvas => {
            if (!visibleCharts.includes(canvas)) {
                this.destroyChart(canvas);
            }
        });
    }

    // 오래된 참조 정리
    cleanupStaleReferences() {
        // DOM에 없는 엘리먼트의 리스너 제거
        for (const [key, listeners] of this.eventListeners) {
            const filtered = listeners.filter(l => document.contains(l.element));

            if (filtered.length === 0) {
                this.eventListeners.delete(key);
            } else if (filtered.length < listeners.length) {
                this.eventListeners.set(key, filtered);
            }
        }
    }

    // 메모리 리포트
    getMemoryReport() {
        if (!performance.memory) return null;

        const mem = performance.memory;
        return {
            used: (mem.usedJSHeapSize / 1024 / 1024).toFixed(1) + ' MB',
            total: (mem.totalJSHeapSize / 1024 / 1024).toFixed(1) + ' MB',
            limit: (mem.jsHeapSizeLimit / 1024 / 1024).toFixed(1) + ' MB',
            usage: ((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100).toFixed(1) + '%',
            charts: this.chartInstances.size,
            listeners: Array.from(this.eventListeners.values()).reduce((sum, arr) => sum + arr.length, 0),
            observers: this.observers.size
        };
    }
}

// 전역 인스턴스
const memoryManager = new MemoryManager();
```

2. **지연 로딩 구현**:
```javascript
// 차트 지연 로딩
function setupLazyCharts() {
    const chartContainers = document.querySelectorAll('.chart-container');

    memoryManager.observeVisibility(chartContainers, (container) => {
        const canvas = container.querySelector('canvas');
        const chartType = container.dataset.chartType;

        if (!canvas.dataset.initialized) {
            console.log(`Initializing chart: ${chartType}`);
            initializeChart(chartType, canvas);
            canvas.dataset.initialized = 'true';
        }
    });
}

// 테이블 행 가상 스크롤링
class VirtualScroller {
    constructor(container, items, rowHeight = 50) {
        this.container = container;
        this.items = items;
        this.rowHeight = rowHeight;
        this.visibleRows = Math.ceil(container.clientHeight / rowHeight) + 5;
        this.startIndex = 0;

        this.render();
        this.attachScrollListener();
    }

    render() {
        const endIndex = Math.min(this.startIndex + this.visibleRows, this.items.length);
        const visibleItems = this.items.slice(this.startIndex, endIndex);

        this.container.innerHTML = visibleItems.map((item, i) =>
            this.renderRow(item, this.startIndex + i)
        ).join('');

        // 스크롤 높이 유지
        this.container.style.paddingTop = `${this.startIndex * this.rowHeight}px`;
        this.container.style.paddingBottom = `${(this.items.length - endIndex) * this.rowHeight}px`;
    }

    renderRow(item, index) {
        return `
            <tr data-index="${index}">
                <td>${escapeHtml(item.factory)}</td>
                <td>${escapeHtml(item.model)}</td>
                <td>${escapeHtml(item.destination)}</td>
                <td>${item.quantity}</td>
            </tr>
        `;
    }

    attachScrollListener() {
        this.container.addEventListener('scroll', () => {
            const scrollTop = this.container.scrollTop;
            const newStartIndex = Math.floor(scrollTop / this.rowHeight);

            if (newStartIndex !== this.startIndex) {
                this.startIndex = newStartIndex;
                this.render();
            }
        });
    }
}
```

**기대 효과**:
- 메모리 사용량 -35%
- 가비지 컬렉션 빈도 -50%
- 장시간 사용 안정성 +80%
- 대용량 데이터 처리 능력 +120%

**트리거 키워드**: `메모리`, `누수`, `leak`, `성능`, `GC`, `WeakMap`, `Observer`

**협업 대상**: #Q06 (모바일), #04 (메모리 최적화), #13 (메모리 전문가)

---

### Agent #Q08: Data Analytics Expert (데이터 분석 전문가)

**전문분야**: 트렌드 분석, 예측 알고리즘, 이상치 탐지

**책임**:
- 생산 트렌드 분석
- 지연 예측 모델
- 이상치 감지
- 상관관계 분석
- 데이터 시각화 인사이트

**핵심 기능**:

1. **트렌드 분석 엔진**:
```javascript
class DataAnalytics {
    constructor(data) {
        this.data = data;
    }

    // 이동 평균 (Moving Average)
    movingAverage(values, period = 7) {
        const result = [];
        for (let i = 0; i < values.length; i++) {
            const start = Math.max(0, i - period + 1);
            const window = values.slice(start, i + 1);
            const avg = window.reduce((a, b) => a + b, 0) / window.length;
            result.push(avg);
        }
        return result;
    }

    // 선형 회귀 (예측)
    linearRegression(xValues, yValues) {
        const n = xValues.length;
        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = yValues.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept, predict: (x) => slope * x + intercept };
    }

    // 지연 예측
    predictDelays(days = 7) {
        // 날짜별 지연 건수 집계
        const delaysByDate = {};
        this.data.filter(d => isDelayed(d)).forEach(d => {
            const date = d.crd;
            delaysByDate[date] = (delaysByDate[date] || 0) + 1;
        });

        const dates = Object.keys(delaysByDate).sort();
        const counts = dates.map(d => delaysByDate[d]);

        // 최근 30일 데이터로 학습
        const recent = counts.slice(-30);
        const xValues = recent.map((_, i) => i);
        const yValues = recent;

        const model = this.linearRegression(xValues, yValues);

        // 향후 7일 예측
        const predictions = [];
        for (let i = 1; i <= days; i++) {
            const futureX = recent.length + i;
            predictions.push({
                date: this.addDays(new Date(), i).toISOString().slice(0, 10),
                predicted: Math.max(0, Math.round(model.predict(futureX)))
            });
        }

        return predictions;
    }

    // 이상치 탐지 (Z-score)
    detectOutliers(values, threshold = 2) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        return values.map((value, index) => {
            const zScore = (value - mean) / stdDev;
            return {
                index,
                value,
                zScore,
                isOutlier: Math.abs(zScore) > threshold
            };
        }).filter(item => item.isOutlier);
    }

    // 병목 공정 분석
    identifyBottlenecks() {
        const processes = ['s_cut', 'pre_sew', 'sew_input', 'sew_bal', 'osc', 'ass', 'wh_in', 'wh_out'];

        const avgCompletionRates = processes.map(proc => {
            const rates = this.data.map(d => {
                const completed = d.production?.[proc]?.completed || 0;
                return (completed / d.quantity) * 100;
            });

            const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
            const min = Math.min(...rates);
            const max = Math.max(...rates);

            return {
                process: proc,
                avgCompletion: avg.toFixed(1),
                minCompletion: min.toFixed(1),
                maxCompletion: max.toFixed(1),
                variance: this.variance(rates).toFixed(1)
            };
        });

        // 완료율이 낮은 순으로 정렬
        return avgCompletionRates.sort((a, b) => a.avgCompletion - b.avgCompletion);
    }

    // 상관관계 분석
    correlationAnalysis() {
        // 수량과 지연 간 상관관계
        const quantities = this.data.map(d => d.quantity);
        const delays = this.data.map(d => isDelayed(d) ? 1 : 0);
        const qtyDelayCorr = this.correlation(quantities, delays);

        // 공장과 완료율 간 관계
        const factoryCompletions = ['A', 'B', 'C', 'D'].map(factory => {
            const factoryData = this.data.filter(d => d.factory === factory);
            const avgCompletion = factoryData.reduce((sum, d) => {
                return sum + ((d.production?.wh_out?.completed || 0) / d.quantity);
            }, 0) / factoryData.length * 100;

            return { factory, avgCompletion };
        });

        return {
            quantityDelayCorrelation: qtyDelayCorr.toFixed(3),
            factoryPerformance: factoryCompletions
        };
    }

    // 헬퍼 함수들
    variance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    }

    correlation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

        return numerator / denominator;
    }

    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
}

// 사용 예시
const analytics = new DataAnalytics(filteredData);

// 트렌드 분석
const predictions = analytics.predictDelays(7);
console.log('향후 7일 지연 예측:', predictions);

// 병목 공정
const bottlenecks = analytics.identifyBottlenecks();
console.log('병목 공정:', bottlenecks);

// 상관관계
const correlations = analytics.correlationAnalysis();
console.log('상관관계 분석:', correlations);
```

2. **인사이트 대시보드**:
```javascript
function renderInsightsDashboard() {
    const analytics = new DataAnalytics(filteredData);

    const predictions = analytics.predictDelays(7);
    const bottlenecks = analytics.identifyBottlenecks();
    const correlations = analytics.correlationAnalysis();

    return `
        <div class="insights-dashboard p-6">
            <h3 class="text-xl font-bold mb-4">📈 데이터 인사이트</h3>

            <!-- 지연 예측 -->
            <div class="insight-card mb-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <h4 class="font-bold mb-2">향후 7일 지연 예측</h4>
                <div class="grid grid-cols-7 gap-2">
                    ${predictions.map(p => `
                        <div class="text-center">
                            <div class="text-xs text-gray-600 dark:text-gray-400">
                                ${p.date.slice(5)}
                            </div>
                            <div class="text-lg font-bold ${p.predicted > 10 ? 'text-red-600' : 'text-green-600'}">
                                ${p.predicted}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 병목 공정 -->
            <div class="insight-card mb-4 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                <h4 class="font-bold mb-2">🚧 병목 공정 TOP 3</h4>
                <div class="space-y-2">
                    ${bottlenecks.slice(0, 3).map((b, i) => `
                        <div class="flex items-center justify-between">
                            <span class="font-medium">${i + 1}. ${b.process.toUpperCase()}</span>
                            <span class="text-red-600 font-bold">${b.avgCompletion}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 상관관계 -->
            <div class="insight-card p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                <h4 class="font-bold mb-2">🔗 상관관계 분석</h4>
                <p class="text-sm">
                    수량-지연 상관계수: <strong>${correlations.quantityDelayCorrelation}</strong>
                </p>
                <div class="mt-2 space-y-1">
                    ${correlations.factoryPerformance.map(f => `
                        <div class="flex justify-between text-sm">
                            <span>Factory ${f.factory}</span>
                            <span>${f.avgCompletion.toFixed(1)}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}
```

**기대 효과**:
- 예측 정확도 +70%
- 사전 대응 능력 +85%
- 병목 해소 시간 -60%
- 데이터 기반 의사결정 +90%

**트리거 키워드**: `분석`, `analytics`, `예측`, `트렌드`, `인사이트`, `상관관계`

**협업 대상**: #Q05 (리포트), #08 (데이터 분석), #05 (데이터 시각화)

---

### Agent #Q09: Accessibility Auditor (접근성 감사 전문가)

**전문분야**: WCAG 2.1, ARIA, 키보드 네비게이션, 스크린 리더

**책임**:
- WCAG 2.1 AA 준수
- ARIA 속성 추가
- 키보드 단축키
- 색맹 대응
- 포커스 관리

**핵심 기능**:

1. **접근성 감사 도구**:
```javascript
class AccessibilityAuditor {
    constructor() {
        this.violations = [];
        this.warnings = [];
        this.passed = [];
    }

    // 전체 감사 실행
    runAudit() {
        this.violations = [];
        this.warnings = [];
        this.passed = [];

        this.checkImages();
        this.checkFormLabels();
        this.checkHeadings();
        this.checkColorContrast();
        this.checkARIA();
        this.checkKeyboardNav();
        this.checkFocusIndicators();

        return this.generateReport();
    }

    // 이미지 alt 텍스트 검증
    checkImages() {
        const images = document.querySelectorAll('img');
        images.forEach((img, i) => {
            if (!img.alt) {
                this.violations.push({
                    type: 'missing-alt',
                    element: img,
                    message: `Image #${i} missing alt text`,
                    wcag: '1.1.1 (A)'
                });
            } else if (img.alt.trim() === '') {
                this.warnings.push({
                    type: 'empty-alt',
                    element: img,
                    message: `Image #${i} has empty alt text`
                });
            } else {
                this.passed.push({ type: 'alt-text', element: img });
            }
        });
    }

    // 폼 레이블 검증
    checkFormLabels() {
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const id = input.id;
            const label = id ? document.querySelector(`label[for="${id}"]`) : null;
            const ariaLabel = input.getAttribute('aria-label');
            const ariaLabelledby = input.getAttribute('aria-labelledby');

            if (!label && !ariaLabel && !ariaLabelledby) {
                this.violations.push({
                    type: 'missing-label',
                    element: input,
                    message: `Input "${input.name || input.id}" has no label`,
                    wcag: '3.3.2 (A)',
                    fix: `Add <label for="${id}">Label</label> or aria-label`
                });
            } else {
                this.passed.push({ type: 'form-label', element: input });
            }
        });
    }

    // 제목 계층 검증
    checkHeadings() {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const levels = headings.map(h => parseInt(h.tagName[1]));

        // H1이 하나만 있는지 확인
        const h1Count = headings.filter(h => h.tagName === 'H1').length;
        if (h1Count === 0) {
            this.warnings.push({
                type: 'no-h1',
                message: 'Page should have exactly one H1'
            });
        } else if (h1Count > 1) {
            this.warnings.push({
                type: 'multiple-h1',
                message: `Page has ${h1Count} H1 elements`
            });
        }

        // 레벨 건너뛰기 확인
        for (let i = 1; i < levels.length; i++) {
            if (levels[i] - levels[i - 1] > 1) {
                this.violations.push({
                    type: 'heading-skip',
                    element: headings[i],
                    message: `Heading level skipped: H${levels[i - 1]} → H${levels[i]}`,
                    wcag: '1.3.1 (A)'
                });
            }
        }
    }

    // 색상 대비 검증
    checkColorContrast() {
        const textElements = document.querySelectorAll('p, span, a, button, label, div');

        textElements.forEach(el => {
            const styles = window.getComputedStyle(el);
            const color = styles.color;
            const bgColor = styles.backgroundColor;
            const fontSize = parseFloat(styles.fontSize);

            const contrast = this.calculateContrast(color, bgColor);
            const isLargeText = fontSize >= 18 || (fontSize >= 14 && styles.fontWeight >= 700);

            const requiredRatio = isLargeText ? 3 : 4.5; // AA 기준

            if (contrast < requiredRatio) {
                this.violations.push({
                    type: 'low-contrast',
                    element: el,
                    message: `Contrast ratio ${contrast.toFixed(2)}:1 is below ${requiredRatio}:1`,
                    wcag: '1.4.3 (AA)'
                });
            }
        });
    }

    // ARIA 속성 검증
    checkARIA() {
        // role이 있는 요소는 적절한 ARIA 속성이 있어야 함
        const roledElements = document.querySelectorAll('[role]');

        roledElements.forEach(el => {
            const role = el.getAttribute('role');

            // button role은 aria-label 또는 텍스트 필요
            if (role === 'button' && !el.textContent.trim() && !el.getAttribute('aria-label')) {
                this.violations.push({
                    type: 'aria-button-no-label',
                    element: el,
                    message: 'Button role requires aria-label or text content',
                    wcag: '4.1.2 (A)'
                });
            }

            // dialog role은 aria-labelledby 또는 aria-label 필요
            if (role === 'dialog' && !el.getAttribute('aria-labelledby') && !el.getAttribute('aria-label')) {
                this.violations.push({
                    type: 'aria-dialog-no-label',
                    element: el,
                    message: 'Dialog role requires aria-labelledby or aria-label',
                    wcag: '4.1.2 (A)'
                });
            }
        });
    }

    // 키보드 네비게이션 검증
    checkKeyboardNav() {
        const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');

        interactiveElements.forEach(el => {
            const tabindex = el.getAttribute('tabindex');

            // tabindex > 0은 금지 (탭 순서 혼란)
            if (tabindex && parseInt(tabindex) > 0) {
                this.warnings.push({
                    type: 'positive-tabindex',
                    element: el,
                    message: 'Avoid positive tabindex values',
                    fix: 'Use tabindex="0" or natural DOM order'
                });
            }

            // 클릭 핸들러가 있는 div는 role과 tabindex 필요
            if (el.tagName === 'DIV' && el.onclick && !el.getAttribute('role')) {
                this.violations.push({
                    type: 'clickable-div-no-role',
                    element: el,
                    message: 'Clickable div needs role="button" and tabindex="0"',
                    wcag: '2.1.1 (A)'
                });
            }
        });
    }

    // 포커스 인디케이터 검증
    checkFocusIndicators() {
        const focusableElements = document.querySelectorAll('a, button, input, select, textarea');

        focusableElements.forEach(el => {
            const styles = window.getComputedStyle(el, ':focus');
            const outline = styles.outline;
            const outlineWidth = styles.outlineWidth;

            if (outline === 'none' || outlineWidth === '0px') {
                this.violations.push({
                    type: 'no-focus-indicator',
                    element: el,
                    message: 'Element has no visible focus indicator',
                    wcag: '2.4.7 (AA)',
                    fix: 'Add :focus { outline: 2px solid blue; }'
                });
            }
        });
    }

    // 색상 대비 계산
    calculateContrast(color1, color2) {
        const l1 = this.relativeLuminance(color1);
        const l2 = this.relativeLuminance(color2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    relativeLuminance(color) {
        const rgb = this.parseColor(color);
        const [r, g, b] = rgb.map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    parseColor(color) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        const computed = ctx.fillStyle;
        const match = computed.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [0, 0, 0];
    }

    // 리포트 생성
    generateReport() {
        const total = this.violations.length + this.warnings.length + this.passed.length;
        const score = ((this.passed.length / total) * 100).toFixed(1);

        return {
            score,
            violations: this.violations,
            warnings: this.warnings,
            passed: this.passed,
            summary: {
                total,
                violations: this.violations.length,
                warnings: this.warnings.length,
                passed: this.passed.length
            }
        };
    }
}

// 감사 실행
const a11yAuditor = new AccessibilityAuditor();
const report = a11yAuditor.runAudit();
console.log('Accessibility Report:', report);
```

2. **키보드 단축키 구현**:
```javascript
// 키보드 단축키 매핑
const keyboardShortcuts = {
    'Alt+1': () => switchTab('summary'),
    'Alt+2': () => switchTab('monthly'),
    'Alt+3': () => switchTab('destination'),
    'Alt+4': () => switchTab('model'),
    'Alt+5': () => switchTab('factory'),
    'Alt+6': () => switchTab('vendor'),
    'Alt+7': () => switchTab('heatmap'),
    'Alt+8': () => switchTab('data'),
    'Alt+F': () => document.getElementById('searchInput').focus(),
    'Alt+E': () => showExportModal(),
    'Alt+S': () => showSettingsModal(),
    'Escape': () => closeAllModals()
};

document.addEventListener('keydown', (e) => {
    const key = [
        e.altKey ? 'Alt' : '',
        e.ctrlKey ? 'Ctrl' : '',
        e.shiftKey ? 'Shift' : '',
        e.key
    ].filter(Boolean).join('+');

    if (keyboardShortcuts[key]) {
        e.preventDefault();
        keyboardShortcuts[key]();
    }
});

// 단축키 도움말 모달
function showKeyboardShortcutsHelp() {
    const modal = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content bg-white dark:bg-gray-800 rounded-xl p-6" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold mb-4">⌨️ 키보드 단축키</h3>

                <div class="space-y-2">
                    ${Object.entries(keyboardShortcuts).map(([key, _]) => `
                        <div class="flex justify-between">
                            <kbd class="kbd">${key}</kbd>
                            <span class="text-sm">${getShortcutDescription(key)}</span>
                        </div>
                    `).join('')}
                </div>

                <button onclick="closeModal()" class="mt-4 w-full btn-primary">
                    닫기
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}
```

**기대 효과**:
- WCAG AA 준수율 +95%
- 스크린 리더 사용성 +120%
- 키보드 전용 사용자 만족도 +100%
- 법적 리스크 -100%

**트리거 키워드**: `접근성`, `accessibility`, `WCAG`, `ARIA`, `키보드`, `스크린 리더`

**협업 대상**: #Q06 (UI), #19 (접근성 전문가), #08 (모달 전문가)

---

### Agent #Q10: Integration & E2E Tester (통합 및 E2E 테스트 전문가)

**전문분야**: Playwright E2E 테스트, 통합 테스트, 성능 벤치마크

**책임**:
- 모든 새 기능 E2E 테스트
- 회귀 테스트 자동화
- 성능 벤치마크
- 크로스 브라우저 테스트
- CI/CD 통합

**핵심 기능**:

1. **Playwright E2E 테스트**:
```javascript
// tests/phase4-features.spec.js
import { test, expect } from '@playwright/test';

// Q01: 데이터 내보내기 테스트
test.describe('Data Export (Q01)', () => {
    test('Excel export downloads file', async ({ page }) => {
        await page.goto('http://localhost:3000');

        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('button:has-text("📊 Excel 내보내기")')
        ]);

        expect(download.suggestedFilename()).toContain('Rachgia_Orders');
        expect(download.suggestedFilename()).toContain('.xlsx');
    });

    test('CSV export with UTF-8 BOM', async ({ page }) => {
        await page.goto('http://localhost:3000');

        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('button:has-text("📄 CSV 내보내기")')
        ]);

        const path = await download.path();
        const content = await fs.readFile(path, 'utf-8');
        expect(content).toMatch(/^\uFEFF/); // UTF-8 BOM
    });
});

// Q02: 고급 필터 테스트
test.describe('Advanced Filters (Q02)', () => {
    test('Save and load filter preset', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // 필터 설정
        await page.selectOption('#monthFilter', '2026-01');
        await page.selectOption('#destFilter', 'Netherlands');

        // 프리셋 저장
        await page.click('button:has-text("프리셋 저장")');
        await page.fill('input[name="presetName"]', 'Test Preset');
        await page.click('button:has-text("저장")');

        // 필터 초기화
        await page.selectOption('#monthFilter', 'all');
        await page.selectOption('#destFilter', 'all');

        // 프리셋 로드
        await page.click('text=Test Preset');

        // 검증
        expect(await page.inputValue('#monthFilter')).toBe('2026-01');
        expect(await page.inputValue('#destFilter')).toBe('Netherlands');
    });

    test('Range filter: quantity 1000-5000', async ({ page }) => {
        await page.goto('http://localhost:3000');

        await page.fill('#quantityMin', '1000');
        await page.fill('#quantityMax', '5000');
        await page.click('button:has-text("적용")');

        const rows = await page.locator('#dataTable tbody tr').all();

        for (const row of rows) {
            const qtyText = await row.locator('td[data-label="수량"]').textContent();
            const qty = parseInt(qtyText);
            expect(qty).toBeGreaterThanOrEqual(1000);
            expect(qty).toBeLessThanOrEqual(5000);
        }
    });
});

// Q03: 사용자 설정 테스트
test.describe('User Settings (Q03)', () => {
    test('Dark mode persists after reload', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // 다크모드 활성화
        await page.click('#darkModeToggle');
        expect(await page.locator('html').getAttribute('class')).toContain('dark');

        // 페이지 새로고침
        await page.reload();

        // 다크모드 유지 확인
        expect(await page.locator('html').getAttribute('class')).toContain('dark');
    });

    test('Page size setting saved', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // 페이지 크기 변경
        await page.selectOption('#defaultPageSize', '100');

        // 새로고침
        await page.reload();

        // 설정 유지 확인
        expect(await page.inputValue('#pageSizeSelect')).toBe('100');
    });
});

// Q04: 알림 시스템 테스트
test.describe('Notifications (Q04)', () => {
    test('Request notification permission', async ({ page, context }) => {
        await context.grantPermissions(['notifications']);
        await page.goto('http://localhost:3000');

        await page.click('#notificationsToggle');

        // 권한 승인 확인
        const permission = await page.evaluate(() => Notification.permission);
        expect(permission).toBe('granted');
    });
});

// Q06: 모바일 UX 테스트
test.describe('Mobile UX (Q06)', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

    test('Mobile: Table converts to cards', async ({ page }) => {
        await page.goto('http://localhost:3000');

        await page.click('[data-tab="data"]');

        // 카드 레이아웃 확인
        const table = page.locator('#dataTable');
        expect(await table.evaluate(el => window.getComputedStyle(el).display)).toBe('block');
    });

    test('Mobile: Bottom sheet filter', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // 필터 버튼 클릭
        await page.click('.mobile-filter-btn');

        // Bottom sheet 표시 확인
        const sheet = page.locator('#filterPanel');
        expect(await sheet.isVisible()).toBe(true);
    });

    test('Mobile: Swipe to switch tabs', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // 탭 위치 확인
        const tabContainer = page.locator('.tab-container');

        // 스와이프 제스처 시뮬레이션
        await tabContainer.dragTo(tabContainer, {
            sourcePosition: { x: 300, y: 100 },
            targetPosition: { x: 50, y: 100 }
        });

        // 다음 탭으로 전환 확인
        await page.waitForTimeout(500);
        // 탭 전환 검증 로직
    });
});

// Q07: 메모리 및 성능 테스트
test.describe('Performance (Q07)', () => {
    test('Memory usage under 150MB', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // 대용량 데이터 로드
        await page.selectOption('#pageSizeSelect', 'all');

        const memory = await page.evaluate(() => {
            if (performance.memory) {
                return performance.memory.usedJSHeapSize / 1024 / 1024;
            }
            return 0;
        });

        expect(memory).toBeLessThan(150);
    });

    test('Filter response time < 100ms', async ({ page }) => {
        await page.goto('http://localhost:3000');

        const start = Date.now();
        await page.selectOption('#quickDateFilter', 'delayed');
        await page.waitForSelector('#dataTable tbody tr');
        const elapsed = Date.now() - start;

        expect(elapsed).toBeLessThan(100);
    });
});

// 통합 테스트: 전체 워크플로우
test.describe('Integration: Full Workflow', () => {
    test('Complete user journey', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // 1. 필터 설정
        await page.selectOption('#monthFilter', '2026-01');
        await page.selectOption('#destFilter', 'Netherlands');

        // 2. 프리셋 저장
        await page.click('button:has-text("프리셋 저장")');
        await page.fill('input[name="presetName"]', 'NL Jan 2026');
        await page.click('button:has-text("저장")');

        // 3. 차트 확인
        await page.click('[data-tab="monthly"]');
        const chart = page.locator('canvas#monthlyChart');
        expect(await chart.isVisible()).toBe(true);

        // 4. Excel 내보내기
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('button:has-text("📊 Excel 내보내기")')
        ]);

        expect(download.suggestedFilename()).toContain('.xlsx');

        // 5. 리포트 생성
        await page.click('button:has-text("리포트 생성")');
        await page.click('button:has-text("일일 리포트")');

        // 리포트 모달 표시 확인
        const reportModal = page.locator('.report-modal');
        expect(await reportModal.isVisible()).toBe(true);
    });
});
```

2. **성능 벤치마크**:
```javascript
// tests/performance.spec.js
import { test, expect } from '@playwright/test';

test.describe('Performance Benchmarks', () => {
    test('Lighthouse performance score > 90', async ({ page }) => {
        await page.goto('http://localhost:3000');

        const lighthouse = await page.evaluate(async () => {
            const { default: lighthouse } = await import('lighthouse');
            const { lhr } = await lighthouse(location.href, {
                port: new URL(location.href).port,
                output: 'json',
                onlyCategories: ['performance']
            });
            return lhr.categories.performance.score * 100;
        });

        expect(lighthouse).toBeGreaterThan(90);
    });

    test('First Contentful Paint < 1.5s', async ({ page }) => {
        await page.goto('http://localhost:3000');

        const fcp = await page.evaluate(() => {
            const paint = performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint');
            return paint ? paint.startTime : 0;
        });

        expect(fcp).toBeLessThan(1500);
    });
});
```

**기대 효과**:
- 버그 발견율 +150%
- 회귀 버그 -95%
- 배포 신뢰도 +80%
- QA 시간 -70%

**트리거 키워드**: `테스트`, `E2E`, `Playwright`, `통합`, `회귀`, `벤치마크`

**협업 대상**: 모든 Q 에이전트 (전체 기능 테스트), #20 (테스트 엔지니어), #10 (통합 테스트)

---

## Phase 4 에이전트 협업 매트릭스

| 에이전트 | 주요 협업 대상 | 의존성 | 출력물 |
|---------|---------------|--------|--------|
| Q01 (내보내기) | Q02, Q05, #11 | XLSX.js, 필터링된 데이터 | Excel/CSV/PDF 파일 |
| Q02 (필터) | Q01, Q03, #09 | LocalStorage, 필터 로직 | 필터 프리셋, 조건 |
| Q03 (설정) | Q02, Q04, #06 | LocalStorage | 사용자 설정 |
| Q04 (알림) | Q03, Q02, #04 | Notification API | 알림 규칙, 히스토리 |
| Q05 (리포트) | Q01, #07, #05 | jsPDF, 차트 데이터 | 리포트 PDF |
| Q06 (모바일) | Q03, #06, #05 | 반응형 CSS | 모바일 UI |
| Q07 (메모리) | Q06, #04, #13 | WeakMap, Observer | 메모리 리포트 |
| Q08 (분석) | Q05, #08, #05 | 통계 알고리즘 | 인사이트, 예측 |
| Q09 (접근성) | Q06, #19, #08 | WCAG 2.1 | 감사 리포트 |
| Q10 (테스트) | 전체 Q, #20, #10 | Playwright | 테스트 리포트 |

---

## Phase 4 우선순위 및 로드맵

### HIGH Priority (즉시 시작)
- **Q01**: 데이터 내보내기 (업무 효율 +200%)
- **Q03**: 사용자 설정 관리 (반복 작업 -85%)
- **Q06**: 모바일 UX 최적화 (모바일 사용성 +120%)
- **Q07**: 메모리/성능 튜닝 (메모리 -35%, 안정성 +80%)

### MEDIUM Priority (다음 단계)
- **Q02**: 고급 필터 (필터 설정 시간 -60%)
- **Q04**: 알림 시스템 (실시간 감지 +95%)
- **Q05**: 리포트 생성 (리포트 작성 시간 -90%)
- **Q09**: 접근성 감사 (WCAG AA 준수 +95%)

### LOW Priority (향후 계획)
- **Q08**: 데이터 분석 (예측 정확도 +70%)
- **Q10**: 통합 테스트 (버그 발견율 +150%)

---

## 🚀 V18 SPECIALIZED TEAM - v17→v18 개선 전용 에이전트 (10명)

v17의 MEDIUM/LOW 우선순위 개선사항을 완료하여 100% 완성도 달성을 목표로 하는 전문가 팀.

### Agent #V01: XSS Elimination Specialist
- **역할**: escapeHtml() 100% 적용, XSS 완전 제거
- **목표**: 95% → 100% 보안 수준
- **트리거**: `XSS`, `보안`, `escapeHtml`, `취약점`

### Agent #V02: Caching Layer Architect
- **역할**: 필터 결과 메모이제이션, LRU Cache 구현
- **목표**: 필터 응답 80ms → 50-60ms
- **트리거**: `캐싱`, `메모이제이션`, `LRU`, `성능`

### Agent #V03: Memory Optimizer
- **역할**: Chart.js 인스턴스 재사용, 메모리 최적화
- **목표**: 메모리 20MB → 15MB (25% 감소)
- **트리거**: `메모리`, `Chart.js`, `인스턴스`, `GC`

### Agent #V04: Chart Performance Engineer
- **역할**: 차트 렌더링 성능, 애니메이션 최적화
- **목표**: 차트 렌더 300ms → 200ms
- **트리거**: `차트`, `성능`, `애니메이션`, `렌더링`

### Agent #V05: E2E Test Automation Engineer
- **역할**: Playwright E2E 테스트 자동화
- **목표**: 70+ 테스트 케이스, 80% 커버리지
- **트리거**: `테스트`, `E2E`, `Playwright`, `자동화`

### Agent #V06: Code Refactoring Specialist
- **역할**: 함수 복잡도 개선, 코드 중복 제거
- **목표**: 복잡도 15 → 10, LOC 50 → 20
- **트리거**: `리팩토링`, `복잡도`, `Clean Code`, `DRY`

### Agent #V07: Documentation Writer
- **역할**: 사용자 매뉴얼, API 문서, FAQ
- **목표**: 문서 커버리지 95% → 100%
- **트리거**: `문서`, `매뉴얼`, `가이드`, `API`

### Agent #V08: Performance Auditor
- **역할**: Lighthouse 감사, Core Web Vitals
- **목표**: Lighthouse 점수 85 → 90+
- **트리거**: `Lighthouse`, `성능`, `감사`, `Core Web Vitals`

### Agent #V09: DevOps & CI/CD Engineer
- **역할**: GitHub Actions 파이프라인, 자동 배포
- **목표**: CI/CD 완전 자동화
- **트리거**: `DevOps`, `CI/CD`, `GitHub Actions`, `배포`

### Agent #V10: Architecture Reviewer
- **역할**: 아키텍처 리뷰, 모듈화 제안
- **목표**: 확장성/유지보수성 70 → 90
- **트리거**: `아키텍처`, `설계`, `모듈화`, `MVC`

### V18 성공 기준

| 영역 | v17 | v18 목표 |
|------|-----|---------|
| 보안 | 95% | 100% |
| 필터 응답 | 80ms | 50-60ms |
| 메모리 | 20MB | 15MB |
| 차트 렌더 | 300ms | 200ms |
| 테스트 커버리지 | 0% | 80% |
| Lighthouse | 85 | 90+ |
| 코드 복잡도 | 15 | 10 |
| 문서 커버리지 | 95% | 100% |

**총 개발 기간**: 3주 (120시간)

---

## Version History

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| v5.0 | 2026-01-03 | v18 개선 전용 에이전트 10명 추가 (V01-V10) - XSS 제거, 캐싱, 메모리, 차트 성능, E2E 테스트, 리팩토링, 문서, 성능 감사, CI/CD, 아키텍처 |
| v4.0 | 2026-01-03 | Phase 4: 사용자 가치 극대화 에이전트 10명 추가 (Q01-Q10) - Export, Filter, Settings, Notification, Report, Mobile, Memory, Analytics, Accessibility, E2E Testing |
| v3.0 | 2026-01-03 | Rachgia 전용 에이전트 10명 추가 (R01-R10) |
| v2.0 | 2024-12-23 | 고도화: 의존성 매트릭스, 충돌 해결, 에러 핸들링, SLA, KPI, 핸드오프 프로토콜 추가 |
| v1.1 | 2024-12-22 | 에이전트 활성화 프로토콜 추가 |
| v1.0 | 2024-12-22 | 20명 에이전트 시스템 초기 구성 |

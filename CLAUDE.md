# Rachgia Dashboard Project - Claude Code Configuration

## Project Overview

**프로젝트명**: Rachgia Factory 통합 생산관리 대시보드
**목적**: 베트남 Rachgia 공장(A, B, C, D)의 생산 현황 실시간 모니터링
**기술 스택**: HTML, CSS (Tailwind), JavaScript (Vanilla), Chart.js, XLSX.js

## Agent System Integration

이 프로젝트는 20명의 전문가 에이전트 시스템으로 운영됩니다.
모든 요청은 에이전트 협업 프로토콜에 따라 처리됩니다.

@AGENTS.md

### 에이전트 자동 활성화 규칙

```yaml
auto_activation:
  # 데이터 관련 키워드
  data_keywords: [파싱, 데이터, JSON, BAL, 엑셀, 품질, 검증]
  activate: [agent-01, agent-02, agent-03]

  # UI 관련 키워드
  ui_keywords: [UI, 차트, 필터, 모달, 테이블, 정렬, 레이아웃]
  activate: [agent-06, agent-07, agent-09, agent-10, agent-11]

  # 성능 관련 키워드
  perf_keywords: [성능, 느림, 최적화, 메모리, 로딩, 속도]
  activate: [agent-12, agent-13, agent-14, agent-15, agent-16]

  # 보안 관련 키워드
  sec_keywords: [보안, XSS, 취약점, 인젝션, 검증]
  activate: [agent-17, agent-18]

  # 품질 관련 키워드
  qa_keywords: [테스트, 접근성, 버그, 검증, WCAG, ARIA]
  activate: [agent-19, agent-20]
```

## Project Structure

```
오더 현황 분석/
├── CLAUDE.md                    # 이 파일 (프로젝트 설정)
├── AGENTS.md                    # 에이전트 시스템 정의
├── rachgia_dashboard_v8.html    # 현재 대시보드 (최신)
├── parsed_loadplan_v6.json      # 파싱된 데이터 (3,960건)
├── create_v8_dashboard.py       # 대시보드 생성 스크립트
└── 원본 데이터/
    └── BAL*.xlsx               # 원본 엑셀 파일들
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

## Agent Workflow Examples

### Example 1: 필터 버그 수정
```
User: 월 필터가 작동하지 않아요

→ #00 Orchestrator: 필터 버그 확인, #09 Filter Expert 배정
→ #09 Filter Expert: applyFilters() 함수 분석, 버그 원인 파악
→ #16 Algorithm: 필터 로직 최적화 제안
→ #20 Test Engineer: 수정 후 검증
→ #00 Orchestrator: 승인 및 배포
```

### Example 2: 성능 개선
```
User: 대시보드가 느려요

→ #00 Orchestrator: 성능팀 전체 동원
→ #12 Perf Architect: 전체 분석, 병목 지점 식별
→ #13 Memory: 메모리 사용량 분석
→ #14 Render: DOM 조작 최적화
→ #15 Network: 파일 크기 축소
→ #16 Algorithm: 필터/정렬 알고리즘 개선
→ #20 Test Engineer: 성능 벤치마크
→ #00 Orchestrator: 결과 종합 및 적용
```

### Example 3: 새 기능 추가
```
User: 새로운 차트를 추가해주세요

→ #00 Orchestrator: 요구사항 분석, 관련 에이전트 배정
→ #05 Data Viz: 차트 데이터 구조 설계
→ #11 Chart UI: Chart.js 구현
→ #06 UI Architect: 레이아웃 배치
→ #12 Perf: 성능 영향 평가
→ #19 Accessibility: 접근성 검토
→ #20 Test Engineer: 기능 테스트
→ #00 Orchestrator: 최종 승인
```

## Quality Gates

모든 변경사항은 다음 검증을 통과해야 합니다:

1. **코드 품질** (#17 Security)
   - XSS 취약점 없음
   - escapeHtml() 적용 확인

2. **성능** (#12 Performance)
   - 초기 로딩 < 3초
   - 필터 응답 < 100ms

3. **접근성** (#19 Accessibility)
   - ARIA 속성 확인
   - 키보드 네비게이션 지원

4. **데이터 정확성** (#02 Data Quality)
   - 집계 값 검증
   - 지연/경고 판정 정확성

## Current Issues & Priorities

### High Priority
- [ ] 5MB 파일 크기 → 1MB 이하로 축소
- [ ] Virtual Scrolling 구현 (대용량 테이블)
- [ ] 데이터/JS/CSS 분리

### Medium Priority
- [ ] 차트 인스턴스 재사용 (메모리 최적화)
- [ ] 필터 결과 캐싱
- [ ] 로딩 상태 개선

### Low Priority
- [ ] 프린트 스타일 개선
- [ ] 키보드 단축키 확장
- [ ] 모바일 반응형 강화

## Version History

| 버전 | 날짜 | 주요 변경 |
|------|------|-----------|
| v8 | 2024-12-22 | 필터수정, 잔량계산, XSS보안, 접근성 |
| v7 | 2024-12-22 | Ground Truth, 날짜필터, AQL, 잔량표시 |
| v6 | 2024-12-21 | BAL 재파싱, 지연 로직 수정 |
| v5 | 2024-12-21 | BAL 로직 개선, 스탁핏 |

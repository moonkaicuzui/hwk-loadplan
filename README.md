# Rachgia Factory Loadplan 통합 대시보드

Rachgia 공장 (A, B, C, D) Loadplan Excel 파일을 분석하여 오더 현황을 시각화하는 웹 대시보드입니다.

## 주요 기능

### 1. 파일 업로드
- 4개의 Factory Loadplan Excel 파일 (.xlsx) 드래그앤드롭 또는 버튼 클릭으로 업로드
- 파일명에서 Factory (A, B, C, D) 자동 인식
- 파일 형식: `X-_LOADPLAN_ASSEMBLY_OF_RACHGIA_FACTORY_X__MM_DD_YYYY.xlsx`

### 2. 대시보드 탭

#### 📅 월별 현황
- SDD Current 기준 월별 오더 건수 및 수량 추이
- 월별 상위 5개 행선지 테이블
- Bar + Line 복합 차트

#### 🌍 행선지별 현황
- 아시아 주요 국가 (일본, 한국, 중국, 대만, 인도) 요약 카드
- 국가별 수량 비중 Donut 차트
- 아시아 국가 월별 상세 피벗 테이블

#### 👟 모델별 현황
- 모델별 수량 순위 (Top 15) 가로 막대 차트
- 모델별 상세 테이블
- 개별 모델 선택 시:
  - 월별 추이 차트
  - 행선지 분포 Pie 차트

#### 📋 상세 데이터
- 전체 데이터 테이블 (최대 500건 표시)
- Excel 다운로드 기능

### 3. 필터 기능
- 월 선택 (2025-12, 2026-01 등)
- 국가 선택 (전체 / 아시아만 / 개별 국가)
- 공장 선택 (Factory A/B/C/D)
- 텍스트 검색 (모델명, PO번호, 아티클)

## 사용 방법

### 1. 대시보드 열기
```bash
# 브라우저에서 index.html 열기
open index.html
```
또는 브라우저에서 직접 `index.html` 파일을 드래그하여 열기

### 2. 파일 업로드
1. "파일 선택" 버튼 클릭 또는 드래그앤드롭
2. Factory A, B, C, D Loadplan 파일 선택 (최대 4개)
3. "📊 데이터 분석 시작" 버튼 클릭

### 3. 데이터 분석
- 상단 요약 카드에서 전체 현황 확인
- 탭을 클릭하여 월별/행선지별/모델별 상세 분석
- 필터를 사용하여 원하는 데이터만 조회
- Excel 다운로드로 분석 결과 저장

## 기술 스택

- **프론트엔드**: HTML5 + Tailwind CSS + Vanilla JavaScript
- **Excel 파싱**: SheetJS (xlsx.js)
- **차트**: Chart.js
- **배포**: 단일 HTML 파일 (CDN 사용)

## 데이터 구조

### 핵심 컬럼
| 컬럼 | 설명 |
|------|------|
| Unit | 생산 라인 |
| Season SPEC | 시즌 (SS26 등) |
| Model | 모델명 |
| Art | 아티클 번호 |
| Dest | 행선지 (국가) |
| Q.ty | 주문 수량 |
| SDD (col 7) | Ship Date Current |

### SDD 날짜 파싱 규칙
- SDD Current는 `MM/DD` 형식 (예: 12/13, 01/30)
- 9월~12월 → 2025년
- 1월~8월 → 2026년

### 아시아 국가 목록
| 국가 | 플래그 |
|------|--------|
| Japan | 🇯🇵 |
| South Korea | 🇰🇷 |
| China | 🇨🇳 |
| Taiwan | 🇹🇼 |
| India | 🇮🇳 |
| Hong Kong | 🇭🇰 |
| Singapore | 🇸🇬 |
| Malaysia | 🇲🇾 |

## 주의사항

1. **대용량 파일**: 4개 파일 합계 약 4,000건 이상의 데이터 처리
2. **브라우저 호환**: 최신 Chrome, Edge, Safari 권장
3. **상세 데이터 탭**: 성능을 위해 500건만 표시 (Excel 다운로드로 전체 확인)
4. **더미 데이터 제외**: W9999, W9997 등 더미 행선지는 자동 필터링

## 파일 구조

```
오더 현황 분석/
├── index.html      # 메인 대시보드
├── README.md       # 사용 설명서
└── (업로드 파일들)
    ├── A-_LOADPLAN_...xlsx
    ├── B-_LOADPLAN_...xlsx
    ├── C-_LOADPLAN_...xlsx
    └── D-_LOADPLAN_...xlsx
```

## 버전 정보

- **v1.0** (2024-12): 초기 버전
  - 4개 Factory 파일 통합 분석
  - 월별/행선지별/모델별 분석
  - 아시아 국가 하이라이트
  - Excel 다운로드

---

Made for Rachgia Factory Loadplan Analysis

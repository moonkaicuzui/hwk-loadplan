# Excel 컬럼 표준화 가이드

**버전**: 1.0
**작성일**: 2026-02-06
**적용 대상**: Rachgia 공장 A, B, C, D 생산 현황 Excel 파일

---

## 1. 개요

이 문서는 Google Drive에 업로드되는 생산 현황 Excel 파일의 컬럼 명명 규칙과 데이터 형식을 정의합니다. 대시보드 시스템이 데이터를 정확하게 파싱하기 위해 이 규칙을 준수해야 합니다.

---

## 2. 필수 컬럼 (Required Columns)

다음 컬럼은 **반드시** 존재해야 합니다. 누락 시 시스템 오류가 발생합니다.

| 표준 컬럼명 | 허용 대체명 | 데이터 형식 | 설명 |
|------------|------------|------------|------|
| `Sales Order and Item` | PO#, PO | 텍스트 | 주문 번호 (예: 902051229-1) |
| `Q.ty` | Qty, Quantity | 숫자 | 주문 수량 |
| `CRD` | Customer Required Date | 날짜 | 고객 요청일 (MM/DD 또는 YYYY-MM-DD) |

---

## 3. 핵심 컬럼 (Core Columns)

다음 컬럼은 대시보드 분석에 필요합니다.

### 3.1 주문 정보

| 표준 컬럼명 | 허용 대체명 | 데이터 형식 | 설명 |
|------------|------------|------------|------|
| `Art` | Style | 텍스트 | 제품 스타일 코드 (예: AC7-GW6455) |
| `Model` | Model Name | 텍스트 | 제품 모델명 |
| `Color` | - | 텍스트 | 색상 코드/명 |
| `SDD` | Ship Date | 날짜 | 예정 출고일 (Original 서브컬럼) |
| `Unit` | Factory | 텍스트 | 공장 코드 (예: RAF.01-SEW RA.01) |
| `Dest` | Destination | 텍스트 | 목적지 코드 (예: Ukraine, US) |
| `Co-op` | Vendor | 텍스트 | 협력사 코드 |
| `GD` | Buyer | 텍스트 | 바이어 코드 |
| `Code 04` | Code04 | 텍스트 | 승인 코드 (Yes/No) |

### 3.2 생산 공정 잔량 (Balance Columns)

**중요**: 이 컬럼들은 서브헤더로 구분됩니다. 메인 헤더가 비어있고 서브헤더에 이름이 있습니다.

| 표준 서브헤더명 | 허용 변형 | 데이터 형식 | 공정 단계 |
|---------------|---------|------------|----------|
| `S.Cut Bal` | S Cut Bal, SCut Bal | 숫자 | 재단 잔량 |
| `Pre-Sew Bal` | Pre-Sew Bal., Pre Sew Bal | 숫자 | 선봉 잔량 |
| `Sew input Bal` | Sew Input Bal | 숫자 | 봉제투입 잔량 |
| `Sew Bal` | Sew Balance | 숫자 | 봉제 잔량 |
| `S/Fit Bal` | S Fit Bal, SFit Bal | 숫자 | 핏팅 잔량 |
| `Ass Bal` | Ass Balance, Assembly Bal | 숫자 | 조립 잔량 |
| `W.H IN BAL` | WH IN BAL, Warehouse In | 숫자 | 입고 잔량 |
| `W.H OUT BAL` | WH OUT BAL, Warehouse Out | 숫자 | 출고 잔량 |

---

## 4. 공장별 차이점

### Factory A
- 총 62개 컬럼
- `Fac code` 컬럼 존재
- `Season SPEC` (띄어쓰기)

### Factory B
- 총 61개 컬럼
- `Fac code` 컬럼 **없음** (인덱스 1칸 앞당겨짐)
- `Season SPEC` (띄어쓰기)

### Factory C
- 총 76개 컬럼
- 추가 컬럼: `PD`, `CNF.SDD`, `UPC`, `SPEC CHANGE`, `DAILYSHEET`
- `Season.SPEC` (마침표)

### Factory D
- 총 74개 컬럼
- Factory C와 유사한 구조
- `Season.SPEC` (마침표)

---

## 5. 데이터 형식 규칙

### 5.1 날짜 형식

**허용 형식**:
- `MM/DD` (예: 02/15) - 현재 연도로 자동 해석
- `YYYY-MM-DD` (예: 2026-02-15)
- `YYYY.MM.DD` (예: 2026.02.15)

**금지/오류 값**:
- `1/0` - Excel 오류
- `#REF!`, `#VALUE!` - Excel 참조 오류
- `N/A`, `-` - null로 처리됨

### 5.2 숫자 형식

**허용 형식**:
- 정수: `1000`, `1,000`
- 소수: `1000.5`
- 0 허용

**금지 값**:
- 음수 (잔량은 0 이상이어야 함)
- 텍스트 혼합 (예: `1000개`)

### 5.3 공장 코드 형식

**Unit 컬럼 형식**: `R{공장코드}{번호}-{부서} R{공장코드}.{번호}`

**예시**:
- `RAF.01-SEW RA.01` → 공장 A
- `RBF.02-SEW RB.02` → 공장 B
- `RCF.01-CUT RC.01` → 공장 C
- `RDF.03-ASS RD.03` → 공장 D

---

## 6. 헤더 행 규칙

### 6.1 헤더 위치
- 헤더 행: Row 3 (0-indexed: Row 2)
- 서브헤더 행: Row 4 (0-indexed: Row 3)
- 데이터 시작: Row 5 (0-indexed: Row 4)

### 6.2 병합 셀
- 생산 공정 관련 컬럼은 메인 헤더가 병합되어 있음
- 개별 잔량 컬럼은 서브헤더에 이름이 있음

**예시 구조**:
```
Row 2: | ... | PRODUCTION STATUS |        |        | ... |
Row 3: | ... | Sew Bal           | O/S... | ...    | ... |
```

---

## 7. 데이터 정합성 규칙

### 7.1 공정 순서 규칙
잔량은 공정 순서에 따라 감소해야 합니다:

```
S.Cut Bal ≥ Pre-Sew Bal ≥ Sew input Bal ≥ Sew Bal ≥ S/Fit Bal ≥ Ass Bal ≥ W.H IN BAL ≥ W.H OUT BAL
```

**위반 예시** (경고 발생):
- `S.Cut Bal = 100`, `Sew Bal = 150` → 순서 역전 경고

### 7.2 잔량 vs 총수량 규칙
모든 잔량은 총 수량(Q.ty)을 초과할 수 없습니다:

```
모든 Stage Bal ≤ Q.ty
```

### 7.3 TOTAL 행 규칙
- CRD 또는 PO 컬럼에 "TOTAL", "GRAND TOTAL" 포함 시 데이터 행에서 제외됨
- 집계 행은 파일 마지막에 위치시킬 것

---

## 8. 시스템 자동 정규화

시스템은 다음 항목을 자동으로 정규화합니다:

| 원본 값 | 정규화 값 |
|--------|----------|
| `Q.ty`, `Qty`, `Quantity` | `quantity` |
| `Season SPEC`, `Season.SPEC` | `season` |
| `Code 04`, `Code04` | `code04` |
| 날짜 `02/15` | `2026-02-15` (현재 연도 적용) |
| 숫자 `1,000` | `1000` (콤마 제거) |

---

## 9. 신규 컬럼 요청 (향후 계획)

다음 컬럼 추가를 권장합니다 (현장 협의 필요):

| 컬럼명 | 용도 | 우선순위 |
|--------|------|---------|
| `Rush` | 긴급 오더 표시 (Yes/No) | 높음 |
| `Actual Ship Date` | 실제 출고일 | 높음 |
| `Stage Entry Date` | 공정 진입 일자 | 중간 |
| `Priority` | 우선순위 숫자 (1-100) | 낮음 |

---

## 10. 문의

컬럼 관련 문의사항은 IT팀에 연락해 주세요.

**문서 이력**:
- 2026-02-06: 초안 작성

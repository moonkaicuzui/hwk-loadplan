# Column Mapping Verification Report

Generated: 2026-02-06
Source: Google Drive Excel Files (factory_a.xlsx, factory_b.xlsx, factory_c.xlsx, factory_d.xlsx)

## Summary

| 항목 | 상태 | 설명 |
|------|------|------|
| 핵심 컬럼 (PO, CRD, SDD, Qty) | ✅ 정상 | 모든 공장에서 정확히 매핑됨 |
| 생산 공정 컬럼 (8단계) | ✅ 정상 | 동적 감지 패턴 검증 완료 |
| 공장별 구조 차이 | ⚠️ 주의 | 컬럼 위치가 공장마다 다름 |
| 데이터 품질 이슈 | ✅ 처리됨 | TOTAL 행, 잘못된 값 필터링 |

## 1. 핵심 컬럼 매핑 검증

### 모든 공장 공통
| 시스템 필드 | Excel 컬럼명 | 검증 상태 |
|------------|-------------|----------|
| `poNumber` | Sales Order and Item | ✅ |
| `model` | Model | ✅ |
| `style` | Art | ✅ |
| `color` | Color | ✅ |
| `crd` | CRD | ✅ |
| `sddValue` | SDD (Original) | ✅ |
| `factory` | Unit | ✅ |
| `destination` | Dest | ✅ |
| `quantity` | Q.ty | ✅ |
| `code04` | Code 04 | ✅ |
| `vendor` | Co-op | ✅ |
| `buyer` | GD | ✅ |

## 2. 생산 공정 컬럼 (동적 감지)

### 공장별 JSON 키 매핑
| 공정 | Factory A | Factory B | Factory C | Factory D |
|------|-----------|-----------|-----------|-----------|
| S_CUT | __EMPTY_40 | __EMPTY_38 | __EMPTY_53 | __EMPTY_52 |
| PRE_SEW | __EMPTY_41 | __EMPTY_39 | __EMPTY_54 | __EMPTY_53 |
| SEW_INPUT | __EMPTY_42 | __EMPTY_40 | __EMPTY_55 | __EMPTY_54 |
| SEW_BAL | PRODUCTION STATUS | PRODUCTION STATUS | PRODUCTION STATUS | PRODUCTION STATUS |
| S_FIT | __EMPTY_50 | __EMPTY_49 | __EMPTY_64 | __EMPTY_62 |
| ASS_BAL | __EMPTY_51 | __EMPTY_50 | __EMPTY_65 | __EMPTY_63 |
| WH_IN | __EMPTY_54 | __EMPTY_53 | __EMPTY_68 | __EMPTY_66 |
| WH_OUT | __EMPTY_55 | __EMPTY_54 | __EMPTY_69 | __EMPTY_67 |

### 동적 감지 패턴 (dataParser.js)
```javascript
// S_CUT - "S.Cut Bal" 패턴
(val.includes('s.cut') || val.includes('s cut')) && val.includes('bal')

// PRE_SEW - "Pre-Sew Bal" 패턴
(val.includes('pre-sew') || val.includes('pre sew')) && val.includes('bal')

// SEW_INPUT - "Sew input Bal" 패턴
val.includes('sew') && val.includes('input') && val.includes('bal')

// SEW_BAL - "Sew Bal" 패턴 (헤더: PRODUCTION STATUS)
val.includes('sew') && val.includes('bal') && !val.includes('input') && !val.includes('pre')

// S_FIT - "S/Fit Bal" 패턴
(val.includes('s/fit') || val.includes('s fit') || val.includes('fit bal')) && !val.includes('ass')

// ASS_BAL - "Ass Bal" 패턴
val.includes('ass') && val.includes('bal') && !val.includes('stk')

// WH_IN - "W.H IN BAL" 패턴
val.includes('w.h') && val.includes('in') && val.includes('bal') && !val.includes('out')

// WH_OUT - "W.H OUT BAL" 패턴
val.includes('w.h') && val.includes('out') && val.includes('bal')
```

## 3. 공장별 구조 차이

### Factory A (factory_a.xlsx)
- **총 컬럼 수**: 62개
- **헤더 행**: Row 2
- **고유 컬럼**: `Fac code`
- **특이사항**: 표준 레이아웃

### Factory B (factory_b.xlsx)
- **총 컬럼 수**: 61개
- **헤더 행**: Row 2
- **누락 컬럼**: `Fac code` 없음
- **특이사항**: 컬럼 인덱스가 A보다 1씩 앞당겨짐

### Factory C (factory_c.xlsx)
- **총 컬럼 수**: 76개
- **헤더 행**: Row 2
- **고유 컬럼**: `PD`, `CNF.SDD`, `UPC`, `SPEC CHANGE`, `DAILYSHEET`
- **특이사항**: 확장된 QC 컬럼, Color 앞에 빈 컬럼 있음

### Factory D (factory_d.xlsx)
- **총 컬럼 수**: 74개
- **헤더 행**: Row 2
- **고유 컬럼**: `PD`, `CNF.SDD`, `UPC`, `SPEC CHANGE`, `DAILYSHEET`
- **특이사항**: Factory C와 유사한 구조

## 4. 데이터 품질 처리

### 필터링되는 행
| 유형 | 패턴 | 처리 |
|------|------|------|
| TOTAL 행 | CRD 또는 PO에 "TOTAL" 포함 | 제외 (약 160행) |
| 서브헤더 행 | Original/Current/Plan/Actual | 제외 (약 44행) |
| 헤더 키워드 | SALES ORDER AND ITEM, PO#, STYLE | 제외 |

### 잘못된 값 처리
| 필드 | 잘못된 값 | 처리 |
|------|----------|------|
| SDD | `1/0`, `#REF!`, `#VALUE!`, `N/A` | null 반환 (약 1,970행) |
| Code04 | `1/0`, `#REF!`, `#VALUE!`, `N/A`, `Code 04` | false 반환 (약 2,020행) |

### 공장 코드 추출
| 우선순위 | 소스 | 예시 |
|---------|------|------|
| 1 | 파일명 | `factory_a.xlsx` → "A" |
| 2 | Unit 필드 | `RAF.01-SEW RA.01` → "A" |

## 5. 검증 결과

### 최종 통계
- **원본 행 수**: 4,020행
- **필터링된 행**: 304행 (7.6%)
- **유효한 주문**: 3,716행 (92.4%)

### 공장별 유효 주문
| 공장 | 원본 | 필터링 | 유효 |
|------|------|--------|------|
| Factory A | 1,096 | 93 | 1,003 |
| Factory B | 704 | 68 | 636 |
| Factory C | 1,125 | 86 | 1,039 |
| Factory D | 1,095 | 57 | 1,038 |

## 6. 권장 사항

1. **COLUMN_MAPPINGS 정리**: 실제 사용되지 않는 매핑 제거 (PO#, Style#, Factory 등)
2. **Season 컬럼 변형 추가**: `Season.SPEC` (Factory C/D) 추가
3. **동적 감지 유지**: 공장별 컬럼 인덱스가 다르므로 동적 감지 필수
4. **정기 검증**: Excel 파일 형식 변경 시 재검증 필요

## 파일 위치

- 상세 분석 JSON: `react-app/src/constants/actualColumnStructure.json`
- 매핑 분석 코드: `react-app/src/constants/columnMappingAnalysis.js`
- 원본 분석 스크립트: `/tmp/drive_analysis/column_analysis.js`

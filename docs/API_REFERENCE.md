# API Reference

Rachgia Dashboard JavaScript API 문서

## 모듈 개요

| 모듈 | 설명 | 주요 함수 |
|------|------|----------|
| OrderModel | 주문 데이터 처리 | isDelayed, isShipped, detectAnomalies |
| FilterModel | 필터 상태 관리 | applyFilters, resetFilters |
| ChartModel | 차트 데이터 생성 | calculateOTDRate, predictBottleneck |
| KPIView | KPI 뷰 업데이트 | updateSummary, updateAlerts |
| TableView | 테이블 렌더링 | updateDataTab, renderDataCards |
| ModalView | 모달 관리 | showOrderListModal, closeAllModals |
| ExportView | 내보내기 | exportToExcel, exportToPDF |
| ChartView | 차트 렌더링 | updateMonthlyChart, updateHeatmap |

---

## OrderModel

주문 데이터 상태 확인 및 분석 함수.

### isDelayed(order)

주문이 지연 상태인지 확인합니다.

**Parameters:**
- `order` (Object): 주문 데이터 객체

**Returns:**
- `boolean`: 지연 여부

**Logic:**
1. SDD > CRD면 지연
2. 출고 완료 시 지연 아님
3. Code04 승인 시 지연 아님

**Example:**
```javascript
import { isDelayed } from './models/OrderModel.js';

const order = {
  sddValue: '2026-02-10',
  crd: '2026-02-05',
  quantity: 1000,
  production: { wh_out: { completed: 0 } }
};

console.log(isDelayed(order)); // true
```

### isWarning(order)

주문이 경고 상태인지 확인합니다.

**Parameters:**
- `order` (Object): 주문 데이터 객체

**Returns:**
- `boolean`: 경고 여부

**Logic:**
- SDD와 CRD 차이가 0-3일 이내
- 지연 아님, 출고 미완료

### isShipped(order)

주문이 출고 완료인지 확인합니다.

**Parameters:**
- `order` (Object): 주문 데이터 객체

**Returns:**
- `boolean`: 출고 완료 여부

### detectAnomalies(data)

데이터에서 이상치를 탐지합니다.

**Parameters:**
- `data` (Array): 주문 데이터 배열

**Returns:**
- `Object`: 이상치 정보
  - `quantityOutliers`: Z-score > 3인 수량
  - `processDelays`: CRD 7일 이내 + 완료율 50% 미만
  - `dateAnomalies`: 비정상 날짜 간격
  - `duplicatePO`: 중복 PO 번호
  - `vendorIssues`: 지연율 > 30% 벤더

---

## FilterModel

필터 상태 관리.

### applyFilters()

현재 필터 설정을 데이터에 적용합니다.

**Side Effects:**
- `filteredData` 전역 변수 업데이트
- 모든 뷰 업데이트 트리거

### resetFilters()

모든 필터를 초기 상태로 재설정합니다.

---

## KPIView

KPI 카드 및 요약 정보 업데이트.

### initKPIView(dependencies)

KPIView 모듈을 초기화합니다.

**Parameters:**
- `dependencies` (Object): 의존성 객체
  - `allData`: 전체 데이터 배열
  - `filteredData`: 필터된 데이터 배열
  - `isDelayed`: 지연 체크 함수
  - `formatNumber`: 숫자 포맷 함수
  - `updateOrCreateChart`: 차트 생성 함수

### updateSummary()

요약 KPI 업데이트: 총 오더, 수량, 완료율.

**DOM Elements Updated:**
- `#totalOrders`
- `#totalQty`
- `#totalRate`
- `#rateDonut` (차트)

### updateAlerts()

경고/지연 알림 업데이트.

**DOM Elements Updated:**
- `#delayedOrderCount`
- `#warningOrderCount`
- `#alertSection`

### updateAllKPIs()

모든 KPI 섹션을 한 번에 업데이트합니다.

---

## ModalView

모달 다이얼로그 관리.

### showOrderListModal(title, orders)

주문 목록을 모달로 표시합니다.

**Parameters:**
- `title` (string): 모달 제목
- `orders` (Array): 표시할 주문 배열

**Features:**
- Progressive rendering (50개 단위)
- 지연/경고 강조 표시
- 요약 통계 표시

### closeAllModals()

열린 모든 모달을 닫습니다.

---

## ExportView

데이터 내보내기 기능.

### exportToExcel(data, filename)

데이터를 Excel 파일로 내보냅니다.

**Parameters:**
- `data` (Array): 내보낼 데이터
- `filename` (string): 파일명 (확장자 제외)

**Requires:**
- XLSX.js 라이브러리

### exportToPDF(options)

현재 화면을 PDF로 내보냅니다.

**Parameters:**
- `options` (Object): PDF 옵션
  - `orientation`: 'landscape' | 'portrait'
  - `format`: 'a4' | 'letter'

---

## 이벤트

### 전역 이벤트

```javascript
// 필터 변경 시
window.addEventListener('filterChange', (e) => {
  console.log('Filters changed:', e.detail);
});

// 데이터 로드 완료 시
window.addEventListener('dataLoaded', (e) => {
  console.log('Data loaded:', e.detail.count);
});
```

### 키보드 단축키

| 단축키 | 동작 |
|--------|------|
| Alt+1~8 | 탭 전환 |
| Alt+F | 검색 포커스 |
| Alt+E | 내보내기 모달 |
| Alt+R | 필터 초기화 |
| Escape | 모달 닫기 |
| ? | 단축키 도움말 |

---

## 전역 변수

```javascript
// 데이터
window.EMBEDDED_DATA  // 원본 데이터 (readonly)
window.allData        // 처리된 전체 데이터
window.filteredData   // 필터된 데이터

// 상태
window.currentPage    // 현재 페이지 번호
window.pageSize       // 페이지 크기

// 유틸리티
window.escapeHtml     // XSS 방지 함수
window.formatNumber   // 숫자 포맷팅
```

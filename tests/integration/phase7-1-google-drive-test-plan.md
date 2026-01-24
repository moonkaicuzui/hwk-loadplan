# Phase 7-1: Google Drive Integration Test Plan

**Test Date**: 2026-01-15
**Tester**: Agent W02 (E2E Test Automation Engineer)
**Status**: 🔄 In Progress

## Test Objective

Validate complete Google Drive integration functionality including Excel file loading, parsing, caching, auto-sync, and offline fallback mechanisms.

## Prerequisites

- [ ] Google Drive file with BAL sheet structure prepared
- [ ] File shared with "Anyone with the link can view" permission
- [ ] File ID extracted from share link
- [ ] Browser DevTools open (Console + Network + Application tabs)

## Test Cases

### TC-7-1-01: Excel File Load from Google Drive

**Purpose**: Verify Excel file successfully downloads from Google Drive public link

**Steps**:
1. Open rachgia_dashboard_v19.html in browser
2. Navigate to Settings (⚙️) tab
3. Enter Google Drive File ID: `[TEST_FILE_ID]`
4. Click "테스트 연결" (Test Connection) button
5. Observe console logs and network tab

**Expected Results**:
- ✅ Console shows: `📥 Google Drive에서 데이터 로드 시작: [FILE_ID]`
- ✅ Network tab shows successful GET request to `drive.google.com/uc?export=download&id=[FILE_ID]`
- ✅ Response status: 200 OK
- ✅ Response type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- ✅ Console shows: `📊 Excel 파일 파싱 중...`
- ✅ Console shows: `✅ Google Drive 데이터 로드 완료: [N]건`

**Acceptance Criteria**:
- Load completes within 10 seconds
- No network errors (4xx, 5xx)
- Data count > 0

---

### TC-7-1-02: BAL Sheet Structure Parsing

**Purpose**: Verify correct parsing of BAL sheet with 8-stage production data

**Steps**:
1. After successful load from TC-7-1-01
2. Open browser console
3. Execute: `console.log(JSON.stringify(EMBEDDED_DATA[0], null, 2))`
4. Inspect first record structure

**Expected Results**:
- ✅ Record contains all required fields:
  ```json
  {
    "factory": "A" | "B" | "C" | "D",
    "poNumber": "string",
    "model": "string",
    "article": "string",
    "destination": "string",
    "outsoleVendor": "string",
    "quantity": number,
    "crd": "YYYY-MM-DD",
    "sddValue": "YYYY-MM-DD",
    "code04": "string",
    "production": {
      "s_cut": { "completed": number, "status": "string" },
      "pre_sew": { "completed": number, "status": "string" },
      "sew_input": { "completed": number, "status": "string" },
      "sew_bal": { "completed": number, "status": "string" },
      "osc": { "completed": number, "status": "string" },
      "ass": { "completed": number, "status": "string" },
      "wh_in": { "completed": number, "status": "string" },
      "wh_out": { "completed": number, "status": "string" }
    }
  }
  ```

**Acceptance Criteria**:
- All 8 production stages present
- Dates in ISO format (YYYY-MM-DD)
- Quantity and completed values are numbers
- No null in required fields (poNumber, model, quantity)

---

### TC-7-1-03: LocalStorage Cache Persistence

**Purpose**: Verify data saves to LocalStorage with correct metadata

**Steps**:
1. After successful load from TC-7-1-01
2. Open DevTools → Application → Local Storage → http://localhost:8080
3. Locate key: `googleDrive_productionData`
4. Inspect stored value

**Expected Results**:
- ✅ Key `googleDrive_productionData` exists
- ✅ Value is JSON with structure:
  ```json
  {
    "data": [...],
    "timestamp": 1705315200000,
    "fileId": "[FILE_ID]"
  }
  ```
- ✅ Console shows: `💾 캐시 저장 완료: [N]건`
- ✅ Data array length matches loaded count

**Acceptance Criteria**:
- Cache size < 5MB (LocalStorage limit consideration)
- Timestamp is recent (within last minute)
- FileId matches settings

---

### TC-7-1-04: Auto-Sync 30-Minute Interval

**Purpose**: Verify automatic synchronization triggers every 30 minutes

**Steps**:
1. Open Settings → Google Drive
2. Select "동기화 주기: ● 30분"
3. Click "저장" (Save)
4. Observe console logs
5. Wait 30 minutes (or modify interval for testing: set to 1 minute via console)

**Testing Shortcut** (for faster validation):
```javascript
// Execute in console to test 1-minute interval
googleDriveLoader.stopAutoSync();
googleDriveLoader.startAutoSync(1, (data, error) => {
  if (data) console.log(`✅ Auto-sync success: ${data.length} records`);
  if (error) console.error('❌ Auto-sync failed:', error);
});
```

**Expected Results**:
- ✅ Console shows: `⏰ 자동 동기화 시작: 30분 간격` (or 1분 for test)
- ✅ After interval, console shows: `🔄 자동 동기화 실행...`
- ✅ Followed by: `✅ Google Drive 데이터 로드 완료: [N]건`
- ✅ LocalStorage cache timestamp updates

**Acceptance Criteria**:
- Auto-sync triggers precisely on schedule (±5 seconds tolerance)
- No memory leaks after 10+ sync cycles
- Successful sync updates cache timestamp

---

### TC-7-1-05: Offline Fallback to Cache

**Purpose**: Verify system uses cached data when Google Drive unavailable

**Steps**:
1. Load data successfully from Google Drive (TC-7-1-01)
2. Verify cache exists in LocalStorage
3. Open DevTools → Network tab
4. Enable "Offline" mode (or block drive.google.com domain)
5. Reload page
6. Observe console logs

**Expected Results**:
- ✅ Console shows: `📥 Google Drive에서 데이터 로드 시작: [FILE_ID]`
- ✅ Network request fails (or blocked)
- ✅ Console shows: `❌ Google Drive 로드 실패: [error]`
- ✅ Console shows: `📂 캐시 로드: [N]건 ([M]분 전)`
- ✅ Console shows: `⚠️ 캐시 데이터 사용 ([N]건)`
- ✅ Dashboard loads with cached data
- ✅ Warning banner displays: "오프라인 모드 - 캐시 데이터 사용 중"

**Acceptance Criteria**:
- Fallback completes within 2 seconds
- No JavaScript errors
- All dashboard features functional with cached data

---

### TC-7-1-06: Cache Info Display

**Purpose**: Verify cache metadata correctly displayed in UI

**Steps**:
1. Load data from Google Drive
2. Navigate to Settings → Google Drive
3. Locate cache info section

**Expected Results**:
- ✅ Display shows:
  ```
  캐시 정보:
  - 데이터: [N]건
  - 저장 시간: YYYY-MM-DD HH:MM:SS
  - 파일 ID: [FILE_ID]
  - 캐시 나이: [M]분 전
  ```
- ✅ "캐시 삭제" button functional

**Acceptance Criteria**:
- All metadata accurate
- Cache age updates in real-time (if implemented)
- Delete button clears LocalStorage entry

---

### TC-7-1-07: Settings Persistence

**Purpose**: Verify Google Drive settings persist across page reloads

**Steps**:
1. Open Settings → Google Drive
2. Enter File ID: `[TEST_FILE_ID]`
3. Select sync interval: 30분
4. Click "저장"
5. Reload page
6. Navigate back to Settings → Google Drive

**Expected Results**:
- ✅ File ID field pre-filled with `[TEST_FILE_ID]`
- ✅ Sync interval selected: ● 30분
- ✅ Connection status shows: 🟢 연결됨 (if auto-sync active)

**Acceptance Criteria**:
- Settings restore within 1 second of page load
- No data loss on reload

---

### TC-7-1-08: Error Handling - Invalid File ID

**Purpose**: Verify graceful error handling for invalid Google Drive links

**Steps**:
1. Open Settings → Google Drive
2. Enter invalid File ID: `INVALID_ID_12345`
3. Click "테스트 연결"
4. Observe error handling

**Expected Results**:
- ✅ Console shows: `❌ Google Drive 로드 실패: HTTP 오류: 404`
- ✅ Error toast notification displays: "⚠️ Google Drive 연결 실패: 파일을 찾을 수 없습니다"
- ✅ No JavaScript exceptions thrown
- ✅ Dashboard remains functional

**Acceptance Criteria**:
- User-friendly error message (not raw error)
- No UI breakage
- Retry option available

---

### TC-7-1-09: Error Handling - Network Timeout

**Purpose**: Verify timeout handling for slow/failed connections

**Steps**:
1. Open Settings → Google Drive
2. Enter valid File ID
3. Throttle network to "Slow 3G" (DevTools → Network)
4. Click "테스트 연결"
5. Wait for timeout (or simulate timeout via DevTools)

**Expected Results**:
- ✅ Request times out after reasonable period (30 seconds)
- ✅ Console shows: `❌ Google Drive 로드 실패: [timeout error]`
- ✅ Fallback to cache attempted
- ✅ Error notification displays

**Acceptance Criteria**:
- Timeout prevents indefinite hang
- Graceful fallback to cache
- Clear error communication

---

### TC-7-1-10: Performance - Large File Parsing

**Purpose**: Verify performance remains acceptable with large datasets (5000+ records)

**Steps**:
1. Use Google Drive file with 5000+ rows
2. Load file
3. Measure parse time

**Expected Results**:
- ✅ Console shows parse timing
- ✅ Parse completes within 5 seconds
- ✅ UI remains responsive during parse
- ✅ No browser "Page Unresponsive" warnings

**Acceptance Criteria**:
- Parse time < 5 seconds for 5000 records
- Memory usage < 200MB
- No UI freezing

---

## Test Execution Log

| TC ID | Test Case | Status | Notes | Timestamp |
|-------|-----------|--------|-------|-----------|
| TC-7-1-01 | Excel File Load | ⏳ Pending | | |
| TC-7-1-02 | BAL Sheet Parsing | ⏳ Pending | | |
| TC-7-1-03 | Cache Persistence | ⏳ Pending | | |
| TC-7-1-04 | Auto-Sync | ⏳ Pending | | |
| TC-7-1-05 | Offline Fallback | ⏳ Pending | | |
| TC-7-1-06 | Cache Info Display | ⏳ Pending | | |
| TC-7-1-07 | Settings Persistence | ⏳ Pending | | |
| TC-7-1-08 | Invalid File ID | ⏳ Pending | | |
| TC-7-1-09 | Network Timeout | ⏳ Pending | | |
| TC-7-1-10 | Performance | ⏳ Pending | | |

**Status Codes**:
- ⏳ Pending - Not yet tested
- 🔄 In Progress - Currently testing
- ✅ Passed - Test successful
- ❌ Failed - Test failed, see notes

---

## Test Environment

- **Browser**: Chrome 120+ (primary), Firefox 115+ (secondary), Safari 16+ (tertiary)
- **OS**: macOS 14+
- **Network**: Broadband (100+ Mbps) for primary tests, Slow 3G for performance tests
- **Test Data**: BAL_Factory_Test.xlsx with 100-5000 records

---

## Success Criteria Summary

Phase 7-1 passes if:
- ✅ All 10 test cases pass
- ✅ No critical bugs (severity: high/critical)
- ✅ Performance targets met (load < 10s, parse < 5s)
- ✅ Error handling graceful (no crashes)
- ✅ Offline fallback functional

---

## Next Phase

Upon successful completion of Phase 7-1:
→ Proceed to **Phase 7-2: Firebase 실시간 동기화 테스트**

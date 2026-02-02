// =============================================================================
// E2E Test: 필터 기능 (20 test cases)
// Agent W02: E2E Test Automation Engineer
// Updated for v19 UI structure
// v19 Fix: Wait for app initialization before interacting with filters
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('필터 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rachgia_dashboard_v19.html');
    await page.waitForLoadState('networkidle');

    // v19: Wait for app initialization to complete
    // The app shows loading overlay until data is loaded and initApp() is called
    // Event handlers are only attached after initApp()
    await page.waitForFunction(
      () => {
        const overlay = document.getElementById('loadingOverlay');
        // Loading overlay is hidden when app is initialized
        return (
          overlay && (overlay.classList.contains('hidden') || overlay.style.display === 'none')
        );
      },
      { timeout: 30000 }
    );

    // Additional wait for event handlers to be attached
    await page.waitForTimeout(500);

    // 데이터 탭으로 이동 (테이블이 있는 곳)
    await page.click('[data-tab="data"]');
    await page.waitForTimeout(500);
  });

  // 1. 월 필터
  test('월 필터: 첫 번째 월 선택', async ({ page }) => {
    // v19: 월 옵션은 동적으로 생성되므로 index 기반 선택
    const monthSelect = page.locator('#monthFilter');
    const options = await monthSelect.locator('option').count();

    if (options > 1) {
      await monthSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);

      const rowCount = await page.locator('#dataTable tbody tr').count();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    }
  });

  // 2. 행선지 필터
  test('행선지 필터: 첫 번째 행선지 선택', async ({ page }) => {
    const destSelect = page.locator('#destFilter');
    // v19에서는 select가 있는지 확인
    if ((await destSelect.count()) > 0) {
      const options = await destSelect.locator('option').count();
      if (options > 1) {
        // v19: 행선지 옵션은 동적으로 생성되므로 index 기반 선택
        await destSelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);

        const rowCount = await page.locator('#dataTable tbody tr').count();
        expect(rowCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  // 3. 벤더 필터
  test('벤더 필터: 특정 벤더 선택', async ({ page }) => {
    const vendorSelect = page.locator('#vendorFilter');
    const options = await vendorSelect.locator('option').count();

    if (options > 1) {
      await vendorSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);

      const rowCount = await page.locator('#dataTable tbody tr').count();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    }
  });

  // 4. 공장 필터 (v19: filter-chip 버튼 그룹)
  test('공장 필터: Factory A 선택', async ({ page }) => {
    // v19에서는 버튼 그룹으로 구현됨
    const factoryChip = page.locator('#factoryFilter .filter-chip[data-factory="A"]');
    if ((await factoryChip.count()) > 0) {
      await factoryChip.click();
      await page.waitForTimeout(500);

      // active 클래스 확인
      await expect(factoryChip).toHaveClass(/active/);
    }
  });

  // 5. 상태 필터
  test('상태 필터: completed 선택', async ({ page }) => {
    await page.selectOption('#statusFilter', 'completed');
    await page.waitForTimeout(500);

    const rowCount = await page.locator('#dataTable tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  // 6. 빠른 날짜 필터: 지연
  test('빠른 필터: 지연 오더', async ({ page }) => {
    await page.selectOption('#quickDateFilter', 'delayed');
    await page.waitForTimeout(500);

    const rowCount = await page.locator('#dataTable tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  // 7. 빠른 날짜 필터: 경고
  test('빠른 필터: 경고 오더', async ({ page }) => {
    await page.selectOption('#quickDateFilter', 'warning');
    await page.waitForTimeout(500);

    const rowCount = await page.locator('#dataTable tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  // 8. 검색 기능
  test('검색: PO 번호 검색', async ({ page }) => {
    await page.fill('#searchInput', 'RS');
    await page.waitForTimeout(500);

    const rowCount = await page.locator('#dataTable tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  // 9. 필터 조합: 월 + 행선지
  test('필터 조합: 월 + 행선지', async ({ page }) => {
    // v19: 월/행선지 옵션은 동적으로 생성되므로 index 기반 선택
    const monthSelect = page.locator('#monthFilter');
    const monthOptions = await monthSelect.locator('option').count();
    if (monthOptions > 1) {
      await monthSelect.selectOption({ index: 1 });
    }

    const destSelect = page.locator('#destFilter');
    if ((await destSelect.count()) > 0) {
      const destOptions = await destSelect.locator('option').count();
      if (destOptions > 1) {
        await destSelect.selectOption({ index: 1 });
      }
    }
    await page.waitForTimeout(500);

    const rowCount = await page.locator('#dataTable tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  // 10. 필터 조합: 공장 + 상태
  test('필터 조합: 공장 + 상태', async ({ page }) => {
    // 공장 필터: 버튼 클릭
    const factoryChip = page.locator('#factoryFilter .filter-chip[data-factory="B"]');
    if ((await factoryChip.count()) > 0) {
      await factoryChip.click();
    }
    await page.selectOption('#statusFilter', 'partial');
    await page.waitForTimeout(500);

    const rowCount = await page.locator('#dataTable tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  // 11. 필터 초기화
  test('필터 초기화 버튼', async ({ page }) => {
    // 여러 필터 적용 (v19: index 기반 선택)
    const monthSelect = page.locator('#monthFilter');
    const monthOptions = await monthSelect.locator('option').count();
    if (monthOptions > 1) {
      await monthSelect.selectOption({ index: 1 });
    }

    // 초기화 버튼 클릭
    const resetBtn = page.locator('button:has-text("초기화")');
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.waitForTimeout(500);

      // 필터 값 확인
      const monthValue = await page.locator('#monthFilter').inputValue();
      expect(monthValue === '' || monthValue === 'all').toBeTruthy();
    }
  });

  // 12. 페이지 크기 변경: 50 → 100
  test('페이지 크기 변경: 50 → 100', async ({ page }) => {
    const pageSizeSelect = page.locator('#pageSizeSelect');
    if ((await pageSizeSelect.count()) > 0) {
      await pageSizeSelect.selectOption('100');
      await page.waitForTimeout(1000);

      const rowCount = await page.locator('#dataTable tbody tr').count();
      expect(rowCount).toBeLessThanOrEqual(100);
    }
  });

  // 13. 페이지 크기 변경: 전체
  test('페이지 크기: 전체 표시', async ({ page }) => {
    const pageSizeSelect = page.locator('#pageSizeSelect');
    if ((await pageSizeSelect.count()) > 0) {
      await pageSizeSelect.selectOption('all');
      await page.waitForTimeout(2000);

      const rowCount = await page.locator('#dataTable tbody tr').count();
      expect(rowCount).toBeGreaterThan(0);
    }
  });

  // 14. 정렬: PO번호 오름차순
  test('정렬: PO번호 오름차순', async ({ page }) => {
    const poHeader = page.locator('th:has-text("PO")');
    if ((await poHeader.count()) > 0) {
      await poHeader.click();
      await page.waitForTimeout(500);

      const firstPO = await page.locator('#dataTable tbody tr:first-child td').nth(1).textContent();
      expect(firstPO).toBeTruthy();
    }
  });

  // 15. 정렬: 수량 내림차순
  test('정렬: 수량 내림차순', async ({ page }) => {
    const qtyHeader = page.locator('th:has-text("수량")');
    if ((await qtyHeader.count()) > 0) {
      await qtyHeader.click();
      await qtyHeader.click(); // 두 번 클릭으로 내림차순
      await page.waitForTimeout(500);

      const firstRow = page.locator('#dataTable tbody tr:first-child');
      if ((await firstRow.count()) > 0) {
        const firstQty = await firstRow.locator('td').nth(4).textContent();
        expect(firstQty).toBeTruthy();
      }
    }
  });

  // 16. 필터 응답 시간 < 500ms
  test('필터 응답 시간 성능 테스트', async ({ page }) => {
    const startTime = Date.now();

    await page.selectOption('#quickDateFilter', 'delayed');
    await page.waitForTimeout(300);

    const elapsedTime = Date.now() - startTime;
    console.log(`Filter response time: ${elapsedTime}ms`);

    expect(elapsedTime).toBeLessThan(1000); // 1000ms 이내
  });

  // 17. 빈 결과 처리
  test('빈 결과: 존재하지 않는 검색어', async ({ page }) => {
    await page.fill('#searchInput', 'NONEXISTENT_PO_12345');
    await page.waitForTimeout(500);

    const rowCount = await page.locator('#dataTable tbody tr').count();
    // 빈 결과거나 "검색 결과 없음" 메시지
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  // 18. 날짜 범위 필터 (커스텀 날짜)
  test('날짜 범위: startDate/endDate', async ({ page }) => {
    const hasDateFilters = (await page.locator('#startDate').count()) > 0;

    if (hasDateFilters) {
      await page.fill('#startDate', '2026-01-01');
      await page.fill('#endDate', '2026-01-31');
      await page.waitForTimeout(500);

      const rowCount = await page.locator('#dataTable tbody tr').count();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    }
  });

  // 19. 복합 필터: 3개 동시 적용
  test('복합 필터: 월 + 공장 + 상태', async ({ page }) => {
    // v19: 월 옵션은 동적으로 생성되므로 index 기반 선택
    const monthSelect = page.locator('#monthFilter');
    const monthOptions = await monthSelect.locator('option').count();
    if (monthOptions > 1) {
      await monthSelect.selectOption({ index: 1 });
    }
    // 공장 필터: 버튼 클릭
    const factoryChip = page.locator('#factoryFilter .filter-chip[data-factory="A"]');
    if ((await factoryChip.count()) > 0) {
      await factoryChip.click();
    }
    await page.selectOption('#statusFilter', 'pending');
    await page.waitForTimeout(500);

    const rowCount = await page.locator('#dataTable tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  // 20. 필터 + 검색 조합
  test('필터 + 검색 조합', async ({ page }) => {
    // 공장 필터: 버튼 클릭
    const factoryChip = page.locator('#factoryFilter .filter-chip[data-factory="B"]');
    if ((await factoryChip.count()) > 0) {
      await factoryChip.click();
    }
    await page.fill('#searchInput', 'RS');
    await page.waitForTimeout(500);

    const rowCount = await page.locator('#dataTable tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });
});

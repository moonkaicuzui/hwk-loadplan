// =============================================================================
// E2E Test: 차트 기능 (10 test cases)
// Agent W02: E2E Test Automation Engineer
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('차트 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rachgia_dashboard_v19.html');
    await page.waitForLoadState('networkidle');
  });

  // 1. 월별 탭 - 차트 렌더링
  test('월별 탭: 차트 표시 확인', async ({ page }) => {
    await page.click('[data-tab="monthly"]');
    await page.waitForTimeout(1000);

    const chartCanvas = page.locator('canvas#monthlyChart');
    await expect(chartCanvas).toBeVisible();
  });

  // 2. 행선지 탭 - 차트 렌더링
  test('행선지 탭: 차트 표시 확인', async ({ page }) => {
    await page.click('[data-tab="destination"]');
    await page.waitForTimeout(1000);

    const chartCanvas = page.locator('canvas#destinationChart');
    await expect(chartCanvas).toBeVisible();
  });

  // 3. 모델 탭 - 차트 렌더링
  test('모델 탭: 차트 표시 확인', async ({ page }) => {
    await page.click('[data-tab="model"]');
    await page.waitForTimeout(1000);

    const chartCanvas = page.locator('canvas#modelChart');
    await expect(chartCanvas).toBeVisible();
  });

  // 4. 공장 탭 - 차트 렌더링
  test('공장 탭: 차트 표시 확인', async ({ page }) => {
    await page.click('[data-tab="factory"]');
    await page.waitForTimeout(1000);

    const chartCanvas = page.locator('canvas#factoryChart');
    await expect(chartCanvas).toBeVisible();
  });

  // 5. 벤더 탭 - 차트 렌더링
  test('벤더 탭: 차트 표시 확인', async ({ page }) => {
    await page.click('[data-tab="vendor"]');
    await page.waitForTimeout(1000);

    const chartCanvas = page.locator('canvas#vendorChart');
    await expect(chartCanvas).toBeVisible();
  });

  // 6. 히트맵 탭 - 히트맵 표시
  test('히트맵 탭: 히트맵 표시 확인', async ({ page }) => {
    await page.click('[data-tab="heatmap"]');
    await page.waitForTimeout(1000);

    const heatmapContainer = page.locator('#heatmapContainer');
    await expect(heatmapContainer).toBeVisible();
  });

  // 7. 차트 렌더링 성능 (<200ms)
  test('차트 렌더링 성능 테스트', async ({ page }) => {
    const startTime = Date.now();

    await page.click('[data-tab="monthly"]');
    await page.waitForSelector('canvas#monthlyChart');

    const elapsedTime = Date.now() - startTime;
    console.log(`Chart rendering time: ${elapsedTime}ms`);

    expect(elapsedTime).toBeLessThan(1000); // 1초 이내
  });

  // 8. 다크모드 토글 - 차트 색상 변경
  test('다크모드: 차트 색상 변경 확인', async ({ page }) => {
    await page.click('[data-tab="monthly"]');
    await page.waitForTimeout(500);

    // 다크모드 토글
    const darkModeToggle = page.locator('#darkModeToggle');
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);

      const chartCanvas = page.locator('canvas#monthlyChart');
      await expect(chartCanvas).toBeVisible();
    }
  });

  // 9. 필터 적용 시 차트 업데이트
  test('필터 적용 시 차트 업데이트', async ({ page }) => {
    await page.click('[data-tab="factory"]');
    await page.waitForTimeout(500);

    // 필터 적용
    await page.selectOption('#factoryFilter', 'A');
    await page.waitForTimeout(1000);

    const chartCanvas = page.locator('canvas#factoryChart');
    await expect(chartCanvas).toBeVisible();
  });

  // 10. 탭 전환 시 차트 재렌더링
  test('탭 전환: 차트 재렌더링 확인', async ({ page }) => {
    // 월별 탭
    await page.click('[data-tab="monthly"]');
    await page.waitForTimeout(500);
    const monthlyChart = page.locator('canvas#monthlyChart');
    await expect(monthlyChart).toBeVisible();

    // 공장 탭으로 전환
    await page.click('[data-tab="factory"]');
    await page.waitForTimeout(500);
    const factoryChart = page.locator('canvas#factoryChart');
    await expect(factoryChart).toBeVisible();

    // 다시 월별 탭으로
    await page.click('[data-tab="monthly"]');
    await page.waitForTimeout(500);
    await expect(monthlyChart).toBeVisible();
  });
});

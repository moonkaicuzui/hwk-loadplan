// Safari 호환성 테스트
const { test, expect } = require('@playwright/test');

test.describe('Safari Compatibility Test', () => {
  test('Dashboard loads without JavaScript errors', async ({ page }) => {
    // 콘솔 에러 수집
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      errors.push(err.message);
    });

    // 페이지 로드
    await page.goto('http://localhost:8888');

    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/Rachgia Factory|Dashboard/);

    // 로그인 오버레이 숨기기
    await page.evaluate(() => {
      const overlay = document.getElementById('loginOverlay');
      if (overlay) overlay.style.display = 'none';
    });

    // 주요 UI 요소 확인 (첫 번째 h1만 체크)
    await expect(page.locator('h1').first()).toBeVisible();

    // 탭 버튼들 확인
    await expect(page.locator('[role="tablist"]')).toBeVisible();

    // 필터 영역 확인
    await expect(page.locator('[role="search"]')).toBeVisible();

    // JavaScript 에러 없음 확인 (404 에러 제외)
    const jsErrors = errors.filter(
      e =>
        !e.includes('favicon') &&
        !e.includes('icon.svg') &&
        !e.includes('ChartModel') &&
        !e.includes('404') &&
        !e.includes('Failed to load resource')
    );

    console.log('JavaScript errors:', jsErrors);
    expect(jsErrors.length).toBe(0);
  });

  test('Tab navigation works', async ({ page }) => {
    await page.goto('http://localhost:8888');

    // 로그인 오버레이 숨기기
    await page.evaluate(() => {
      const overlay = document.getElementById('loginOverlay');
      if (overlay) overlay.style.display = 'none';
    });

    // 탭 리스트 내의 탭 버튼만 선택
    const destTab = page.locator('[role="tablist"] [data-tab="destination"]');
    await destTab.click();
    await expect(destTab).toHaveAttribute('aria-selected', 'true');

    // 공장 탭 클릭
    const factoryTab = page.locator('[role="tablist"] [data-tab="factory"]');
    await factoryTab.click();
    await expect(factoryTab).toHaveAttribute('aria-selected', 'true');
  });

  test('Filter controls work', async ({ page }) => {
    await page.goto('http://localhost:8888');

    // 로그인 오버레이 숨기기
    await page.evaluate(() => {
      const overlay = document.getElementById('loginOverlay');
      if (overlay) overlay.style.display = 'none';
    });

    // 빠른 날짜 필터 선택
    const quickFilter = page.locator('#quickDateFilter');
    if (await quickFilter.isVisible()) {
      await quickFilter.selectOption('week');
    }

    // 검색 입력
    const searchInput = page.locator('#searchInput');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await expect(searchInput).toHaveValue('test');
    }
  });

  test('No optional chaining or nullish coalescing errors', async ({ page }) => {
    // JavaScript 구문 에러 수집
    const syntaxErrors = [];
    page.on('pageerror', err => {
      if (
        err.message.includes('Unexpected token') ||
        err.message.includes('SyntaxError') ||
        err.message.includes('optional chaining') ||
        err.message.includes('nullish')
      ) {
        syntaxErrors.push(err.message);
      }
    });

    await page.goto('http://localhost:8888');

    // 페이지 로드 대기
    await page.waitForLoadState('networkidle');

    // Safari 호환성 관련 구문 에러 없음 확인
    expect(syntaxErrors.length).toBe(0);
  });
});

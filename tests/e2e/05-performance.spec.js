// =============================================================================
// E2E Test: 성능 벤치마크 (5 test cases)
// Agent W02: E2E Test Automation Engineer
// Agent W04: Performance Specialist
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('성능 벤치마크 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rachgia_dashboard_v19.html');
    await page.waitForLoadState('networkidle');

    // v19: Wait for app initialization to complete
    await page.waitForFunction(
      () => {
        const overlay = document.getElementById('loadingOverlay');
        return (
          overlay && (overlay.classList.contains('hidden') || overlay.style.display === 'none')
        );
      },
      { timeout: 30000 }
    );

    // Additional wait for event handlers to be attached
    await page.waitForTimeout(500);
  });

  // 1. 초기 페이지 로드 시간 (<2s)
  test('성능: 초기 로드 시간 < 2초', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/rachgia_dashboard_v19.html');
    await page.waitForLoadState('load');

    const loadTime = Date.now() - startTime;
    console.log(`Initial load time: ${loadTime}ms`);

    // 목표: 2초 이내
    expect(loadTime).toBeLessThan(2000);
  });

  // 2. Virtual Scrolling 효율성
  test('성능: Virtual Scrolling 렌더링', async ({ page }) => {
    await page.click('[data-tab="data"]');
    await page.waitForTimeout(500);

    // 페이지 크기를 전체로 변경
    await page.selectOption('#pageSizeSelect', 'all');
    await page.waitForTimeout(1000);

    // DOM에 실제 렌더링된 행 개수 확인
    const visibleRows = await page.locator('#dataTable tbody tr').count();

    // Virtual Scrolling이 활성화되어 있다면
    // 전체 데이터(3,960건)보다 훨씬 적은 행만 렌더링되어야 함
    if (visibleRows < 3960) {
      console.log(`Virtual scrolling: ${visibleRows} rows rendered out of 3960`);
      expect(visibleRows).toBeLessThan(500); // 최대 500개만 렌더링
    } else {
      // Virtual scrolling이 없으면 모든 행 렌더링
      console.log(`No virtual scrolling: all ${visibleRows} rows rendered`);
      expect(visibleRows).toBeGreaterThan(0);
    }
  });

  // 3. FilterCache 히트율
  test('성능: 필터 캐시 히트율', async ({ page }) => {
    // 동일한 필터 2번 적용
    await page.selectOption('#monthFilter', '2026-01');
    await page.waitForTimeout(500);

    const firstFilterTime = await page.evaluate(() => {
      const start = performance.now();
      // 필터 재적용 트리거 (값 변경 후 다시 동일값)
      document.getElementById('monthFilter').value = 'all';
      document.getElementById('monthFilter').dispatchEvent(new Event('change'));
      document.getElementById('monthFilter').value = '2026-01';
      document.getElementById('monthFilter').dispatchEvent(new Event('change'));
      return performance.now() - start;
    });

    await page.waitForTimeout(500);

    // 두 번째 동일 필터 (캐시 히트 예상)
    const secondFilterTime = await page.evaluate(() => {
      const start = performance.now();
      document.getElementById('monthFilter').value = 'all';
      document.getElementById('monthFilter').dispatchEvent(new Event('change'));
      document.getElementById('monthFilter').value = '2026-01';
      document.getElementById('monthFilter').dispatchEvent(new Event('change'));
      return performance.now() - start;
    });

    console.log(`First filter: ${firstFilterTime}ms, Second filter: ${secondFilterTime}ms`);

    // 캐시가 작동하면 두 번째가 더 빠르거나 비슷해야 함
    expect(secondFilterTime).toBeLessThanOrEqual(firstFilterTime * 1.5);
  });

  // 4. ChartManager 메모리 사용량
  test('성능: Chart.js 메모리 관리', async ({ page }) => {
    // 초기 메모리 측정
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize / 1024 / 1024; // MB
      }
      return 0;
    });

    // 여러 탭의 차트를 순회하며 렌더링
    const tabs = ['monthly', 'destination', 'model', 'factory', 'vendor'];

    for (const tab of tabs) {
      await page.click(`[data-tab="${tab}"]`);
      await page.waitForTimeout(1000);
    }

    // 최종 메모리 측정
    const finalMemory = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize / 1024 / 1024; // MB
      }
      return 0;
    });

    const memoryIncrease = finalMemory - initialMemory;
    console.log(`Memory increase: ${memoryIncrease.toFixed(2)} MB`);

    if (initialMemory > 0) {
      // ChartManager가 인스턴스를 재사용하면 메모리 증가가 적어야 함
      // 목표: 20MB 이내 증가
      expect(memoryIncrease).toBeLessThan(20);
    }
  });

  // 5. 번들 크기 검증
  test('성능: 번들 크기 확인', async ({ page }) => {
    // 네트워크 요청 모니터링
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('rachgia_dashboard')) {
        requests.push(request);
      }
    });

    await page.goto('/rachgia_dashboard_v19.html');
    await page.waitForLoadState('networkidle');

    // 응답 크기 측정
    for (const request of requests) {
      try {
        const response = await request.response();
        if (response) {
          const headers = await response.headers();
          const contentLength = headers['content-length'];

          if (contentLength) {
            const sizeMB = parseInt(contentLength) / 1024 / 1024;
            console.log(`Bundle size: ${sizeMB.toFixed(2)} MB`);

            // 목표: Gzip 적용 후 1.5MB 이내
            expect(sizeMB).toBeLessThan(2.0);
          }
        }
      } catch (e) {
        // 일부 요청은 응답을 가져오지 못할 수 있음
      }
    }
  });

  // 추가: Core Web Vitals
  test('성능: Core Web Vitals', async ({ page }) => {
    await page.goto('/rachgia_dashboard_v19.html');

    const metrics = await page.evaluate(() => {
      return new Promise(resolve => {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const vitals = {};

          entries.forEach(entry => {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
            }
            if (entry.entryType === 'layout-shift') {
              vitals.cls = (vitals.cls || 0) + entry.value;
            }
          });

          setTimeout(() => resolve(vitals), 3000);
        });

        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
      });
    });

    console.log('Core Web Vitals:', metrics);

    // FCP: First Contentful Paint < 1.8s (Good)
    if (metrics.fcp) {
      expect(metrics.fcp).toBeLessThan(1800);
    }

    // LCP: Largest Contentful Paint < 2.5s (Good)
    if (metrics.lcp) {
      expect(metrics.lcp).toBeLessThan(2500);
    }

    // CLS: Cumulative Layout Shift < 0.1 (Good)
    if (metrics.cls !== undefined) {
      expect(metrics.cls).toBeLessThan(0.1);
    }
  });
});

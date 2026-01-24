// =============================================================================
// Rachgia Dashboard - Playwright E2E Test Configuration
// v19 개선사항: E2E 테스트 자동화 (Agent W02)
// 목표: 70+ 테스트 케이스, 80% 커버리지
// =============================================================================

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',

  // 병렬 실행 설정
  fullyParallel: true,

  // 실패 시 재시도
  retries: process.env.CI ? 2 : 0,

  // 병렬 워커 수
  workers: process.env.CI ? 1 : undefined,

  // 리포터 설정
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  // 공통 설정
  use: {
    // 기본 URL
    baseURL: 'http://localhost:8080',

    // 트레이스 수집 (실패 시)
    trace: 'on-first-retry',

    // 스크린샷 (실패 시)
    screenshot: 'only-on-failure',

    // 비디오 녹화 (실패 시)
    video: 'retain-on-failure',

    // 타임아웃
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // 브라우저 프로젝트
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // 모바일 테스트
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 로컬 서버 자동 시작
  webServer: {
    command: 'python -m http.server 8080',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // 글로벌 타임아웃
  timeout: 60 * 1000,

  // expect 타임아웃
  expect: {
    timeout: 5000
  },
});

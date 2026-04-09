import { defineConfig } from '@playwright/test';

// BASE_URL 환경변수로 로컬/배포 전환
// - npm test          → http://localhost:3000 (로컬)
// - npm run test:prod → https://swiss-italy-travel.vercel.app (배포)
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const isProd = BASE_URL.includes('vercel.app') || BASE_URL.includes('duckdns');

export default defineConfig({
  testDir: './tests',
  timeout: isProd ? 60000 : 30000,
  retries: isProd ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: BASE_URL,
    viewport: { width: 390, height: 844 },
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    headless: false,
    launchOptions: { slowMo: 300 },
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        userAgent:
          'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 2,
      },
    },
  ],
  // 배포 환경에서는 webServer 불필요 (로컬만 자동 시작)
  ...(isProd
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: true,
          timeout: 60000,
        },
      }),
});

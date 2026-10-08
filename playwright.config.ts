import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testIgnore: 'offline.spec.ts', // 오프라인 AC7은 playwright.preview.config.ts(빌드 프리뷰)로 실행
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173/sajoo/',
  },
  webServer: {
    command: 'pnpm dev --port 5173 --host 127.0.0.1',
    url: 'http://127.0.0.1:5173/sajoo/',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});

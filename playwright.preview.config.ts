import { defineConfig } from '@playwright/test';

// 오프라인(AC7) 전용 — 테스트가 vite preview를 직접 띄우고 중간에 kill해 진짜 오프라인을 만든다.
// webServer 관리를 Playwright에 맡기면 프로세스를 죽일 수 없으므로 스펙이 수명주기를 소유한다.
// 실행: pnpm e2e:preview (빌드 후 실행)
export default defineConfig({
  testDir: './e2e',
  testMatch: 'offline.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4199/sajoo/',
    serviceWorkers: 'allow', // Playwright는 SW를 기본 차단 — PWA 검증에는 허용 필요
  },
});

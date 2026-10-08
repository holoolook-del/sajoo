import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { registerProfile } from './helpers.ts';

const PORT = 4199;
const BASE = `http://127.0.0.1:${PORT}/sajoo/`;

async function waitForServer(url: string) {
  const end = Date.now() + 30_000;
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // 아직 기동 중
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`preview 서버 기동 실패: ${url}`);
}

// AC7: 완전 오프라인 — 서비스워커 프리캐시가 설치된 뒤 서버 자체를 죽여도 모든 기능이 동작한다.
// (Playwright의 setOffline/route abort는 서비스워커보다 먼저 요청을 끊어 PWA 오프라인 검증에 못 쓴다)
test('AC7: 오프라인에서 카드 뽑기까지 전부 동작한다', async ({ page }) => {
  test.setTimeout(120_000);
  const server = spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
    { stdio: 'ignore' },
  );
  // 이미 종료된 프로세스를 kill할 때 나는 'error' 이벤트가 리스너 없이 올라가면 테스트 워커가 통째로 죽는다
  server.on('error', () => {});
  const stop = async () => {
    if (server.exitCode === null && server.signalCode === null) {
      server.kill();
      await once(server, 'exit');
    }
  };
  try {
    await waitForServer(BASE);
    await registerProfile(page);

    // 서비스워커 설치(프리캐시 완료 포함) 대기 → 온라인 리로드로 이 페이지를 제어하게 만든다
    await page.waitForFunction(async () => {
      const reg = await navigator.serviceWorker?.getRegistration();
      return reg?.active !== null && reg?.active !== undefined;
    }, undefined, { timeout: 30_000 });
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker?.controller, undefined, {
      timeout: 30_000,
    });
    await page.goto('./#/'); // 등록 직후 위치(/saju)에서 홈으로 — 같은 문서 내비게이션

    // 오프라인 상황 = 서버 프로세스 종료. 이후 모든 요청은 서비스워커 프리캐시만으로 서빙되어야 한다
    await stop();

    // HashRouter라 문서를 다시 받지 않고도 모든 화면을 이동할 수 있다
    await page.getByRole('link', { name: '오늘의 운세 보기' }).click();
    await expect(page.getByText('오늘의 일진(日辰)')).toBeVisible();
    await page.getByRole('link', { name: '홈' }).click();
    await page.getByRole('link', { name: '오늘의 운세카드 뽑기' }).click();
    await page.getByRole('button', { name: '운세카드 7' }).click();
    await expect(page.getByRole('button', { name: '오늘의 운세 받기' })).toBeVisible({
      timeout: 15_000,
    });

    // 프리캐시된 앱이 콜드 로드(오프라인 전체 리로드)도 되는지 확인 — 현재 URL은 #/card
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: '오늘의 운세카드' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('link', { name: '← 홈' }).click();
    await expect(page.getByRole('heading', { name: 'SAJOO' })).toBeVisible({ timeout: 15_000 });
  } finally {
    await stop();
  }
});

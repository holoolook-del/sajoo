import { expect, test } from '@playwright/test';
import { registerProfile } from './helpers.ts';

// AC12: 360px 폭에서 가로 스크롤이 생기지 않아야 한다
const PAGES = ['#/', '#/saju', '#/fortune', '#/card', '#/luck', '#/compat', '#/history', '#/onboarding'];

test('AC12: 360px 폭에서 모든 화면이 가로 스크롤 없이 보인다', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await registerProfile(page);
  for (const path of PAGES) {
    await page.goto(`./${path}`);
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path}에서 가로 스크롤 발생`).toBeLessThanOrEqual(0);
  }
});

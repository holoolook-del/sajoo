import { expect, test } from '@playwright/test';
import { registerProfile } from './helpers.ts';

test.describe('심심풀이 · 공덕 목탁', () => {
  test.beforeEach(async ({ page }) => {
    await registerProfile(page);
    await page.goto('./#/');
  });

  test('홈 메뉴 그리드 끝에 심심풀이 메뉴가 보인다', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: '운세 메뉴' });
    await expect(nav.getByRole('link', { name: /지난 30일의 기록/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /공덕 목탁/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /민화네컷/ })).toBeVisible();
  });

  test('목탁을 두드리면 오늘의 공덕이 오르고 홈으로 돌아온다', async ({ page }) => {
    await page.getByRole('link', { name: /공덕 목탁/ }).click();
    await expect(page.getByRole('heading', { name: '공덕 목탁' })).toBeVisible();

    const btn = page.getByRole('button', { name: '목탁 두드리기' });
    for (let i = 0; i < 3; i++) await btn.click();
    await expect(page.getByText('오늘의 공덕', { exact: false })).toBeVisible();
    await expect(page.getByText(/^3$/)).toBeVisible();

    // 홈 복귀
    await page.getByRole('link', { name: '← 홈' }).click();
    await expect(page.getByRole('link', { name: /공덕 목탁/ })).toBeVisible();
  });

  test('공덕 카운트가 새로고침 후에도 유지된다', async ({ page }) => {
    await page.getByRole('link', { name: /공덕 목탁/ }).click();
    const btn = page.getByRole('button', { name: '목탁 두드리기' });
    for (let i = 0; i < 2; i++) await btn.click();
    await page.reload();
    await expect(page.getByText(/^2$/)).toBeVisible();
  });
});

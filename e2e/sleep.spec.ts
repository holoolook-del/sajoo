import { expect, test } from '@playwright/test';
import { registerProfile } from './helpers.ts';

test.describe('심심풀이 · 숙면 사운드', () => {
  test.beforeEach(async ({ page }) => {
    await registerProfile(page);
    await page.goto('./#/');
  });

  test('홈 메뉴 그리드에 숙면 사운드가 보인다', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: '운세 메뉴' });
    await expect(nav.getByRole('link', { name: /숙면 사운드/ })).toBeVisible();
  });

  test('트랙을 누르면 재생 상태가 되고 다시 누르면 멈춘다', async ({ page }) => {
    await page.getByRole('link', { name: /숙면 사운드/ }).click();
    await expect(page.getByRole('heading', { name: '숙면 사운드' })).toBeVisible();

    const rain = page.getByRole('button', { name: /밤비/ });
    await rain.click();
    await expect(rain).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText(/「밤비」 재생 중/)).toBeVisible();

    // 다른 트랙으로 바꾸면 이전은 꺼진다
    const waves = page.getByRole('button', { name: /파도/ });
    await waves.click();
    await expect(waves).toHaveAttribute('aria-pressed', 'true');
    await expect(rain).toHaveAttribute('aria-pressed', 'false');

    // 다시 누르면 정지
    await waves.click();
    await expect(waves).toHaveAttribute('aria-pressed', 'false');
  });

  test('수면 타이머 칩을 선택할 수 있고 홈으로 돌아온다', async ({ page }) => {
    await page.getByRole('link', { name: /숙면 사운드/ }).click();
    await page.getByRole('button', { name: '15분' }).click();
    await expect(page.getByText(/15:0\d 후 꺼짐|14:5\d 후 꺼짐/)).toBeVisible();
    await page.getByRole('button', { name: '계속 재생' }).click();
    await expect(page.getByText(/후 꺼짐/)).not.toBeVisible();

    await page.getByRole('link', { name: '← 홈' }).click();
    await expect(page.getByRole('link', { name: /숙면 사운드/ })).toBeVisible();
  });
});

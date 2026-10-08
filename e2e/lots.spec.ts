import { expect, test } from '@playwright/test';
import { registerProfile } from './helpers.ts';

test('제비뽑기 — 인원을 정하고 섞으면 제비를 하나씩 뒤집어 결과가 나온다', async ({ page }) => {
  await registerProfile(page);
  await page.goto('./');
  await page.getByRole('link', { name: /제비뽑기/ }).click();
  await expect(page.getByText('모임에서 돌아가며 하나씩')).toBeVisible();

  await page.getByRole('button', { name: '제비 섞기' }).click();
  const lots = page.getByRole('button', { name: /제비 \d+번/ });
  await expect(lots).toHaveCount(4); // 기본 인원 4명

  // 전부 뒤집으면 결과 요약이 뜬다
  for (let i = 0; i < 4; i++) await lots.nth(i).click();
  await expect(page.getByText(/당첨: \d+번/)).toBeVisible();
});

import { expect, test } from '@playwright/test';
import { registerProfile } from './helpers.ts';

test('AC9: 대운·세운·월운이 표시된다', async ({ page }) => {
  await registerProfile(page);
  await page.getByRole('link', { name: '홈' }).click();
  await page.getByRole('link', { name: '대운 · 세운 · 월운' }).click();

  await expect(page.getByRole('heading', { name: '대운 · 세운 · 월운' })).toBeVisible();
  await expect(page.getByText(/대운\(大運\)/)).toBeVisible();
  await expect(page.getByText(/세운\(歲運\)/)).toBeVisible();
  await expect(page.getByText(/월운\(月運\)/)).toBeVisible();
  await expect(page.getByText(/순행|역행/)).toBeVisible();
});

import { expect, test } from '@playwright/test';

test('앱이 열리고 홈이 표시된다', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'SAJOO' })).toBeVisible();
});

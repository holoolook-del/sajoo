import { expect, test } from '@playwright/test';

test('AC1: 미등록 사용자는 프로필 입력 화면으로 이동한다', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/onboarding/);
  await expect(page.getByRole('heading', { name: '사주 정보 입력' })).toBeVisible();
});

import { expect, test } from '@playwright/test';

async function registerProfile(page: import('@playwright/test').Page) {
  await page.goto('./');
  await page.getByLabel('이름 (또는 닉네임)').fill('테스트');
  await page.getByLabel('년').fill('1992');
  await page.getByLabel('월').fill('10');
  await page.getByLabel('일').fill('24');
  await page.getByLabel('시', { exact: true }).selectOption('5');
  await page.getByLabel('분', { exact: true }).selectOption('30');
  await page.getByRole('radio', { name: '남' }).check();
  await page.getByRole('button', { name: '저장하고 사주 보기' }).click();
  await expect(page.getByText('일주')).toBeVisible();
}

test('AC5: 카드를 뽑으면 연출 후 결과 카드와 해석이 보인다', async ({ page }) => {
  await registerProfile(page);
  await page.getByRole('link', { name: '홈' }).click();
  await page.getByRole('link', { name: '오늘의 운세카드 뽑기' }).click();
  await page.getByRole('button', { name: '운세카드 7' }).click();
  await expect(page.getByRole('button', { name: '오늘의 운세 받기' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: '오늘의 운세 받기' }).click();
  await expect(page.getByText('오늘 뽑은 카드')).toBeVisible();
});

test('AC6: 오늘 이미 뽑았으면 재뽑기 대신 뽑은 카드를 보여준다', async ({ page }) => {
  await registerProfile(page);
  await page.goto('./#/card');
  await page.getByRole('button', { name: '운세카드 7' }).click();
  await expect(page.getByRole('button', { name: '오늘의 운세 받기' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: '오늘의 운세 받기' }).click();

  await page.goto('./#/card');
  await expect(page.getByText('오늘 뽑은 카드')).toBeVisible();
  await expect(page.getByRole('button', { name: '운세카드 7' })).toHaveCount(0);

  await page.goto('./');
  await expect(page.getByRole('link', { name: '오늘의 카드 다시 보기' })).toBeVisible();
});

import { expect, test } from '@playwright/test';

test('AC1·AC2: 프로필 입력 후 사주팔자가 보인다', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/onboarding/);

  await page.getByLabel(/이름/).fill('테스트');
  await page.getByLabel('년').fill('1992');
  await page.getByLabel('월').fill('10');
  await page.getByLabel('일').fill('24');
  await page.getByLabel('시', { exact: true }).selectOption('5');
  await page.getByLabel('분', { exact: true }).selectOption('30');
  await page.getByRole('radio', { name: '남' }).check();
  await page.getByRole('button', { name: /사주 보기/ }).click();

  await expect(page).toHaveURL(/saju/);
  await expect(page.getByText('임신')).toBeVisible();
  await expect(page.getByText('경술')).toBeVisible();
  await expect(page.getByText('계유')).toBeVisible();
  await expect(page.getByText('을묘')).toBeVisible();
  await expect(page.getByText('오행(五行) 분포')).toBeVisible();
  await expect(page.getByText('십신(十神)')).toBeVisible();
});

test('AC3: 생시 모름이면 3주로 계산한다', async ({ page }) => {
  await page.goto('./#/onboarding');
  await page.getByLabel(/이름/).fill('테스트');
  await page.getByLabel('년').fill('1992');
  await page.getByLabel('월').fill('10');
  await page.getByLabel('일').fill('24');
  await page.getByRole('checkbox', { name: '생시 모름' }).check();
  await page.getByRole('radio', { name: '여' }).check();
  await page.getByRole('button', { name: /사주 보기/ }).click();

  await expect(page.getByText('시주 미입력')).toBeVisible();
  await expect(page.getByText('미입력', { exact: true }).first()).toBeVisible();
});

test('AC11: 존재하지 않는 날짜는 저장되지 않는다', async ({ page }) => {
  await page.goto('./#/onboarding');
  await page.getByLabel(/이름/).fill('테스트');
  await page.getByLabel('년').fill('2024');
  await page.getByLabel('월').fill('2');
  await page.getByLabel('일').fill('30');
  await page.getByRole('radio', { name: '남' }).check();
  await page.getByRole('button', { name: /사주 보기/ }).click();

  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(/onboarding/);
});

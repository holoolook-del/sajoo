import { expect, test } from '@playwright/test';
import { registerProfile } from './helpers.ts';

test('AC10: 운세·카드를 이용하면 지난 기록에 오늘 항목이 보인다', async ({ page }) => {
  await registerProfile(page);
  // 카드 뽑기 → 기록 생성
  await page.getByRole('link', { name: '홈' }).click();
  await page.getByRole('link', { name: '오늘의 운세카드 뽑기' }).click();
  await page.getByRole('button', { name: '운세카드 7' }).click();
  await page.getByRole('button', { name: '오늘의 운세 받기' }).click({ timeout: 10_000 });
  await expect(page.getByText('오늘 뽑은 카드')).toBeVisible();
  // 운세 페이지 방문 → 운세 기록 자동 저장
  await page.getByRole('link', { name: '홈' }).click();
  await page.getByRole('link', { name: '오늘의 운세 보기' }).click();
  await expect(page.getByText('오늘의 일진(日辰)')).toBeVisible();

  await page.getByRole('link', { name: '홈' }).click();
  await page.getByRole('link', { name: '지난 30일의 기록' }).click();

  await expect(page.getByRole('heading', { name: '지난 30일의 기록' })).toBeVisible();
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  const entry = page.locator('li', { hasText: today });
  await expect(entry).toBeVisible();
  await expect(entry.getByText('일진')).toBeVisible();
});

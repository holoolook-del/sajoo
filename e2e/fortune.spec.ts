import { expect, test } from '@playwright/test';
import { registerProfile } from './helpers.ts';

test('AC4: 오늘의 운세에 일진·등급·해석이 보인다', async ({ page }) => {
  await registerProfile(page);
  await page.getByRole('link', { name: '홈' }).click();
  await page.getByRole('link', { name: '오늘의 운세 보기' }).click();

  await expect(page.getByRole('heading', { name: '오늘의 운세' })).toBeVisible();
  await expect(page.getByText('오늘의 일진(日辰)')).toBeVisible();
  // 등급 5종 중 하나 + 운세 지수(%) 표시
  await expect(page.getByText(/운세 지수/)).toBeVisible();
  await expect(page.getByText(/\d+%/)).toBeVisible();
  await expect(page.getByText('오늘의 기운 해석')).toBeVisible();
  // 카드 미뽑기 상태 → 뽑기 유도 버튼
  await expect(page.getByRole('link', { name: '운세카드 뽑기' })).toBeVisible();
});

test('카드 뽑은 뒤 운세 페이지에 카드가 표시된다', async ({ page }) => {
  await registerProfile(page);
  await page.goto('./#/card');
  await page.getByRole('button', { name: '운세카드 7' }).click();
  await expect(page.getByRole('button', { name: '오늘의 운세 받기' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: '오늘의 운세 받기' }).click();

  await page.goto('./#/fortune');
  await expect(page.getByText('오늘 뽑은 카드')).toBeVisible();
});

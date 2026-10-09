import { expect, test } from '@playwright/test';
import { registerProfile } from './helpers.ts';

test('MBTI 테스트 — 프로필 없이 바로 시작해 결과와 공유 버튼이 뜬다', async ({ page }) => {
  // 프로필 없이 딥링크로 바로 진입 (공유 링크 시나리오)
  await page.goto('./#/test/mbti');
  await expect(page.getByText('MBTI 기질 테스트')).toBeVisible();
  await page.getByRole('button', { name: '시작하기' }).click();

  // 12문 — 첫 번째 선택지를 계속 고른다
  for (let i = 0; i < 12; i++) {
    await expect(page.getByText(`${i + 1}/12`)).toBeVisible();
    await page.locator('section button').first().click();
  }

  // 결과 — 전부 첫 선택지 = ESTJ
  await expect(page.getByText('ESTJ')).toBeVisible();
  await expect(page.getByRole('button', { name: '결과 공유하기' })).toBeVisible();
  // 프로필 미등록 → 사주 유도 CTA
  await expect(page.getByRole('link', { name: '나도 내 사주 보러 가기' })).toBeVisible();
});

test('직업성향 테스트 — 12문 후 유형과 추천 직업이 나온다', async ({ page }) => {
  await registerProfile(page);
  await page.goto('./#/test/job');
  await page.getByRole('button', { name: '시작하기' }).click();

  for (let i = 0; i < 12; i++) {
    await page.locator('section button').first().click();
  }

  // 첫 선택지 반복 = R·S·E·A 섞임 → 상위 유형 코드가 보여야 함
  await expect(page.getByText('내 적성 유형은')).toBeVisible();
  await expect(page.getByText('이런 일이 잘 맞아요')).toBeVisible();
  await expect(page.getByRole('button', { name: '다시 해보기' })).toBeVisible();
});

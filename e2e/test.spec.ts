import { expect, test } from '@playwright/test';
import { registerProfile } from './helpers.ts';

test('심리테스트 허브 — 프로필 없이 목록이 뜨고 개별 테스트로 들어간다', async ({ page }) => {
  await page.goto('./#/test');
  await expect(page.getByRole('heading', { name: '심리테스트' })).toBeVisible();

  // 6종 목록이 전부 보인다
  for (const title of [
    'MBTI 기질 테스트',
    '직업성향 테스트',
    '연애 유형 테스트',
    '본능 동물 테스트',
    '성격 색깔 테스트',
    '스트레스 게이지',
  ]) {
    await expect(page.getByText(title)).toBeVisible();
  }

  await page.getByRole('link', { name: /연애 유형 테스트/ }).click();
  await expect(page.getByRole('heading', { name: '연애 유형 테스트' })).toBeVisible();
  await page.getByRole('button', { name: '시작하기' }).click();

  // 12문 전부 첫 선택지 → 직진형
  for (let i = 0; i < 12; i++) {
    await page.locator('section button').first().click();
  }
  await expect(page.getByText('숨김없는 불도저')).toBeVisible();
  await expect(page.getByText('성향 분포')).toBeVisible();
});

test('스트레스 게이지 — 전부 스트레스 선택지를 고르면 한계 단계가 나온다', async ({ page }) => {
  await page.goto('./#/test/stress');
  await page.getByRole('button', { name: '시작하기' }).click();

  for (let i = 0; i < 12; i++) {
    await page.locator('section button').first().click();
  }

  await expect(page.getByText('폭풍을 앞둔 바다')).toBeVisible();
  await expect(page.getByText('스트레스 지수')).toBeVisible();
  await expect(page.getByText('이건 조심')).toBeVisible();
});

test('MBTI 테스트 — 프로필 없이 바로 시작해 결과와 공유 버튼이 뜬다', async ({ page }) => {
  // 프로필 없이 딥링크로 바로 진입 (공유 링크 시나리오)
  await page.goto('./#/test/mbti');
  await expect(page.getByText('MBTI 기질 테스트')).toBeVisible();
  await page.getByRole('button', { name: '시작하기' }).click();

  // 16문 — 첫 번째 선택지를 계속 고른다
  for (let i = 0; i < 16; i++) {
    await expect(page.getByText(`${i + 1}/16`)).toBeVisible();
    await page.locator('section button').first().click();
  }

  // 결과 — 전부 첫 선택지 = ESTJ
  await expect(page.getByText('ESTJ')).toBeVisible();
  await expect(page.getByText('성향 분포')).toBeVisible();
  await expect(page.getByRole('button', { name: '결과 공유하기' })).toBeVisible();
  // 프로필 미등록 → 사주 유도 CTA
  await expect(page.getByRole('link', { name: '나도 내 사주 보러 가기' })).toBeVisible();
});

test('직업성향 테스트 — 12문 후 유형·보조유형·분포 바·추천 직업이 나온다', async ({ page }) => {
  await registerProfile(page);
  await page.goto('./#/test/job');
  await page.getByRole('button', { name: '시작하기' }).click();

  for (let i = 0; i < 12; i++) {
    await page.locator('section button').first().click();
  }

  await expect(page.getByText('내 적성 유형은')).toBeVisible();
  await expect(page.getByText('보조 유형:')).toBeVisible();
  await expect(page.getByText('성향 분포')).toBeVisible();
  await expect(page.getByText('이런 일이 잘 맞아요')).toBeVisible();
  await expect(page.getByRole('button', { name: '다시 해보기' })).toBeVisible();
});

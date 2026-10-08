import { expect, test } from '@playwright/test';
import { registerProfile } from './helpers.ts';

test('AC8: 궁합 입력 → 점수와 해석, 상대 정보는 저장되지 않는다', async ({ page }) => {
  await registerProfile(page);
  await page.getByRole('link', { name: '홈' }).click();
  await page.getByRole('link', { name: '궁합 보기' }).click();

  await expect(page.getByRole('heading', { name: '궁합 보기' })).toBeVisible();
  await page.getByLabel('이름 (또는 닉네임)').fill('상대');
  await page.getByLabel('년').fill('1994');
  await page.getByLabel('월').fill('3');
  await page.getByLabel('일').fill('15');
  await page.getByRole('radio', { name: '여' }).check();
  await page.getByRole('button', { name: '궁합 보기' }).click();

  await expect(page.getByText('테스트 × 상대')).toBeVisible();
  await expect(page.getByText('궁합 해석')).toBeVisible();
  await expect(page.getByRole('button', { name: '다른 사람과 보기' })).toBeVisible();

  // 상대 정보는 localStorage에 저장되지 않는다
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.filter((k) => k.includes('상대'))).toHaveLength(0);
});

test('궁합 초대 링크 — 프로필 없이도 상대의 8글자로 궁합이 뜬다', async ({ page }) => {
  // 초대 링크 형식: ?with=<base64(JSON {n, p[4]})> — p는 년·월·일·시주 한자
  const token = Buffer.from(
    JSON.stringify({ n: '친구', p: ['壬申', '庚戌', '癸酉', null] }),
    'utf8',
  ).toString('base64');

  // 프로필 없이 초대 링크로 바로 진입
  await page.goto(`./#/compat?with=${token}`);
  await expect(page.getByText('친구님이 궁합을 보자고 초대했어요')).toBeVisible();

  // 내 정보만 입력하면 초대자 × 나 궁합이 뜬다
  await page.getByLabel('이름 (또는 닉네임)').fill('나');
  await page.getByLabel('년').fill('1995');
  await page.getByLabel('월').fill('6');
  await page.getByLabel('일').fill('11');
  await page.getByRole('radio', { name: '여' }).check();
  await page.getByRole('button', { name: '궁합 보기' }).click();

  await expect(page.getByText('친구 × 나')).toBeVisible();
  await expect(page.getByText('궁합 해석')).toBeVisible();
});

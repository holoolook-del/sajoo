import { expect, type Page } from '@playwright/test';

/** 테스트용 프로필을 폼 입력으로 등록하고 사주 화면까지 진입한다 */
export async function registerProfile(page: Page) {
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

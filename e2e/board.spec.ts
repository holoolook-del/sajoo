import { expect, test } from '@playwright/test';
import { registerProfile } from './helpers.ts';

// Firebase env가 없는 CI/로컬 빌드에서는 '준비 중' 화면이 보여야 한다.
// 실제 글쓰기·접속자 표시는 Firebase 설정이 들어간 실기기에서 확인한다.

test.describe('자유 게시판', () => {
  test('프로필 없이도 진입 — 미설정 시 준비 중 화면', async ({ page }) => {
    await page.goto('/#/board');
    await expect(page.getByRole('heading', { name: '자유 게시판' })).toBeVisible();
    await expect(page.getByText('게시판을 여는 중이에요')).toBeVisible();
  });

  test('홈 메뉴에 게시판 항목이 있다', async ({ page }) => {
    await registerProfile(page);
    await page.goto('/#/');
    const menu = page.getByRole('link', { name: /자유 게시판/ });
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(page.getByRole('heading', { name: '자유 게시판' })).toBeVisible();
  });
});

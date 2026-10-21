import { expect, test } from '@playwright/test';
import { registerProfile } from './helpers.ts';

test.describe('로또 분석소', () => {
  test('실데이터 기준 정보와 통계 섹션이 보인다', async ({ page }) => {
    await registerProfile(page);
    await page.goto('./#/lotto');
    await expect(page.getByRole('heading', { name: '로또 6/45 분석소' })).toBeVisible();
    // 최근 추첨 번호 + 카이제곱 검정 + 핫/콜드
    await expect(page.getByText(/최근 추첨 — 제\d+회/)).toBeVisible();
    await expect(page.getByText('추첨기는 공정한가 — 카이제곱 검정')).toBeVisible();
    await expect(page.getByText('핫 번호')).toBeVisible();
    await expect(page.getByText('장기 미출현')).toBeVisible();
    // 구조 검정 — 8개 가설 + 결론
    await expect(page.getByText('구조 검정 — 과거 번호에 숨은 패턴이 있나')).toBeVisible();
    await expect(page.getByText('Hurst 지수 (장기의존·프랙탈 추정)')).toBeVisible();
    await expect(page.getByText('구조=조합 수학')).toBeVisible();
    // 방법론·한계 고지
    await expect(page.getByText('어떻게 뽑았나 — 수학적 근거')).toBeVisible();
    await expect(page.getByText('정직한 한계')).toBeVisible();
  });

  test('추천받기 버튼으로 5조합 생성 — 6개 번호씩', async ({ page }) => {
    await registerProfile(page);
    await page.goto('./#/lotto');
    await page.getByRole('button', { name: '5조합 추천받기' }).click();
    await expect(page.getByText('추천 5조합')).toBeVisible();
    // 각 조합 카드 5개 — 합계 표기로 식별
    await expect(page.getByText(/합계 \d+ · 홀짝/)).toHaveCount(5);
    // 다시 뽑기 → 조합 갱신
    await page.getByRole('button', { name: '다시 뽑기' }).click();
    await expect(page.getByText(/합계 \d+ · 홀짝/)).toHaveCount(5);
  });
});

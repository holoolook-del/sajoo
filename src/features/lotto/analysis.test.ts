import { describe, expect, it } from 'vitest';
import { LOTTO_DRAWS, type LottoDraw } from '../../content/lotto-draws.ts';
import {
  analyzeLotto,
  chiSquarePValue,
  generatePicks,
  LOTTO_MAX,
  mulberry32,
  scoreCombo,
} from './analysis.ts';

const mkDraw = (no: number, nums: number[], bonus = 1): LottoDraw => ({
  no,
  date: '2020-01-01',
  nums,
  bonus,
});

describe('analyzeLotto', () => {
  it('실데이터: 45개 번호 통계·기대값·최신 회차가 정확하다', () => {
    const s = analyzeLotto(LOTTO_DRAWS);
    expect(s.drawCount).toBe(LOTTO_DRAWS.length);
    expect(s.numbers).toHaveLength(LOTTO_MAX);
    const total = s.numbers.reduce((a, n) => a + n.freq, 0);
    expect(total).toBe(s.drawCount * 6);
    const w = s.numbers.reduce((a, n) => a + n.weight, 0);
    expect(w).toBeCloseTo(1, 6);
    expect(s.latestNo).toBe(Math.max(...LOTTO_DRAWS.map((d) => d.no)));
  });

  it('균등 분포에서는 카이제곱이 0에 가깝고 p가 크다', () => {
    // 45회 × 각 회차가 모든 번호를 골고루 포함하도록 구성
    const draws: LottoDraw[] = [];
    for (let d = 0; d < 45; d++) {
      const nums = Array.from({ length: 6 }, (_, i) => ((d * 6 + i) % 45) + 1);
      draws.push(mkDraw(d + 1, nums));
    }
    const s = analyzeLotto(draws);
    expect(s.chi2).toBeCloseTo(0, 6);
    expect(s.chi2P).toBeGreaterThan(0.9);
    // 모든 번호 weight가 균등(1/45) 근처 — 최근성 블렌딩으로 미세 편차 허용
    for (const n of s.numbers) expect(Math.abs(n.weight - 1 / 45)).toBeLessThan(0.005);
  });

  it('gap은 마지막 출현 이후 회차 수', () => {
    const draws = [
      mkDraw(1, [1, 2, 3, 4, 5, 6]),
      mkDraw(2, [7, 8, 9, 10, 11, 12]),
      mkDraw(3, [13, 14, 15, 16, 17, 18]),
    ];
    const s = analyzeLotto(draws);
    expect(s.numbers.find((x) => x.n === 1)!.gap).toBe(2);
    expect(s.numbers.find((x) => x.n === 18)!.gap).toBe(0);
  });
});

describe('chiSquarePValue', () => {
  it('경계값: 0이면 1, 큰 값이면 0에 수렴', () => {
    expect(chiSquarePValue(0, 44)).toBe(1);
    expect(chiSquarePValue(500, 44)).toBeLessThan(1e-30);
  });

  it('알려진 값 근처 — χ²(44)=59.30은 상위 5% 부근', () => {
    const p = chiSquarePValue(59.3, 44);
    expect(p).toBeGreaterThan(0.03);
    expect(p).toBeLessThan(0.08);
  });
});

describe('scoreCombo', () => {
  it('생일 조합(전부 ≤31)은 분배 패널티로 점수가 낮다', () => {
    const s = analyzeLotto(LOTTO_DRAWS);
    const birthday = [3, 7, 12, 19, 25, 30];
    const spread = [3, 14, 22, 29, 37, 44];
    expect(scoreCombo(birthday, s)).toBeLessThan(scoreCombo(spread, s));
  });

  it('등차수열 조합은 패널티를 받는다', () => {
    const s = analyzeLotto(LOTTO_DRAWS);
    const ap = [5, 10, 15, 20, 25, 30];
    const near = [5, 10, 15, 20, 25, 31];
    expect(scoreCombo(ap, s)).toBeLessThan(scoreCombo(near, s));
  });
});

describe('generatePicks', () => {
  const stats = analyzeLotto(LOTTO_DRAWS);

  it('6개 번호 1~45 오름차순·중복 없음·5세트', () => {
    const picks = generatePicks(stats, mulberry32(42));
    expect(picks).toHaveLength(5);
    for (const p of picks) {
      expect(p.numbers).toHaveLength(6);
      expect(new Set(p.numbers).size).toBe(6);
      expect(p.numbers.every((n) => n >= 1 && n <= 45)).toBe(true);
      expect([...p.numbers].sort((a, b) => a - b)).toEqual(p.numbers);
    }
  });

  it('같은 시드면 같은 결과 (재현성)', () => {
    const a = generatePicks(stats, mulberry32(7));
    const b = generatePicks(stats, mulberry32(7));
    expect(a.map((p) => p.numbers)).toEqual(b.map((p) => p.numbers));
  });

  it('추천 조합은 전형적 합계 범위에 든다 (역대 분포 중심)', () => {
    const picks = generatePicks(stats, mulberry32(1));
    // 역대 당첨 합계의 대부분은 100~177 — 추천도 그 근처에 몰려야 함
    expect(picks.filter((p) => p.sum >= 90 && p.sum <= 190).length).toBeGreaterThanOrEqual(4);
  });
});

import { describe, expect, it } from 'vitest';
import { calcSaju } from '../../lib/engine.ts';
import { compatScore } from './compat.ts';

// A: 1992-10-24 계유일주 (일지 유, 일간 계수)
const A = { year: 1992, month: 10, day: 24, hour: 5, minute: 30, calendar: 'solar' as const, isLeapMonth: false, gender: 'male' as const };
// B-삼합: 1992-10-28 정축일주 (일지 축 — 유축 삼합)
const B_HAP = { year: 1992, month: 10, day: 28, hour: 5, minute: 30, calendar: 'solar' as const, isLeapMonth: false, gender: 'female' as const };
// B-충: 1992-10-30 기묘일주 (일지 묘 — 유묘충)
const B_CHUNG = { year: 1992, month: 10, day: 30, hour: 5, minute: 30, calendar: 'solar' as const, isLeapMonth: false, gender: 'female' as const };

function sajuOf(input: Parameters<typeof calcSaju>[0]) {
  const r = calcSaju(input);
  if (!r.ok) throw new Error('calc 실패');
  return r.data;
}

describe('compatScore — 궁합', () => {
  const sajuA = sajuOf(A);
  const hap = compatScore(sajuA, sajuOf(B_HAP));
  const chung = compatScore(sajuA, sajuOf(B_CHUNG));

  it('삼합 궁합이 충 궁합보다 점수가 높다', () => {
    expect(hap.score).toBeGreaterThan(chung.score);
    expect(hap.score).toBeGreaterThanOrEqual(0);
    expect(hap.score).toBeLessThanOrEqual(100);
  });

  it('결과에 등급·요약·세부 해석이 있다', () => {
    for (const r of [hap, chung]) {
      expect(['대길', '길', '평', '흉', '대흉']).toContain(r.grade);
      expect(r.summary.length).toBeGreaterThan(5);
      expect(r.detail.length).toBeGreaterThan(0);
    }
  });

  it('삼합 관계가 해석에 드러난다', () => {
    expect(hap.detail.join()).toMatch(/합/);
    expect(chung.detail.join()).toMatch(/충/);
  });
});

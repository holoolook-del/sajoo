import { describe, expect, it } from 'vitest';
import { calcSaju } from '../../lib/engine.ts';
import { interpretSaju } from '../../lib/interpret.ts';
import type { ElementKey } from '../../content/meta.ts';
import { compatScore, type CompatResult } from './compat.ts';

// A: 1992-10-24 계유일주 (일지 유, 일간 계수) — 지지 申·戌·酉·卯
const A = { year: 1992, month: 10, day: 24, hour: 5, minute: 30, calendar: 'solar' as const, isLeapMonth: false, gender: 'male' as const };
// B-삼합: 1992-10-28 정축일주 (일지 축 — 유축 삼합, 일간 정화 — 정계충)
const B_HAP = { year: 1992, month: 10, day: 28, hour: 5, minute: 30, calendar: 'solar' as const, isLeapMonth: false, gender: 'female' as const };
// B-충: 1992-10-30 기묘일주 (일지 묘 — 유묘충)
const B_CHUNG = { year: 1992, month: 10, day: 30, hour: 5, minute: 30, calendar: 'solar' as const, isLeapMonth: false, gender: 'female' as const };
// B-무계합: 1995-01-07 무술일주 (일간 무토 — 무계합)
const B_MUGYE = { year: 1995, month: 1, day: 7, hour: 12, minute: 0, calendar: 'solar' as const, isLeapMonth: false, gender: 'female' as const };
// B-배우자성: 1995-01-05 병신일주 (일간 병화 — 남A에게 정재, A는 여B에게 정관)
const B_SPOUSE = { year: 1995, month: 1, day: 5, hour: 12, minute: 0, calendar: 'solar' as const, isLeapMonth: false, gender: 'female' as const };
// B-삼합완성: 1997-05-15 정사일주 (지지 丑·巳·巳·午 — A의 酉와 합쳐 사유축 금국 완성)
const B_SAMHAP = { year: 1997, month: 5, day: 15, hour: 12, minute: 0, calendar: 'solar' as const, isLeapMonth: false, gender: 'female' as const };

function sajuOf(input: Parameters<typeof calcSaju>[0]) {
  const r = calcSaju(input);
  if (!r.ok) throw new Error('calc 실패');
  return r.data;
}

const allLines = (r: CompatResult) => r.aspects.flatMap((a) => a.lines).join(' ');

describe('compatScore — 궁합', () => {
  const sajuA = sajuOf(A);
  const hap = compatScore(sajuA, sajuOf(B_HAP));
  const chung = compatScore(sajuA, sajuOf(B_CHUNG));

  it('삼합 궁합이 충 궁합보다 점수가 높다', () => {
    expect(hap.score).toBeGreaterThan(chung.score);
    expect(hap.score).toBeGreaterThanOrEqual(0);
    expect(hap.score).toBeLessThanOrEqual(100);
  });

  it('결과에 등급·요약·항목별 해석이 있다', () => {
    for (const r of [hap, chung]) {
      expect(['대길', '길', '평', '흉', '대흉']).toContain(r.grade);
      expect(r.summary.length).toBeGreaterThan(5);
      expect(r.aspects.length).toBeGreaterThanOrEqual(4);
      for (const aspect of r.aspects) {
        expect(aspect.title.length).toBeGreaterThan(0);
        expect(aspect.lines.length).toBeGreaterThan(0);
      }
    }
  });

  it('삼합·충 관계가 해석에 드러난다', () => {
    expect(allLines(hap)).toMatch(/합/);
    expect(allLines(chung)).toMatch(/충/);
  });
});

describe('compatScore — 고전 궁합 항목', () => {
  const sajuA = sajuOf(A);

  it('일간 천간합(무계합)이 해석과 점수에 반영된다', () => {
    const r = compatScore(sajuA, sajuOf(B_MUGYE));
    expect(allLines(r)).toMatch(/무계합|천간합/);
    expect(r.score).toBeGreaterThan(60);
  });

  it('일간 천간충(정계충)이 감점된다', () => {
    const r = compatScore(sajuA, sajuOf(B_HAP));
    expect(allLines(r)).toMatch(/정계충|천간충/);
  });

  it('배우자성 — 상대 일간이 내 정재·정관이면 배우자 인연으로 표기한다', () => {
    const r = compatScore(sajuA, sajuOf(B_SPOUSE), { genderA: 'male', genderB: 'female' });
    expect(allLines(r)).toMatch(/배우자성|배우자 인연/);
  });

  it('둘의 지지가 합쳐 삼합을 완성하면 반영된다', () => {
    const r = compatScore(sajuA, sajuOf(B_SAMHAP));
    expect(allLines(r)).toMatch(/금국|삼합/);
  });

  it('얼기설기 — 일지 외 지지 전체의 합·충도 해석한다 (A월지 戌 × B일지 卯 = 육합)', () => {
    const r = compatScore(sajuA, sajuOf(B_CHUNG));
    const aspect = r.aspects.find((a) => a.title.includes('얼기설기'));
    expect(aspect).toBeTruthy();
    expect(aspect!.lines.join(' ')).toMatch(/육합/);
    expect(aspect!.lines.join(' ')).toContain('월지');
  });

  it('용신 관점 — 상대의 가장 강한 기운이 내 용신이면 표기한다', () => {
    const b = sajuOf(B_HAP);
    const dom = interpretSaju(b).dominant as ElementKey;
    const r = compatScore(sajuA, b, { balanceA: { yongsin: dom, gisin: [] } });
    expect(r.aspects.find((a) => a.title.includes('용신'))).toBeTruthy();
    expect(allLines(r)).toMatch(/용신/);
  });

  it('용신 관점 — 상대의 가장 강한 기운이 내 기신이면 마찰로 표기한다', () => {
    const b = sajuOf(B_HAP);
    const dom = interpretSaju(b).dominant as ElementKey;
    const r = compatScore(sajuA, b, { balanceA: { yongsin: '수', gisin: [dom] } });
    expect(allLines(r)).toMatch(/기신/);
  });

  it('용신 데이터가 없으면 용신 관점 장을 생략한다', () => {
    const r = compatScore(sajuA, sajuOf(B_HAP));
    expect(r.aspects.find((a) => a.title.includes('용신'))).toBeUndefined();
  });
});

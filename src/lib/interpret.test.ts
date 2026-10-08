import { describe, expect, it } from 'vitest';
import { calcSaju } from './engine.ts';
import { interpretSaju } from './interpret.ts';
import { ELEMENT_KEYS } from '../content/meta.ts';

const input = {
  year: 1992, month: 10, day: 24, hour: 5, minute: 30,
  calendar: 'solar' as const, isLeapMonth: false, gender: 'male' as const,
};

describe('interpretSaju', () => {
  const saju = calcSaju(input);
  if (!saju.ok) throw new Error('calc 실패');
  const reading = interpretSaju(saju.data);

  it('일간 해석을 찾는다 (계수 = 이슬·샘물)', () => {
    expect(reading.dayMaster.nature).toBe('이슬·샘물');
    expect(reading.dayMaster.text.length).toBeGreaterThan(20);
  });

  it('사주 캐릭터(유형명·키워드·사회적 면모)를 만든다', () => {
    expect(reading.dayMaster.title.length).toBeGreaterThan(3);
    expect(reading.dayMaster.keywords.length).toBe(3);
    const { seen, good, watch, bond } = reading.dayMaster.social;
    for (const s of [seen, good, watch, bond]) {
      expect(s.length).toBeGreaterThan(10);
    }
  });

  it('오행 분포를 센다 (4주 = 8글자)', () => {
    const total = reading.elementCounts.reduce((s, e) => s + e.count, 0);
    expect(total).toBe(8);
    expect(reading.elementCounts.map((e) => e.element)).toEqual(ELEMENT_KEYS);
  });

  it('과다 오행과 부족 오행을 판정한다', () => {
    // 계유일주: 금·수 기운이 강한 사주
    expect(['금', '수']).toContain(reading.dominant);
    for (const lack of reading.lacking) {
      expect(reading.elementCounts.find((e) => e.element === lack)?.count).toBe(0);
    }
    expect(reading.balanceText.length).toBeGreaterThan(10);
  });

  it('십신 분포와 대표 십신을 구한다 (일간 제외)', () => {
    const total = reading.tenGodCounts.reduce((s, t) => s + t.count, 0);
    expect(total).toBe(7); // 8글자 중 일간 자리는 십신 아님
    expect(reading.topTenGods.length).toBeGreaterThan(0);
    for (const g of reading.topTenGods) {
      expect(reading.tenGodTexts.map((t) => t.god)).toContain(g);
    }
  });

  it('고민별 해석 6종을 모두 채운다', () => {
    expect(reading.concerns.map((c) => c.key)).toEqual([
      'money', 'career', 'love', 'health', 'relations', 'family',
    ]);
    for (const c of reading.concerns) {
      expect(c.label.length).toBeGreaterThan(1);
      expect(c.text.length).toBeGreaterThan(30);
    }
  });
});

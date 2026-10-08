import { beforeEach, describe, expect, it } from 'vitest';
import { iljinOf } from '../../lib/engine.ts';
import { calcSaju } from '../../lib/engine.ts';
import { branchRelation } from '../../lib/relations.ts';
import { dailyFortune, saveTodaysFortune } from './today.ts';
import { loadFortune } from '../../lib/storage.ts';
import type { Profile } from '../../lib/types.ts';

const profile: Profile = {
  v: 1, name: '테스트', calendar: 'solar', isLeapMonth: false,
  year: 1992, month: 10, day: 24, hour: 5, minute: 30,
  gender: 'male', createdAt: '2026-10-08T00:00:00.000Z',
};

beforeEach(() => localStorage.clear());

describe('iljinOf — 그날의 일진', () => {
  it('1992-10-24의 일진은 계유 (검증된 벡터)', () => {
    expect(iljinOf(1992, 10, 24).korean).toBe('계유');
  });
});

describe('branchRelation — 지지 합충형해', () => {
  it('육합: 자+축', () => expect(branchRelation('자', '축')).toBe('육합'));
  it('삼합: 신+자(수국), 인+오(화국)', () => {
    expect(branchRelation('신', '자')).toBe('삼합');
    expect(branchRelation('인', '오')).toBe('삼합');
  });
  it('충: 자+오, 인+신', () => {
    expect(branchRelation('자', '오')).toBe('충');
    expect(branchRelation('인', '신')).toBe('충');
  });
  it('관계 없음: 자+묘는 형이 아니라 상형은 子卯', () => {
    expect(branchRelation('자', '묘')).toBe('형');
    expect(branchRelation('자', '진')).toBe('삼합'); // 신자진은 아니고 진+자? 삼합은 申子辰 — 子辰 yes
    expect(branchRelation('자', '술')).toBe('원진');
    expect(branchRelation('자', '유')).toBe('파');
  });
});

describe('dailyFortune — 일진×내 사주 조합', () => {
  it('날짜의 일진과 등급·해석 문장을 만든다', () => {
    const saju = calcSaju({ ...profile });
    if (!saju.ok) throw new Error('calc 실패');
    const f = dailyFortune(saju.data, '2026-10-08');
    expect(f.date).toBe('2026-10-08');
    expect(f.iljin.korean.length).toBe(2);
    expect(['대길', '길', '평', '흉', '대흉']).toContain(f.grade);
    expect(f.detail.length).toBeGreaterThan(0);
    expect(f.summary.length).toBeGreaterThan(5);
  });

  it('saveTodaysFortune은 FortuneRecord를 저장하고 다시 읽는다', () => {
    const saju = calcSaju({ ...profile });
    if (!saju.ok) throw new Error('calc 실패');
    const rec = saveTodaysFortune(saju.data, '2026-10-08');
    const loaded = loadFortune('2026-10-08');
    expect(loaded).not.toBeNull();
    expect(rec.grade).toBe(loaded?.grade);
    expect(loaded?.iljin).toBe(rec.iljin);
  });
});

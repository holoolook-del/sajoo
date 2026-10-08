import { describe, expect, it } from 'vitest';
import { calcSaju, validateBirthInput, type SajuBirthInput } from './engine.ts';

const base: SajuBirthInput = {
  year: 1992,
  month: 10,
  day: 24,
  hour: 5,
  minute: 30,
  calendar: 'solar',
  isLeapMonth: false,
  gender: 'male',
};

describe('calcSaju', () => {
  it('KASI 기준 사주팔자를 계산한다 (AC2 계산부)', () => {
    const r = calcSaju(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.pillars.year.korean).toBe('임신');
    expect(r.data.pillars.month.korean).toBe('경술');
    expect(r.data.pillars.day.korean).toBe('계유');
    expect(r.data.pillars.hour?.korean).toBe('을묘');
    expect(r.data.hourIncluded).toBe(true);
    expect(r.data.pillars.year.hanja).toBe('壬申');
  });

  it('음력 입력을 같은 결과로 변환한다', () => {
    const r = calcSaju({ ...base, calendar: 'lunar', month: 9, day: 29 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.pillars.year.korean).toBe('임신');
    expect(r.data.pillars.day.korean).toBe('계유');
    expect(r.data.solar).toEqual({ year: 1992, month: 10, day: 24 });
  });

  it('생시를 모르면 시주 없이 3주만 반환한다 (AC3)', () => {
    const r = calcSaju({ ...base, hour: null, minute: null });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.hourIncluded).toBe(false);
    expect(r.data.pillars.hour).toBeNull();
    expect(r.data.pillars.day.korean).toBe('계유');
  });

  it('입춘 이전 출생은 이전 해 간지를 쓴다', () => {
    const before = calcSaju({ ...base, year: 2026, month: 2, day: 3, hour: 12 });
    const after = calcSaju({ ...base, year: 2026, month: 2, day: 5, hour: 12 });
    if (!before.ok || !after.ok) throw new Error('계산 실패');
    expect(before.data.pillars.year.korean).toBe('을사');
    expect(after.data.pillars.year.korean).toBe('병오');
  });

  it('십신·공망·대운을 함께 준다', () => {
    const r = calcSaju(base);
    if (!r.ok) throw new Error('계산 실패');
    expect(r.data.pillars.day.tenGodStem).toBe('일간');
    expect(r.data.voidBranches).toContain('술');
    expect(r.data.luckPillars?.forward).toBe(true);
    expect(r.data.luckPillars?.pillars[0]?.age).toBe(5);
  });
});

describe('validateBirthInput (AC11)', () => {
  it('미래 날짜를 거부한다', () => {
    const r = validateBirthInput({ ...base, year: 2999, month: 1, day: 1 });
    expect(r.ok).toBe(false);
  });

  it('존재하지 않는 날짜를 거부한다', () => {
    const r = validateBirthInput({ ...base, year: 2024, month: 2, day: 30 });
    expect(r.ok).toBe(false);
  });

  it('지원 범위 밖 연도를 거부한다', () => {
    const r = validateBirthInput({ ...base, year: 1700, month: 1, day: 1 });
    expect(r.ok).toBe(false);
  });

  it('정상 입력을 통과시킨다', () => {
    const r = validateBirthInput(base);
    expect(r.ok).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { calcSaju, monthPillarOf, yearPillarOf } from '../../lib/engine.ts';
import { buildLuckView } from './luck.ts';
import type { Profile } from '../../lib/types.ts';

const profile: Profile = {
  v: 1, name: '테스트', calendar: 'solar', isLeapMonth: false,
  year: 1992, month: 10, day: 24, hour: 5, minute: 30,
  gender: 'male', createdAt: '2026-10-08T00:00:00.000Z',
};

describe('yearPillarOf / monthPillarOf', () => {
  it('2026년 세운은 병오', () => {
    expect(yearPillarOf(2026).korean).toBe('병오');
  });
  it('1992년 10월 월주는 경술', () => {
    expect(monthPillarOf(1992, 10).korean).toBe('경술');
  });
});

describe('buildLuckView', () => {
  const saju = calcSaju({ ...profile });
  if (!saju.ok) throw new Error('calc 실패');
  const view = buildLuckView(saju.data, profile, '2026-10-08');
  if (!view) throw new Error('view 실패');

  it('대운 리스트가 비어 있지 않고 현재 대운을 표시한다', () => {
    expect(view.daewoon.length).toBeGreaterThan(0);
    expect(view.daewoon.filter((d) => d.current)).toHaveLength(1);
    for (const d of view.daewoon) {
      expect(d.korean.length).toBe(2);
      expect(d.stemGod.length).toBeGreaterThan(0);
    }
  });

  it('세운과 월운을 구성한다', () => {
    expect(view.seun.korean).toBe('병오');
    expect(view.wolun).toHaveLength(12);
    expect(view.wolun.filter((w) => w.current)).toHaveLength(1);
    expect(view.wolun.find((w) => w.current)?.month).toBe(10);
  });
});

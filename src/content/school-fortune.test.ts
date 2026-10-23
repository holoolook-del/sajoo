import { describe, expect, it } from 'vitest';
import { SCHOOL_CATS, SCHOOL_GRADES, schoolFortune, schoolSummary } from './school-fortune.ts';

describe('학교 운세 — 결정적 생성', () => {
  it('같은 날짜면 같은 결과 — 친구들과 비교할 수 있다', () => {
    const a = schoolFortune('2026-10-23');
    const b = schoolFortune('2026-10-23');
    expect(a).toEqual(b);
  });

  it('4개 카테고리가 모두 나온다', () => {
    const lucks = schoolFortune('2026-10-23');
    expect(lucks.map((l) => l.cat.id).sort()).toEqual(SCHOOL_CATS.map((c) => c.id).sort());
  });

  it('모든 결과가 유효한 등급·별점·문구를 가진다', () => {
    for (const l of schoolFortune('2026-06-01')) {
      expect(SCHOOL_GRADES.map((g) => g.grade)).toContain(l.grade);
      expect(l.stars).toBeGreaterThanOrEqual(1);
      expect(l.stars).toBeLessThanOrEqual(5);
      expect(l.msg.length).toBeGreaterThan(0);
    }
  });

  it('날짜가 다르면 결과가 바뀔 수 있다 — 장기간 같을 수 없다', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 28; d++) {
      const key = schoolFortune(`2026-10-${String(d).padStart(2, '0')}`)
        .map((l) => `${l.cat.id}:${l.grade}`)
        .join('|');
      seen.add(key);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('총평은 평균 별점에 맞는 단계를 준다', () => {
    const lucks = schoolFortune('2026-10-23');
    const s = schoolSummary(lucks);
    expect(s.stars).toBeGreaterThanOrEqual(1);
    expect(s.stars).toBeLessThanOrEqual(5);
    expect(s.text.length).toBeGreaterThan(0);
  });
});

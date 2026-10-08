import { describe, expect, it } from 'vitest';
import { todayKST } from './date.ts';

describe('todayKST', () => {
  it('KST 자정 경계에서 날짜가 바뀐다', () => {
    // UTC 2026-10-07 14:59:59 = KST 2026-10-07 23:59:59
    expect(todayKST(new Date('2026-10-07T14:59:59Z'))).toBe('2026-10-07');
    // UTC 2026-10-07 15:00:00 = KST 2026-10-08 00:00:00
    expect(todayKST(new Date('2026-10-07T15:00:00Z'))).toBe('2026-10-08');
  });

  it('YYYY-MM-DD 형식을 반환한다', () => {
    expect(todayKST(new Date('2026-01-05T03:00:00Z'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

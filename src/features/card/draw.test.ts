import { beforeEach, describe, expect, it } from 'vitest';
import { canDrawOn, dailyCard, drawToday, todaysDraw } from './draw.ts';
import { CARD_DECK } from '../../content/cards.ts';
import type { Profile } from '../../lib/types.ts';

const profile: Profile = {
  v: 1,
  name: '테스트',
  calendar: 'solar',
  isLeapMonth: false,
  year: 1992,
  month: 10,
  day: 24,
  hour: 5,
  minute: 30,
  gender: 'male',
  createdAt: '2026-10-08T00:00:00.000Z',
};

beforeEach(() => localStorage.clear());

describe('dailyCard', () => {
  it('같은 날·같은 사람은 같은 카드를 뽑는다 (AC5 결정성)', () => {
    expect(dailyCard(profile, '2026-10-08').id).toBe(dailyCard(profile, '2026-10-08').id);
  });

  it('덱에 존재하는 유효한 카드다', () => {
    const card = dailyCard(profile, '2026-10-08');
    expect(CARD_DECK.map((c) => c.id)).toContain(card.id);
  });

  it('날짜가 바뀌면 카드가 바뀐다 (전체 순회 확인)', () => {
    const ids = new Set(
      Array.from({ length: 60 }, (_, i) => dailyCard(profile, `2026-10-${String((i % 28) + 1).padStart(2, '0')}-${i}`).id),
    );
    // 60개의 서로 다른 날짜 시드에서 최소 2종 이상 카드가 나와야 한다
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe('하루 1장 규칙 (AC5, AC6)', () => {
  it('뽑으면 기록이 저장되고 같은 날 재뽑기가 차단된다', () => {
    expect(canDrawOn('2026-10-08')).toBe(true);
    const draw = drawToday(profile, '2026-10-08');
    expect(draw.date).toBe('2026-10-08');
    expect(dailyCard(profile, '2026-10-08').id).toBe(draw.cardId);
    expect(canDrawOn('2026-10-08')).toBe(false);
    expect(canDrawOn('2026-10-09')).toBe(true);
  });

  it('이미 뽑은 날 drawToday는 기존 기록을 그대로 돌려준다', () => {
    const first = drawToday(profile, '2026-10-08');
    const second = drawToday(profile, '2026-10-08');
    expect(second.cardId).toBe(first.cardId);
    expect(todaysDraw('2026-10-08')?.cardId).toBe(first.cardId);
    expect(todaysDraw('2026-10-09')).toBeNull();
  });
});

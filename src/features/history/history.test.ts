import { beforeEach, describe, expect, it } from 'vitest';
import { buildHistory } from './history.ts';
import { loadCardDraw, loadFortune, saveCardDraw, saveFortune } from '../../lib/storage.ts';
import type { FortuneRecord } from '../../lib/types.ts';

const fortuneAt = (date: string): FortuneRecord => ({
  v: 1, date, iljin: '갑자', grade: '길', summary: '길한 하루',
});

beforeEach(() => localStorage.clear());

describe('buildHistory — 30일 기록', () => {
  it('운세·카드 기록을 날짜별로 합쳐 최근순으로 돌려준다', () => {
    saveFortune(fortuneAt('2025-06-14'));
    saveFortune(fortuneAt('2025-06-15'));
    saveCardDraw({ v: 1, date: '2025-06-15', cardId: 'card-01', drawnAt: '2025-06-15T01:00:00Z' });

    const history = buildHistory('2025-06-15');
    expect(history).toHaveLength(2);
    expect(history[0]!.date).toBe('2025-06-15');
    expect(history[0]!.fortune?.iljin).toBe('갑자');
    expect(history[0]!.draw?.cardId).toBe('card-01');
    expect(history[1]!.draw).toBeUndefined();
  });

  it('30일을 넘는 옛 기록은 보이지 않고 저장소에서도 지워진다', () => {
    saveFortune(fortuneAt('2025-04-01')); // 45일 전
    saveFortune(fortuneAt('2025-05-20')); // 26일 전
    saveCardDraw({ v: 1, date: '2025-03-01', cardId: 'card-02', drawnAt: '2025-03-01T00:00:00Z' });

    const history = buildHistory('2025-06-15');
    expect(history).toHaveLength(1);
    expect(history[0]!.date).toBe('2025-05-20');
    expect(loadFortune('2025-04-01')).toBeNull();
    expect(loadCardDraw('2025-03-01')).toBeNull();
  });

  it('기록이 없으면 빈 배열', () => {
    expect(buildHistory('2025-06-15')).toEqual([]);
  });
});

import { todayKST } from '../../lib/date.ts';
import {
  listCardDraws,
  listFortunes,
  pruneHistory,
} from '../../lib/storage.ts';
import type { CardDraw, FortuneRecord } from '../../lib/types.ts';

export interface HistoryEntry {
  date: string;
  fortune?: FortuneRecord;
  draw?: CardDraw;
}

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00+09:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 최근 days일의 운세·카드 기록을 날짜별로 합쳐 최근순으로 돌려준다.
 * 창 밖의 옛 기록은 이 시점에 저장소에서도 지운다.
 */
export function buildHistory(today: string = todayKST(), days = 30): HistoryEntry[] {
  const cutoff = shiftDate(today, -(days - 1));
  pruneHistory(cutoff);

  const byDate = new Map<string, HistoryEntry>();
  for (const f of listFortunes()) {
    if (f.date < cutoff) continue;
    byDate.set(f.date, { ...byDate.get(f.date), date: f.date, fortune: f });
  }
  for (const c of listCardDraws()) {
    if (c.date < cutoff) continue;
    byDate.set(c.date, { ...byDate.get(c.date), date: c.date, draw: c });
  }
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
}

import { CARD_DECK, type CardDef } from '../../content/cards.ts';
import { todayKST } from '../../lib/date.ts';
import { loadCardDraw, saveCardDraw } from '../../lib/storage.ts';
import type { CardDraw, Profile } from '../../lib/types.ts';

function hashSeed(s: string): number {
  let h = 5381;
  for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

const seedKey = (p: Profile) => `${p.name}|${p.year}-${p.month}-${p.day}`;

/** 그날·그 사람의 카드는 정해져 있다 — 날짜+사주 시드로 결정적 뽑기 */
export function dailyCard(profile: Profile, date: string): CardDef {
  const idx = hashSeed(`${seedKey(profile)}|${date}`) % CARD_DECK.length;
  return CARD_DECK[idx]!;
}

export function canDrawOn(date: string): boolean {
  return loadCardDraw(date) === null;
}

export function todaysDraw(date: string = todayKST()): CardDraw | null {
  return loadCardDraw(date);
}

/** 오늘의 카드를 뽑는다. 이미 뽑았으면 기존 기록을 그대로 돌려준다(멱등). */
export function drawToday(profile: Profile, date: string = todayKST()): CardDraw {
  const existing = loadCardDraw(date);
  if (existing) return existing;
  const draw: CardDraw = {
    v: 1,
    date,
    cardId: dailyCard(profile, date).id,
    drawnAt: new Date().toISOString(),
  };
  saveCardDraw(draw);
  return draw;
}

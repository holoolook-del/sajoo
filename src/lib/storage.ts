import type { CardDraw, FortuneRecord, Profile } from './types.ts';

const PREFIX = 'sajoo:';

function readRecord<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

function writeRecord(key: string, value: unknown): void {
  localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
}

export function saveProfile(profile: Profile): void {
  writeRecord('profile', profile);
}
export function loadProfile(): Profile | null {
  return readRecord<Profile>('profile');
}
export function hasProfile(): boolean {
  return loadProfile() !== null;
}

export function saveCardDraw(draw: CardDraw): void {
  writeRecord(`card:${draw.date}`, draw);
}
export function loadCardDraw(date: string): CardDraw | null {
  return readRecord<CardDraw>(`card:${date}`);
}

export function saveFortune(rec: FortuneRecord): void {
  writeRecord(`fortune:${rec.date}`, rec);
}
export function loadFortune(date: string): FortuneRecord | null {
  return readRecord<FortuneRecord>(`fortune:${date}`);
}

function listRecords<T>(kind: string): T[] {
  const out: T[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(`${PREFIX}${kind}:`)) continue;
    const rec = readRecord<T>(key.slice(PREFIX.length));
    if (rec) out.push(rec);
  }
  return out;
}

/** 날짜 내림차순(최근 먼저)으로 저장된 운세 기록 전부 */
export function listFortunes(): FortuneRecord[] {
  return listRecords<FortuneRecord>('fortune').sort((a, b) => b.date.localeCompare(a.date));
}
/** 날짜 내림차순으로 저장된 카드 뽑기 기록 전부 */
export function listCardDraws(): CardDraw[] {
  return listRecords<CardDraw>('card').sort((a, b) => b.date.localeCompare(a.date));
}

/** cutoff('YYYY-MM-DD') 이전의 운세·카드 기록을 지운다 — 히스토리는 최근만 유지 */
export function pruneHistory(beforeDate: string): void {
  const stale: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    if (!key.startsWith(`${PREFIX}fortune:`) && !key.startsWith(`${PREFIX}card:`)) continue;
    if (key.slice(key.lastIndexOf(':') + 1) < beforeDate) stale.push(key);
  }
  stale.forEach((k) => localStorage.removeItem(k));
}

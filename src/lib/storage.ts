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

import { readRecord, writeRecord } from '../../lib/storage.ts';

/**
 * 게시판 익명 닉네임 — 기기당 하나, localStorage에 유지.
 * 사용자가 직접 바꿀 수 있고, 최초엔 '달빛나그네'류 자동 생성.
 */

const ANIMALS = ['호랑이', '까치', '여우', '두루미', '고양이', '토끼', '수달', '부엉이', '사슴', '거북이'];
const EPITHETS = ['달빛', '바람', '구름', '별빛', '안개', '이슬', '파도', '새벽', '노을', '첫눈'];

export function genNickname(rand: () => number = Math.random): string {
  const e = EPITHETS[Math.floor(rand() * EPITHETS.length)]!;
  const a = ANIMALS[Math.floor(rand() * ANIMALS.length)]!;
  const n = Math.floor(rand() * 90) + 10; // 10~99
  return `${e}${a}${n}`;
}

export function boardNickname(): string {
  const saved = readRecord<string>('board:nick');
  if (saved) return saved;
  const nick = genNickname();
  writeRecord('board:nick', nick);
  return nick;
}

export function saveNickname(nick: string): void {
  writeRecord('board:nick', nick.trim().slice(0, 12));
}

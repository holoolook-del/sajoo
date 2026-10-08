/** 영속화되는 레코드 타입 — 저장소는 lib/storage.ts 경유. 모든 레코드에 v 버전 필드.
 * 나머지 레코드(CardDraw/FortuneRecord 등)는 각 기능 태스크에서 추가한다. */
export type Gender = 'male' | 'female';
export type CalendarKind = 'solar' | 'lunar';

export interface Profile {
  v: 1;
  name: string; // 1~10자
  calendar: CalendarKind;
  isLeapMonth: boolean; // lunar일 때만 의미 있음
  year: number;
  month: number;
  day: number;
  hour: number | null; // null = 생시 모름 → 3주
  minute: number | null;
  gender: Gender; // 대운 순/역행에 필수
  createdAt: string; // ISO
}

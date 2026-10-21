/**
 * 로또 6/45 역대 당첨번호 수집 → src/content/lotto-draws.ts 자동 생성.
 *
 * 소스: smok95/lotto (GitHub Pages 미러) — 동행복권 본 사이트(dhlottery.co.kr)는
 * 해외 IP를 차단해 CI·로컬 fetch가 불가하다. 이 미러는 동행복권 결과를 매주
 * 자동 동기화하는 공개 저장소이며 1회차 값을 공식 기록과 대조해 검증한다.
 * 실행: pnpm gen:lotto  (weekly lotto-sync 워크플로가 자동 실행·커밋)
 */
import { writeFileSync } from 'node:fs';

const SOURCE = 'https://smok95.github.io/lotto/results/all.json';
const OUT = 'src/content/lotto-draws.ts';
/** 동행복권 공식 1회차(2002-12-07) — 미러 정합성 검증용 */
const FIRST_DRAW = [10, 23, 29, 33, 37, 40];
const FIRST_BONUS = 16;

interface RawDraw {
  draw_no: number;
  numbers: number[];
  bonus_no: number;
  date: string;
}

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`로또 데이터 fetch 실패: HTTP ${res.status}`);
const all = (await res.json()) as RawDraw[];
if (!Array.isArray(all) || all.length === 0) throw new Error('빈 데이터');

all.sort((a, b) => a.draw_no - b.draw_no);
for (const [i, d] of all.entries()) {
  const ok =
    d.draw_no === i + 1 &&
    Array.isArray(d.numbers) &&
    d.numbers.length === 6 &&
    new Set(d.numbers).size === 6 &&
    [...d.numbers, d.bonus_no].every((n) => Number.isInteger(n) && n >= 1 && n <= 45) &&
    !d.numbers.includes(d.bonus_no);
  if (!ok) throw new Error(`${d.draw_no}회 데이터 이상: ${JSON.stringify(d)}`);
}
const first = all[0]!;
if (first.numbers.join(',') !== FIRST_DRAW.join(',') || first.bonus_no !== FIRST_BONUS) {
  throw new Error(`1회차 불일치 — 미러 오염 가능: ${JSON.stringify(first)}`);
}

const lines = all.map(
  (d) =>
    `  { no: ${d.draw_no}, date: '${d.date.slice(0, 10)}', nums: [${d.numbers.join(', ')}], bonus: ${d.bonus_no} },`,
);
const latest = all[all.length - 1]!;
const body = `/**
 * 로또 6/45 역대 당첨번호 — scripts/gen-lotto.ts 자동 생성 (직접 수정 금지).
 * 소스: smok95/lotto 미러(동행복권 결과 동기화) · 생성 ${new Date().toISOString()}
 * 최종 회차: ${latest.draw_no}회 (${latest.date.slice(0, 10)})
 */

export interface LottoDraw {
  /** 회차 */
  no: number;
  /** 추첨일 'YYYY-MM-DD' */
  date: string;
  /** 당첨 번호 6개 (오름차순) */
  nums: readonly number[];
  /** 보너스 번호 */
  bonus: number;
}

export const LOTTO_DRAWS: readonly LottoDraw[] = [
${lines.join('\n')}
];
`;

writeFileSync(OUT, body);
console.log(`${all.length}회 수집 완료 → ${OUT} (최신 ${latest.draw_no}회, ${latest.date.slice(0, 10)})`);

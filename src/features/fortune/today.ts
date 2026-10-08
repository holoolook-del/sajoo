import { getBranchTenGod, getTenGod } from 'manseryeok';
import type { EarthlyBranch, HeavenlyStem } from 'manseryeok';
import { DAY_GOD_TEXT, GRADE_SUMMARY, LUCKY, RELATION_TEXT } from '../../content/fortune.ts';
import { branchRelation, type BranchRelation } from '../../lib/relations.ts';
import {
  ELEMENT_CONTROLS,
  ELEMENT_GENERATES,
  type ElementKey,
  type TenGodKey,
} from '../../content/meta.ts';
import { iljinOf, type Iljin, type SajuResult } from '../../lib/engine.ts';
import { saveFortune } from '../../lib/storage.ts';
import type { FortuneRecord, Grade } from '../../lib/types.ts';

export interface DailyFortune {
  date: string;
  iljin: { korean: string; hanja: string };
  grade: Grade;
  score: number;
  stemGod: TenGodKey;
  branchGod: TenGodKey;
  relation: BranchRelation | null;
  summary: string;
  detail: string[];
  /** 운세 지수 0~100 — score를 사람 친화적인 퍼센트로 환산 */
  luckIndex: number;
  /** 행운 색·방향·아이템 (일진 오행 기준) */
  lucky: { color: string; direction: string; item: string };
}

const GOD_SCORE: Record<TenGodKey, number> = {
  정관: 2, 정재: 2, 정인: 2, 식신: 2,
  편재: 1, 편인: 1, 비견: 0,
  겁재: -1, 상관: -1, 편관: -1,
};

const RELATION_SCORE: Record<BranchRelation, number> = {
  육합: 2, 삼합: 2, 충: -2, 형: -1, 해: -1, 원진: -1, 파: -1,
};

function scoreToGrade(score: number): Grade {
  if (score >= 4) return '대길';
  if (score >= 2) return '길';
  if (score >= -1) return '평';
  if (score >= -3) return '흉';
  return '대흉';
}

function elementRelation(iljinElement: string, myElement: string): { score: number; text: string } | null {
  const i = iljinElement as ElementKey;
  const m = myElement as ElementKey;
  if (ELEMENT_GENERATES[i] === m) {
    return { score: 1, text: `오늘의 ${i} 기운이 나의 ${m}을 생(生)합니다 — 외부의 도움이 따릅니다.` };
  }
  if (ELEMENT_GENERATES[m] === i) {
    return { score: 1, text: `나의 ${m} 기운이 오늘의 ${i}를 생합니다 — 내가 베푸는 만큼 돌아오는 날.` };
  }
  if (ELEMENT_CONTROLS[i] === m) {
    return { score: -1, text: `오늘의 ${i} 기운이 나의 ${m}을 극(剋)합니다 — 압박을 받을 수 있으니 방어적으로.` };
  }
  if (ELEMENT_CONTROLS[m] === i) {
    return { score: 1, text: `나의 ${m}이 오늘의 ${i}를 극합니다 — 주도권을 쥐는 날.` };
  }
  return null;
}

/** 일진과 내 사주를 조합해 오늘의 운세를 만든다. */
export function dailyFortune(saju: SajuResult, date: string): DailyFortune {
  const [y, m, d] = date.split('-').map(Number);
  const iljin: Iljin = iljinOf(y!, m!, d!);

  const myStem = saju.dayMaster.korean as HeavenlyStem;
  const myBranch = saju.pillars.day.korean.charAt(1) as EarthlyBranch;

  const stemGod = getTenGod(myStem, iljin.stem as HeavenlyStem) as TenGodKey;
  const branchGod = getBranchTenGod(myStem, iljin.branch as EarthlyBranch) as TenGodKey;
  const relation = branchRelation(myBranch, iljin.branch);
  const el = elementRelation(iljin.stemElement, saju.dayMaster.element);

  const score =
    GOD_SCORE[stemGod] +
    GOD_SCORE[branchGod] +
    (relation ? RELATION_SCORE[relation] : 0) +
    (el?.score ?? 0);
  const grade = scoreToGrade(score);

  const detail = [
    `오늘의 일진 천간은 ${stemGod} — ${DAY_GOD_TEXT[stemGod].stem}`,
    `일진 지지는 ${branchGod} — ${DAY_GOD_TEXT[branchGod].branch}`,
    ...(relation ? [RELATION_TEXT[relation]] : []),
    ...(el ? [el.text] : []),
  ];

  return {
    date,
    iljin: { korean: iljin.korean, hanja: iljin.hanja },
    grade,
    score,
    stemGod,
    branchGod,
    relation,
    summary: GRADE_SUMMARY[grade],
    detail,
    luckIndex: Math.min(97, Math.max(23, 62 + score * 5)),
    lucky: LUCKY[iljin.stemElement] ?? LUCKY['토']!,
  };
}

/** 오늘의 운세를 계산하고 기록(FortuneRecord)으로 저장해 돌려준다 — 멱등. */
export function saveTodaysFortune(saju: SajuResult, date: string): FortuneRecord {
  const f = dailyFortune(saju, date);
  const rec: FortuneRecord = { v: 1, date, iljin: f.iljin.korean, grade: f.grade, summary: f.summary };
  saveFortune(rec);
  return rec;
}

import { getTenGod } from 'manseryeok';
import type { HeavenlyStem } from 'manseryeok';
import {
  COMPAT_GRADE_TEXT,
  COMPAT_RELATION_TEXT,
  STEM_RELATION_TEXT,
  type StemRelation,
} from '../../content/compat.ts';
import { ELEMENT_GENERATES, type ElementKey, type TenGodKey } from '../../content/meta.ts';
import { interpretSaju } from '../../lib/interpret.ts';
import { branchRelation } from '../../lib/relations.ts';
import type { SajuResult } from '../../lib/engine.ts';
import type { Grade } from '../../lib/types.ts';

export interface CompatResult {
  score: number; // 0~100
  grade: Grade;
  summary: string;
  detail: string[];
}

function stemRelation(a: string, b: string): StemRelation {
  if (a === b) return '비화';
  if (ELEMENT_GENERATES[a as ElementKey] === b || ELEMENT_GENERATES[b as ElementKey] === a) return '상생';
  return '상극';
}

function toGrade(score: number): Grade {
  if (score >= 80) return '대길';
  if (score >= 65) return '길';
  if (score >= 45) return '평';
  if (score >= 30) return '흉';
  return '대흉';
}

const RELATION_SCORE: Record<string, number> = {
  육합: 18, 삼합: 14, 충: -18, 형: -10, 해: -10, 원진: -10, 파: -6,
};

/** 두 사주의 궁합 — 일간 오행 관계 + 일지 지지 관계 + 십신 역할 + 오행 보완 */
export function compatScore(a: SajuResult, b: SajuResult): CompatResult {
  let score = 50;
  const detail: string[] = [];

  // 1) 일간 오행 관계
  const rel = stemRelation(a.dayMaster.element, b.dayMaster.element);
  score += rel === '상생' ? 15 : rel === '비화' ? 8 : -10;
  detail.push(STEM_RELATION_TEXT[rel]);

  // 2) 일지 지지 관계 (배우자궁)
  const aBranch = a.pillars.day.korean.charAt(1);
  const bBranch = b.pillars.day.korean.charAt(1);
  const branchRel = branchRelation(aBranch, bBranch);
  if (branchRel) {
    score += RELATION_SCORE[branchRel] ?? 0;
    detail.push(COMPAT_RELATION_TEXT[branchRel]);
  }

  // 3) 상대 일간이 내 일간에 어떤 십신인지
  const bRole = getTenGod(a.dayMaster.korean as HeavenlyStem, b.dayMaster.korean as HeavenlyStem) as TenGodKey;
  if (['정관', '정재', '정인', '식신'].includes(bRole)) {
    score += 8;
    detail.push(`상대의 본질이 나에게 ${bRole}의 기운 — 전통 궁합에서 좋게 보는 관계입니다.`);
  } else if (['겁재', '상관', '편관'].includes(bRole)) {
    score -= 5;
    detail.push(`상대의 본질이 나에게 ${bRole}의 기운 — 서로 자극이 되는 관계로 조율이 필요합니다.`);
  } else {
    detail.push(`상대의 본질이 나에게 ${bRole}의 기운입니다.`);
  }

  // 4) 오행 보완 — 내게 없는 오행을 상대가 가졌는가
  const ra = interpretSaju(a);
  const rb = interpretSaju(b);
  const covered = ra.lacking.filter((e) => (rb.elementCounts.find((x) => x.element === e)?.count ?? 0) > 0);
  if (covered.length > 0) {
    score += covered.length * 6;
    detail.push(`상대의 사주가 내게 부족한 ${covered.join('·')}의 기운을 채워줍니다 — 보완형 인연.`);
  } else if (ra.lacking.length > 0) {
    detail.push('내게 부족한 오행을 상대도 비슷하게 비워 두었습니다 — 비슷한 빈틈을 공유합니다.');
  }
  if (a.dayMaster.element === rb.dominant || b.dayMaster.element === ra.dominant) {
    score += 5;
    detail.push('한쪽의 가장 강한 오행이 상대의 일간과 같은 결 — 자연스럽게 끌리는 흐름이 있습니다.');
  }

  const final = Math.max(5, Math.min(98, Math.round(score)));
  const grade = toGrade(final);
  return { score: final, grade, summary: COMPAT_GRADE_TEXT[grade], detail };
}

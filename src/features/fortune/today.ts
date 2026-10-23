import { getBranchTenGod, getEarthlyBranchElement, getTenGod } from 'manseryeok';
import type { EarthlyBranch, HeavenlyStem } from 'manseryeok';
import { DAY_GOD_TEXT, GRADE_SUMMARY, LUCKY, RELATION_TEXT } from '../../content/fortune.ts';
import { STEM_HAP } from '../../content/compat.ts';
import { branchRelation, type BranchRelation } from '../../lib/relations.ts';
import {
  ELEMENT_CONTROLS,
  ELEMENT_GENERATES,
  type ElementKey,
  type TenGodKey,
} from '../../content/meta.ts';
import { iljinOf, type Iljin, type SajuResult } from '../../lib/engine.ts';
import { saveFortune } from '../../lib/storage.ts';
import { personalBalance, type LuckFavor } from '../report/report.ts';
import { pairOf } from '../compat/compat.ts';
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
  /** 일진 지지 오행이 내 용신·기신과 만나는 개인 판정 (심화 리포트와 같은 모델) */
  favor: LuckFavor;
  /** 일진 천간이 내 일간과 이루는 천간합 이름 — 합이 없으면 null */
  stemHap: string | null;
  /** 행운 색·방향·아이템 (일진 오행 기준) */
  lucky: { color: string; direction: string; item: string };
  /** 오늘 기운이 잘 통하는 시간대 — 일진 지지와 삼합되는 두 시진 */
  luckyHours: { branch: string; hours: string }[];
}

/** 시진별 시간대 */
const BRANCH_HOURS: Record<string, string> = {
  子: '밤 11시~1시', 丑: '새벽 1~3시', 寅: '새벽 3~5시', 卯: '새벽 5~7시',
  辰: '아침 7~9시', 巳: '오전 9~11시', 午: '낮 11시~1시', 未: '오후 1~3시',
  申: '오후 3~5시', 酉: '저녁 5~7시', 戌: '저녁 7~9시', 亥: '밤 9~11시',
};

/** 삼합 그룹 — 일진 지지와 호흡이 맞는 시간대를 찾는 기준 */
const SAMHAP_GROUPS = [
  ['申', '子', '辰'], ['巳', '酉', '丑'], ['寅', '午', '戌'], ['亥', '卯', '未'],
];

const BRANCH_KOREAN: Record<string, string> = {
  子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사',
  午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해',
};

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

  // 개인화 — 일진의 기운이 내 용신/기신과 만나는지 (심화 리포트와 같은 판정 모델)
  const bal = personalBalance(saju);
  const iljinBranchEl = getEarthlyBranchElement(iljin.branch as EarthlyBranch) as ElementKey;
  const favor: LuckFavor = iljinBranchEl === bal.yongsin
    ? '용신운'
    : bal.gisin.includes(iljinBranchEl)
      ? '기신운'
      : '중립운';
  // 일간합 — 일진 천간이 내 일간과 손을 잡는 날
  const stemHapHit = pairOf(STEM_HAP, iljin.stemHanja, saju.dayMaster.hanja);

  const score =
    GOD_SCORE[stemGod] +
    GOD_SCORE[branchGod] +
    (relation ? RELATION_SCORE[relation] : 0) +
    (el?.score ?? 0) +
    (favor === '용신운' ? 1 : favor === '기신운' ? -1 : 0) +
    (stemHapHit ? 1 : 0);
  const grade = scoreToGrade(score);

  const detail = [
    `오늘의 일진 천간은 ${stemGod} — ${DAY_GOD_TEXT[stemGod].stem}`,
    `일진 지지는 ${branchGod} — ${DAY_GOD_TEXT[branchGod].branch}`,
    ...(relation ? [RELATION_TEXT[relation]] : []),
    ...(el ? [el.text] : []),
    ...(favor === '용신운'
      ? [`오늘의 지지 오행 ${iljinBranchEl}은 내 사주의 용신 — 하루 종일 돕는 바람이 붑니다. 미뤄둔 결정·도전을 오늘로 옮기세요.`]
      : []),
    ...(favor === '기신운'
      ? [`오늘의 지지 오행 ${iljinBranchEl}은 내 사주의 기신 — 욕심이 앞서거나 힘이 빠지기 쉬운 날. 무리한 확장보다 지키는 운영이 맞습니다.`]
      : []),
    ...(stemHapHit
      ? [`오늘의 천간 ${iljin.stem}이 내 일간과 ${stemHapHit.name}(${stemHapHit.hanja})을 이룹니다 — 마음이 끌리고 인연이 닿는 날입니다.`]
      : []),
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
    favor,
    stemHap: stemHapHit?.name ?? null,
    lucky: LUCKY[iljin.stemElement] ?? LUCKY['토']!,
    luckyHours: (SAMHAP_GROUPS.find((g) => g.includes(iljin.branchHanja)) ?? [])
      .filter((b) => b !== iljin.branchHanja)
      .map((b) => ({ branch: BRANCH_KOREAN[b] ?? b, hours: BRANCH_HOURS[b] ?? '' })),
  };
}

/** 오늘의 운세를 계산하고 기록(FortuneRecord)으로 저장해 돌려준다 — 멱등. */
export function saveTodaysFortune(saju: SajuResult, date: string): FortuneRecord {
  const f = dailyFortune(saju, date);
  const rec: FortuneRecord = { v: 1, date, iljin: f.iljin.korean, grade: f.grade, summary: f.summary };
  saveFortune(rec);
  return rec;
}

import { getTenGod } from 'manseryeok';
import type { HeavenlyStem } from 'manseryeok';
import {
  ADVICE_TEXT,
  BRANCH_ANIMAL,
  COMPAT_GRADE_TEXT,
  COMPAT_RELATION_TEXT,
  DOHWA_CROSS_TEXT,
  ELEMENT_FILL_TEXT,
  FIVE_ELEMENT_COMPLETE,
  ROLE_TEXT,
  SAME_DOMINANT_TEXT,
  SAMHAP_COMPLETE,
  SPOUSE_PALACE_TEXT,
  SPOUSE_STAR_TEXT,
  STEM_CLASH,
  STEM_CLASH_TEXT,
  STEM_HAP,
  STEM_RELATION_TEXT,
  YINYANG_TEXT,
  type StemRelation,
} from '../../content/compat.ts';
import { ELEMENT_GENERATES, TEN_GOD_HANJA, type ElementKey, type TenGodKey } from '../../content/meta.ts';
import { interpretSaju } from '../../lib/interpret.ts';
import { branchRelation } from '../../lib/relations.ts';
import { SAMHAP_GROUPS, samhapGroupOf } from '../../lib/sinsal.ts';
import type { SajuResult } from '../../lib/engine.ts';
import type { Gender, Grade } from '../../lib/types.ts';

interface CompatAspect {
  title: string;
  /** 이 항목이 총점에 준 변화 (기본 50점에서 가감) */
  delta: number;
  lines: string[];
}

export interface CompatResult {
  score: number; // 0~100
  grade: Grade;
  summary: string;
  /** 항목별 해석 섹션 — 일간·배우자궁·십신 역할·오행 보완·참고·조언 */
  aspects: CompatAspect[];
}

export interface CompatOpts {
  nameA?: string;
  nameB?: string;
  /** 성별을 알면 배우자성(남=재성·여=관성)을 정확히 판정 — 모르면 정재·정관 통합 판정 */
  genderA?: Gender;
  genderB?: Gender;
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

const DAY_BRANCH_SCORE: Record<string, number> = {
  육합: 18, 삼합: 14, 충: -18, 형: -10, 해: -10, 원진: -10, 파: -6,
};
const GOOD_ROLES: TenGodKey[] = ['정관', '정재', '정인', '식신'];
const BAD_ROLES: TenGodKey[] = ['겁재', '상관', '편관'];
const FRICTION = ['충', '형', '해', '원진', '파'];

function branchesOf(saju: SajuResult): string[] {
  return [saju.pillars.year, saju.pillars.month, saju.pillars.day, saju.pillars.hour]
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map((p) => p.branchHanja);
}

function pairOf<T extends { stems: [string, string] }>(list: T[], x: string, y: string): T | null {
  return list.find((h) => h.stems.includes(x) && h.stems.includes(y)) ?? null;
}

/** 배우자성 목록 — 남성은 재성(정재>편재), 여성은 관성(정관>편관), 성별 미상이면 정(正)만 */
function spouseStarsFor(g?: Gender): TenGodKey[] {
  if (g === 'male') return ['정재', '편재'];
  if (g === 'female') return ['정관', '편관'];
  return ['정관', '정재'];
}

/**
 * 두 사주의 궁합 — 전통 자평명리 항목을 기본 50점에서 가감하는 설명 가능한 점수.
 * 항목: 일간 천간합·천간충·상생상극·음양 / 일지(배우자궁) 관계 / 십신 상호 역할·배우자성 /
 *       오행 상호 보완·용신 / 합쳐 완성하는 삼합 / 연지(띠)·도화 교차.
 */
export function compatScore(a: SajuResult, b: SajuResult, opts: CompatOpts = {}): CompatResult {
  const nameA = opts.nameA ?? '나';
  const nameB = opts.nameB ?? '상대';
  const ra = interpretSaju(a);
  const rb = interpretSaju(b);

  const ah = a.dayMaster.hanja;
  const bh = b.dayMaster.hanja;
  const hap = pairOf(STEM_HAP, ah, bh);
  const clash = pairOf(STEM_CLASH, ah, bh);
  const dayBranchRel = branchRelation(a.pillars.day.korean.charAt(1), b.pillars.day.korean.charAt(1));

  let score = 50;
  const aspects: CompatAspect[] = [];
  const push = (title: string, entries: { line: string; delta: number }[]) => {
    const delta = entries.reduce((s, e) => s + e.delta, 0);
    score += delta;
    aspects.push({ title, delta, lines: entries.map((e) => e.line) });
  };

  // ── 1) 일간 — 천간합 > 천간충 > 상생상극비화 + 음양 ──
  {
    const e: { line: string; delta: number }[] = [];
    e.push({
      line: `「${nameA}」 ${ah}(${a.dayMaster.element}) ${ra.dayMaster.title ? `「${ra.dayMaster.title}」` : ''} × 「${nameB}」 ${bh}(${b.dayMaster.element}) ${rb.dayMaster.title ? `「${rb.dayMaster.title}」` : ''}`.replace(/\s+/g, ' ').trim(),
      delta: 0,
    });
    if (hap) {
      e.push({ line: hap.text, delta: 20 });
    } else if (clash) {
      e.push({ line: STEM_CLASH_TEXT.replace('{name}', clash.name).replace('{hanja}', clash.hanja), delta: -10 });
    } else {
      const rel = stemRelation(a.dayMaster.element, b.dayMaster.element);
      e.push({ line: STEM_RELATION_TEXT[rel], delta: rel === '상생' ? 12 : rel === '비화' ? 6 : -8 });
      e.push({ line: a.dayMaster.yinYang !== b.dayMaster.yinYang ? YINYANG_TEXT.mixed : YINYANG_TEXT.same, delta: a.dayMaster.yinYang !== b.dayMaster.yinYang ? 4 : 0 });
    }
    push('일간 — 두 분의 본질이 만나는 결', e);
  }

  // ── 2) 배우자궁(일지) — 육합·삼합·충형파해 + 각자의 배우자상 ──
  {
    const e: { line: string; delta: number }[] = [];
    if (dayBranchRel) {
      e.push({ line: COMPAT_RELATION_TEXT[dayBranchRel], delta: DAY_BRANCH_SCORE[dayBranchRel] ?? 0 });
    } else {
      e.push({ line: '두 분의 배우자궁(일지) 사이에 뚜렷한 합·충이 없습니다 — 무난하게 스며드는 결입니다.', delta: 0 });
    }
    for (const [name, saju] of [[nameA, a], [nameB, b]] as const) {
      const god = saju.pillars.day.tenGodBranch as TenGodKey;
      if (SPOUSE_PALACE_TEXT[god]) {
        e.push({ line: `「${name}」님의 배우자궁에는 ${god}(${TEN_GOD_HANJA[god]})이 앉아 있습니다 — ${SPOUSE_PALACE_TEXT[god]}`, delta: 0 });
      }
    }
    push('배우자궁 — 일지의 인연', e);
  }

  // ── 3) 십신 상호 역할 + 배우자성 ──
  {
    const e: { line: string; delta: number }[] = [];
    const roleOfB = getTenGod(a.dayMaster.korean as HeavenlyStem, b.dayMaster.korean as HeavenlyStem) as TenGodKey;
    const roleOfA = getTenGod(b.dayMaster.korean as HeavenlyStem, a.dayMaster.korean as HeavenlyStem) as TenGodKey;
    const roleDelta = (r: TenGodKey) => (GOOD_ROLES.includes(r) ? 6 : BAD_ROLES.includes(r) ? -5 : 0);
    e.push({ line: `「${nameB}」님은 「${nameA}」님에게 ${roleOfB}(${TEN_GOD_HANJA[roleOfB]})의 기운입니다 — ${ROLE_TEXT[roleOfB]}`, delta: roleDelta(roleOfB) });
    e.push({ line: `「${nameA}」님은 「${nameB}」님에게 ${roleOfA}(${TEN_GOD_HANJA[roleOfA]})의 기운입니다 — ${ROLE_TEXT[roleOfA]}`, delta: roleDelta(roleOfA) });

    const spouse = (me: string, meGender: Gender | undefined, partner: string, role: TenGodKey) => {
      if (!spouseStarsFor(meGender).includes(role)) return null;
      if (!meGender) return { line: SPOUSE_STAR_TEXT.unknown, delta: 6 };
      const tpl = role.startsWith('정') ? SPOUSE_STAR_TEXT.정 : SPOUSE_STAR_TEXT.편;
      const line = tpl
        .replace('{other}', partner).replace('{me}', me)
        .replace('{god}', role).replace('{hanja}', TEN_GOD_HANJA[role]);
      return { line, delta: role.startsWith('정') ? 8 : 4 };
    };
    for (const s of [spouse(nameA, opts.genderA, nameB, roleOfB), spouse(nameB, opts.genderB, nameA, roleOfA)]) {
      if (s) e.push(s);
    }
    push('서로에게 어떤 존재 — 십신 역할', e);
  }

  // ── 4) 오행 상호 보완 + 용신 + 함께 완성하는 삼합 ──
  {
    const e: { line: string; delta: number }[] = [];
    const cover = (mine: typeof ra, other: typeof rb, me: string, partner: string) => {
      for (const el of mine.lacking) {
        const c = other.elementCounts.find((x) => x.element === el)?.count ?? 0;
        if (c > 0) e.push({ line: `「${partner}」님의 사주가 「${me}」님에게 비어 있는 ${ELEMENT_FILL_TEXT[el]}`, delta: 5 });
      }
      if (mine.lacking.includes(other.dominant)) {
        e.push({ line: `「${partner}」님의 가장 강한 기운(${other.dominant})이 「${me}」님의 빈 자리를 정확히 채웁니다 — 전통 궁합에서 용신을 채워주는 상대로 봅니다.`, delta: 8 });
      }
    };
    cover(ra, rb, nameA, nameB);
    cover(rb, ra, nameB, nameA);

    const union = new Set([
      ...ra.elementCounts.filter((x) => x.count > 0).map((x) => x.element),
      ...rb.elementCounts.filter((x) => x.count > 0).map((x) => x.element),
    ]);
    if (union.size === 5 && (ra.lacking.length > 0 || rb.lacking.length > 0)) {
      e.push({ line: FIVE_ELEMENT_COMPLETE, delta: 4 });
    }

    const aB = new Set(branchesOf(a));
    const bB = new Set(branchesOf(b));
    for (const g of SAMHAP_GROUPS) {
      const inA = new Set(g.branches.filter((x) => aB.has(x)));
      const inB = new Set(g.branches.filter((x) => bB.has(x)));
      const unionB = new Set([...inA, ...inB]);
      if (unionB.size === 3 && inA.size < 3 && inB.size < 3) {
        const s = SAMHAP_COMPLETE[g.element];
        if (s) e.push({ line: `${s.name} — ${s.text}`, delta: 8 });
        break;
      }
    }
    if (ra.dominant === rb.dominant) e.push({ line: SAME_DOMINANT_TEXT, delta: 0 });
    if (e.length === 0) {
      e.push({ line: '서로의 오행이 크게 부딪히거나 비어 있는 곳이 없는 결 — 다른 강점으로 채워가는 관계입니다.', delta: 0 });
    }
    push('기운의 보완 — 오행과 삼합', e);
  }

  // ── 5) 참고 — 띠(연지)·도화 교차 ──
  {
    const e: { line: string; delta: number }[] = [];
    const animA = BRANCH_ANIMAL[a.pillars.year.korean.charAt(1)] ?? '';
    const animB = BRANCH_ANIMAL[b.pillars.year.korean.charAt(1)] ?? '';
    const yearRel = branchRelation(a.pillars.year.korean.charAt(1), b.pillars.year.korean.charAt(1));
    if (yearRel) {
      const d = (DAY_BRANCH_SCORE[yearRel] ?? 0);
      e.push({
        line: `띠로 보면 ${animA}띠 × ${animB}띠 — ${yearRel}의 자리입니다. (민속에서 보는 항목이라 참고 정도로 봅니다.)`,
        delta: d > 0 ? 4 : -4,
      });
    } else {
      e.push({ line: `띠로 보면 ${animA}띠 × ${animB}띠 — 뚜렷한 합·충이 없는 무난한 조합입니다.`, delta: 0 });
    }
    const dohwaA = samhapGroupOf(a.pillars.day.branchHanja)?.dohwa;
    const dohwaB = samhapGroupOf(b.pillars.day.branchHanja)?.dohwa;
    if (dohwaA && branchesOf(b).includes(dohwaA)) e.push({ line: DOHWA_CROSS_TEXT.replace('{name}', nameB), delta: 4 });
    if (dohwaB && branchesOf(a).includes(dohwaB)) e.push({ line: DOHWA_CROSS_TEXT.replace('{name}', nameA), delta: 4 });
    push('참고 — 띠와 끌림', e);
  }

  // ── 6) 함께할 때 조언 ──
  {
    const e: { line: string; delta: number }[] = [];
    if (clash || (!hap && stemRelation(a.dayMaster.element, b.dayMaster.element) === '상극')) {
      e.push({ line: ADVICE_TEXT.stemClash, delta: 0 });
    }
    if (dayBranchRel && FRICTION.includes(dayBranchRel)) {
      e.push({ line: ADVICE_TEXT.branchFriction, delta: 0 });
    }
    const sharedLacking = ra.lacking.filter((x) => rb.lacking.includes(x));
    if (sharedLacking.length > 0) {
      e.push({ line: `${sharedLacking.join('·')} 기운이 둘 다 비어 있습니다 — ${ADVICE_TEXT.sharedLacking}`, delta: 0 });
    }
    if (e.length === 0) e.push({ line: ADVICE_TEXT.clean, delta: 0 });
    push('함께할 때 조언', e);
  }

  const final = Math.max(5, Math.min(98, Math.round(score)));
  const grade = toGrade(final);
  return { score: final, grade, summary: COMPAT_GRADE_TEXT[grade], aspects };
}

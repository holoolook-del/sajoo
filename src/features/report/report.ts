/**
 * 심화 리포트 — 만세력 계산물(4주·십신·대운·공망)에 명리 해석층을 얹는다.
 * 신강신약 가중치: 천간1·지지2·월지3 (월지=계절이므로 최대 비중), 일간 자리는 제외.
 * 용신: 억부용신 근사 — 신약이면 나를 생하는 오행, 신강이면 설기(식상)→극제(관성)→재성 순.
 */
import {
  getBranchTenGod,
  getEarthlyBranchElement,
  getTenGod,
  type EarthlyBranch,
  type HeavenlyStem,
} from 'manseryeok';
import {
  DEUKRYEONG_TEXT,
  GYEOKGUK_TEXT,
  LUCK_FAVOR_TEXT,
  LUCK_GOD_TEXT,
  POSITION_MEANING,
  RELATION_KIND_TEXT,
  ROOT_TEXT,
  STAGE_NAMES,
  STAGE_TEXT,
  STRENGTH_TEXT,
  VOID_GOD_TEXT,
  YONGSIN_TIPS,
  type StageName,
} from '../../content/report.ts';
import {
  ELEMENT_CONTROLS,
  ELEMENT_GENERATES,
  ELEMENT_HANJA,
  ELEMENT_KEYS,
  type ElementKey,
  type TenGodKey,
} from '../../content/meta.ts';
import { yearPillarOf, type SajuPillar, type SajuResult } from '../../lib/engine.ts';
import { interpretSaju } from '../../lib/interpret.ts';
import { branchRelation } from '../../lib/relations.ts';
import { findSinsal, type Sinsal } from '../../lib/sinsal.ts';
import type { BranchRelation } from '../../content/fortune.ts';
import type { Profile } from '../../lib/types.ts';
import { buildLuckView } from '../luck/luck.ts';

const SUPPORT_GODS: TenGodKey[] = ['비견', '겁재', '정인', '편인'];

const GOD_GROUP: Record<TenGodKey, string> = {
  비견: '비겁', 겁재: '비겁',
  식신: '식상', 상관: '식상',
  편재: '재성', 정재: '재성',
  편관: '관성', 정관: '관성',
  편인: '인성', 정인: '인성',
};

export type Verdict = '신강' | '중화' | '신약';

export interface ReportRelation {
  pair: string; // '연지×일지'
  kind: BranchRelation;
  text: string;
  positionText: string; // 두 자리가 각각 덮는 영역
}

export interface ReportVoid {
  where: string; // '연지' 등
  branch: string;
  god: TenGodKey;
  text: string;
}

/** 운의 오행이 내 사주에 유리한지 — 용신(필요한 기운) / 기신(불균형을 키우는 기운) / 중립 */
export type LuckFavor = '용신운' | '기신운' | '중립운';

export interface LuckChapter {
  directionLabel: string;
  startAge: number;
  list: { age: number; korean: string; hanja: string; stemGod: TenGodKey; current: boolean }[];
  current: { age: number; korean: string; hanja: string; stemGod: TenGodKey; branchGod: TenGodKey; stemText: string; branchText: string; favor: LuckFavor; favorText: string } | null;
  next: { age: number; korean: string; hanja: string; stemGod: TenGodKey; stemText: string } | null;
}

export interface YearLuck {
  year: number;
  korean: string;
  hanja: string;
  stemGod: TenGodKey;
  branchGod: TenGodKey;
  text: string;
  favor: LuckFavor;
  favorText: string;
}

/** 십이운성 — 지지 자리별 일간의 인생 단계 기운 */
export interface StageEntry {
  where: string;
  branch: string; // 한글 지지
  stage: StageName;
  stageDesc: string;
  text: string;
}

export interface DeepReport {
  headline: string; // 한 줄 총평 제목
  summary: string; // 종합 총평 단락
  gyeokguk: { name: string; god: TenGodKey; text: string };
  deukryeong: { verdict: '득령' | '상령' | '실령'; text: string };
  rooted: { count: number; text: string };
  strength: { verdict: Verdict; support: number; drain: number; title: string; text: string };
  yongsin: {
    element: ElementKey;
    label: string;
    reason: string;
    color: string;
    direction: string;
    season: string;
    items: string;
    text: string;
  };
  missingGodGroups: { group: string; text: string }[];
  stages: StageEntry[]; // 십이운성 — 지지 자리별
  relations: ReportRelation[];
  voids: ReportVoid[];
  sinsal: Sinsal[];
  daewoon: LuckChapter | null;
  seun: YearLuck;
  nextYear: YearLuck;
  advice: string[];
}

/** 오행 E가 나를 생하는 관계(인성 오행)인지 — ELEMENT_GENERATES[E] === my */
function generatingElement(my: ElementKey): ElementKey {
  return ELEMENT_KEYS.find((e) => ELEMENT_GENERATES[e] === my) ?? my;
}
/** 오행 E가 나를 극하는 관계(관성 오행) — ELEMENT_CONTROLS[E] === my */
function controllingElement(my: ElementKey): ElementKey {
  return ELEMENT_KEYS.find((e) => ELEMENT_CONTROLS[e] === my) ?? my;
}

/** 신강·중화·신약 — 비겁·인성의 가중 합 ÷ 전체 가중 합 */
function calcStrength(saju: SajuResult): { verdict: Verdict; support: number; drain: number } {
  const positions = [saju.pillars.year, saju.pillars.month, saju.pillars.day, saju.pillars.hour]
    .filter((p): p is NonNullable<typeof p> => p !== null);
  let support = 0;
  let drain = 0;
  positions.forEach((p, i) => {
    // 천간 1, 지지 2, 월지(계절)는 3
    const entries: [string, number][] = [
      [p.tenGodStem, 1],
      [p.tenGodBranch, i === 1 ? 3 : 2],
    ];
    for (const [god, w] of entries) {
      if (god === '일간') continue;
      if (SUPPORT_GODS.includes(god as TenGodKey)) support += w;
      else drain += w;
    }
  });
  const ratio = support / (support + drain || 1);
  return { verdict: ratio >= 0.58 ? '신강' : ratio <= 0.42 ? '신약' : '중화', support, drain };
}

/** 용신 오행과 이유 문장 */
function pickYongsin(
  saju: SajuResult,
  verdict: Verdict,
): { element: ElementKey; reason: string } {
  const my = saju.dayMaster.element as ElementKey;
  const instar = generatingElement(my); // 나를 생하는 (인성)
  const output = ELEMENT_GENERATES[my]; // 내가 생하는 (식상)
  const wealth = ELEMENT_CONTROLS[my]; // 내가 극하는 (재성)
  const power = controllingElement(my); // 나를 극하는 (관성)

  const counts = new Map<ElementKey, number>(ELEMENT_KEYS.map((e) => [e, 0]));
  for (const p of [saju.pillars.year, saju.pillars.month, saju.pillars.day, saju.pillars.hour]) {
    if (!p) continue;
    counts.set(p.stemElement as ElementKey, (counts.get(p.stemElement as ElementKey) ?? 0) + 1);
    counts.set(p.branchElement as ElementKey, (counts.get(p.branchElement as ElementKey) ?? 0) + 1);
  }
  const count = (e: ElementKey) => counts.get(e) ?? 0;

  if (verdict === '신약') {
    return {
      element: instar,
      reason: `밖으로 새는 기운이 큰 사주라, 나를 채워주는 ${instar}의 기운이 버팀목입니다`,
    };
  }
  if (verdict === '신강') {
    const picked = count(output) > 0 ? output : count(power) > 0 ? power : wealth;
    const route =
      picked === output ? '재능으로 기운을 흘려보내는' : picked === power ? '규율로 기운을 다스리는' : '재물 활동으로 기운을 쓰는';
    return {
      element: picked,
      reason: `넘치는 힘을 설기해야 하는 사주라, ${route} ${picked}의 기운이 균형을 잡습니다`,
    };
  }
  // 중화 — 비어 있는 오행을 보완, 없으면 가장 약한 오행
  const zero = ELEMENT_KEYS.filter((e) => count(e) === 0);
  const picked = zero[0] ?? [...ELEMENT_KEYS].sort((a, b) => count(a) - count(b))[0]!;
  return {
    element: picked,
    reason: `균형이 잡힌 사주라, 가장 비어 있는 ${picked}의 기운을 채우면 흐름이 더 부드러워집니다`,
  };
}

const BRANCH_ORDER = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
/** 지장간 정기(본기) — 지지 안에 깃든 주인 천간. 격국 판정의 기준. */
const BRANCH_MAIN_STEM_KOR: Record<string, string> = {
  자: '계', 축: '기', 인: '갑', 묘: '을', 진: '무', 사: '병',
  오: '정', 미: '기', 신: '경', 유: '신', 술: '무', 해: '임',
};
const YANG_STEMS = ['갑', '병', '무', '경', '임'];
/** 양간은 지지 순행·음간은 역행 — 일간별 장생(씨앗 자리) 시작 지지 */
const JANGSAENG: Record<string, string> = {
  갑: '해', 을: '오', 병: '인', 정: '유', 무: '인',
  기: '유', 경: '사', 신: '자', 임: '신', 계: '묘',
};

/** 일간이 지지 자리에서 맞는 십이운성 단계 */
function stageOf(dayStemKorean: string, branchKorean: string): StageName {
  const start = BRANCH_ORDER.indexOf(JANGSAENG[dayStemKorean] ?? '자');
  const at = BRANCH_ORDER.indexOf(branchKorean);
  if (start < 0 || at < 0) return '장생';
  const yang = YANG_STEMS.includes(dayStemKorean);
  return STAGE_NAMES[(((yang ? at - start : start - at) % 12) + 12) % 12] ?? '장생';
}

/** 격국 — 월지 정기(지장간 본기)의 십신 */
function calcGyeokguk(saju: SajuResult): DeepReport['gyeokguk'] {
  const monthBranch = saju.pillars.month.korean.charAt(1);
  const mainStem = BRANCH_MAIN_STEM_KOR[monthBranch];
  const god = (mainStem ? getTenGod(saju.dayMaster.korean as HeavenlyStem, mainStem as HeavenlyStem) : saju.pillars.month.tenGodBranch) as TenGodKey;
  const g = GYEOKGUK_TEXT[god];
  return { name: g.name, god, text: g.text };
}

/** 득령 — 일간이 월지(계절)의 힘을 받는가 */
function calcDeukryeong(saju: SajuResult): DeepReport['deukryeong'] {
  const monthEl = saju.pillars.month.branchElement as ElementKey;
  const my = saju.dayMaster.element as ElementKey;
  const verdict = monthEl === my ? '득령' : ELEMENT_GENERATES[monthEl] === my ? '상령' : '실령';
  return { verdict, text: DEUKRYEONG_TEXT[verdict] };
}

/** 통근 — 지지 중 일간과 같은 오행의 개수 */
function calcRoot(saju: SajuResult): DeepReport['rooted'] {
  const my = saju.dayMaster.element as ElementKey;
  const count = [saju.pillars.year, saju.pillars.month, saju.pillars.day, saju.pillars.hour]
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .filter((p) => p.branchElement === my).length;
  return { count, text: count > 0 ? ROOT_TEXT.rooted : ROOT_TEXT.rootless };
}

/** 십이운성 목록 — 연지·월지·일지·시지 순 */
function calcStages(saju: SajuResult): StageEntry[] {
  const dayStem = saju.dayMaster.korean;
  const out: StageEntry[] = [];
  for (const [where, p] of [
    ['연지', saju.pillars.year], ['월지', saju.pillars.month],
    ['일지', saju.pillars.day], ['시지', saju.pillars.hour],
  ] as const) {
    if (!p) continue;
    const branch = p.korean.charAt(1);
    const stage = stageOf(dayStem, branch);
    const meta = STAGE_TEXT[stage];
    out.push({ where, branch, stage, stageDesc: meta.stage, text: meta.text });
  }
  return out;
}

/** 운의 기운이 내 사주에 유리한지 — 대운·세운은 지지를 주심으로 봄 */
function luckFavor(
  branchKorean: string,
  yongsin: ElementKey,
  verdict: Verdict,
  myEl: ElementKey,
): LuckFavor {
  const branchEl = getEarthlyBranchElement(branchKorean as EarthlyBranch) as ElementKey;
  // 기신 오행 — 판정별 불균형을 키우는 쪽
  const gisin: ElementKey[] =
    verdict === '신약'
      ? [ELEMENT_GENERATES[myEl], ELEMENT_CONTROLS[myEl], controllingElement(myEl)]
      : verdict === '신강'
        ? [generatingElement(myEl), myEl]
        : [];
  if (branchEl === yongsin) return '용신운';
  if (gisin.includes(branchEl)) return '기신운';
  return '중립운';
}

/** 사주 안 지지 관계(合沖刑害 등) — 모든 자리 쌍을 검사 */
function findRelations(saju: SajuResult): ReportRelation[] {
  const positions: { label: string; p: SajuPillar }[] = [];
  for (const [key, label] of [
    ['year', '연지'], ['month', '월지'], ['day', '일지'], ['hour', '시지'],
  ] as const) {
    const p = saju.pillars[key];
    if (p) positions.push({ label, p });
  }

  const found: ReportRelation[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i]!;
      const b = positions[j]!;
      const kind = branchRelation(a.p.korean.charAt(1), b.p.korean.charAt(1));
      if (kind) {
        found.push({
          pair: `${a.label}×${b.label}`,
          kind,
          text: RELATION_KIND_TEXT[kind],
          positionText: `${POSITION_MEANING[a.label]} ↔ ${POSITION_MEANING[b.label]}`,
        });
      }
    }
  }
  return found;
}

/** 공망 지지가 사주 안 글자에 걸린 경우의 십신별 해석 */
function findVoids(saju: SajuResult): ReportVoid[] {
  const voids = new Set(saju.voidBranches);
  const positions: { where: string; p: SajuPillar }[] = [];
  for (const [where, p] of [
    ['연지', saju.pillars.year], ['월지', saju.pillars.month],
    ['일지', saju.pillars.day], ['시지', saju.pillars.hour],
  ] as const) {
    if (p) positions.push({ where, p });
  }

  return positions
    .filter(({ p }) => voids.has(p.korean.charAt(1)))
    .map(({ where, p }) => {
      const god = p.tenGodBranch as TenGodKey;
      return {
        where,
        branch: p.korean.charAt(1),
        god,
        text: VOID_GOD_TEXT[GOD_GROUP[god]] ?? '',
      };
    });
}

function yearLuck(
  dayStemKorean: string,
  year: number,
  yongsin: ElementKey,
  verdict: Verdict,
  myEl: ElementKey,
): YearLuck {
  const p = yearPillarOf(year);
  const stemGod = getTenGod(dayStemKorean as HeavenlyStem, p.korean.charAt(0) as HeavenlyStem) as TenGodKey;
  const branchGod = getBranchTenGod(
    dayStemKorean as HeavenlyStem,
    p.korean.charAt(1) as EarthlyBranch,
  ) as TenGodKey;
  const favor = luckFavor(p.korean.charAt(1), yongsin, verdict, myEl);
  return {
    year,
    korean: p.korean,
    hanja: p.hanja,
    stemGod,
    branchGod,
    text: LUCK_GOD_TEXT[stemGod].year,
    favor,
    favorText: LUCK_FAVOR_TEXT[favor].text,
  };
}

/** 심화 리포트 조립 — 만세력 계산 + 명리 해석 + 시점(오늘) 기반 대운·세운 */
export function buildDeepReport(saju: SajuResult, profile: Profile, today: string): DeepReport {
  const reading = interpretSaju(saju);
  const [y] = today.split('-').map(Number);
  const year = y ?? new Date().getFullYear();

  const { verdict, support, drain } = calcStrength(saju);
  const strengthText = STRENGTH_TEXT[verdict];
  const yongsinPick = pickYongsin(saju, verdict);
  const yongsinTip = YONGSIN_TIPS[yongsinPick.element];
  const myEl = saju.dayMaster.element as ElementKey;

  const gyeokguk = calcGyeokguk(saju);
  const deukryeong = calcDeukryeong(saju);
  const rooted = calcRoot(saju);
  const stages = calcStages(saju);
  const relations = findRelations(saju);
  const voids = findVoids(saju);
  const sinsal = findSinsal(saju);

  // 드러나지 않은 십신 그룹 — 없는 기운의 의미
  const presentGroups = new Set(
    reading.tenGodCounts.map((t) => GOD_GROUP[t.god]),
  );
  const missingGodGroups = (['비겁', '식상', '재성', '관성', '인성'] as const)
    .filter((g) => !presentGroups.has(g))
    .map((group) => ({ group, text: VOID_GOD_TEXT[group] ?? '' }));

  // 대운 — 생시 미입력 등으로 대운이 없으면 null
  const luck = buildLuckView(saju, profile, today);
  const daewoon: LuckChapter | null = luck
    ? (() => {
        const idx = luck.daewoon.findIndex((d) => d.current);
        const cur = idx >= 0 ? luck.daewoon[idx] : undefined;
        const nxt = idx >= 0 ? luck.daewoon[idx + 1] : undefined;
        return {
          directionLabel: luck.directionLabel,
          startAge: luck.startAge,
          list: luck.daewoon,
          current: cur
            ? {
                ...cur,
                stemText: LUCK_GOD_TEXT[cur.stemGod].decade,
                branchText: LUCK_GOD_TEXT[cur.branchGod].decade,
                favor: luckFavor(cur.korean.charAt(1), yongsinPick.element, verdict, myEl),
                favorText: LUCK_FAVOR_TEXT[luckFavor(cur.korean.charAt(1), yongsinPick.element, verdict, myEl)].text,
              }
            : null,
          next: nxt
            ? { ...nxt, stemText: LUCK_GOD_TEXT[nxt.stemGod].decade }
            : null,
        };
      })()
    : null;

  const seun = yearLuck(saju.dayMaster.korean, year, yongsinPick.element, verdict, myEl);
  const nextYear = yearLuck(saju.dayMaster.korean, year + 1, yongsinPick.element, verdict, myEl);

  const headline = `${gyeokguk.name} — ${saju.dayMaster.hanja}(${saju.dayMaster.korean}) ${reading.dayMaster.title}, ${verdict}의 사주`;

  const summary = [
    `일간 ${saju.dayMaster.hanja}(${saju.dayMaster.korean}) — ${reading.dayMaster.nature}의 기운을 타고난 ${verdict} 사주이며, 사주의 격은 ${gyeokguk.name}입니다.`,
    `${deukryeong.text} ${rooted.text}`,
    strengthText.text,
    `오행 분포는 ${reading.dominant} 기운이 가장 강하고${
      reading.lacking.length > 0 ? ` ${reading.lacking.join('·')} 기운이 비어 있어,` : ' 골고루 퍼져 있어,'
    } 균형의 열쇠는 용신 ${yongsinPick.element}(${ELEMENT_HANJA[yongsinPick.element]})에 있습니다 — ${yongsinPick.reason}.`,
    daewoon?.current
      ? `지금은 ${daewoon.current.age}세부터 이어지는 ${daewoon.current.korean}(${daewoon.current.hanja}) 대운의 시기 — ${daewoon.current.stemGod}의 기운이 흐르고, ${year}년은 ${seun.korean}(${seun.hanja})년으로 ${seun.stemGod}의 해입니다.`
      : `${year}년은 ${seun.korean}(${seun.hanja})년으로 ${seun.stemGod}의 해가 펼쳐집니다.`,
  ].join(' ');

  const advice = [
    `기운의 균형 — ${yongsinTip.label}: ${yongsinTip.items}. ${yongsinTip.text}`,
    daewoon?.current
      ? `이 시기의 운 — ${daewoon.current.korean} 대운의 ${daewoon.current.stemGod} 기운: ${LUCK_GOD_TEXT[daewoon.current.stemGod].decade}`
      : null,
    relations.find((r) => ['충', '형', '해', '원진', '파'].includes(r.kind))
      ? `관계의 긴장 — ${relations.find((r) => ['충', '형', '해', '원진', '파'].includes(r.kind))!.pair}의 ${relations.find((r) => ['충', '형', '해', '원진', '파'].includes(r.kind))!.kind} 기운이 있습니다. ${RELATION_KIND_TEXT[relations.find((r) => ['충', '형', '해', '원진', '파'].includes(r.kind))!.kind]}`
      : relations[0]
        ? `관계의 인연 — ${relations[0].pair}의 ${relations[0].kind} 기운이 있습니다. ${relations[0].text}`
        : null,
    `올해를 사는 법 — ${seun.stemGod}의 해: ${LUCK_GOD_TEXT[seun.stemGod].year}`,
  ].filter((a): a is string => a !== null);

  return {
    headline,
    summary,
    gyeokguk,
    deukryeong,
    rooted,
    stages,
    strength: { verdict, support, drain, title: strengthText.title, text: strengthText.text },
    yongsin: { element: yongsinPick.element, reason: yongsinPick.reason, ...yongsinTip },
    missingGodGroups,
    relations,
    voids,
    sinsal,
    daewoon,
    seun,
    nextYear,
    advice,
  };
}


import {
  CONCERN_TEXT,
  DAY_BRANCH_TEXT,
  DAY_MASTER_TEXT,
  ELEMENT_BALANCE,
  ELEMENT_HEALTH,
  TEN_GOD_TEXT,
  type ConcernKey,
  type DayMasterSocial,
} from '../content/interpret.ts';
import { ELEMENT_KEYS, type ElementKey, type TenGodKey } from '../content/meta.ts';
import type { SajuResult } from './engine.ts';

export interface SajuReading {
  dayMaster: {
    hanja: string;
    nature: string;
    title: string;
    keywords: string[];
    text: string;
    social: DayMasterSocial;
  };
  /** 일지(日支) — 겉 일간 뒤의 내면·친밀한 관계 스타일 */
  dayBranch: { hanja: string; nature: string; title: string; inner: string; bond: string; watch: string } | null;
  elementCounts: { element: ElementKey; count: number }[];
  dominant: ElementKey;
  lacking: ElementKey[];
  balanceText: string;
  tenGodCounts: { god: TenGodKey; count: number }[];
  topTenGods: TenGodKey[];
  tenGodTexts: { god: TenGodKey; text: string }[];
  /** 고민별 해석 — 돈·직업·연애·건강·관계·가족 (전통 명리 매핑 기반) */
  concerns: { key: ConcernKey; label: string; text: string }[];
}

/** 도화 — 자·오·묘·유 (매력·인연의 별) */
const DOHWA = ['子', '午', '卯', '酉'];

/** 사주 계산 결과를 풀이문 DB와 조합해 해석을 만든다. */
export function interpretSaju(saju: SajuResult): SajuReading {
  const pillars = [saju.pillars.year, saju.pillars.month, saju.pillars.day, saju.pillars.hour]
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // 오행 분포: 천간+지지 본기 기준
  const elCount = new Map<ElementKey, number>(ELEMENT_KEYS.map((e) => [e, 0]));
  for (const p of pillars) {
    elCount.set(p.stemElement as ElementKey, (elCount.get(p.stemElement as ElementKey) ?? 0) + 1);
    elCount.set(p.branchElement as ElementKey, (elCount.get(p.branchElement as ElementKey) ?? 0) + 1);
  }
  const elementCounts = ELEMENT_KEYS.map((element) => ({ element, count: elCount.get(element) ?? 0 }));
  const dominant = elementCounts.reduce((a, b) => (b.count > a.count ? b : a)).element;
  const lacking = elementCounts.filter((e) => e.count === 0).map((e) => e.element);

  const balanceText = [
    `${dominant}의 기운이 가장 강합니다 — ${ELEMENT_BALANCE[dominant].excess}`,
    ...lacking.map((e) => `${e}의 기운이 비어 있습니다 — ${ELEMENT_BALANCE[e].lacking}`),
  ].join(' ');

  // 십신 분포: 일간 자리(일간 텍스트)는 제외
  const tgCount = new Map<TenGodKey, number>();
  for (const p of pillars) {
    for (const god of [p.tenGodStem, p.tenGodBranch]) {
      if (god === '일간') continue;
      const k = god as TenGodKey;
      tgCount.set(k, (tgCount.get(k) ?? 0) + 1);
    }
  }
  const tenGodCounts = [...tgCount.entries()]
    .map(([god, count]) => ({ god, count }))
    .sort((a, b) => b.count - a.count);
  const max = tenGodCounts[0]?.count ?? 0;
  const topTenGods = tenGodCounts.filter((t) => t.count === max && t.count > 0).map((t) => t.god);
  const tenGodTexts = topTenGods.map((god) => ({ god, text: TEN_GOD_TEXT[god] }));

  // ── 고민별 해석 ──
  const godCount = (gods: TenGodKey[]) => gods.reduce((s, g) => s + (tgCount.get(g) ?? 0), 0);
  const tone = (n: number): 'strong' | 'normal' | 'weak' => (n >= 3 ? 'strong' : n === 0 ? 'weak' : 'normal');

  const dohwaCount = pillars.filter((p) => DOHWA.includes(p.branchHanja)).length;
  const loveTone = dohwaCount >= 2 ? 'strong' : dohwaCount === 1 ? 'normal' : 'weak';

  const concerns: SajuReading['concerns'] = (
    [
      ['money', tone(godCount(['정재', '편재']))],
      ['career', tone(godCount(['정관', '편관']))],
      ['love', loveTone],
      ['relations', tone(godCount(['식신', '상관']))],
      ['family', tone(godCount(['정인', '편인']))],
    ] as [ConcernKey, 'strong' | 'normal' | 'weak'][]
  ).map(([key, t]) => ({ key, label: CONCERN_TEXT[key].label, text: CONCERN_TEXT[key][t] }));

  // 건강은 비어있는 오행으로 개인화 — 없으면 균형 문장
  concerns.splice(3, 0, {
    key: 'health',
    label: CONCERN_TEXT.health.label,
    text:
      lacking.length === 0
        ? CONCERN_TEXT.health.strong
        : lacking
            .slice(0, 2)
            .map((e) => `${e} 기운이 비어 있어 ${ELEMENT_HEALTH[e].organ} 쪽을 챙기면 좋습니다 — ${ELEMENT_HEALTH[e].tip}.`)
            .join(' '),
  });

  const dm = DAY_MASTER_TEXT[saju.dayMaster.hanja];
  return {
    dayMaster: dm
      ? {
          hanja: saju.dayMaster.hanja,
          nature: dm.nature,
          title: dm.title,
          keywords: dm.keywords,
          text: dm.text,
          social: dm.social,
        }
      : {
          hanja: saju.dayMaster.hanja,
          nature: saju.dayMaster.element,
          title: '',
          keywords: [],
          text: '',
          social: { seen: '', good: '', watch: '', bond: '' },
        },
    dayBranch: (() => {
      const hanja = saju.pillars.day.branchHanja;
      const db = DAY_BRANCH_TEXT[hanja];
      return db ? { hanja, ...db } : null;
    })(),
    elementCounts,
    dominant,
    lacking,
    balanceText,
    tenGodCounts,
    topTenGods,
    tenGodTexts,
    concerns,
  };
}

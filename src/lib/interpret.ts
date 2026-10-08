import { DAY_MASTER_TEXT, ELEMENT_BALANCE, TEN_GOD_TEXT } from '../content/interpret.ts';
import { ELEMENT_KEYS, type ElementKey, type TenGodKey } from '../content/meta.ts';
import type { SajuResult } from './engine.ts';

export interface SajuReading {
  dayMaster: { hanja: string; nature: string; text: string };
  elementCounts: { element: ElementKey; count: number }[];
  dominant: ElementKey;
  lacking: ElementKey[];
  balanceText: string;
  tenGodCounts: { god: TenGodKey; count: number }[];
  topTenGods: TenGodKey[];
  tenGodTexts: { god: TenGodKey; text: string }[];
}

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

  const dm = DAY_MASTER_TEXT[saju.dayMaster.hanja];
  return {
    dayMaster: dm
      ? { hanja: saju.dayMaster.hanja, nature: dm.nature, text: dm.text }
      : { hanja: saju.dayMaster.hanja, nature: saju.dayMaster.element, text: '' },
    elementCounts,
    dominant,
    lacking,
    balanceText,
    tenGodCounts,
    topTenGods,
    tenGodTexts,
  };
}

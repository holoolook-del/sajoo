import {
  EARTHLY_BRANCHES,
  EARTHLY_BRANCHES_HANJA,
  HEAVENLY_STEMS,
  HEAVENLY_STEMS_HANJA,
  getBranchTenGod,
  getTenGod,
} from 'manseryeok';
import type { EarthlyBranch, HeavenlyStem } from 'manseryeok';
import type { TenGodKey } from '../../content/meta.ts';
import { monthPillarOf, yearPillarOf, type SajuResult } from '../../lib/engine.ts';
import type { Profile } from '../../lib/types.ts';

function hanjaOf(korean: string): string {
  const s = HEAVENLY_STEMS.indexOf(korean.charAt(0) as HeavenlyStem);
  const b = EARTHLY_BRANCHES.indexOf(korean.charAt(1) as EarthlyBranch);
  return s >= 0 && b >= 0 ? HEAVENLY_STEMS_HANJA[s]! + EARTHLY_BRANCHES_HANJA[b]! : '';
}

function godsOf(dayStem: string, korean: string): { stemGod: TenGodKey; branchGod: TenGodKey } {
  return {
    stemGod: getTenGod(dayStem as HeavenlyStem, korean.charAt(0) as HeavenlyStem) as TenGodKey,
    branchGod: getBranchTenGod(dayStem as HeavenlyStem, korean.charAt(1) as EarthlyBranch) as TenGodKey,
  };
}

export interface LuckView {
  directionLabel: string;
  startAge: number;
  daewoon: {
    age: number; korean: string; hanja: string;
    stemGod: TenGodKey; branchGod: TenGodKey; current: boolean;
  }[];
  seun: { year: number; korean: string; hanja: string; stemGod: TenGodKey; branchGod: TenGodKey };
  wolun: { month: number; korean: string; hanja: string; stemGod: TenGodKey; branchGod: TenGodKey; current: boolean }[];
}

/** 대운·세운·월운 뷰를 만든다. 대운이 없으면(생시 미입력 등) null. */
export function buildLuckView(saju: SajuResult, profile: Profile, today: string): LuckView | null {
  const luck = saju.luckPillars;
  if (!luck) return null;

  const [year, month] = today.split('-').map(Number);
  const myStem = saju.dayMaster.korean;
  // 세는나이 — 만세력 대운수 관법과 같은 나이 기준
  const ageNow = year! - profile.year + 1;

  const daewoon = luck.pillars.map((p) => ({
    age: p.age,
    korean: p.korean,
    hanja: hanjaOf(p.korean),
    ...godsOf(myStem, p.korean),
    current: ageNow >= p.age && ageNow < p.age + 10,
  }));

  const sp = yearPillarOf(year!);
  const seun = { year: year!, ...sp, ...godsOf(myStem, sp.korean) };

  const wolun = Array.from({ length: 12 }, (_, i) => {
    const mp = monthPillarOf(year!, i + 1);
    return {
      month: i + 1,
      ...mp,
      ...godsOf(myStem, mp.korean),
      current: i + 1 === month,
    };
  });

  return {
    directionLabel: luck.forward ? '순행(順行)' : '역행(逆行)',
    startAge: luck.startAge,
    daewoon,
    seun,
    wolun,
  };
}

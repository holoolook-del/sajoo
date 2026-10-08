/**
 * 궁합 초대 링크 — 내 사주 8글자(간지)만 URL로 전달한다.
 * 생년월일은 넣지 않아 프라이버시를 지키고, 받은 사람은 자기 정보만 입력하면 된다.
 * URL 형식: #/compat?with=<base64(JSON {n, p[4]})> — p는 년·월·일·시주 한자 2글자.
 */
import { getBranchTenGod, getTenGod } from 'manseryeok';
import type { EarthlyBranch, HeavenlyStem } from 'manseryeok';
import {
  EARTHLY_BRANCHES,
  EARTHLY_BRANCHES_HANJA,
  HEAVENLY_STEMS,
  HEAVENLY_STEMS_HANJA,
} from 'manseryeok';
import type { SajuPillar, SajuResult } from './engine.ts';

const STEM_EL: Record<string, string> = {
  甲: '목', 乙: '목', 丙: '화', 丁: '화', 戊: '토', 己: '토', 庚: '금', 辛: '금', 壬: '수', 癸: '수',
};
const BR_EL: Record<string, string> = {
  寅: '목', 卯: '목', 巳: '화', 午: '화', 申: '금', 酉: '금', 亥: '수', 子: '수', 丑: '토', 辰: '토', 未: '토', 戌: '토',
};
const STEM_YY: Record<string, string> = { 甲: '양', 丙: '양', 戊: '양', 庚: '양', 壬: '양' };
const BR_YY: Record<string, string> = { 子: '양', 寅: '양', 辰: '양', 午: '양', 申: '양', 戌: '양' };

function koreanStem(hanja: string): string {
  const i = HEAVENLY_STEMS_HANJA.indexOf(hanja as never);
  return i >= 0 ? (HEAVENLY_STEMS[i] as string) : '';
}
function koreanBranch(hanja: string): string {
  const i = EARTHLY_BRANCHES_HANJA.indexOf(hanja as never);
  return i >= 0 ? (EARTHLY_BRANCHES[i] as string) : '';
}

/** 내 사주 + 이름을 초대 링크용 문자열로 인코딩 */
export function encodeInvite(name: string, saju: SajuResult): string {
  const p = [
    saju.pillars.year.hanja,
    saju.pillars.month.hanja,
    saju.pillars.day.hanja,
    saju.pillars.hour?.hanja ?? null,
  ];
  return btoa(unescape(encodeURIComponent(JSON.stringify({ n: name, p }))));
}

/** 링크의 ?with= 파라미터를 디코딩해 이름+간지 배열로 돌려준다 */
export function decodeInvite(param: string | null): { name: string; pillars: (string | null)[] } | null {
  if (!param) return null;
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(param)))) as { n?: unknown; p?: unknown };
    if (typeof d.n !== 'string' || !Array.isArray(d.p)) return null;
    const pillars = d.p.slice(0, 4).map((v) => (typeof v === 'string' && /^[\u4E00-\u9FFF]{2}$/.test(v) ? v : null));
    if (pillars.filter(Boolean).length < 3) return null;
    return { name: d.n.slice(0, 12), pillars };
  } catch {
    return null;
  }
}

/** 간지 한자 쌍 4개로 궁합 계산에 필요한 최소 SajuResult를 복원한다 */
export function sajuFromHanjaPillars(pillars: (string | null)[]): SajuResult | null {
  const [y, m, d, h] = pillars;
  if (!y || !m || !d) return null;

  const dayStemKor = koreanStem(d.charAt(0));
  const dayStemHanja = d.charAt(0);
  if (!dayStemKor) return null;

  const mk = (pair: string, isDay: boolean): SajuPillar | null => {
    const stemHanja = pair.charAt(0);
    const branchHanja = pair.charAt(1);
    const stem = koreanStem(stemHanja);
    const branch = koreanBranch(branchHanja);
    if (!stem || !branch) return null;
    return {
      korean: stem + branch,
      hanja: pair,
      stemHanja,
      branchHanja,
      stemElement: STEM_EL[stemHanja] ?? '',
      branchElement: BR_EL[branchHanja] ?? '',
      stemYinYang: STEM_YY[stemHanja] ? '양' : '음',
      branchYinYang: BR_YY[branchHanja] ? '양' : '음',
      tenGodStem: isDay ? '일간' : (getTenGod(dayStemKor as HeavenlyStem, stem as HeavenlyStem) as string),
      tenGodBranch: getBranchTenGod(dayStemKor as HeavenlyStem, branch as EarthlyBranch) as string,
    };
  };

  const day = mk(d, true);
  const year = mk(y, false);
  const month = mk(m, false);
  const hour = h ? mk(h, false) : null;
  if (!day || !year || !month) return null;

  return {
    pillars: { year, month, day, hour },
    hourIncluded: hour !== null,
    dayMaster: {
      korean: dayStemKor,
      hanja: dayStemHanja,
      element: STEM_EL[dayStemHanja] ?? '',
      yinYang: STEM_YY[dayStemHanja] ? '양' : '음',
    },
    voidBranches: [],
    luckPillars: null,
    solar: { year: 0, month: 0, day: 0 },
    lunar: { year: 0, month: 0, day: 0, isLeapMonth: false },
  };
}

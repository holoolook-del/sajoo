/**
 * 신살(神殺) — 사주 글자 조합으로 판정하는 별자리 같은 길흉 기호.
 * 표준 명리표 기반:
 *   도화살(桃花) — 삼합의 '浴' 자리: 申子辰→酉, 巳酉丑→午, 寅午戌→卯, 亥卯未→子
 *   역마살(驛馬) — 삼합의 '生' 자리: 申子辰→寅, 巳酉丑→亥, 寅午戌→申, 亥卯未→巳
 *   화개살(華蓋) — 삼합의 '墓' 자리: 申子辰→辰, 巳酉丑→丑, 寅午戌→戌, 亥卯未→未
 *   양인(羊刃) — 양간의 帝旺 자리 (甲→卯, 丙→午, 戊→午, 庚→酉, 壬→子)
 *   괴강살(魁罡) — 특정 일주: 庚辰·庚戌·壬辰·戊戌
 * 판정 기준 글자는 일지(日支) — 가장 널리 쓰이는 관법.
 */
import type { SajuResult } from './engine.ts';

export interface Sinsal {
  key: string;
  name: string;
  hanja: string;
  /** 발견된 위치 설명 (예: '일지') */
  where: string;
  text: string;
}

/** 삼합 그룹 — 일지가 속한 삼합에 따라 도화/역마/화개의 글자가 결정됨 */
const SAMHAP: { branches: string[]; dohwa: string; yeokma: string; hwagae: string }[] = [
  { branches: ['申', '子', '辰'], dohwa: '酉', yeokma: '寅', hwagae: '辰' },
  { branches: ['巳', '酉', '丑'], dohwa: '午', yeokma: '亥', hwagae: '丑' },
  { branches: ['寅', '午', '戌'], dohwa: '卯', yeokma: '申', hwagae: '戌' },
  { branches: ['亥', '卯', '未'], dohwa: '子', yeokma: '巳', hwagae: '未' },
];

const YANGIN: Record<string, string> = {
  甲: '卯', 丙: '午', 戊: '午', 庚: '酉', 壬: '子',
};

const GOEGANG = ['庚辰', '庚戌', '壬辰', '戊戌'];

const TEXT: Record<string, string> = {
  dohwa: '매력과 인기의 별. 사람 눈에 잘 띄고 이성운이 활발합니다. 예술·서비스·사람 상대 일에서 빛이 나고, 연애의 시작이 자연스럽습니다.',
  yeokma: '이동과 변화의 별. 여행·이사·직업 변동이 잦을수록 기회가 옵니다. 한 자리에 머물기보다 움직일 때 운이 열리는 타입.',
  hwagae: '정신성과 예술의 별. 고독을 견디는 깊은 사색과 독창적인 재능. 학문·예술·종교·기획 분야와 인연이 깊습니다.',
  yangin: '날카로운 추진력의 별. 결단과 돌파력이 강한 대신 고집·돌발성이 함께 옵니다. 힘을 쓸 방향을 정하면 큰 무기가 됩니다.',
  goegang: '강한 기개의 별. 총명하고 결단이 빠른 대쪽 같은 기질. 극단으로 치닫지 않게 부드러움을 곁들이면 리더 기질이 됩니다.',
};

const WHERE_LABEL: Record<string, string> = {
  year: '연지', month: '월지', day: '일지', hour: '시지',
};

/** 사주에서 발견된 신살 목록 — 같은 신살이 여러 자리에 있으면 첫 자리만 표시 */
export function findSinsal(saju: SajuResult): Sinsal[] {
  const pillars = (['year', 'month', 'day', 'hour'] as const)
    .map((k) => ({ key: k, p: saju.pillars[k] }))
    .filter(
      (e): e is { key: 'year' | 'month' | 'day' | 'hour'; p: NonNullable<typeof e.p> } => e.p !== null,
    );

  const dayBranch = saju.pillars.day.branchHanja;
  const group = SAMHAP.find((g) => g.branches.includes(dayBranch));
  const dayHanja = saju.pillars.day.hanja;
  const found: Sinsal[] = [];

  const addIf = (key: string, name: string, hanja: string, target: string) => {
    const hit = pillars.find((e) => e.p.branchHanja === target);
    if (hit && !found.some((s) => s.key === key)) {
      found.push({ key, name, hanja, where: WHERE_LABEL[hit.key] ?? hit.key, text: TEXT[key] ?? '' });
    }
  };

  if (group) {
    addIf('dohwa', '도화살', '桃花', group.dohwa);
    addIf('yeokma', '역마살', '驛馬', group.yeokma);
    addIf('hwagae', '화개살', '華蓋', group.hwagae);
  }
  const yanginTarget = YANGIN[saju.dayMaster.hanja];
  if (yanginTarget) addIf('yangin', '양인', '羊刃', yanginTarget);
  if (GOEGANG.includes(dayHanja)) {
    found.push({ key: 'goegang', name: '괴강살', hanja: '魁罡', where: '일주', text: TEXT.goegang ?? '' });
  }
  return found;
}

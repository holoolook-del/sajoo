import { describe, expect, it } from 'vitest';
import { calcSaju, type SajuBirthInput } from '../../lib/engine.ts';
import type { Profile } from '../../lib/types.ts';
import { buildDeepReport } from './report.ts';
import { ELEMENT_KEYS } from '../../content/meta.ts';

const birth: SajuBirthInput = {
  year: 1992, month: 10, day: 24, hour: 5, minute: 30,
  calendar: 'solar', isLeapMonth: false, gender: 'male',
};

const profile: Profile = {
  v: 1, name: '테스트', calendar: 'solar', isLeapMonth: false,
  year: 1992, month: 10, day: 24, hour: 5, minute: 30,
  gender: 'male', createdAt: '2026-01-01T00:00:00.000Z',
};

const TODAY = '2026-10-23';

function reportFor(input: SajuBirthInput = birth, prof: Profile = profile, today = TODAY) {
  const r = calcSaju(input);
  if (!r.ok) throw new Error('사주 계산 실패');
  return buildDeepReport(r.data, prof, today);
}

describe('buildDeepReport', () => {
  it('9개장 분량의 리포트 구조를 만든다', () => {
    const r = reportFor();
    expect(r.headline).toContain('癸');
    expect(r.summary.length).toBeGreaterThan(200);
    expect(r.strength.text.length).toBeGreaterThan(50);
    expect(r.yongsin.label).toBeTruthy();
    expect(r.advice.length).toBeGreaterThanOrEqual(3);
  });

  it('신강신약은 세 판정 중 하나이고 가중 합이 양수다', () => {
    const r = reportFor();
    expect(['신강', '중화', '신약']).toContain(r.strength.verdict);
    // 천간4 + 지지(2+3+2+2) - 일간 제외 = 12 + 얕은 뿌리 보정 0.5 (연지 신금 속 임수)
    expect(r.strength.support + r.strength.drain).toBe(12.5);
  });

  it('용신은 유효한 오행이고 판정에 맞는 근거를 준다', () => {
    const r = reportFor();
    expect(ELEMENT_KEYS).toContain(r.yongsin.element);
    expect(r.yongsin.reason).toContain(r.yongsin.element);
    expect(r.yongsin.color).toBeTruthy();
    expect(r.yongsin.items).toBeTruthy();
  });

  it('지지 관계·공망 결과가 유효한 형식이다', () => {
    const r = reportFor();
    for (const rel of r.relations) {
      expect(['육합', '삼합', '충', '형', '해', '원진', '파']).toContain(rel.kind);
      expect(rel.pair).toMatch(/지×.지/);
    }
    for (const v of r.voids) {
      expect(v.god).toBeTruthy();
      expect(v.text.length).toBeGreaterThan(10);
    }
  });

  it('대운에서 현재 시기의 대운을 찾아 해석을 붙인다', () => {
    const r = reportFor();
    expect(r.daewoon).not.toBeNull();
    // 1992년생·세는나이 기준 2026년 = 35세 → 35세 대운이 current
    const cur = r.daewoon!.current;
    expect(cur?.age).toBe(35);
    expect(cur?.stemText.length).toBeGreaterThan(30);
    expect(r.daewoon!.list.length).toBeGreaterThan(5);
    // 다음 대운이 있으면 시작 나이가 현재+10
    if (r.daewoon!.next) expect(r.daewoon!.next!.age).toBe(cur!.age + 10);
  });

  it('세운은 해당 연도·내년 두 개의 해석을 준다', () => {
    const r = reportFor();
    expect(r.seun.year).toBe(2026);
    expect(r.seun.korean).toBe('병오'); // 2026년 세운
    expect(r.nextYear.year).toBe(2027);
    expect(r.seun.text).toContain('해');
    expect(r.seun.stemGod).toBeTruthy();
    expect(r.seun.branchGod).toBeTruthy();
  });

  it('생시가 없어도 리포트를 만든다 — 시주 자리만 비운다', () => {
    const noHour = reportFor({ ...birth, hour: null, minute: null }, { ...profile, hour: null, minute: null });
    expect(noHour.summary.length).toBeGreaterThan(200);
    expect(noHour.strength.support + noHour.strength.drain).toBe(9.5); // 시주 제외 9 + 얕은 뿌리 0.5
    expect(noHour.seun.stemGod).toBeTruthy();
    expect(noHour.stages).toHaveLength(3); // 시지 십이운성 없음
    // 대운은 연간·성별로 방향을 정해 생시 없이도 계산됨
    expect(noHour.wolun).toHaveLength(12);
  });

  it('격국·득령·통근·십이운성을 판정한다', () => {
    const r = reportFor();
    // 계유 일주 — 월지 술(戌) 정기 무(戊) → 癸 기준 정관 → 정관격
    expect(r.gyeokguk.name).toBe('정관격');
    expect(r.gyeokguk.god).toBe('정관');
    // 癸일간 술월 — 토 월, 나를 극하는 계절 → 실령
    expect(r.deukryeong.verdict).toBe('실령');
    // 지지 본기에 수 없음, 다만 연지 신금 지장간(무·임·경) 속 임수 = 얕은 뿌리 1
    expect(r.rooted.strong).toBe(0);
    expect(r.rooted.weak).toBe(1);
    // 십이운성 — 4자리, 유효 단계
    expect(r.stages).toHaveLength(4);
    // 계(음간) 유 → 사 단계 (계 장생 묘, 역행: 묘장생·인목욕·축관대·자건록·해제왕·술쇠·유병·신사·미묘·오절·사태·진양)
    expect(r.stages.find((s) => s.where === '일지')?.stage).toBe('병'); // 유 = 병
  });

  it('사주 안 천간의 합충을 판정한다 — 격합·인접합·일간 참여', () => {
    // 임신·경술·계유·을묘 — 월간 庚 × 시간 乙 = 을경합, 한 자리 건너 비인접(격합)
    const r = reportFor();
    expect(r.stemRelations).toHaveLength(1);
    expect(r.stemRelations[0]).toMatchObject({ kind: '합', name: '을경합', adjacent: false });
    expect(r.stemRelations[0]!.gods).toBe('정인×식신');
    expect(r.stemRelations[0]!.text).toContain('合絆');

    // 갑자·정축·을사·경진 — 일간 乙 × 시간 庚 = 을경합(인접·일간 참여) + 연간 甲 × 시간 庚 = 갑경충(비인접)
    const adj = reportFor(
      { year: 1985, month: 1, day: 6, hour: 7, minute: 0, calendar: 'solar', isLeapMonth: false, gender: 'male' },
      { ...profile, year: 1985, month: 1, day: 6, hour: 7, minute: 0 },
    );
    const hap = adj.stemRelations.find((s) => s.kind === '합');
    expect(hap).toMatchObject({ name: '을경합', adjacent: true, pair: '일간×시간' });
    expect(hap!.text).toContain('일간');
    const clash = adj.stemRelations.find((s) => s.kind === '충');
    expect(clash).toMatchObject({ name: '갑경충', adjacent: false });
    for (const s of adj.stemRelations) expect(s.text.length).toBeGreaterThan(30);
  });

  it('삼합·방합 3자 완성과 투간 격국을 판정한다', () => {
    // 을축 무인 갑술 경오 — 월지 인(무·병·갑) 중 여기 戊가 월간에 투간 → 편재격 / 인오술 화국 완성
    const r = reportFor(
      { year: 1985, month: 2, day: 4, hour: 11, minute: 0, calendar: 'solar', isLeapMonth: false, gender: 'male' },
      { ...profile, year: 1985, month: 2, day: 4, hour: 11, minute: 0 },
    );
    expect(r.gyeokguk.name).toBe('편재격');
    expect(r.gyeokguk.source).toContain('투간');
    const guk = r.formations.find((f) => f.kind === '삼합');
    expect(guk?.name).toContain('인오술');
    expect(guk?.element).toBe('화');
    expect(guk?.god).toBe('상관'); // 화국의 왕지 오(정화) — 갑일간 기준 상관
    expect(['용신운', '기신운', '중립운']).toContain(guk?.favor);
    // 여기 투간 — 갑자 병자 경자 임오: 월지 자(임·계)의 여기 壬이 시간에 투간 → 식신격
    const t = reportFor(
      { year: 1985, month: 1, day: 1, hour: 11, minute: 0, calendar: 'solar', isLeapMonth: false, gender: 'male' },
      { ...profile, year: 1985, month: 1, day: 1, hour: 11, minute: 0 },
    );
    expect(t.gyeokguk.name).toBe('식신격');
    expect(t.gyeokguk.source).toContain('시간');
  });

  it('올해 월운 12개월의 흐름과 길흉을 붙인다', () => {
    const r = reportFor();
    expect(r.wolun).toHaveLength(12);
    expect(r.wolun!.some((w) => w.current)).toBe(true); // 2026-10-23 → 10월
    for (const w of r.wolun!) {
      expect(['용신운', '기신운', '중립운']).toContain(w.favor);
      expect(w.stemGod).toBeTruthy();
    }
  });

  it('용신 보완법에 유리한 달·생활 습관·실전 개운법이 들어있다', () => {
    const r = reportFor();
    expect(r.yongsin.months.length).toBeGreaterThan(10);
    expect(r.yongsin.habit.length).toBeGreaterThan(10);
    expect(r.yongsin.practice.length).toBeGreaterThan(50);
  });

  it('운의 길흉이 용신과 갈린다 — 세운·대운에 용신운/기신운 판정', () => {
    const r = reportFor();
    expect(['용신운', '기신운', '중립운']).toContain(r.seun.favor);
    expect(r.seun.favorText.length).toBeGreaterThan(20);
    expect(r.daewoon?.current?.favor).toBeTruthy();
  });

  it('조후용신 — 태어난 계절이 요구하는 기운을 억부용신과 대조한다', () => {
    // 1992-10-24 술월 — 조후 압박이 약한 계절이라 조후 없음
    expect(reportFor().joho).toBeNull();
    // 1985-01-01 갑자 병자 경자 임오 — 자월 한겨울 → 조후 화
    const winter = reportFor(
      { year: 1985, month: 1, day: 1, hour: 11, minute: 0, calendar: 'solar', isLeapMonth: false, gender: 'male' },
      { ...profile, year: 1985, month: 1, day: 1, hour: 11, minute: 0 },
    );
    expect(winter.joho?.element).toBe('화');
    expect(winter.joho!.text.length).toBeGreaterThan(20);
    expect(typeof winter.joho!.sameAsYongsin).toBe('boolean');
    // 1985-02-04 인월 — 입춘 직후 잔한 → 조후 화
    const ichun = reportFor(
      { year: 1985, month: 2, day: 4, hour: 11, minute: 0, calendar: 'solar', isLeapMonth: false, gender: 'male' },
      { ...profile, year: 1985, month: 2, day: 4, hour: 11, minute: 0 },
    );
    expect(ichun.joho?.element).toBe('화');
  });

  it('천간 상극 — 합충 없는 천간의 극제를 판정한다', () => {
    // 을축 무인 갑술 경오 — 을극무(연간×월간)·갑극무(월간×일간) 인접 극 2건
    const r = reportFor(
      { year: 1985, month: 2, day: 4, hour: 11, minute: 0, calendar: 'solar', isLeapMonth: false, gender: 'male' },
      { ...profile, year: 1985, month: 2, day: 4, hour: 11, minute: 0 },
    );
    const geuk = r.stemRelations.filter((s) => s.kind === '극');
    expect(geuk).toHaveLength(2);
    expect(geuk.every((g) => g.adjacent)).toBe(true);
    expect(geuk.some((g) => g.name === '갑극무')).toBe(true);
    expect(geuk.some((g) => g.name === '을극무')).toBe(true);
  });

  it('파국 — 완성된 국의 멤버가 충을 받아 깨지는지 판정한다', () => {
    // 경신 무인 무오 임술 — 인오술 화국 완성 + 연지 신이 생지 인과 인신충
    const r = reportFor(
      { year: 1980, month: 2, day: 15, hour: 19, minute: 0, calendar: 'solar', isLeapMonth: false, gender: 'male' },
      { ...profile, year: 1980, month: 2, day: 15, hour: 19, minute: 0 },
    );
    const guk = r.formations.find((f) => f.name.includes('인오술'));
    expect(guk).toBeTruthy();
    expect(guk!.damage).toBeTruthy();
    expect(guk!.damage).toContain('신');
    // 픽스처 기준 — 인오술 완성 + 충하는 글자 없음 → damage null
    const clean = reportFor(
      { year: 1985, month: 2, day: 4, hour: 11, minute: 0, calendar: 'solar', isLeapMonth: false, gender: 'male' },
      { ...profile, year: 1985, month: 2, day: 4, hour: 11, minute: 0 },
    );
    expect(clean.formations.find((f) => f.name.includes('인오술'))!.damage).toBeNull();
  });

  it('십신 과다 — 넘치는 십신 그룹을 짚는다', () => {
    // 갑자 병자 경자 임오 — 식상 4개(상관 자×3 + 식신 임) 과다
    const r = reportFor(
      { year: 1985, month: 1, day: 1, hour: 11, minute: 0, calendar: 'solar', isLeapMonth: false, gender: 'male' },
      { ...profile, year: 1985, month: 1, day: 1, hour: 11, minute: 0 },
    );
    const excess = r.excessGodGroups.find((g) => g.group === '식상');
    expect(excess).toBeTruthy();
    expect(excess!.count).toBe(4);
    expect(excess!.text.length).toBeGreaterThan(20);
  });

  it('운의 지지가 원국 지지와 맺는 관계를 판정한다', () => {
    // 1992-10-24: 현재 대운 갑인(35세) — 인이 연지 신과 인신충
    const r = reportFor();
    const chung = r.luckRelations.find((l) => l.kind === '충' && l.source === '대운');
    expect(chung).toBeTruthy();
    expect(chung!.pair).toContain('신');
    // 올해 세운 병오 — 오가 월지 술과 삼합
    const hap = r.luckRelations.find((l) => l.source === '세운');
    expect(hap).toBeTruthy();
    expect(hap!.kind).toBe('삼합');
  });

  it('극단 판정은 종격류 특수격 후보로 표시한다', () => {
    // 갑자 병자 경자 임오 — 경금 일간에 돕는 기운 0 (모두 설기·극제) → 종식격 후보
    const r = reportFor(
      { year: 1985, month: 1, day: 1, hour: 11, minute: 0, calendar: 'solar', isLeapMonth: false, gender: 'male' },
      { ...profile, year: 1985, month: 1, day: 1, hour: 11, minute: 0 },
    );
    expect(r.strength.extreme).toBe('종격후보');
    expect(r.strength.extremeText).toContain('식상');
    // 일반 픽스처는 극단 아님
    expect(reportFor().strength.extreme).toBeNull();
  });

  it('운의 천간이 일간과 합·충을 이루는지 판정한다', () => {
    // 1985-01-01 경 일간 — 2025년 을사 세운: 천간 乙이 일간 庚과 을경합
    const r = reportFor(
      { year: 1985, month: 1, day: 1, hour: 11, minute: 0, calendar: 'solar', isLeapMonth: false, gender: 'male' },
      { ...profile, year: 1985, month: 1, day: 1, hour: 11, minute: 0 },
      '2025-06-15',
    );
    const stemRel = r.luckRelations.find((l) => l.kind === '간합' && l.source === '세운');
    expect(stemRel).toBeTruthy();
    expect(stemRel!.text).toContain('을경합');
  });

  it('현재 대운의 십이운성 — 그 시기의 인생 단계를 붙인다', () => {
    const r = reportFor();
    // 계 일간 대운 인지 — 음간 역행으로 목욕 단계
    expect(r.daewoon?.current?.stage).toBe('목욕');
    expect(r.daewoon?.current?.stageText.length).toBeGreaterThan(20);
  });

  it('같은 입력은 같은 리포트를 만든다 (결정성)', () => {
    expect(reportFor().summary).toBe(reportFor().summary);
  });
});

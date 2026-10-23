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
    expect(r.strength.support + r.strength.drain).toBe(12); // 천간4 + 지지(2+3+2+2) - 일간 제외
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

  it('생시가 없어도 리포트를 만들되 대운 장은 비운다', () => {
    const noHour = reportFor({ ...birth, hour: null, minute: null }, { ...profile, hour: null, minute: null });
    expect(noHour.summary.length).toBeGreaterThan(200);
    expect(noHour.strength.support + noHour.strength.drain).toBe(9); // 시주 가중치 3 제외
    expect(noHour.seun.stemGod).toBeTruthy();
  });

  it('격국·득령·통근·십이운성을 판정한다', () => {
    const r = reportFor();
    // 계유 일주 — 월지 술(戌) 정기 무(戊) → 癸 기준 정관 → 정관격
    expect(r.gyeokguk.name).toBe('정관격');
    expect(r.gyeokguk.god).toBe('정관');
    // 癸일간 술월 — 토 월, 나를 극하는 계절 → 실령
    expect(r.deukryeong.verdict).toBe('실령');
    // 지지에 수 오행 없음(신금·술토·유금·묘목) → 무근
    expect(r.rooted.count).toBe(0);
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

  it('같은 입력은 같은 리포트를 만든다 (결정성)', () => {
    expect(reportFor().summary).toBe(reportFor().summary);
  });
});

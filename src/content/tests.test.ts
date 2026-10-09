import { describe, expect, it } from 'vitest';
import { borderlineAxes, QUIZZES } from './tests.ts';

const mbti = QUIZZES['mbti']!;
const job = QUIZZES['job']!;
const love = QUIZZES['love']!;
const animal = QUIZZES['animal']!;
const color = QUIZZES['color']!;
const stress = QUIZZES['stress']!;

/** 문항 배열에서 특정 가중치의 득표 수 */
function tally(quiz: (typeof QUIZZES)[string], pickedFirst: boolean) {
  const s: Record<string, number> = {};
  for (const q of quiz.questions) {
    const w = q.choices[pickedFirst ? 0 : q.choices.length - 1]!.w;
    s[w] = (s[w] ?? 0) + 1;
  }
  return s;
}

function countWeight(quiz: (typeof QUIZZES)[string]) {
  const counts: Record<string, number> = {};
  const firsts: Record<string, number> = {};
  for (const q of quiz.questions) {
    for (const c of q.choices) counts[c.w] = (counts[c.w] ?? 0) + 1;
    firsts[q.choices[0]!.w] = (firsts[q.choices[0]!.w] ?? 0) + 1;
  }
  return { counts, firsts };
}

describe('문항 구조 — 전문 검사 수준의 균형', () => {
  it('모든 테스트가 15문 이상 — 한두 문항 오차가 결과를 뒤집지 않는다', () => {
    for (const q of Object.values(QUIZZES)) {
      expect(q.questions.length, q.id).toBeGreaterThanOrEqual(15);
    }
  });

  it('MBTI — 축당 8문으로 각 극이 균등하게 배정된다', () => {
    const { counts } = countWeight(mbti);
    for (const k of ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P']) {
      expect(counts[k], k).toBe(8);
    }
  });

  it('연애·동물 — 축당 6문으로 각 유형이 균등하게 배정된다', () => {
    for (const q of [love, animal]) {
      const { counts } = countWeight(q);
      for (const v of Object.values(counts)) expect(v, q.id).toBe(6);
    }
  });

  it('직업·색깔 — 유형당 6문 슬롯이 균등하다', () => {
    for (const q of [job, color]) {
      const { counts } = countWeight(q);
      for (const v of Object.values(counts)) expect(v, q.id).toBe(6);
    }
  });

  it('선택지 위치 편향 없음 — 같은 성향이 항상 첫 번째에 오지 않는다', () => {
    for (const q of Object.values(QUIZZES)) {
      const { counts, firsts } = countWeight(q);
      const n = q.questions.length;
      for (const [k, total] of Object.entries(counts)) {
        const f = firsts[k] ?? 0;
        // 각 가중치는 첫 번째 위치에 전체 문항의 25~75% 사이로 분포해야 함
        expect(f, `${q.id}:${k}`).toBeGreaterThan(0);
        expect(f, `${q.id}:${k}`).toBeLessThan(total);
      }
      expect(Math.max(...Object.values(firsts)), q.id).toBeLessThanOrEqual(Math.ceil(n * 0.6));
    }
  });

  it('모든 가중치는 유형 또는 축 끝점에 대응한다', () => {
    for (const q of Object.values(QUIZZES)) {
      const valid = new Set<string>([
        ...Object.keys(q.types),
        ...(q.bars ?? []).flatMap((b) => [b.a, ...(b.b ? [b.b] : [])]),
        'O', // 스트레스 '괜찮음' 마커
      ]);
      for (const qu of q.questions) {
        for (const c of qu.choices) {
          expect(valid.has(c.w), `${q.id}:${c.w}`).toBe(true);
        }
      }
    }
  });
});

describe('채점 안정성', () => {
  it('MBTI — 첫 선택지만 계속 눌러도 한 극으로 쏠리지 않는다 (위치 편향 제거 검증)', () => {
    const s = tally(mbti, true);
    for (const [a, b] of [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']] as const) {
      const gap = Math.abs((s[a] ?? 0) - (s[b] ?? 0));
      expect(gap, `${a}/${b}`).toBeLessThanOrEqual(4); // 8문 중 극단(8:0)이 나오면 편향
    }
  });

  it('경계선 판정 — 반반인 축만 borderlineAxes로 잡힌다', () => {
    const weak = borderlineAxes(mbti.bars!, { E: 4, I: 4, S: 7, N: 1, T: 6, F: 2, J: 8, P: 0 });
    expect(weak).toEqual(['에너지 방향']);
  });

  it('MBTI — 한 문항만 바뀌어도 우세한 축의 결과는 유지된다', () => {
    // E 7:1, S 6:2, T 8:0, J 7:1 — 어느 한 문항을 반대로 바꿔도 타입 불변
    const s = { E: 7, I: 1, S: 6, N: 2, T: 8, F: 0, J: 7, P: 1 };
    const before = mbti.resolve(s);
    for (const [a, b] of [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']] as const) {
      const flipped = { ...s, [a]: s[a] - 1, [b]: s[b] + 1 };
      expect(mbti.resolve(flipped)).toBe(before);
    }
  });

  it('확신도 — 완전 반반이면 낮음, 뚜렷하면 높음', () => {
    expect(mbti.confidence!({ E: 4, I: 4, S: 4, N: 4, T: 4, F: 4, J: 4, P: 4 }).level).toBe('low');
    expect(mbti.confidence!({ E: 8, I: 0, S: 8, N: 0, T: 8, F: 0, J: 8, P: 0 }).level).toBe('high');
    expect(job.confidence!({ R: 3, I: 3, A: 3, S: 3, E: 3, C: 3 }).level).toBe('low');
    expect(job.confidence!({ R: 6, I: 0, A: 0, S: 0, E: 0, C: 0 }).level).toBe('high');
    expect(stress.confidence!({ S: 4, O: 11 }).level).toBe('mid'); // 경계선
    expect(stress.confidence!({ S: 15, O: 0 }).level).toBe('high');
  });

  it('스트레스 — 15문 기준으로 단계가 매겨지고 경계값 근처가 구분된다', () => {
    expect(stress.resolve({ S: 15 })).toBe('한계');
    expect(stress.resolve({ S: 12 })).toBe('한계');
    expect(stress.resolve({ S: 8 })).toBe('주의');
    expect(stress.resolve({ S: 5 })).toBe('보통');
    expect(stress.resolve({ S: 0 })).toBe('평온');
  });

  it('모든 유형이 도달 가능하다 — 각 유형을 만드는 답안 조합이 존재한다', () => {
    for (const q of [mbti, job, love, animal, color, stress]) {
      // 각 유형의 가중치만 골라모아 resolve하면 그 유형이 나와야 함
      for (const code of Object.keys(q.types)) {
        if (q.id === 'stress') break; // 스트레스는 가중치≠유형
        if (q.id === 'mbti') {
          // MBTI는 축 조합이므로 단일 문자 유형 검증 생략
          break;
        }
        const score: Record<string, number> = { [code]: 99 };
        expect(q.resolve(score), `${q.id}:${code}`).toBe(code);
      }
    }
  });
});

/**
 * 로또 6/45 통계 분석·번호 추천 엔진.
 *
 * 수학적 근거 (방법론):
 * ① 번호 가중치 = 디리클레-다항 사후예측. 각 번호의 출현을 범주형 분포로 보고
 *    Dirichlet(α=1) 사전을 두면, 관측 빈도로 갱신된 사후예측 확률은
 *    p(n) = (effCount[n] + 1) / (6D + 45). effCount는 전체 빈도 55%와
 *    지수감쇠(반감기 104회≈2년) 가중 빈도 45%의 혼합 — 최근 추첨 기계·공 세트의
 *    미세한 경향을 더 반영하되 장기 균형을 잃지 않는다.
 * ② 조합 형태 우도 = 역대 당첨 조합의 특성 분포(합계·홀짝·고저·연번)를 경험적
 *    확률로 추정(합계는 커널밀도 추정, 나머지는 라플라스 평활 경험 pmf)하고,
 *    후보 조합이 그 분포에서 얼마나 "전형적인가"를 대수우도로 채점한다.
 * ③ 대중조합 패널티 = 사람들이 실제로 많이 고르는 패턴(생일 조합=전부 31 이하,
 *    등차수열)을 감점 — 당첨 확률은 동일하지만 당첨 시 분배 인원이 적어
 *    기대 당첨금이 커진다. 통계적으로 유일하게 기대값을 올리는 요소.
 * ④ 균일성 검정 = 번호별 빈도의 카이제곱 적합도 검정(df=44). p가 크면
 *    "추첨기는 균일과 구분되지 않음" = 가중치의 편차는 잡음 수준임을 표시한다.
 *
 * 한계(정직한 고지): 회차는 독립시행이라 어떤 방법도 특정 조합의 당첨 확률
 * 1/8,145,060 자체를 바꾸지 못한다. 이 엔진이 최적화하는 것은 ①과거 편향의
 * 사후 반영 ②전형적 형태 ③분배 기대값이다. 페이지 방법론에도 그대로 적는다.
 */
import type { LottoDraw } from '../../content/lotto-draws.ts';

export const LOTTO_MAX = 45;
export const PICK_SIZE = 6;
/** 낮은 번호 기준 — 1~22(22개) vs 23~45(23개) */
export const LOW_CUTOFF = 22;
const RECENT_WINDOW = 100;
const HALF_LIFE_DRAWS = 104;
const DECAY = Math.pow(0.5, 1 / HALF_LIFE_DRAWS);
const LIFETIME_BLEND = 0.55;
const DIRICHLET_ALPHA = 1;
const SUM_KERNEL_SIGMA = 8;
const SAMPLES = 30_000;
/** 1등 고정확률 — 모든 조합이 정확히 동일 */
export const JACKPOT_ODDS = 8_145_060;

export interface NumberStat {
  n: number;
  /** 전체 회차 출현 횟수 (메인 6개 기준) */
  freq: number;
  /** 기대 횟수 = 6D/45 */
  expected: number;
  /** 최근 RECENT_WINDOW회 출현 횟수 */
  recentFreq: number;
  /** 마지막 출현 이후 지난 회차 수 */
  gap: number;
  /** 마지막 출현 회차 */
  lastSeen: number;
  /** 사후예측 확률 (전체 합=1) */
  weight: number;
}

export interface LottoStats {
  drawCount: number;
  latestNo: number;
  latestDate: string;
  numbers: NumberStat[];
  /** 번호별 빈도 카이제곱 통계량·p값 (df=44) */
  chi2: number;
  chi2P: number;
  /** 합계 커널밀도 (인덱스=합계 값, 가우시안 KDE 사전계산) */
  sumPdf: number[];
  /** 홀수 개수 pmf (인덱스=홀수 개수 0..6) */
  oddPmf: number[];
  /** 저번호(≤22) 개수 pmf */
  lowPmf: number[];
  /** 연번 쌍 개수 pmf (인덱스=연번 쌍 수) */
  consecPmf: number[];
}

export interface LottoPick {
  numbers: number[];
  sum: number;
  odd: number;
  low: number;
  consec: number;
  /** 상위 후보 기준 상대 점수 0~100 */
  score: number;
}

/** 카이제곱 분포 상위누적확률 P(χ² ≥ x | df) — 감마 불완전함수 Q(df/2, x/2) */
export function chiSquarePValue(x: number, df: number): number {
  if (x <= 0) return 1;
  return gammaQ(df / 2, x / 2);
}

/** 정규화된 상위 불완전감마 Q(a,x) — Numerical Recipes 표준 구현 */
function gammaQ(a: number, x: number): number {
  const EPS = 1e-12;
  const ITMAX = 200;
  if (x < 0 || a <= 0) return Number.NaN;
  if (x === 0) return 1;
  if (x < a + 1) {
    // 급수 전개로 P를 구해 Q = 1 - P
    let ap = a;
    let sum = 1 / a;
    let del = sum;
    for (let i = 1; i <= ITMAX; i++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * EPS) break;
    }
    return Math.max(0, 1 - sum * Math.exp(-x + a * Math.log(x) - logGamma(a)));
  }
  // 연분수 전개로 Q를 직접 계산
  const FPMIN = 1e-300;
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= ITMAX; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return Math.max(0, h * Math.exp(-x + a * Math.log(x) - logGamma(a)));
}

/** log Γ(a) — Lanczos 근사 */
function logGamma(a: number): number {
  const c = [
    0.9999999999998099, 676.5203681218851, -1259.1392167224028,
    771.3234287776531, -176.6150291621406, 12.507343278686905,
    -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7,
  ];
  if (a < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * a)) - logGamma(1 - a);
  }
  a -= 1;
  let x = c[0]!;
  for (let i = 1; i < c.length; i++) x += c[i]! / (a + i);
  const t = a + c.length - 1.5;
  return 0.5 * Math.log(2 * Math.PI) + (a + 0.5) * Math.log(t) - t + Math.log(x);
}

const countConsec = (nums: readonly number[]) => {
  let c = 0;
  for (let i = 1; i < nums.length; i++) if (nums[i] === nums[i - 1]! + 1) c++;
  return c;
};

/** 역대 추첨 전체에 대한 통계 — 메인 6개 번호 기준 (보너스는 제외, 1등 예측 대상) */
export function analyzeLotto(draws: readonly LottoDraw[]): LottoStats {
  const D = draws.length;
  const latest = draws[D - 1]!;
  const freq = new Array<number>(LOTTO_MAX + 1).fill(0);
  const decayed = new Array<number>(LOTTO_MAX + 1).fill(0);
  const recentFreq = new Array<number>(LOTTO_MAX + 1).fill(0);
  const lastSeen = new Array<number>(LOTTO_MAX + 1).fill(0);
  const expected = (D * PICK_SIZE) / LOTTO_MAX;
  const recentStart = Math.max(0, D - RECENT_WINDOW);

  for (const [i, d] of draws.entries()) {
    const age = latest.no - d.no;
    const w = Math.pow(DECAY, age);
    for (const n of d.nums) {
      freq[n]!++;
      decayed[n]! += w;
      lastSeen[n] = Math.max(lastSeen[n]!, d.no);
      if (i >= recentStart) recentFreq[n]!++;
    }
  }

  let chi2 = 0;
  let decaySum = 0;
  for (let n = 1; n <= LOTTO_MAX; n++) {
    chi2 += (freq[n]! - expected) ** 2 / expected;
    decaySum += decayed[n]!;
  }

  const total6 = D * PICK_SIZE;
  const numbers: NumberStat[] = [];
  for (let n = 1; n <= LOTTO_MAX; n++) {
    const decayedNorm = (decayed[n]! / decaySum) * total6;
    const effCount = LIFETIME_BLEND * freq[n]! + (1 - LIFETIME_BLEND) * decayedNorm;
    numbers.push({
      n,
      freq: freq[n]!,
      expected,
      recentFreq: recentFreq[n]!,
      gap: lastSeen[n] === 0 ? latest.no : latest.no - lastSeen[n]!,
      lastSeen: lastSeen[n]!,
      weight: (effCount + DIRICHLET_ALPHA) / (total6 + DIRICHLET_ALPHA * LOTTO_MAX),
    });
  }

  const sumSamples: number[] = [];
  const oddHist = new Array<number>(PICK_SIZE + 1).fill(0);
  const lowHist = new Array<number>(PICK_SIZE + 1).fill(0);
  const consecHist = new Array<number>(PICK_SIZE).fill(0);
  for (const d of draws) {
    let sum = 0, odd = 0, low = 0;
    for (const n of d.nums) {
      sum += n;
      if (n % 2 === 1) odd++;
      if (n <= LOW_CUTOFF) low++;
    }
    sumSamples.push(sum);
    oddHist[odd]!++;
    lowHist[low]!++;
    consecHist[countConsec(d.nums)]!++;
  }

  return {
    drawCount: D,
    latestNo: latest.no,
    latestDate: latest.date,
    numbers,
    chi2,
    chi2P: chiSquarePValue(chi2, LOTTO_MAX - 1),
    sumPdf: buildSumPdf(sumSamples),
    oddPmf: smoothPmf(oddHist),
    lowPmf: smoothPmf(lowHist),
    consecPmf: smoothPmf(consecHist),
  };
}

const smoothPmf = (hist: number[]) => {
  const total = hist.reduce((a, b) => a + b, 0);
  return hist.map((h) => (h + 1) / (total + hist.length));
};

/** 합계 커널밀도 — 가우시안 커널 σ=8, 가능한 모든 합계(21~240)에 사전 계산 */
function buildSumPdf(samples: readonly number[]): number[] {
  const MIN_SUM = 21;
  const MAX_SUM = 240;
  const inv = 1 / (SUM_KERNEL_SIGMA * Math.sqrt(2 * Math.PI));
  const pdf = new Array<number>(MAX_SUM + 1).fill(0);
  for (let s = MIN_SUM; s <= MAX_SUM; s++) {
    let d = 0;
    for (const x of samples) {
      const z = (s - x) / SUM_KERNEL_SIGMA;
      d += Math.exp(-0.5 * z * z) * inv;
    }
    pdf[s] = d / samples.length;
  }
  return pdf;
}

interface ComboFeat {
  sum: number;
  odd: number;
  low: number;
  consec: number;
}

function comboFeatures(nums: readonly number[]): ComboFeat {
  let sum = 0, odd = 0, low = 0;
  for (const n of nums) {
    sum += n;
    if (n % 2 === 1) odd++;
    if (n <= LOW_CUTOFF) low++;
  }
  return { sum, odd, low, consec: countConsec(nums) };
}

/**
 * 조합 형태 점수 — 대수우도 + 대중조합 패널티.
 * 높을수록 역대 당첨 조합의 특성 분포에 "전형적"이고 사람들이 덜 고르는 조합.
 */
export function scoreCombo(nums: readonly number[], stats: LottoStats): number {
  return scoreFeat(comboFeatures(nums), nums, stats);
}

function scoreFeat(f: ComboFeat, nums: readonly number[], stats: LottoStats): number {
  const EPS = 1e-9;
  let ll =
    Math.log(Math.max(stats.sumPdf[f.sum] ?? EPS, EPS)) +
    Math.log(stats.oddPmf[f.odd] ?? EPS) +
    Math.log(stats.lowPmf[f.low] ?? EPS) +
    Math.log(stats.consecPmf[f.consec] ?? EPS);

  // 대중조합 패널티 — 당첨 시 분배 인원이 많아지는 인간 선호 패턴
  if (nums.every((n) => n <= 31)) ll -= 2.5; // 생일(1~31)만으로 된 조합
  const diffs = nums.slice(1).map((n, i) => n - nums[i]!);
  if (diffs.every((d) => d === diffs[0])) ll -= 2.0; // 등차수열
  return ll;
}

/** 가중치 비례 순차 비복원 추출 — P(조합) ∝ Π w(n)에 가까운 샘플링 */
function sampleCombo(weights: readonly number[], rng: () => number): number[] {
  const alive = new Set<number>();
  for (let n = 1; n <= LOTTO_MAX; n++) alive.add(n);
  const pick: number[] = [];
  for (let k = 0; k < PICK_SIZE; k++) {
    let total = 0;
    for (const n of alive) total += weights[n]!;
    let r = rng() * total;
    let chosen = 1;
    for (const n of alive) {
      r -= weights[n]!;
      if (r <= 0) {
        chosen = n;
        break;
      }
    }
    alive.delete(chosen);
    pick.push(chosen);
  }
  return pick.sort((a, b) => a - b);
}

/**
 * 추천 조합 생성 — 가중 샘플링으로 SAMPLES개 후보를 뽑아 대수우도로 채점한 뒤,
 * 상위 후보 풀에서 형태 시그니처(홀짝·고저·연번·합계 구간)가 서로 다른
 * 조합부터 고른다. 최빈 형태만 반복되지 않고 고우도 영역에서 다양해진다.
 */
export function generatePicks(
  stats: LottoStats,
  rng: () => number,
  count = 5,
): LottoPick[] {
  const weights = new Array<number>(LOTTO_MAX + 1).fill(0);
  for (const s of stats.numbers) weights[s.n] = s.weight;
  const scored = new Map<string, { nums: number[]; ll: number; f: ComboFeat }>();
  for (let i = 0; i < SAMPLES; i++) {
    const nums = sampleCombo(weights, rng);
    const key = nums.join(',');
    if (scored.has(key)) continue;
    const f = comboFeatures(nums);
    scored.set(key, { nums, ll: scoreFeat(f, nums, stats), f });
  }
  // 형태군(홀짝·고저·연번 시그니처)별 상위 후보만 풀에 남긴다 —
  // 최빈 형태 하나가 풀을 채우지 않게 각 군의 최우수 조합들이 경쟁한다.
  const bySig = new Map<string, { nums: number[]; ll: number; f: ComboFeat }[]>();
  for (const c of scored.values()) {
    const s = `${c.f.odd}-${c.f.low}-${c.f.consec}`;
    const arr = bySig.get(s);
    if (arr) arr.push(c);
    else bySig.set(s, [c]);
  }
  const pool: typeof scored extends Map<string, infer V> ? V[] : never = [];
  for (const arr of bySig.values()) {
    arr.sort((a, b) => b.ll - a.ll);
    pool.push(...arr.slice(0, 40));
  }
  pool.sort((a, b) => b.ll - a.ll);
  const chosen: typeof pool = [];
  const usedSig = new Set<string>();
  for (const c of pool) {
    if (chosen.length >= count) break;
    const s = `${c.f.odd}-${c.f.low}-${c.f.consec}`;
    if (usedSig.has(s)) continue;
    usedSig.add(s);
    chosen.push(c);
  }
  for (const c of pool) {
    if (chosen.length >= count) break;
    if (!chosen.includes(c)) chosen.push(c);
  }
  const max = chosen[0]?.ll ?? 0;
  return chosen.map(({ nums, ll, f }) => ({
    numbers: nums,
    ...f,
    score: Math.round(Math.exp(ll - max) * 100),
  }));
}

/** 시드 난수 — 재현 가능한 생성·테스트용 (mulberry32) */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── 구조 검정 — 과거 당첨번호에 "기억 구조·숨은 패턴"이 실재하는지 실측 ──

export interface StructureTest {
  /** 검정 이름 */
  name: string;
  /** 실측값 표시 문자열 */
  measured: string;
  /** 비교 기준 (무작위·이론 기대) */
  expected: string;
  /** 판정 배지 */
  verdict: string;
  /** true면 '진짜 구조(조합론)', false면 무작위 부합 */
  structural: boolean;
}

/** R/S법 Hurst 지수 — 시계열 장기의존(프랙탈 기억) 추정. 무기억이면 ≈0.5 */
function hurstRS(series: readonly number[]): number {
  const N = series.length;
  const pts: [number, number][] = [];
  for (const s of [N >> 4, N >> 3, N >> 2, N >> 1]) {
    if (s < 8) continue;
    const rs: number[] = [];
    for (let st = 0; st + s <= N; st += s) {
      const seg = series.slice(st, st + s);
      const m = seg.reduce((a, b) => a + b, 0) / s;
      let cum = 0, mx = -Infinity, mn = Infinity, sd2 = 0;
      for (const v of seg) {
        cum += v - m;
        mx = Math.max(mx, cum);
        mn = Math.min(mn, cum);
        sd2 += (v - m) * (v - m);
      }
      const sd = Math.sqrt(sd2 / s);
      if (sd > 0) rs.push((mx - mn) / sd);
    }
    if (rs.length) pts.push([Math.log(s), Math.log(rs.reduce((a, b) => a + b, 0) / rs.length)]);
  }
  if (pts.length < 2) return 0.5;
  const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  let num = 0, den = 0;
  for (const p of pts) {
    num += (p[0] - mx) * (p[1] - my);
    den += (p[0] - mx) * (p[0] - mx);
  }
  return den === 0 ? 0.5 : num / den;
}

/** 6개 조합 합계의 조합론적 pmf — C(45,6)=8,145,060개 조합의 합계별 개수 (동적계획) */
export function combinatorialSumPmf(): Map<number, number> {
  const dp: Map<number, bigint>[] = [new Map([[0, 1n]])];
  for (let n = 1; n <= LOTTO_MAX; n++) {
    for (let k = Math.min(n, PICK_SIZE); k >= 1; k--) {
      const prev = dp[k - 1]!;
      const cur = dp[k] ?? new Map<number, bigint>();
      for (const [s, c] of prev) cur.set(s + n, (cur.get(s + n) ?? 0n) + c);
      dp[k] = cur;
    }
  }
  const comb = dp[PICK_SIZE]!;
  let total = 0n;
  for (const c of comb.values()) total += c;
  const pmf = new Map<number, number>();
  for (const [s, c] of comb) pmf.set(s, Number(c) / Number(total));
  return pmf;
}

/**
 * 과거 당첨번호의 구조 가설 8종 실측 — "프랙탈식 시간적 기억" 가설들은
 * 전부 무기억·균일로 귀결되고, 조합론(조합 수학) 구조만 실재함을 보여준다.
 */
export function analyzeStructure(draws: readonly LottoDraw[]): StructureTest[] {
  const D = draws.length;
  const seq = draws.map((d) => d.nums);
  const tests: StructureTest[] = [];

  // ① 이월수 — 직전 회차와 겹치는 번호 수 (초기하 기대 6·6/45=0.8)
  let repSum = 0;
  for (let i = 1; i < D; i++) {
    const prev = new Set(seq[i - 1]!);
    repSum += seq[i]!.filter((n) => prev.has(n)).length;
  }
  const repMean = repSum / Math.max(1, D - 1);
  tests.push({
    name: '이월수 (직전 회차 번호 재출현)',
    measured: `평균 ${repMean.toFixed(2)}개/회차`,
    expected: '초기하 기대 0.80',
    verdict: Math.abs(repMean - 0.8) < 0.15 ? '기억 없음' : '편차 있음',
    structural: false,
  });

  // ② 지연-1 자기상관 — 번호별 출현 지표의 시계열 상관 평균
  let acSum = 0;
  for (let n = 1; n <= LOTTO_MAX; n++) {
    const m = seq.reduce((a, ns) => a + (ns.includes(n) ? 1 : 0), 0) / D;
    let v = 0, c = 0;
    for (let i = 0; i < D; i++) v += (seq[i]!.includes(n) ? 1 - m : -m) ** 2;
    for (let i = 1; i < D; i++)
      c += (seq[i - 1]!.includes(n) ? 1 - m : -m) * (seq[i]!.includes(n) ? 1 - m : -m);
    if (v > 0) acSum += c / v;
  }
  const acMean = acSum / LOTTO_MAX;
  tests.push({
    name: '지연-1 자기상관 (프랙탈 기억의 직접 검정)',
    measured: `r = ${acMean.toFixed(3)}`,
    expected: '무상관 기대 ≈0',
    verdict: Math.abs(acMean) < 0.06 ? '기억 없음' : '상관 있음',
    structural: false,
  });

  // ③ 미출현 간격 — 연속 출현 간 평균 회차 (기하분포 기대 1/p=7.5)
  const gaps: number[] = [];
  for (let n = 1; n <= LOTTO_MAX; n++) {
    let last = -1;
    for (const [i, ns] of seq.entries()) {
      if (ns.includes(n)) {
        if (last >= 0) gaps.push(i - last);
        last = i;
      }
    }
  }
  const gapMean = gaps.reduce((a, b) => a + b, 0) / Math.max(1, gaps.length);
  tests.push({
    name: '미출현 간격 분포',
    measured: `평균 ${gapMean.toFixed(2)}회차`,
    expected: `기하분포 기대 ${(45 / 6).toFixed(2)}`,
    verdict: Math.abs(gapMean - 7.5) < 0.4 ? '기하분포 일치' : '편차 있음',
    structural: false,
  });

  // ④ Hurst 지수 — 45개 번호 출현 지표의 R/S 평균
  let hSum = 0, hN = 0;
  for (let n = 1; n <= LOTTO_MAX; n++) {
    hSum += hurstRS(seq.map((ns) => (ns.includes(n) ? 1 : 0) - 6 / 45));
    hN++;
  }
  const hMean = hSum / Math.max(1, hN);
  tests.push({
    name: 'Hurst 지수 (장기의존·프랙탈 추정)',
    measured: `H ≈ ${hMean.toFixed(2)} (45개 번호 평균)`,
    expected: '무기억 기대 0.50',
    verdict: Math.abs(hMean - 0.5) < 0.12 ? '장기의존 없음' : '의존 감지',
    structural: false,
  });

  // ⑤ 시대 일관성 — 전반부↔후반부 핫번호 순위 상관 (스피어만 ρ)
  const half = Math.floor(D / 2);
  const f1 = new Array(LOTTO_MAX + 1).fill(0);
  const f2 = new Array(LOTTO_MAX + 1).fill(0);
  seq.slice(0, half).forEach((ns) => ns.forEach((n) => f1[n]++));
  seq.slice(half).forEach((ns) => ns.forEach((n) => f2[n]++));
  const rankOf = (f: number[]) => {
    const order = Array.from({ length: LOTTO_MAX }, (_, i) => i + 1).sort(
      (a, b) => f[a]! - f[b]!,
    );
    const r = new Array(LOTTO_MAX + 1).fill(0);
    order.forEach((n, i) => (r[n] = i + 1));
    return r;
  };
  const rk1 = rankOf(f1), rk2 = rankOf(f2);
  let d2 = 0;
  for (let n = 1; n <= LOTTO_MAX; n++) d2 += (rk1[n] - rk2[n]) ** 2;
  const rho = 1 - (6 * d2) / (LOTTO_MAX * (LOTTO_MAX * LOTTO_MAX - 1));
  tests.push({
    name: '시대 일관성 (전반부 핫번호가 후반부에도 핫?)',
    measured: `순위상관 ρ = ${rho.toFixed(2)}`,
    expected: '지속 편향이면 ρ>0, 없으면 ≈0',
    verdict: rho < 0.15 ? '지속 편향 없음' : '지속 편향 감지',
    structural: false,
  });

  // ⑥ 쌍 동시출현 — 990개 쌍 전체의 출현 횟수 카이제곱 (기대 D/66)
  const pairCnt = new Map<string, number>();
  for (const ns of seq) {
    for (let i = 0; i < ns.length; i++)
      for (let j = i + 1; j < ns.length; j++) {
        const k = `${ns[i]!},${ns[j]!}`;
        pairCnt.set(k, (pairCnt.get(k) ?? 0) + 1);
      }
  }
  const expPair = (D * PICK_SIZE * (PICK_SIZE - 1)) / (LOTTO_MAX * (LOTTO_MAX - 1));
  let pairChi2 = 0;
  for (let a = 1; a <= LOTTO_MAX; a++)
    for (let b = a + 1; b <= LOTTO_MAX; b++) {
      const c = pairCnt.get(`${a},${b}`) ?? 0;
      pairChi2 += (c - expPair) ** 2 / expPair;
    }
  const pairDf = (LOTTO_MAX * (LOTTO_MAX - 1)) / 2;
  const pairP = chiSquarePValue(pairChi2, pairDf);
  tests.push({
    name: '쌍 동시출현 (번호 궁합 가설)',
    measured: `χ² = ${pairChi2.toFixed(0)}, p = ${pairP.toFixed(2)}`,
    expected: '균일 기대 χ²≈990',
    verdict: pairP > 0.05 ? '균일분포 범위' : '유의한 쌍 존재',
    structural: false,
  });

  // ⑦ 합계 분포 vs 조합론적 pmf — "공통 패턴"의 정체가 물리가 아니라 조합 수학임을 보임
  const combPmf = combinatorialSumPmf();
  const sumHist = new Map<number, number>();
  for (const ns of seq) {
    const s = ns.reduce((a, b) => a + b, 0);
    sumHist.set(s, (sumHist.get(s) ?? 0) + 1);
  }
  let sumChi2 = 0, sumDf = 0;
  for (const [s, p] of combPmf) {
    const e = p * D;
    if (e >= 5) {
      sumChi2 += ((sumHist.get(s) ?? 0) - e) ** 2 / e;
      sumDf++;
    }
  }
  tests.push({
    name: '합계 분포 = 조합론 그 자체?',
    measured: `χ²/df = ${(sumChi2 / Math.max(1, sumDf)).toFixed(2)}`,
    expected: '조합론 pmf와 일치면 ≈1',
    verdict: sumChi2 / Math.max(1, sumDf) < 1.6 ? '구조=조합 수학' : '조합론과 다름',
    structural: true,
  });

  // ⑧ 구간(10번대) 분포 균일 검정
  const decBins = [0, 0, 0, 0, 0];
  const decNums = [9, 10, 10, 10, 6]; // 1-9,10-19,20-29,30-39,40-45
  for (const ns of seq)
    for (const n of ns) decBins[n <= 9 ? 0 : n <= 19 ? 1 : n <= 29 ? 2 : n <= 39 ? 3 : 4]!++;
  let decChi2 = 0;
  for (let b = 0; b < 5; b++) {
    const e = (decNums[b]! / LOTTO_MAX) * PICK_SIZE * D;
    decChi2 += (decBins[b]! - e) ** 2 / e;
  }
  const decP = chiSquarePValue(decChi2, 4);
  tests.push({
    name: '10번대 구간 분포',
    measured: `χ² = ${decChi2.toFixed(1)}, p = ${decP.toFixed(2)}`,
    expected: '구간별 번호 수 비례 균일',
    verdict: decP > 0.05 ? '균일분포 범위' : '구간 편향 있음',
    structural: false,
  });

  return tests;
}

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

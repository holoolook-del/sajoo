import { useMemo, useState } from 'react';
import { BackHome } from '../components/back-home.tsx';
import { ShareButton } from '../components/share-button.tsx';
import { SoundToggle } from '../components/sound-toggle.tsx';
import { LOTTO_DRAWS } from '../content/lotto-draws.ts';
import {
  analyzeLotto,
  generatePicks,
  JACKPOT_ODDS,
  mulberry32,
  type LottoPick,
} from '../features/lotto/analysis.ts';
import { playCardPick, playCardReveal } from '../lib/sound.ts';

/**
 * 로또 6/45 분석소 — 역대 실제 당첨번호 전체를 통계 분석해 다음 조합을 추천.
 * 분석 방법과 한계는 페이지 하단 방법론 카드에 그대로 적는다.
 */

/** 실제 로또 공 색 — 번호 구간별 공식 색상 */
function ballColor(n: number): string {
  if (n <= 10) return '#f2b720';
  if (n <= 20) return '#5aa0e6';
  if (n <= 30) return '#e05a4e';
  if (n <= 40) return '#9b9ba4';
  return '#7bc75a';
}

function Ball({ n, size = 'md' }: { n: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-6 w-6 text-[11px]' : 'h-9 w-9 text-sm';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white ${cls}`}
      style={{
        backgroundColor: ballColor(n),
        textShadow: '0 1px 2px rgba(0,0,0,0.55)',
        boxShadow: 'inset -2px -3px 6px rgba(0,0,0,0.25), inset 2px 3px 6px rgba(255,255,255,0.25)',
      }}
    >
      {n}
    </span>
  );
}

function StatRow({ label, items }: { label: string; items: { n: number; note: string }[] }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <p className="w-16 shrink-0 text-xs text-hanji/50">{label}</p>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        {items.map((it) => (
          <span key={it.n} className="flex items-center gap-1">
            <Ball n={it.n} size="sm" />
            <span className="text-[10px] text-hanji/50">{it.note}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function LottoPage() {
  const stats = useMemo(() => analyzeLotto(LOTTO_DRAWS), []);
  const [picks, setPicks] = useState<LottoPick[] | null>(null);

  const latest = LOTTO_DRAWS[LOTTO_DRAWS.length - 1]!;
  const recent = LOTTO_DRAWS.slice(-5).reverse();
  const byFreq = [...stats.numbers].sort((a, b) => b.freq - a.freq);
  const hot = byFreq.slice(0, 6);
  const cold = byFreq.slice(-6).reverse();
  const overdue = [...stats.numbers].sort((a, b) => b.gap - a.gap).slice(0, 6);
  const maxFreq = hot[0]!.freq;
  const uniform = stats.chi2P > 0.05;

  function generate() {
    playCardPick();
    const seed = crypto.getRandomValues(new Uint32Array(1))[0]!;
    setPicks(generatePicks(stats, mulberry32(seed)));
    setTimeout(() => playCardReveal(), 200);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 p-6">
      <header className="pt-6">
        <div className="flex items-center justify-between">
          <BackHome />
          <SoundToggle />
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gold">로또 6/45 분석소</h1>
        <p className="mt-1 text-sm text-hanji/60">
          1회~{stats.latestNo}회 실제 당첨번호 {stats.drawCount.toLocaleString()}개 전량 분석
        </p>
      </header>

      {/* 최근 당첨번호 */}
      <section className="rounded-xl border border-gold/50 bg-night-soft p-4">
        <p className="text-xs text-hanji/50">최근 추첨 — 제{latest.no}회 ({latest.date})</p>
        <div className="mt-2 flex items-center gap-1.5">
          {latest.nums.map((n) => (
            <Ball key={n} n={n} />
          ))}
          <span className="mx-1 text-hanji/40">+</span>
          <Ball n={latest.bonus} />
        </div>
        <div className="mt-3 space-y-1 border-t border-hanji/10 pt-2">
          {recent.slice(1).map((d) => (
            <div key={d.no} className="flex items-center gap-1.5">
              <p className="w-20 shrink-0 text-[10px] text-hanji/40">{d.no}회 {d.date.slice(5)}</p>
              {d.nums.map((n) => (
                <Ball key={n} n={n} size="sm" />
              ))}
              <span className="text-[10px] text-hanji/40">+{d.bonus}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 균일성 검정 */}
      <section className="rounded-xl border border-gold/30 bg-night-soft p-4">
        <p className="text-sm font-bold text-hanji">추첨기는 공정한가 — 카이제곱 검정</p>
        <p className="mt-1.5 text-xs leading-5 text-hanji/60">
          45개 번호 출현 빈도를 균일분포와 대조 (자유도 44):{' '}
          <span className="text-gold-bright">χ² = {stats.chi2.toFixed(1)}, p = {stats.chi2P.toFixed(2)}</span>
        </p>
        <p className="mt-1 text-xs leading-5 text-hanji/60">
          {uniform
            ? 'p > 0.05 — 번호별 출현 차이는 무작위 변동 범위 안. 추첨기에 통계적으로 잡히는 편향은 없습니다. 그래도 사후예측 모형은 미세한 관측 편차를 그대로 반영합니다.'
            : 'p ≤ 0.05 — 균일에서 벗어나는 번호가 감지됩니다. 사후예측 가중치가 이를 반영합니다.'}
        </p>
      </section>

      {/* 번호 통계 */}
      <section className="rounded-xl border border-gold/30 bg-night-soft p-4">
        <p className="text-sm font-bold text-hanji">번호별 출현 ({stats.drawCount}회 누적)</p>
        <StatRow label="핫 번호" items={hot.map((s) => ({ n: s.n, note: `${s.freq}회` }))} />
        <StatRow label="콜드 번호" items={cold.map((s) => ({ n: s.n, note: `${s.freq}회` }))} />
        <StatRow
          label="장기 미출현"
          items={overdue.map((s) => ({ n: s.n, note: `${s.gap}회째` }))}
        />
        {/* 45개 빈도 막대 */}
        <div className="mt-3 flex items-end gap-[3px] overflow-x-auto pb-1" aria-label="번호별 출현 빈도 그래프">
          {stats.numbers.map((s) => (
            <div key={s.n} className="flex w-[9px] shrink-0 flex-col items-center gap-0.5">
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: `${Math.max(4, (s.freq / maxFreq) * 56)}px`,
                  backgroundColor: ballColor(s.n),
                  opacity: 0.35 + 0.65 * (s.freq / maxFreq),
                }}
                title={`${s.n}번 — ${s.freq}회 (기대 ${s.expected.toFixed(0)}회)`}
              />
              <span className="text-[7px] text-hanji/40">{s.n}</span>
            </div>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-hanji/40">
          기대 출현 횟수 {hot[0]!.expected.toFixed(0)}회 — 막대가 길수록 많이 나온 번호
        </p>
      </section>

      {/* 추천 생성 */}
      <section className="rounded-xl border border-gold/50 bg-night-soft p-5">
        {!picks ? (
          <>
            <p className="text-sm font-bold text-hanji">통계 기반 추천 조합</p>
            <p className="mt-1 text-xs leading-5 text-hanji/60">
              사후예측 확률로 30,000개 후보를 뽑아 역대 당첨 형태와 가장 닮은 5조합을 고릅니다
            </p>
            <button
              type="button"
              onClick={generate}
              className="mt-4 w-full rounded-lg bg-gold py-3 font-bold text-night"
            >
              5조합 추천받기
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-hanji">추천 5조합</p>
              <button
                type="button"
                onClick={generate}
                className="rounded-lg border border-gold/40 px-3 py-1.5 text-xs text-gold-bright"
              >
                다시 뽑기
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {picks.map((p, i) => (
                <div key={p.numbers.join(',')} className="rounded-lg border border-hanji/10 p-3">
                  <div className="flex items-center gap-1.5">
                    <span className="mr-1 w-4 text-xs font-bold text-gold/60">{i + 1}</span>
                    {p.numbers.map((n) => (
                      <Ball key={n} n={n} />
                    ))}
                    <span className="ml-auto text-xs font-bold text-gold-bright">{p.score}</span>
                  </div>
                  <p className="mt-1.5 text-[10px] text-hanji/50">
                    합계 {p.sum} · 홀짝 {p.odd}:{6 - p.odd} · 저번호 {p.low}개 · 연번{' '}
                    {p.consec > 0 ? `${p.consec}쌍` : '없음'}
                  </p>
                </div>
              ))}
            </div>
            <ShareButton
              label="추천 번호 공유하기"
              text={`로또 6/45 통계 추천 (제${stats.latestNo + 1}회 대상)\n${picks
                .map((p, i) => `${i + 1}. ${p.numbers.join(', ')}`)
                .join('\n')}\n실제 당첨번호 ${stats.drawCount}회 분석으로 뽑았어요`}
            />
          </>
        )}
      </section>

      {/* 방법론 */}
      <section className="rounded-xl border border-gold/30 bg-night-soft p-4">
        <p className="text-sm font-bold text-hanji">어떻게 뽑았나 — 수학적 근거</p>
        <ol className="mt-2 list-decimal space-y-2 pl-4 text-xs leading-5 text-hanji/60">
          <li>
            <span className="font-bold text-hanji/80">실데이터</span> — 동행복권 로또 6/45
            제1회(2002-12-07)~제{stats.latestNo}회({stats.latestDate}) 당첨번호 전량.
            매주 추첨 후 자동 갱신됩니다.
          </li>
          <li>
            <span className="font-bold text-hanji/80">번호 가중치 — 베이지안 사후예측</span> —
            각 번호 출현을 범주형 분포로 보고 Dirichlet 사전을 두면 p(n) = (유효빈도+1)/(6×회차+45).
            유효빈도 = 전체 빈도 55% + 지수감쇠 가중 빈도 45% (반감기 104회 — 최근 추첨의
            미세 경향을 더 반영).
          </li>
          <li>
            <span className="font-bold text-hanji/80">조합 형태 우도</span> — 역대 당첨 조합의
            합계(가우시안 KDE)·홀짝비·고저비·연번 수의 경험 분포를 만들고, 3만 개 후보 중
            그 분포에서 대수우도가 높은 "전형적인" 조합을 고릅니다.
          </li>
          <li>
            <span className="font-bold text-hanji/80">대중조합 회피 (기대값↑)</span> —
            생일 번호(1~31)만의 조합, 등차수열처럼 사람들이 몰리는 패턴을 감점.
            당첨 확률은 같아도 당첨 시 나눠 가질 인원이 적어 기대 당첨금이 커지는
            유일한 수학적 이점입니다.
          </li>
          <li>
            <span className="font-bold text-hanji/80">형태 다양성</span> — 홀짝·고저·연번
            형태군별 최우수 조합을 하나씩 뽑아 5조합이 같은 패턴에 몰리지 않게 합니다.
          </li>
        </ol>
        <div className="mt-3 rounded-lg border border-gold/40 bg-gold/5 p-3">
          <p className="text-xs font-bold text-gold-bright">정직한 한계</p>
          <p className="mt-1 text-xs leading-5 text-hanji/60">
            추첨은 매회 독립시행 — 어떤 분석도 특정 조합의 1등 확률 1/
            {JACKPOT_ODDS.toLocaleString()} 자체를 바꾸지 못합니다. 위 카이제곱 검정이 보이듯
            과거 번호는 균일분포와 구분되지 않습니다. 이 추천은 "통계적으로 전형적이고
            남들과 덜 겹치는" 조합일 뿐 예언이 아니며, 재미와 참고용으로 봐주세요.
          </p>
        </div>
      </section>
    </main>
  );
}
